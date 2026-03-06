-- =============================================
-- ProspectAI — Setup do Supabase
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de perfis (estende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now()
);

-- 2. Habilitar Row Level Security
alter table public.profiles enable row level security;

-- 3. Políticas RLS

-- Usuários autenticados podem ver o próprio perfil
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins podem ver todos os perfis
create policy "admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins podem atualizar qualquer perfil
create policy "admins can update profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Qualquer usuário autenticado pode inserir o próprio perfil (no cadastro)
create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. Desabilitar confirmação de e-mail (opcional — para facilitar testes)
-- Faça isso em: Authentication > Settings > Email confirmations (desligar)

-- =============================================
-- APÓS CRIAR SUA CONTA NO APP:
-- Execute a query abaixo para se tornar admin
-- (substitua pelo seu e-mail)
-- =============================================

-- update public.profiles
-- set role = 'admin', status = 'active'
-- where email = 'seu@email.com';
