# ProspectAI — Relatório Executivo de Descoberta Brownfield
> @analyst | 2026-03-05 | Versão 1.0

---

## O Produto

**ProspectAI** é uma ferramenta de prospecção de leads B2B com IA para o mercado brasileiro. O usuário descreve seu cliente ideal (ICP) e o serviço que oferece; a IA usa Google Maps + Gemini para encontrar 10–15 negócios locais, ranqueá-los por oportunidade de venda ("Digital Pain Score") e gerar relatórios estratégicos personalizados de abordagem.

**URL de produção:** https://prospectai-livid.vercel.app

---

## Snapshot Técnico

| Dimensão | Status |
|----------|--------|
| Framework | Next.js 15.5.12 / React 19 / TypeScript 5.9 |
| AI | Google Gemini (`@google/genai` SDK) |
| Banco de dados | Supabase (credenciais configuradas, **sem integração**) |
| Deploy | Vercel — lkuma1s-projects |
| Testes | **Zero** |
| CI/CD | **Nenhum** |
| Linhas de código (src) | ~800 linhas (22 arquivos, excl. node_modules) |
| Componentes | 4 principais + 3 UI + 1 hook + 2 lib |
| API Routes | **Nenhuma** — toda lógica no client |

---

## Achados Críticos (Ação Imediata)

### 🔴 CRÍTICO 1 — API Key da Gemini Visível no Browser

A chave `NEXT_PUBLIC_GEMINI_API_KEY` é embutida no bundle JavaScript e visível para qualquer usuário no DevTools. Isso expõe a organização a:
- Uso não autorizado e custos de API não controlados
- Possível acesso a dados de prospecção de clientes

**Ação:** Mover todas as chamadas Gemini para API Routes do Next.js (servidor).

---

### 🔴 CRÍTICO 2 — Funcionalidade de Relatório Quebrada em Produção

O modelo `"gemini-3.1-pro-preview"` (usado em `LeadDetail.tsx:74`) **não existe** na API Google AI. A tela de relatório de lead — funcionalidade central do produto — falha para todos os usuários em produção.

**Ação:** Corrigir para `gemini-2.5-flash` imediatamente.

---

### 🔴 CRÍTICO 3 — Variáveis de Ambiente Não Configuradas na Vercel

O deploy foi realizado com sucesso, mas as variáveis de ambiente existem apenas no `.env` local. Em produção, `NEXT_PUBLIC_GEMINI_API_KEY` é `undefined` — a busca de leads também falha.

**Ação:** Configurar todas as env vars no painel da Vercel.

---

## Achados de Alta Prioridade

| # | Achado | Impacto |
|---|--------|---------|
| H1 | Supabase configurado, zero integração — funcionalidades de persistência não entregues | Produto incompleto |
| H2 | Zero testes automatizados | Risco de regressão a cada mudança |
| H3 | Sem CI/CD — deploys manuais | Risco operacional |
| H4 | Sem persistência de sessão — resultados perdidos ao recarregar | UX ruim |

---

## Oportunidades de Produto (Backlog Natural)

Com a estrutura atual, as evoluções mais óbvias e de maior valor são:

1. **Autenticação (Supabase Auth)** — salvar histórico de buscas e leads favoritos por usuário
2. **CRM Leve** — pipeline de status por lead (Novo → Contatado → Proposta → Fechado)
3. **Exportação** — CSV/PDF dos leads encontrados
4. **Filtros avançados** — por setor, faixa de avaliação, presença/ausência de website
5. **Multi-busca** — comparar resultados de diferentes ICPs/localidades
6. **Relatório em PDF** — versão para enviar ao cliente final

---

## Saúde Geral do Codebase

```
Segurança        ██░░░░░░░░  2/10  (API key exposta, sem auth)
Confiabilidade   ███░░░░░░░  3/10  (modelo inválido, sem testes, sem retry)
Manutenibilidade █████░░░░░  5/10  (código limpo, mas sem testes nem tipos completos)
Performance      ███████░░░  7/10  (SPA leve, Tailwind, sem otimizações avançadas)
UX               ██████░░░░  6/10  (fluxo claro, mas sem persistência e erros frágeis)
```

---

## Próximos Passos Priorizados

```
Semana 1 (URGENTE):
  ✅ Deploy na Vercel — FEITO
  🔴 Configurar env vars na Vercel
  🔴 Corrigir modelo gemini-3.1-pro-preview → gemini-2.5-flash
  🔴 Mover chamadas AI para API Routes (proteger a chave)

Semana 2:
  ⚡ Adicionar testes unitários mínimos
  ⚡ Configurar GitHub Actions (lint + typecheck + build)
  ⚡ Definir escopo da integração Supabase

Semana 3+:
  🚀 Implementar Supabase (auth + histórico de leads)
  🚀 Persistência de sessão
  🚀 Error Boundary e UX de erros
```

---

## Arquivos de Referência

| Documento | Caminho |
|-----------|---------|
| Arquitetura do Sistema | `docs/architecture/system-architecture.md` |
| Especificação Frontend/UX | `docs/architecture/frontend-spec.md` |
| Assessment Técnico Detalhado | `docs/architecture/technical-debt-assessment.md` |

---

*Relatório gerado via Brownfield Discovery — Synkra AIOS*
