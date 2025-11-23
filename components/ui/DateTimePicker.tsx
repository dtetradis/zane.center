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
  employeeClosures = []
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(
    value ? DateTime.fromISO(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(DateTime.now());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Get days in month for calendar view
  const getDaysInMonth = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.weekday % 7; // 0 = Sunday
    const days: (DateTime | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= endOfMonth.day; i++) {
      days.push(startOfMonth.set({ day: i }));
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
    setShowTimePicker(true);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const dateTime = selectedDate.set({
        hour: parseInt(hours),
        minute: parseInt(minutes)
      });
      onChange(dateTime.toISO() || '');
      setShowTimePicker(false);
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

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = showTimePicker ? generateTimeSlots() : [];

  return (
    <div className="space-y-4">
      {/* Calendar View */}
      {!showTimePicker && (
        <div className="bg-surface rounded-lg border border-border p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(currentMonth.minus({ months: 1 }))}
            >
              ←
            </Button>
            <h3 className="text-lg font-semibold text-text">
              {currentMonth.toFormat('MMMM yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(currentMonth.plus({ months: 1 }))}
            >
              →
            </Button>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-secondary p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const disabled = isDateDisabled(day);
              const isSelected = selectedDate?.hasSame(day, 'day');
              const isToday = day.hasSame(DateTime.now(), 'day');

              return (
                <button
                  key={day.toISODate()}
                  onClick={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${disabled
                      ? 'text-text-secondary/30 cursor-not-allowed bg-surface-secondary/50'
                      : 'hover:bg-primary/10 cursor-pointer'
                    }
                    ${isSelected
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'text-text'
                    }
                    ${isToday && !isSelected
                      ? 'ring-2 ring-primary/50'
                      : ''
                    }
                  `}
                >
                  {day.day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Slots View */}
      {showTimePicker && selectedDate && (
        <div className="bg-surface rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimePicker(false)}
            >
              ← Back to Calendar
            </Button>
            <h3 className="text-lg font-semibold text-text">
              {selectedDate.toFormat('dd MMM yyyy')}
            </h3>
            <div className="w-20"></div>
          </div>

          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-80 overflow-y-auto">
              {timeSlots.map((time) => {
                const isSelected = value && DateTime.fromISO(value).toFormat('HH:mm') === time;

                return (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`
                      py-3 px-4 rounded-lg font-medium text-sm transition-all
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
            <div className="text-center py-8 text-text-secondary">
              No available time slots for this date.
              <br />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimePicker(false)}
                className="mt-4"
              >
                Choose Another Date
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected DateTime Display */}
      {value && (
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <p className="text-sm text-text-secondary">Selected Appointment</p>
          <p className="text-lg font-bold text-text">
            {DateTime.fromISO(value).toFormat('dd MMM yyyy, HH:mm')}
          </p>
        </div>
      )}
    </div>
  );
}
