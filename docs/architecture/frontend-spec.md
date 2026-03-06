# ProspectAI — Frontend Specification
> Brownfield Discovery | Fase 3 | @ux-design-expert | 2026-03-05

## Design System

### Paleta de Cores
| Token | Valor | Uso |
|-------|-------|-----|
| `slate-900` | #0f172a | Header, títulos, fundo dark cards |
| `slate-50` | #f8fafc | Background da página |
| `blue-600` | #2563eb | CTA primário, foco, links |
| `amber-400` | #fbbf24 | Ícone estrela (avaliações) |
| `rose-*` | — | Erros, alta oportunidade (pain score) |
| `emerald-*` | — | Sucesso, baixa oportunidade |
| `amber-*` | — | Oportunidade média |

### Tipografia
- **Fonte:** Inter (Google Fonts, subsets: latin)
- **Variable:** `--font-sans`
- **Antialiased:** ativado globalmente

### Componentes UI

#### Button (`components/ui/button.tsx`)
Baseado em CVA + Radix Slot. Variantes:
- `default` — azul sólido (CTA)
- `outline` — borda cinza, fundo branco
- `ghost` — sem borda, hover cinza
- `secondary`, `destructive`, `link`

Tamanhos: `default (h-10)`, `sm (h-9)`, `lg (h-11)`, `icon (h-10 w-10)`

#### Input / Textarea
Estilo Tailwind puro com foco `ring-2 ring-blue-600`.

---

## Telas / Fluxo de Navegação

### Tela 1 — Search (estado inicial)
```
┌─────────────────────────────────────┐
│  Header: ProspectAI sticky dark     │
├─────────────────────────────────────┤
│  Card centralizado max-w-2xl        │
│  ┌─────────────────────────────────┐│
│  │ Descreva seu ICP               ││
│  │ [Textarea]                     ││
│  │ Qual serviço você oferece?     ││
│  │ [Textarea]                     ││
│  │ Estado [Select] | Cidade [Input]││
│  │ [Buscar Leads — CTA full width] ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Tela 2 — Results
```
┌─────────────────────────────────────┐
│  ← Nova Busca | N Leads Encontrados │
│  [Card View] [Table View] toggle    │
├─────────────────────────────────────┤
│  Grid 1/2/3 colunas (responsive)   │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Lead 1│ │Lead 2│ │Lead 3│        │
│  │Score │ │Score │ │Score │        │
│  │[Ver] │ │[Ver] │ │[Ver] │        │
│  └──────┘ └──────┘ └──────┘        │
│  OU tabela responsiva               │
└─────────────────────────────────────┘
```

### Tela 3 — Lead Detail
```
┌─────────────────────────────────────┐
│  ← Voltar | [Copiar Relatório]      │
├──────────┬──────────────────────────┤
│ Col 1/3  │ Col 2/3                  │
│ Info Lead│ Relatório Markdown AI    │
│ Rating   │ ## Diagnóstico Digital   │
│ Telefone │ ## Análise de Avaliações │
│ Website  │ ## Por que IA            │
│ Maps     │ ## Abordagem de Vendas   │
│          │ ## Impacto Estimado      │
│ [Pain    │                          │
│  Score]  │ (loading spinner 8s+)    │
└──────────┴──────────────────────────┘
```

---

## Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| Mobile | Cards empilhados (1 col), header compacto |
| sm (640px) | Header mostra subtítulo, grid 1 col |
| md (768px) | Grid 2 cols em Results |
| lg (1024px) | Grid 3 cols em Results, 2 colunas em Detail |

---

## UX Gaps Identificados

| # | Gap | Severidade |
|---|-----|-----------|
| 1 | Sem paginação — todos os leads carregados de uma vez | MEDIUM |
| 2 | Resultados perdidos ao recarregar a página | HIGH |
| 3 | Sem feedback de "sem resultados" quando Gemini retorna lista vazia | HIGH |
| 4 | Retry de erro em LeadDetail recarrega a página inteira (`window.location.reload`) | MEDIUM |
| 5 | `useIsMobile` hook criado mas sem uso — adaptações mobile são apenas CSS | LOW |
| 6 | Sem skeleton loader — apenas spinner simples | LOW |
| 7 | Sem ordenação manual da lista de resultados | LOW |
| 8 | Score visual sem explicação de como foi calculado | MEDIUM |
| 9 | Formulário sem validação visual de comprimento mínimo do ICP/serviço | LOW |
| 10 | Copiar relatório sem fallback para browsers sem clipboard API | LOW |
