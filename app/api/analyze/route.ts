import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RATE_LIMIT_MAX_REPORTS = 20;
const RATE_LIMIT_WINDOW_MINUTES = 60;

export async function POST(request: NextRequest) {
  try {
    const { lead, service } = await request.json();

    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Rate limiting: máx 20 relatórios por hora por usuário
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("analyze_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX_REPORTS) {
      return NextResponse.json(
        { error: `Limite de ${RATE_LIMIT_MAX_REPORTS} relatórios por hora atingido. Tente novamente mais tarde.` },
        { status: 429 }
      );
    }

    // Registrar uso (não bloqueia se falhar)
    supabase.from("analyze_logs").insert({ user_id: user.id }).then(() => {});

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const reportPrompt = `
      Você é um consultor de vendas B2B especialista em IA.
      O usuário está tentando vender o seguinte serviço: "${service}".

      Aqui estão os dados do lead (empresa):
      Nome: ${lead.name}
      Endereço: ${lead.address}
      Avaliação: ${lead.rating} (${lead.userRatingCount} avaliações)
      Website: ${lead.websiteUri ? "Sim" : "Não"}
      Telefone: ${lead.nationalPhoneNumber ? "Sim" : "Não"}
      Tipos: ${lead.types?.join(", ")}

      Avaliações recentes:
      ${
        lead.reviews
          ?.map((r: { rating: number; text?: { text: string } }) => `- ${r.rating} estrelas: "${r.text?.text}"`)
          .join("\n") || "Nenhuma avaliação detalhada disponível."
      }

      Gere um relatório de oportunidade de vendas completo em formato Markdown (pt-BR).
      O relatório DEVE conter as seguintes seções (use headers h2 ##):

      ## Diagnóstico Digital
      (Analise o que está faltando ou fraco na presença online deles com base nos dados acima)

      ## Análise de Avaliações
      (Resumo do sentimento das avaliações e reclamações comuns, se houver)

      ## Por que esta empresa precisa de IA
      (Conecte as dores específicas deles com o serviço de IA oferecido pelo usuário)

      ## Abordagem de Vendas Sugerida
      (Como o usuário deve abordar este lead, o que dizer na primeira mensagem/ligação)

      ## Impacto Estimado
      (O que a IA poderia melhorar para eles em termos de negócios/faturamento/tempo)
    `;

    const reportResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: reportPrompt,
    });

    return NextResponse.json({ report: reportResponse.text || "Relatório não gerado." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar relatório";
    console.error("Analyze API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
