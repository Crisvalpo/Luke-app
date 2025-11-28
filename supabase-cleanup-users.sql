-- ============================================
-- ⚠️ PELIGRO: LIMPIEZA TOTAL DE USUARIOS
-- Este script elimina TODOS los usuarios excepto cristianluke@gmail.com
-- ============================================

-- PASO 1: Ver qué usuarios se van a eliminar (EJECUTAR PRIMERO PARA VERIFICAR)
SELECT id, correo, nombre, rol 
FROM public.users 
WHERE correo != 'cristianluke@gmail.com';

-- PASO 2: Si estás seguro, descomentar y ejecutar esto para borrar de public.users
-- DELETE FROM public.users 
-- WHERE correo != 'cristianluke@gmail.com';

-- PASO 3: Para auth.users, NO es posible borrar con SQL estándar
-- Debes hacerlo desde el Dashboard de Supabase:
-- 1. Ir a Authentication → Users
-- 2. Seleccionar cada usuario que no sea cristianluke@gmail.com
-- 3. Click en los "..." → Delete user

-- ALTERNATIVA: Si tienes Service Role Key configurada, puedes usar esta función
-- (Solo funciona si tienes permisos de admin)
-- 
-- DO $$
-- DECLARE
--     user_record RECORD;
-- BEGIN
--     FOR user_record IN 
--         SELECT id, email 
--         FROM auth.users 
--         WHERE email != 'cristianluke@gmail.com'
--     LOOP
--         -- Aquí necesitarías llamar a la API de Supabase Admin
--         -- No es posible directamente desde SQL
--         RAISE NOTICE 'Usuario a eliminar: % (%)', user_record.email, user_record.id;
--     END LOOP;
-- END $$;

-- ============================================
-- SCRIPT SEGURO: Primero borra de public.users
-- ============================================

-- Ver usuarios que se borrarán
SELECT 
    'public.users' as tabla,
    id, 
    correo, 
    nombre, 
    rol,
    estado_usuario
FROM public.users 
WHERE correo != 'cristianluke@gmail.com'

UNION ALL

SELECT 
    'auth.users' as tabla,
    id,
    email as correo,
    raw_user_meta_data->>'nombre' as nombre,
    'N/A' as rol,
    'N/A' as estado_usuario
FROM auth.users 
WHERE email != 'cristianluke@gmail.com';

-- EJECUTAR SOLO DESPUÉS DE VERIFICAR
-- DELETE FROM public.users WHERE correo != 'cristianluke@gmail.com';
