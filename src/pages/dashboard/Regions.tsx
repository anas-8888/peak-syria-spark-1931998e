import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Region = {
  id: string;
  name: string;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const Regions = () => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState({
    name: "",
    country: ""
  });

  const queryClient = useQueryClient();

  // Fetch regions
  const { data: regions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Region[];
    },
  });

  // Create/Update Region
  const saveRegionMutation = useMutation({
    mutationFn: async (data: typeof regionForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("regions")
          .update({
            name: data.name,
            country: data.country || null,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("regions")
          .insert({
            name: data.name,
            country: data.country || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      toast.success(editingRegion ? t("Region updated") : t("Region created"));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error(t("Failed to save region"));
    },
  });

  // Toggle region active status
  const toggleRegionMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("regions")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      toast.success(t("Region status updated"));
    },
    onError: () => {
      toast.error(t("Failed to update region status"));
    },
  });

  // Delete Region
  const deleteRegionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("regions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      toast.success(t("Region deleted"));
      setDeletingRegionId(null);
    },
    onError: () => {
      toast.error(t("Failed to delete region"));
    },
  });

  const resetForm = () => {
    setRegionForm({
      name: "",
      country: ""
    });
    setEditingRegion(null);
  };

  const openEditRegion = (region: Region) => {
    setEditingRegion(region);
    setRegionForm({
      name: region.name,
      country: region.country || ""
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regions</h1>
          <p className="text-muted-foreground">Manage delivery regions and locations</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Region
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Regions</CardTitle>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No regions yet. Add your first region to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>{region.country || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={region.is_active}
                          onCheckedChange={(checked) => 
                            toggleRegionMutation.mutate({ id: region.id, is_active: checked })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {region.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRegion(region)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingRegionId(region.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Region Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegion ? "Edit Region" : "Add Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="region-name">Region Name *</Label>
              <Input
                id="region-name"
                value={regionForm.name}
                onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                placeholder="Damascus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region-country">Country</Label>
              <Input
                id="region-country"
                value={regionForm.country}
                onChange={(e) => setRegionForm({ ...regionForm, country: e.target.value })}
                placeholder="Syria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveRegionMutation.mutate(editingRegion ? { ...regionForm, id: editingRegion.id } : regionForm)}
              disabled={!regionForm.name}
            >
              {editingRegion ? "Update" : "Add"} Region
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRegionId} onOpenChange={() => setDeletingRegionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this region? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRegionId && deleteRegionMutation.mutate(deletingRegionId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Regions;
