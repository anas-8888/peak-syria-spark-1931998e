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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type HeroSlide = {
  id: string;
  flag_name: string;
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
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [slideForm, setSlideForm] = useState({
    flag_name: "",
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

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
      toast.success(editingSlide ? "Slide updated successfully" : "Slide created successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Error saving slide: " + error.message);
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
      toast.success("Slide deleted successfully");
      setDeletingSlideId(null);
    },
    onError: (error) => {
      toast.error("Error deleting slide: " + error.message);
    },
  });

  const resetForm = () => {
    setSlideForm({
      flag_name: "",
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
      flag_name: slide.flag_name,
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
          <h1 className="text-3xl font-bold">Hero Slides</h1>
          <p className="text-muted-foreground mt-1">
            Manage hero section slides with product flags
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? "Edit Slide" : "Create New Slide"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="flag-name">Flag Name *</Label>
                <Input
                  id="flag-name"
                  value={slideForm.flag_name}
                  onChange={(e) => setSlideForm({ ...slideForm, flag_name: e.target.value })}
                  placeholder="e.g. New Arrival, Offer, Best Seller"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Common examples: New Arrival, Offer, Best Seller, Limited Edition
                </p>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="Enter slide title"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle *</Label>
                <Input
                  id="subtitle"
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  placeholder="Enter slide subtitle"
                />
              </div>

              <div>
                <Label htmlFor="button-text">Button Text *</Label>
                <Input
                  id="button-text"
                  value={slideForm.button_text}
                  onChange={(e) => setSlideForm({ ...slideForm, button_text: e.target.value })}
                  placeholder="Enter button text"
                />
              </div>

              <div>
                <Label htmlFor="button-url">Button URL *</Label>
                <Input
                  id="button-url"
                  value={slideForm.button_url}
                  onChange={(e) => setSlideForm({ ...slideForm, button_url: e.target.value })}
                  placeholder="/offers"
                />
              </div>

              <div>
                <Label htmlFor="display-order">Display Order *</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={slideForm.display_order}
                  onChange={(e) => setSlideForm({ ...slideForm, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="image">Slide Image *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Recommended size: 1920x1080px (16:9 aspect ratio) for best results
                </p>
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
                  {(slideForm.image_url || imageFile) && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      {imageFile ? imageFile.name : "Current image uploaded"}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
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
                  Cancel
                </Button>
                <Button
                  onClick={() => saveSlide.mutate(slideForm)}
                  disabled={
                    !slideForm.flag_name ||
                    !slideForm.title ||
                    !slideForm.subtitle ||
                    !slideForm.button_text ||
                    !slideForm.button_url ||
                    (!slideForm.image_url && !imageFile) ||
                    saveSlide.isPending
                  }
                >
                  {saveSlide.isPending ? "Saving..." : editingSlide ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Hero Slides</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading slides...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Button Text</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>{slide.display_order}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {slide.flag_name}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{slide.title}</TableCell>
                    <TableCell>{slide.button_text}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        slide.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {slide.is_active ? "Active" : "Inactive"}
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
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this slide? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingSlideId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingSlideId && deleteSlide.mutate(deletingSlideId)}
              disabled={deleteSlide.isPending}
            >
              {deleteSlide.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroSlides;
