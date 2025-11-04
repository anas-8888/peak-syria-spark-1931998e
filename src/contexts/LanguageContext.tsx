import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
import translationsData from "../translations.json";

export type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (englishText: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations structure: { "English Text": "Arabic Translation" }
type Translations = Record<string, string>;

// Initialize translations
const initialTranslations = translationsData as Translations;

// Load custom translations from localStorage if they exist
const loadCustomTranslations = (): Translations => {
  try {
    const saved = localStorage.getItem("customTranslations");
    if (saved) {
      const custom = JSON.parse(saved);
      // Merge with initial translations (custom takes precedence)
      return { ...initialTranslations, ...custom };
    }
  } catch (e) {
    // Ignore errors
  }
  return initialTranslations;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to English
    const saved = localStorage.getItem("language");
    return (saved === "ar" || saved === "en" ? saved : "en") as Language;
  });

  const [translations, setTranslations] = useState<Translations>(() => {
    return loadCustomTranslations();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    // Update document direction
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  // Use ref to track if we're currently adding translations to prevent infinite loops
  const addingRef = useRef<Set<string>>(new Set());

  // Function to add missing translation automatically
  const addMissingTranslation = useCallback((englishText: string) => {
    // Prevent adding the same key multiple times
    if (addingRef.current.has(englishText)) {
      return;
    }

    // Skip if already exists in initial translations
    if (initialTranslations[englishText] !== undefined) {
      return;
    }

    addingRef.current.add(englishText);

    // Add with English text as default value (key = value = English text)
    // Admin will replace it with Arabic translation later
    setTranslations((prev) => {
      // Check again in the callback to prevent race conditions
      if (prev[englishText]) {
        return prev;
      }

      // Set value = key (English text) as default
      const updated = { ...prev, [englishText]: englishText };
      
      // Save to localStorage
      try {
        let customTranslations: Translations = {};
        const existing = localStorage.getItem("customTranslations");
        if (existing) {
          customTranslations = JSON.parse(existing);
        }
        customTranslations[englishText] = englishText;
        localStorage.setItem("customTranslations", JSON.stringify(customTranslations));
      } catch (e) {
        console.error("Error saving translation:", e);
      }

      try {
        const missingKeys = JSON.parse(localStorage.getItem("missingTranslationKeys") || "[]");
        if (!missingKeys.includes(englishText)) {
          missingKeys.push(englishText);
          localStorage.setItem("missingTranslationKeys", JSON.stringify(missingKeys));
        }
      } catch (e) {
        console.error("Error tracking missing key:", e);
      }

      setTimeout(() => {
        addingRef.current.delete(englishText);
      }, 100);

      return updated;
    });
  }, []); // No dependencies - use callback form of setTranslations

  // Use ref to track current translations to avoid dependency issues
  const translationsRef = useRef(translations);
  useEffect(() => {
    translationsRef.current = translations;
  }, [translations]);

  const t = useCallback((englishText: string): string => {
    // Skip empty or whitespace-only strings
    if (!englishText || !englishText.trim()) {
      return englishText;
    }

    const currentTranslations = translationsRef.current;
    
    // Always track missing keys (both in English and Arabic mode)
    // Check if key exists in initial translations or custom translations
    const existsInInitial = initialTranslations[englishText] !== undefined;
    const existsInCustom = currentTranslations[englishText] !== undefined;
    
    // If key doesn't exist anywhere, add it
    if (!existsInInitial && !existsInCustom && !addingRef.current.has(englishText)) {
      // Use setTimeout to avoid blocking the render
      setTimeout(() => {
        addMissingTranslation(englishText);
      }, 0);
    }
    
    // If English, return as-is
    if (language === "en") {
      return englishText;
    }

    // If Arabic, return translation or English text if no translation exists
    const arabicTranslation = currentTranslations[englishText];
    
    // If translation exists and is not empty, return it
    if (arabicTranslation && arabicTranslation.trim()) {
      return arabicTranslation;
    }

    // Return English text as fallback
    return englishText;
  }, [language, addMissingTranslation]);

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
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
