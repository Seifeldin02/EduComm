import { TranslationLanguage } from "@/types/chat";
import { API_CONFIG } from "@/config/api";
export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: "none", name: "No Translation" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ms", name: "Malay" },
  { code: "ar", name: "Arabic" },
];

export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/translate/detect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: text }),
      }
    );

    if (!response.ok) {
      throw new Error(`Language detection failed: ${await response.text()}`);
    }

    const data = await response.json();
    return data[0].language;
  } catch (error) {
    console.error("Error detecting language:", error);
    return "en"; // Default to English if detection fails
  }
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/translate/translate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed: ${await response.text()}`);
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Error translating text:", error);
    return text; // Return original text if translation fails
  }
};
