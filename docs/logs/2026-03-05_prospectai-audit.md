# ProspectAI — Relatório de Auditoria Técnica Consolidado
> Brownfield Discovery | 2026-03-05 | Synkra AIOS

---

## Sumário Executivo

| Fase | Score (1-10) | Principal Achado |
|------|-------------|-----------------|
| Arquitetura | 3/10 | API key exposta no client, modelo AI inválido, produção inoperante |
| Dados | 2/10 | Sem persistência, sem auth, Supabase configurado mas não implementado |
| Frontend/UX | 6/10 | Estrutura visual sólida, falhas de acessibilidade e UX de erros |
| **CONSOLIDADO** | **3.7/10** | **3 P0 bloqueantes em produção** |

---

## Fase 1: Arquitetura

### Análise

**Stack:** Next.js 15.5.12 / React 19 / TypeScript 5.9.3 / Tailwind CSS v4 / Vercel

**Estrutura de arquivos (22 arquivos src):**
```
app/         → layout.tsx, page.tsx, globals.css
components/  → SearchForm, ResultsList, LeadDetail, ui/{button,input,textarea}
hooks/       → use-mobile.ts (não utilizado)
lib/         → constants.ts, utils.ts
types/       → index.ts
```

**Padrões observados:**
- ✅ TypeScript strict mode ativado
- ✅ Path aliases configurados (`@/*`)
- ✅ Componentes UI reutilizáveis (shadcn-style)
- ❌ Lógica de negócio (chamada AI) dentro de componentes React
- ❌ `page.tsx` viola SRP: state + API + parsing + UI
- ❌ Zero separação entre camada de serviço e apresentação

### Débitos Arquiteturais

| ID | Débito | Severidade |
|----|--------|-----------|
| A-01 | `NEXT_PUBLIC_GEMINI_API_KEY` exposta no bundle client-side | **P0** |
| A-02 | Modelo `gemini-3.1-pro-preview` inválido — funcionalidade core quebrada | **P0** |
| A-03 | Env vars não configuradas na Vercel — produção 100% inoperante | **P0** |
| A-04 | Zero testes automatizados | **P1** |
| A-05 | Sem CI/CD pipeline (GitHub Actions) | **P1** |
| A-06 | Chamada AI dentro de componente React (LeadDetail) | **P1** |
| A-07 | `page.tsx` viola SRP: state + API + parsing + UI em ~190 linhas | **P2** |
| A-08 | `motion` e `@hookform/resolvers` instalados sem uso (+bundle weight) | **P2** |
| A-09 | Parsing de JSON da Gemini frágil — regex fallback sem schema validation (Zod) | **P2** |
| A-10 | `output: 'standalone'` desnecessário com integração nativa Vercel | **P3** |

---

## Fase 2: Dados

### Análise

**Banco de dados:** Supabase configurado (3 env vars presentes), **zero integração em código-fonte**.

**Fluxo de dados atual:**
```
User Input → Gemini API (client) → JSON em memória → useState → UI
                                                                ↓
                                                    localStorage (somente view mode)
```

**Segurança:**
- API Key Gemini exposta em 2 arquivos client-side
- Sem autenticação de usuário — qualquer pessoa usa a quota da API
- Dados sensíveis (estratégia de vendas, ICP do cliente) processados no browser

**Persistência:**
- Resultados de busca: voláteis (perdidos ao refresh)
- Preferência de view mode: `localStorage` (sem try/catch)
- Histórico de leads: inexistente

**Performance de dados:**
- Sem cache — cada busca nova = nova chamada Gemini (~$)
- Sem paginação — todos os leads em memória
- Sem debounce no submit

### Débitos de Dados

| ID | Débito | Severidade |
|----|--------|-----------|
| D-01 | Sem autenticação — API key compartilhada, sem controle de acesso | **P0** |
| D-02 | Dados de leads e estratégias completamente voláteis (perdidos ao refresh) | **P1** |
| D-03 | Supabase configurado mas sem implementação — funcionalidades implícitas ausentes | **P1** |
| D-04 | Sem rate limiting — chamadas Gemini ilimitadas por usuário | **P1** |
| D-05 | Tipos `any` em campos core: `reviews`, `photos`, `regularOpeningHours` | **P2** |
| D-06 | Sem cache de resultados — custo de API sem controle | **P2** |
| D-07 | Input sem validação de tamanho máximo / sanitização de XSS | **P2** |
| D-08 | `localStorage` sem try/catch — falha silenciosa em modo privado | **P3** |

---

## Fase 3: Frontend / UX

### Análise

**Inventário de componentes:**

| Componente | Linhas | Status |
|-----------|--------|--------|
| `page.tsx` | 189 | Monolítico (ver A-07) |
| `SearchForm.tsx` | 123 | ✅ Focado |
| `ResultsList.tsx` | 254 | ✅ Focado |
| `LeadDetail.tsx` | 259 | ❌ Misto (UI + lógica AI) |
| `ui/button.tsx` | 54 | ✅ Reutilizável |

**Acessibilidade WCAG:**
- `lang="pt-BR"` no html ✅
- `focus-visible:ring-2` no sistema de design ✅
- `slate-400` sobre branco: contraste 2.8:1 ❌ (mínimo: 4.5:1)
- Ícones Lucide sem `aria-label`/`aria-hidden` ❌
- `<select>` sem `id`/`for` associado ao `<label>` ❌
- `animate-spin` sem `prefers-reduced-motion` ❌

