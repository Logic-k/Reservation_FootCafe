export type SeatZone = 'entrance' | 'window';
export type SeatStatus = 'available' | 'occupied' | 'reserved';
export type PaymentMethod = 'cash' | 'transfer' | 'card';
export type LogType = 'session_start' | 'session_end' | 'reservation_create' | 'reservation_cancel' | 'reservation_convert';

export interface Session {
  id: string;
  seatId: number;
  startTime: Date;
  estimatedEndTime: Date; // startTime + 40분
  isCompleted: boolean;
  groupId?: string; // 그룹 식별자 (같은 일행)
  groupName?: string; // 그룹명 (예: "커플A", "가족1")
}

export interface Reservation {
  id: string;
  seatId: number;
  reservationTime: Date;
  guestName: string;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  groupId?: string;
  groupName?: string;
  partySize?: number; // 인원수
}

export interface ActivityLog {
  id: string;
  type: LogType;
  seatId: number;
  seatLabel: string;
  guestName?: string;
  timestamp: Date;
  details: string;
}

export interface Seat {
  id: number; // 1-12
  zone: SeatZone; // 입구쪽 or 창가쪽
  label: string; // 표시명 (예: "입구1", "1번")
  status: SeatStatus;
  currentSession?: Session;
  reservation?: Reservation;
}
