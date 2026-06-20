import { Seat, Session, Reservation, ActivityLog } from '../types';
import { initialSeats } from '../data/seatConfig';

export interface AppState {
  seats: Seat[];
  sessions: Session[];
  reservations: Reservation[];
  logs: ActivityLog[];
}

export type AppAction =
  | { type: 'START_SESSION'; seatId: number }
  | { type: 'END_SESSION'; sessionId: string }
  | { type: 'START_GROUP_SESSION'; seatIds: number[]; groupName: string }
  | { type: 'END_GROUP_SESSION'; groupId: string }
  | { type: 'CREATE_RESERVATION'; reservation: Omit<Reservation, 'id' | 'createdAt'> }
  | { type: 'CREATE_GROUP_RESERVATION'; reservations: Omit<Reservation, 'id' | 'createdAt'>[] }
  | { type: 'CANCEL_RESERVATION'; reservationId: string }
  | { type: 'CONVERT_RESERVATION_TO_SESSION'; reservationId: string }
  | { type: 'TICK'; currentTime: Date }
  | { type: 'DELETE_LOG'; logId: string }
  | { type: 'CLEAR_LOGS' };

function generateId(): string {
  return crypto.randomUUID();
}

function getSeatLabel(seats: Seat[], seatId: number): string {
  const seat = seats.find((s) => s.id === seatId);
  return seat ? seat.label : `좌석${seatId}`;
}

