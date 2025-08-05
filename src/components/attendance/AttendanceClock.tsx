/**
 * =============================================
 * ATTENDANCE CLOCK COMPONENT
 * =============================================
 * 
 * Descripción: Componente de reloj en tiempo real para mostrar la hora actual
 * Sigue principios SOLID y Clean Architecture
 * 
 * Responsabilidades:
 * - Mostrar fecha y hora en tiempo real
 * - Formatear correctamente según localización
 * - Optimizar renders con useMemo y useCallback
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface AttendanceClockProps {
  /** Zona horaria a usar (por defecto: sistema) */
  timezone?: string;
  /** Formato de 12 o 24 horas */
  format24h?: boolean;
  /** Localización para formateo de fechas */
  locale?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente de reloj para el sistema de asistencias
 */
export const AttendanceClock: React.FC<AttendanceClockProps> = ({
  timezone,
  format24h = true,
  locale = 'es-MX',
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Efecto para actualizar el tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Memoizar formateo de tiempo para optimizar renders
  const formattedTime = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !format24h,
      timeZone: timezone
    };

    return currentTime.toLocaleTimeString(locale, options);
  }, [currentTime, format24h, locale, timezone]);

  // Memoizar formateo de fecha
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    };

    return currentTime.toLocaleDateString(locale, options);
  }, [currentTime, locale, timezone]);

  return (
    <div className={`text-center ${className}`}>
      <div className="space-y-2">
        <div className="text-4xl font-bold text-gray-900 font-mono">
          {formattedTime}
        </div>
        <div className="text-lg text-gray-600 capitalize">
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default AttendanceClock;
