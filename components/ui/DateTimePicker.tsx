'use client';

import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { Button } from './Button';
import { canBookServicesAtTime } from '@/lib/reservationUtils';

interface EmployeeClosure {
  employeeEmail: string;
  date: string;
}

interface DateTimePickerProps {
  value: string;
  onChange: (datetime: string) => void;
  minDate?: string;
  blockedDates?: string[];
  availableSlots?: string[];
  workDays?: any[];
  totalDuration: number;
  services?: Array<{ profession: string; duration: number }>;
  employees?: any[];
  existingReservations?: any[];
  employeeClosures?: EmployeeClosure[];
  dateIcon?: string;
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  blockedDates = [],
  availableSlots = [],
  workDays = [],
  totalDuration,
  services = [],
  employees = [],
  existingReservations = [],
  employeeClosures = [],
  dateIcon = 'calendar'
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(
    value ? DateTime.fromISO(value) : DateTime.now().startOf('day')
  );
  const [weekStartDate, setWeekStartDate] = useState(DateTime.now().startOf('day'));

  // Helper to get icon path based on icon ID
  const getIconPath = (iconId: string) => {
    const icons: { [key: string]: string } = {
      calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
      sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[iconId] || icons.calendar;
  };

  // Get 5 days starting from weekStartDate
  const getFiveDays = () => {
    const days: DateTime[] = [];
    for (let i = 0; i < 5; i++) {
      days.push(weekStartDate.plus({ days: i }));
    }
    return days;
  };

  const isDateDisabled = (date: DateTime) => {
    const dateStr = date.toISODate();
    const today = DateTime.now().startOf('day');

    // Check if date is in the past
    if (date < today) return true;

    // Check if date is blocked
    if (blockedDates.includes(dateStr || '')) return true;

    // Check if day is enabled in work days
    const dayName = date.toFormat('EEEE');
    const workDay = workDays.find(wd => wd.day === dayName);
    if (workDay && !workDay.enabled) return true;

    return false;
  };

  const handleDateSelect = (date: DateTime) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const dateTime = selectedDate.set({
        hour: parseInt(hours),
        minute: parseInt(minutes)
      });
      onChange(dateTime.toISO() || '');
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate) return [];

    const dayName = selectedDate.toFormat('EEEE');
    const workDay = workDays.find(wd => wd.day === dayName);

    if (!workDay || !workDay.enabled) return [];

    const dateStr = selectedDate.toFormat('yyyy-MM-dd');

    // Filter out employees who are closed on this date
    const availableEmployees = employees.filter(emp => {
      const isClosed = employeeClosures.some(
        c => c.employeeEmail === emp.email && c.date === dateStr
      );
      return !isClosed;
    });

    // Check if we have at least one available employee for each required profession
    if (services.length > 0 && employees.length > 0) {
      const requiredProfessions = Array.from(new Set(services.map(s => s.profession)));
      for (const profession of requiredProfessions) {
        const hasAvailableEmployee = availableEmployees.some(emp => emp.category === profession);
        if (!hasAvailableEmployee) {
          console.log(`No available employees for profession ${profession} on ${dateStr} - all are closed or none exist`);
          return []; // No slots if any required profession has no available employees
        }
      }
    }

    const slots: string[] = [];

