import { useState } from "react";
import { Truck, MapPin, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ShippingCarrier {
  id: string;
  name: string;
  description: string | null;
  estimated_days: string | null;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
}

interface Region {
  id: string;
  name: string;
  country: string | null;
  is_active: boolean;
}

interface CarrierRegion {
  id: string;
  carrier_id: string;
  region_id: string;
  cost: number;
  regions?: Region;
}

const Shipping = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [carrierDialogOpen, setCarrierDialogOpen] = useState(false);
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRegionDialogOpen, setDeleteRegionDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);
  const [deletingCarrierId, setDeletingCarrierId] = useState<string | null>(null);
  const [deletingRegionId, setDeletingRegionId] = useState<string | null>(null);

  // Form state for carrier
  const [carrierForm, setCarrierForm] = useState({
    name: "",
    description: "",
    estimated_days: "",
    display_order: "0",
    is_active: true,
    image_url: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state for region mapping
  const [regionForm, setRegionForm] = useState({
    carrier_id: "",
    region_id: "",
    cost: "",
  });

  // Fetch carriers
  const { data: carriers, isLoading: carriersLoading } = useQuery({
    queryKey: ["shipping-carriers-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_carriers")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as ShippingCarrier[];
    },
  });

  // Fetch regions
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ["regions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Region[];
    },
  });

  // Fetch carrier regions
  const { data: carrierRegions, isLoading: carrierRegionsLoading } = useQuery({
    queryKey: ["shipping-carrier-regions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_carrier_regions")
        .select("*, regions(*)");
      if (error) throw error;
      return data as CarrierRegion[];
    },
  });

  // Save carrier mutation
  const saveCarrierMutation = useMutation({
    mutationFn: async (carrier: Partial<ShippingCarrier> & { name: string }) => {
      if (editingCarrier) {
        const { error } = await supabase
          .from("shipping_carriers")
          .update(carrier)
          .eq("id", editingCarrier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_carriers").insert([carrier]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers-admin"] });
      toast.success(editingCarrier ? t("Carrier updated successfully") : t("Carrier created successfully"));
      resetCarrierForm();
      setCarrierDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to save carrier"));
    },
  });

  // Toggle carrier status mutation
  const toggleCarrierMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("shipping_carriers")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers-admin"] });
      toast.success(t("Carrier status updated"));
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to update carrier status"));
    },
  });

  // Delete carrier mutation
  const deleteCarrierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_carriers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers-admin"] });
      toast.success(t("Carrier deleted successfully"));
      setDeleteDialogOpen(false);
      setDeletingCarrierId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to delete carrier"));
    },
  });

  // Save carrier region mutation
  const saveCarrierRegionMutation = useMutation({
    mutationFn: async (data: { carrier_id: string; region_id: string; cost: number }) => {
      const { error } = await supabase.from("shipping_carrier_regions").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carrier-regions-admin"] });
      toast.success(t("Region added to carrier successfully"));
      resetRegionForm();
      setRegionDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to add region"));
    },
  });

  // Delete carrier region mutation
  const deleteCarrierRegionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_carrier_regions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carrier-regions-admin"] });
      toast.success(t("Region removed from carrier successfully"));
      setDeleteRegionDialogOpen(false);
      setDeletingRegionId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || t("Failed to remove region"));
    },
  });

  const resetCarrierForm = () => {
    setCarrierForm({
      name: "",
      description: "",
      estimated_days: "",
      display_order: "0",
      is_active: true,
      image_url: "",
    });
    setEditingCarrier(null);
  };

  const resetRegionForm = () => {
    setRegionForm({
      carrier_id: "",
      region_id: "",
      cost: "",
    });
  };

  const handleEditCarrier = (carrier: ShippingCarrier) => {
    setEditingCarrier(carrier);
    setCarrierForm({
      name: carrier.name,
      description: carrier.description || "",
      estimated_days: carrier.estimated_days || "",
      display_order: carrier.display_order.toString(),
      is_active: carrier.is_active,
      image_url: carrier.image_url || "",
    });
    setCarrierDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("Please upload an image file"));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("Image size should be less than 2MB"));
      return;
    }

    setUploadingImage(true);
    try {
      // Import compression utility dynamically
      const { compressImageForUseCase, needsCompression } = await import("@/utils/imageCompression");
      
      // Compress image if needed
      let fileToUpload = file;
      if (needsCompression(file)) {
        try {
          const compressedBlob = await compressImageForUseCase(file, 'small', 0.85);
          fileToUpload = new File([compressedBlob], file.name, {
            type: compressedBlob.type || file.type,
            lastModified: Date.now()
          });
        } catch (error) {
          console.warn('Failed to compress image, using original:', error);
        }
      }
      
      const fileExt = fileToUpload.name.split(".").pop() || 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `shipping-carriers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileToUpload);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setCarrierForm({ ...carrierForm, image_url: data.publicUrl });
      toast.success(t("Image uploaded successfully"));
    } catch (error: any) {
      toast.error(error.message || t("Failed to upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCarrier = () => {
    if (!carrierForm.name) {
      toast.error(t("Please fill in all required fields"));
      return;
    }

    saveCarrierMutation.mutate({
      name: carrierForm.name,
      description: carrierForm.description || null,
      estimated_days: carrierForm.estimated_days || null,
      display_order: parseInt(carrierForm.display_order),
      is_active: carrierForm.is_active,
      image_url: carrierForm.image_url || null,
    });
  };

  const handleSaveCarrierRegion = () => {
    if (!regionForm.carrier_id || !regionForm.region_id || !regionForm.cost) {
      toast.error(t("Please fill in all required fields"));
      return;
    }

    saveCarrierRegionMutation.mutate({
      carrier_id: regionForm.carrier_id,
      region_id: regionForm.region_id,
      cost: parseFloat(regionForm.cost),
    });
  };

  const filteredCarriers = carriers?.filter((carrier) =>
    carrier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCarriers = carriers?.filter((c) => c.is_active).length || 0;
  const inactiveCarriers = (carriers?.length || 0) - activeCarriers;
  const totalRegions = regions?.length || 0;

  const isLoading = carriersLoading || regionsLoading || carrierRegionsLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("Shipping Management")}</h1>
          <p className="text-muted-foreground">{t("Manage carriers, rates, and delivery regions")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={resetRegionForm}>
                <MapPin className="h-4 w-4" />
                {t("Add Region Coverage")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("Add Region Coverage")}</DialogTitle>
                <DialogDescription>
                  {t("Assign a region to a carrier with specific cost")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t("Carrier")} *</Label>
                  <Select value={regionForm.carrier_id} onValueChange={(value) => setRegionForm({ ...regionForm, carrier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select carrier")} />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers?.map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Region")} *</Label>
                  <Select value={regionForm.region_id} onValueChange={(value) => setRegionForm({ ...regionForm, region_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select region")} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions?.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Cost")} ({t("s.p")}) *</Label>
                  <Input
                    type="number"
                    value={regionForm.cost}
                    onChange={(e) => setRegionForm({ ...regionForm, cost: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <Button onClick={handleSaveCarrierRegion} className="w-full">
                  {t("Add Region")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={carrierDialogOpen} onOpenChange={setCarrierDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetCarrierForm}>
                <Plus className="h-4 w-4" />
                {t("Add Carrier")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCarrier ? t("Edit Carrier") : t("Add New Carrier")}</DialogTitle>
                <DialogDescription>
                  {editingCarrier ? t("Update carrier information") : t("Create a new shipping carrier")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t("Carrier Name")} *</Label>
                  <Input
                    value={carrierForm.name}
                    onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                    placeholder={t("Express Delivery")}
                  />
                </div>
                <div>
                  <Label>{t("Description")}</Label>
                  <Textarea
                    value={carrierForm.description}
                    onChange={(e) => setCarrierForm({ ...carrierForm, description: e.target.value })}
                    placeholder={t("Fast and reliable delivery service")}
                  />
                </div>
                <div>
                  <Label>{t("Carrier Image")}</Label>
                  <div className="space-y-2">
                    {carrierForm.image_url && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={carrierForm.image_url}
                          alt={t("Carrier")}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <p className="text-xs text-muted-foreground">{t("Uploading image...")}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>{t("Estimated Delivery Time")}</Label>
                  <Input
                    value={carrierForm.estimated_days}
                    onChange={(e) => setCarrierForm({ ...carrierForm, estimated_days: e.target.value })}
                    placeholder={t("2-3 days")}
                  />
                </div>
                <div>
                  <Label>{t("Display Order")}</Label>
                  <Input
                    type="number"
                    value={carrierForm.display_order}
                    onChange={(e) => setCarrierForm({ ...carrierForm, display_order: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={carrierForm.is_active}
                    onCheckedChange={(checked) => setCarrierForm({ ...carrierForm, is_active: checked })}
                  />
                  <Label>{t("Active")}</Label>
                </div>
                <Button onClick={handleSaveCarrier} className="w-full">
                  {editingCarrier ? t("Update Carrier") : t("Create Carrier")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Total Carriers")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{carriers?.length || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Active / Inactive")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{activeCarriers} / {inactiveCarriers}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("Available Regions")}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{totalRegions}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Search carriers...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Carriers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Shipping Carriers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Delivery Time")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredCarriers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No carriers found")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Description")}</TableHead>
                  <TableHead>{t("Delivery Time")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarriers?.map((carrier) => (
                <TableRow key={carrier.id}>
                  <TableCell className="font-medium">{carrier.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {carrier.description || "-"}
                  </TableCell>
                  <TableCell>{carrier.estimated_days || "-"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={carrier.is_active}
                      onCheckedChange={(checked) =>
                        toggleCarrierMutation.mutate({ id: carrier.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCarrier(carrier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingCarrierId(carrier.id);
                          setDeleteDialogOpen(true);
                        }}
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

      {/* Carrier Regions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Carrier Region Coverage")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Carrier")}</TableHead>
                  <TableHead>{t("Region")}</TableHead>
                  <TableHead>{t("Cost")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : carrierRegions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("No region coverage added yet")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Carrier")}</TableHead>
                  <TableHead>{t("Region")}</TableHead>
                  <TableHead>{t("Cost")}</TableHead>
                  <TableHead>{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carrierRegions?.map((cr) => {
                  const carrier = carriers?.find((c) => c.id === cr.carrier_id);
                  return (
                    <TableRow key={cr.id}>
                      <TableCell className="font-medium">{carrier?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {cr.regions?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(cr.cost))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingRegionId(cr.id);
                            setDeleteRegionDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Carrier Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Carrier")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this carrier? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCarrierId && deleteCarrierMutation.mutate(deletingCarrierId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Region Dialog */}
      <AlertDialog open={deleteRegionDialogOpen} onOpenChange={setDeleteRegionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Remove Region Coverage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to remove this region from the carrier?")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRegionId && deleteCarrierRegionMutation.mutate(deletingRegionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipping;
