import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (englishText: string) => string;
  isRTL: boolean;
  refreshTranslations: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations structure: { "English Text": "Arabic Translation" }
type Translations = Record<string, string>;

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "ar" || saved === "en" ? saved : "en") as Language;
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const addingRef = useRef<Set<string>>(new Set());
  const pendingKeys = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load translations from database
  const loadTranslations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("translations")
        .select("english_key, arabic_value");
      
      if (error) throw error;
      
      const translationsMap: Translations = {};
      data?.forEach((item) => {
        translationsMap[item.english_key] = item.arabic_value;
      });
      
      setTranslations(translationsMap);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading translations:", error);
      setIsLoading(false);
    }
  }, []);

  // Refresh translations (exposed to context)
  const refreshTranslations = useCallback(async () => {
    await loadTranslations();
  }, [loadTranslations]);

  // Initial load
  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Batch insert missing keys to database
  const batchInsertMissingKeys = useCallback(async () => {
    if (pendingKeys.current.size === 0) return;

    const keysToInsert = Array.from(pendingKeys.current);
    pendingKeys.current.clear();

    try {
      const records = keysToInsert.map(key => ({
        english_key: key,
        arabic_value: key, // Default to English until translated
        is_auto_detected: true,
        last_seen_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from("translations")
        .upsert(records, { 
          onConflict: "english_key",
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error("Error inserting translations:", error);
      } else {
        // Reload translations after batch insert
        await loadTranslations();
      }
    } catch (error) {
      console.error("Error batch inserting translations:", error);
    }
  }, [loadTranslations]);

  // Function to track missing translation
  const trackMissingTranslation = useCallback((englishText: string) => {
    if (addingRef.current.has(englishText) || pendingKeys.current.has(englishText)) {
      return;
    }

    addingRef.current.add(englishText);
    pendingKeys.current.add(englishText);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout to batch insert after 2 seconds
    batchTimeoutRef.current = setTimeout(() => {
      batchInsertMissingKeys();
      addingRef.current.clear();
    }, 2000);
  }, [batchInsertMissingKeys]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const translationsRef = useRef(translations);
  useEffect(() => {
    translationsRef.current = translations;
  }, [translations]);

  const t = useCallback((englishText: string): string => {
    if (!englishText || !englishText.trim()) {
      return englishText;
    }

    const currentTranslations = translationsRef.current;
    
    // Track if key doesn't exist
    if (!currentTranslations[englishText] && !isLoading) {
      trackMissingTranslation(englishText);
    }
    
    // If English, return as-is
    if (language === "en") {
      return englishText;
    }

    // If Arabic, return translation or English text as fallback
    const arabicTranslation = currentTranslations[englishText];
    return arabicTranslation && arabicTranslation.trim() && arabicTranslation !== englishText
      ? arabicTranslation
      : englishText;
  }, [language, isLoading, trackMissingTranslation]);

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, refreshTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
