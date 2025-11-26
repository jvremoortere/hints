import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  
  // Debug log to check if key is loaded in production (Do not log the full key)
  console.log("Gemini Client Init. Key available?", !!apiKey, "Length:", apiKey?.length);

  if (!apiKey) {
    throw new Error("API Key is missing. Zorg dat API_KEY is ingesteld in Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const extractConcepts = async (text: string): Promise<string[]> => {
  if (!text || text.trim().length === 0) return [];

  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyseer de volgende tekst en extraheer een lijst van duidelijke, zelfstandige naamwoorden of korte concepten die geschikt zijn voor het spel '30 Seconds'. 
      Het moeten begrippen zijn die mensen kunnen omschrijven. Vermijd vage termen.
      Zorg voor een ruime hoeveelheid unieke begrippen als de tekst dit toelaat.
      
      Tekst:
      "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            concepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Een lijst van unieke begrippen gevonden in de tekst."
            }
          },
          required: ["concepts"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    return parsed.concepts || [];
  } catch (error) {
    console.error("Error extracting concepts:", error);
    throw error;
  }
};