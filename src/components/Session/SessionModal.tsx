import { useState } from 'react';
import type { Seat } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { formatTime, getRemainingMinutes, isOvertime, getOvertimeMinutes } from '../../utils/timeUtils';

interface SessionModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionModal({ seat, isOpen, onClose }: SessionModalProps) {
  const { state, dispatch } = useAppContext();
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupSeats, setSelectedGroupSeats] = useState<number[]>([]);

  if (!isOpen || !seat) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowEndConfirm(false);
    setIsGroupMode(false);
    setGroupName('');
    setSelectedGroupSeats([]);
    onClose();
  };

  const handleStartSession = () => {
    if (seat.status === 'occupied' && seat.currentSession) return;
    dispatch({ type: 'START_SESSION', seatId: seat.id });
    handleClose();
  };

  const handleStartGroupSession = () => {
    if (!groupName.trim()) return;
    const allSeats = [seat.id, ...selectedGroupSeats];
    dispatch({ type: 'START_GROUP_SESSION', seatIds: allSeats, groupName: groupName.trim() });
    handleClose();
  };

  const toggleGroupSeat = (seatId: number) => {
    setSelectedGroupSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const handleEndSession = () => {
    setShowEndConfirm(true);
  };

  const handleConfirmEnd = () => {
    if (seat.currentSession?.groupId) {
      dispatch({ type: 'END_GROUP_SESSION', groupId: seat.currentSession.groupId });
    } else if (seat.currentSession) {
      dispatch({ type: 'END_SESSION', sessionId: seat.currentSession.id });
    }
    setShowEndConfirm(false);
    handleClose();
  };

  const handleConfirmEndSingle = () => {
    if (seat.currentSession) {
      dispatch({ type: 'END_SESSION', sessionId: seat.currentSession.id });
    }
    setShowEndConfirm(false);
    handleClose();
  };

  const handleCancelEnd = () => {
    setShowEndConfirm(false);
  };

  // 그룹 선택 가능한 좌석 (현재 좌석 제외, 비어있는 좌석만)
  const availableForGroup = state.seats.filter(
    (s) => s.id !== seat.id && s.status === 'available'
  );

  const renderAvailableContent = () => {
    const now = new Date();

    if (isGroupMode) {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800">그룹 이용 시작</h2>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{seat.label}</span> + 함께 이용할 좌석 선택
          </div>

          {/* 그룹명 입력 */}
          <div>
            <label className="text-xs text-gray-500">그룹명</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="예: 커플A, 가족1"
              className="w-full min-h-[44px] mt-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              maxLength={10}
            />
          </div>

          {/* 좌석 선택 */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              추가 좌석 선택 ({selectedGroupSeats.length}개 선택됨)
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-[120px] overflow-y-auto">
              {availableForGroup.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleGroupSeat(s.id)}
                  className={`min-h-[36px] text-xs rounded border transition-colors ${
                    selectedGroupSeats.includes(s.id)
                      ? 'bg-purple-100 border-purple-400 text-purple-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {availableForGroup.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">이용 가능한 다른 좌석이 없습니다.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsGroupMode(false)}
              className="flex-1 min-h-[44px] px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              뒤로
            </button>
            <button
              onClick={handleStartGroupSession}
              disabled={!groupName.trim() || selectedGroupSeats.length === 0}
              className="flex-1 min-h-[44px] px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              그룹 시작 ({1 + selectedGroupSeats.length}인)
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">이용 시작</h2>
        <div className="text-center text-gray-600">
          <p className="text-base">
            <span className="font-medium">{seat.label}</span> 좌석
          </p>
          <p className="text-sm mt-1">현재 시간: {formatTime(now)}</p>
        </div>
        <button
          onClick={handleStartSession}
          className="w-full min-h-[44px] px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          1인 이용 시작
        </button>
        <button
          onClick={() => setIsGroupMode(true)}
          className="w-full min-h-[44px] px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors"
        >
          그룹 이용 시작 (2인 이상)
        </button>
      </div>
    );
  };

  const renderOccupiedContent = () => {
    const session = seat.currentSession;
    if (!session) return null;

    const now = new Date();
    const overtime = isOvertime(session, now);
    const remainingMin = getRemainingMinutes(session.estimatedEndTime, now);
    const overtimeMin = getOvertimeMinutes(session, now);

    // 같은 그룹의 다른 좌석들
    const groupMembers = session.groupId
      ? state.seats.filter(
          (s) => s.currentSession?.groupId === session.groupId && s.id !== seat.id
        )
      : [];

    if (showEndConfirm) {
      return (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">이용 종료 확인</h2>
          {session.groupId && groupMembers.length > 0 ? (
            <>
              <p className="text-center text-gray-600 text-sm">
                그룹 [{session.groupName}] 전체를 종료하시겠습니까?
              </p>
              <p className="text-xs text-gray-400">
                함께 종료: {groupMembers.map((s) => s.label).join(', ')}
              </p>
              <div className="flex w-full gap-2">
                <button
                  onClick={handleCancelEnd}
                  className="flex-1 min-h-[44px] px-3 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmEndSingle}
                  className="flex-1 min-h-[44px] px-3 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors text-sm"
                >
                  이것만
                </button>
                <button
                  onClick={handleConfirmEnd}
                  className="flex-1 min-h-[44px] px-3 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  전체 종료
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-gray-600">정말 종료하시겠습니까?</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={handleCancelEnd}
                  className="flex-1 min-h-[44px] px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmEnd}
                  className="flex-1 min-h-[44px] px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  종료
                </button>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">{seat.label} 이용 정보</h2>

        {session.groupName && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            그룹: {session.groupName}
            {groupMembers.length > 0 && ` (${groupMembers.map((s) => s.label).join(', ')} 포함)`}
          </span>
        )}

        <div className="w-full space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>시작 시간</span>
            <span className="font-medium">{formatTime(session.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>종료 예정</span>
            <span className="font-medium">{formatTime(session.estimatedEndTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>{overtime ? '초과 시간' : '남은 시간'}</span>
            <span className={`font-medium ${overtime ? 'text-red-600' : 'text-green-600'}`}>
              {overtime ? `${overtimeMin}분 초과` : `${remainingMin}분`}
            </span>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          className="w-full min-h-[44px] px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors"
        >
          이용 종료
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (seat.status === 'available') {
      return renderAvailableContent();
    }
    if (seat.status === 'occupied' && seat.currentSession) {
      return renderOccupiedContent();
    }
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-red-600">오류</h2>
        <p className="text-center text-gray-600">이미 사용 중인 좌석입니다</p>
        <button
          onClick={handleClose}
          className="w-full min-h-[44px] px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          닫기
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${seat.label} 좌석 모달`}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
