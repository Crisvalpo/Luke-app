-- Función para eliminar usuario completamente (auth + public)
-- Esta función debe ejecutarse en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verificar que el usuario que ejecuta la función sea ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (rol = 'ADMIN' OR rol = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo los administradores pueden eliminar usuarios.';
  END IF;

  -- 2. Eliminar de auth.users
  -- Esto disparará automáticamente el borrado en public.users gracias a la FK con ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Asegurar permisos de ejecución
GRANT EXECUTE ON FUNCTION delete_user_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete(UUID) TO service_role;
