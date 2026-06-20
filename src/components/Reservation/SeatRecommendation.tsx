import { useAppContext } from '../../context/AppContext';
import { getRecommendedSeats, SeatRecommendation as SeatRecommendationType } from '../../utils/seatRecommendation';
import { formatTime } from '../../utils/timeUtils';

interface SeatRecommendationProps {
  onSelectSeat?: (seatId: number) => void;
}

const ZONE_LABELS: Record<string, string> = {
  entrance: '입구쪽',
  window: '창가쪽',
};

export default function SeatRecommendation({ onSelectSeat }: SeatRecommendationProps) {
  const { state } = useAppContext();
  const { seats, sessions, reservations } = state;

  const recommendations: SeatRecommendationType[] = getRecommendedSeats(
    seats,
    sessions,
    reservations
  );

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h3 className="text-sm font-bold text-gray-800 mb-3">추천 좌석</h3>

      {recommendations.length === 0 ? (
        <p className="text-sm text-gray-500">추천 가능한 좌석이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {recommendations.map((rec) => (
            <li key={rec.seatId}>
              <button
                type="button"
                onClick={() => onSelectSeat?.(rec.seatId)}
                className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{rec.label}</span>
                  <span className="text-xs text-gray-500">
                    {ZONE_LABELS[rec.zone] || rec.zone}
                  </span>
                </div>

                {rec.isCurrentlyAvailable ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    지금 이용 가능
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {formatTime(rec.availableAt)} 이후 이용 가능
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
