-- ====================================================================
-- OM BUILDINGS - COMPLETE SUPABASE DATABASE SCHEMA SETUP & UPDATE
-- 
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> Your Project -> SQL Editor -> New Query -> Paste & Run
-- (Safe to run multiple times - preserves existing tables & data)
-- ====================================================================

-- 1. Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create 'users' table (Customer Accounts & Authentication)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_sent_at TIMESTAMP WITHOUT TIME ZONE,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure newly added columns exist if table was already created
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITHOUT TIME ZONE;

-- Indexes for 'users'
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON public.users(email);

-- 3. Create 'contact_messages' table (Customer & Guest Project Enquiries)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR NOT NULL DEFAULT 'General Inquiry',
    project_type VARCHAR(100),
    message TEXT NOT NULL,
    estimated_budget VARCHAR(100),
    location VARCHAR(255),
    timeline VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Received',
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure all project detail columns exist if table was already created
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS estimated_budget VARCHAR(100);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS timeline VARCHAR(100);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS project_type VARCHAR(100);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Received';
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Indexes for 'contact_messages'
CREATE INDEX IF NOT EXISTS ix_contact_messages_id ON public.contact_messages(id);
CREATE INDEX IF NOT EXISTS ix_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS ix_contact_messages_name ON public.contact_messages(name);
CREATE INDEX IF NOT EXISTS ix_contact_messages_user_id ON public.contact_messages(user_id);
CREATE INDEX IF NOT EXISTS ix_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS ix_contact_messages_created_at ON public.contact_messages(created_at DESC);

-- 4. Create 'alembic_version' table to keep backend migrations in sync
CREATE TABLE IF NOT EXISTS public.alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Sync migration version to current head
DELETE FROM public.alembic_version;
INSERT INTO public.alembic_version (version_num)
VALUES ('178b8156b745');
