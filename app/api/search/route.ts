import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { icp, service, state, city, leadsCount = 10 } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const locationStr = city ? `${city}, ${state}, Brasil` : `${state}, Brasil`;

    const prompt = `
      Você é um especialista em prospecção B2B.
      O usuário está procurando por leads com o seguinte Perfil de Cliente Ideal (ICP): "${icp}".
      A localização alvo é: "${locationStr}".
      O usuário oferece o seguinte serviço: "${service}".

      Use o Google Maps para encontrar exatamente ${leadsCount} negócios reais que correspondam a este ICP nesta localização.

      Para cada negócio encontrado, forneça os seguintes dados em formato JSON estrito (uma array de objetos):
      [
        {
          "id": "um identificador único gerado por você",
          "name": "Nome do negócio",
          "address": "Endereço completo",
          "city": "Cidade",
          "state": "Estado",
          "rating": 4.5,
          "userRatingCount": 120,
          "primaryType": "Categoria principal",
          "nationalPhoneNumber": "Telefone se disponível, ou null",
          "websiteUri": "Website se disponível, ou null",
          "googleMapsUri": "Link do Google Maps se disponível, ou null",
          "digitalPainScore": um número de 0 a 100 (onde 100 é a maior oportunidade para vender o serviço. Dê pontos por falta de site, poucas fotos, nota baixa, poucas avaliações, sem telefone, etc),
          "aiSummary": "Resumo de oportunidade de no máximo 3 linhas em português (pt-BR), explicando por que este negócio é um bom lead para o serviço oferecido."
        }
      ]

      Retorne APENAS o JSON válido, sem blocos de código markdown (\`\`\`json) e sem texto adicional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.2,
      },
    });

    let text = response.text || "[]";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let searchResults = [];
    try {
      searchResults = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        searchResults = JSON.parse(match[0]);
      } else {
        throw new Error("Invalid JSON response from Gemini");
      }
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps?.uri && chunk.maps?.title) {
          const matchedResult = searchResults.find(
            (r: any) =>
              r.name.toLowerCase().includes(chunk.maps.title.toLowerCase()) ||
              chunk.maps.title.toLowerCase().includes(r.name.toLowerCase())
          );
          if (matchedResult && !matchedResult.googleMapsUri) {
            matchedResult.googleMapsUri = chunk.maps.uri;
          }
        }
      });
    }

    searchResults.sort(
      (a: any, b: any) => (b.digitalPainScore || 0) - (a.digitalPainScore || 0)
    );

    // Salvar no Supabase (não bloqueia a resposta se falhar)
    if (user) {
      try {
        const { data: search } = await supabase
          .from("searches")
          .insert({ user_id: user.id, icp, service, state, city, leads_count: searchResults.length })
          .select("id")
          .single();

        if (search?.id) {
          await supabase.from("leads").insert(
            searchResults.map((r: any) => ({
              search_id: search.id,
              user_id: user.id,
              name: r.name,
              address: r.address,
              city: r.city,
              state: r.state,
              rating: r.rating,
              user_rating_count: r.userRatingCount,
              primary_type: r.primaryType,
              national_phone_number: r.nationalPhoneNumber,
              website_uri: r.websiteUri,
              google_maps_uri: r.googleMapsUri,
              digital_pain_score: r.digitalPainScore,
              ai_summary: r.aiSummary,
            }))
          );
        }
      } catch (saveError) {
        console.error("Failed to save search results:", saveError);
      }
    }

    return NextResponse.json({ results: searchResults });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar leads" },
      { status: 500 }
    );
  }
}
