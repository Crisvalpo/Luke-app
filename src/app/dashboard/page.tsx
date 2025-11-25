'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/services/auth'
import { User } from '@/types/user'

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadUser() {
            const currentUser = await getCurrentUser()
            if (!currentUser) {
                router.push('/login')
            } else {
                setUser(currentUser)
            }
            setLoading(false)
        }
        loadUser()
    }, [router])

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                            <p className="text-purple-200">Bienvenido de vuelta, {user.nombre}</p>
                        </div>
                        <div className="flex gap-3">
                            {user.rol?.toUpperCase() === 'ADMIN' && (
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                                >
                                    👨‍💼 Panel Admin
                                </button>
                            )}
                            <button
                                onClick={handleSignOut}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-200 rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Nombre Card */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Nombre</p>
                                <p className="text-white text-xl font-semibold">{user.nombre}</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Card */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Correo</p>
                                <p className="text-white text-lg font-semibold">{user.correo}</p>
                            </div>
                        </div>
                    </div>

                    {/* Teléfono Card */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Teléfono</p>
                                <p className="text-white text-lg font-semibold">{user.telefono}</p>
                            </div>
                        </div>
                    </div>

                    {/* Rol Card */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-200 hover:scale-105">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-purple-200 text-sm">Rol</p>
                                <p className="text-white text-lg font-semibold capitalize">{user.rol}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Información de la Cuenta</h2>
                    <div className="space-y-3 text-purple-100">
                        <p>✨ Tu cuenta está activa y verificada</p>
                        <p>🔒 Todos tus datos están protegidos con encriptación de nivel empresarial</p>
                        <p>📱 Puedes actualizar tu información en cualquier momento</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
