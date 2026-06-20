import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { initialSeats } from '../../data/seatConfig';
import { formatTime } from '../../utils/timeUtils';
import { format } from 'date-fns';
import type { PaymentMethod } from '../../types';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: '현금',
  transfer: '계좌이체',
  card: '카드',
};

function getSeatLabel(seatId: number): string {
  const seat = initialSeats.find((s) => s.id === seatId);
  return seat ? seat.label : `좌석${seatId}`;
}

export default function ReservationList() {
  const { state, dispatch } = useAppContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Sort reservations by reservationTime ascending
  const sortedReservations = [...state.reservations].sort(
    (a, b) =>
      new Date(a.reservationTime).getTime() -
      new Date(b.reservationTime).getTime()
  );

  const totalCount = sortedReservations.length;

  const handleConvert = (reservationId: string) => {
    const reservation = state.reservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    // Check if the seat is still occupied
    const seat = state.seats.find((s) => s.id === reservation.seatId);
    if (seat && seat.status === 'occupied') {
      setErrorMessage(
        `${getSeatLabel(reservation.seatId)} 좌석이 아직 이용 중입니다. 세션 종료 후 전환해주세요.`
      );
      return;
    }

    setErrorMessage(null);
    dispatch({ type: 'CONVERT_RESERVATION_TO_SESSION', reservationId });
  };

  const handleCancelClick = (reservationId: string) => {
    setConfirmingId(reservationId);
  };

  const handleCancelConfirm = () => {
    if (confirmingId) {
      dispatch({ type: 'CANCEL_RESERVATION', reservationId: confirmingId });
      setConfirmingId(null);
      setErrorMessage(null);
    }
  };

  const handleCancelDismiss = () => {
    setConfirmingId(null);
  };

  return (
    <div className="p-4">
      {/* Header with total count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">예약 목록</h2>
        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
          총 {totalCount}건
        </span>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {errorMessage}
          <button
            className="ml-2 text-red-900 font-bold"
            onClick={() => setErrorMessage(null)}
            aria-label="오류 메시지 닫기"
          >
            ×
          </button>
        </div>
      )}

      {/* Reservation list */}
      {sortedReservations.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          등록된 예약이 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedReservations.map((reservation) => (
            <li
              key={reservation.id}
              className="border rounded-lg p-3 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span className="font-medium text-gray-900">
                      {format(new Date(reservation.reservationTime), 'MM/dd')}{' '}
                      {formatTime(new Date(reservation.reservationTime))}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {getSeatLabel(reservation.seatId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate max-w-[120px]">
                      {reservation.guestName}
                    </span>
                    <span className="text-gray-500">
                      {paymentMethodLabels[reservation.paymentMethod]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => handleConvert(reservation.id)}
                    className="min-h-[44px] min-w-[44px] px-3 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 active:bg-green-700 transition-colors"
                  >
                    전환
                  </button>
                  <button
                    onClick={() => handleCancelClick(reservation.id)}
                    className="min-h-[44px] min-w-[44px] px-3 py-2 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 active:bg-red-700 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Confirmation dialog */}
      {confirmingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">예약 취소</h3>
            <p className="text-gray-600 mb-4">
              이 예약을 취소하시겠습니까? 취소 후에는 복원할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDismiss}
                className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                아니오
              </button>
              <button
                onClick={handleCancelConfirm}
                className="min-h-[44px] px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                예, 취소합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
