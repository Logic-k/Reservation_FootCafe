import { AppState } from '../context/appReducer';
import { Seat, Session, Reservation, ActivityLog } from '../types';

const STORAGE_KEY = 'footcafe-state';

/**
 * Date 필드가 포함된 Session 객체의 날짜 문자열을 Date로 변환
 */
function deserializeSession(session: Record<string, unknown>): Session {
  return {
    ...session,
    startTime: new Date(session.startTime as string),
    estimatedEndTime: new Date(session.estimatedEndTime as string),
  } as Session;
}

/**
 * Date 필드가 포함된 Reservation 객체의 날짜 문자열을 Date로 변환
 */
function deserializeReservation(reservation: Record<string, unknown>): Reservation {
  return {
    ...reservation,
    reservationTime: new Date(reservation.reservationTime as string),
    createdAt: new Date(reservation.createdAt as string),
  } as Reservation;
}

/**
 * Seat 객체 내부의 currentSession, reservation Date 필드를 역직렬화
 */
function deserializeSeat(seat: Record<string, unknown>): Seat {
  const result = { ...seat } as Record<string, unknown>;

  if (seat.currentSession) {
    result.currentSession = deserializeSession(seat.currentSession as Record<string, unknown>);
  }

  if (seat.reservation) {
    result.reservation = deserializeReservation(seat.reservation as Record<string, unknown>);
  }

  return result as unknown as Seat;
}

/**
 * localStorage가 사용 가능한지 확인 (프라이빗 브라우징 등에서 불가할 수 있음)
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 앱 상태를 localStorage에 저장
 * Date 객체는 JSON.stringify 시 자동으로 ISO 문자열로 변환됨
 */
export function saveState(state: AppState): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // 저장 실패 시 (예: 용량 초과) 조용히 무시
  }
}

/**
 * localStorage에서 앱 상태를 복원
 * ISO 문자열을 Date 객체로 역직렬화하여 반환
 * localStorage가 비어있거나 데이터가 손상된 경우 null 반환
 */
export function loadState(): AppState | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized === null) {
      return null;
    }

    const parsed = JSON.parse(serialized);

    // 필수 필드 검증
    if (!parsed || !Array.isArray(parsed.seats) || !Array.isArray(parsed.sessions) || !Array.isArray(parsed.reservations)) {
      return null;
    }

    const state: AppState = {
      seats: parsed.seats.map((seat: Record<string, unknown>) => deserializeSeat(seat)),
      sessions: parsed.sessions.map((session: Record<string, unknown>) => deserializeSession(session)),
      reservations: parsed.reservations.map((reservation: Record<string, unknown>) => deserializeReservation(reservation)),
      logs: (parsed.logs || []).map((log: Record<string, unknown>): ActivityLog => ({
        ...log,
        timestamp: new Date(log.timestamp as string),
      } as ActivityLog)),
    };

    return state;
  } catch {
    // JSON 파싱 실패 또는 기타 오류 시 null 반환
    return null;
  }
}
