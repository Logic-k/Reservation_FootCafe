import React, { useState } from 'react';
import { addMinutes, format } from 'date-fns';
import { PaymentMethod } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { hasTimeConflict } from '../../utils/conflictDetection';
import { initialSeats } from '../../data/seatConfig';

const SESSION_DURATION_MINUTES = 40;

interface FormData {
  reservationTime: string;
  guestName: string;
  paymentMethod: PaymentMethod | '';
  seatIds: number[];
  groupName: string;
}

interface FormErrors {
  reservationTime?: string;
  guestName?: string;
  paymentMethod?: string;
  seatIds?: string;
  conflict?: string;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: '현금' },
  { value: 'transfer', label: '계좌이체' },
  { value: 'card', label: '카드' },
];

export default function ReservationForm() {
  const { state, dispatch } = useAppContext();
  const { sessions, reservations } = state;

  const [formData, setFormData] = useState<FormData>({
    reservationTime: '',
    guestName: '',
    paymentMethod: '',
    seatIds: [],
    groupName: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};

    if (!formData.reservationTime) {
      newErrors.reservationTime = '예약 시간을 입력해주세요.';
    } else {
      const selectedTime = new Date(formData.reservationTime);
      if (selectedTime <= new Date()) {
        newErrors.reservationTime = '예약 시간은 현재 시간 이후여야 합니다.';
      }
    }

    if (!formData.guestName.trim()) {
      newErrors.guestName = '예약자명을 입력해주세요.';
    } else if (formData.guestName.trim().length > 20) {
      newErrors.guestName = '예약자명은 20자 이내로 입력해주세요.';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = '결제방식을 선택해주세요.';
    }

    if (formData.seatIds.length === 0) {
      newErrors.seatIds = '좌석을 선택해주세요.';
    }

    // 2인 이상인데 그룹명이 없으면
    if (formData.seatIds.length > 1 && !formData.groupName.trim()) {
      newErrors.seatIds = '2인 이상 예약 시 그룹명을 입력해주세요.';
    }

    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setConfirmation(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const proposedStart = new Date(formData.reservationTime);
    const proposedEnd = addMinutes(proposedStart, SESSION_DURATION_MINUTES);

    // 각 좌석에 대해 충돌 확인
    for (const seatId of formData.seatIds) {
      const conflictResult = hasTimeConflict(seatId, proposedStart, proposedEnd, sessions, reservations);
      if (conflictResult.hasConflict && conflictResult.conflictDetails) {
        const details = conflictResult.conflictDetails;
        const conflictStart = format(new Date(details.conflictingTimeRange.start), 'HH:mm');
        const conflictEnd = format(new Date(details.conflictingTimeRange.end), 'HH:mm');
        const seatLabel = initialSeats.find((s) => s.id === seatId)?.label || `${seatId}번`;
        setErrors({
          conflict: `${seatLabel}에 시간 겹침 발생. 충돌: ${conflictStart}~${conflictEnd} (${details.occupantName || '알 수 없음'})`,
        });
        return;
      }
    }

    // 단일 예약 또는 그룹 예약
    if (formData.seatIds.length === 1) {
      dispatch({
        type: 'CREATE_RESERVATION',
        reservation: {
          seatId: formData.seatIds[0],
          reservationTime: proposedStart,
          guestName: formData.guestName.trim(),
          paymentMethod: formData.paymentMethod as PaymentMethod,
        },
      });
    } else {
      const reservationData = formData.seatIds.map((seatId) => ({
        seatId,
        reservationTime: proposedStart,
        guestName: formData.guestName.trim(),
        paymentMethod: formData.paymentMethod as PaymentMethod,
        groupName: formData.groupName.trim(),
        partySize: formData.seatIds.length,
      }));
      dispatch({ type: 'CREATE_GROUP_RESERVATION', reservations: reservationData });
    }

    // 확인 메시지
    const seatLabels = formData.seatIds
      .map((id) => initialSeats.find((s) => s.id === id)?.label || `${id}번`)
      .join(', ');
    const timeStr = format(proposedStart, 'yyyy-MM-dd HH:mm');
    const groupInfo = formData.seatIds.length > 1 ? ` [${formData.groupName}]` : '';
    setConfirmation(
      `예약 완료${groupInfo}: ${seatLabels}, ${timeStr}, ${formData.guestName.trim()} (${formData.seatIds.length}인)`
    );

    // 리셋
    setFormData({ reservationTime: '', guestName: '', paymentMethod: '', seatIds: [], groupName: '' });
    setErrors({});
  }

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => { const u = { ...prev }; delete u[name as keyof FormErrors]; return u; });
    }
    if (errors.conflict) {
      setErrors((prev) => { const u = { ...prev }; delete u.conflict; return u; });
    }
  }

  function toggleSeat(seatId: number) {
    setFormData((prev) => ({
      ...prev,
      seatIds: prev.seatIds.includes(seatId)
        ? prev.seatIds.filter((id) => id !== seatId)
        : [...prev.seatIds, seatId],
    }));
    if (errors.seatIds) {
      setErrors((prev) => { const u = { ...prev }; delete u.seatIds; return u; });
    }
    if (errors.conflict) {
      setErrors((prev) => { const u = { ...prev }; delete u.conflict; return u; });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4 space-y-4" noValidate>
      <h2 className="text-lg font-bold text-gray-800">임시예약 등록</h2>

      {confirmation && (
        <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
          {confirmation}
        </div>
      )}
      {errors.conflict && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-sm">
          {errors.conflict}
        </div>
      )}

      {/* 예약 시간 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="reservationTime" className="text-sm font-medium text-gray-700">예약 시간</label>
        <input
          type="datetime-local"
          id="reservationTime"
          name="reservationTime"
          value={formData.reservationTime}
          onChange={handleFieldChange}
          className="min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {errors.reservationTime && <span className="text-red-600 text-xs">{errors.reservationTime}</span>}
      </div>

      {/* 예약자명 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="guestName" className="text-sm font-medium text-gray-700">예약자명</label>
        <input
          type="text"
          id="guestName"
          name="guestName"
          value={formData.guestName}
          onChange={handleFieldChange}
          maxLength={20}
          placeholder="닉네임 (1~20자)"
          className="min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {errors.guestName && <span className="text-red-600 text-xs">{errors.guestName}</span>}
      </div>

      {/* 결제방식 */}
      <div className="flex flex-col gap-1">
        <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">결제방식</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleFieldChange}
          className="min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">선택해주세요</option>
          {PAYMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.paymentMethod && <span className="text-red-600 text-xs">{errors.paymentMethod}</span>}
      </div>

      {/* 좌석 선택 (다중 선택) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          좌석 선택 ({formData.seatIds.length}개 선택)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {initialSeats.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSeat(s.id)}
              className={`min-h-[40px] text-xs rounded border transition-colors ${
                formData.seatIds.includes(s.id)
                  ? 'bg-blue-100 border-blue-400 text-blue-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {errors.seatIds && <span className="text-red-600 text-xs">{errors.seatIds}</span>}
      </div>

      {/* 그룹명 (2인 이상 선택 시 표시) */}
      {formData.seatIds.length > 1 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="groupName" className="text-sm font-medium text-gray-700">
            그룹명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="groupName"
            name="groupName"
            value={formData.groupName}
            onChange={handleFieldChange}
            maxLength={10}
            placeholder="예: 커플A, 가족1"
            className="min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      )}

      <button
        type="submit"
        className="w-full min-h-[44px] bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
      >
        예약 등록 {formData.seatIds.length > 1 ? `(${formData.seatIds.length}인 그룹)` : ''}
      </button>
    </form>
  );
}
