import { GoogleGenAI, Type } from "@google/genai";
import { Material } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const findMaterialWithAI = async (
  query: string,
  materials: Material[]
): Promise<{ sku: string; reasoning: string } | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const materialList = materials.map(m => `${m.sku}: ${m.description}`).join('\n');
    
    const prompt = `
      Você é um almoxarife experiente de uma sonda de perfuração de petróleo.
      O usuário está procurando um item de EPI com a seguinte descrição: "${query}".
      
      Abaixo está a lista de SKUs e Descrições oficiais:
      ---
      ${materialList}
      ---
      
      Encontre o material que melhor corresponde ao que o usuário pediu.
      Se o usuário for vago, tente adivinhar o item mais provável.
      
      Retorne a resposta estritamente em JSON no formato:
      {
        "sku": "SKU_ENCONTRADO",
        "reasoning": "Explicação curta do motivo."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sku: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text);
    return result.sku ? result : null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};