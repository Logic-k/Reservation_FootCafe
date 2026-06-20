import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, DatabaseReference } from 'firebase/database';
import { AppState } from '../context/appReducer';

const firebaseConfig = {
  apiKey: "AIzaSyCT03FP2LecXlAjM1ETZ8BsbzjbYT-8kog",
  authDomain: "reservation-footcafe.firebaseapp.com",
  databaseURL: "https://reservation-footcafe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reservation-footcafe",
  storageBucket: "reservation-footcafe.firebasestorage.app",
  messagingSenderId: "655111252717",
  appId: "1:655111252717:web:4fff1e5bd486a0023f3ae4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const STATE_REF_PATH = 'appState';

/**
 * Firebase에 앱 상태를 저장
 */
export function saveStateToFirebase(state: AppState): void {
  const stateRef: DatabaseReference = ref(database, STATE_REF_PATH);
  // Date 객체는 JSON.stringify 시 ISO string으로 자동 변환됨
  const serialized = JSON.parse(JSON.stringify(state));
  set(stateRef, serialized).catch((error) => {
    console.error('Firebase 저장 실패:', error);
  });
}

/**
 * Firebase에서 실시간으로 상태 변경을 구독
 * 다른 기기에서 변경 시 콜백이 호출됨
 */
export function subscribeToState(callback: (state: AppState | null) => void): () => void {
  const stateRef: DatabaseReference = ref(database, STATE_REF_PATH);

  const unsubscribe = onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }

    try {
      // Date 문자열을 Date 객체로 역직렬화
      const state: AppState = {
        seats: (data.seats || []).map(deserializeSeat),
        sessions: (data.sessions || []).map(deserializeSession),
        reservations: (data.reservations || []).map(deserializeReservation),
        logs: (data.logs || []).map(deserializeLog),
      };
      callback(state);
    } catch (error) {
      console.error('Firebase 데이터 파싱 실패:', error);
      callback(null);
    }
  });

  return unsubscribe;
}

function deserializeSession(session: Record<string, unknown>) {
  return {
    ...session,
    startTime: new Date(session.startTime as string),
    estimatedEndTime: new Date(session.estimatedEndTime as string),
  };
}

function deserializeReservation(reservation: Record<string, unknown>) {
  return {
    ...reservation,
    reservationTime: new Date(reservation.reservationTime as string),
    createdAt: new Date(reservation.createdAt as string),
  };
}

function deserializeSeat(seat: Record<string, unknown>) {
  const result = { ...seat };
  if (seat.currentSession) {
    result.currentSession = deserializeSession(seat.currentSession as Record<string, unknown>);
  }
  if (seat.reservation) {
    result.reservation = deserializeReservation(seat.reservation as Record<string, unknown>);
  }
  return result;
}

function deserializeLog(log: Record<string, unknown>) {
  return {
    ...log,
    timestamp: new Date(log.timestamp as string),
  };
}
