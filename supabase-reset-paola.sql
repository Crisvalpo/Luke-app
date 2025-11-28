-- Script para limpiar usuario y reiniciar prueba
-- Reemplaza el correo si es necesario

-- 1. Borrar solicitud de acceso (si existe)
DELETE FROM public.solicitudes_acceso_empresa 
WHERE usuario_id IN (
    SELECT id FROM public.users WHERE correo = 'paoluke.webapp@gmail.com'
);

-- 2. Borrar usuario de public.users (Perfil)
DELETE FROM public.users 
WHERE correo = 'paoluke.webapp@gmail.com';

-- 3. Borrar usuario de auth.users (Autenticación)
-- IMPORTANTE: Esto permite que se pueda volver a registrar con el mismo correo
DELETE FROM auth.users 
WHERE email = 'paoluke.webapp@gmail.com';

-- Verificación: Debería salir vacío
SELECT * FROM public.users WHERE correo = 'paoluke.webapp@gmail.com';
