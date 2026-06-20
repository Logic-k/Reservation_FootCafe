import { Seat } from '../types';

export const initialSeats: Seat[] = [
  // 창가 (Window) - 가로 8줄 (1번~8번)
  { id: 1, zone: 'window', label: '1번', status: 'available' },
  { id: 2, zone: 'window', label: '2번', status: 'available' },
  { id: 3, zone: 'window', label: '3번', status: 'available' },
  { id: 4, zone: 'window', label: '4번', status: 'available' },
  { id: 5, zone: 'window', label: '5번', status: 'available' },
  { id: 6, zone: 'window', label: '6번', status: 'available' },
  { id: 7, zone: 'window', label: '7번', status: 'available' },
  { id: 8, zone: 'window', label: '8번', status: 'available' },

  // 입구 (Entrance) - 세로 4줄 (입구1~입구4)
  { id: 9, zone: 'entrance', label: '입구1', status: 'available' },
  { id: 10, zone: 'entrance', label: '입구2', status: 'available' },
  { id: 11, zone: 'entrance', label: '입구3', status: 'available' },
  { id: 12, zone: 'entrance', label: '입구4', status: 'available' },
];
