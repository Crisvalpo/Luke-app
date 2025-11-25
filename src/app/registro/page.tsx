'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/services/auth'
import Link from 'next/link'

export default function RegistroPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        password: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validar contraseñas
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            setLoading(false)
            return
        }

        // Agregar +56 automáticamente al teléfono
        const telefonoConPrefijo = `+56${formData.telefono.replace(/^\+56/, '')}`

        const response = await signUp({
            nombre: formData.nombre,
            correo: formData.correo,
            telefono: telefonoConPrefijo,
            rol: 'SOLO LECTURA', // Rol por defecto
            password: formData.password,
        })

        if (response.success) {
            router.push('/login')
        } else {
            // Mensaje amigable para correo duplicado
            if (response.message.includes('duplicate key') || response.message.includes('users_correo_key')) {
                setError('Este correo ya está registrado. Por favor, inicia sesión.')
            } else {
                setError(response.message)
            }
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
            <div className="w-full max-w-2xl">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-300 hover:scale-[1.01]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                            <svg
                                className="w-12 h-12 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">Crear Cuenta</h1>
                        <p className="text-purple-200">Únete a nosotros hoy</p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Nombre completo (full width) */}
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="block text-sm font-medium text-purple-100">
                                Nombre Completo
                            </label>
                            <input
                                id="nombre"
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="Juan Pérez"
                            />
                        </div>

                        {/* Email (full width) */}
                        <div className="space-y-2">
                            <label htmlFor="correo" className="block text-sm font-medium text-purple-100">
                                Correo Electrónico
                            </label>
                            <input
                                id="correo"
                                type="email"
                                required
                                value={formData.correo}
                                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="tu@email.com"
                            />
                        </div>

                        {/* Teléfono (Chile) */}
                        <div className="space-y-2">
                            <label htmlFor="telefono" className="block text-sm font-medium text-purple-100">
                                Teléfono (Chile)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-purple-300 font-medium">+56</span>
                                </div>
                                <input
                                    id="telefono"
                                    type="tel"
                                    required
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    className="block w-full pl-14 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="9 1234 5678"
                                    pattern="[0-9]{9}"
                                    title="Ingrese 9 dígitos sin espacios"
                                />
                            </div>
                            <p className="text-xs text-purple-300 mt-1">Ingrese solo los 9 dígitos sin el +56</p>
                        </div>

                        {/* Passwords en grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-purple-100">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-100">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Información sobre el rol */}
                        <div className="bg-blue-500/20 border border-blue-400/50 text-blue-200 px-4 py-3 rounded-xl">
                            <p className="text-sm">
                                ℹ️ Tu cuenta será creada con permisos de <strong>Solo Lectura</strong>. Un administrador te asignará tu rol definitivo según tus funciones en el proyecto.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Registrando...
                                </span>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-purple-200">
                            ¿Ya tienes cuenta?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-pink-400 hover:text-pink-300 transition-colors duration-200"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
