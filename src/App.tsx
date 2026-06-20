import { useState, useEffect } from 'react';
import type { Seat } from './types';
import { useTimer } from './hooks/useTimer';
import SeatMap from './components/SeatMap/SeatMap';
import ReservationForm from './components/Reservation/ReservationForm';
import ReservationList from './components/Reservation/ReservationList';
import SeatRecommendation from './components/Reservation/SeatRecommendation';
import SessionModal from './components/Session/SessionModal';
import AlertBanner from './components/Common/AlertBanner';
import ActivityLogPanel from './components/Common/ActivityLogPanel';

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

type TabId = 'seats' | 'reserve' | 'reservations' | 'logs';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'seats', label: '좌석현황' },
  { id: 'reserve', label: '예약등록' },
  { id: 'reservations', label: '예약목록' },
  { id: 'logs', label: '이용로그' },
];

/**
 * 메인 레이아웃 컴포넌트.
 */
function AppLayout() {
  useTimer();
  const clock = useLiveClock();

  const [activeTab, setActiveTab] = useState<TabId>('seats');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSeat(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'seats':
        return <SeatMap onSeatClick={handleSeatClick} />;
      case 'reserve':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200">
              <ReservationForm />
            </div>
            <div className="bg-white rounded-xl border border-gray-200">
              <SeatRecommendation />
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <ReservationList />
          </div>
        );
      case 'logs':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <ActivityLogPanel />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <AlertBanner />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">
            족욕카페 좌석 예약 관리
          </h1>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 tabular-nums">
              {clock.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <div className="text-xs text-gray-500">
              {clock.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-h-[44px] py-3 text-sm font-medium text-center transition-colors
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        {renderTabContent()}
      </main>

      {/* SessionModal */}
      <SessionModal
        seat={selectedSeat}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

function App() {
  return <AppLayout />;
}

export default App;
