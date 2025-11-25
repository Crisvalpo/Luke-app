-- Función pública para contar usuarios (para la landing page)
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM users;
$$;

-- Permitir acceso público (anon) y autenticado
GRANT EXECUTE ON FUNCTION get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_count() TO service_role;
