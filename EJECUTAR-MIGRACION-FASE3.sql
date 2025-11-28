-- =====================================================
-- FASE 3 REFINADA: ANUNCIO DE REVISIONES NORMALIZADO
-- =====================================================
-- Modelo completo con trazabilidad TML y múltiples PDFs
-- Fecha: 2025-11-28
-- =====================================================

-- 1. ENRIQUECER TABLA ISOMETRICS
-- Agregar campos del modelo de negocio EPC
ALTER TABLE isometrics
ADD COLUMN IF NOT EXISTS line_number TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS sub_area TEXT,
ADD COLUMN IF NOT EXISTS line_type TEXT,
ADD COLUMN IF NOT EXISTS current_revision_id UUID REFERENCES isometric_revisions(id);

-- 2. ENRIQUECER TABLA ISOMETRIC_REVISIONS
-- Campos de trazabilidad y transmittals
ALTER TABLE isometric_revisions
ADD COLUMN IF NOT EXISTS revision_number TEXT,
ADD COLUMN IF NOT EXISTS client_file_code TEXT,
ADD COLUMN IF NOT EXISTS client_revision_code TEXT,
ADD COLUMN IF NOT EXISTS transmittal_code TEXT,
ADD COLUMN IF NOT EXISTS transmittal_number TEXT,
ADD COLUMN IF NOT EXISTS transmittal_date DATE,
ADD COLUMN IF NOT EXISTS spooling_status TEXT,
ADD COLUMN IF NOT EXISTS spooling_date DATE,
ADD COLUMN IF NOT EXISTS spooling_sent_date DATE,
ADD COLUMN IF NOT EXISTS total_joints_count INTEGER,
ADD COLUMN IF NOT EXISTS executed_joints_count INTEGER,
ADD COLUMN IF NOT EXISTS pending_joints_count INTEGER,
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. CREAR TABLA REVISION_FILES
-- Permite múltiples PDFs/IDFs por revisión
CREATE TABLE IF NOT EXISTS revision_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES isometric_revisions(id) ON DELETE CASCADE,
    
    file_url TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf',
    file_name TEXT,
    version_number INTEGER DEFAULT 1,
    
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    is_primary BOOLEAN DEFAULT false,
    file_size_bytes BIGINT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_isometrics_current_rev ON isometrics(current_revision_id);
CREATE INDEX IF NOT EXISTS idx_isometrics_line ON isometrics(line_number);
CREATE INDEX IF NOT EXISTS idx_isometrics_area ON isometrics(area);

CREATE INDEX IF NOT EXISTS idx_revisions_iso ON isometric_revisions(isometric_id);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON isometric_revisions(estado);
CREATE INDEX IF NOT EXISTS idx_revisions_spooling ON isometric_revisions(spooling_status);

CREATE INDEX IF NOT EXISTS idx_revision_files_revision ON revision_files(revision_id);
CREATE INDEX IF NOT EXISTS idx_revision_files_type ON revision_files(file_type);

-- 5. ROW LEVEL SECURITY
ALTER TABLE revision_files ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver archivos" ON revision_files;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos" ON revision_files;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus archivos" ON revision_files;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus archivos" ON revision_files;

-- Crear políticas
CREATE POLICY "Usuarios autenticados pueden ver archivos" 
ON revision_files FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuarios autenticados pueden subir archivos" 
ON revision_files FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar sus archivos" 
ON revision_files FOR UPDATE 
TO authenticated 
USING (uploaded_by = auth.uid() OR auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Usuarios pueden eliminar sus archivos" 
ON revision_files FOR DELETE 
TO authenticated 
USING (uploaded_by = auth.uid() OR auth.jwt() ->> 'role' = 'ADMIN');
