# Implementation Plan

## Overview

족욕카페 좌석 예약 관리 웹앱 구현. React + TypeScript + Vite 기반 SPA로, 12개 좌석의 실시간 현황 관리 및 임시예약 기능을 구현한다.

## Tasks

- [x] 1. 프로젝트 초기 설정: Vite + React + TypeScript 프로젝트 생성, Tailwind CSS 설치 및 설정, date-fns 라이브러리 설치, 프로젝트 디렉토리 구조 생성 (components, context, utils, types, data)
  - [x] 1.1 Vite + React + TypeScript 프로젝트 생성
  - [x] 1.2 Tailwind CSS 설치 및 설정
  - [x] 1.3 date-fns 라이브러리 설치
  - [x] 1.4 프로젝트 디렉토리 구조 생성 (components, context, utils, types, data)

- [x] 2. 타입 정의 및 데이터 설정: src/types/index.ts에 타입 정의, src/data/seatConfig.ts에 12개 좌석 초기 데이터 생성
  - [x] 2.1 src/types/index.ts에 SeatZone, SeatStatus, PaymentMethod, Seat, Session, Reservation 타입 정의
  - [x] 2.2 src/data/seatConfig.ts에 12개 좌석 초기 데이터 생성 (입구쪽 4개, 창가쪽 8개)

- [x] 3. 상태 관리 구현: appReducer, AppContext Provider, localStorage 유틸리티 구현
  - [x] 3.1 src/context/appReducer.ts에 AppState, AppAction 타입 및 리듀서 구현
  - [x] 3.2 src/context/AppContext.tsx에 Context Provider 구현
  - [x] 3.3 src/utils/storage.ts에 localStorage 저장/복원 유틸리티 구현 (Date 직렬화/역직렬화 포함)

- [x] 4. 핵심 유틸리티 구현: 세션 종료 시간 계산, 시간 겹침 감지, 좌석 추천 알고리즘
  - [x] 4.1 src/utils/timeUtils.ts에 세션 종료 시간 계산 함수 구현 (시작 시간 + 40분)
  - [x] 4.2 src/utils/conflictDetection.ts에 시간 겹침 감지 함수 구현
  - [x] 4.3 src/utils/seatRecommendation.ts에 가장 빨리 비는 좌석 추천 알고리즘 구현

- [x] 5. 좌석 배치도 UI 구현: SeatCard, SeatZone, SeatMap 컴포넌트 구현
  - [x] 5.1 src/components/SeatMap/SeatCard.tsx에 개별 좌석 카드 컴포넌트 구현 (상태별 색상, 남은 시간 표시)
  - [x] 5.2 src/components/SeatMap/SeatZone.tsx에 구역별 좌석 그룹 컴포넌트 구현
  - [x] 5.3 src/components/SeatMap/SeatMap.tsx에 역ㄱ자 배치 전체 좌석 맵 구현

- [x] 6. 이용 등록 기능 구현: SessionModal, START_SESSION/END_SESSION 액션, 종료 확인
  - [x] 6.1 src/components/Session/SessionModal.tsx에 좌석 이용 시작/종료 모달 구현
  - [x] 6.2 appReducer에 START_SESSION, END_SESSION 액션 핸들러 구현
  - [x] 6.3 이용 중인 좌석 탭 시 종료 확인 기능 구현

- [x] 7. 임시예약 등록 기능 구현: ReservationForm, SeatRecommendation, CREATE_RESERVATION 액션
  - [x] 7.1 src/components/Reservation/ReservationForm.tsx에 예약 폼 구현 (시간, 예약자명, 결제방식, 좌석 선택)
  - [x] 7.2 src/components/Reservation/SeatRecommendation.tsx에 추천 좌석 표시 컴포넌트 구현
  - [x] 7.3 appReducer에 CREATE_RESERVATION 액션 핸들러 구현 (겹침 검증 포함)

- [x] 8. 예약 목록 관리 기능 구현: ReservationList, CANCEL/CONVERT 액션, 전환/취소 버튼
  - [x] 8.1 src/components/Reservation/ReservationList.tsx에 예약 목록 컴포넌트 구현 (시간순 정렬)
  - [x] 8.2 appReducer에 CANCEL_RESERVATION, CONVERT_RESERVATION_TO_SESSION 액션 핸들러 구현
  - [x] 8.3 예약 전환(예약→이용) 및 취소 버튼 기능 구현

- [x] 9. 타이머 및 알림 기능 구현: 1분 간격 타이머 훅, AlertBanner, 종료 임박 알림
  - [x] 9.1 1분 간격 타이머 훅 구현 (세션 상태 자동 갱신)
  - [x] 9.2 src/components/Common/AlertBanner.tsx에 종료 알림 배너 구현
  - [x] 9.3 세션 종료 5분 전 시각적 알림 구현 (빨간 테두리 깜빡임)

- [x] 10. 앱 통합 및 레이아웃: App.tsx 레이아웃, 모바일 반응형, localStorage 연동
  - [x] 10.1 App.tsx에 전체 레이아웃 조합 (SeatMap + ReservationPanel)
  - [x] 10.2 모바일 반응형 레이아웃 적용 (터치 친화적 UI, 최소 44px 터치 타겟)
  - [x] 10.3 localStorage 연동 테스트 및 앱 로드 시 상태 복원 확인

## Task Dependency Graph

```
1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
```

## Notes

- 서버 없이 브라우저 localStorage만 사용
- 세션 시간은 시작 시간 + 40분으로 고정
- 모바일 터치 친화적 UI 필수 (최소 44px 터치 타겟)
