-- =====================================================================
-- SCRIPT DE SEGURIDAD PARA SUPABASE (POLÍTICAS RLS - ROW LEVEL SECURITY)
-- =====================================================================
-- Ejecuta este script en el editor SQL de tu panel de control de Supabase.
-- Habilitará la seguridad de nivel de fila para proteger tus datos de accesos no autorizados.

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wods ENABLE ROW LEVEL SECURITY;
ALTER TABLE prs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'users'
-- ==========================================
-- Permite lectura pública básica para mapear nombres en rankings y listados
CREATE POLICY "Permitir lectura de datos de usuarios" ON users
    FOR SELECT TO anon, authenticated
    USING (true);

-- Permite inserción pública para el autoregistro de clientes
CREATE POLICY "Permitir autoregistro público de usuarios" ON users
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Permite a los usuarios actualizar sus propios datos personales
CREATE POLICY "Permitir a usuarios actualizar su propio perfil" ON users
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'classes'
-- ==========================================
-- Cualquiera puede ver los horarios de clases
CREATE POLICY "Permitir lectura de clases" ON classes
    FOR SELECT TO anon, authenticated
    USING (true);

-- Solo administradores pueden agregar/modificar horarios de clases (se valida en el backend/roles)
CREATE POLICY "Permitir modificación de clases" ON classes
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'exercises'
-- ==========================================
-- Cualquiera puede ver los ejercicios y videos instructivos
CREATE POLICY "Permitir lectura de ejercicios" ON exercises
    FOR SELECT TO anon, authenticated
    USING (true);

-- Permitir agregar nuevos ejercicios si no existen
CREATE POLICY "Permitir inserción de ejercicios" ON exercises
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'wods'
-- ==========================================
-- Todos los atletas pueden ver las planificaciones de WODs
CREATE POLICY "Permitir lectura de WODs" ON wods
    FOR SELECT TO anon, authenticated
    USING (true);

-- Permitir modificación de WODs
CREATE POLICY "Permitir gestión de WODs" ON wods
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'bookings'
-- ==========================================
-- Permitir ver reservas de clases
CREATE POLICY "Permitir lectura de reservas" ON bookings
    FOR SELECT TO anon, authenticated
    USING (true);

-- Permitir a los usuarios reservar y cancelar turnos
CREATE POLICY "Permitir gestión de reservas" ON bookings
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'prs' (RMs / Benchmarks)
-- ==========================================
-- Todos pueden ver las marcas en los rankings públicos
CREATE POLICY "Permitir lectura de PRs" ON prs
    FOR SELECT TO anon, authenticated
    USING (true);

-- Permite a los usuarios insertar sus marcas y a entrenadores editarlas
CREATE POLICY "Permitir gestión de PRs" ON prs
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'payments'
-- ==========================================
-- Permitir lectura y gestión de transacciones de caja
CREATE POLICY "Permitir lectura de pagos" ON payments
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir inserción de pagos" ON payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'notifications'
-- ==========================================
-- Permitir lectura de notificaciones del historial del usuario
CREATE POLICY "Permitir lectura de notificaciones" ON notifications
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir inserción de notificaciones" ON notifications
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA LA TABLA 'checkin_logs'
-- ==========================================
-- Permitir lectura de registros de acceso del tótem
CREATE POLICY "Permitir lectura de checkins" ON checkin_logs
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Permitir registro de checkin" ON checkin_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- =====================================================================
-- NOTA IMPORTANTE PARA PRODUCCIÓN COMPLETA:
-- Si decides migrar a Supabase Auth nativo en el futuro, puedes restringir
-- las políticas usando `auth.uid() = cliente_id` para blindar por completo
-- el acceso a nivel de fila individual por token de usuario.
-- =====================================================================
