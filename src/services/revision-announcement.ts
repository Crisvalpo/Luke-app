import { supabase } from '@/lib/supabase'
import type { AnnouncementRow, AnnouncementExcelRow, RevisionFile } from '@/types/engineering'

/**
 * Convierte fechas de Excel a ISO string de manera segura
 */
function safeExcelDateToISO(excelDate: any): string | null {
    if (!excelDate) return null

    // Si es 0 o vacío, retornar null
    if (excelDate === 0 || excelDate === '' || excelDate === null || excelDate === undefined) {
        return null
    }

    try {
        // Si ya es una fecha válida en formato string
        if (typeof excelDate === 'string') {
            // Verificar si es una fecha en formato ISO o similar
            if (excelDate.includes('-') || excelDate.includes('/')) {
                const date = new Date(excelDate)
                if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                    return date.toISOString()
                }
            }
            // Si es un string numérico, intentar parsearlo
            const numValue = parseFloat(excelDate)
            if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
                excelDate = numValue
            } else {
                return null
            }
        }

        // Si es un número serial de Excel (días desde 1900-01-01)
        if (typeof excelDate === 'number') {
            // Validar que el número esté en un rango razonable
            // Excel serial dates: 1 = 1900-01-01, ~45000 = 2023
            if (excelDate < 1 || excelDate > 100000) {
                console.warn('Excel date out of valid range:', excelDate)
                return null
            }

            // Excel serial date: días desde 1899-12-30
            const excelEpoch = new Date(1899, 11, 30)
            const date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000)

            // Validar que la fecha resultante sea razonable
            if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2100) {
                console.warn('Converted date out of valid range:', date)
                return null
            }

            return date.toISOString()
        }

        return null
    } catch (error) {
        console.warn('Error converting date:', excelDate, error)
        return null
    }
}

/**
 * Convierte fechas de Excel a formato DATE de PostgreSQL (YYYY-MM-DD)
 */
function safeExcelDateToSQL(excelDate: any): string | null {
    const isoString = safeExcelDateToISO(excelDate)
    if (!isoString) return null

    // Extraer solo la parte de fecha (YYYY-MM-DD)
    return isoString.split('T')[0]
}

/**
 * Normaliza las columnas del Excel del cliente al modelo de datos
 */
export function normalizeAnnouncementRow(excelRow: AnnouncementExcelRow): AnnouncementRow {
    return {
        iso_number: String(excelRow['N°ISOMÉTRICO'] || ''),
        line_number: String(excelRow['N° LÍNEA'] || ''),
        revision_number: String(excelRow['REV. ISO'] || '0'),
        line_type: String(excelRow['TIPO LÍNEA'] || ''),
        area: String(excelRow['ÁREA'] || ''),
        sub_area: String(excelRow['SUB-ÁREA'] || ''),

        client_file_code: String(excelRow['ARCHIVO'] || ''),
        client_revision_code: String(excelRow['REV. ARCHIVO'] || ''),

        transmittal_code: String(excelRow['TML'] || ''),
        transmittal_number: String(excelRow['N° TML'] || ''),
        transmittal_date: excelRow['FECHA'] ? String(excelRow['FECHA']) : undefined,

        has_pdf: excelRow['FORMATO PDF'] === 1 || excelRow['FORMATO PDF'] === '1',
        has_idf: excelRow['FORMATO IDF'] === 1 || excelRow['FORMATO IDF'] === '1',

        spooling_status: String(excelRow['ESTADO SPOOLING'] || ''),
        spooling_date: excelRow['FECHA SPOOLING'] ? String(excelRow['FECHA SPOOLING']) : undefined,
        spooling_sent_date: excelRow['FECHA DE ENVIO'] ? String(excelRow['FECHA DE ENVIO']) : undefined,

        total_joints_count: excelRow['TOTAL'] ? Number(excelRow['TOTAL']) : undefined,
        executed_joints_count: excelRow['EJECUTADO'] ? Number(excelRow['EJECUTADO']) : undefined,
        pending_joints_count: excelRow['FALTANTES'] ? Number(excelRow['FALTANTES']) : undefined,

        comment: String(excelRow['COMENTARIO'] || '')
    }
}

/**
 * Procesa el anuncio de revisiones del cliente
 */
