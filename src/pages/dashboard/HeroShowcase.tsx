import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, MoveUp, MoveDown, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import PercentageLoader from "@/components/PercentageLoader";

interface HeroShowcase {
  id: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_description: string;
  hero_image_url: string;
  cta_text: string;
  cta_url: string | null;
  position: number;
  is_active: boolean;
}

interface ShowcaseProduct {
  id: string;
  showcase_id: string;
  product_id: string;
  display_order: number;
  products: {
    name: string;
    image_url: string;
  };
}

const HeroShowcase = () => {
  const queryClient = useQueryClient();
  const [editingShowcase, setEditingShowcase] = useState<HeroShowcase | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: showcases, isLoading } = useQuery({
    queryKey: ["admin-hero-showcases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_showcase")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as HeroShowcase[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-for-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url")
        .eq("is_active", true)
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const getShowcaseProducts = async (showcaseId: string) => {
    const { data, error } = await supabase
      .from("showcase_products")
      .select("*, products(name, image_url)")
      .eq("showcase_id", showcaseId)
      .order("display_order");
    if (error) throw error;
    return data as ShowcaseProduct[];
  };

  const createMutation = useMutation({
    mutationFn: async (showcase: Omit<HeroShowcase, "id">) => {
      const { data, error } = await supabase
        .from("hero_showcase")
        .insert(showcase)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (newShowcase) => {
      // Add selected products
      if (selectedProducts.length > 0) {
        const showcaseProducts = selectedProducts.map((productId, index) => ({
          showcase_id: newShowcase.id,
          product_id: productId,
          display_order: index,
        }));
        await supabase.from("showcase_products").insert(showcaseProducts);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-hero-showcases"] });
      toast.success("Hero showcase created successfully");
      setEditingShowcase(null);
      setSelectedProducts([]);
    },
    onError: () => toast.error("Failed to create hero showcase"),
  });

  const updateMutation = useMutation({
    mutationFn: async (showcase: HeroShowcase) => {
      const { error } = await supabase
        .from("hero_showcase")
        .update(showcase)
        .eq("id", showcase.id);
      if (error) throw error;

      // Update showcase products
      await supabase
        .from("showcase_products")
        .delete()
        .eq("showcase_id", showcase.id);

      if (selectedProducts.length > 0) {
        const showcaseProducts = selectedProducts.map((productId, index) => ({
          showcase_id: showcase.id,
          product_id: productId,
          display_order: index,
        }));
        await supabase.from("showcase_products").insert(showcaseProducts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-showcases"] });
      toast.success("Hero showcase updated successfully");
    },
    onError: () => toast.error("Failed to update hero showcase"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hero_showcase").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-showcases"] });
      toast.success("Hero showcase deleted successfully");
    },
    onError: () => toast.error("Failed to delete hero showcase"),
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

      if (editingShowcase) {
        setEditingShowcase({ ...editingShowcase, hero_image_url: publicUrl });
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleEditShowcase = async (showcase: HeroShowcase) => {
    setEditingShowcase(showcase);
    const products = await getShowcaseProducts(showcase.id);
    setSelectedProducts(products.map(p => p.product_id));
  };

  const handleSave = () => {
    if (!editingShowcase) return;
    
    if (editingShowcase.id) {
      updateMutation.mutate(editingShowcase);
    } else {
      createMutation.mutate(editingShowcase);
    }
  };

  const movePosition = (showcase: HeroShowcase, direction: "up" | "down") => {
    if (!showcases) return;
    const currentIndex = showcases.findIndex(s => s.id === showcase.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= showcases.length) return;
    
    const swapShowcase = showcases[swapIndex];
    updateMutation.mutate({ ...showcase, position: swapShowcase.position });
    updateMutation.mutate({ ...swapShowcase, position: showcase.position });
  };

  if (isLoading) return <PercentageLoader />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hero Showcase Management</h1>
        <p className="text-muted-foreground">
          Create featured product sections with hero images and product grids
        </p>
      </div>

      <Button onClick={() => {
        setEditingShowcase({
          id: "",
          hero_title: "",
          hero_subtitle: "",
          hero_description: "",
          hero_image_url: "",
          cta_text: "View Models",
          cta_url: "/products",
          position: (showcases?.length || 0),
          is_active: true,
        });
        setSelectedProducts([]);
      }}>
        <Plus className="mr-2 h-4 w-4" />
        Create Hero Showcase
      </Button>

      {editingShowcase && (
        <Card>
          <CardHeader>
            <CardTitle>{editingShowcase.id ? "Edit Hero Showcase" : "Create Hero Showcase"}</CardTitle>
            <CardDescription>Configure your featured product section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingShowcase.hero_title}
                onChange={(e) => setEditingShowcase({ ...editingShowcase, hero_title: e.target.value })}
                placeholder="Outdoor Collection"
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle (Optional)</Label>
              <Input
                value={editingShowcase.hero_subtitle || ""}
                onChange={(e) => setEditingShowcase({ ...editingShowcase, hero_subtitle: e.target.value })}
                placeholder="Premium Trail Shoes"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingShowcase.hero_description}
                onChange={(e) => setEditingShowcase({ ...editingShowcase, hero_description: e.target.value })}
                placeholder="Explore all terrains with our Peak Outdoor robust, comfortable, and stylish shoes."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Hero Image</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {editingShowcase.hero_image_url && (
                <img src={editingShowcase.hero_image_url} alt="Preview" className="h-64 rounded-lg object-cover" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input
                  value={editingShowcase.cta_text}
                  onChange={(e) => setEditingShowcase({ ...editingShowcase, cta_text: e.target.value })}
                  placeholder="View Models"
                />
              </div>

              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input
                  value={editingShowcase.cta_url || ""}
                  onChange={(e) => setEditingShowcase({ ...editingShowcase, cta_url: e.target.value })}
                  placeholder="/products"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Featured Products (Select up to 4)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products?.slice(0, 12).map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        } else if (selectedProducts.length < 4) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          toast.error("Maximum 4 products allowed");
                        }
                      }}
                      className={`relative cursor-pointer border-2 rounded-lg p-2 transition-all ${
                        isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {selectedProducts.indexOf(product.id) + 1}
                        </div>
                      )}
                      <img src={product.image_url || ""} alt={product.name} className="w-full h-24 object-cover rounded" />
                      <p className="text-xs mt-1 truncate">{product.name}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Selected: {selectedProducts.length}/4</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingShowcase.is_active}
                onCheckedChange={(checked) => setEditingShowcase({ ...editingShowcase, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={!editingShowcase.hero_title || !editingShowcase.hero_description || !editingShowcase.hero_image_url}
              >
                Save Showcase
              </Button>
              <Button variant="outline" onClick={() => {
                setEditingShowcase(null);
                setSelectedProducts([]);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {showcases?.map((showcase, index) => (
          <Card key={showcase.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img src={showcase.hero_image_url} alt={showcase.hero_title} className="h-24 w-40 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold">{showcase.hero_title}</h3>
                  {showcase.hero_subtitle && (
                    <p className="text-sm text-muted-foreground">{showcase.hero_subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{showcase.hero_description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => movePosition(showcase, "up")} disabled={index === 0}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => movePosition(showcase, "down")} disabled={index === showcases.length - 1}>
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Switch checked={showcase.is_active} onCheckedChange={(checked) => updateMutation.mutate({ ...showcase, is_active: checked })} />
                  <Button variant="outline" onClick={() => handleEditShowcase(showcase)}>Edit</Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(showcase.id)}>
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

export default HeroShowcase;
