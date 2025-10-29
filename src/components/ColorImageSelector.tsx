import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Color = {
  id: string;
  name: string;
  hex_code: string;
};

type ProductImage = {
  id: string;
  image_url: string;
  is_primary: boolean;
};

type ColorImageMapping = {
  color_id: string;
  image_id: string | null;
};

type ColorImageSelectorProps = {
  productId: string | null;
  selectedMappings: ColorImageMapping[];
  onMappingChange: (mappings: ColorImageMapping[]) => void;
};

export const ColorImageSelector = ({ 
  productId, 
  selectedMappings, 
  onMappingChange 
}: ColorImageSelectorProps) => {
  // Fetch all active colors
  const { data: colors = [] } = useQuery({
    queryKey: ["colors-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("id, name, hex_code")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Color[];
    }
  });

  // Fetch product images if editing
  const { data: productImages = [] } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("product_images")
        .select("id, image_url, is_primary")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId
  });

  const addColorMapping = (colorId: string) => {
    if (!selectedMappings.find(m => m.color_id === colorId)) {
      onMappingChange([...selectedMappings, { color_id: colorId, image_id: null }]);
    }
  };

  const removeColorMapping = (colorId: string) => {
    onMappingChange(selectedMappings.filter(m => m.color_id !== colorId));
  };

  const updateImageMapping = (colorId: string, imageId: string | null) => {
    onMappingChange(
      selectedMappings.map(m => 
        m.color_id === colorId ? { ...m, image_id: imageId } : m
      )
    );
  };

  const availableColors = colors.filter(
    c => !selectedMappings.find(m => m.color_id === c.id)
  );

  return (
    <div className="space-y-4">
      <Label>Product Colors & Images</Label>
      
      {/* Selected Colors */}
      <div className="space-y-3">
        {selectedMappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No colors selected</p>
        ) : (
          selectedMappings.map((mapping) => {
            const color = colors.find(c => c.id === mapping.color_id);
            if (!color) return null;

            return (
              <div 
                key={mapping.color_id} 
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                {/* Color Swatch */}
                <div
                  className="w-10 h-10 rounded border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: color.hex_code }}
                  title={color.name}
                />
                
                {/* Color Name */}
                <div className="flex-shrink-0 w-24">
                  <span className="font-medium text-sm">{color.name}</span>
                </div>

                {/* Image Selector */}
                <div className="flex-1">
                  {productId && productImages.length > 0 ? (
                    <Select
                      value={mapping.image_id || "none"}
                      onValueChange={(value) => 
                        updateImageMapping(mapping.color_id, value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select image" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No image</SelectItem>
                        {productImages.map((img) => (
                          <SelectItem key={img.id} value={img.id}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={img.image_url} 
                                alt="Product" 
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span>{img.is_primary ? "Primary Image" : "Image"}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {productId ? "No images uploaded yet" : "Save product first to assign images"}
                    </span>
                  )}
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeColorMapping(mapping.color_id)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Color Dropdown */}
      {availableColors.length > 0 && (
        <Select onValueChange={addColorMapping}>
          <SelectTrigger>
            <SelectValue placeholder="+ Add a color" />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {availableColors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border-2 border-border"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span>{color.name}</span>
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
      )}

      {availableColors.length === 0 && selectedMappings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No colors available. Please add colors in the Colors management section.
        </p>
      )}
    </div>
  );
};