export async function processRevisionAnnouncement(projectId: string, excelRows: AnnouncementExcelRow[]) {
    // Validar projectId
    if (!projectId) {
        throw new Error('projectId es requerido para procesar el anuncio')
    }

    console.log('Processing announcement for project:', projectId)

    const results = {
        processed: 0,
        errors: 0,
        details: [] as string[]
    }

    // Normalizar las filas
    const rows = excelRows.map(normalizeAnnouncementRow).filter(r => r.iso_number)

    if (rows.length === 0) {
        results.details.push('No se encontraron filas válidas con N°ISOMÉTRICO')
        return results
    }

    console.log(`Normalized ${rows.length} rows`)

    // Agrupar por isométrico
    const isoGroups = new Map<string, AnnouncementRow[]>()

    rows.forEach(row => {
        const list = isoGroups.get(row.iso_number) || []
        list.push(row)
        isoGroups.set(row.iso_number, list)
    })

    for (const [isoCode, isoRows] of isoGroups) {
        try {
            // 1. Obtener o Crear Isométrico con metadata completa
            const firstRow = isoRows[0]

            const { data: iso } = await supabase
                .from('isometrics')
                .select('id, codigo')
                .eq('proyecto_id', projectId)
                .eq('codigo', isoCode)
                .single()

            let isometricId: string

            if (!iso) {
                // Crear nuevo isométrico
                const { data: newIso, error: createError } = await supabase
                    .from('isometrics')
                    .insert({
                        proyecto_id: projectId,
                        codigo: isoCode,
                        line_number: firstRow.line_number || null,
                        area: firstRow.area || null,
                        sub_area: firstRow.sub_area || null,
                        line_type: firstRow.line_type || null
                    })
                    .select('id')
                    .single()

                if (createError) throw createError
                isometricId = newIso.id
            } else {
                isometricId = iso.id

                // Actualizar metadata si cambió
                await supabase
                    .from('isometrics')
                    .update({
                        line_number: firstRow.line_number || null,
                        area: firstRow.area || null,
                        sub_area: firstRow.sub_area || null,
                        line_type: firstRow.line_type || null
                    })
                    .eq('id', isometricId)
            }

            // 2. Procesar cada revisión
            for (const row of isoRows) {
                const revisionNumber = row.revision_number

                // A. Verificar si la revisión YA EXISTE para este isométrico
                const { data: existingRev } = await supabase
                    .from('isometric_revisions')
                    .select('id, codigo')
                    .eq('isometric_id', isometricId)
                    .eq('codigo', revisionNumber)
                    .single()

                if (existingRev) {
                    // REGLA DE NEGOCIO: No permitir carga duplicada. Omitir y alertar.
                    results.errors++
                    results.details.push(`⚠️ OMITIDO: El Isométrico ${isoCode} Revisión ${revisionNumber} ya existe. Edite la anterior si requiere cambios.`)
                    continue // Saltar a la siguiente revisión
                }

                // B. Preparar datos para NUEVA revisión
                const hasPdf = row.has_pdf === true || String(row.has_pdf) === '1'
                const hasIdf = row.has_idf === true || String(row.has_idf) === '1'

                const revisionData = {
                    isometric_id: isometricId,
                    codigo: revisionNumber,
                    fecha_emision: safeExcelDateToSQL(row.transmittal_date) || new Date().toISOString().split('T')[0],

                    // Trazabilidad de recepción
                    client_file_code: row.client_file_code || null,
                    client_revision_code: row.client_revision_code || null,
                    transmittal_code: row.transmittal_code || null,
                    transmittal_number: row.transmittal_number || null,
                    transmittal_date: safeExcelDateToSQL(row.transmittal_date),

                    // Estado de Spooling
                    spooling_status: row.spooling_status || 'PENDIENTE',
                    spooling_date: safeExcelDateToSQL(row.spooling_date),
                    spooling_sent_date: safeExcelDateToSQL(row.spooling_sent_date),

                    // Conteos
                    total_joints_count: row.total_joints_count || 0,
                    executed_joints_count: row.executed_joints_count || 0,
                    pending_joints_count: row.pending_joints_count || 0,

                    // Metadata adicional
                    comment: row.comment || null,
                    estado: 'VIGENTE',

                    // Flags de formato
                    has_pdf: hasPdf,
                    has_idf: hasIdf
                }

                // C. Insertar Nueva Revisión
                const { error: insertError } = await supabase
                    .from('isometric_revisions')
                    .insert(revisionData)

                if (insertError) {
                    results.errors++
                    results.details.push(`❌ Error creando revisión ${isoCode} Rev ${revisionNumber}: ${insertError.message}`)
                    continue
                }

                results.processed++
                results.details.push(`✅ Creada: ${isoCode} Rev ${revisionNumber}`)
            }

            // 3. Determinar VIGENTE (Revisión más alta)
            const { data: allRevs } = await supabase
                .from('isometric_revisions')
                .select('id, codigo, created_at')
                .eq('isometric_id', isometricId)
                .order('created_at', { ascending: true })

            if (allRevs && allRevs.length > 0) {
                const latestRev = allRevs[allRevs.length - 1]

                await supabase
                    .from('isometrics')
                    .update({ current_revision_id: latestRev.id })
                    .eq('id', isometricId)

                for (const rev of allRevs) {
                    const esVigente = rev.id === latestRev.id
                    await supabase
                        .from('isometric_revisions')
                        .update({ estado: esVigente ? 'VIGENTE' : 'OBSOLETA' })
                        .eq('id', rev.id)
                }
            }

        } catch (error: any) {
            console.error(`Error procesando ISO ${isoCode}:`, error)
            results.errors++
            results.details.push(`ISO ${isoCode}: ${error.message}`)
        }
    }

    return results
}

