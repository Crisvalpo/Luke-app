-- FASE 3: GESTIÓN DE ANUNCIOS DE INGENIERÍA
-- Implementación del flujo de "Anuncio de Revisión" como fuente de verdad.

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
-- Asegurar que se puedan leer/escribir estos nuevos campos.
-- (Las políticas existentes de 'isometric_revisions' deberían cubrirlo, pero verificamos)
