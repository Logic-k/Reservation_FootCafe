import { addMinutes } from 'date-fns';
import type { Session, Reservation } from '../types';

const SESSION_DURATION_MINUTES = 40;
const BUFFER_MINUTES = 10;

export interface ConflictResult {
  hasConflict: boolean;
  conflictDetails?: {
    seatId: number;
    conflictingTimeRange: { start: Date; end: Date };
    occupantName?: string; // reservation holder name or "이용 중"
  };
}

/**
 * 두 시간 윈도우가 겹치는지 확인한다.
 * 겹침 정의: A의 시작 시간이 B의 종료 시간보다 이전이고, B의 시작 시간이 A의 종료 시간보다 이전
 */
export function timeWindowsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA < endB && startB < endA;
}

/**
 * 특정 좌석에 대해 제안된 시간 윈도우가 기존 세션/예약과 충돌하는지 확인한다.
 *
 * - Session의 점유 윈도우: startTime ~ estimatedEndTime (40분) + 10분 버퍼
 * - Reservation의 점유 윈도우: reservationTime ~ reservationTime + 40분 + 10분 버퍼
 * - 버퍼는 가용성 계산에 포함 (requirement 4)
 */
export function hasTimeConflict(
  seatId: number,
  proposedStart: Date,
  proposedEnd: Date,
  sessions: Session[],
  reservations: Reservation[],
  excludeReservationId?: string
): ConflictResult {
  // 1. 해당 좌석의 활성 세션과 겹침 확인
  const seatSessions = sessions.filter(
    (s) => s.seatId === seatId && !s.isCompleted
  );

  for (const session of seatSessions) {
    const sessionEnd = addMinutes(session.estimatedEndTime, BUFFER_MINUTES);

    if (timeWindowsOverlap(proposedStart, proposedEnd, session.startTime, sessionEnd)) {
      return {
        hasConflict: true,
        conflictDetails: {
          seatId,
          conflictingTimeRange: {
            start: session.startTime,
            end: session.estimatedEndTime,
          },
          occupantName: '이용 중',
        },
      };
    }
  }

  // 2. 해당 좌석의 다른 예약과 겹침 확인
  const seatReservations = reservations.filter(
    (r) => r.seatId === seatId && r.id !== excludeReservationId
  );

  for (const reservation of seatReservations) {
    const reservationEnd = addMinutes(
      reservation.reservationTime,
      SESSION_DURATION_MINUTES + BUFFER_MINUTES
    );

    if (
      timeWindowsOverlap(
        proposedStart,
        proposedEnd,
        reservation.reservationTime,
        reservationEnd
      )
    ) {
      return {
        hasConflict: true,
        conflictDetails: {
          seatId,
          conflictingTimeRange: {
            start: reservation.reservationTime,
            end: addMinutes(reservation.reservationTime, SESSION_DURATION_MINUTES),
          },
          occupantName: reservation.guestName,
        },
      };
    }
  }

  return { hasConflict: false };
}
