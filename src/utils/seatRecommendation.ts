import { addMinutes } from 'date-fns';
import type { Seat, SeatZone, Session, Reservation } from '../types';

const SESSION_DURATION_MINUTES = 40;
const BUFFER_MINUTES = 10;

export interface SeatRecommendation {
  seatId: number;
  zone: SeatZone;
  label: string;
  availableAt: Date;
  isCurrentlyAvailable: boolean;
}

/**
 * 각 좌석의 가장 빠른 가용 시간을 계산하여 추천 목록을 반환한다.
 *
 * 알고리즘:
 * 1. 각 좌석에 대해 가용 시간 계산:
 *    - 활성 세션 없고 예약 없음 → 현재 즉시 이용 가능
 *    - 이용 중: estimatedEndTime + 10분 버퍼 후 가용
 *    - 예약 있음: reservationTime + 40분 + 10분 버퍼 후 가용
 * 2. 가용 시간 이후 다른 예약과의 충돌 확인
 * 3. availableAt 기준 오름차순 정렬
 * 4. 모든 추천 좌석 반환
 */
export function getRecommendedSeats(
  seats: Seat[],
  sessions: Session[],
  reservations: Reservation[],
  now?: Date
): SeatRecommendation[] {
  const currentTime = now ?? new Date();

  const recommendations: SeatRecommendation[] = seats.map((seat) => {
    const availableAt = calculateSeatAvailability(
      seat.id,
      sessions,
      reservations,
      currentTime
    );

    return {
      seatId: seat.id,
      zone: seat.zone,
      label: seat.label,
      availableAt,
      isCurrentlyAvailable: availableAt <= currentTime,
    };
  });

  // availableAt 기준 오름차순 정렬 (현재 비어있는 좌석 우선)
  recommendations.sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime());

  return recommendations;
}

/**
 * 특정 좌석의 가용 시간을 계산한다.
 * 활성 세션과 예약을 모두 고려하여 가장 빠르게 이용 가능한 시간을 반환한다.
 */
function calculateSeatAvailability(
  seatId: number,
  sessions: Session[],
  reservations: Reservation[],
  now: Date
): Date {
  // 해당 좌석의 활성 세션 (완료되지 않은 세션)
  const activeSessions = sessions.filter(
    (s) => s.seatId === seatId && !s.isCompleted
  );

  // 해당 좌석의 예약 목록
  const seatReservations = reservations.filter((r) => r.seatId === seatId);

  // 현재 시간 이후의 모든 점유 윈도우를 수집
  const occupiedWindows = getOccupiedWindows(activeSessions, seatReservations);

  // 점유 윈도우가 없으면 즉시 이용 가능
  if (occupiedWindows.length === 0) {
    return now;
  }

  // 점유 윈도우를 시작 시간 기준 정렬
  occupiedWindows.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 현재 시간이 어떤 점유 윈도우에도 속하지 않으면 즉시 이용 가능한지 확인
  const currentlyOccupied = occupiedWindows.some(
    (w) => now >= w.start && now < w.end
  );

  if (!currentlyOccupied) {
    // 현재는 비어있지만, 향후 예약이 있을 수 있음
    // 현재 시점에서 이용 가능
    return now;
  }

  // 현재 점유 중인 윈도우의 종료 시간 찾기
  // 연속된 점유 윈도우를 고려하여 실제 가용 시간 계산
  return findEarliestGap(occupiedWindows, now);
}

interface TimeWindow {
  start: Date;
  end: Date;
}

/**
 * 활성 세션과 예약으로부터 점유 윈도우(버퍼 포함) 목록을 생성한다.
 */
function getOccupiedWindows(
  sessions: Session[],
  reservations: Reservation[]
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  // 세션의 점유 윈도우: startTime ~ estimatedEndTime + 10분 버퍼
  for (const session of sessions) {
    windows.push({
      start: session.startTime,
      end: addMinutes(session.estimatedEndTime, BUFFER_MINUTES),
    });
  }

  // 예약의 점유 윈도우: reservationTime ~ reservationTime + 40분 + 10분 버퍼
  for (const reservation of reservations) {
    windows.push({
      start: reservation.reservationTime,
      end: addMinutes(reservation.reservationTime, SESSION_DURATION_MINUTES + BUFFER_MINUTES),
    });
  }

  return windows;
}

/**
 * 점유 윈도우 목록에서 현재 시간 이후 가장 빠른 빈 시간을 찾는다.
 * 연속 점유 윈도우가 겹치는 경우를 처리한다.
 */
function findEarliestGap(windows: TimeWindow[], now: Date): Date {
  // 시작 시간 기준 정렬
  const sorted = [...windows].sort((a, b) => a.start.getTime() - b.start.getTime());

  // 현재 시간을 포함하거나 이후인 윈도우들을 병합하여 연속 점유 구간 파악
  let earliestAvailable = now;

  for (const window of sorted) {
    // 이미 종료된 윈도우는 무시
    if (window.end <= earliestAvailable) {
      continue;
    }

    // 현재 가용 시간이 이 윈도우의 시작 전이면 gap이 있음
    if (earliestAvailable < window.start) {
      break;
    }

    // 윈도우가 현재 가용 시간과 겹치면 종료 시간으로 업데이트
    earliestAvailable = window.end;
  }

  return earliestAvailable;
}
