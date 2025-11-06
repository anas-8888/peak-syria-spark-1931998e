import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Save, Plus, Languages, Filter, CheckCircle2, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Translation = {
  id: string;
  english_key: string;
  arabic_value: string;
  is_auto_detected: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type FilterType = "all" | "translated" | "untranslated" | "auto_detected";

const Translations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newEnglish, setNewEnglish] = useState("");
  const [newArabic, setNewArabic] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingValue, setEditingValue] = useState<string>("");
  const queryClient = useQueryClient();
  const { refreshTranslations } = useLanguage();

  // Fetch translations from database
  const { data: translations = [], isLoading } = useQuery({
    queryKey: ["translations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .order("english_key", { ascending: true });
      
      if (error) throw error;
      return data as Translation[];
    },
  });

  // Update translation mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, arabic_value }: { id: string; arabic_value: string }) => {
      const { error } = await supabase
        .from("translations")
        .update({ 
          arabic_value, 
          is_auto_detected: false,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      refreshTranslations();
      toast.success("Translation updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  // Add translation mutation
  const addMutation = useMutation({
    mutationFn: async ({ english_key, arabic_value }: { english_key: string; arabic_value: string }) => {
      const { error } = await supabase
        .from("translations")
        .insert({ english_key, arabic_value, is_auto_detected: false });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      refreshTranslations();
      setNewEnglish("");
      setNewArabic("");
      toast.success("Translation added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add: ${error.message}`);
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
      toast.success("Translation deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

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
    } else if (filter === "auto_detected") {
      filtered = filtered.filter(t => t.is_auto_detected);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((t) =>
        t.english_key.toLowerCase().includes(searchLower) ||
        t.arabic_value.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [translations, searchTerm, filter]);

  const stats = useMemo(() => {
    const translated = translations.filter(isTranslated).length;
    const autoDetected = translations.filter(t => t.is_auto_detected).length;
    return { 
      total: translations.length, 
      translated, 
      untranslated: translations.length - translated,
      autoDetected 
    };
  }, [translations]);

  const handleStartEdit = (translation: Translation) => {
    setEditingKey(translation.id);
    setEditingValue(translation.arabic_value || "");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingValue.trim()) {
      toast.error("Translation cannot be empty");
      return;
    }
    await updateMutation.mutateAsync({ id, arabic_value: editingValue });
    setEditingKey(null);
    setEditingValue("");
  };

  const handleAddNewTranslation = async () => {
    if (!newEnglish.trim()) {
      toast.error("English text is required");
      return;
    }

    const exists = translations.find(t => t.english_key === newEnglish.trim());
    if (exists) {
      toast.error("This English text already exists");
      return;
    }

    await addMutation.mutateAsync({
      english_key: newEnglish.trim(),
      arabic_value: newArabic.trim() || newEnglish.trim(),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this translation?")) {
      await deleteMutation.mutateAsync(id);
    }
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
          All website text is automatically tracked. Translate any text from English to Arabic.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Detected</p>
                <p className="text-2xl font-bold text-blue-600">{stats.autoDetected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Translation</CardTitle>
          <CardDescription>Manually add a new translation key</CardDescription>
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
          <Button 
            onClick={handleAddNewTranslation} 
            className="w-full md:w-auto"
            disabled={addMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {addMutation.isPending ? "Adding..." : "Add Translation"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
          <CardDescription>Search and edit all translations</CardDescription>
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
              <Button
                variant={filter === "auto_detected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("auto_detected")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Auto-Detected ({stats.autoDetected})
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading translations...</p>
            ) : filteredTranslations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No translations found matching your search
              </p>
            ) : (
              filteredTranslations.map((translation) => (
                <Card key={translation.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-sm font-semibold">English</Label>
                            {translation.is_auto_detected && (
                              <Badge variant="secondary" className="text-xs">
                                Auto-detected
                              </Badge>
                            )}
                            {!isTranslated(translation) && (
                              <Badge variant="destructive" className="text-xs">
                                Not translated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{translation.english_key}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-semibold">Arabic</Label>
                          {editingKey === translation.id ? (
                            <Textarea
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              dir="rtl"
                              className="mt-1"
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm mt-1" dir="rtl">
                              {translation.arabic_value}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {editingKey === translation.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(translation.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingKey(null);
                                setEditingValue("");
                              }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(translation)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(translation.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Translations;
