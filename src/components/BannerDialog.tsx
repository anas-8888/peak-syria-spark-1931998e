import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

interface BannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
  onSave: (banner: Omit<Banner, "id"> | Banner) => Promise<void>;
  maxPosition: number;
}

export default function BannerDialog({
  open,
  onOpenChange,
  banner,
  onSave,
  maxPosition,
}: BannerDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Omit<Banner, "id">>({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    link_text: "Shop Now",
    background_color: "#000000",
    text_color: "#FFFFFF",
    position: maxPosition,
    is_active: true,
    display_type: "full-width",
  });

  useEffect(() => {
    if (banner) {
      setFormData(banner);
    } else {
      setFormData({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        link_text: "Shop Now",
        background_color: "#000000",
        text_color: "#FFFFFF",
        position: maxPosition,
        is_active: true,
        display_type: "full-width",
      });
    }
  }, [banner, maxPosition, open]);

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

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (banner?.id) {
        await onSave({ ...formData, id: banner.id });
      } else {
        await onSave(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving banner:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Create Banner"}</DialogTitle>
          <DialogDescription>Configure your promotional banner</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Limited Time Offer!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle || ""}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Get 50% off on selected items"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Banner Image *</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="h-32 rounded-lg object-cover" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                value={formData.link_url || ""}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="/products"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_text">Link Text</Label>
              <Input
                id="link_text"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                placeholder="Shop Now"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bg_color">Background Color</Label>
              <Input
                id="bg_color"
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_color">Text Color</Label>
              <Input
                id="text_color"
                type="color"
                value={formData.text_color}
                onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_type">Display Type</Label>
            <Select
              value={formData.display_type}
              onValueChange={(value) => setFormData({ ...formData, display_type: value })}
            >
              <SelectTrigger id="display_type">
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
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title || !formData.image_url}>
            {banner ? "Update" : "Create"} Banner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
