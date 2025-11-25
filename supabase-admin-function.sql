-- Función para que los admins puedan ver todos los usuarios
-- Esta función bypasea RLS usando SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  id uuid,
  nombre text,
  rol text,
  telefono text,
  correo text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con privilegios del owner
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario actual es admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol de administrador';
  END IF;

  -- Retornar todos los usuarios
  RETURN QUERY
  SELECT 
    users.id,
    users.nombre,
    users.rol,
    users.telefono,
    users.correo,
    users.created_at
  FROM public.users
  ORDER BY users.created_at DESC;
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION public.get_all_users_admin() TO authenticated;
