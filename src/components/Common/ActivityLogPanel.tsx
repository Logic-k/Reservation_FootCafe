import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { format } from 'date-fns';
import type { LogType } from '../../types';

const LOG_TYPE_LABELS: Record<LogType, string> = {
  session_start: '이용 시작',
  session_end: '이용 완료',
  reservation_create: '예약 등록',
  reservation_cancel: '예약 취소',
  reservation_convert: '예약 전환',
};

const LOG_TYPE_COLORS: Record<LogType, string> = {
  session_start: 'bg-green-100 text-green-700',
  session_end: 'bg-gray-100 text-gray-700',
  reservation_create: 'bg-blue-100 text-blue-700',
  reservation_cancel: 'bg-red-100 text-red-700',
  reservation_convert: 'bg-purple-100 text-purple-700',
};

export default function ActivityLogPanel() {
  const { state, dispatch } = useAppContext();
  const { logs } = state;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleDeleteLog = (logId: string) => {
    dispatch({ type: 'DELETE_LOG', logId });
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    dispatch({ type: 'CLEAR_LOGS' });
    setShowClearConfirm(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">이용 로그</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{logs.length}건</span>
          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {/* 전체 삭제 확인 */}
      {showClearConfirm && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-2">모든 로그를 삭제하시겠습니까?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="min-h-[36px] px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmClear}
              className="min-h-[36px] px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">기록된 로그가 없습니다.</p>
      ) : (
        <ul className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-3 p-3 border rounded-lg bg-white group"
            >
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${LOG_TYPE_COLORS[log.type]}`}
              >
                {LOG_TYPE_LABELS[log.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{log.details}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(log.timestamp), 'MM/dd HH:mm')}
                </p>
              </div>
              <button
                onClick={() => handleDeleteLog(log.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-sm p-1 transition-opacity"
                aria-label="로그 삭제"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
