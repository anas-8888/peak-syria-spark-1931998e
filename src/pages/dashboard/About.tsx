import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const iconOptions = ["Shield", "Award", "Users", "TrendingUp"];

const AboutManagement = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [missionTitle, setMissionTitle] = useState("");
  const [missionContent, setMissionContent] = useState("");
  const [values, setValues] = useState<Array<{ icon: string; title: string; description: string }>>([]);
  const [aboutId, setAboutId] = useState<string | null>(null);

  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["about-us-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_us")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (aboutData) {
      setAboutId(aboutData.id);
      setHeroTitle(aboutData.hero_title || "");
      setHeroSubtitle(aboutData.hero_subtitle || "");
      setStoryTitle(aboutData.story_title || "");
      setStoryContent(aboutData.story_content || "");
      setMissionTitle(aboutData.mission_title || "");
      setMissionContent(aboutData.mission_content || "");
      setValues((aboutData.values as Array<{ icon: string; title: string; description: string }>) || []);
    }
  }, [aboutData]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!aboutId) throw new Error("No about ID found");

      const { error } = await supabase
        .from("about_us")
        .update({
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          story_title: storyTitle,
          story_content: storyContent,
          mission_title: missionTitle,
          mission_content: missionContent,
          values: values,
        })
        .eq("id", aboutId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-us-admin"] });
      queryClient.invalidateQueries({ queryKey: ["about-us"] });
      toast.success(t("About page updated successfully"));
    },
    onError: (error) => {
      console.error("Error updating about page:", error);
      toast.error(t("Failed to update about page"));
    },
  });

  const handleAddValue = () => {
    setValues([...values, { icon: "Shield", title: "", description: "" }]);
  };

  const handleRemoveValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, field: string, value: string) => {
    const newValues = [...values];
    newValues[index] = { ...newValues[index], [field]: value };
    setValues(newValues);
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("About Page Management")}</h1>
        <p className="text-muted-foreground">
          {t("Customize the content displayed on the About page")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-12 w-40 ml-auto" />
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <Card>
          <CardHeader>
            <CardTitle>{t("Hero Section")}</CardTitle>
            <CardDescription>{t("The main banner at the top of the About page")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="heroTitle">{t("Hero Title")}</Label>
              <Input
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder={t("About PEAK Syria")}
              />
            </div>
            <div>
              <Label htmlFor="heroSubtitle">{t("Hero Subtitle")}</Label>
              <Textarea
                id="heroSubtitle"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder={t("The official and exclusive distributor...")}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Story Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Our Story Section")}</CardTitle>
            <CardDescription>{t("Tell your company's story")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storyTitle">{t("Story Title")}</Label>
              <Input
                id="storyTitle"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                placeholder={t("Our Story")}
              />
            </div>
            <div>
              <Label htmlFor="storyContent">{t("Story Content")}</Label>
              <Textarea
                id="storyContent"
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder={t("Your company story...")}
                rows={8}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("Use double line breaks to create separate paragraphs")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Why Choose Us Section")}</CardTitle>
            <CardDescription>{t("Highlight your company values and benefits")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {values.map((value, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{t("Value")} {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveValue(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div>
                  <Label>{t("Icon")}</Label>
                  <Select
                    value={value.icon}
                    onValueChange={(val) => handleValueChange(index, "icon", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Title")}</Label>
                  <Input
                    value={value.title}
                    onChange={(e) => handleValueChange(index, "title", e.target.value)}
                    placeholder={t("100% Authentic")}
                  />
                </div>
                <div>
                  <Label>{t("Description")}</Label>
                  <Textarea
                    value={value.description}
                    onChange={(e) => handleValueChange(index, "description", e.target.value)}
                    placeholder={t("Official distributor ensuring genuine PEAK products")}
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddValue} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t("Add Value")}
            </Button>
          </CardContent>
        </Card>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Mission Section")}</CardTitle>
            <CardDescription>{t("Define your company's mission")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="missionTitle">{t("Mission Title")}</Label>
              <Input
                id="missionTitle"
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                placeholder={t("Our Mission")}
              />
            </div>
            <div>
              <Label htmlFor="missionContent">{t("Mission Content")}</Label>
              <Textarea
                id="missionContent"
                value={missionContent}
                onChange={(e) => setMissionContent(e.target.value)}
                placeholder={t("Your mission statement...")}
                rows={4}
              />
            </div>
          </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => updateMutation.mutate()}
          size="lg"
          disabled={updateMutation.isPending}
        >
          {t("Save All Changes")}
        </Button>
      </div>
        </>
      )}
    </div>
  );
};

export default AboutManagement;
