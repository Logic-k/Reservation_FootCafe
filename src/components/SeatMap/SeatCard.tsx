import type { Seat } from '../../types';
import {
  formatTime,
  getRemainingMinutes,
  isOvertime,
  getOvertimeMinutes,
} from '../../utils/timeUtils';

interface SeatCardProps {
  seat: Seat;
  onClick: (seat: Seat) => void;
  isNearEndTime: boolean;
}

/**
 * 개별 좌석 카드 컴포넌트.
 * 좌석 상태(비어있음/이용 중/예약됨)에 따라 색상과 정보를 다르게 표시한다.
 * 종료 5분 이내인 경우 빨간색 테두리 깜빡임 애니메이션을 적용한다.
 */
function SeatCard({ seat, onClick, isNearEndTime }: SeatCardProps) {
  const getStatusStyles = (): string => {
    switch (seat.status) {
      case 'available':
        return 'bg-green-100 border-green-200';
      case 'occupied':
        return 'bg-orange-100 border-orange-200';
      case 'reserved':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getNearEndTimeStyles = (): string => {
    if (isNearEndTime) {
      return 'border-red-500 border-2 animate-border-blink';
    }
    return 'border';
  };

  const truncateName = (name: string, maxLength: number = 10): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + '…';
  };

  const renderOccupiedContent = () => {
    if (!seat.currentSession) return null;

    const session = seat.currentSession;
    const overtime = isOvertime(session);

    if (overtime) {
      const overtimeMinutes = getOvertimeMinutes(session);
      return (
        <div className="text-xs mt-1 text-red-600 font-semibold">
          <span>초과 중</span>
          <span className="ml-1">+{overtimeMinutes}분</span>
        </div>
      );
    }

    const remaining = getRemainingMinutes(session.estimatedEndTime);
    return (
      <div className="text-xs mt-1 text-gray-700">
        <div>{formatTime(session.startTime)} - {formatTime(session.estimatedEndTime)}</div>
        <div className="text-orange-700 font-medium">잔여 {remaining}분</div>
      </div>
    );
  };

  const renderReservedContent = () => {
    if (!seat.reservation) return null;

    return (
      <div className="text-xs mt-1 text-blue-700 font-medium">
        {truncateName(seat.reservation.guestName)}
      </div>
    );
  };

  const renderStatusLabel = (): string => {
    switch (seat.status) {
      case 'available':
        return '비어있음';
      case 'occupied':
        return '이용 중';
      case 'reserved':
        return '예약됨';
      default:
        return '';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(seat)}
      className={`
        min-h-[44px] min-w-[44px] p-2 rounded-lg cursor-pointer
        flex flex-col items-center justify-center
        transition-colors duration-200
        ${getStatusStyles()}
        ${getNearEndTimeStyles()}
      `}
      aria-label={`좌석 ${seat.label} - ${renderStatusLabel()}`}
    >
      <span className="text-sm font-bold text-gray-800">{seat.label}</span>
      <span className="text-[10px] text-gray-500">{renderStatusLabel()}</span>

      {/* 그룹 표시 */}
      {seat.currentSession?.groupName && (
        <span className="text-[9px] px-1 rounded bg-purple-200 text-purple-700 font-medium mt-0.5">
          {seat.currentSession.groupName}
        </span>
      )}
      {seat.reservation?.groupName && (
        <span className="text-[9px] px-1 rounded bg-purple-200 text-purple-700 font-medium mt-0.5">
          {seat.reservation.groupName}
        </span>
      )}

      {seat.status === 'occupied' && renderOccupiedContent()}
      {seat.status === 'reserved' && renderReservedContent()}
    </button>
  );
}

export default SeatCard;