export const initialState: AppState = {
  seats: initialSeats,
  sessions: [],
  reservations: [],
  logs: [],
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_SESSION': {
      const targetSeat = state.seats.find((seat) => seat.id === action.seatId);
      if (targetSeat && targetSeat.status === 'occupied') {
        return state;
      }

      const now = new Date();
      const estimatedEndTime = new Date(now.getTime() + 40 * 60 * 1000);

      const newSession: Session = {
        id: generateId(),
        seatId: action.seatId,
        startTime: now,
        estimatedEndTime,
        isCompleted: false,
      };

      const seats = state.seats.map((seat) =>
        seat.id === action.seatId
          ? { ...seat, status: 'occupied' as const, currentSession: newSession }
          : seat
      );

      const log: ActivityLog = {
        id: generateId(),
        type: 'session_start',
        seatId: action.seatId,
        seatLabel: getSeatLabel(state.seats, action.seatId),
        timestamp: now,
        details: `${getSeatLabel(state.seats, action.seatId)} 이용 시작`,
      };

      return {
        ...state,
        seats,
        sessions: [...state.sessions, newSession],
        logs: [log, ...state.logs],
      };
    }

    case 'END_SESSION': {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return state;

      // 그룹 세션인 경우 END_GROUP_SESSION으로 처리하도록 유도할 수도 있지만
      // 개별 종료도 허용
      const now = new Date();
      const sessions = state.sessions.map((s) =>
        s.id === action.sessionId ? { ...s, isCompleted: true } : s
      );

      const seats = state.seats.map((seat) =>
        seat.id === session.seatId
          ? { ...seat, status: 'available' as const, currentSession: undefined }
          : seat
      );

      const log: ActivityLog = {
        id: generateId(),
        type: 'session_end',
        seatId: session.seatId,
        seatLabel: getSeatLabel(state.seats, session.seatId),
        timestamp: now,
        details: `${getSeatLabel(state.seats, session.seatId)} 이용 완료${session.groupName ? ` [${session.groupName}]` : ''}`,
      };

      return {
        ...state,
        seats,
        sessions,
        logs: [log, ...state.logs],
      };
    }

    case 'START_GROUP_SESSION': {
      const { seatIds, groupName } = action;
      const now = new Date();
      const estimatedEndTime = new Date(now.getTime() + 40 * 60 * 1000);
      const groupId = generateId();

      // 모든 좌석이 이용 가능한지 확인
      const allAvailable = seatIds.every((seatId) => {
        const seat = state.seats.find((s) => s.id === seatId);
        return seat && seat.status !== 'occupied';
      });
      if (!allAvailable) return state;

      const newSessions: Session[] = seatIds.map((seatId) => ({
        id: generateId(),
        seatId,
        startTime: now,
        estimatedEndTime,
        isCompleted: false,
        groupId,
        groupName,
      }));

      const seats = state.seats.map((seat) => {
        const session = newSessions.find((s) => s.seatId === seat.id);
        if (session) {
          return { ...seat, status: 'occupied' as const, currentSession: session };
        }
        return seat;
      });

      const seatLabels = seatIds.map((id) => getSeatLabel(state.seats, id)).join(', ');
      const log: ActivityLog = {
        id: generateId(),
        type: 'session_start',
        seatId: seatIds[0],
        seatLabel: seatLabels,
        timestamp: now,
        details: `그룹 이용 시작 [${groupName}] - ${seatLabels} (${seatIds.length}인)`,
      };

      return {
        ...state,
        seats,
        sessions: [...state.sessions, ...newSessions],
        logs: [log, ...state.logs],
      };
    }

    case 'END_GROUP_SESSION': {
      const { groupId } = action;
      const now = new Date();

      const groupSessions = state.sessions.filter(
        (s) => s.groupId === groupId && !s.isCompleted
      );
      if (groupSessions.length === 0) return state;

      const sessions = state.sessions.map((s) =>
        s.groupId === groupId && !s.isCompleted ? { ...s, isCompleted: true } : s
      );

      const groupSeatIds = new Set(groupSessions.map((s) => s.seatId));
      const seats = state.seats.map((seat) =>
        groupSeatIds.has(seat.id)
          ? { ...seat, status: 'available' as const, currentSession: undefined }
          : seat
      );

      const seatLabels = groupSessions.map((s) => getSeatLabel(state.seats, s.seatId)).join(', ');
      const groupName = groupSessions[0]?.groupName || '그룹';
      const log: ActivityLog = {
        id: generateId(),
        type: 'session_end',
        seatId: groupSessions[0].seatId,
        seatLabel: seatLabels,
        timestamp: now,
        details: `그룹 이용 완료 [${groupName}] - ${seatLabels}`,
      };

      return {
        ...state,
        seats,
        sessions,
        logs: [log, ...state.logs],
      };
    }

    case 'CREATE_RESERVATION': {
      const now = new Date();
      const newReservation: Reservation = {
        ...action.reservation,
        id: generateId(),
        createdAt: now,
      };

      const seats = state.seats.map((seat) =>
        seat.id === newReservation.seatId
          ? { ...seat, status: 'reserved' as const, reservation: newReservation }
          : seat
      );

      const log: ActivityLog = {
        id: generateId(),
        type: 'reservation_create',
        seatId: newReservation.seatId,
        seatLabel: getSeatLabel(state.seats, newReservation.seatId),
        guestName: newReservation.guestName,
        timestamp: now,
        details: `${getSeatLabel(state.seats, newReservation.seatId)} 예약 등록 (${newReservation.guestName})`,
      };

      return {
        ...state,
        seats,
        reservations: [...state.reservations, newReservation],
        logs: [log, ...state.logs],
      };
    }

    case 'CREATE_GROUP_RESERVATION': {
      const now = new Date();
      const groupId = generateId();
      const newReservations: Reservation[] = action.reservations.map((r) => ({
        ...r,
        id: generateId(),
        createdAt: now,
        groupId,
      }));

      const reservationSeatIds = new Set(newReservations.map((r) => r.seatId));
      const seats = state.seats.map((seat) => {
        if (reservationSeatIds.has(seat.id)) {
          const reservation = newReservations.find((r) => r.seatId === seat.id)!;
          return { ...seat, status: 'reserved' as const, reservation };
        }
        return seat;
      });

      const seatLabels = newReservations.map((r) => getSeatLabel(state.seats, r.seatId)).join(', ');
      const groupName = newReservations[0]?.groupName || newReservations[0]?.guestName || '그룹';
      const log: ActivityLog = {
        id: generateId(),
        type: 'reservation_create',
        seatId: newReservations[0].seatId,
        seatLabel: seatLabels,
        guestName: newReservations[0].guestName,
        timestamp: now,
        details: `그룹 예약 등록 [${groupName}] - ${seatLabels} (${newReservations.length}인)`,
      };

      return {
        ...state,
        seats,
        reservations: [...state.reservations, ...newReservations],
        logs: [log, ...state.logs],
      };
    }

    case 'CANCEL_RESERVATION': {
      const reservation = state.reservations.find(
        (r) => r.id === action.reservationId
      );
      if (!reservation) return state;

      const now = new Date();
      const reservations = state.reservations.filter(
        (r) => r.id !== action.reservationId
      );

      const seats = state.seats.map((seat) =>
        seat.id === reservation.seatId
          ? { ...seat, status: 'available' as const, reservation: undefined }
          : seat
      );

      const log: ActivityLog = {
        id: generateId(),
        type: 'reservation_cancel',
        seatId: reservation.seatId,
        seatLabel: getSeatLabel(state.seats, reservation.seatId),
        guestName: reservation.guestName,
        timestamp: now,
        details: `${getSeatLabel(state.seats, reservation.seatId)} 예약 취소 (${reservation.guestName})`,
      };

      return {
        ...state,
        seats,
        reservations,
        logs: [log, ...state.logs],
      };
    }

    case 'CONVERT_RESERVATION_TO_SESSION': {
      const reservation = state.reservations.find(
        (r) => r.id === action.reservationId
      );
      if (!reservation) return state;

      const assignedSeat = state.seats.find((s) => s.id === reservation.seatId);
      if (assignedSeat && assignedSeat.status === 'occupied') {
        return state;
      }

      const now = new Date();
      const estimatedEndTime = new Date(now.getTime() + 40 * 60 * 1000);

      const newSession: Session = {
        id: generateId(),
        seatId: reservation.seatId,
        startTime: now,
        estimatedEndTime,
        isCompleted: false,
      };

      const reservations = state.reservations.filter(
        (r) => r.id !== action.reservationId
      );

      const seats = state.seats.map((seat) =>
        seat.id === reservation.seatId
          ? {
              ...seat,
              status: 'occupied' as const,
              currentSession: newSession,
              reservation: undefined,
            }
          : seat
      );

      const log: ActivityLog = {
        id: generateId(),
        type: 'reservation_convert',
        seatId: reservation.seatId,
        seatLabel: getSeatLabel(state.seats, reservation.seatId),
        guestName: reservation.guestName,
        timestamp: now,
        details: `${getSeatLabel(state.seats, reservation.seatId)} 예약→이용 전환 (${reservation.guestName})`,
      };

      return {
        ...state,
        seats,
        sessions: [...state.sessions, newSession],
        reservations,
        logs: [log, ...state.logs],
      };
    }

    case 'TICK': {
      const { currentTime } = action;

      const seats = state.seats.map((seat) => {
        if (seat.status === 'occupied' && seat.currentSession) {
          const endTime = new Date(seat.currentSession.estimatedEndTime).getTime();
          const now = currentTime.getTime();
          if (now > endTime) {
            return { ...seat };
          }
        }
        return seat;
      });

      return {
        ...state,
        seats,
      };
    }

    case 'DELETE_LOG': {
      return {
        ...state,
        logs: state.logs.filter((log) => log.id !== action.logId),
      };
    }

    case 'CLEAR_LOGS': {
      return {
        ...state,
        logs: [],
      };
    }

    default:
      return state;
  }
}
