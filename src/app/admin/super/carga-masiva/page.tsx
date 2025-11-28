'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getCurrentUser } from '@/services/auth'
import { getAllProyectos } from '@/services/proyectos'
import { downloadTemplate } from '@/lib/utils/templates'
import type { ProyectoWithEmpresa } from '@/types'

function CargaMasivaContent() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [reportType, setReportType] = useState('isometricos')
    const [projectId, setProjectId] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [userRole, setUserRole] = useState<string>('')
    const [userProjectId, setUserProjectId] = useState<string | null>(null)
    const [tipoDatos, setTipoDatos] = useState<string>('lukeapp')
    const [loading2, setLoading2] = useState(true)
    const [projects, setProjects] = useState<ProyectoWithEmpresa[]>([])

    useEffect(() => {
        async function loadUserInfo() {
            const user = await getCurrentUser()
            if (user) {
                setUserRole(user.rol)
                setUserProjectId(user.proyecto_id || null)

                if (user.rol === 'SUPER_ADMIN') {
                    // Cargar lista de proyectos para el select
                    const allProjects = await getAllProyectos()
                    setProjects(allProjects)
                } else if (user.proyecto_id) {
                    // Si es Admin de Proyecto, pre-cargar su proyecto y verificar tipo de datos
                    setProjectId(user.proyecto_id)

                    // Obtener el tipo de datos de la empresa del proyecto
                    try {
                        const response = await fetch(`/api/proyectos/${user.proyecto_id}`)
                        if (response.ok) {
                            const data = await response.json()
                            setTipoDatos(data.empresa?.tipo_datos || 'lukeapp')
                        }
                    } catch (error) {
                        console.error('Error al obtener tipo de datos:', error)
                    }
                }
            }
            setLoading2(false)
        }
        loadUserInfo()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file || !projectId) {
            alert('Por favor selecciona un archivo y especifica el ID del proyecto')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('projectId', projectId)
            formData.append('reportType', reportType)

            const response = await fetch('/api/upload-data', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (response.ok) {
                setResult(data)
                alert('✅ Carga exitosa: ' + data.message)
            } else {
                alert('❌ Error: ' + data.error)
            }
        } catch (error: any) {
            alert('❌ Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const isSuperAdmin = userRole === 'SUPER_ADMIN'

    // Si el proyecto no usa Supabase, mostrar mensaje
    if (!loading2 && !isSuperAdmin && tipoDatos !== 'lukeapp') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 flex items-center justify-center">
                <div className="max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
                    <div className="text-center">
                        <svg className="mx-auto h-16 w-16 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-2">Carga Masiva No Disponible</h2>
                        <p className="text-gray-300 mb-4">
                            Tu proyecto utiliza <span className="font-bold text-yellow-400">{tipoDatos === 'sharepoint' ? 'SharePoint' : 'Google Sheets'}</span> como origen de datos.
                        </p>
                        <p className="text-gray-400 text-sm mb-6">
                            Los datos deben cargarse directamente en {tipoDatos === 'sharepoint' ? 'tu SharePoint' : 'tus hojas de Google'}.
                            LUKEAPP solo lee los datos desde allí.
                        </p>
                        <button
                            onClick={() => router.push('/admin/proyecto')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            Volver al Panel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (loading2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(isSuperAdmin ? '/admin/super' : '/admin/proyecto')}
                        className="text-gray-300 hover:text-white mb-2 flex items-center text-sm"
                    >
                        ← Volver al Panel
                    </button>
                    <h1 className="text-3xl font-bold text-white">Carga Masiva de Datos</h1>
                    <p className="text-gray-400">
                        {isSuperAdmin
                            ? 'Importa datos desde archivos Excel de SpoolGen a cualquier proyecto con origen Supabase'
                            : 'Importa datos desde archivos Excel de SpoolGen a tu proyecto'}
                    </p>
                </div>

                {/* Formulario */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
                    <div className="space-y-6">
                        {/* Tipo de Reporte */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tipo de Reporte
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="isometricos" className="bg-gray-900 text-white">1. Lista de Isométricos</option>
                                <option value="spools" className="bg-gray-900 text-white">2. Lista de Spools</option>
                                <option value="welds" className="bg-gray-900 text-white">3. Juntas Soldadas (Welds)</option>
                                <option value="mto" className="bg-gray-900 text-white">Materiales (MTO)</option>
                                <option value="flanges" className="bg-gray-900 text-white">Uniones Enflanchadas</option>
                                <option value="valvulas" className="bg-gray-900 text-white">Válvulas</option>
                                <option value="soportes" className="bg-gray-900 text-white">Soportes</option>
                            </select>
                            <button
                                onClick={() => downloadTemplate(reportType)}
                                className="mt-2 text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Descargar plantilla para {
                                    reportType === 'isometricos' ? 'Isométricos' :
                                        reportType === 'spools' ? 'Spools' :
                                            reportType === 'welds' ? 'Juntas' :
                                                reportType === 'mto' ? 'Materiales' :
                                                    reportType === 'flanges' ? 'Flanges' :
                                                        reportType === 'valvulas' ? 'Válvulas' : 'Soportes'
                                }
                            </button>
                        </div>

                        {/* ID del Proyecto (Select para SuperAdmin, Input readonly para otros) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isSuperAdmin ? 'Seleccionar Proyecto' : 'Tu Proyecto'}
                            </label>

                            {isSuperAdmin ? (
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="" className="bg-gray-900 text-gray-400">-- Selecciona un proyecto --</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id} className="bg-gray-900 text-white">
                                            {p.empresa?.nombre} - {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={projectId}
                                        readOnly
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 opacity-70 cursor-not-allowed"
                                    />
                                    {userProjectId && (
                                        <p className="text-xs text-green-400 mt-1">
                                            ✓ Los datos se cargarán automáticamente a tu proyecto
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Selector de Archivo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Archivo Excel
                            </label>
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="text-gray-400">
                                        {file ? (
                                            <div>
                                                <p className="text-white font-medium">{file.name}</p>
                                                <p className="text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <p className="mt-2">Haz clic para seleccionar un archivo</p>
                                                <p className="text-xs">Excel (.xlsx, .xls) o CSV</p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Botón de Carga */}
                        <button
                            onClick={handleUpload}
                            disabled={loading || !file || !projectId}
                            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Procesando...' : 'Cargar Datos'}
                        </button>
                    </div>

                    {/* Resultado */}
                    {result && (
                        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <h3 className="text-green-300 font-medium mb-2">Resultado de la Carga</h3>
                            <pre className="text-sm text-gray-300 overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CargaMasivaPage() {
    return (
        <ProtectedRoute requireAuth requireActive>
            <CargaMasivaContent />
        </ProtectedRoute>
    )
}
