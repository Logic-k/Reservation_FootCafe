import type { Seat } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { getRemainingMinutes, isOvertime } from '../../utils/timeUtils';
import SeatCard from './SeatCard';

interface SeatMapProps {
  onSeatClick: (seat: Seat) => void;
}

/**
 * 전체 좌석 맵 컴포넌트.
 * 창가 1~8번 가로 배치 + 입구 1~4번 세로 배치 (구역 구분 없이 한 화면)
 */
function SeatMap({ onSeatClick }: SeatMapProps) {
  const { state } = useAppContext();
  const { seats } = state;

  // 종료 5분 이내이면서 아직 초과되지 않은 좌석 ID 집합
  const nearEndTimeSeats = new Set<number>(
    seats
      .filter((seat) => {
        if (seat.status !== 'occupied' || !seat.currentSession) return false;
        if (isOvertime(seat.currentSession)) return false;
        const remaining = getRemainingMinutes(seat.currentSession.estimatedEndTime);
        return remaining <= 5 && remaining > 0;
      })
      .map((seat) => seat.id)
  );

  // 창가 좌석 (id 1-8) - 가로 배치
  const windowSeats = seats.filter((seat) => seat.zone === 'window');

  // 입구 좌석 (id 9-12) - 세로 배치
  const entranceSeats = seats.filter((seat) => seat.zone === 'entrance');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-base font-semibold text-gray-700 mb-4">좌석 현황</h2>

      <div className="flex gap-6">
        {/* 입구 좌석: 왼쪽 세로 배치 (위에서부터 입구4→입구3→입구2→입구1) */}
        <div className="flex flex-col items-center">
          <p className="text-xs text-gray-500 mb-2">입구</p>
          <div className="flex flex-col gap-2">
            {[...entranceSeats].reverse().map((seat) => (
              <SeatCard
                key={seat.id}
                seat={seat}
                onClick={onSeatClick}
                isNearEndTime={nearEndTimeSeats.has(seat.id)}
              />
            ))}
          </div>
        </div>

        {/* 창가 좌석: 가로 1줄 (8개 연속) */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2 text-center">창가</p>
          <div className="grid grid-cols-8 gap-2">
            {windowSeats.map((seat) => (
              <SeatCard
                key={seat.id}
                seat={seat}
                onClick={onSeatClick}
                isNearEndTime={nearEndTimeSeats.has(seat.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeatMap;
