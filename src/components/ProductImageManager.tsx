import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Star, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type ProductImageManagerProps = {
  productId: string;
};

export const ProductImageManager = ({ productId }: ProductImageManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch product images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from("product_images").insert({
        product_id: productId,
        image_url: publicUrl,
        is_primary: images.length === 0, // First image is primary by default
        display_order: images.length,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload image", {
        description: error.message,
      });
    },
  });

  // Set primary image mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      // Remove primary from all images
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);

      // Set new primary
      const { error } = await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast.success("Primary image updated");
    },
    onError: (error) => {
      toast.error("Failed to set primary image", {
        description: error.message,
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (image: ProductImage) => {
      // Delete from storage
      const fileName = image.image_url.split("/").slice(-2).join("/");
      await supabase.storage.from("product-images").remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      toast.success("Image deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete image", {
        description: error.message,
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please upload only image files");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image size should be less than 5MB");
          continue;
        }
        await uploadImageMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (!productId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Save the product first to add images</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Product Images</h3>
        <label htmlFor="image-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Images"}
          </Button>
          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">
          Loading images...
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No images yet</p>
          <p className="text-sm">Upload your first product image</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <Card
              key={image.id}
              className={`relative group overflow-hidden ${
                image.is_primary ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="aspect-square">
                <img
                  src={image.image_url}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant={image.is_primary ? "default" : "secondary"}
                  onClick={() => setPrimaryMutation.mutate(image.id)}
                  disabled={setPrimaryMutation.isPending}
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={() => deleteImageMutation.mutate(image)}
                  disabled={deleteImageMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary badge */}
              {image.is_primary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        <Star className="h-3 w-3 inline mr-1" />
        Click the star icon to set an image as primary. The primary image will be
        displayed as the main product image.
      </p>
    </div>
  );
};
