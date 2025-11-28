-- Script FINAL DE REPARACIÓN (V3)
-- Flexibiliza la tabla para permitir invitaciones de Empresa (sin proyecto y sin creador obligatorio)

-- 1. Hacer proyecto_id opcional
ALTER TABLE public.invitaciones ALTER COLUMN proyecto_id DROP NOT NULL;

-- 2. Hacer creado_por opcional (Soluciona el error actual)
ALTER TABLE public.invitaciones ALTER COLUMN creado_por DROP NOT NULL;

-- 3. Asegurar que existan las columnas nuevas
DO $$
BEGIN
    -- empresa_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitaciones' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.invitaciones ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;

    -- estado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitaciones' AND column_name = 'estado') THEN
        ALTER TABLE public.invitaciones ADD COLUMN estado TEXT NOT NULL DEFAULT 'PENDIENTE';
    END IF;

    -- rol
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitaciones' AND column_name = 'rol') THEN
        ALTER TABLE public.invitaciones ADD COLUMN rol TEXT NOT NULL DEFAULT 'USUARIO';
    END IF;
    
    -- expires_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitaciones' AND column_name = 'expires_at') THEN
        ALTER TABLE public.invitaciones ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
    END IF;

    -- usado_por
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invitaciones' AND column_name = 'usado_por') THEN
        ALTER TABLE public.invitaciones ADD COLUMN usado_por UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. Actualizar Políticas RLS para permitir acceso
DROP POLICY IF EXISTS "Super Admin full access invitaciones" ON public.invitaciones;
DROP POLICY IF EXISTS "Lectura publica invitaciones" ON public.invitaciones;

CREATE POLICY "Super Admin full access invitaciones" ON public.invitaciones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND rol = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "Lectura publica invitaciones" ON public.invitaciones
    FOR SELECT
    USING (true); 
