-- =============================================
-- ProspectAI — Migração: Persistência de Leads
-- Execute no SQL Editor do Supabase
-- =============================================

-- Tabela de buscas
create table if not exists public.searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  icp text not null,
  service text not null,
  state text not null,
  city text,
  leads_count int default 0,
  created_at timestamptz default now()
);

-- Tabela de leads
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  search_id uuid references public.searches(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  state text,
  rating numeric,
  user_rating_count int,
  primary_type text,
  national_phone_number text,
  website_uri text,
  google_maps_uri text,
  digital_pain_score int,
  ai_summary text,
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists searches_user_id_idx on public.searches(user_id);
create index if not exists leads_search_id_idx on public.leads(search_id);
create index if not exists leads_user_id_idx on public.leads(user_id);

-- RLS
alter table public.searches enable row level security;
alter table public.leads enable row level security;

-- Políticas: usuário vê e insere apenas seus próprios dados
create policy "users manage own searches"
  on public.searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own leads"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins veem tudo
create policy "admins view all searches"
  on public.searches for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "admins view all leads"
  on public.leads for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));
