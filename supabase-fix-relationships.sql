-- Corregir las relaciones (Foreign Keys) para permitir los joins con public.users

-- 1. Intentar borrar la restricción anterior (que apunta a auth.users)
-- Nota: El nombre suele ser tabla_columna_fkey, probamos con el estándar
ALTER TABLE public.solicitudes_acceso_empresa
DROP CONSTRAINT IF EXISTS solicitudes_acceso_empresa_usuario_id_fkey;

-- 2. Crear la nueva restricción apuntando a public.users
-- Esto permite que Supabase detecte la relación para hacer: usuario:users!usuario_id(...)
ALTER TABLE public.solicitudes_acceso_empresa
ADD CONSTRAINT solicitudes_acceso_empresa_usuario_id_fkey
FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Asegurar también la relación con empresas
ALTER TABLE public.solicitudes_acceso_empresa
DROP CONSTRAINT IF EXISTS solicitudes_acceso_empresa_empresa_id_fkey;

ALTER TABLE public.solicitudes_acceso_empresa
ADD CONSTRAINT solicitudes_acceso_empresa_empresa_id_fkey
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;

-- 4. Recargar el caché de esquema (esto ocurre automáticamente al hacer DDL, pero por seguridad)
NOTIFY pgrst, 'reload schema';
