import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    parseExcelFile,
    normalizeWelds,
    normalizeMTO,
    normalizeFlangedJoints,
    normalizeValvulas,
    normalizeSoportes
} from '@/lib/utils/excel-parser';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string;
        const reportType = formData.get('reportType') as string; // 'welds', 'mto', 'flanges', 'valvulas', 'soportes'

        if (!file || !projectId || !reportType) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos' },
                { status: 400 }
            );
        }

        // Parsear el archivo Excel
        const rawData = await parseExcelFile(file, reportType);

        // Inicializar Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let result;

        switch (reportType) {
            case 'isometricos':
                result = await processIsometricos(supabase, rawData, projectId);
                break;
            case 'spools':
                result = await processSpools(supabase, rawData, projectId);
                break;
            case 'welds':
                result = await processWelds(supabase, rawData, projectId);
                break;
            case 'mto':
                result = await processMTO(supabase, rawData, projectId);
                break;
            case 'flanges':
                result = await processFlangedJoints(supabase, rawData, projectId);
                break;
            case 'valvulas':
                result = await processValvulas(supabase, rawData, projectId);
                break;
            case 'soportes':
                result = await processSoportes(supabase, rawData, projectId);
                break;
            default:
                return NextResponse.json(
                    { error: 'Tipo de reporte no soportado' },
                    { status: 400 }
                );
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error en carga masiva:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Procesa y carga datos de Isométricos
 */
async function processIsometricos(supabase: any, rawData: any[], projectId: string) {
    const { normalizeIsometricos } = await import('@/lib/utils/excel-parser');
    const normalized = normalizeIsometricos(rawData, projectId);

    const { data: isos, error: isoError } = await supabase
        .from('isometricos')
        .upsert(normalized, {
            onConflict: 'proyecto_id,iso_number',
            ignoreDuplicates: false
        })
        .select();

    if (isoError) throw new Error(`Error al insertar isométricos: ${isoError.message}`);

    return {
        success: true,
        message: `Carga exitosa: ${isos.length} isométricos`,
        stats: {
            isometricos: isos.length
        }
    };
}

/**
 * Procesa y carga datos de Spools
 */
async function processSpools(supabase: any, rawData: any[], projectId: string) {
    const { normalizeSpools } = await import('@/lib/utils/excel-parser');
    const normalized = normalizeSpools(rawData, projectId);

    // Obtener todos los isométricos del proyecto para mapear
    const { data: isos, error: isoError } = await supabase
        .from('isometricos')
        .select('id, iso_number')
        .eq('proyecto_id', projectId);

    if (isoError) throw new Error(`Error al obtener isométricos: ${isoError.message}`);

    const isoIdMap = new Map(isos.map((iso: any) => [iso.iso_number, iso.id]));

    // Preparar spools con isometrico_id
    const spoolsToInsert = normalized.map(spool => {
        const isometricoId = isoIdMap.get(spool.iso_number);
        if (!isometricoId) {
            throw new Error(`Isométrico no encontrado: ${spool.iso_number}. Debes cargar los isométricos primero.`);
        }

        return {
            proyecto_id: spool.proyecto_id,
            spool_tag: spool.spool_tag,
            spool_full_id: `${spool.iso_number}-${spool.spool_tag}`,
            isometrico_id: isometricoId,
            line_number: spool.line_number,
            revision: spool.revision,
            weight: spool.weight,
            diameter: spool.diameter
        };
    });

    const { data: spools, error: spoolError } = await supabase
        .from('spools')
        .upsert(spoolsToInsert, {
            onConflict: 'proyecto_id,spool_full_id',
            ignoreDuplicates: false
        })
        .select();

    if (spoolError) throw new Error(`Error al insertar spools: ${spoolError.message}`);

    return {
        success: true,
        message: `Carga exitosa: ${spools.length} spools`,
        stats: {
            spools: spools.length
        }
    };
}

/**
 * Procesa y carga datos de Welds (Juntas)
 * IMPORTANTE: Los spools deben existir previamente
 */
async function processWelds(supabase: any, rawData: any[], projectId: string) {
    const normalized = normalizeWelds(rawData, projectId);

    // Obtener todos los spools del proyecto
    const { data: spools, error: spoolError } = await supabase
        .from('spools')
        .select('id, spool_tag')
        .eq('proyecto_id', projectId);

    if (spoolError) throw new Error(`Error al obtener spools: ${spoolError.message}`);

    const spoolIdMap = new Map(spools.map((spool: any) => [spool.spool_tag, spool.id]));

    // Preparar juntas con spool_id
    const juntasToInsert = normalized
        .map(junta => {
            const spoolId = spoolIdMap.get(junta.spool_number);
            if (!spoolId) {
                console.warn(`Spool no encontrado: ${junta.spool_number}. Ignorando junta ${junta.weld_number}`);
                return null;
            }

            return {
                proyecto_id: junta.proyecto_id,
                spool_id: spoolId,
                weld_number: junta.weld_number,
                type_weld: junta.type_weld,
                nps: junta.nps,
                sch: junta.sch,
                thickness: junta.thickness,
                piping_class: junta.piping_class,
                material: junta.material,
                destination: junta.destination,
                sheet: junta.sheet
            };
        })
        .filter(j => j !== null); // Filtrar juntas sin spool

    if (juntasToInsert.length === 0) {
        throw new Error('No se encontraron spools para ninguna de las juntas. Debes cargar los spools primero.');
    }

    const { data: insertedJuntas, error: juntasError } = await supabase
        .from('juntas')
        .upsert(juntasToInsert, {
            onConflict: 'spool_id,weld_number',
            ignoreDuplicates: false
        })
        .select();

    if (juntasError) throw new Error(`Error al insertar juntas: ${juntasError.message}`);

    const skipped = normalized.length - juntasToInsert.length;

    return {
        success: true,
        message: `Carga exitosa: ${insertedJuntas.length} juntas${skipped > 0 ? ` (${skipped} ignoradas por falta de spool)` : ''}`,
        stats: {
            juntas: insertedJuntas.length,
            ignoradas: skipped
        }
    };
}

/**
 * Procesa y carga datos de MTO (Materiales)
 */
async function processMTO(supabase: any, rawData: any[], projectId: string) {
    const normalized = normalizeMTO(rawData, projectId);

    // Similar al proceso de welds, pero insertando en materiales
    // Por brevedad, implementación simplificada

    return {
        success: true,
        message: `Procesamiento de MTO en desarrollo`,
        stats: { materiales: normalized.length }
    };
}

/**
 * Procesa y carga datos de Flanged Joints
 */
async function processFlangedJoints(supabase: any, rawData: any[], projectId: string) {
    const normalized = normalizeFlangedJoints(rawData, projectId);

    return {
        success: true,
        message: `Procesamiento de Flanges en desarrollo`,
        stats: { flanges: normalized.length }
    };
}

/**
 * Procesa y carga datos de Válvulas
 */
async function processValvulas(supabase: any, rawData: any[], projectId: string) {
    const normalized = normalizeValvulas(rawData, projectId);

    return {
        success: true,
        message: `Procesamiento de Válvulas en desarrollo`,
        stats: { valvulas: normalized.length }
    };
}

/**
 * Procesa y carga datos de Soportes
 */
async function processSoportes(supabase: any, rawData: any[], projectId: string) {
    const normalized = normalizeSoportes(rawData, projectId);

    return {
        success: true,
        message: `Procesamiento de Soportes en desarrollo`,
        stats: { soportes: normalized.length }
    };
}
