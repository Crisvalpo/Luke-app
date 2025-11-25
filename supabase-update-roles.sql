-- Actualizar la tabla users para soportar los nuevos roles

-- PASO 1: Cambiar el rol por defecto
ALTER TABLE public.users 
ALTER COLUMN rol SET DEFAULT 'SOLO LECTURA';

-- PASO 2: Actualizar usuarios existentes con "por asignar" a "SOLO LECTURA"
UPDATE public.users 
SET rol = 'SOLO LECTURA' 
WHERE rol = 'por asignar';

-- Verificar los cambios
SELECT id, nombre, rol, correo FROM users;
