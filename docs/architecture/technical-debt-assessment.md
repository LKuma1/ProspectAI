# ProspectAI — Technical Debt Assessment
> Brownfield Discovery | Fases 4-8 | @architect + @qa | 2026-03-05

## Resumo Executivo

O ProspectAI é um MVP funcional com arquitetura simples e entrega de valor imediata, mas carrega **dívidas técnicas críticas de segurança e confiabilidade** que devem ser endereçadas antes de qualquer crescimento de base de usuários.

**Veredicto QA:** NEEDS WORK — 3 itens CRITICAL devem ser resolvidos antes da próxima release.

---

## Inventário de Dívida Técnica

### CRITICAL

#### TD-001 — API Key Gemini Exposta no Bundle Client-Side
- **Arquivo:** `app/page.tsx:25`, `components/LeadDetail.tsx:37`
- **Problema:** `NEXT_PUBLIC_GEMINI_API_KEY` é injetada no bundle JavaScript pelo Next.js. Qualquer usuário pode inspecionar o source e extrair a chave.
- **Risco:** Uso não autorizado da API, custos inesperados, esgotamento de quota, vazamento de dados de prospecção.
- **Solução:** Mover ambas as chamadas Gemini para Next.js API Routes (`app/api/search/route.ts` e `app/api/analyze/route.ts`). Remover prefixo `NEXT_PUBLIC_`.
- **Esforço:** M (3-5h)

#### TD-002 — Modelo Gemini Inválido em LeadDetail
- **Arquivo:** `components/LeadDetail.tsx:74`
- **Problema:** `model: "gemini-3.1-pro-preview"` não existe no catálogo Google AI. A chamada falha silenciosamente ou retorna erro 404.
- **Risco:** Funcionalidade de relatório de lead **completamente quebrada** em produção.
- **Solução:** Substituir por `gemini-2.5-flash` ou `gemini-1.5-pro`.
- **Esforço:** XS (< 30min)

