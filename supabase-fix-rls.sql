-- PASO 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;

-- PASO 2: Crear políticas simples SIN recursión

-- Política 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Política 2: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "users_update_own" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Política 3: IMPORTANTE - Permitir INSERT durante el registro
-- Esta es la clave para que el registro funcione
CREATE POLICY "users_insert_own" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- NOTA: Las políticas de admin se agregarán después del primer registro
-- Por ahora, solo permitimos operaciones básicas para usuarios normales
