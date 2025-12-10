'use client';

import React from 'react';
import { DateTime } from 'luxon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Store } from '@/types';

interface EmployeeClosure {
  id: string;
  employeeEmail: string;
  date: string;
  reason?: string;
}

interface ClosuresTabProps {
  t: (key: string) => string;
  store: Store;
  employees: any[];
  employeeClosures: EmployeeClosure[];
  closureSelectedEmployee: string;
  setClosureSelectedEmployee: (employee: string) => void;
  closureMonth: DateTime;
  setClosureMonth: (month: DateTime) => void;
  parseBlockedDateItem: (item: any) => any;
  updateStoreBlockedDates: (storeId: string, blockedDates: string[]) => Promise<{ success: boolean; error?: string }>;
  setStore: (store: Store) => void;
  setEmployeeClosures: (closures: EmployeeClosure[]) => void;
}

export default function ClosuresTab({
  t,
  store,
  employees,
  employeeClosures,
  closureSelectedEmployee,
  setClosureSelectedEmployee,
  closureMonth,
  setClosureMonth,
  parseBlockedDateItem,
  updateStoreBlockedDates,
  setStore,
  setEmployeeClosures,
}: ClosuresTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text">{t('dashboard.closuresTab.title')}</h2>
        <p className="text-text-secondary mt-1">{t('dashboard.closuresTab.subtitle')}</p>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setClosureSelectedEmployee('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                closureSelectedEmployee === 'all'
                  ? 'bg-primary text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-surface-secondary text-text hover:bg-primary/10 hover:shadow'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {t('dashboard.closuresTab.entireStore')}
              </div>
            </button>
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setClosureSelectedEmployee(emp.email)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                  closureSelectedEmployee === emp.email
                    ? 'bg-primary text-white shadow-md hover:shadow-lg transform hover:scale-105'
                    : 'bg-surface-secondary text-text hover:bg-primary/10 hover:shadow'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {emp.email.split('@')[0]}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-text-secondary flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {closureSelectedEmployee === 'all'
                ? t('dashboard.closuresTab.managingStoreClosures')
                : `${t('dashboard.closuresTab.managingDaysOffFor')} ${closureSelectedEmployee.split('@')[0]}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setClosureMonth(closureMonth.minus({ months: 1 }))}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-text">
                {closureMonth.toFormat('MMMM yyyy')}
              </CardTitle>
            </div>

            <button
              onClick={() => setClosureMonth(closureMonth.plus({ months: 1 }))}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {[
              t('dashboard.weekDaysShort.sun'),
              t('dashboard.weekDaysShort.mon'),
              t('dashboard.weekDaysShort.tue'),
              t('dashboard.weekDaysShort.wed'),
              t('dashboard.weekDaysShort.thu'),
              t('dashboard.weekDaysShort.fri'),
              t('dashboard.weekDaysShort.sat')
            ].map((day, idx) => (
              <div
                key={day}
                className={`text-center text-xs font-bold uppercase tracking-wider py-2 ${
                  idx === 0 || idx === 6 ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {(() => {
              const startOfMonth = closureMonth.startOf('month');
              const endOfMonth = closureMonth.endOf('month');
              const startDay = startOfMonth.weekday % 7;
              const days: (DateTime | null)[] = [];

              // Empty cells before month starts
              for (let i = 0; i < startDay; i++) {
                days.push(null);
              }

              // Days of the month
              for (let i = 1; i <= endOfMonth.day; i++) {
                days.push(startOfMonth.set({ day: i }));
              }

              return days.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dateStr = day.toFormat('yyyy-MM-dd');
                const isPast = day < DateTime.now().startOf('day');
                const isToday = day.hasSame(DateTime.now(), 'day');

                // Check if this date is closed
                const allBlockedDates = store?.blocked_dates || store?.blockedDates || [];
                // Store closures are string entries only (parse first for stringified JSON)
                const parsedBlockedDates = allBlockedDates.map(parseBlockedDateItem);
                const storeBlockedDates = parsedBlockedDates.filter((item: any) => typeof item === 'string');
                const isStoreClosed = storeBlockedDates.includes(dateStr);
                const isEmployeeClosed = employeeClosures.some(
                  c => c.employeeEmail === closureSelectedEmployee && c.date === dateStr
                );

                const isClosed = closureSelectedEmployee === 'all'
                  ? isStoreClosed
                  : isEmployeeClosed || isStoreClosed;

                // Check work days
                const dayName = day.toFormat('EEEE');
                const workDays = store?.work_days || store?.workDays || [];
                const workDay = workDays.find((wd: any) => wd.day === dayName);
                const isWorkDay = workDay?.enabled !== false;

                const handleClick = async () => {
                  if (isPast || !store) return;

                  const currentBlockedDates = store.blocked_dates || store.blockedDates || [];
                  const parsedDates = currentBlockedDates.map(parseBlockedDateItem);
                  // Separate store closures (strings) from employee closures (objects)
                  const storeClosures = parsedDates.filter((item: any) => typeof item === 'string');
                  const empClosures = parsedDates.filter((item: any) => typeof item === 'object' && item.employeeEmail);

                  console.log('handleClick - closureSelectedEmployee:', closureSelectedEmployee);
                  console.log('handleClick - dateStr:', dateStr);
                  console.log('handleClick - currentBlockedDates:', currentBlockedDates);

                  if (closureSelectedEmployee === 'all') {
                    // Toggle store closure
                    let newStoreClosures: string[];

                    if (isStoreClosed) {
                      newStoreClosures = storeClosures.filter((d: string) => d !== dateStr);
                    } else {
                      newStoreClosures = [...storeClosures, dateStr];
                    }

                    // Combine store closures with employee closures (stringify objects for text[] column)
                    const newBlockedDates = [...newStoreClosures, ...empClosures.map((c: any) => JSON.stringify(c))];

                    console.log('Saving store closure - newBlockedDates:', newBlockedDates);

                    const result = await updateStoreBlockedDates(store.id, newBlockedDates);

                    console.log('Store closure save result:', result);

                    if (result.success) {
                      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
                    } else {
                      console.error('Failed to save store closure:', result.error);
                      alert(t('dashboard.closuresTab.failedToSaveClosure') + result.error);
                    }
                  } else {
                    // Toggle employee closure - save to database
                    let newEmpClosures: any[];

                    if (isEmployeeClosed) {
                      // Remove this employee closure
                      newEmpClosures = empClosures.filter((c: any) =>
                        !(c.employeeEmail === closureSelectedEmployee && c.date === dateStr)
                      );
                    } else {
                      // Add new employee closure
                      newEmpClosures = [...empClosures, {
                        employeeEmail: closureSelectedEmployee,
                        date: dateStr,
                      }];
                    }

                    // Combine store closures with employee closures (stringify objects for text[] column)
                    const newBlockedDates = [...storeClosures, ...newEmpClosures.map((c: any) => JSON.stringify(c))];

                    console.log('Saving employee closure - newBlockedDates:', newBlockedDates);

                    const result = await updateStoreBlockedDates(store.id, newBlockedDates);

                    console.log('Employee closure save result:', result);

                    if (result.success) {
                      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
                      // Also update local state for immediate UI update
                      const updatedEmpClosures = newEmpClosures.map((item: any) => ({
                        id: `${item.employeeEmail}-${item.date}`,
                        employeeEmail: item.employeeEmail,
                        date: item.date,
                        reason: item.reason,
                      }));
                      setEmployeeClosures(updatedEmpClosures);
                    } else {
                      console.error('Failed to save employee closure:', result.error);
                      alert(t('dashboard.closuresTab.failedToSaveClosure') + result.error);
                    }
                  }
                };

                return (
                  <button
                    key={dateStr}
                    onClick={handleClick}
                    disabled={isPast}
                    className={`
                      aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold transition-all relative group
                      ${isPast
                        ? 'bg-surface-secondary/30 text-text-secondary/40 cursor-not-allowed border border-border/30'
                        : isClosed
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 border-2 border-red-400/20'
                          : !isWorkDay
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white cursor-pointer shadow-md hover:shadow-lg hover:scale-105 border-2 border-gray-300/20'
                            : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 cursor-pointer shadow-md hover:shadow-xl hover:scale-105 border-2 border-green-400/20'
                      }
                      ${isToday ? 'ring-4 ring-primary ring-offset-2 ring-offset-surface' : ''}
                    `}
                  >
                    {!isPast && (
                      <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span className="text-xl font-bold mb-0.5 relative z-10">{day.day}</span>
                    <span className="text-[9px] font-medium uppercase tracking-wider opacity-90 relative z-10">
                      {isPast ? '' : isClosed ? t('dashboard.closuresTab.closed') : !isWorkDay ? t('dashboard.closuresTab.closed') : t('dashboard.closuresTab.open')}
                    </span>
                  </button>
                );
              });
            })()}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">{t('dashboard.closuresTab.legend')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-sm"></div>
                <span className="text-sm font-medium text-text">{t('dashboard.closuresTab.open')}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-sm"></div>
                <span className="text-sm font-medium text-text">{t('dashboard.closuresTab.closed')}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-400/10 px-3 py-2 rounded-lg border border-gray-400/20">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 shadow-sm"></div>
                <span className="text-sm font-medium text-text">{t('dashboard.closuresTab.regularDayOff')}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-surface-secondary/50 px-3 py-2 rounded-lg border border-border">
                <div className="w-5 h-5 rounded-lg bg-surface-secondary/50 border border-border/50"></div>
                <span className="text-sm font-medium text-text-secondary">{t('dashboard.closuresTab.past')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Closures List */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <CardTitle>{t('dashboard.closuresTab.upcomingClosures')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            const allBlockedDates = store?.blocked_dates || store?.blockedDates || [];
            const parsedBlockedDates = allBlockedDates.map(parseBlockedDateItem);
            // Only get string dates (store-wide closures)
            const storeBlockedDates = parsedBlockedDates
              .filter((item: any) => typeof item === 'string')
              .filter((d: string) => d >= DateTime.now().toFormat('yyyy-MM-dd'))
              .sort();
            const upcomingEmployeeClosures = employeeClosures
              .filter(c => c.date >= DateTime.now().toFormat('yyyy-MM-dd'))
              .sort((a, b) => a.date.localeCompare(b.date));

            if (storeBlockedDates.length === 0 && upcomingEmployeeClosures.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
                    <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-text-secondary font-medium">{t('dashboard.closuresTab.noUpcomingClosures')}</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {storeBlockedDates.map((date: string) => (
                  <div key={`store-${date}`} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 p-4 border border-red-500/20 hover:border-red-500/40 transition-all hover:shadow-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {DateTime.fromISO(date).day}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text mb-0.5">
                          {DateTime.fromISO(date).toFormat('EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <p className="text-sm text-red-600 font-medium">{t('dashboard.closuresTab.storeClosed')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingEmployeeClosures.map((closure) => {
                  const employee = employees.find(e => e.email === closure.employeeEmail);
                  return (
                    <div key={closure.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4 border border-amber-500/20 hover:border-amber-500/40 transition-all hover:shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {DateTime.fromISO(closure.date).day}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-text mb-0.5">
                            {DateTime.fromISO(closure.date).toFormat('EEEE, MMMM d, yyyy')}
                          </p>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className="text-sm text-amber-700 font-medium">
                              {employee?.email.split('@')[0] || closure.employeeEmail} - {t('dashboard.closuresTab.dayOff')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
