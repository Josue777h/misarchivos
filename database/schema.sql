-- ==============================================================================
-- MISARCHIVOS - ESQUEMA COMPLETO Y POLÍTICAS DE SEGURIDAD (SUPABASE POSTGRESQL)
-- Copia y pega TODO este archivo en el "SQL Editor" de tu proyecto de Supabase.
-- ==============================================================================

-- 1. Crear tabla principal de archivos con soporte multiusuario
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'word', 'excel', 'powerpoint', 'text', 'other')),
    extension TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    hash_sha256 TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'syncing', 'pending', 'conflict', 'error')),
    is_trash BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    conflict_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía previamente sin la columna user_id, la agregamos:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'files' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.files ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
    END IF;
END $$;

-- 2. Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_relative_path ON public.files(relative_path);
CREATE INDEX IF NOT EXISTS idx_files_hash ON public.files(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_files_type ON public.files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_is_trash ON public.files(is_trash);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON public.files(updated_at DESC);

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_files_updated_at ON public.files;
CREATE TRIGGER trigger_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Habilitar Supabase Realtime de forma segura
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'files'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
    END IF;
END $$;

-- 5. Crear el bucket 'misarchivos' en storage si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('misarchivos', 'misarchivos', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Habilitar Row Level Security (RLS) en la tabla files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores para evitar duplicados
DROP POLICY IF EXISTS "Permitir acceso total al propietario" ON public.files;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios archivos" ON public.files;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios archivos" ON public.files;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios archivos" ON public.files;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos" ON public.files;

-- Políticas de aislamiento multiusuario en la tabla files
CREATE POLICY "Usuarios pueden ver sus propios archivos"
    ON public.files
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios archivos"
    ON public.files
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios archivos"
    ON public.files
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios archivos"
    ON public.files
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. Políticas de Seguridad en Storage (Bucket 'misarchivos')
-- NOTA: storage.objects ya tiene RLS habilitado por defecto por Supabase.
DROP POLICY IF EXISTS "Permitir acceso total al bucket misarchivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios archivos de storage" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir sus propios archivos a storage" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios archivos de storage" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios archivos de storage" ON storage.objects;

CREATE POLICY "Usuarios pueden ver sus propios archivos de storage"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'misarchivos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuarios pueden subir sus propios archivos a storage"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'misarchivos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuarios pueden actualizar sus propios archivos de storage"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'misarchivos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuarios pueden eliminar sus propios archivos de storage"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'misarchivos' AND (storage.foldername(name))[1] = auth.uid()::text);
