import { useState, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { apiCall, API_CONFIG } from "@/config/api";

interface TranslationCache {
  [messageId: string]: {
    [language: string]: string;
  };
}

export const useTranslation = (messages: Message[]) => {
  const [selectedLanguage, setSelectedLanguage] = useState("none");
  const [translatedMessages, setTranslatedMessages] = useState<{
    [key: string]: string;
  }>({});
  const translationCacheRef = useRef<TranslationCache>({});
  const pendingTranslationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const translateMessages = async () => {
      if (selectedLanguage === "none") {
        setTranslatedMessages({});
        return;
      }

      const newTranslations: { [key: string]: string } = {};
      const messagesToTranslate = messages.filter(
        (msg) =>
          !translationCacheRef.current[msg.id]?.[selectedLanguage] &&
          !pendingTranslationsRef.current.has(msg.id)
      );

      // Process messages in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < messagesToTranslate.length; i += batchSize) {
        const batch = messagesToTranslate.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (message) => {
            try {
              pendingTranslationsRef.current.add(message.id);

              // First detect the language
              const detectResponse = await apiCall(
                API_CONFIG.ENDPOINTS.TRANSLATE_DETECT,
                {
                  method: "POST",
                  body: JSON.stringify({ q: message.text }),
                }
              );

              if (!detectResponse.ok) {
                console.error(
                  "Language detection failed for message:",
                  message.id
                );
                return;
              }

              const detectData = await detectResponse.json();
              const detectedLang = detectData[0]?.language;

              // If detected language is the same as target language, cache and skip translation
              if (detectedLang === selectedLanguage) {
                translationCacheRef.current[message.id] = {
                  ...translationCacheRef.current[message.id],
                  [selectedLanguage]: message.text,
                };
                return;
              }

              // Translate the message
              const translateResponse = await apiCall(
                API_CONFIG.ENDPOINTS.TRANSLATE,
                {
                  method: "POST",
                  body: JSON.stringify({
                    q: message.text,
                    source: detectedLang,
                    target: selectedLanguage,
                  }),
                }
              );

              if (!translateResponse.ok) {
                console.error("Translation failed for message:", message.id);
                return;
              }

              const translateData = await translateResponse.json();
              if (
                translateData.translatedText &&
                translateData.translatedText !== message.text
              ) {
                // Cache the translation
                translationCacheRef.current[message.id] = {
                  ...translationCacheRef.current[message.id],
                  [selectedLanguage]: translateData.translatedText,
                };
                newTranslations[message.id] = translateData.translatedText;
              }
            } catch (error) {
              console.error(
                "Translation error for message:",
                message.id,
                error
              );
            } finally {
              pendingTranslationsRef.current.delete(message.id);
            }
          })
        );

        // Update translations state after each batch
        setTranslatedMessages((prev) => ({
          ...prev,
          ...newTranslations,
        }));
      }
    };

    translateMessages();
  }, [messages, selectedLanguage]);

  // When language changes, try to use cached translations first
  useEffect(() => {
    if (selectedLanguage === "none") {
      setTranslatedMessages({});
      return;
    }

    const cachedTranslations: { [key: string]: string } = {};
    messages.forEach((message) => {
      const cached =
        translationCacheRef.current[message.id]?.[selectedLanguage];
      if (cached) {
        cachedTranslations[message.id] = cached;
      }
    });

    setTranslatedMessages(cachedTranslations);
  }, [selectedLanguage, messages]);

  return {
    selectedLanguage,
    setSelectedLanguage,
    translatedMessages,
  };
};
