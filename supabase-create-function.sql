-- Solución definitiva: Función que bypasea RLS para crear el perfil del usuario

-- PASO 1: Crear función que inserta el perfil con privilegios elevados
CREATE OR REPLACE FUNCTION public.handle_new_user_profile(
  user_id uuid,
  user_nombre text,
  user_rol text,
  user_telefono text,
  user_correo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Esto es clave: ejecuta con privilegios del owner, bypaseando RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, nombre, rol, telefono, correo, created_at)
  VALUES (user_id, user_nombre, user_rol, user_telefono, user_correo, NOW())
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- PASO 2: Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_profile(uuid, text, text, text, text) TO anon;
