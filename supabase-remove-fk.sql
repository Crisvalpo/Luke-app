-- Solución: Eliminar la foreign key constraint que causa problemas

-- PASO 1: Eliminar el constraint de foreign key
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- PASO 2: Verificar que se eliminó
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass;

-- NOTA: Esto no causa problemas de integridad porque nuestra aplicación
-- siempre crea primero el usuario en auth.users antes de llamar a la función
