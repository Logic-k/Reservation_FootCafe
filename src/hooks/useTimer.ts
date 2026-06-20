import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * 1분 간격으로 TICK 액션을 디스패치하여 세션 상태를 자동 갱신하는 타이머 훅.
 * AppProvider 내부에서 한 번만 호출되어야 한다.
 */
export function useTimer(): void {
  const { dispatch } = useAppContext();

  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'TICK', currentTime: new Date() });
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch]);
}
