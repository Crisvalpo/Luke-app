-- ============================================
-- ELIMINAR USUARIO ESPECÍFICO: emedina@eimontajes.cl
-- Con todas sus dependencias
-- ============================================

-- PASO 1: Obtener el UUID del usuario
SELECT id, correo, nombre, rol 
FROM public.users 
WHERE correo = 'emedina@eimontajes.cl';

-- También buscar en auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- PASO 2: Buscar todas las referencias del usuario
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Obtener el UUID
    SELECT id INTO user_uuid 
    FROM public.users 
    WHERE correo = 'emedina@eimontajes.cl';
    
    IF user_uuid IS NOT NULL THEN
        RAISE NOTICE 'Usuario encontrado: %', user_uuid;
        
        -- Ver invitaciones creadas por este usuario
        RAISE NOTICE 'Invitaciones creadas: %', (
            SELECT COUNT(*) FROM invitaciones WHERE creado_por = user_uuid
        );
        
        -- Ver invitaciones usadas por este usuario
        RAISE NOTICE 'Invitaciones usadas: %', (
            SELECT COUNT(*) FROM invitaciones WHERE usado_por = user_uuid
        );
        
        -- Ver proyectos creados por este usuario
        RAISE NOTICE 'Proyectos creados: %', (
            SELECT COUNT(*) FROM proyectos WHERE created_by = user_uuid
        );
    ELSE
        RAISE NOTICE 'Usuario NO encontrado en public.users';
    END IF;
END $$;

-- PASO 3: ELIMINAR TODAS LAS REFERENCIAS (EJECUTAR CON CUIDADO)

-- 3.1: Actualizar invitaciones (poner NULL en lugar de eliminarlas)
UPDATE invitaciones 
SET creado_por = NULL 
WHERE creado_por = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

UPDATE invitaciones 
SET usado_por = NULL 
WHERE usado_por = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

-- 3.2: Actualizar proyectos (poner NULL en created_by)
UPDATE proyectos 
SET created_by = NULL 
WHERE created_by = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

-- 3.3: Verificar si hay otras referencias en empresas
SELECT COUNT(*) as empresas_creadas
FROM empresas 
WHERE created_by = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

-- Si hay empresas, actualizar
UPDATE empresas 
SET created_by = NULL 
WHERE created_by = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

-- PASO 4: ELIMINAR DE public.users
DELETE FROM public.users 
WHERE correo = 'emedina@eimontajes.cl';

-- PASO 5: Verificar eliminación
SELECT COUNT(*) as usuarios_restantes
FROM public.users 
WHERE correo = 'emedina@eimontajes.cl';

-- PASO 6: Para eliminar de auth.users, necesitas hacerlo manualmente
-- Ir a Authentication → Users en Supabase Dashboard
-- O usar este comando si tienes Service Role Key:

-- NOTA: Copia el UUID que obtuviste en el PASO 1 y úsalo aquí:
SELECT 
    'Para eliminar de auth.users, ve a:' as instruccion,
    'https://supabase.com/dashboard/project/TU_PROYECTO/auth/users' as url,
    id as user_id_a_eliminar,
    email
FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- ============================================
-- SCRIPT COMPLETO EN UNA SOLA TRANSACCIÓN
-- Descomenta para ejecutar todo de una vez
-- ============================================

/*
BEGIN;

-- Actualizar referencias
UPDATE invitaciones SET creado_por = NULL 
WHERE creado_por = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

UPDATE invitaciones SET usado_por = NULL 
WHERE usado_por = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

UPDATE proyectos SET created_by = NULL 
WHERE created_by = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

UPDATE empresas SET created_by = NULL 
WHERE created_by = (SELECT id FROM public.users WHERE correo = 'emedina@eimontajes.cl');

-- Eliminar usuario
DELETE FROM public.users WHERE correo = 'emedina@eimontajes.cl';

-- Verificar
SELECT 'Usuario eliminado' as resultado, COUNT(*) as restantes 
FROM public.users 
WHERE correo = 'emedina@eimontajes.cl';

COMMIT;
*/
