import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, MoveUp, MoveDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PercentageLoader from "@/components/PercentageLoader";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  icon_name: string;
  background_gradient: string;
  position: number;
  is_active: boolean;
}

const Collections = () => {
  const queryClient = useQueryClient();
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: collections, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as Collection[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (collection: Omit<Collection, "id">) => {
      const { error } = await supabase.from("collections").insert(collection);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success("Collection created successfully");
      setEditingCollection(null);
    },
    onError: () => toast.error("Failed to create collection"),
  });

  const updateMutation = useMutation({
    mutationFn: async (collection: Collection) => {
      const { error } = await supabase
        .from("collections")
        .update(collection)
        .eq("id", collection.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success("Collection updated successfully");
    },
    onError: () => toast.error("Failed to update collection"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success("Collection deleted successfully");
    },
    onError: () => toast.error("Failed to delete collection"),
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

      if (editingCollection) {
        setEditingCollection({ ...editingCollection, image_url: publicUrl });
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!editingCollection) return;
    
    if (editingCollection.id) {
      updateMutation.mutate(editingCollection);
    } else {
      createMutation.mutate(editingCollection);
    }
  };

  const movePosition = (collection: Collection, direction: "up" | "down") => {
    if (!collections) return;
    const currentIndex = collections.findIndex(c => c.id === collection.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= collections.length) return;
    
    const swapCollection = collections[swapIndex];
    updateMutation.mutate({ ...collection, position: swapCollection.position });
    updateMutation.mutate({ ...swapCollection, position: collection.position });
  };

  if (isLoading) return <PercentageLoader />;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Featured Collections</h1>
        <p className="text-muted-foreground">
          Create curated collections to showcase on your home page
        </p>
      </div>

      <Button onClick={() => setEditingCollection({
        id: "",
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        icon_name: "sparkles",
        background_gradient: "from-primary/20 to-primary/5",
        position: (collections?.length || 0),
        is_active: true,
      })}>
        <Plus className="mr-2 h-4 w-4" />
        Create Collection
      </Button>

      {editingCollection && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCollection.id ? "Edit Collection" : "Create Collection"}</CardTitle>
            <CardDescription>Configure your featured collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editingCollection.title}
                onChange={(e) => setEditingCollection({ ...editingCollection, title: e.target.value })}
                placeholder="Summer Essentials"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingCollection.description || ""}
                onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                placeholder="Beat the heat with our premium collection"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Collection Image</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {editingCollection.image_url && (
                <img src={editingCollection.image_url} alt="Preview" className="h-48 rounded-lg object-cover" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                value={editingCollection.link_url || ""}
                onChange={(e) => setEditingCollection({ ...editingCollection, link_url: e.target.value })}
                placeholder="/products?collection=summer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon Name (Lucide)</Label>
                <Input
                  value={editingCollection.icon_name}
                  onChange={(e) => setEditingCollection({ ...editingCollection, icon_name: e.target.value })}
                  placeholder="sparkles"
                />
                <p className="text-xs text-muted-foreground">Use any Lucide icon name</p>
              </div>

              <div className="space-y-2">
                <Label>Background Gradient</Label>
                <Input
                  value={editingCollection.background_gradient}
                  onChange={(e) => setEditingCollection({ ...editingCollection, background_gradient: e.target.value })}
                  placeholder="from-primary/20 to-primary/5"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingCollection.is_active}
                onCheckedChange={(checked) => setEditingCollection({ ...editingCollection, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editingCollection.title || !editingCollection.image_url}>
                Save Collection
              </Button>
              <Button variant="outline" onClick={() => setEditingCollection(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {collections?.map((collection, index) => (
          <Card key={collection.id}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <img src={collection.image_url} alt={collection.title} className="h-24 w-40 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Gradient: {collection.background_gradient}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => movePosition(collection, "up")} disabled={index === 0}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => movePosition(collection, "down")} disabled={index === collections.length - 1}>
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Switch checked={collection.is_active} onCheckedChange={(checked) => updateMutation.mutate({ ...collection, is_active: checked })} />
                  <Button variant="outline" onClick={() => setEditingCollection(collection)}>Edit</Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(collection.id)}>
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

export default Collections;
