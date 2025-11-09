import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, MoveUp, MoveDown, Edit } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import BannerDialog from "@/components/BannerDialog";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string;
  background_color: string;
  text_color: string;
  position: number;
  is_active: boolean;
  display_type: string;
}

const Banners = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as Banner[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (banner: Omit<Banner, "id">) => {
      const { error } = await supabase.from("banners").insert(banner);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("Banner created successfully"));
    },
    onError: () => toast.error(t("Failed to create banner")),
  });

  const updateMutation = useMutation({
    mutationFn: async (banner: Banner) => {
      const { error } = await supabase
        .from("banners")
        .update(banner)
        .eq("id", banner.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("Banner updated successfully"));
    },
    onError: () => toast.error(t("Failed to update banner")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("Banner deleted successfully"));
    },
    onError: () => toast.error(t("Failed to delete banner")),
  });

  const handleSave = async (banner: Omit<Banner, "id"> | Banner) => {
    if ("id" in banner) {
      await updateMutation.mutateAsync(banner);
    } else {
      await createMutation.mutateAsync(banner);
    }
  };

  const movePosition = (banner: Banner, direction: "up" | "down") => {
    if (!banners) return;
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= banners.length) return;

    const swapBanner = banners[swapIndex];
    updateMutation.mutate({ ...banner, position: swapBanner.position });
    updateMutation.mutate({ ...swapBanner, position: banner.position });
  };


  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("Banners Management")}</h1>
          <p className="text-muted-foreground">
            {t("Create and manage promotional banners for your home page")}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBanner(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("Create Banner")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-24 w-40 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {banners?.map((banner, index) => (
          <Card key={banner.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-24 w-40 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Type")}: {banner.display_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => movePosition(banner, "up")}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => movePosition(banner, "down")}
                    disabled={index === banners.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={banner.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ ...banner, is_active: checked })
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingBanner(banner);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteMutation.mutate(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banner={editingBanner}
        onSave={handleSave}
        maxPosition={banners?.length || 0}
      />
    </div>
  );
};

export default Banners;
