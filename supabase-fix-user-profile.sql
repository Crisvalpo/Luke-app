-- ============================================
-- VERIFICAR Y CREAR TRIGGER PARA USUARIOS
-- ============================================

-- 1. Verificar si existe la función handle_new_user_profile
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user_profile';

-- 2. SI NO EXISTE, crear la función (ejecutar solo si no existe)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile(
    user_id UUID,
    user_nombre TEXT,
    user_rol TEXT,
    user_telefono TEXT,
    user_correo TEXT,
    user_empresa_id UUID,
    user_proyecto_id UUID,
    user_es_admin_proyecto BOOLEAN,
    user_estado_usuario TEXT,
    user_invitado_por UUID,
    user_token_invitacion TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        nombre,
        rol,
        telefono,
        correo,
        empresa_id,
        proyecto_id,
        es_admin_proyecto,
        estado_usuario,
        invitado_por,
        token_invitacion,
        created_at
    ) VALUES (
        user_id,
        user_nombre,
        user_rol,
        user_telefono,
        user_correo,
        user_empresa_id,
        user_proyecto_id,
        user_es_admin_proyecto,
        user_estado_usuario,
        user_invitado_por,
        user_token_invitacion,
        NOW()
    );
END;
$$;

-- 3. Verificar que la tabla users exista y tenga las columnas correctas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
