-- Migration: Tabela de logs para rate limiting do /api/analyze
-- Roda no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS analyze_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índice para queries de rate limiting (user_id + created_at)
CREATE INDEX IF NOT EXISTS analyze_logs_user_created_idx
  ON analyze_logs (user_id, created_at DESC);

-- RLS: usuário só vê seus próprios logs
ALTER TABLE analyze_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analyze logs"
  ON analyze_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyze logs"
  ON analyze_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
