'use client'

// =============================================
// PÁGINA DE PRUEBA TEMPORAL - SUPABASE
// Descripción: Verificar conexión y funcionalidad básica
// Eliminar después de confirmar que todo funciona
// =============================================

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface TestResult {
  success: boolean
  message: string
  data?: Record<string, unknown> | Record<string, unknown>[] | null
}

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTests = async () => {
    setIsLoading(true)
    setResults([])
    const testResults: TestResult[] = []

    // Test 1: Conexión básica
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)

      if (error) {
        testResults.push({
          success: false,
          message: `Error de conexión: ${error.message}`,
        })
      } else {
        testResults.push({
          success: true,
          message: 'Conexión exitosa',
          data: data?.[0],
        })
      }
    } catch (error) {
      testResults.push({
        success: false,
        message: `Error crítico: ${error}`,
      })
    }

    // Test 2: Consulta de empleados
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, role')
        .limit(3)

      if (error) {
        testResults.push({
          success: false,
          message: `Error consultando empleados: ${error.message}`,
        })
      } else {
        testResults.push({
          success: true,
          message: `Empleados encontrados: ${data?.length || 0}`,
          data: data,
        })
      }
    } catch (error) {
      testResults.push({
        success: false,
        message: `Error en empleados: ${error}`,
      })
    }

    // Test 3: Configuraciones
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('system_settings')
        .select('category, key, value')
        .eq('is_public', true)
        .limit(3)

      if (error) {
        testResults.push({
          success: false,
          message: `Error en configuraciones: ${error.message}`,
        })
      } else {
        testResults.push({
          success: true,
          message: `Configuraciones encontradas: ${data?.length || 0}`,
          data: data,
        })
      }
    } catch (error) {
      testResults.push({
        success: false,
        message: `Error en configuraciones: ${error}`,
      })
    }

    setResults(testResults)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Test de Conexión Supabase
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Esta página verifica que Supabase esté configurado correctamente.
              <br />
              <strong>Eliminar después de confirmar que todo funciona.</strong>
            </p>
            
            <button
              onClick={runTests}
              disabled={isLoading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? 'Ejecutando Tests...' : 'Ejecutar Tests'}
            </button>
          </div>

          {/* Resultados */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 Resultados:
              </h2>
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">
                      {result.success ? '✅' : '❌'}
                    </span>
                    <h3 className="font-semibold">
                      Test {index + 1}: {result.message}
                    </h3>
                  </div>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Ver datos →
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}

              {/* Resumen */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  📈 Resumen:
                </h3>
                <p className="text-blue-700">
                  {results.filter(r => r.success).length} de {results.length} tests exitosos
                </p>
                
                {results.every(r => r.success) && (
                  <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
                    <p className="text-green-800 font-semibold">
                      🎉 ¡Todos los tests pasaron! Supabase está configurado correctamente.
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Ya puedes proceder con el desarrollo del sistema de autenticación.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de configuración */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">
              ⚙️ Configuración Actual:
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No configurada'}
              </p>
              <p>
                <strong>Anon Key:</strong> {
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                    ? '✅ Configurada' 
                    : '❌ No configurada'
                }
              </p>
              <p>
                <strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'No configurada'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
