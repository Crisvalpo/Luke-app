import { supabase } from '@/lib/supabase'
import type { Isometrico, IsometricoRevision, Spool, Joint, Material } from '@/types/engineering'
import { calculateDiff, saveImpacts } from './impact-analysis'

// --- ISOMETRICOS ---

export async function getIsometrics(projectId: string) {
    const { data, error } = await supabase
        .from('isometrics')
        .select(`
            *,
            revisions:isometric_revisions(
                id, codigo, estado, fecha_emision, pdf_url, fecha_anuncio, description
            )
        `)
        .eq('proyecto_id', projectId)
        .order('codigo', { ascending: true })

    if (error) throw error
    return data
}

export async function createIsometric(projectId: string, codigo: string, metadata: Partial<Isometrico> = {}) {
    const { data: existing } = await supabase
        .from('isometrics')
        .select('id')
        .eq('proyecto_id', projectId)
        .eq('codigo', codigo)
        .single()

    if (existing) return existing

    const { data, error } = await supabase
        .from('isometrics')
        .insert({
            proyecto_id: projectId,
            codigo,
            ...metadata
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// --- REVISIONES ---

export async function createRevision(isometricId: string, codigo: string, status: 'PENDIENTE' | 'VIGENTE' = 'PENDIENTE') {
    const { data, error } = await supabase
        .from('isometric_revisions')
        .insert({
            isometric_id: isometricId,
            codigo,
            estado: status,
            fecha_emision: new Date().toISOString()
        })
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getRevisionDetails(revisionId: string) {
    const { data, error } = await supabase
        .from('isometric_revisions')
        .select(`
            *,
            isometric:isometrics(*),
            spools(*),
            joints(*),
            materials(*)
        `)
        .eq('id', revisionId)
        .single()

    if (error) throw error
    return data
}

export async function getLatestRevision(isometricId: string) {
    const { data, error } = await supabase
        .from('isometric_revisions')
        .select(`
            *,
            spools(*),
            joints(*)
        `)
        .eq('isometric_id', isometricId)
        .eq('estado', 'VIGENTE')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

// --- BULK UPLOAD HELPERS ---

export async function uploadSpools(revisionId: string, spools: Partial<Spool>[]) {
    const spoolsToInsert = spools.map(s => ({ ...s, revision_id: revisionId }))
    const { data, error } = await supabase.from('spools').insert(spoolsToInsert).select()
    if (error) throw error
    return data
}

export async function uploadJoints(revisionId: string, joints: Partial<Joint>[]) {
    const jointsToInsert = joints.map(j => ({ ...j, revision_id: revisionId }))
    const { data, error } = await supabase.from('joints').insert(jointsToInsert).select()
    if (error) throw error
    return data
}

export async function uploadMaterials(revisionId: string, materials: Partial<Material>[]) {
    const materialsToInsert = materials.map(m => ({ ...m, revision_id: revisionId }))
    const { data, error } = await supabase.from('materials').insert(materialsToInsert).select()
    if (error) throw error
    return data
}

// --- ORCHESTRATOR: IMPORT SPOOLGEN DATA ---

interface SpoolGenData {
    isometricCode: string;
    revisionCode: string;

    // Raw Data from Excel Sheets
    bolted_joints: any[];
    spools_welds: any[];
    material_take_off: any[];
}

export async function processSpoolGenImport(projectId: string, importData: SpoolGenData) {
    try {
        // 1. Get Isometric
        // We expect the Isometric to exist from the Announcement
        const { data: iso } = await supabase
            .from('isometrics')
            .select('id, codigo')
            .eq('proyecto_id', projectId)
            .eq('codigo', importData.isometricCode)
            .single()

        if (!iso) {
            throw new Error(`El Isométrico ${importData.isometricCode} no existe. Debe cargarse primero en el Anuncio de Revisiones.`)
        }

        // 2. Get Current VIGENTE Revision
        const previousRev = await getLatestRevision(iso.id)

        if (!previousRev) {
            throw new Error(`El Isométrico ${importData.isometricCode} no tiene una revisión VIGENTE activa.`)
        }

        // 3. Validate Revision Code
        // The SpoolGen file must match the VIGENTE revision
        if (String(previousRev.codigo) !== String(importData.revisionCode)) {
            throw new Error(`La revisión del archivo SpoolGen (${importData.revisionCode}) no coincide con la revisión VIGENTE del sistema (${previousRev.codigo}).`)
        }

        const rev = previousRev // We use the existing revision
        console.log(`Using existing VIGENTE revision: ${rev.codigo} (${rev.id})`)

        // --- TRANSFORM DATA ---

        // A. Extract Unique Spools from MTO
        // We use a Map to ensure uniqueness by spool_number
        const uniqueSpoolsMap = new Map<string, Partial<Spool>>()

        importData.material_take_off.forEach(item => {
            if (item.spool_number && !uniqueSpoolsMap.has(item.spool_number)) {
                uniqueSpoolsMap.set(item.spool_number, {
                    nombre: item.spool_number,
                    sheet: item.sheet,
                    piping_class: item.piping_class,
                    fab_location: item.fab,
                    // Default values
                    requiere_pwht: false, // Logic to detect PWHT could be added here if data exists
                    requiere_pintura: false
                })
            }
        })

        const spoolsList = Array.from(uniqueSpoolsMap.values())

        // B. Prepare Joints (Welds + Bolted)
        const jointsList: Partial<Joint>[] = []

        // Welds
        importData.spools_welds.forEach(w => {
            jointsList.push({
                tag: w.weld_number,
                joint_category: 'WELD',
                tipo: w.weld_type,
                diametro_pulg: parseFloat(w.nps?.replace('"', '') || '0'),
                cedula: w.sch,
                thickness: parseFloat(w.thickness || '0'),
                material: w.material,
                categoria: w.destination === 'CAMPO' ? 'FIELD' : 'SHOP',
                sheet: w.sheet,
                // Temporary link by name, will resolve to ID later
                spool_id: w.spool_number as any
            })
        })

        // Bolted Joints
        importData.bolted_joints.forEach(b => {
            jointsList.push({
                tag: b.flanged_joint_number,
                joint_category: 'BOLT',
                diametro_pulg: parseFloat(b.nps?.replace('"', '') || '0'),
                rating: b.rating,
                bolt_size: b.bolt_size,
                material: b.material,
                sheet: b.sheet,
                categoria: 'FIELD' // Usually bolted joints are assembled in field or shop, assuming field for now or logic needed
            })
        })

        // 4. Perform Impact Analysis (If previous revision exists)
        if (previousRev) {
            console.log('Performing Impact Analysis...')
            // Note: We need to adapt calculateDiff to handle the new fields if we want deep comparison
            // For now, we use the existing logic which compares names/tags
            const diff = calculateDiff(
                previousRev.spools,
                spoolsList,
                previousRev.joints,
                jointsList
            )
            await saveImpacts(rev.id, diff)

            // Mark previous revision as OBSOLETE
            await supabase
                .from('isometric_revisions')
                .update({ estado: 'OBSOLETA' })
                .eq('id', previousRev.id)
        }

        // 5. Upload Spools
        let createdSpoolsMap = new Map<string, string>() // Name -> ID
        if (spoolsList.length > 0) {
            const createdSpools = await uploadSpools(rev.id, spoolsList)
            if (createdSpools) {
                createdSpools.forEach(s => createdSpoolsMap.set(s.nombre, s.id))
            }
        }

        // 6. Upload Joints (Resolving Spool IDs)
        const finalJoints = jointsList.map(j => ({
            ...j,
            spool_id: j.spool_id ? (createdSpoolsMap.get(j.spool_id as unknown as string) || undefined) : undefined
        }))

        if (finalJoints.length > 0) {
            await uploadJoints(rev.id, finalJoints)
        }

        // 7. Upload Materials (Resolving Spool IDs)
        const materialsList = importData.material_take_off.map(m => ({
            item_code: m.item_code,
            descripcion: m.item_code, // Or infer description
            qty: m.qty,
            qty_unit: m.qty_unit,
            piping_class: m.piping_class,
            spool_id: m.spool_number ? (createdSpoolsMap.get(m.spool_number) || undefined) : undefined
        }))

        if (materialsList.length > 0) {
            await uploadMaterials(rev.id, materialsList)
        }

        return { success: true, revisionId: rev.id, impactsDetected: !!previousRev }

    } catch (error: any) {
        console.error('Import Error:', error)
        return { success: false, message: error.message }
    }
}