#### TD-003 — Variáveis de Ambiente Não Configuradas na Vercel
- **Contexto:** Deploy realizado, mas `NEXT_PUBLIC_GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` existem apenas no `.env` local.
- **Risco:** Aplicação em produção (https://prospectai-livid.vercel.app) falha em todas as chamadas AI.
- **Solução:** Configurar env vars no painel da Vercel ou via `vercel env add`.
- **Esforço:** XS (< 15min)

---

### HIGH

#### TD-004 — Supabase Configurado mas Não Integrado
- **Arquivo:** `.env` (3 vars), zero código de uso
- **Problema:** Credenciais do Supabase presentes sem nenhuma integração. Indica funcionalidades planejadas (autenticação, persistência de leads, histórico de buscas) não implementadas.
- **Risco:** Falsa sensação de persistência, surface de ataque desnecessária.
- **Decisão necessária:** Implementar integração OU remover as credenciais do projeto.
- **Esforço:** L (depende do escopo de integração)

#### TD-005 — Zero Testes
- **Problema:** Nenhum arquivo de teste encontrado (`.test.ts`, `.spec.ts`, etc.).
- **Risco:** Regressões silenciosas, impossibilidade de CI/CD confiável.
- **Cobertura mínima necessária:** `SearchForm` (validação), `ResultsList` (renderização), helpers de score, parsing de JSON Gemini.
- **Esforço:** L (8-12h)

#### TD-006 — Sem Pipeline CI/CD
- **Problema:** Nenhum workflow GitHub Actions. Deploy é 100% manual.
- **Risco:** Deploy de código quebrado, sem gates de qualidade automáticos.
- **Solução:** Workflow básico: lint + typecheck + build na PR, deploy automático no merge.
- **Esforço:** S (2-4h)

#### TD-007 — Sem Persistência de Resultados
- **Problema:** Resultados de busca perdidos ao recarregar. Não há histórico de leads visitados.
- **Risco:** UX ruim, usuários perdem trabalho.
- **Solução curto prazo:** `sessionStorage` para resultados. Longo prazo: Supabase.
- **Esforço:** S (2-4h)

---

### MEDIUM

#### TD-008 — Tipos `any` em Domínio Core
- **Arquivo:** `types/index.ts:13-16`
- **Campos:** `regularOpeningHours?: any`, `photos?: any[]`, `reviews?: any[]`
- **Problema:** Perda de type safety em dados vindos da API.
- **Solução:** Definir interfaces `Review`, `Photo`, `OpeningHours`.
- **Esforço:** S (1-2h)

#### TD-009 — Hook `useIsMobile` Declarado, Nunca Usado
- **Arquivo:** `hooks/use-mobile.ts`
- **Problema:** Dead code. Comportamento mobile é tratado apenas via CSS.
- **Solução:** Remover o arquivo ou integrá-lo.
- **Esforço:** XS

#### TD-010 — Sem Error Boundary React
- **Problema:** Erros em componentes derrubam a aplicação inteira sem mensagem adequada.
- **Solução:** `<ErrorBoundary>` no `layout.tsx`.
- **Esforço:** S (1h)

#### TD-011 — Biblioteca `motion` Instalada, Não Utilizada
- **Problema:** `motion` (12.23.24) está nas dependências mas sem uso no código atual. Animações CSS do Next.js (`animate-in fade-in`) substituem.
- **Impacto:** +peso no bundle desnecessário.
- **Solução:** Remover ou usar efetivamente.
- **Esforço:** XS

#### TD-012 — `@hookform/resolvers` Instalado, Não Utilizado
- **Problema:** Formulários usam estado manual com `useState`. Biblioteca de form instalada sem uso.
- **Esforço:** XS (remover da dependência)

---

### LOW

#### TD-013 — Parsing de JSON Frágil
- **Arquivo:** `app/page.tsx:72-81`
- **Problema:** Fallback com regex para JSON malformado da Gemini. Sem schema validation (ex: Zod).
- **Esforço:** S

#### TD-014 — `window.location.reload()` como Retry
- **Arquivo:** `components/LeadDetail.tsx:243`
- **Problema:** Reload completo da página para retentar geração de relatório.
- **Solução:** Refetch apenas da chamada de API.
- **Esforço:** XS

#### TD-015 — Sem Feedback para Lista Vazia de Leads
- **Problema:** Se Gemini retorna `[]`, `ResultsList` renderiza "0 Leads Encontrados" sem contexto.
- **Esforço:** XS

---

## Matriz de Priorização

```
IMPACTO
  │
A │  TD-001 (seg)   TD-003 (env)
L │  TD-002 (modelo)
T │  ───────────────────────────── CRITICAL threshold
O │  TD-004 (supabase) TD-005 (tests) TD-006 (ci)
  │  TD-007 (persist)
  │  ───────────────────────────── HIGH threshold
M │  TD-008 TD-010 TD-012
É │
D │
I │  TD-009 TD-011 TD-013 TD-014 TD-015
O │
  └──────────────────────────────────────── ESFORÇO →
         XS    S    M    L
```

---

## Roadmap Sugerido

### Sprint 1 — Segurança & Funcionalidade (urgente)
1. TD-003: Configurar env vars na Vercel
2. TD-002: Corrigir modelo Gemini inválido
3. TD-001: Mover chamadas AI para API Routes

### Sprint 2 — Qualidade
4. TD-005: Testes unitários básicos
5. TD-006: GitHub Actions CI/CD
6. TD-008: Tipagem completa do domínio

### Sprint 3 — Features & UX
7. TD-004: Definir e implementar integração Supabase (auth + histórico)
8. TD-007: Persistência de sessão de busca
9. TD-010: Error Boundary

### Housekeeping (paralelo)
- TD-009, TD-011, TD-012: Remover dead code e dependências não usadas
- TD-013, TD-014, TD-015: Melhorias incrementais de robustez
