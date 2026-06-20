# Requirements Document

## Introduction

족욕카페 좌석 예약 관리 웹앱으로, 현재 수기로 운영 중인 임시예약 장부를 디지털화하여 좌석 겹침 방지와 예약 관리의 편리함을 높이는 시스템이다. 12개 좌석의 실시간 이용 현황을 파악하고, 임시예약 시 가장 빨리 비는 좌석을 자동으로 추천하여 배정할 수 있도록 한다.

## Glossary

- **Reservation_System**: 족욕카페 좌석 예약을 관리하는 웹 애플리케이션
- **Seat**: 족욕카페 내 12개 좌석 중 하나 (입구쪽 4개, 창가쪽 8개, 역ㄱ자 배치)
- **Seat_Map**: 12개 좌석의 배치와 현재 상태를 시각적으로 보여주는 화면
- **Session**: 한 명의 손님이 좌석을 이용하는 시간 단위 (기본 30분 + 전후 여유시간 포함 약 40분)
- **Temporary_Reservation**: 모든 좌석이 사용 중일 때 걸어두는 임시예약 기록
- **Staff**: 족욕카페 직원(알바)으로 시스템을 조작하는 사용자
- **Payment_Method**: 결제방식 (현금, 계좌이체, 카드 중 하나)
- **Seat_Zone**: 좌석이 위치한 구역 (입구쪽, 창가쪽)

## Requirements

### Requirement 1: 좌석 현황 표시

**User Story:** As a Staff, I want to 12개 좌석의 실시간 이용 현황을 한눈에 확인하고 싶다, so that 현재 비어있는 좌석과 사용 중인 좌석을 즉시 파악할 수 있다.

#### Acceptance Criteria

1. THE Reservation_System SHALL display all 12 Seats in a Seat_Map arranged in two groups—4 entrance-side seats and 8 window-side seats in reverse-ㄱ layout—with each Seat identified by a unique seat number (1–12) and visually distinguished by status using distinct background colors for each state ("비어있음", "이용 중", "예약됨")
2. WHEN a Seat is occupied, THE Reservation_System SHALL display that Seat as "이용 중" with the Session start time and estimated end time in HH:MM format, where estimated end time equals start time plus 40 minutes
3. WHEN a Seat is unoccupied and has no assigned Temporary_Reservation, THE Reservation_System SHALL display that Seat as "비어있음"
4. WHEN a Seat has an assigned Temporary_Reservation, THE Reservation_System SHALL display that Seat as "예약됨" with the reservation holder name truncated to a maximum of 10 displayed characters
5. IF an occupied Seat's Session exceeds the estimated end time, THEN THE Reservation_System SHALL display that Seat as "초과 중" with the elapsed overtime duration in minutes
6. THE Reservation_System SHALL update all Seat statuses on the Seat_Map within 5 seconds of any status change

### Requirement 2: 좌석 이용 등록

**User Story:** As a Staff, I want to 손님이 좌석에 앉을 때 이용 시작을 등록하고 싶다, so that 해당 좌석의 예상 종료 시간을 자동 계산할 수 있다.

#### Acceptance Criteria

1. WHEN a Staff registers a Session on a Seat, THE Reservation_System SHALL record the current system time as the start time, calculate the estimated end time as start time plus 40 minutes, and display the Seat with the start time and estimated end time to confirm successful registration
2. WHEN the estimated end time of a Session is reached, THE Reservation_System SHALL change the visual state of the corresponding Seat on the seat map to a distinct "시간 초과" indicator without requiring Staff interaction
3. WHEN a Staff marks a Session as completed, THE Reservation_System SHALL change the Seat status to "비어있음" and remove the session's start time and estimated end time from the Seat display
4. IF a Staff attempts to register a Session on a Seat that has an active Session, THEN THE Reservation_System SHALL display an error message indicating the Seat is already in use and SHALL NOT create a new Session
5. WHILE a Session remains active past its estimated end time, THE Reservation_System SHALL continue displaying the "시간 초과" indicator on the Seat until the Staff marks the Session as completed

### Requirement 3: 임시예약 등록

**User Story:** As a Staff, I want to 모든 좌석이 사용 중일 때 임시예약을 빠르게 등록하고 싶다, so that 대기 중인 손님의 정보를 정확하게 기록하고 관리할 수 있다.

#### Acceptance Criteria

