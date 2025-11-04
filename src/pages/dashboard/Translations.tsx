import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Save, Plus, Languages, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import translationsData from "../../translations.json";

// Translations structure: { "English Text": "Arabic Translation" }
type Translations = Record<string, string>;

type FilterType = "all" | "translated" | "untranslated";

const Translations = () => {
  const [translations, setTranslations] = useState<Translations>(translationsData as Translations);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newEnglish, setNewEnglish] = useState("");
  const [newArabic, setNewArabic] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingValue, setEditingValue] = useState<string>("");

  // Helper function to load all translations
  const loadAllTranslations = useCallback((): Translations => {
    const jsonTranslations = translationsData as Translations;
    let custom: Translations = {};
    
    try {
      const saved = localStorage.getItem("customTranslations");
      if (saved) {
        custom = JSON.parse(saved);
      }
      
      const missingKeysStr = localStorage.getItem("missingTranslationKeys");
      if (missingKeysStr) {
        const missingKeys = JSON.parse(missingKeysStr);
        if (Array.isArray(missingKeys)) {
          missingKeys.forEach((key: string) => {
            if (typeof key === 'string' && key.trim() && !custom[key] && !jsonTranslations[key]) {
              custom[key] = key;
            }
          });
        }
      }
    } catch (e) {
      console.error("Error loading translations:", e);
    }
    
    return { ...jsonTranslations, ...custom };
  }, []);

  // Load translations from JSON file and localStorage
  useEffect(() => {
    setTranslations(loadAllTranslations());
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "customTranslations" || e.key === "missingTranslationKeys") {
        setTranslations(loadAllTranslations());
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadAllTranslations]);

  // Helper function to save translations to localStorage
  const saveToLocalStorage = useCallback((updates: Translations) => {
    try {
      const existing = localStorage.getItem("customTranslations");
      const custom = existing ? JSON.parse(existing) : {};
      Object.assign(custom, updates);
      localStorage.setItem("customTranslations", JSON.stringify(custom));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      throw e;
    }
  }, []);


  const isTranslated = (englishText: string): boolean => {
    const arabicTranslation = translations[englishText];
    return !!(arabicTranslation && 
              typeof arabicTranslation === 'string' && 
              arabicTranslation.trim() && 
              arabicTranslation !== englishText);
  };

  const isValidKey = (key: string): boolean => {
    return key && key.trim() && key !== "en" && key !== "ar" && !key.includes(".");
  };

  const filteredKeys = useMemo(() => {
    let keys = Object.keys(translations).filter(isValidKey);
    
    if (filter === "translated") {
      keys = keys.filter(isTranslated);
    } else if (filter === "untranslated") {
      keys = keys.filter(key => !isTranslated(key));
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      keys = keys.filter((key) =>
        key.toLowerCase().includes(searchLower) ||
        (typeof translations[key] === 'string' && translations[key].toLowerCase().includes(searchLower))
      );
    }
    
    return keys.sort((a, b) => a.localeCompare(b));
  }, [translations, searchTerm, filter]);

  const stats = useMemo(() => {
    const allKeys = Object.keys(translations).filter(isValidKey);
    const translated = allKeys.filter(isTranslated).length;
    return { total: allKeys.length, translated, untranslated: allKeys.length - translated };
  }, [translations]);

  const handleStartEdit = (englishText: string) => {
    setEditingKey(englishText);
    setEditingValue(translations[englishText] || "");
  };

  const handleSaveEdit = async (englishText: string) => {
    if (!editingValue.trim()) {
      toast.error("Translation cannot be empty");
      return;
    }

    try {
      // Update state
      setTranslations(prev => ({ ...prev, [englishText]: editingValue }));
      
      // Save to localStorage (always works)
      saveToLocalStorage({ [englishText]: editingValue });
      
      // Wait a bit to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to save to Supabase Storage (optional)
      try {
        await saveTranslationsToStorage();
        toast.success("✅ Translation saved and uploaded to Supabase Storage!");
      } catch (storageError: any) {
        // If storage fails, still show success for localStorage save
        console.warn("⚠️ Failed to upload to Supabase Storage, but saved to localStorage:", storageError);
        toast.warning(
          `Translation saved to localStorage, but failed to upload to Supabase Storage. Error: ${storageError.message || "Unknown error"}. Check console for details.`,
          { duration: 6000 }
        );
      }
      
      setEditingKey(null);
      setEditingValue("");
    } catch (error: any) {
      console.error("❌ Error saving translation:", error);
      toast.error(`Failed to save translation: ${error.message || "Unknown error"}`);
    }
  };

  const saveTranslationsToStorage = useCallback(async () => {
    try {
      // Reload translations to get latest from localStorage
      const allTranslations = loadAllTranslations();
      
      const cleanedTranslations: Translations = {};
      Object.keys(allTranslations).forEach(key => {
        if (isValidKey(key)) {
          cleanedTranslations[key] = allTranslations[key];
        }
      });
      
      const sortedKeys = Object.keys(cleanedTranslations).sort();
      const sortedTranslations: Translations = {};
      sortedKeys.forEach(key => {
        sortedTranslations[key] = cleanedTranslations[key];
      });
      
      const jsonString = JSON.stringify(sortedTranslations, null, 2);
      
      console.log("📤 Uploading translations to Supabase Storage...", {
        totalKeys: Object.keys(sortedTranslations).length,
        sampleKeys: Object.keys(sortedTranslations).slice(0, 5)
      });
      
      const fileBlob = new Blob([jsonString], { type: "application/json" });
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload("translations.json", fileBlob, {
          upsert: true,
          contentType: "application/json",
          cacheControl: "3600",
        });
      
      if (error) {
        console.error("❌ Supabase Storage error:", error);
        // Check if it's a permission error
        if (error.message?.includes("permission") || error.message?.includes("policy")) {
          throw new Error("Permission denied. Please check Supabase Storage policies for 'product-images' bucket.");
        }
        throw error;
      }
      
      console.log("✅ Successfully saved translations to Supabase Storage!", {
        path: data?.path,
        id: data?.id,
        fileSize: fileBlob.size,
        keysCount: Object.keys(sortedTranslations).length
      });
    } catch (e: any) {
      console.error("❌ Error saving translations to storage:", e);
      // Re-throw to handle in calling function
      throw e;
    }
  }, [loadAllTranslations]);

  const handleAddNewTranslation = async () => {
    if (!newEnglish.trim()) {
      toast.error("English text is required");
      return;
    }

    // Check if key already exists in current translations or initial translations
    const allTranslations = loadAllTranslations();
    if (allTranslations[newEnglish.trim()] !== undefined) {
      toast.error("This English text already exists");
      return;
    }

    try {
      const englishKey = newEnglish.trim();
      const defaultValue = newArabic.trim() || englishKey;
      
      // Save to localStorage first
      saveToLocalStorage({ [englishKey]: defaultValue });
      
      // Wait a bit to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Reload translations from localStorage to update state
      const updatedTranslations = loadAllTranslations();
      setTranslations(updatedTranslations);
      
      // Clear input fields
      setNewEnglish("");
      setNewArabic("");
      
      // Try to save to Supabase Storage (optional)
      try {
        await saveTranslationsToStorage();
        toast.success("✅ Translation added successfully and uploaded to Supabase Storage!");
      } catch (storageError: any) {
        // If storage fails, still show success for localStorage save
        console.warn("⚠️ Failed to upload to Supabase Storage, but saved to localStorage:", storageError);
        toast.success(
          `✅ Translation added successfully! (Saved to localStorage, but failed to upload to Supabase Storage. Error: ${storageError.message || "Unknown error"})`,
          { duration: 6000 }
        );
      }
    } catch (error: any) {
      console.error("❌ Error adding translation:", error);
      toast.error(`Failed to add translation: ${error.message || "Unknown error"}`);
    }
  };

  const handleDownloadJSON = async () => {
    const allTranslations = loadAllTranslations();
    
    const cleanedTranslations: Translations = {};
    Object.keys(allTranslations).forEach(key => {
      if (isValidKey(key)) {
        cleanedTranslations[key] = allTranslations[key];
      }
    });
    
    const sortedKeys = Object.keys(cleanedTranslations).sort();
    const sortedTranslations: Translations = {};
    sortedKeys.forEach(key => {
      sortedTranslations[key] = cleanedTranslations[key];
    });
    
    const dataStr = JSON.stringify(sortedTranslations, null, 2);
    
    try {
      await navigator.clipboard.writeText(dataStr);
    } catch (e) {
      console.warn("Could not copy to clipboard:", e);
    }
    
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "translations.json";
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(
      <div className="space-y-2">
        <p className="font-semibold">✅ JSON file downloaded and copied to clipboard!</p>
        <p className="text-sm">📋 Steps to update src/translations.json:</p>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Open src/translations.json in your editor</li>
          <li>Paste the clipboard content (Ctrl+V) or use the downloaded file</li>
          <li>Save the file</li>
        </ol>
      </div>,
      { duration: 8000 }
    );
  };


  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Languages className="h-8 w-8" />
          Translations Management
        </h1>
        <p className="text-muted-foreground">
          Manage all website translations. English text is the key, Arabic text is the translation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Keys</p>
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
                <p className="text-sm text-muted-foreground">Translated</p>
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
                <p className="text-sm text-muted-foreground">Untranslated</p>
                <p className="text-2xl font-bold text-orange-600">{stats.untranslated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Download the latest translations file to update src/translations.json
                </CardDescription>
              </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleDownloadJSON} variant="default" className="bg-primary">
            <Save className="mr-2 h-4 w-4" />
            Download & Update JSON File
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Translation</CardTitle>
          <CardDescription>Add English text and its Arabic translation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-english">English Text (Key)</Label>
              <Input
                id="new-english"
                placeholder="e.g., Featured Collection"
                value={newEnglish}
                onChange={(e) => setNewEnglish(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-arabic">Arabic Translation (Value)</Label>
              <Input
                id="new-arabic"
                placeholder="e.g., المجموعة المميزة"
                value={newArabic}
                onChange={(e) => setNewArabic(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
          <Button onClick={handleAddNewTranslation} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Translation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
          <CardDescription>Find and edit existing translations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by English text or Arabic translation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                <Filter className="mr-2 h-4 w-4" />
                All ({stats.total})
              </Button>
              <Button
                variant={filter === "translated" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("translated")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Translated ({stats.translated})
              </Button>
              <Button
                variant={filter === "untranslated" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("untranslated")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Untranslated ({stats.untranslated})
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredKeys.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No translations found matching your search and filter.
              </p>
            ) : (
              filteredKeys.map((englishText) => {
                const isComplete = isTranslated(englishText);
                return (
                  <Card key={englishText} className={`border ${!isComplete ? "border-orange-200 bg-orange-50/50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <Label className="text-sm font-semibold text-muted-foreground">English (Key)</Label>
                            <p className="text-sm font-medium mt-1">{englishText}</p>
                          </div>
                          {isComplete ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Translated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Missing
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (editingKey === englishText) {
                              setEditingKey(null);
                              setEditingValue("");
                            } else {
                              handleStartEdit(englishText);
                            }
                          }}
                        >
                          {editingKey === englishText ? "Cancel" : "Edit"}
                        </Button>
                      </div>

                      {editingKey === englishText ? (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`ar-${englishText}`}>Arabic Translation (Value)</Label>
                            <Textarea
                              id={`ar-${englishText}`}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="mt-1"
                              dir="rtl"
                              placeholder="Enter Arabic translation..."
                            />
                          </div>
                          <Button onClick={() => handleSaveEdit(englishText)} size="sm">
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs text-muted-foreground">Arabic Translation</Label>
                          <p className="mt-1" dir="rtl">
                            {(() => {
                              const value = translations[englishText];
                              if (typeof value === 'string' && value.trim()) {
                                // If value equals key, it means it's using default English text (not translated yet)
                                if (value === englishText) {
                                  return <span className="text-muted-foreground italic">(Default: English text - needs Arabic translation)</span>;
                                }
                                return value;
                              }
                              return <span className="text-muted-foreground italic">(empty - needs translation)</span>;
                            })()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Translations;
