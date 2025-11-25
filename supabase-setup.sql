-- Crear tabla users vinculada con auth.users de Supabase
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario',
  telefono TEXT NOT NULL,
  correo TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Crear índice en correo para búsquedas rápidas
CREATE INDEX IF NOT EXISTS users_correo_idx ON users(correo);
