import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { isOvertime, getOvertimeMinutes } from '../../utils/timeUtils';

/**
 * 세션 종료(초과) 알림 배너 컴포넌트.
 * 초과 중인 좌석이 있을 때 화면 상단에 경고 배너를 표시한다.
 */
export default function AlertBanner() {
  const { state } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  // 초과 중인 좌석 필터링
  const overtimeSeats = state.seats.filter(
    (seat) =>
      seat.status === 'occupied' &&
      seat.currentSession &&
      isOvertime(seat.currentSession)
  );

  // 초과 좌석 없거나 배너 닫은 경우 렌더링하지 않음
  if (overtimeSeats.length === 0 || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-sm mb-1">⚠️ 세션 초과 알림</p>
          <ul className="space-y-0.5">
            {overtimeSeats.map((seat) => {
              const minutes = getOvertimeMinutes(seat.currentSession!);
              return (
                <li key={seat.id} className="text-sm">
                  ⚠️ {seat.label} 좌석이 {minutes}분 초과되었습니다
                </li>
              );
            })}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-white hover:text-red-200 font-bold text-lg leading-none p-1"
          aria-label="알림 닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
