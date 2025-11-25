-- Script para crear el primer usuario ADMIN directamente en Supabase
-- Este script bypasea las políticas RLS usando la función auth.users

-- PASO 1: Crear usuario en auth.users (sistema de autenticación de Supabase)
-- IMPORTANTE: Reemplaza 'tu-email@ejemplo.com' con tu email real
-- IMPORTANTE: Reemplaza 'tu-password-segura' con tu contraseña deseada

-- Primero, crea el usuario en la tabla auth usando el dashboard de Supabase:
-- Ve a: Authentication > Users > Add User (manual)
-- Email: admin@lukeapp.com
-- Password: Admin123! (cámbialo después)
-- Auto Confirm User: ✓ (marcado)

-- PASO 2: Una vez creado el usuario en Authentication, copia su UUID
-- Lo verás en la columna "User UID" de la tabla de usuarios

-- PASO 3: Ejecuta este SQL reemplazando 'TU-UUID-AQUI' con el UUID del paso anterior
-- EJEMPLO: '123e4567-e89b-12d3-a456-426614174000'

-- Desactiva temporalmente RLS para insertar
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Inserta el usuario admin
INSERT INTO users (id, nombre, rol, telefono, correo, created_at)
VALUES (
  'TU-UUID-AQUI',  -- Reemplaza con el UUID del usuario creado en Authentication
  'Administrador Principal',
  'admin',
  '+56912345678',
  'admin@lukeapp.com',  -- Debe coincidir con el email usado en Authentication
  NOW()
);

-- Reactiva RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verifica que el usuario se creó correctamente
SELECT id, nombre, rol, correo, telefono FROM users;