    // Helper function to add slots for a time range
    const addSlotsForRange = (startTime: string, endTime: string) => {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      let current = selectedDate.set({ hour: startHour, minute: startMin });
      const end = selectedDate.set({ hour: endHour, minute: endMin });

      // Subtract total duration from end time to ensure appointment can be completed
      const lastPossibleStart = end.minus({ minutes: totalDuration });

      while (current <= lastPossibleStart) {
        const timeStr = current.toFormat('HH:mm');
        const isoStr = current.toISO() || '';

        // Check availability using conflict detection if services and employees are provided
        let isAvailable = true;

        if (services.length > 0 && employees.length > 0) {
          if (availableEmployees.length === 0) {
            // No employees available (all closed) - no slots available
            isAvailable = false;
          } else {
            // Use conflict detection with only available employees
            isAvailable = canBookServicesAtTime(
              current,
              services,
              availableEmployees,
              existingReservations
            );
          }

          if (!isAvailable) {
            console.log(`${timeStr} blocked - conflict or no available employees`);
          }
        } else if (availableSlots.length > 0) {
          // Fallback to old method if conflict detection data not provided
          isAvailable = availableSlots.includes(isoStr);
        }

        if (isAvailable) {
          slots.push(timeStr);
        }

        current = current.plus({ minutes: 15 }); // 15-minute intervals
      }
    };

    console.log('Generating time slots with:', {
      services: services.length,
      employees: employees.length,
      availableEmployees: availableEmployees.length,
      reservations: existingReservations.length,
      employeeClosures: employeeClosures.length,
      closuresForDate: employeeClosures.filter(c => c.date === dateStr),
      date: selectedDate.toFormat('yyyy-MM-dd'),
      requiredProfessions: Array.from(new Set(services.map(s => s.profession))),
      employeeCategories: employees.map(e => ({ email: e.email, category: e.category }))
    });

    // First time range
    addSlotsForRange(workDay.startTime, workDay.endTime);

    // Second time range (if exists - e.g., after lunch break)
    if (workDay.startTime2 && workDay.endTime2) {
      addSlotsForRange(workDay.startTime2, workDay.endTime2);
    }

    console.log(`Total available slots: ${slots.length}`);
    return slots;
  };

  const days = getFiveDays();
  const timeSlots = selectedDate ? generateTimeSlots() : [];

  return (
    <div className="space-y-4">
      {/* Calendar View - Always visible on top */}
      <div className="bg-surface rounded-lg border border-border p-4">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekStartDate(weekStartDate.minus({ days: 5 }))}
            disabled={weekStartDate <= DateTime.now().startOf('day')}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-semibold text-text">
            {weekStartDate.toFormat('MMM dd')} - {weekStartDate.plus({ days: 4 }).toFormat('MMM dd, yyyy')}
          </h3>
          <button
            onClick={() => setWeekStartDate(weekStartDate.plus({ days: 5 }))}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <svg className="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 5 Day View */}
        <div className="grid grid-cols-5 gap-2">
          {days.map((day) => {
            const disabled = isDateDisabled(day);
            const isSelected = selectedDate?.hasSame(day, 'day');
            const isToday = day.hasSame(DateTime.now(), 'day');

            return (
              <button
                key={day.toISODate()}
                onClick={() => !disabled && handleDateSelect(day)}
                disabled={disabled}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg transition-all
                  ${disabled
                    ? 'text-text-secondary/20 cursor-not-allowed bg-surface-secondary/30 opacity-40'
                    : 'hover:bg-primary/10 cursor-pointer'
                  }
                  ${isSelected && !disabled
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : !disabled ? 'text-text' : ''
                  }
                  ${isToday && !isSelected && !disabled
                    ? 'ring-2 ring-primary/50'
                    : ''
                  }
                `}
              >
                <span className="text-xs font-medium mb-2">
                  {day.toFormat('EEE')}
                </span>
                {isSelected && !disabled ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(dateIcon)} />
                  </svg>
                ) : (
                  <span className="text-lg font-bold">
                    {day.day}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots View - Show below when date is selected */}
      {selectedDate && (
        <div className="bg-surface rounded-lg border border-border p-6">
          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {timeSlots.map((time) => {
                const isSelected = value && DateTime.fromISO(value).toFormat('HH:mm') === time;

                return (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`
                      py-4 px-6 rounded-lg font-semibold text-base transition-all
                      ${isSelected
                        ? 'bg-primary text-white'
                        : 'bg-surface-secondary hover:bg-primary/10 text-text'
                      }
                    `}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              No available time slots for this date.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
