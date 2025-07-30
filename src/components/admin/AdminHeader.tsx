'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';

interface AdminHeaderProps {
  userEmail?: string;
  onLogout: () => void;
}

/**
 * Componente de cabecera del panel de administración
 * 
 * Principios aplicados:
 * - Single Responsibility: Solo maneja la cabecera y logout
 * - Dependency Inversion: Recibe función de logout como prop
 */
export function AdminHeader({ userEmail, onLogout }: AdminHeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Sistema de Control de Asistencia Educa-Crea
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="flex items-center text-gray-700">
                <User className="w-5 h-5 mr-2" />
                <span className="font-medium">{userEmail}</span>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
