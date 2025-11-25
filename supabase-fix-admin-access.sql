-- 1. Crear función segura para obtener todos los usuarios (Bypass RLS)
DROP FUNCTION IF EXISTS get_all_users_admin();

CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users ORDER BY created_at DESC;
$$;

-- 2. Asegurar que tu usuario es ADMIN (usando tu correo)
UPDATE public.users 
SET rol = 'ADMIN' 
WHERE correo = 'cristianluke@gmail.com';

-- 3. Política de seguridad para que los Admins puedan ver todo (Fallback)
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

CREATE POLICY "Admins can read all users" ON public.users
FOR SELECT USING (
  rol = 'ADMIN' OR rol = 'admin'
);

-- 4. Política para que los Admins puedan actualizar roles
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

CREATE POLICY "Admins can update users" ON public.users
FOR UPDATE USING (
  rol = 'ADMIN' OR rol = 'admin'
);

-- 5. Política para que los Admins puedan eliminar usuarios
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can delete users" ON public.users
FOR DELETE USING (
  rol = 'ADMIN' OR rol = 'admin'
);
