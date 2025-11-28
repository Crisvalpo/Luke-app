export type RevisionStatus = 'PENDIENTE' | 'VIGENTE' | 'OBSOLETA';
export type JointCategory = 'SHOP' | 'FIELD';
export type JointType = 'WELD' | 'BOLT';
export type FileType = 'pdf' | 'idf' | 'dwg' | 'other';
export type SpoolingStatus = 'PENDIENTE' | 'EN_PROCESO' | 'SPOOLEADO' | 'ENVIADO' | 'APROBADO';

export interface Isometrico {
    id: string;
    proyecto_id: string;
    codigo: string; // iso_number

    // Metadata de negocio
    line_number?: string;
    area?: string;
    sub_area?: string;
    line_type?: string;
    descripcion?: string;

    // Pointer a revisión vigente
    current_revision_id?: string;

    created_at: string;
    updated_at?: string;
}

export interface IsometricoRevision {
    id: string;
    isometric_id: string;
    codigo: string; // Mantener por compatibilidad (equivale a revision_number)

    // Normalización
    revision_number?: string; // Número de revisión normalizado

    // Cliente/Archivo
    client_file_code?: string; // ARCHIVO
    client_revision_code?: string; // REV. ARCHIVO

    // Transmittal (TML)
    transmittal_code?: string; // TML
    transmittal_number?: string; // N° TML
    transmittal_date?: string; // FECHA

    // Spooling
    spooling_status?: SpoolingStatus; // ESTADO SPOOLING
    spooling_date?: string; // FECHA SPOOLING
    spooling_sent_date?: string; // FECHA DE ENVIO

    // Progreso (opcional)
    total_joints_count?: number; // TOTAL
    executed_joints_count?: number; // EJECUTADO
    pending_joints_count?: number; // FALTANTES

    // General
    comment?: string; // COMENTARIO
    description?: string; // Descripción

    // Estado de la revisión
    estado: RevisionStatus;
    fecha_emision: string;

    created_at: string;
}

export interface RevisionFile {
    id: string;
    revision_id: string;

    file_url: string;
    file_type: FileType;
    file_name?: string;
    version_number: number; // 1, 2, 3...

    uploaded_by?: string;
    uploaded_at: string;

    is_primary: boolean; // Si es el archivo principal
    file_size_bytes?: number;

    created_at: string;
}

export interface Spool {
    id: string;
    revision_id: string;
    nombre: string; // "spool_number"
    diametro_pulg?: number;
    material?: string;
    cedula?: string;
    peso?: number;

    // SpoolGen Fields
    sheet?: number;
    piping_class?: string;
    fab_location?: string; // "fab"

    requiere_pwht: boolean;
    requiere_pintura: boolean;
    created_at: string;
}

export interface Joint {
    id: string;
    revision_id: string;
    spool_id?: string;
    tag: string; // "weld_number" o "flanged_joint_number"
    tipo?: string; // "weld_type" (BW, SW)
    diametro_pulg?: number; // "nps"
    cedula?: string; // "sch"
    material?: string;
    categoria: JointCategory; // SHOP/FIELD (destination)

    // SpoolGen Fields
    joint_category: JointType; // WELD o BOLT
    sheet?: number;
    thickness?: number;
    rating?: string;
    bolt_size?: string;

    created_at: string;
}

export interface Material {
    id: string;
    revision_id: string;
    spool_id?: string;
    item_code?: string;
    descripcion?: string;
    qty: number;
    qty_unit?: string;
    piping_class?: string;
    created_at: string;
}

// Helper types for UI
export interface IsometricoWithStats extends Isometrico {
    ultima_revision?: string;
    total_spools?: number;
    total_joints?: number;
    revisions?: IsometricoRevision[]; // Para joins
}

// Announcement Excel Row (antes del mapeo)
export interface AnnouncementExcelRow {
    'N°ISOMÉTRICO'?: string;
    'N° LÍNEA'?: string;
    'REV. ISO'?: string | number;
    'TIPO LÍNEA'?: string;
    'ÁREA'?: string;
    'SUB-ÁREA'?: string;
    'ARCHIVO'?: string;
    'REV. ARCHIVO'?: string;
    'TML'?: string;
    'FECHA'?: string;
    'FORMATO PDF'?: number | string;
    'FORMATO IDF'?: number | string;
    'ESTADO SPOOLING'?: string;
    'FECHA SPOOLING'?: string;
    'FECHA DE ENVIO'?: string;
    'N° TML'?: string;
    'TOTAL'?: number;
    'EJECUTADO'?: number;
    'FALTANTES'?: number;
    'COMENTARIO'?: string;
}

// Announcement Row (después del mapeo)
export interface AnnouncementRow {
    iso_number: string;
    line_number?: string;
    revision_number: string;
    line_type?: string;
    area?: string;
    sub_area?: string;

    client_file_code?: string;
    client_revision_code?: string;

    transmittal_code?: string;
    transmittal_number?: string;
    transmittal_date?: string;

    has_pdf?: boolean;
    has_idf?: boolean;
    pdf_file_name?: string; // Si se sube directamente

    spooling_status?: string;
    spooling_date?: string;
    spooling_sent_date?: string;

    total_joints_count?: number;
    executed_joints_count?: number;
    pending_joints_count?: number;

    comment?: string;
}
