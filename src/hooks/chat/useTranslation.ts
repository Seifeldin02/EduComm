import { useState, useEffect } from "react";
import { Message } from "@/types/chat";

export const useTranslation = (messages: Message[]) => {
  const [selectedLanguage, setSelectedLanguage] = useState("none");
  const [translatedMessages, setTranslatedMessages] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const translateMessages = async () => {
      if (selectedLanguage === "none") {
        setTranslatedMessages({});
        return;
      }

      const newTranslations: { [key: string]: string } = {};

      for (const message of messages) {
        try {
          // First detect the language
          const detectResponse = await fetch("http://localhost:3000/api/translate/detect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: message.text }),
          });

          if (!detectResponse.ok) {
            console.error("Language detection failed for message:", message.id);
            continue;
          }

          const detectData = await detectResponse.json();
          const detectedLang = detectData[0]?.language;

          // If detected language is the same as target language, skip translation
          if (detectedLang === selectedLanguage) {
            continue;
          }

          // Translate the message
          const translateResponse = await fetch("http://localhost:3000/api/translate/translate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              q: message.text,
              source: detectedLang,
              target: selectedLanguage,
            }),
          });

          if (!translateResponse.ok) {
            console.error("Translation failed for message:", message.id);
            continue;
          }

          const translateData = await translateResponse.json();
          if (translateData.translatedText && translateData.translatedText !== message.text) {
            newTranslations[message.id] = translateData.translatedText;
          }
        } catch (error) {
          console.error("Translation error for message:", message.id, error);
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