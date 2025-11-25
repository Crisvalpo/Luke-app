'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUserCount } from '@/services/stats'

export default function Home() {
  const [count, setCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      const total = await getUserCount()
      setCount(total)
    }
    fetchCount()
  }, [])

  // Animación del contador
  useEffect(() => {
    if (count === 0) return

    const duration = 2000 // 2 segundos
    const steps = 60
    const increment = count / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= count) {
        setDisplayCount(count)
        clearInterval(timer)
      } else {
        setDisplayCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [count])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto text-center">
        {/* Hero Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-6 md:p-12 mb-8 relative overflow-hidden">

          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mb-6 shadow-lg">
            <svg
              className="w-16 h-16 md:w-20 md:h-20 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight break-words">
            Bienvenido a <br className="md:hidden" />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">LukeAPP</span>
          </h1>

          <p className="text-lg md:text-xl text-purple-200 mb-8 max-w-2xl mx-auto px-2">
            Tu plataforma de gestión moderna y segura. Comienza tu viaje hoy y descubre todas las posibilidades.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-200"
            >
              Crear Cuenta
            </Link>

            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transform hover:scale-105 transition-all duration-200"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl inline-block mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Seguro</h3>
            <p className="text-purple-200">Tus datos están protegidos con la mejor tecnología de encriptación</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl inline-block mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Rápido</h3>
            <p className="text-purple-200">Experiencia fluida y optimizada para máxima velocidad</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl inline-block mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fácil</h3>
            <p className="text-purple-200">Interfaz intuitiva diseñada para tu comodidad</p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl inline-block mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Comunidad</h3>
            <div className="text-purple-200">
              <span className="text-3xl font-bold text-white tabular-nums block mb-1">{displayCount.toLocaleString()}</span>
              Usuarios Registrados
            </div>
          </div>
        </div>

        <div className="mt-8 text-purple-300 text-sm">
          <p>🚀 Construido con Next.js y Supabase</p>
        </div>
      </div>
    </div>
  )
}
