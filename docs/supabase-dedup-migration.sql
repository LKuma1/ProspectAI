-- Migration: Deduplicação de leads por usuário
-- Roda no Supabase SQL Editor
-- Garante que o mesmo negócio (mesmo nome + endereço) não seja inserido
-- mais de uma vez para o mesmo usuário, independente de quantas buscas o encontrarem.

-- 1. Remover duplicatas existentes (mantém o registro mais antigo)
DELETE FROM leads
WHERE id NOT IN (
  SELECT MIN(id)
  FROM leads
  GROUP BY user_id, name, address
);

-- 2. Adicionar constraint única
ALTER TABLE leads
ADD CONSTRAINT leads_user_place_unique
UNIQUE (user_id, name, address);
