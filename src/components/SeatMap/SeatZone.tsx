import type { Seat } from '../../types';
import SeatCard from './SeatCard';

interface SeatZoneProps {
  title: string;
  seats: Seat[];
  onSeatClick: (seat: Seat) => void;
  nearEndTimeSeats: Set<number>;
}

/**
 * 구역별 좌석 그룹 컴포넌트.
 * 입구쪽/창가쪽 구역을 시각적으로 구분하여 좌석 카드를 그리드 레이아웃으로 표시한다.
 */
function SeatZone({ title, seats, onSeatClick, nearEndTimeSeats }: SeatZoneProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="text-base font-semibold text-gray-700 mb-3">{title}</h2>
      <div className="grid grid-cols-4 gap-2">
        {seats.map((seat) => (
          <SeatCard
            key={seat.id}
            seat={seat}
            onClick={onSeatClick}
            isNearEndTime={nearEndTimeSeats.has(seat.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default SeatZone;
