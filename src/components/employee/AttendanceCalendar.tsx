/**
 * =============================================
 * ATTENDANCE CALENDAR COMPONENT
 * =============================================
 * 
 * Descripción: Calendario mensual de asistencias del empleado
 * Muestra visualmente los días trabajados, ausencias y estados
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Attendance } from '@/types/database';

interface AttendanceCalendarProps {
  employeeId: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  attendance?: Attendance;
  status: 'none' | 'complete' | 'incomplete' | 'absent';
}

interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

/**
 * Hook para gestionar datos del calendario
 */
function useCalendarData(employeeId: string, currentDate: Date) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMonthAttendances = async (year: number, month: number) => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('attendance_date', startDate.toISOString().split('T')[0])
        .lte('attendance_date', endDate.toISOString().split('T')[0])
        .order('attendance_date', { ascending: true });

      if (error) throw error;
      
      setAttendances(data || []);
    } catch (error) {
      console.error('Error loading calendar attendances:', error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthAttendances(currentDate.getFullYear(), currentDate.getMonth());
  }, [employeeId, currentDate]);

  return { attendances, loading, refreshAttendances: () => loadMonthAttendances(currentDate.getFullYear(), currentDate.getMonth()) };
}

/**
 * Genera los datos del calendario para un mes específico
 */
function generateCalendarMonth(year: number, month: number, attendances: Attendance[]): CalendarMonth {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const today = new Date();
  
  const days: CalendarDay[] = [];
  
  // Días del mes anterior (para completar la primera semana)
  const prevMonth = new Date(year, month - 1, 0);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      status: 'none'
    });
  }
  
  // Días del mes actual
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const attendance = attendances.find(a => a.attendance_date === dateStr);
    
    let status: CalendarDay['status'] = 'none';
    if (attendance) {
      if (attendance.check_in_time && attendance.check_out_time) {
        status = 'complete';
      } else if (attendance.check_in_time) {
        status = 'incomplete';
      }
    } else if (date < today && date.getDay() !== 0 && date.getDay() !== 6) {
      // Si es un día laboral pasado sin registro, marcarlo como ausente
      status = 'absent';
    }
    
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString(),
      attendance,
      status
    });
  }
  
  // Días del mes siguiente (para completar la última semana)
  const remainingDays = 42 - days.length; // 6 semanas * 7 días
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false,
      status: 'none'
    });
  }
  
  return { year, month, days };
}

/**
 * Componente para mostrar un día del calendario
 */
function CalendarDay({ day, onClick }: { day: CalendarDay; onClick?: (day: CalendarDay) => void }) {
  const getStatusColor = () => {
    switch (day.status) {
      case 'complete':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'incomplete':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return day.isCurrentMonth ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-50 border-gray-100 text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (day.status) {
      case 'complete':
        return '✅';
      case 'incomplete':
        return '⚠️';
      case 'absent':
        return '❌';
      default:
        return null;
    }
  };

  return (
    <button
      onClick={() => onClick?.(day)}
      className={`
        aspect-square border-2 rounded-lg p-1 text-sm font-medium transition-all duration-200 hover:shadow-md
        ${getStatusColor()}
        ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${!day.isCurrentMonth ? 'opacity-50' : ''}
        ${day.attendance ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
      `}
      disabled={!day.attendance}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-xs">{day.dayNumber}</span>
        {getStatusIcon() && (
          <span className="text-xs mt-0.5">{getStatusIcon()}</span>
        )}
      </div>
    </button>
  );
}

/**
 * Componente principal del calendario
 */
export function AttendanceCalendar({ employeeId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  
  const { attendances, loading } = useCalendarData(employeeId, currentDate);
  
  const calendarMonth = useMemo(() => 
    generateCalendarMonth(currentDate.getFullYear(), currentDate.getMonth(), attendances),
    [currentDate, attendances]
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.attendance) {
      setSelectedDay(day);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-6 space-y-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[calendarMonth.month]} {calendarMonth.year}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Calendario de asistencias
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Hoy
          </button>
          
          <button
            onClick={() => navigateMonth('next')}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>✅ Jornada completa</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
            <span>⚠️ Jornada incompleta</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
            <span>❌ Ausencia</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
            <span>Sin registro</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Encabezados de días */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-2">
          {calendarMonth.days.map((day, index) => (
            <CalendarDay
              key={index}
              day={day}
              onClick={handleDayClick}
            />
          ))}
        </div>
      </div>

      {/* Detalle del día seleccionado */}
      {selectedDay && selectedDay.attendance && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Detalle del día {selectedDay.dayNumber} de {monthNames[calendarMonth.month]}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Entrada</div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedDay.attendance.check_in_time 
                  ? new Date(`${selectedDay.attendance.attendance_date}T${selectedDay.attendance.check_in_time}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : 'No registrada'
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Salida</div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedDay.attendance.check_out_time 
                  ? new Date(`${selectedDay.attendance.attendance_date}T${selectedDay.attendance.check_out_time}`).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : 'No registrada'
                }
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Total horas</div>
              <div className="text-lg font-semibold text-gray-900">
                {selectedDay.attendance.check_in_time && selectedDay.attendance.check_out_time
                  ? (() => {
                      const checkIn = new Date(`${selectedDay.attendance.attendance_date}T${selectedDay.attendance.check_in_time}`);
                      const checkOut = new Date(`${selectedDay.attendance.attendance_date}T${selectedDay.attendance.check_out_time}`);
                      const diffMs = checkOut.getTime() - checkIn.getTime();
                      const diffHours = diffMs / (1000 * 60 * 60);
                      return `${diffHours.toFixed(1)}h`;
                    })()
                  : 'Incompleto'
                }
              </div>
            </div>
          </div>

          {selectedDay.attendance.employee_notes && (
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-800 font-medium mb-2">Notas</div>
              <div className="text-blue-900">{selectedDay.attendance.employee_notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
