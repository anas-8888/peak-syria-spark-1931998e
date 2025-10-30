import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Upload, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import PercentageLoader from "@/components/PercentageLoader";

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
  const queryClient = useQueryClient();
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

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
      toast.success("Banner created successfully");
      setEditingBanner(null);
    },
    onError: () => toast.error("Failed to create banner"),
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
      toast.success("Banner updated successfully");
    },
    onError: () => toast.error("Failed to update banner"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: () => toast.error("Failed to delete banner"),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      if (editingBanner) {
        setEditingBanner({ ...editingBanner, image_url: publicUrl });
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!editingBanner) return;
    
    if (editingBanner.id) {
      updateMutation.mutate(editingBanner);
    } else {
      createMutation.mutate(editingBanner);
    }
  };

  const movePosition = (banner: Banner, direction: "up" | "down") => {
    if (!banners) return;
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= banners.length) return;
    
    const swapBanner = banners[swapIndex];
    updateMutation.mutate({ ...banner, position: swapBanner.position });
    updateMutation.mutate({ ...swapBanner, position: banner.position });
  };

  if (isLoading) return <PercentageLoader />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Banners Management</h1>
        <p className="text-muted-foreground">
          Create and manage promotional banners for your home page
        </p>
      </div>

      <Button onClick={() => setEditingBanner({
        id: "",
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        link_text: "Shop Now",
        background_color: "#000000",
        text_color: "#FFFFFF",
        position: (banners?.length || 0),
        is_active: true,
        display_type: "full-width",
      })}>
        <Plus className="mr-2 h-4 w-4" />
        Create Banner
      </Button>

      {editingBanner && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBanner.id ? "Edit Banner" : "Create Banner"}</CardTitle>
            <CardDescription>Configure your promotional banner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingBanner.title}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                placeholder="Limited Time Offer!"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={editingBanner.subtitle || ""}
                onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                placeholder="Get 50% off on selected items"
              />
            </div>

            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {editingBanner.image_url && (
                <img src={editingBanner.image_url} alt="Preview" className="h-32 rounded-lg object-cover" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={editingBanner.link_url || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  placeholder="/products"
                />
              </div>

              <div className="space-y-2">
                <Label>Link Text</Label>
                <Input
                  value={editingBanner.link_text}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_text: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={editingBanner.background_color}
                  onChange={(e) => setEditingBanner({ ...editingBanner, background_color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={editingBanner.text_color}
                  onChange={(e) => setEditingBanner({ ...editingBanner, text_color: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Type</Label>
              <Select
                value={editingBanner.display_type}
                onValueChange={(value) => setEditingBanner({ ...editingBanner, display_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-width">Full Width</SelectItem>
                  <SelectItem value="half-width">Half Width</SelectItem>
                  <SelectItem value="card">Card Style</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingBanner.is_active}
                onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editingBanner.title || !editingBanner.image_url}>
                Save Banner
              </Button>
              <Button variant="outline" onClick={() => setEditingBanner(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {banners?.map((banner, index) => (
          <Card key={banner.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img src={banner.image_url} alt={banner.title} className="h-24 w-40 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Type: {banner.display_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => movePosition(banner, "up")} disabled={index === 0}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => movePosition(banner, "down")} disabled={index === banners.length - 1}>
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Switch checked={banner.is_active} onCheckedChange={(checked) => updateMutation.mutate({ ...banner, is_active: checked })} />
                  <Button variant="outline" onClick={() => setEditingBanner(banner)}>Edit</Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(banner.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Banners;
