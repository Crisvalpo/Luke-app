-- =====================================================
-- EJECUTAR ESTA MIGRACIÓN EN SUPABASE SQL EDITOR
-- =====================================================
-- Fase 3: Anuncio de Revisiones
-- Fecha: 2025-11-28
-- =====================================================

-- 1. Enriquecer Tabla de Revisiones (isometric_revisions)
-- Esta tabla ahora almacena la información del "Anuncio": PDF y estado oficial.
ALTER TABLE isometric_revisions
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_anuncio DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Optimización de Isométricos (isometrics)
-- Puntero rápido a la revisión vigente actual.
ALTER TABLE isometrics
ADD COLUMN IF NOT EXISTS current_revision_id UUID REFERENCES isometric_revisions(id);

-- 3. Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_isometrics_current_rev ON isometrics(current_revision_id);

-- 4. Política de Seguridad (RLS)
-- Las políticas existentes de 'isometric_revisions' y 'isometrics' deberían cubrir
-- estos nuevos campos automáticamente. No se requiere configuración adicional.

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================
-- Ejecuta esta query para verificar que todo está OK:

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name IN ('isometric_revisions', 'isometrics')
    AND column_name IN ('pdf_url', 'fecha_anuncio', 'description', 'current_revision_id')
ORDER BY 
    table_name, column_name;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Deberías ver 4 columnas nuevas:
-- 
-- isometric_revisions | description       | text | YES
-- isometric_revisions | fecha_anuncio     | date | YES
-- isometric_revisions | pdf_url           | text | YES
-- isometrics          | current_revision_id | uuid | YES
-- =====================================================
