import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plus, Edit, Trash2, Tag, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type Flag = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  show_in_navbar: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

const Flags = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<Flag | null>(null);
  const [deletingFlagId, setDeletingFlagId] = useState<string | null>(null);

  const [flagForm, setFlagForm] = useState({
    name: "",
    description: "",
    is_active: true,
    show_in_navbar: false,
    display_order: 0,
  });

  // Fetch flags
  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flags")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Flag[];
    },
  });

  // Fetch products count per flag
  const { data: productCounts = {} } = useQuery({
    queryKey: ["flags-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("flag");

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((product) => {
        if (product.flag) {
          counts[product.flag] = (counts[product.flag] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Save flag mutation
  const saveFlag = useMutation({
    mutationFn: async (flagData: typeof flagForm) => {
      if (editingFlag) {
        const { error } = await supabase
          .from("flags")
          .update(flagData)
          .eq("id", editingFlag.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("flags")
          .insert([flagData]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      toast.success(editingFlag ? t("Flag updated successfully") : t("Flag created successfully"));
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate key")) {
        toast.error(t("A flag with this name already exists"));
      } else {
        toast.error(t("Error saving flag: ") + error.message);
      }
    },
  });

  // Delete flag mutation
  const deleteFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flags")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      toast.success(t("Flag deleted successfully"));
      setDeletingFlagId(null);
    },
    onError: (error: any) => {
      toast.error(t("Error deleting flag: ") + error.message);
    },
  });

  // Update order mutation
  const updateOrder = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("flags")
        .update({ display_order: newOrder })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
    },
  });

  // Toggle active mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("flags")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      toast.success(t("Flag status updated"));
    },
  });

  // Toggle navbar mutation
  const toggleNavbar = useMutation({
    mutationFn: async ({ id, showInNavbar }: { id: string; showInNavbar: boolean }) => {
      const { error } = await supabase
        .from("flags")
        .update({ show_in_navbar: showInNavbar })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      toast.success(t("Navbar visibility updated"));
    },
  });

  const resetForm = () => {
    setFlagForm({
      name: "",
      description: "",
      is_active: true,
      show_in_navbar: false,
      display_order: 0,
    });
    setEditingFlag(null);
  };

  const openEditFlag = (flag: Flag) => {
    setEditingFlag(flag);
    setFlagForm({
      name: flag.name,
      description: flag.description || "",
      is_active: flag.is_active,
      show_in_navbar: flag.show_in_navbar,
      display_order: flag.display_order,
    });
    setIsDialogOpen(true);
  };

  const moveFlag = (flag: Flag, direction: "up" | "down") => {
    const currentIndex = flags.findIndex((f) => f.id === flag.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= flags.length) return;
    
    const swapFlag = flags[swapIndex];
    
    updateOrder.mutate({ id: flag.id, newOrder: swapFlag.display_order });
    updateOrder.mutate({ id: swapFlag.id, newOrder: flag.display_order });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("Product Flags")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("Manage product flags like New Arrival, Best Seller, etc.")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("Add Flag")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFlag ? t("Edit Flag") : t("Create New Flag")}</DialogTitle>
              <DialogDescription>
                {editingFlag ? t("Update flag details") : t("Create a new product flag")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t("Flag Name")} *</Label>
                <Input
                  id="name"
                  value={flagForm.name}
                  onChange={(e) => setFlagForm({ ...flagForm, name: e.target.value })}
                  placeholder={t("e.g. New Arrival, Best Seller")}
                />
              </div>

              <div>
                <Label htmlFor="description">{t("Description")}</Label>
                <Textarea
                  id="description"
                  value={flagForm.description}
                  onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })}
                  placeholder={t("Optional description for this flag")}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="display-order">{t("Display Order")}</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={flagForm.display_order}
                  onChange={(e) => setFlagForm({ ...flagForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">{t("Active")}</Label>
                <Switch
                  id="is-active"
                  checked={flagForm.is_active}
                  onCheckedChange={(checked) => setFlagForm({ ...flagForm, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-in-navbar">{t("Show in Navbar")}</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Display this flag as a navigation link")}
                  </p>
                </div>
                <Switch
                  id="show-in-navbar"
                  checked={flagForm.show_in_navbar}
                  onCheckedChange={(checked) => setFlagForm({ ...flagForm, show_in_navbar: checked })}
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
                  onClick={() => saveFlag.mutate(flagForm)}
                  disabled={!flagForm.name || saveFlag.isPending}
                >
                  {saveFlag.isPending ? t("Saving...") : editingFlag ? t("Update") : t("Create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t("All Flags")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : flags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No flags found. Create your first flag!")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Order")}</TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Products")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("In Navbar")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag, index) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground w-6">{flag.display_order}</span>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveFlag(flag, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveFlag(flag, "down")}
                            disabled={index === flags.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {flag.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {flag.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {productCounts[flag.name] || 0} {t("products")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.is_active}
                        onCheckedChange={(checked) => 
                          toggleActive.mutate({ id: flag.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.show_in_navbar}
                        onCheckedChange={(checked) => 
                          toggleNavbar.mutate({ id: flag.id, showInNavbar: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditFlag(flag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingFlagId(flag.id)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFlagId} onOpenChange={() => setDeletingFlagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Flag")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this flag? Products with this flag will keep their current flag value.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingFlagId && deleteFlag.mutate(deletingFlagId)}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Flags;
