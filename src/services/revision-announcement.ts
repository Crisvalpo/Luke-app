import { supabase } from '@/lib/supabase'
import { createIsometric, createRevision } from './engineering'
import type { AnnouncementRow, AnnouncementExcelRow, RevisionFile } from '@/types/engineering'

/**
 * Convierte fechas de Excel a ISO string de manera segura
 */
function safeExcelDateToISO(excelDate: any): string | null {
    if (!excelDate) return null

    try {
        // Si ya es una fecha válida en formato string
        if (typeof excelDate === 'string' && excelDate.includes('-')) {
            const date = new Date(excelDate)
            return isNaN(date.getTime()) ? null : date.toISOString()
        }

        // Si es un número serial de Excel (días desde 1900-01-01)
        if (typeof excelDate === 'number') {
            // Excel serial date: días desde 1899-12-30
            const excelEpoch = new Date(1899, 11, 30)
            const date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000)
            return isNaN(date.getTime()) ? null : date.toISOString()
        }

        // Intentar conversión directa
        const date = new Date(excelDate)
        return isNaN(date.getTime()) ? null : date.toISOString()
    } catch (error) {
        console.warn('Error converting date:', excelDate, error)
        return null
    }
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

            const { data: iso, error: isoError } = await supabase
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
                // Verificar si la revisión existe
                const { data: existingRev } = await supabase
                    .from('isometric_revisions')
                    .select('id')
                    .eq('isometric_id', isometricId)
                    .eq('codigo', row.revision_number)
                    .single()

                const revisionData = {
                    revision_number: row.revision_number,
                    client_file_code: row.client_file_code || null,
                    client_revision_code: row.client_revision_code || null,
                    transmittal_code: row.transmittal_code || null,
                    transmittal_number: row.transmittal_number || null,
                    transmittal_date: safeExcelDateToISO(row.transmittal_date),
                    spooling_status: row.spooling_status || null,
                    spooling_date: safeExcelDateToISO(row.spooling_date),
                    spooling_sent_date: safeExcelDateToISO(row.spooling_sent_date),
                    total_joints_count: row.total_joints_count || null,
                    executed_joints_count: row.executed_joints_count || null,
                    pending_joints_count: row.pending_joints_count || null,
                    comment: row.comment || null
                }

                if (existingRev) {
                    // Actualizar revisión existente
                    await supabase
                        .from('isometric_revisions')
                        .update(revisionData)
                        .eq('id', existingRev.id)
                } else {
                    // Crear nueva revisión
                    await supabase
                        .from('isometric_revisions')
                        .insert({
                            isometric_id: isometricId,
                            codigo: row.revision_number,
                            estado: 'PENDIENTE',
                            fecha_emision: new Date().toISOString(),
                            ...revisionData
                        })
                }
            }

            // 3. Determinar VIGENTE (Revisión más alta)
            const { data: allRevs } = await supabase
                .from('isometric_revisions')
                .select('id, codigo, revision_number')
                .eq('isometric_id', isometricId)

            if (allRevs && allRevs.length > 0) {
                // Ordenar por número de revisión (intentar numérico, fallback a string)
                const sortedRevs = allRevs.sort((a, b) => {
                    const revA = a.revision_number || a.codigo
                    const revB = b.revision_number || b.codigo
                    const numA = parseInt(revA)
                    const numB = parseInt(revB)
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
                    return revA.localeCompare(revB)
                })

                const latestRev = sortedRevs[sortedRevs.length - 1]

                // Marcar la última como VIGENTE
                await supabase
                    .from('isometric_revisions')
                    .update({ estado: 'VIGENTE' })
                    .eq('id', latestRev.id)

                // Marcar las demás como OBSOLETA
                const otherIds = sortedRevs.filter(r => r.id !== latestRev.id).map(r => r.id)
                if (otherIds.length > 0) {
                    await supabase
                        .from('isometric_revisions')
                        .update({ estado: 'OBSOLETA' })
                        .in('id', otherIds)
                }

                // Actualizar puntero current_revision_id
                await supabase
                    .from('isometrics')
                    .update({ current_revision_id: latestRev.id })
                    .eq('id', isometricId)
            }

            results.processed++

        } catch (error: any) {
            console.error(`Error procesando ISO ${isoCode}:`, error)
            results.errors++
            results.details.push(`ISO ${isoCode}: ${error.message}`)
        }
    }

    return results
}

/**
 * Sube un archivo PDF/IDF para una revisión específica
 */
export async function uploadRevisionFile(
    revisionId: string,
    fileUrl: string,
    fileType: 'pdf' | 'idf' | 'dwg' | 'other' = 'pdf',
    fileName?: string,
    isPrimary: boolean = false
): Promise<RevisionFile | null> {
    try {
        // Obtener el siguiente version_number para esta revisión
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

        // Si este archivo se marca como primario, desmarcar los demás
        if (isPrimary) {
            await supabase
                .from('revision_files')
                .update({ is_primary: false })
                .eq('revision_id', revisionId)
                .eq('file_type', fileType)
        }

        // Insertar el nuevo archivo
        const { data, error } = await supabase
            .from('revision_files')
            .insert({
                revision_id: revisionId,
                file_url: fileUrl,
                file_type: fileType,
                file_name: fileName,
                version_number: nextVersion,
                is_primary: isPrimary
            })
            .select()
            .single()

        if (error) throw error
        return data as RevisionFile

    } catch (error: any) {
        console.error('Error al subir archivo de revisión:', error)
        return null
    }
}

/**
 * Obtiene todos los archivos de una revisión
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

    return data as RevisionFile[]
}
