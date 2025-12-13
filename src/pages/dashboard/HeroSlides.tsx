import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  image_url: string;
  image_width: number;
  image_height: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const HeroSlides = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [slideForm, setSlideForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    button_url: "",
    image_url: "",
    image_width: 1920,
    image_height: 1080,
    display_order: 0,
    is_active: true,
  });

  // Fetch hero slides
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HeroSlide[];
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Import compression utility dynamically
      const { compressImageForUseCase, needsCompression } = await import("@/utils/imageCompression");
      
      // Compress image if needed
      let fileToUpload = file;
      if (needsCompression(file)) {
        try {
          const compressedBlob = await compressImageForUseCase(file, 'hero', 0.85);
          fileToUpload = new File([compressedBlob], file.name, {
            type: compressedBlob.type || file.type,
            lastModified: Date.now()
          });
        } catch (error) {
          console.warn('Failed to compress image, using original:', error);
        }
      }
      
      const fileExt = fileToUpload.name.split(".").pop() || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return publicUrl;
    },
  });

  // Save slide mutation
  const saveSlide = useMutation({
    mutationFn: async (slideData: typeof slideForm) => {
      let imageUrl = slideData.image_url;

      if (imageFile) {
        imageUrl = await uploadImageMutation.mutateAsync(imageFile);
      }

      const dataToSave = { ...slideData, image_url: imageUrl };

      if (editingSlide) {
        const { error } = await supabase
          .from("hero_slides")
          .update(dataToSave)
          .eq("id", editingSlide.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hero_slides")
          .insert([dataToSave]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(editingSlide ? t("Slide updated successfully") : t("Slide created successfully"));
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(t("Error saving slide: ") + error.message);
    },
  });

  // Delete slide mutation
  const deleteSlide = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(t("Slide deleted successfully"));
      setDeletingSlideId(null);
    },
    onError: (error) => {
      toast.error(t("Error deleting slide: ") + error.message);
    },
  });

  const resetForm = () => {
    setSlideForm({
      title: "",
      subtitle: "",
      button_text: "",
      button_url: "",
      image_url: "",
      image_width: 1920,
      image_height: 1080,
      display_order: 0,
      is_active: true,
    });
    setEditingSlide(null);
    setImageFile(null);
  };

  const openEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle,
      button_text: slide.button_text,
      button_url: slide.button_url,
      image_url: slide.image_url,
      image_width: slide.image_width,
      image_height: slide.image_height,
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("Hero Slides")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("Manage hero section carousel slides")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Slide")}
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSlide ? t("Edit Slide") : t("Create New Slide")}</DialogTitle>
                <DialogDescription>{editingSlide ? t("Update slide details") : t("Create a new hero carousel slide")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">

                <div>
                  <Label htmlFor="title">{t("Title")} *</Label>
                  <Input
                    id="title"
                    value={slideForm.title}
                    onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                    placeholder={t("Enter slide title")}
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle">{t("Subtitle")} *</Label>
                  <Input
                    id="subtitle"
                    value={slideForm.subtitle}
                    onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                    placeholder={t("Enter slide subtitle")}
                  />
                </div>

                <div>
                  <Label htmlFor="button-text">{t("Button Text")} *</Label>
                  <Input
                    id="button-text"
                    value={slideForm.button_text}
                    onChange={(e) => setSlideForm({ ...slideForm, button_text: e.target.value })}
                    placeholder={t("Enter button text")}
                  />
                </div>

                <div>
                  <Label htmlFor="button-url">{t("Button URL")} *</Label>
                  <Input
                    id="button-url"
                    value={slideForm.button_url}
                    onChange={(e) => setSlideForm({ ...slideForm, button_url: e.target.value })}
                    placeholder="/offers"
                  />
                </div>

                <div>
                  <Label htmlFor="display-order">{t("Display Order")} *</Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={slideForm.display_order}
                    onChange={(e) => setSlideForm({ ...slideForm, display_order: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="image">{t("Slide Image")} *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("Recommended size: 1920x1080px (16:9 aspect ratio) for best results")}
                  </p>
                  
                  {/* Show current image if exists */}
                  {slideForm.image_url && !imageFile && (
                    <div className="mb-3 relative inline-block">
                      <img 
                        src={slideForm.image_url} 
                        alt={t("Current slide")} 
                        className="w-full max-w-md h-40 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSlideForm({ ...slideForm, image_url: "" })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("Remove Image")}
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImageFile(file);
                      }}
                    />
                    {imageFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        {imageFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active">{t("Active")}</Label>
                  <Switch
                    id="is-active"
                    checked={slideForm.is_active}
                    onCheckedChange={(checked) => setSlideForm({ ...slideForm, is_active: checked })}
                  />
                </div>


                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    onClick={() => saveSlide.mutate(slideForm)}
                    disabled={
                      !slideForm.title ||
                      !slideForm.subtitle ||
                      !slideForm.button_text ||
                      !slideForm.button_url ||
                      (!editingSlide && !slideForm.image_url && !imageFile) ||
                      saveSlide.isPending
                    }
                  >
                    {saveSlide.isPending ? t("Saving...") : editingSlide ? t("Update") : t("Create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("All Hero Slides")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Image")}</TableHead>
                  <TableHead>{t("Order")}</TableHead>
                  <TableHead>{t("Title")}</TableHead>
                  <TableHead>{t("Button Text")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-20 w-32 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : slides.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No slides found")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Image")}</TableHead>
                  <TableHead>{t("Order")}</TableHead>
                  <TableHead>{t("Title")}</TableHead>
                  <TableHead>{t("Button Text")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      {slide.image_url ? (
                        <img 
                          src={slide.image_url} 
                          alt={slide.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          {t("No image")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{slide.display_order}</TableCell>
                    <TableCell className="font-medium">{slide.title}</TableCell>
                    <TableCell>{slide.button_text}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        slide.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {slide.is_active ? t("Active") : t("Inactive")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditSlide(slide)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingSlideId(slide.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSlideId} onOpenChange={() => setDeletingSlideId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Confirm Deletion")}</DialogTitle>
            <DialogDescription>{t("Are you sure you want to delete this slide? This action cannot be undone.")}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingSlideId(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingSlideId && deleteSlide.mutate(deletingSlideId)}
              disabled={deleteSlide.isPending}
            >
              {deleteSlide.isPending ? t("Deleting...") : t("Delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroSlides;
