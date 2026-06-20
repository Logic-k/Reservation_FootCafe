# Design Document

## Overview

족욕카페 좌석 예약 관리 웹앱의 기술 설계 문서이다. React 기반 SPA로 구현하며, 로컬 상태 관리를 통해 12개 좌석의 실시간 현황 및 임시예약을 관리한다. 서버 없이 브라우저 로컬 스토리지를 활용하여 데이터를 유지하는 경량 솔루션으로 설계한다.

## Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Data Persistence**: localStorage
- **Time Handling**: date-fns

### Component Architecture

```
App
├── SeatMap (좌석 배치도)
│   ├── SeatZone (구역: 입구쪽/창가쪽)
│   │   └── SeatCard (개별 좌석 카드)
├── ReservationPanel (예약 관리 패널)
│   ├── ReservationForm (예약 등록 폼)
│   ├── ReservationList (예약 목록)
│   └── SeatRecommendation (좌석 추천)
├── SessionModal (이용 등록 모달)
└── AlertBanner (종료 알림 배너)
```

### Data Models

```typescript
type SeatZone = 'entrance' | 'window';
type SeatStatus = 'available' | 'occupied' | 'reserved';
type PaymentMethod = 'cash' | 'transfer' | 'card';

interface Seat {
  id: number;           // 1-12
  zone: SeatZone;      // 입구쪽 or 창가쪽
  label: string;       // 표시명 (예: "입구1", "창가3")
  status: SeatStatus;
  currentSession?: Session;
  reservation?: Reservation;
}

interface Session {
  id: string;
  seatId: number;
  startTime: Date;
  estimatedEndTime: Date;  // startTime + 40분
  isCompleted: boolean;
}

interface Reservation {
  id: string;
  seatId: number;
  reservationTime: Date;
  guestName: string;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}
```

### State Management

```typescript
interface AppState {
  seats: Seat[];
  sessions: Session[];
  reservations: Reservation[];
}

type AppAction =
  | { type: 'START_SESSION'; seatId: number }
  | { type: 'END_SESSION'; sessionId: string }
  | { type: 'CREATE_RESERVATION'; reservation: Omit<Reservation, 'id' | 'createdAt'> }
  | { type: 'CANCEL_RESERVATION'; reservationId: string }
  | { type: 'CONVERT_RESERVATION_TO_SESSION'; reservationId: string }
  | { type: 'TICK'; currentTime: Date };  // 1분 간격 타이머로 상태 갱신
```

## Conflict Detection Logic

### Core Algorithm

```typescript
function hasTimeConflict(
  seatId: number,
  proposedStart: Date,
  proposedEnd: Date,
  sessions: Session[],
  reservations: Reservation[]
): ConflictResult {
  // 1. 해당 좌석의 활성 세션과 겹침 확인
  // 2. 해당 좌석의 다른 예약과 겹침 확인
  // 3. 40분 타임 윈도우(10분 버퍼 포함) 적용
}
```

### Seat Recommendation Algorithm

```typescript
function getRecommendedSeats(
  sessions: Session[],
  reservations: Reservation[]
): SeatRecommendation[] {
  // 1. 각 좌석의 예상 비는 시간 계산
  // 2. 다른 예약과의 충돌 제외
  // 3. 비는 시간 기준 오름차순 정렬
  // 4. 동일 시간 좌석은 모두 표시
}
```

## UI/UX Design

### Seat Map Layout

역ㄱ자 배치를 반영한 그리드 레이아웃:

```
[창가쪽]
┌─────────────────────────┐
│ 창5  창6  창7  창8      │  ← 상단 가로줄 (4석)
│                         │
│ 창1                     │  ← 좌측 세로줄 (4석)
│ 창2                     │
│ 창3                     │
│ 창4                     │
└─────────────────────────┘

[입구쪽]
┌─────────────────────────┐
│ 입1  입2  입3  입4      │  ← 입구쪽 (4석)
└─────────────────────────┘
```

### Color Coding

- **비어있음**: 초록색 배경
- **이용 중**: 주황색 배경 (남은 시간 표시)
- **예약됨**: 파란색 배경 (예약자명 표시)
- **종료 임박** (5분 이내): 빨간색 테두리 깜빡임

### Mobile-First Design

- 태블릿/스마트폰에서 빠르게 조작 가능하도록 터치 친화적 UI
- 최소 44px 터치 타겟 크기
- 좌석 카드 탭으로 빠른 액션 메뉴 접근

## Data Persistence Strategy

- 모든 상태 변경 시 localStorage에 자동 저장
- 앱 로드 시 localStorage에서 상태 복원
- Date 객체는 ISO 문자열로 직렬화/역직렬화

## Timer & Notification

- 1분 간격 setInterval로 세션 상태 갱신
- 세션 종료 5분 전 시각적 알림 (색상 변경 + 깜빡임)
- 세션 종료 시 알림 배너 표시

## File Structure

```
src/
├── components/
│   ├── SeatMap/
│   │   ├── SeatMap.tsx
│   │   ├── SeatZone.tsx
│   │   └── SeatCard.tsx
│   ├── Reservation/
│   │   ├── ReservationForm.tsx
│   │   ├── ReservationList.tsx
│   │   └── SeatRecommendation.tsx
│   ├── Session/
│   │   └── SessionModal.tsx
│   └── Common/
│       └── AlertBanner.tsx
├── context/
│   ├── AppContext.tsx
│   └── appReducer.ts
├── utils/
│   ├── conflictDetection.ts
│   ├── seatRecommendation.ts
│   ├── timeUtils.ts
│   └── storage.ts
├── types/
│   └── index.ts
├── data/
│   └── seatConfig.ts
├── App.tsx
└── main.tsx
```
