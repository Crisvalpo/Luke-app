-- ============================================
-- ELIMINAR USUARIO EN "Waiting for verification"
-- Email: emedina@eimontajes.cl
-- VERSIÓN CORREGIDA (con type casts)
-- ============================================

-- PASO 1: Ver el estado del usuario
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- PASO 2: MÉTODO SIMPLE - Intenta esto primero
-- Solo eliminar de auth.users directamente
DELETE FROM auth.users WHERE email = 'emedina@eimontajes.cl';

-- Si da error, continúa con el método detallado:

-- PASO 3: MÉTODO DETALLADO (con casts de tipo)
DO $$
DECLARE
    user_uuid UUID;
    user_uuid_text TEXT;
BEGIN
    -- Obtener el UUID
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'emedina@eimontajes.cl';
    
    IF user_uuid IS NOT NULL THEN
        -- Convertir UUID a texto
        user_uuid_text := user_uuid::TEXT;
        
        RAISE NOTICE 'Eliminando usuario: %', user_uuid_text;
        
        -- Eliminar de auth.identities
        DELETE FROM auth.identities WHERE user_id = user_uuid;
        RAISE NOTICE 'Identidades eliminadas';
        
        -- Eliminar de auth.sessions
        DELETE FROM auth.sessions WHERE user_id = user_uuid;
        RAISE NOTICE 'Sesiones eliminadas';
        
        -- Eliminar de auth.mfa_factors (si existe)
        BEGIN
            DELETE FROM auth.mfa_factors WHERE user_id = user_uuid;
            RAISE NOTICE 'MFA eliminado';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No hay MFA o no existe la tabla';
        END;
        
        -- Eliminar de auth.refresh_tokens (con cast)
        -- Probamos diferentes variantes porque no sabemos qué tipo usa
        BEGIN
            DELETE FROM auth.refresh_tokens WHERE user_id = user_uuid::TEXT;
            RAISE NOTICE 'Refresh tokens eliminados (UUID to TEXT)';
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                DELETE FROM auth.refresh_tokens WHERE user_id::UUID = user_uuid;
                RAISE NOTICE 'Refresh tokens eliminados (TEXT to UUID)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'No se pudieron eliminar refresh tokens';
            END;
        END;
        
        -- Finalmente eliminar de auth.users
        DELETE FROM auth.users WHERE id = user_uuid;
        RAISE NOTICE 'Usuario eliminado de auth.users';
        
    ELSE
        RAISE NOTICE 'Usuario no encontrado';
    END IF;
END $$;

-- PASO 4: Verificar eliminación
SELECT 
    'auth.users' as tabla, 
    COUNT(*) as registros
FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- ============================================
-- MÉTODO ULTRA SIMPLE (Prueba esto si lo anterior falla)
-- ============================================

-- Simplemente elimina de auth.users (deja que Supabase limpie lo demás)
-- DELETE FROM auth.users WHERE email = 'emedina@eimontajes.cl';

-- Si da error de foreign key, fuerza la limpieza de public.users primero:
DELETE FROM public.users WHERE correo = 'emedina@eimontajes.cl';

-- Luego intenta de nuevo:
DELETE FROM auth.users WHERE email = 'emedina@eimontajes.cl';
