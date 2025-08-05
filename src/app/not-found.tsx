import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"></div>
      <div className="relative text-center">
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl drop-shadow-lg">?</span>
            </div>
          </div>
          <h1 className="text-8xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 animate-pulse">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver al inicio
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>o intenta con:</p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link 
                href="/auth/login" 
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Iniciar Sesión
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/dashboard/admin" 
                className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Panel Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