1. WHEN a Staff creates a Temporary_Reservation, THE Reservation_System SHALL require the following fields: reservation time (date and time), guest name (nickname, 1 to 20 characters), Payment_Method, and assigned Seat
2. THE Reservation_System SHALL restrict Payment_Method selection to exactly three options: 현금, 계좌이체, 카드
3. WHEN a Temporary_Reservation is created, THE Reservation_System SHALL validate that the assigned Seat has no overlapping Session or other Temporary_Reservation within the 40-minute window starting at the reserved time
4. IF a Staff attempts to assign a Temporary_Reservation to a Seat that conflicts with an existing Session (including the 10-minute buffer) or another Temporary_Reservation within the 40-minute window, THEN THE Reservation_System SHALL display an overlap warning indicating the conflicting time range and prevent the assignment
5. IF a Staff submits the Temporary_Reservation form with any required field empty or with a reservation time that is not in the future, THEN THE Reservation_System SHALL display an error message indicating the invalid field and prevent submission
6. WHEN a Temporary_Reservation is successfully created, THE Reservation_System SHALL display a confirmation indicating the reserved Seat, reservation time, and guest name, and update the Seat status to "예약됨"

### Requirement 4: 가장 빨리 비는 좌석 자동 추천

**User Story:** As a Staff, I want to 가장 빨리 비는 좌석을 자동으로 파악하고 싶다, so that 예약 고객에게 최적의 좌석을 빠르게 배정할 수 있다.

#### Acceptance Criteria

1. WHEN a Staff initiates a Temporary_Reservation, THE Reservation_System SHALL calculate and display the earliest available Seat based on current Session end times and existing Temporary_Reservations, including the 10-minute buffer in availability calculations, showing for each recommended seat: seat number, zone, and estimated availability time in HH:MM format
2. THE Reservation_System SHALL sort recommended Seats by estimated availability time in ascending order, with currently-empty seats (availability time = now) shown first
3. WHEN multiple Seats have the same estimated availability time (same minute), THE Reservation_System SHALL display all of them for the Staff to choose
4. IF no Seat is available within 40 minutes, THEN THE Reservation_System SHALL display the next available time slot for each Seat with the estimated availability time

### Requirement 5: 예약 목록 관리

**User Story:** As a Staff, I want to 현재 등록된 임시예약 목록을 확인하고 관리하고 싶다, so that 예약 순서에 맞게 손님을 안내할 수 있다.

#### Acceptance Criteria

1. THE Reservation_System SHALL display all active Temporary_Reservations sorted by reservation time in ascending order, showing for each entry: reservation time, guest name, Payment_Method, and assigned Seat number
2. WHEN a Staff converts a Temporary_Reservation into a Session, THE Reservation_System SHALL create a new Session on the assigned Seat with the start time set to the current time, calculate the estimated end time as start time plus 40 minutes, and remove the Temporary_Reservation from the active list
3. IF a Staff attempts to convert a Temporary_Reservation while the assigned Seat is still occupied by an active Session, THEN THE Reservation_System SHALL display an error message indicating the Seat is still in use and prevent the conversion
4. WHEN a Staff cancels a Temporary_Reservation, THE Reservation_System SHALL request confirmation and upon confirmation remove the reservation from the active list and release the assigned Seat time slot for new reservations
5. THE Reservation_System SHALL display the total number of active Temporary_Reservations on the reservation list view

### Requirement 6: 겹침 방지

**User Story:** As a Staff, I want to 좌석 이용과 예약 간의 시간 겹침을 자동으로 방지하고 싶다, so that 동일 좌석에 대한 이중 배정 사고를 예방할 수 있다.

#### Acceptance Criteria

1. THE Reservation_System SHALL define a Session's occupied time window as the 40-minute period from the Session start time to the estimated end time (start time + 40 minutes)
2. THE Reservation_System SHALL define a Temporary_Reservation's occupied time window as the 40-minute period starting at the reserved time
3. THE Reservation_System SHALL prevent assigning two overlapping time windows to the same Seat, where overlap is defined as: window A overlaps window B if A's start time is before B's end time AND B's start time is before A's end time
4. WHEN a conflict is detected during Session registration or Temporary_Reservation creation, THE Reservation_System SHALL display the specific conflict details including the conflicting Seat number, conflicting time range, and the existing occupant or reservation holder name, and SHALL NOT proceed with the assignment
5. THE Reservation_System SHALL perform the conflict check at the moment of assignment attempt using the current state of all active Sessions and Temporary_Reservations
6. IF a conflict is detected and the assignment is rejected, THEN THE Reservation_System SHALL retain the form data so the Staff can modify only the conflicting field without re-entering all information
