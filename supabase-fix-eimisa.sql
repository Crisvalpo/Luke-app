
-- 1. Asegurar que la empresa EIMISA existe
INSERT INTO public.empresas (nombre, descripcion, estado, tipo_datos)
SELECT 'EIMISA', 'Empresa de Ingeniería y Montaje Industrial', 'ACTIVA', 'lukeapp'
WHERE NOT EXISTS (
    SELECT 1 FROM public.empresas WHERE nombre = 'EIMISA'
);

-- 2. Asegurar que la política de lectura existe (RLS)
DROP POLICY IF EXISTS "Empresas are viewable by everyone" ON public.empresas;
CREATE POLICY "Empresas are viewable by everyone"
ON public.empresas FOR SELECT
TO authenticated
USING (true);

-- 3. Verificar que se creó/existe
SELECT * FROM public.empresas WHERE nombre = 'EIMISA';
