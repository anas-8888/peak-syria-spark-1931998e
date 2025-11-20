import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Image as ImageIcon } from "lucide-react";
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
  display_order?: number;
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
        .order("display_order", { ascending: true});
      
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId
  });

  const addColorMapping = (colorId: string) => {
    if (!selectedMappings.find(m => m.color_id === colorId)) {
      onMappingChange([...selectedMappings, { color_id: colorId, image_id: null, display_order: 0 }]);
    }
  };

  const addImageToColor = (colorId: string) => {
    const colorMappings = selectedMappings.filter(m => m.color_id === colorId);
    const nextOrder = colorMappings.length;
    onMappingChange([...selectedMappings, { color_id: colorId, image_id: null, display_order: nextOrder }]);
  };

  const removeColorMapping = (colorId: string) => {
    onMappingChange(selectedMappings.filter(m => m.color_id !== colorId));
  };

  const removeImageFromColor = (colorId: string, index: number) => {
    const colorMappings = selectedMappings.filter(m => m.color_id === colorId);
    if (colorMappings.length === 1) {
      // If removing the last image, remove the color entirely
      removeColorMapping(colorId);
    } else {
      // Remove the specific image and reorder
      const mappingToRemove = colorMappings[index];
      const updatedMappings = selectedMappings
        .filter(m => m !== mappingToRemove)
        .map(m => {
          if (m.color_id === colorId && m.display_order && m.display_order > index) {
            return { ...m, display_order: m.display_order - 1 };
          }
          return m;
        });
      onMappingChange(updatedMappings);
    }
  };

  const updateImageMapping = (colorId: string, index: number, imageId: string | null) => {
    const colorMappings = selectedMappings.filter(m => m.color_id === colorId);
    const mappingToUpdate = colorMappings[index];
    
    onMappingChange(
      selectedMappings.map(m => 
        m === mappingToUpdate ? { ...m, image_id: imageId } : m
      )
    );
  };

  // Group mappings by color for easier rendering
  const colorGroups = selectedMappings.reduce((acc, mapping) => {
    if (!acc[mapping.color_id]) {
      acc[mapping.color_id] = [];
    }
    acc[mapping.color_id].push(mapping);
    return acc;
  }, {} as Record<string, ColorImageMapping[]>);

  // Sort images within each color by display_order
  Object.keys(colorGroups).forEach(colorId => {
    colorGroups[colorId].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  });

  const availableColors = colors.filter(
    c => !selectedMappings.find(m => m.color_id === c.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Product Colors & Images</Label>
        {Object.keys(colorGroups).length > 0 && (
          <span className="text-xs text-muted-foreground">
            {Object.keys(colorGroups).length} color{Object.keys(colorGroups).length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
      
      {/* Selected Colors */}
      <div className="space-y-4">
        {Object.keys(colorGroups).length === 0 ? (
          <p className="text-sm text-muted-foreground">No colors selected. Add colors below.</p>
        ) : (
          Object.entries(colorGroups).map(([colorId, mappings]) => {
            const color = colors.find(c => c.id === colorId);
            if (!color) return null;

            return (
              <div 
                key={colorId} 
                className="border rounded-lg bg-card p-4 space-y-3"
              >
                {/* Color Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: color.hex_code }}
                      className="w-8 h-8 rounded-md border-2 border-border shadow-sm"
                      title={color.name}
                    />
                    <span className="font-medium capitalize">{color.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({mappings.length} image{mappings.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColorMapping(colorId)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove Color
                  </Button>
                </div>

                {/* Images for this color */}
                <div className="space-y-2 pl-10">
                  {mappings.map((mapping, index) => {
                    const assignedImage = mapping.image_id 
                      ? productImages.find(img => img.id === mapping.image_id)
                      : null;

                    return (
                      <div 
                        key={`${colorId}-${index}`}
                        className="flex items-center gap-3 p-3 border rounded-md bg-background hover:bg-accent/5 transition-colors"
                      >
                        {/* Image Number */}
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                          {index + 1}
                        </div>

                        {/* Image Display */}
                        <div className="flex-1 flex items-center gap-2">
                          {assignedImage ? (
                            <div className="flex items-center gap-3 flex-1">
                              <div className="relative w-16 h-16 rounded-md border-2 border-primary overflow-hidden bg-muted">
                                <img
                                  src={assignedImage.image_url}
                                  alt={`${color.name} - Image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">Assigned</span>
                                <span className="text-xs text-muted-foreground">
                                  {assignedImage.is_primary ? 'Primary Image' : 'Secondary Image'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground flex-1">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-sm">No image assigned</span>
                            </div>
                          )}
                        </div>

                        {/* Image Selector */}
                        {productImages.length > 0 ? (
                          <Select
                            value={mapping.image_id || "none"}
                            onValueChange={(value) => 
                              updateImageMapping(colorId, index, value === "none" ? null : value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4" />
                                  <span className="text-xs">Select Image</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">No image</span>
                              </SelectItem>
                              {productImages
                                .filter(img => {
                                  // Show the image if it's the currently selected one
                                  if (img.id === mapping.image_id) return true;
                                  // Hide if already assigned to ANY color (not just this color)
                                  const isAlreadyAssigned = selectedMappings.some(
                                    m => m !== mapping && m.image_id === img.id
                                  );
                                  return !isAlreadyAssigned;
                                })
                                .map((img) => (
                                  <SelectItem key={img.id} value={img.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded border overflow-hidden bg-muted">
                                        <img
                                          src={img.image_url}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-xs">
                                        {img.is_primary ? 'Primary' : 'Image'}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Upload images first
                          </span>
                        )}

                        {/* Remove Image Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImageFromColor(colorId, index)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {/* Add Image Button */}
                  {productImages.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addImageToColor(colorId)}
                      className="w-full"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Another Image
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Color Dropdown */}
      {availableColors.length > 0 && (
        <div className="border-t pt-4">
          <Label className="mb-2 block text-sm">Add Color</Label>
          <Select onValueChange={(colorId) => addColorMapping(colorId)} value="">
            <SelectTrigger>
              <SelectValue placeholder="Select a color to add" />
            </SelectTrigger>
            <SelectContent>
              {availableColors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: color.hex_code }}
                      className="w-5 h-5 rounded border"
                    />
                    <span className="capitalize">{color.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {availableColors.length === 0 && selectedMappings.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          All available colors have been added
        </p>
      )}
    </div>
  );
};
