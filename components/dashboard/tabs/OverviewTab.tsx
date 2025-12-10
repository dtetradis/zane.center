'use client';

import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Reservation } from '@/types';

interface OverviewTabProps {
  t: (key: string) => string;
  selectedDate: DateTime;
  setSelectedDate: (date: DateTime) => void;
  isOpen: boolean;
  employees: any[];
  timeSlots: DateTime[];
  dayReservations: Reservation[];
  isEmployeeClosedOnDate: (employeeEmail: string, date: DateTime) => boolean;
  getReservationsAtSlot: (employeeEmail: string, slotTime: DateTime) => Reservation[];
  setNewReservationSlot: (slot: { employee: string; time: DateTime } | null) => void;
  setShowNewReservationModal: (show: boolean) => void;
  openEditReservation: (reservation: Reservation) => void;
  setDeleteConfirmReservation: (reservation: Reservation | null) => void;
  stringToColor: (str: string) => { bg: string; hover: string };
  onReservationDrop: (reservationId: string, newDateTime: DateTime, newEmployeeEmail: string) => Promise<void>;
}

export default function OverviewTab({
  t,
  selectedDate,
  setSelectedDate,
  isOpen,
  employees,
  timeSlots,
  dayReservations,
  isEmployeeClosedOnDate,
  getReservationsAtSlot,
  setNewReservationSlot,
  setShowNewReservationModal,
  openEditReservation,
  setDeleteConfirmReservation,
  stringToColor,
  onReservationDrop,
}: OverviewTabProps) {
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null);
  const [dropTarget, setDropTarget] = useState<{ employeeEmail: string; time: DateTime } | null>(null);
  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(selectedDate.minus({ days: 1 }))}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
              title={t('dashboard.overviewTab.previousDay')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center min-w-[200px]">
              <p className="text-2xl font-bold text-text">{selectedDate.toFormat('d MMMM')}</p>
              <p className="text-sm text-text-secondary">{selectedDate.toFormat('EEEE, yyyy')}</p>
            </div>
            <button
              onClick={() => setSelectedDate(selectedDate.plus({ days: 1 }))}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
              title={t('dashboard.overviewTab.nextDay')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={selectedDate.toFormat('yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(DateTime.fromISO(e.target.value).setZone('Europe/Athens'))}
              className="w-auto text-sm"
            />
            <Button
              variant={selectedDate.hasSame(DateTime.now(), 'day') ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setSelectedDate(DateTime.now().setZone('Europe/Athens'))}
            >
              {t('dashboard.overviewTab.today')}
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      {!isOpen ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">{t('dashboard.overviewTab.storeClosed')}</h3>
          <p className="text-text-secondary">{t('dashboard.overviewTab.storeClosedOn')} {selectedDate.toFormat('EEEE')}s.</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">{t('dashboard.overviewTab.noEmployees')}</h3>
          <p className="text-text-secondary">{t('dashboard.overviewTab.addEmployeesToStart')}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className={employees.length > 5 ? "overflow-x-auto" : ""}>
            <div style={employees.length > 5 ? { minWidth: `${70 + employees.length * 400}px` } : {}}>
              <div className="grid gap-0" style={{ gridTemplateColumns: employees.length <= 5 ? `70px repeat(${employees.length}, 1fr)` : `70px repeat(${employees.length}, 400px)` }}>
                {/* Header Row */}
                <div className="bg-gradient-to-b from-surface-secondary to-surface border-b-2 border-border p-3 font-semibold text-xs text-text-secondary uppercase tracking-wider sticky top-0 z-20">
                  {t('dashboard.overviewTab.time')}
                </div>
                {employees.map((employee) => {
                  const employeeClosed = isEmployeeClosedOnDate(employee.email, selectedDate);
                  return (
                    <div
                      key={employee.id}
                      className={`bg-gradient-to-b ${employeeClosed ? 'from-red-500/20 to-red-500/10' : 'from-surface-secondary to-surface'} border-b-2 border-l border-border last:border-r-0 p-3 sticky top-0 z-20`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${employeeClosed ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'} flex items-center justify-center font-semibold text-sm`}>
                          {employee.email.split('@')[0].charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-text truncate">
                            {employee.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{employee.category}</p>
                        </div>
                        {employeeClosed && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                            {t('dashboard.overviewTab.off')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Time Slots */}
                {timeSlots.length > 0 ? (
                timeSlots.map((slot, slotIndex) => {
                  const isHour = slot.minute === 0;
                  const isHalfHour = slot.minute === 30;
                  return (
                    <React.Fragment key={`row-${slot.toISO()}`}>
                      {/* Time Label */}
                      <div
                        className={`border-l border-border px-2 py-1 text-xs flex items-center justify-center ${
                          isHour
                            ? 'font-bold text-text border-t-2 border-t-border bg-surface-secondary/50'
                            : isHalfHour
                              ? 'text-text-secondary border-t border-t-border/50'
                              : 'text-text-secondary/50 border-t border-t-border/20'
                        }`}
                      >
                        {isHour ? slot.toFormat('HH:mm') : isHalfHour ? slot.toFormat('HH:mm') : ''}
                      </div>

                      {/* Employee Slots */}
                      {employees.map((employee) => {
                        const reservations = getReservationsAtSlot(employee.email, slot);
                        const hasReservations = reservations.length > 0;
                        const isClosed = isEmployeeClosedOnDate(employee.email, selectedDate);

                        // Constants for calculations
                        const slotHeight = 48; // pixels per 15-minute slot
                        const slotDuration = 15; // minutes

                        const isDropTarget = dropTarget?.employeeEmail === employee.email &&
                                            dropTarget?.time.toISO() === slot.toISO();

                        return (
                          <div
                            key={`slot-${employee.id}-${slot.toISO()}`}
                            className={`border-l border-border ${
                              isHour
                                ? 'border-t-2 border-t-border'
                                : isHalfHour
                                  ? 'border-t border-t-border/50'
                                  : 'border-t border-t-border/20'
                            } ${isClosed ? 'bg-red-500/10' : hasReservations ? '' : 'hover:bg-primary/5'} ${
                              isDropTarget ? 'bg-primary/20 ring-2 ring-primary ring-inset' : ''
                            } relative group`}
                            style={{ height: '48px' }}
                            onDragOver={(e) => {
                              if (draggedReservation && !isClosed) {
                                e.preventDefault();
                                setDropTarget({ employeeEmail: employee.email, time: slot });
                              }
                            }}
                            onDragLeave={() => {
                              setDropTarget(null);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              if (draggedReservation && !isClosed) {
                                // Create new date time with the selected date and slot time
                                const newDateTime = selectedDate.set({
                                  hour: slot.hour,
                                  minute: slot.minute,
                                  second: 0,
                                  millisecond: 0,
                                });

                                await onReservationDrop(draggedReservation.id, newDateTime, employee.email);
                                setDraggedReservation(null);
                                setDropTarget(null);
                              }
                            }}
                          >
                            {hasReservations ? (
                              <>
                                {(() => {
                                  // Filter to get only reservations that START at this slot
                                  const startingReservations = reservations.filter(r => {
                                    const resStart = DateTime.fromISO(r.date_time).setZone('Europe/Athens');
                                    const resStartSlotMinute = Math.floor(resStart.minute / 15) * 15;
                                    return slot.hour === resStart.hour && slot.minute === resStartSlotMinute;
                                  });

                                  return startingReservations.map((reservation, index) => {
                                    // Calculate height and width based on reservations starting at this slot
                                    const numSlots = Math.ceil((reservation.service_duration || reservation.serviceDuration || 0) / slotDuration);
                                    const reservationHeight = numSlots * slotHeight;
                                    const widthPercent = 100 / startingReservations.length;
                                    const leftPercent = (index / startingReservations.length) * 100;

                                    const nameColor = stringToColor(reservation.name);

                                    return (
                                      <div
                                        key={`res-${reservation.id}`}
                                        draggable
                                        onDragStart={(e) => {
                                          setDraggedReservation(reservation);
                                          e.currentTarget.style.opacity = '0.5';
                                        }}
                                        onDragEnd={(e) => {
                                          setDraggedReservation(null);
                                          setDropTarget(null);
                                          e.currentTarget.style.opacity = '1';
                                        }}
                                        onClick={() => openEditReservation(reservation)}
                                        className="text-white rounded-lg p-2 text-xs absolute z-10 shadow-lg flex flex-col cursor-move transition-all duration-200 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                                        style={{
                                          top: '3px',
                                          height: `${reservationHeight - 6}px`,
                                          width: `calc(${widthPercent}% - 4px)`,
                                          left: `calc(${leftPercent}% + 2px)`,
                                          backgroundColor: nameColor.bg,
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = nameColor.hover}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = nameColor.bg}
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmReservation(reservation);
                                          }}
                                          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors z-20"
                                          title="Delete reservation"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                        <p className="font-semibold truncate pr-6 leading-tight">{reservation.name}</p>
                                        <p className="text-white/80 truncate text-[10px] mt-1 leading-tight">
                                          {reservation.service_name || reservation.serviceName}
                                        </p>
                                        <p className="text-white/60 text-[10px] mt-auto leading-tight">
                                          {reservation.service_duration || reservation.serviceDuration} min
                                        </p>
                                      </div>
                                    );
                                  });
                                })()}
                              </>
                            ) : isClosed ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-red-400 text-xs font-medium">{t('dashboard.overviewTab.closed')}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setNewReservationSlot({ employee: employee.email, time: slot });
                                  setShowNewReservationModal(true);
                                }}
                                className="w-full h-full flex items-center justify-center text-transparent group-hover:text-primary/50 hover:!text-primary transition-all duration-200"
                                title={t('dashboard.overviewTab.addReservation')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })
                ) : (
                  <div className="col-span-full p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-secondary flex items-center justify-center">
                      <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-text-secondary">{t('dashboard.overviewTab.noTimeSlotsConfigured')}</p>
                    <p className="text-sm text-text-secondary/70 mt-1">{t('dashboard.overviewTab.setupWorkHours')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
