'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al login
    router.push('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Educa Attendance</h1>
        <p className="text-gray-600 mb-4">Redirigiendo al sistema de login...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
