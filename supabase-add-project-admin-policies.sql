-- Agregar políticas faltantes para que Admins de Proyecto puedan gestionar solicitudes

-- Política: Los admins de proyecto pueden ver solicitudes de su empresa
DROP POLICY IF EXISTS "Project admins can view requests for their company" ON public.solicitudes_acceso_empresa;
CREATE POLICY "Project admins can view requests for their company"
ON public.solicitudes_acceso_empresa
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (es_admin_proyecto = true OR rol = 'ADMIN_PROYECTO')
        AND estado_usuario = 'ACTIVO'
        AND empresa_id = solicitudes_acceso_empresa.empresa_id
    )
);

-- Política: Los admins de proyecto pueden actualizar solicitudes de su empresa
DROP POLICY IF EXISTS "Project admins can update requests for their company" ON public.solicitudes_acceso_empresa;
CREATE POLICY "Project admins can update requests for their company"
ON public.solicitudes_acceso_empresa
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (es_admin_proyecto = true OR rol = 'ADMIN_PROYECTO')
        AND estado_usuario = 'ACTIVO'
        AND empresa_id = solicitudes_acceso_empresa.empresa_id
    )
);
