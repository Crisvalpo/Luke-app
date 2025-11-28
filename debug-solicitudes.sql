-- Verificar solicitudes en la base de datos
SELECT 
    s.id,
    s.estado,
    s.created_at,
    u.nombre as usuario_nombre,
    u.correo as usuario_correo,
    e.nombre as empresa_nombre,
    s.empresa_id
FROM solicitudes_acceso_empresa s
JOIN users u ON s.usuario_id = u.id
JOIN empresas e ON s.empresa_id = e.id
ORDER BY s.created_at DESC
LIMIT 10;

-- Ver también el usuario Mauricio
SELECT id, nombre, correo, empresa_id, rol, es_admin_proyecto
FROM users
WHERE correo LIKE '%mauricio%' OR nombre LIKE '%Mauricio%';

-- Ver la empresa EIMISA
SELECT id, nombre FROM empresas WHERE nombre = 'EIMISA';
