-- ====================================================================
-- OM BUILDINGS - CONSOLIDATED SUPABASE SCHEMA (USERS + ENQUIRIES)
--
-- Run this in Supabase SQL Editor:
-- Dashboard -> Your Project -> SQL Editor -> New query -> Paste & Run
-- (Safe to run multiple times - preserves existing tables and records)
-- ====================================================================

-- 1. Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Rename contact_messages to enquiries if it already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages' AND table_schema = 'public') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries' AND table_schema = 'public') THEN
        ALTER TABLE public.contact_messages RENAME TO enquiries;
    END IF;
END $$;

-- 3. Create 'users' table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_sent_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Ensure users columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 4. Create 'enquiries' table (Consolidated Dual-Send Enquiries)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_slug VARCHAR(100) NOT NULL DEFAULT 'project-planning',
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    status VARCHAR(20) NOT NULL DEFAULT 'new',                -- new | company_notified | company_notify_failed
    client_ack_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | sent | failed
    company_email_id VARCHAR(255),                            -- id returned by email provider
    client_email_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure newly added columns exist if table was renamed from contact_messages
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS service_slug VARCHAR(100) NOT NULL DEFAULT 'project-planning';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS client_ack_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS company_email_id VARCHAR(255);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS client_email_id VARCHAR(255);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Populate service_slug from project_type if project_type exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'project_type') THEN
        UPDATE public.enquiries 
        SET service_slug = LOWER(REPLACE(REPLACE(project_type, ' & ', '-'), ' ', '-')) 
        WHERE service_slug IS NULL OR service_slug = 'project-planning' AND project_type IS NOT NULL;
    END IF;
END $$;

-- Indexes for 'enquiries'
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries (created_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_service_slug ON public.enquiries (service_slug);
CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON public.enquiries (user_id);

-- 5. Keep Alembic version in sync
CREATE TABLE IF NOT EXISTS public.alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

DELETE FROM public.alembic_version;
INSERT INTO public.alembic_version (version_num)
VALUES ('3a92f08d1e11');
