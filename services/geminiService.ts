
import { GoogleGenAI, Type } from "@google/genai";
import { ProductiveSuggestion } from '../types';

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getNewProductiveSuggestions = async (): Promise<ProductiveSuggestion[]> => {
    try {
        const ai = getAi();
        const prompt = `
            Generate a list of 5 diverse and actionable productive alternatives to scrolling social media.
            These should be short activities, under 10 minutes, designed to help someone reset their focus.
            Examples include physical breaks, mindfulness exercises, or quick organizational tasks.
            For each suggestion, provide a title and a short description.
        `;
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Updated to the latest stable flash model
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "The title of the productive activity." },
                            description: { type: Type.STRING, description: "A brief explanation of the activity." }
                        },
                        required: ["title", "description"]
                    }
                }
            }
        });
        const text = response.text.trim();
        const data: ProductiveSuggestion[] = JSON.parse(text);
        return data;
    } catch (error) {
        console.error("Error fetching productive suggestions from Gemini API:", error);
        // Fallback
        return [
            { title: "5-Minute Walk", description: "Step away from your desk and stretch your legs." },
            { title: "Mindful Breathing", description: "Close your eyes and focus on your breath for 2 minutes." },
            { title: "Quick Tidy-Up", description: "Organize one small area of your workspace." },
            { title: "Drink Water", description: "Hydrate yourself with a full glass of water." },
            { title: "Jot Down Goals", description: "Write down the top 3 things you want to accomplish." },
        ];
    }
}
