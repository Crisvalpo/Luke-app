-- ============================================
-- ELIMINAR USUARIO: emedina@eimontajes.cl
-- CON TODAS SUS DEPENDENCIAS
-- ============================================

-- El UUID del usuario es: 0df6dc22-9eaa-40ea-91d3-dddadbcf83ce

-- PASO 1: Ver qué creó este usuario
SELECT 'EMPRESAS CREADAS' as tipo, COUNT(*) as cantidad
FROM empresas 
WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce'

UNION ALL

SELECT 'PROYECTOS CREADOS' as tipo, COUNT(*) as cantidad
FROM proyectos 
WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce'

UNION ALL

SELECT 'INVITACIONES CREADAS' as tipo, COUNT(*) as cantidad
FROM invitaciones 
WHERE creado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce'

UNION ALL

SELECT 'INVITACIONES USADAS' as tipo, COUNT(*) as cantidad
FROM invitaciones 
WHERE usado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- PASO 2: LIMPIAR TODAS LAS REFERENCIAS (ejecutar en orden)

-- 2.1: Actualizar empresas (poner NULL en created_by)
UPDATE empresas 
SET created_by = NULL 
WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- 2.2: Actualizar proyectos
UPDATE proyectos 
SET created_by = NULL 
WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- 2.3: Actualizar invitaciones
UPDATE invitaciones 
SET creado_por = NULL 
WHERE creado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

UPDATE invitaciones 
SET usado_por = NULL 
WHERE usado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- PASO 3: Eliminar de public.users
DELETE FROM public.users 
WHERE id = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- PASO 4: Eliminar de auth.users
DELETE FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- PASO 5: Verificar eliminación completa
SELECT 
    'public.users' as tabla,
    COUNT(*) as registros
FROM public.users 
WHERE correo = 'emedina@eimontajes.cl'

UNION ALL

SELECT 
    'auth.users' as tabla,
    COUNT(*) as registros
FROM auth.users 
WHERE email = 'emedina@eimontajes.cl';

-- ============================================
-- SCRIPT COMPLETO EN UNA TRANSACCIÓN
-- Descomenta para ejecutar todo de una vez
-- ============================================

/*
BEGIN;

-- Limpiar referencias
UPDATE empresas SET created_by = NULL WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';
UPDATE proyectos SET created_by = NULL WHERE created_by = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';
UPDATE invitaciones SET creado_por = NULL WHERE creado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';
UPDATE invitaciones SET usado_por = NULL WHERE usado_por = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';

-- Eliminar usuario
DELETE FROM public.users WHERE id = '0df6dc22-9eaa-40ea-91d3-dddadbcf83ce';
DELETE FROM auth.users WHERE email = 'emedina@eimontajes.cl';

-- Verificar
SELECT 'Usuario eliminado completamente' as resultado;

COMMIT;
*/
