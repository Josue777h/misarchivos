-- ==============================================================================
-- MISARCHIVOS - ESQUEMA DE BASE DE DATOS Y STORAGE (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Crear tabla principal de archivos
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_files_relative_path ON public.files(relative_path);
CREATE INDEX IF NOT EXISTS idx_files_hash ON public.files(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_files_type ON public.files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_is_trash ON public.files(is_trash);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON public.files(updated_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER trigger_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Habilitar Supabase Realtime para notificar cambios inmediatos
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;

-- 3. Configuración de Storage Bucket (Crear el bucket en Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('misarchivos', 'misarchivos', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Seguridad (RLS) para uso personal
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Política de acceso total para el usuario propietario autenticado
CREATE POLICY "Permitir acceso total al propietario"
    ON public.files
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Política de Storage para el bucket misarchivos
CREATE POLICY "Permitir acceso total al bucket misarchivos"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'misarchivos')
    WITH CHECK (bucket_id = 'misarchivos');
