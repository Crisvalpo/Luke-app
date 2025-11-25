-- Función MEJORADA para eliminar usuario (Maneja IDs desincronizados)
-- Esta función busca por email para asegurar que borra de auth.users incluso si los IDs no coinciden

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_email TEXT;
BEGIN
  -- 1. Verificar que el usuario que ejecuta la función sea ADMIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (rol = 'ADMIN' OR rol = 'admin')
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo los administradores pueden eliminar usuarios.';
  END IF;

  -- 2. Obtener el email del usuario a eliminar desde public.users
  SELECT correo INTO target_email FROM public.users WHERE id = target_user_id;

  -- 3. Si encontramos el email, intentamos borrar de auth.users (por email)
  IF target_email IS NOT NULL THEN
    DELETE FROM auth.users WHERE email = target_email;
  END IF;

  -- 4. Borrar explícitamente de public.users (por ID)
  -- Esto asegura que se borre el registro visible en la tabla, incluso si no estaba linkeado correctamente
  DELETE FROM public.users WHERE id = target_user_id;
END;
$$;

-- Asegurar permisos
GRANT EXECUTE ON FUNCTION delete_user_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_complete(UUID) TO service_role;
