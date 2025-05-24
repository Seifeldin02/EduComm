import { useState, useEffect } from "react";
import { Message } from "@/types/chat";
import { detectLanguage, translateText } from "@/utils/translation";

export const useTranslation = (messages: Message[]) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("none");
  const [translatedMessages, setTranslatedMessages] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (selectedLanguage === "none") {
      setTranslatedMessages({});
      return;
    }

    const translateMessages = async () => {
      const newTranslations: { [key: string]: string } = {};

      for (const msg of messages) {
        try {
          const sourceLang = await detectLanguage(msg.text);
          if (sourceLang !== selectedLanguage) {
            const translatedText = await translateText(
              msg.text,
              sourceLang,
              selectedLanguage
            );
            if (translatedText !== msg.text) {
              newTranslations[msg.id] = translatedText;
            }
          }
        } catch (error) {
          console.error("Translation error for message:", msg.id, error);
        }
      }

      setTranslatedMessages(newTranslations);
    };

    translateMessages();
  }, [messages, selectedLanguage]);

  return {
    selectedLanguage,
    setSelectedLanguage,
    translatedMessages,
  };
}; 