import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit, Trash2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import PercentageLoader from "@/components/PercentageLoader";

type Color = {
  id: string;
  name: string;
  hex_code: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const Colors = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteColorId, setDeleteColorId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    hex_code: "#000000",
    display_order: "0",
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch colors
  const { data: colors = [], isLoading } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Color[];
    }
  });

  // Add color mutation
  const addColorMutation = useMutation({
    mutationFn: async (newColor: typeof formData) => {
      const { data, error } = await supabase
        .from("colors")
        .insert({
          name: newColor.name,
          hex_code: newColor.hex_code,
          display_order: parseInt(newColor.display_order),
          is_active: newColor.is_active
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success(t("Color added successfully"));
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(t("Failed to add color"), {
        description: error.message
      });
    }
  });

  // Update color mutation
  const updateColorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: typeof formData }) => {
      const { error } = await supabase
        .from("colors")
        .update({
          name: updates.name,
          hex_code: updates.hex_code,
          display_order: parseInt(updates.display_order),
          is_active: updates.is_active
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success(t("Color updated successfully"));
      setIsEditDialogOpen(false);
      setSelectedColor(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(t("Failed to update color"), {
        description: error.message
      });
    }
  });

  // Delete color mutation
  const deleteColorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("colors")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success(t("Color deleted successfully"));
      setDeleteColorId(null);
    },
    onError: (error: any) => {
      toast.error(t("Failed to delete color"), {
        description: error.message
      });
    }
  });

  const filteredColors = colors.filter(color =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      hex_code: "#000000",
      display_order: "0",
      is_active: true
    });
  };

  const handleAddColor = () => {
    if (!formData.name || !formData.hex_code) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    addColorMutation.mutate(formData);
  };

  const handleEditColor = () => {
    if (!selectedColor || !formData.name || !formData.hex_code) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    updateColorMutation.mutate({ id: selectedColor.id, updates: formData });
  };

  const openEditDialog = (color: Color) => {
    setSelectedColor(color);
    setFormData({
      name: color.name,
      hex_code: color.hex_code,
      display_order: color.display_order.toString(),
      is_active: color.is_active
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <PercentageLoader />;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Color Management</h1>
          <p className="text-muted-foreground">
            Manage product colors and swatches
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Color
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Colors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Colors ({filteredColors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Swatch</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Hex Code</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredColors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <div
                      className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
                      style={{ backgroundColor: color.hex_code }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{color.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {color.hex_code}
                    </code>
                  </TableCell>
                  <TableCell>{color.display_order}</TableCell>
                  <TableCell>
                    <Badge variant={color.is_active ? "default" : "secondary"}>
                      {color.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(color)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteColorId(color.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Color Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Add New Color
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Color Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Navy Blue"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hex_code">Hex Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="hex_code"
                  type="color"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColor} disabled={addColorMutation.isPending}>
              {addColorMutation.isPending ? "Adding..." : "Add Color"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Color Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Edit Color
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Color Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Navy Blue"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hex_code">Hex Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-hex_code"
                  type="color"
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  className="w-20 h-10 p-1"
                />
                <Input
                  value={formData.hex_code}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display_order">Display Order</Label>
              <Input
                id="edit-display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_active">Active</Label>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditColor} disabled={updateColorMutation.isPending}>
              {updateColorMutation.isPending ? "Updating..." : "Update Color"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteColorId} onOpenChange={() => setDeleteColorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this color. Products using this color will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColorId && deleteColorMutation.mutate(deleteColorId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Colors;