/**
 * Sube un archivo físico a Supabase Storage y lo registra en revision_files
 */
export async function uploadPDFToRevision(
    revisionId: string,
    file: File,
    fileType: 'pdf' | 'idf' | 'dwg' | 'other' = 'pdf',
    isPrimary: boolean = false
): Promise<{ success: boolean; message: string; file?: RevisionFile }> {
    try {
        const allowedTypes: Record<string, string[]> = {
            pdf: ['application/pdf'],
            idf: ['application/octet-stream', 'text/plain'],
            dwg: ['application/acad', 'application/x-acad', 'application/autocad_dwg', 'image/x-dwg']
        }

        if (fileType !== 'other' && !allowedTypes[fileType]?.some(type => file.type.includes(type) || file.name.toLowerCase().endsWith(`.${fileType}`))) {
            return { success: false, message: `El archivo debe ser de tipo ${fileType.toUpperCase()}` }
        }

        const timestamp = Date.now()
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const storagePath = `revisions/${revisionId}/${fileType}/${timestamp}_${sanitizedFileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('revision-files')
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Error uploading to storage:', uploadError)
            return { success: false, message: `Error al subir archivo: ${uploadError.message}` }
        }

        const { data: urlData } = await supabase.storage
            .from('revision-files')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

        if (!urlData?.signedUrl) {
            return { success: false, message: 'Error al generar URL del archivo' }
        }

        const { data: existingFiles } = await supabase
            .from('revision_files')
            .select('version_number')
            .eq('revision_id', revisionId)
            .eq('file_type', fileType)
            .order('version_number', { ascending: false })
            .limit(1)

        const nextVersion = existingFiles && existingFiles.length > 0
            ? existingFiles[0].version_number + 1
            : 1

        if (isPrimary) {
            await supabase
                .from('revision_files')
                .update({ is_primary: false })
                .eq('revision_id', revisionId)
                .eq('file_type', fileType)
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { data: dbFile, error: dbError } = await supabase
            .from('revision_files')
            .insert({
                revision_id: revisionId,
                file_url: storagePath,
                file_type: fileType,
                file_name: file.name,
                version_number: nextVersion,
                is_primary: isPrimary,
                file_size_bytes: file.size,
                uploaded_by: user?.id
            })
            .select()
            .single()

        if (dbError) {
            await supabase.storage.from('revision-files').remove([storagePath])
            return { success: false, message: `Error al registrar archivo: ${dbError.message}` }
        }

        return {
            success: true,
            message: 'Archivo subido exitosamente',
            file: dbFile as RevisionFile
        }

    } catch (error: any) {
        console.error('Error en uploadPDFToRevision:', error)
        return { success: false, message: error.message || 'Error desconocido al subir archivo' }
    }
}

/**
 * Obtiene todos los archivos de una revisión con URLs firmadas
 */
export async function getRevisionFiles(revisionId: string): Promise<RevisionFile[]> {
    const { data, error } = await supabase
        .from('revision_files')
        .select('*')
        .eq('revision_id', revisionId)
        .order('file_type', { ascending: true })
        .order('version_number', { ascending: true })

    if (error) {
        console.error('Error al obtener archivos:', error)
        return []
    }

    const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
            const { data: urlData } = await supabase.storage
                .from('revision-files')
                .createSignedUrl(file.file_url, 60 * 60 * 24)

            return {
                ...file,
                signed_url: urlData?.signedUrl || null
            }
        })
    )

    return filesWithUrls as RevisionFile[]
}
