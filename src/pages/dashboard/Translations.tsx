import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Save, Languages, Filter, CheckCircle2, AlertCircle, Trash2, Sparkles, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Translation = {
  id: string;
  english_key: string;
  arabic_value: string;
  is_auto_detected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type FilterType = "all" | "translated" | "untranslated";

const Translations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  // Store pending changes: { translationId: newArabicValue }
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({ english: "", arabic: "" });
  const queryClient = useQueryClient();
  const { t, refreshTranslations } = useLanguage();

  // Fetch translations from database (fetch all, not just 1000)
  const { data: translations = [], isLoading } = useQuery({
    queryKey: ["translations"],
    queryFn: async () => {
      let allTranslations: Translation[] = [];
      let from = 0;
      const batchSize = 1000; // Supabase default limit
      let hasMore = true;

      // Fetch all translations in batches
      while (hasMore) {
        const { data, error } = await supabase
          .from("translations")
          .select("*")
          .order("english_key", { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allTranslations = [...allTranslations, ...data];
          from += batchSize;
          hasMore = data.length === batchSize; // If we got less than batchSize, we're done
        } else {
          hasMore = false;
        }
      }
      
      return allTranslations;
    },
  });

  // Batch update translations mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; arabic_value: string }>) => {
      // Update all translations in parallel
      const updatePromises = updates.map(({ id, arabic_value }) =>
        supabase
        .from("translations")
        .update({ 
          arabic_value, 
          is_auto_detected: false,
          updated_at: new Date().toISOString() 
        })
          .eq("id", id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} translation(s)`);
      }
      
      // Return the updates for cache update
      return updates;
    },
    onSuccess: async (updates, variables) => {
      // First, update the query cache directly for immediate UI update
      queryClient.setQueryData(["translations"], (oldData: Translation[] | undefined) => {
        if (!oldData) return oldData;
        
        const updatedData = oldData.map(translation => {
          const update = updates.find(u => u.id === translation.id);
          if (update) {
            return {
              ...translation,
              arabic_value: update.arabic_value,
              is_auto_detected: false,
              updated_at: new Date().toISOString()
            };
          }
          return translation;
        });
        
        return updatedData;
      });
      
      // Invalidate and refetch translations query to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ["translations"] });
      await queryClient.refetchQueries({ queryKey: ["translations"] });
      
      // Wait for translations to refresh in context
      await refreshTranslations();
      
      const savedCount = variables.length;
      setPendingChanges({});
      toast.success(t("Successfully updated") + ` ${savedCount} ` + t("translation(s)"));
    },
    onError: (error) => {
      toast.error(t("Failed to update") + ": " + error.message);
    },
  });

  // Delete translation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      refreshTranslations();
      toast.success(t("Translation deleted successfully"));
    },
    onError: (error) => {
      toast.error(t("Failed to delete") + ": " + error.message);
    },
  });

  // Add new translation mutation - completely rebuilt logic
  const addTranslationMutation = useMutation({
    mutationFn: async (data: { english_key: string; arabic_value: string }) => {
      // Step 1: Normalize the English key (trim and normalize whitespace)
      const normalizedKey = data.english_key.trim().replace(/\s+/g, ' ');
      const normalizedArabic = data.arabic_value.trim();
      
      // Step 2: Validate inputs
      if (!normalizedKey) {
        throw new Error(t("English text is required"));
      }
      if (!normalizedArabic) {
        throw new Error(t("Arabic translation is required"));
      }

      // Step 3: Check if key already exists in database
      // First check in cache (faster) - exact match after normalization
      const existingInCache = translations.find(t => {
        const existingKey = t.english_key.trim().replace(/\s+/g, ' ');
        return existingKey === normalizedKey; // Exact match (case-sensitive after normalization)
      });

      if (existingInCache) {
        const conflictError: any = new Error(
          t("This English key already exists") + `: "${existingInCache.english_key}"`
        );
        conflictError.code = '23505';
        conflictError.existingKey = existingInCache.english_key;
        throw conflictError;
      }

      // Step 4: Double-check in database - use exact match (case-sensitive)
      const { data: existingTranslations, error: fetchError } = await supabase
        .from("translations")
        .select("english_key")
        .eq("english_key", normalizedKey); // Exact match, case-sensitive

      if (fetchError) {
        console.error("Error checking existing translations:", fetchError);
        throw new Error(t("Failed to check existing translations") + ": " + fetchError.message);
      }

      // Step 5: Check if key exists in database (exact match)
      if (existingTranslations && existingTranslations.length > 0) {
        const exactMatch = existingTranslations[0]; // Should be exact match
        
        if (exactMatch) {
          const conflictError: any = new Error(
            t("This English key already exists") + `: "${exactMatch.english_key}"`
          );
          conflictError.code = '23505';
          conflictError.existingKey = exactMatch.english_key;
          throw conflictError;
        }
      }

      // Step 6: Insert the new translation (key doesn't exist, safe to insert)
      const { data: result, error: insertError } = await supabase
        .from("translations")
        .insert({
          english_key: normalizedKey,
          arabic_value: normalizedArabic,
          is_auto_detected: false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        // Handle any unexpected errors during insert
        const errorCode = insertError.code?.toString() || '';
        const errorMessage = (insertError.message || '').toLowerCase();
        
        // If it's a duplicate error (shouldn't happen after our checks, but handle it anyway)
        if (errorCode === '23505' || 
            errorCode === 'PGRST116' || 
            errorMessage.includes('duplicate') || 
            errorMessage.includes('unique constraint') ||
            errorMessage.includes('unique') ||
            errorMessage.includes('already exists')) {
          const conflictError: any = new Error(t("This English key already exists"));
          conflictError.code = '23505';
          conflictError.existingKey = normalizedKey;
          throw conflictError;
        }
        
        // Other errors
        throw new Error(t("Failed to insert translation") + ": " + insertError.message);
      }

      return result;
    },
    onSuccess: async (newTranslationData) => {
      // Step 7: Update the query cache optimistically
      queryClient.setQueryData(["translations"], (oldData: Translation[] | undefined) => {
        if (!oldData) return [newTranslationData];
        
        // Add the new translation and sort by english_key
        const updated = [...oldData, newTranslationData].sort((a, b) => 
          a.english_key.localeCompare(b.english_key)
        );
        
        return updated;
      });

      // Step 8: Invalidate and refetch to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ["translations"] });
      
      // Step 9: Close dialog and reset form
      setIsAddDialogOpen(false);
      setNewTranslation({ english: "", arabic: "" });
      
      // Step 10: Show success message
      toast.success(t("Translation added successfully"));
    },
    onError: (error: any) => {
      // Handle errors with clear messages
      const errorCode = error.code?.toString() || '';
      const errorMessage = (error.message || '').toLowerCase();
      
      if (errorCode === '23505' || 
          errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate') || 
          errorMessage.includes('unique constraint') ||
          errorMessage.includes('unique')) {
        const existingKey = error.existingKey || newTranslation.english.trim();
        
        // Find the existing translation in cache
        const existingTranslation = translations.find(t => {
          const tKey = t.english_key.trim().replace(/\s+/g, ' ');
          return tKey === existingKey;
        });
        
        if (existingTranslation) {
          // Close the add dialog
          setIsAddDialogOpen(false);
          
          // Clear search and filter to show all translations
          setSearchTerm("");
          setFilter("all");
          
          // Wait for DOM to update, then scroll to the existing translation
          setTimeout(() => {
            const element = document.getElementById(`translation-${existingTranslation.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the row briefly
              element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
              setTimeout(() => {
                element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
              }, 2000);
            } else {
              // If element not found, search for it
              setSearchTerm(existingKey);
            }
          }, 300);
          
          toast.info(
            t("This English key already exists") + 
            `: "${existingKey}". ` + 
            t("Scrolled to existing translation. You can edit it directly.")
          );
        } else {
          // If not found in cache, refresh data and set search term
          setIsAddDialogOpen(false);
          
          // Refresh translations from database
          queryClient.invalidateQueries({ queryKey: ["translations"] });
          
          // Wait a bit for data to load, then search
          setTimeout(() => {
            setSearchTerm(existingKey);
            setFilter("all");
            
            // Try to find it again after refresh
            setTimeout(() => {
              const refreshedTranslations = queryClient.getQueryData<Translation[]>(["translations"]) || [];
              const found = refreshedTranslations.find(t => {
                const tKey = t.english_key.trim().replace(/\s+/g, ' ');
                return tKey === existingKey;
              });
              
              if (found) {
                const element = document.getElementById(`translation-${found.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
                  setTimeout(() => {
                    element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
                  }, 2000);
                }
              }
            }, 500);
          }, 100);
          
          toast.info(
            t("This English key already exists") + 
            `: "${existingKey}". ` + 
            t("Refreshing list and searching...")
          );
        }
      } else {
        const errorMsg = t("Failed to add translation") + ": " + (error.message || String(error));
        toast.error(errorMsg);
      }
    },
  });

  const handleAddTranslation = () => {
    // Validate inputs before mutation
    if (!newTranslation.english.trim()) {
      toast.error(t("English text is required"));
      return;
    }
    if (!newTranslation.arabic.trim()) {
      toast.error(t("Arabic translation is required"));
      return;
    }
    
    // Trigger the mutation
    addTranslationMutation.mutate({
      english_key: newTranslation.english.trim(),
      arabic_value: newTranslation.arabic.trim(),
    });
  };

  const isTranslated = (translation: Translation): boolean => {
    return !!(translation.arabic_value && 
              translation.arabic_value.trim() && 
              translation.arabic_value !== translation.english_key);
  };

  const filteredTranslations = useMemo(() => {
    let filtered = translations;
    
    if (filter === "translated") {
      filtered = filtered.filter(isTranslated);
    } else if (filter === "untranslated") {
      filtered = filtered.filter(t => !isTranslated(t));
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchNormalized = searchTerm.trim().replace(/\s+/g, ' ');
      filtered = filtered.filter((t) => {
        const englishKey = t.english_key.toLowerCase().trim();
        const englishKeyNormalized = t.english_key.trim().replace(/\s+/g, ' ');
        const arabicValue = t.arabic_value.toLowerCase().trim();
        
        return englishKey.includes(searchLower) ||
               englishKeyNormalized === searchNormalized ||
               arabicValue.includes(searchLower);
      });
    }
    
    return filtered;
  }, [translations, searchTerm, filter]);

  const stats = useMemo(() => {
    const translated = translations.filter(isTranslated).length;
    return { 
      total: translations.length, 
      translated, 
      untranslated: translations.length - translated
    };
  }, [translations]);

  // Handle change in translation value
  const handleTranslationChange = (id: string, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Get current value for a translation (pending change or original)
  const getTranslationValue = (translation: Translation): string => {
    return pendingChanges[translation.id] !== undefined 
      ? pendingChanges[translation.id] 
      : translation.arabic_value;
  };

  // Check if translation has pending changes
  const hasPendingChanges = (translation: Translation): boolean => {
    if (pendingChanges[translation.id] === undefined) return false;
    return pendingChanges[translation.id] !== translation.arabic_value;
  };

  // Save all pending changes
  const handleSaveAll = async () => {
    const changesToSave = Object.entries(pendingChanges)
      .filter(([id, value]) => {
        const translation = translations.find(t => t.id === id);
        return translation && value.trim() && value !== translation.arabic_value;
      })
      .map(([id, arabic_value]) => ({ id, arabic_value }));

    if (changesToSave.length === 0) {
      toast.info(t("No changes to save"));
      return;
    }

    await batchUpdateMutation.mutateAsync(changesToSave);
  };

  // Cancel all pending changes
  const handleCancelAll = () => {
    setPendingChanges({});
    toast.info(t("All changes cancelled"));
  };

  // Check if there are any pending changes
  const hasAnyPendingChanges = Object.keys(pendingChanges).some(id => {
    const translation = translations.find(t => t.id === id);
    return translation && pendingChanges[id] !== translation.arabic_value;
  });

  const handleDelete = async (id: string) => {
    if (confirm(t("Are you sure you want to delete this translation?"))) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Auto-translate function using MyMemory Translation API (free, no API key needed)
  const translateText = async (text: string, retries = 3): Promise<string> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // MyMemory Translation API - free, no API key required
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`,
          { 
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translated = data.responseData.translatedText.trim();
          // If translation is same as original, it might be an error
          if (translated && translated !== text) {
            return translated;
          } else {
            throw new Error("Translation returned same text");
          }
        } else {
          throw new Error(`API Error: ${data.responseStatus || 'Unknown'}`);
        }
      } catch (error: any) {
        console.error(`Translation attempt ${attempt + 1} failed for "${text}":`, error);
        
        if (attempt === retries - 1) {
          // Last attempt failed, throw error
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    
    throw new Error("All translation attempts failed");
  };

  // Translate all untranslated items (only those visible in current filter)
  const handleTranslateAll = async () => {
    // Get untranslated items from the CURRENT filtered view (what user sees)
    const untranslatedItems = filteredTranslations.filter(t => !isTranslated(t));
    
    if (untranslatedItems.length === 0) {
      toast.info(t("No untranslated items to translate"));
      return;
    }

    // Confirm with user
    if (!confirm(t("Are you sure you want to translate") + ` ${untranslatedItems.length} ` + t("item(s)?"))) {
      return;
    }

    setIsTranslating(true);
    setTranslationProgress({ current: 0, total: untranslatedItems.length });
    const translationsMap: Record<string, string> = {};
    let successCount = 0;
    let errorCount = 0;

    try {
      // Translate items one by one (with delay to avoid rate limiting)
      for (let i = 0; i < untranslatedItems.length; i++) {
        const item = untranslatedItems[i];
        setTranslationProgress({ current: i + 1, total: untranslatedItems.length });
        
        try {
          const translatedText = await translateText(item.english_key);
          translationsMap[item.id] = translatedText;
          successCount++;
          
          // Update pending changes immediately so user can see progress
          setPendingChanges(prev => ({
            ...prev,
            [item.id]: translatedText
          }));
          
          // Small delay to avoid rate limiting (200ms between requests)
          if (i < untranslatedItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error: any) {
          console.error(`Failed to translate "${item.english_key}":`, error);
          errorCount++;
          // Continue with next item even if this one failed
        }
      }

      if (successCount > 0) {
        toast.success(t("Translated") + ` ${successCount} ` + t("item(s) successfully. Click \"Save All\" to save changes."));
      }
      
      if (errorCount > 0) {
        toast.warning(t("Failed to translate") + ` ${errorCount} ` + t("item(s). Please try again or translate manually."));
      }
      
      if (successCount === 0 && errorCount > 0) {
        toast.error(t("Translation failed. Please check your internet connection and try again."));
      }
    } catch (error: any) {
      console.error("Translation process error:", error);
      toast.error(t("An error occurred during translation: ") + error.message);
    } finally {
      setIsTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Languages className="h-8 w-8" />
            {t("Translations Management")}
          </h1>
          <p className="text-muted-foreground">
            {t("All website text is automatically tracked. Translate any text from English to Arabic.")}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("Add Translation")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Keys")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Translated")}</p>
                <p className="text-2xl font-bold text-green-600">{stats.translated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Untranslated")}</p>
                <p className="text-2xl font-bold text-orange-600">{stats.untranslated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("Translations")}</CardTitle>
              <CardDescription>{t("Search and edit all translations")}</CardDescription>
            </div>
            {hasAnyPendingChanges && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAll}
                  disabled={batchUpdateMutation.isPending}
                >
                  {t("Cancel All")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={batchUpdateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {batchUpdateMutation.isPending ? t("Saving...") : `${t("Save All")} (${Object.keys(pendingChanges).filter(id => {
                    const translation = translations.find(t => t.id === id);
                    return translation && pendingChanges[id] !== translation.arabic_value;
                  }).length})`}
                </Button>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("Search by English text or Arabic translation...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                <Filter className="mr-2 h-4 w-4" />
                {t("All")} ({stats.total})
              </Button>
              <Button
                variant={filter === "translated" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("translated")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("Translated")} ({stats.translated})
              </Button>
              <Button
                variant={filter === "untranslated" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("untranslated")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                {t("Untranslated")} ({stats.untranslated})
              </Button>
              {filter === "untranslated" && filteredTranslations.filter(t => !isTranslated(t)).length > 0 && (
              <Button
                  variant="default"
                size="sm"
                  onClick={handleTranslateAll}
                  disabled={isTranslating}
                  className="ml-auto"
              >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isTranslating 
                    ? `${t("Translating...")} (${translationProgress.current}/${translationProgress.total})`
                    : `${t("Translate All")} (${filteredTranslations.filter(t => !isTranslated(t)).length})`
                  }
              </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-24 ml-auto" />
                  </div>
                ))}
              </div>
            ) : filteredTranslations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("No translations found matching your search")}
              </p>
            ) : (
              filteredTranslations.map((translation) => (
                <Card key={translation.id} id={`translation-${translation.id}`} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-sm font-semibold">{t("English")}</Label>
                            {translation.is_auto_detected && (
                              <Badge variant="secondary" className="text-xs">
                                {t("Auto-detected")}
                              </Badge>
                            )}
                            {!isTranslated(translation) && (
                              <Badge variant="destructive" className="text-xs">
                                {t("Not translated")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{translation.english_key}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-semibold">{t("Arabic")}</Label>
                            <Textarea
                            value={getTranslationValue(translation)}
                            onChange={(e) => handleTranslationChange(translation.id, e.target.value)}
                              dir="rtl"
                              className="mt-1"
                              rows={3}
                            placeholder={t("Enter Arabic translation...")}
                            />
                          {hasPendingChanges(translation) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              * {t("Modified")}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(translation.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Translation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("Add New Translation")}</DialogTitle>
            <DialogDescription>
              {t("Add a new translation pair. The English key must be unique.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="english-key">{t("English Text")} *</Label>
              <Input
                id="english-key"
                placeholder={t("Enter English text...")}
                value={newTranslation.english}
                onChange={(e) => setNewTranslation({ ...newTranslation, english: e.target.value })}
                disabled={addTranslationMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arabic-value">{t("Arabic Translation")} *</Label>
              <Textarea
                id="arabic-value"
                placeholder={t("Enter Arabic translation...")}
                value={newTranslation.arabic}
                onChange={(e) => setNewTranslation({ ...newTranslation, arabic: e.target.value })}
                dir="rtl"
                rows={4}
                disabled={addTranslationMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewTranslation({ english: "", arabic: "" });
              }}
              disabled={addTranslationMutation.isPending}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddTranslation();
              }}
              disabled={addTranslationMutation.isPending || !newTranslation.english.trim() || !newTranslation.arabic.trim()}
            >
              {addTranslationMutation.isPending ? t("Adding...") : t("Add Translation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Translations;
