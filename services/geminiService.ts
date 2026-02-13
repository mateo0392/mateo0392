
import { GoogleGenAI } from "@google/genai";

export const getJungleWisdom = async (score: number): Promise<string> => {
  try {
    // Always initialize GoogleGenAI with the apiKey property from process.env.API_KEY
    // Initializing inside the function ensures the most up-to-date key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe un mensaje corto y divertido de 1 frase en español para un mono que ha recolectado ${score} bananas en una jungla peligrosa. Sé animador y con temática de selva.`,
      config: {
        systemInstruction: "Eres Mei Hóuwáng, el legendario Rey Mono sabio de la selva. Hablas con humor y sabiduría tropical.",
      }
    });
    // Extract text directly from the response object's text property
    return response.text || "¡Sigue corriendo, monito!";
  } catch (error) {
    console.error("Error fetching jungle wisdom:", error);
    return "¡Las bananas te dan fuerza!";
  }
};
