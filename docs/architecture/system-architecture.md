# ProspectAI — System Architecture
> Brownfield Discovery | Fase 1 | @architect | 2026-03-05

## Visão Geral

ProspectAI é uma **SPA (Single Page Application)** construída em Next.js, focada em prospecção de leads B2B para o mercado brasileiro. A aplicação usa a IA Gemini (Google) para buscar e qualificar leads via Google Maps, gerando relatórios estratégicos de vendas.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | 15.5.12 |
| Runtime UI | React | 19.2.1 |
| Linguagem | TypeScript | 5.9.3 |
| Estilização | Tailwind CSS | 4.1.11 |
| AI Provider | Google Gemini SDK (`@google/genai`) | 1.17.0 |
| UI Primitives | Radix UI (Slot) | 1.2.4 |
| Icons | Lucide React | 0.553.0 |
| Markdown | react-markdown | 10.1.0 |
| Animações | motion | 12.23.24 |
| Utilitários CSS | clsx + tailwind-merge | — |
| Tipagem CV | class-variance-authority | 0.7.1 |
| Deploy | Vercel (standalone) | — |
| Node.js target | ES2017 | — |

---

## Arquitetura da Aplicação

```
ProspectAI/
├── app/
│   ├── layout.tsx          # RootLayout — fonte Inter, metadata, html lang="pt-BR"
│   ├── page.tsx            # Página principal — orquestra todo o fluxo (search→results→detail)
│   └── globals.css         # Tailwind + typography plugin
├── components/
│   ├── SearchForm.tsx      # Formulário de busca (ICP, serviço, estado, cidade)
│   ├── ResultsList.tsx     # Lista de leads (card/tabela toggle)
│   ├── LeadDetail.tsx      # Detalhe + relatório AI de um lead
│   └── ui/
│       ├── button.tsx      # Button component (shadcn-style, CVA + Radix Slot)
│       ├── input.tsx       # Input component
│       └── textarea.tsx    # Textarea component
├── hooks/
│   └── use-mobile.ts       # Hook `useIsMobile` (breakpoint 768px)
├── lib/
│   ├── constants.ts        # Lista dos 27 estados brasileiros
│   └── utils.ts            # `cn()` helper (clsx + twMerge)
├── types/
│   └── index.ts            # Tipos `Lead` e `SearchParams`
├── next.config.ts          # Configuração Next.js
├── tsconfig.json           # TypeScript strict mode
└── metadata.json           # Metadados do applet AI Studio
```

---

## Fluxo da Aplicação

```
Usuário
  │
  ▼
[SearchForm]
  │ ICP + Serviço + Estado + Cidade
  ▼
[page.tsx: handleSearch()]
  │ Gemini API (gemini-2.5-flash + googleMaps tool)
  │ Retorna JSON com 10-15 leads ranqueados por digitalPainScore
  ▼
[ResultsList]
  │ Card view / Table view (preferência salva no localStorage)
  │ Leads ordenados por digitalPainScore DESC
  ▼
[LeadDetail]
  │ Gemini API (gemini-3.1-pro-preview)
  │ Gera relatório Markdown com 5 seções
  ▼
[Relatório estratégico de vendas B2B]
```

---

## Padrão de State Management

State management **100% local via React useState** no `page.tsx`:

```
step: "search" | "results" | "detail"
searchParams: SearchParams | null
results: Lead[]
selectedLead: Lead | null
isLoading: boolean
error: string | null
```

**Sem:** Redux, Zustand, Context API, server state, cache, persistência (exceto `localStorage` para view mode).

---

## Integração com AI

### Chamada 1 — Busca de Leads (`page.tsx:59`)
- **Modelo:** `gemini-2.5-flash`
- **Tool:** `googleMaps: {}`
- **Temperatura:** 0.2
- **Output:** JSON array de leads com `digitalPainScore` e `aiSummary`
- **Fallback:** regex para extrair JSON malformado

### Chamada 2 — Relatório de Lead (`LeadDetail.tsx:73`)
- **Modelo:** `gemini-3.1-pro-preview` ⚠️ (modelo inválido)
- **Output:** Markdown com 5 seções estruturadas
- **Trigger:** `useEffect` ao montar `LeadDetail`

---

## Infraestrutura & Deploy

- **Plataforma:** Vercel (lkuma1s-projects)
- **URL produção:** https://prospectai-livid.vercel.app
- **Output mode:** `standalone` (Next.js)
- **CI/CD:** Nenhum (deploy manual via CLI)
- **Variáveis de ambiente:** `.env` local — **não configuradas na Vercel**

---

## Dependências Configuradas mas Não Utilizadas

| Dependência | Status |
|------------|--------|
| Supabase (URL + keys no .env) | Configurado, zero código de integração |
| `motion` library | Instalada, sem uso no código-fonte atual |
| `@hookform/resolvers` | Instalado, formulários usam estado manual |
| `hooks/use-mobile.ts` | Declarado, nunca importado |
