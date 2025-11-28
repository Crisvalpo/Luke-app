-- Agregar columnas faltantes a la tabla 'empresas'
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS descripcion text,
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
ADD COLUMN IF NOT EXISTS tipo_datos text DEFAULT 'lukeapp' CHECK (tipo_datos IN ('lukeapp', 'google', 'sharepoint'));

-- Agregar columnas faltantes a la tabla 'proyectos'
ALTER TABLE public.proyectos
ADD COLUMN IF NOT EXISTS descripcion text,
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'PAUSADO', 'FINALIZADO')),
ADD COLUMN IF NOT EXISTS codigo text,
ADD COLUMN IF NOT EXISTS config_origen jsonb DEFAULT '{}'::jsonb;

-- Crear índices para las nuevas columnas si es necesario
CREATE INDEX IF NOT EXISTS idx_empresas_estado ON public.empresas(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);
