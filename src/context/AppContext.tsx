import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, AppAction, appReducer, initialState } from './appReducer';
import { loadState, saveState } from '../utils/storage';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const loadedState = loadState();
  const [state, dispatch] = useReducer(appReducer, loadedState || initialState);

  useEffect(() => {
    saveState(state);
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
