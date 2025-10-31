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
import PercentageLoader from "@/components/PercentageLoader";

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
      toast.success(editingCarrier ? "Carrier updated successfully" : "Carrier created successfully");
      resetCarrierForm();
      setCarrierDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save carrier");
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
      toast.success("Carrier status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update carrier status");
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
      toast.success("Carrier deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCarrierId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete carrier");
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
      toast.success("Region added to carrier successfully");
      resetRegionForm();
      setRegionDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add region");
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
      toast.success("Region removed from carrier successfully");
      setDeleteRegionDialogOpen(false);
      setDeletingRegionId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove region");
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
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `shipping-carriers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);

      setCarrierForm({ ...carrierForm, image_url: data.publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCarrier = () => {
    if (!carrierForm.name) {
      toast.error("Please fill in all required fields");
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
      toast.error("Please fill in all required fields");
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

  if (carriersLoading || regionsLoading || carrierRegionsLoading) {
    return (
      <div className="p-8">
        <PercentageLoader />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shipping Management</h1>
          <p className="text-muted-foreground">Manage carriers, rates, and delivery regions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={resetRegionForm}>
                <MapPin className="h-4 w-4" />
                Add Region Coverage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Region Coverage</DialogTitle>
                <DialogDescription>
                  Assign a region to a carrier with specific cost
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Carrier *</Label>
                  <Select value={regionForm.carrier_id} onValueChange={(value) => setRegionForm({ ...regionForm, carrier_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
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
                  <Label>Region *</Label>
                  <Select value={regionForm.region_id} onValueChange={(value) => setRegionForm({ ...regionForm, region_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
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
                  <Label>Cost ($) *</Label>
                  <Input
                    type="number"
                    value={regionForm.cost}
                    onChange={(e) => setRegionForm({ ...regionForm, cost: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <Button onClick={handleSaveCarrierRegion} className="w-full">
                  Add Region
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={carrierDialogOpen} onOpenChange={setCarrierDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetCarrierForm}>
                <Plus className="h-4 w-4" />
                Add Carrier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCarrier ? "Edit Carrier" : "Add New Carrier"}</DialogTitle>
                <DialogDescription>
                  {editingCarrier ? "Update carrier information" : "Create a new shipping carrier"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Carrier Name *</Label>
                  <Input
                    value={carrierForm.name}
                    onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                    placeholder="Express Delivery"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={carrierForm.description}
                    onChange={(e) => setCarrierForm({ ...carrierForm, description: e.target.value })}
                    placeholder="Fast and reliable delivery service"
                  />
                </div>
                <div>
                  <Label>Carrier Image</Label>
                  <div className="space-y-2">
                    {carrierForm.image_url && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={carrierForm.image_url}
                          alt="Carrier"
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
                      <p className="text-xs text-muted-foreground">Uploading image...</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Estimated Delivery Time</Label>
                  <Input
                    value={carrierForm.estimated_days}
                    onChange={(e) => setCarrierForm({ ...carrierForm, estimated_days: e.target.value })}
                    placeholder="2-3 days"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
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
                  <Label>Active</Label>
                </div>
                <Button onClick={handleSaveCarrier} className="w-full">
                  {editingCarrier ? "Update Carrier" : "Create Carrier"}
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
                <p className="text-sm text-muted-foreground">Total Carriers</p>
                <p className="text-2xl font-bold">{carriers?.length || 0}</p>
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
                <p className="text-sm text-muted-foreground">Active / Inactive</p>
                <p className="text-2xl font-bold">{activeCarriers} / {inactiveCarriers}</p>
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
                <p className="text-sm text-muted-foreground">Available Regions</p>
                <p className="text-2xl font-bold">{totalRegions}</p>
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
            placeholder="Search carriers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Carriers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Carriers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Delivery Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
        </CardContent>
      </Card>

      {/* Carrier Regions */}
      <Card>
        <CardHeader>
          <CardTitle>Carrier Region Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Carrier</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
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
                      ${Number(cr.cost).toLocaleString()}
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
        </CardContent>
      </Card>

      {/* Delete Carrier Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carrier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this carrier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCarrierId && deleteCarrierMutation.mutate(deletingCarrierId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Region Dialog */}
      <AlertDialog open={deleteRegionDialogOpen} onOpenChange={setDeleteRegionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Region Coverage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this region from the carrier?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRegionId && deleteCarrierRegionMutation.mutate(deletingRegionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipping;
