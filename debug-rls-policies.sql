-- Ver las políticas actuales de la tabla solicitudes_acceso_empresa
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'solicitudes_acceso_empresa';

-- Probar la consulta directamente como Mauricio
-- (Ejecuta esto después de iniciar sesión como Mauricio en el cliente)
SELECT 
    *,
    (SELECT nombre FROM users WHERE id = solicitudes_acceso_empresa.usuario_id) as usuario_nombre,
    (SELECT correo FROM users WHERE id = solicitudes_acceso_empresa.usuario_id) as usuario_correo,
    (SELECT nombre FROM empresas WHERE id = solicitudes_acceso_empresa.empresa_id) as empresa_nombre
FROM solicitudes_acceso_empresa
WHERE estado = 'PENDIENTE'
ORDER BY created_at DESC;
