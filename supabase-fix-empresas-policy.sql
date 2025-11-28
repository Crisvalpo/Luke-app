
-- Permitir que usuarios autenticados puedan buscar empresas
-- Esto es necesario si la API no está usando correctamente la Service Key o si queremos permitir búsqueda desde el cliente
create policy "Empresas are viewable by everyone"
on public.empresas for select
to authenticated
using ( true );

-- O si prefieres que solo se vean las activas:
-- using ( estado = 'ACTIVA' );