**Responsividade:**
- Grid responsivo 1/2/3 colunas ✅
- Tabela sem scroll horizontal explícito em mobile ❌
- Header compacto em mobile ✅

**Design System:**
- Tokens de cor consistentes via Tailwind ✅
- Sem dark mode
- Sem formalização de escala tipográfica

### Débitos Frontend/UX

| ID | Débito | Severidade |
|----|--------|-----------|
| U-01 | Contraste `slate-400` sobre branco: 2.8:1 (falha WCAG AA) | **P1** |
| U-02 | Ícones sem `aria-label`/`aria-hidden` | **P1** |
| U-03 | `<select>` sem associação programática ao `<label>` | **P1** |
| U-04 | Tabela de resultados sem scroll horizontal em mobile | **P1** |
| U-05 | `animate-spin` sem `prefers-reduced-motion` | **P2** |
| U-06 | Sem estado de lista vazia com mensagem contextual | **P2** |
| U-07 | Retry de erro via `window.location.reload()` destrói sessão | **P2** |
| U-08 | Sem skeleton loader — transição de carregamento abrupta | **P3** |
| U-09 | `use-mobile.ts` declarado e nunca importado (dead code) | **P3** |
| U-10 | Sem dark mode | **P3** |

---

## Consolidado: Débitos Priorizados

### P0 — Corrigir Imediatamente (3 itens)

| ID | Débito | Impacto |
|----|--------|---------|
| A-01 / D-01 | API Key Gemini exposta no bundle JS do browser | Segurança crítica + custo descontrolado |
| A-02 | Modelo `gemini-3.1-pro-preview` inválido em `LeadDetail.tsx:74` | Feature principal 100% quebrada |
| A-03 | Env vars não configuradas na Vercel | App em produção completamente inoperante |

### P1 — Corrigir Neste Sprint (9 itens)

| ID | Débito |
|----|--------|
| A-04 | Zero testes automatizados |
| A-05 | Sem CI/CD (GitHub Actions) |
| A-06 | Chamada AI dentro de componente React |
| D-02 | Dados voláteis — sem persistência de sessão |
| D-03 | Supabase configurado sem implementação |
| D-04 | Sem rate limiting nas chamadas Gemini |
| U-01 | Contraste `slate-400` abaixo do WCAG AA |
| U-02 | Ícones sem atributos de acessibilidade |
| U-04 | Tabela sem scroll horizontal em mobile |

### P2 — Próximo Sprint (8 itens)

| ID | Débito |
|----|--------|
| A-07 | `page.tsx` monolítico (SRP) |
| A-08 | Dependências não utilizadas (`motion`, `@hookform/resolvers`) |
| A-09 | Parsing de JSON sem schema validation |
| D-05 | Tipos `any` no domínio core |
| D-06 | Sem cache de resultados |
| D-07 | Input sem validação/sanitização |
| U-05 | `animate-spin` sem `prefers-reduced-motion` |
| U-07 | Retry via `window.location.reload()` |

### P3 — Backlog (6 itens)

| ID | Débito |
|----|--------|
| A-10 | `output: 'standalone'` desnecessário |
| D-08 | `localStorage` sem try/catch |
| U-03 | `<select>` sem associação programática ao label |
| U-06 | Sem estado visual de lista vazia |
| U-08 | Sem skeleton loader |
| U-09 | `use-mobile.ts` dead code |
| U-10 | Sem dark mode |

---

## Roadmap Sugerido

### Sprint 1 — Segurança & Operacionalidade (urgente, ~1 dia)
1. **A-03:** Configurar todas as env vars na Vercel via CLI ou painel
2. **A-02:** Corrigir modelo `gemini-3.1-pro-preview` → `gemini-2.5-flash`
3. **A-01 + D-01:** Criar `app/api/search/route.ts` e `app/api/analyze/route.ts`, remover `NEXT_PUBLIC_` da key

### Sprint 2 — Qualidade & Acessibilidade (~1 semana)
4. **A-04:** Testes unitários: SearchForm, ResultsList, parsing de JSON, score logic
5. **A-05:** GitHub Actions: lint + typecheck + build na PR
6. **U-01 + U-02 + U-03 + U-04:** Correções de acessibilidade
7. **D-04:** Rate limiting básico (middleware Next.js ou Vercel Edge)

### Sprint 3 — Produto & Persistência (~2 semanas)
8. **D-02 + D-03:** Implementar Supabase: auth + histórico de leads + favoritos
9. **A-07:** Extrair camada de serviço AI de `page.tsx`
10. **D-06:** Cache de resultados com TTL

---

## Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Total de arquivos (src) | 22 |
| Linhas de código | ~800 |
| Componentes | 7 (4 feature + 3 UI) |
| API Routes | 0 |
| Testes | 0 |
| Total de débitos mapeados | 28 |
| P0 | 3 |
| P1 | 9 |
| P2 | 8 |
| P3 | 7 |
| Score consolidado | 3.7/10 |

---

*Gerado via `/AIOS:tasks:brownfield-discovery` — Synkra AIOS | 2026-03-05*
