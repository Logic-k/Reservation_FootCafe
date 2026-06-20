import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState, AppAction, appReducer, initialState } from './appReducer';
import { saveStateToFirebase, subscribeToState } from '../utils/firebase';
import { loadState, saveState } from '../utils/storage';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Firebase에서 받은 상태를 주입하기 위한 특수 액션
type InternalAction = AppAction | { type: '__SYNC_FROM_FIREBASE'; state: AppState };

function internalReducer(state: AppState, action: InternalAction): AppState {
  if (action.type === '__SYNC_FROM_FIREBASE') {
    return action.state;
  }
  return appReducer(state, action as AppAction);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // localStorage에서 초기 상태 로드 (Firebase 연결 전 즉시 표시용)
  const loadedState = loadState();
  const [state, rawDispatch] = useReducer(internalReducer, loadedState || initialState);

  // Firebase로부터의 업데이트인지 로컬 액션인지 구분
  const isRemoteUpdate = useRef(false);
  const isInitialized = useRef(false);

  // 사용자 dispatch: 로컬 액션 실행 후 Firebase에 저장
  const dispatch: React.Dispatch<AppAction> = (action: AppAction) => {
    isRemoteUpdate.current = false;
    rawDispatch(action);
  };

  // Firebase 구독: 다른 기기에서 변경 시 로컬 상태 업데이트
  useEffect(() => {
    const unsubscribe = subscribeToState((remoteState) => {
      if (remoteState && isInitialized.current) {
        isRemoteUpdate.current = true;
        rawDispatch({ type: '__SYNC_FROM_FIREBASE', state: remoteState });
      }
      if (!isInitialized.current) {
        isInitialized.current = true;
        // 첫 로드 시 Firebase에 데이터가 있으면 그걸 사용
        if (remoteState) {
          isRemoteUpdate.current = true;
          rawDispatch({ type: '__SYNC_FROM_FIREBASE', state: remoteState });
        }
      }
    });

    return unsubscribe;
  }, []);

  // 상태 변경 시 Firebase + localStorage에 저장
  useEffect(() => {
    // localStorage는 항상 저장 (오프라인 캐시)
    saveState(state);

    // Firebase는 로컬 액션일 때만 저장 (무한루프 방지)
    if (!isRemoteUpdate.current) {
      saveStateToFirebase(state);
    }
    isRemoteUpdate.current = false;
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
