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
  const [userId, setUserId] = useState<string | null>(null);
  
  const addingRef = useRef<Set<string>>(new Set());
  const pendingKeys = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user and their preferred language from profile
  useEffect(() => {
    const loadUserLanguage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Load preferred language from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .single();
        
        if (profile?.preferred_language) {
          const lang = profile.preferred_language as Language;
          setLanguageState(lang);
          localStorage.setItem("language", lang);
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        }
      }
    };
    
    loadUserLanguage();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadUserLanguage();
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load translations from database with caching
  const loadTranslations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try to load from cache first
      const cacheKey = 'translations-cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Check if cache is still valid (24 hours)
          if (Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24) {
            setTranslations(parsed.data);
            setIsLoading(false);
            // Still fetch in background to update cache
            fetchTranslations();
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }
      
      // Fetch from database
      await fetchTranslations();
    } catch (error) {
      console.error("Error loading translations:", error);
      setIsLoading(false);
    }
    
    async function fetchTranslations() {
      try {
        // Fetch all translations in batches (Supabase has 1000 row limit)
        let allData: Array<{ english_key: string; arabic_value: string }> = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from("translations")
            .select("english_key, arabic_value")
            .order("english_key", { ascending: true })
            .range(from, from + batchSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }
        
        const translationsMap: Translations = {};
        allData.forEach((item) => {
          translationsMap[item.english_key] = item.arabic_value;
        });
        
        setTranslations(translationsMap);
        
        // Cache translations for 24 hours
        try {
          localStorage.setItem('translations-cache', JSON.stringify({
            data: translationsMap,
            timestamp: Date.now(),
          }));
        } catch (e) {
          // Ignore cache errors
        }
      } catch (error) {
        console.error("Error fetching translations:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Refresh translations (exposed to context)
  const refreshTranslations = useCallback(async () => {
    try {
      // Clear cache to force fresh fetch
      localStorage.removeItem('translations-cache');
      
      // Fetch all translations in batches (Supabase has 1000 row limit)
      let allData: Array<{ english_key: string; arabic_value: string }> = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("translations")
          .select("english_key, arabic_value")
          .order("english_key", { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (error) {
          console.error("Error refreshing translations:", error);
          return;
        }
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      const translationsMap: Translations = {};
      allData.forEach((item) => {
        translationsMap[item.english_key] = item.arabic_value;
      });
      
      setTranslations(translationsMap);
      
      // Update cache
      try {
        localStorage.setItem('translations-cache', JSON.stringify({
          data: translationsMap,
          timestamp: Date.now(),
        }));
      } catch (e) {
        // Ignore cache errors
      }
    } catch (error) {
      console.error("Error refreshing translations:", error);
    }
  }, []);

  // Initial load - only once on mount
  useEffect(() => {
    loadTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

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
      // First, check which keys already exist in the database
      const { data: existingTranslations, error: fetchError } = await supabase
        .from("translations")
        .select("english_key")
        .in("english_key", keysToInsert);

      if (fetchError) {
        console.error("Error fetching existing translations:", fetchError);
        return;
      }

      // Get all existing keys (regardless of translation status)
      // We don't want to overwrite any existing keys, even if they're not translated yet
      const existingKeys = new Set(
        (existingTranslations || []).map(t => t.english_key)
      );

      // Only insert keys that don't exist at all
      const keysToActuallyInsert = keysToInsert.filter(key => !existingKeys.has(key));

      if (keysToActuallyInsert.length === 0) {
        // All keys already exist, no need to reload
        return;
      }

      const records = keysToActuallyInsert.map(key => ({
        english_key: key,
        arabic_value: key, // Default to English until translated
        is_auto_detected: true,
        last_seen_at: new Date().toISOString()
      }));

      // Use insert to add new keys only (we already filtered out existing translated keys)
      // If there's a duplicate key error, we ignore it since it means the key already exists
      const { error } = await supabase
        .from("translations")
        .insert(records)
        .select();

      if (error) {
        // If error is due to duplicate key, it's okay - the key already exists
        // Only log other errors
        if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
          console.error("Error inserting translations:", error);
        }
      }
      
      // Update translations map directly without full reload to avoid loops
      // The new keys will be picked up on next page load or manual refresh
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

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("language", newLanguage);
    document.documentElement.dir = newLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLanguage;
    
    // Save to user profile if logged in
    if (userId) {
      try {
        await supabase
          .from("profiles")
          .update({ preferred_language: newLanguage })
          .eq("id", userId);
      } catch (error) {
        console.error("Failed to save language preference:", error);
      }
    }
  }, [userId]);

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
    
    // Check if translation exists and is actually translated (not just default English)
    const hasTranslation = currentTranslations[englishText] && 
                          currentTranslations[englishText].trim() && 
                          currentTranslations[englishText] !== englishText;
    
    // Only track as missing if it doesn't exist or is not translated
    // But skip tracking if we're in the translations management page to avoid loops
    if (!hasTranslation && !isLoading) {
      // Check if we're on translations page (avoid tracking there)
      const isTranslationsPage = window.location.pathname.includes('/dashboard/translations');
      if (!isTranslationsPage) {
        trackMissingTranslation(englishText);
      }
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
