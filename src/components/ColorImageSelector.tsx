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
      <div className="flex items-center justify-between">
        <Label>Product Colors & Images</Label>
        {selectedMappings.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {selectedMappings.length} color{selectedMappings.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
      
      {/* Selected Colors */}
      <div className="space-y-3">
        {selectedMappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No colors selected. Add colors below.</p>
        ) : (
          selectedMappings.map((mapping) => {
            const color = colors.find(c => c.id === mapping.color_id);
            if (!color) return null;

            const assignedImage = mapping.image_id 
              ? productImages.find(img => img.id === mapping.image_id)
              : null;

            return (
              <div 
                key={mapping.color_id} 
                className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
              >
                {/* Color Swatch */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-border flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color.hex_code }}
                    title={color.name}
                  />
                  <span className="font-medium text-xs text-center">{color.name}</span>
                </div>
                
                {/* Arrow */}
                <div className="text-muted-foreground flex-shrink-0">
                  →
                </div>

                {/* Assigned Image Preview */}
                <div className="flex-1">
                  {assignedImage ? (
                    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <img 
                        src={assignedImage.image_url} 
                        alt="Assigned" 
                        className="w-16 h-16 object-cover rounded border-2 border-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Assigned Image</p>
                        <p className="text-xs text-muted-foreground">
                          {assignedImage.is_primary ? "Primary Image" : "Secondary Image"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border-2 border-dashed">
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                      <p className="text-sm text-muted-foreground">No image assigned</p>
                    </div>
                  )}
                </div>

                {/* Image Selector */}
                <div className="w-48 flex-shrink-0">
                  {productId && productImages.length > 0 ? (
                    <Select
                      value={mapping.image_id || "none"}
                      onValueChange={(value) => 
                        updateImageMapping(mapping.color_id, value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Change image" />
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
                              <span>{img.is_primary ? "Primary" : "Image"}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {productId ? "Upload images first" : "Save product first"}
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
                  title="Remove color"
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
