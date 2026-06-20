import { addMinutes, differenceInMinutes, format } from 'date-fns';
import type { Session } from '../types';

const SESSION_DURATION_MINUTES = 40;

/**
 * 시작 시간으로부터 세션 종료 시간을 계산한다 (시작 시간 + 40분).
 */
export function calculateEndTime(startTime: Date): Date {
  return addMinutes(startTime, SESSION_DURATION_MINUTES);
}

/**
 * Date를 HH:mm (24시간) 형식 문자열로 포맷한다.
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * 종료 시간까지 남은 분을 반환한다. 초과 시 음수를 반환한다.
 */
export function getRemainingMinutes(endTime: Date, now?: Date): number {
  const currentTime = now ?? new Date();
  return differenceInMinutes(endTime, currentTime);
}

/**
 * 현재 시간이 세션의 예상 종료 시간을 초과했는지 확인한다.
 */
export function isOvertime(session: Session, now?: Date): boolean {
  const currentTime = now ?? new Date();
  return currentTime > session.estimatedEndTime;
}

/**
 * 세션이 초과한 시간(분)을 반환한다. 초과하지 않았으면 0을 반환한다.
 */
export function getOvertimeMinutes(session: Session, now?: Date): number {
  const currentTime = now ?? new Date();
  if (currentTime <= session.estimatedEndTime) {
    return 0;
  }
  return differenceInMinutes(currentTime, session.estimatedEndTime);
}
