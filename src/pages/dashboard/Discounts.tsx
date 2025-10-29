import { useState, useMemo } from "react";
import { Search, Plus, Edit, Trash2, Tag, TrendingUp, Percent, Users, Copy, Pause, Play, Archive, Download, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountForm, DiscountFormData } from "@/components/DiscountForm";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Discount {
  id: string;
  code: string | null;
  name: string;
  type: string;
  value: number;
  scope: string;
  channels: string[];
  min_cart_subtotal: number;
  first_order_only: boolean;
  logged_in_only: boolean;
  is_stackable: boolean;
  global_usage_limit: number | null;
  per_customer_limit: number | null;
  start_date: string;
  end_date: string | null;
  status: string;
  is_automatic: boolean;
  total_uses: number;
  total_revenue: number;
  marketing_label: string | null;
  internal_notes: string | null;
  created_at: string;
}

const Discounts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [previewDiscount, setPreviewDiscount] = useState<Discount | null>(null);
  const [editingCategories, setEditingCategories] = useState<string[]>([]);
  const [editingProducts, setEditingProducts] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();

  // Fetch discounts
  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Discount[];
    },
  });

  // Create discount mutation
  const createMutation = useMutation({
    mutationFn: async (data: DiscountFormData & { selected_categories?: string[], selected_products?: string[] }) => {
      const { data: result, error } = await supabase
        .from("discounts")
        .insert({
          code: data.is_automatic ? null : data.code,
          name: data.name,
          internal_notes: data.internal_notes,
          marketing_label: data.marketing_label,
          type: data.type,
          value: data.value,
          scope: data.scope,
          channels: ["web"],
          min_cart_subtotal: data.min_cart_subtotal,
          min_quantity: data.min_quantity,
          min_purchase_amount: data.min_purchase_amount,
          first_order_only: data.first_order_only,
          logged_in_only: data.logged_in_only,
          global_usage_limit: data.global_usage_limit,
          per_customer_limit: data.per_customer_limit,
          per_order_max_discount: data.per_order_max_discount,
          is_stackable: data.is_stackable,
          stack_with_shipping: data.stack_with_shipping,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date?.toISOString(),
          is_automatic: data.is_automatic,
          status: data.status,
          tiered_config: data.tiered_config || [],
          bogo_config: data.bogo_buy_qty && data.bogo_get_qty ? {
            buy_quantity: data.bogo_buy_qty,
            get_quantity: data.bogo_get_qty,
            get_price: data.bogo_get_price || 0
          } : null,
          bundle_products: data.bundle_products || null,
          bundle_price: data.bundle_price || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Handle category associations
      if (data.scope === "categories" && data.selected_categories && data.selected_categories.length > 0) {
        const categoryInserts = data.selected_categories.map(categoryId => ({
          discount_id: result.id,
          category_id: categoryId,
        }));
        const { error: catError } = await supabase
          .from("discount_categories")
          .insert(categoryInserts);
        if (catError) throw catError;
      }

      // Handle product associations
      if (data.scope === "products" && data.selected_products && data.selected_products.length > 0) {
        const productInserts = data.selected_products.map(productId => ({
          discount_id: result.id,
          product_id: productId,
        }));
        const { error: prodError } = await supabase
          .from("discount_products")
          .insert(productInserts);
        if (prodError) throw prodError;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount created successfully");
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create discount");
    },
  });

  // Update discount mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DiscountFormData & { selected_categories?: string[], selected_products?: string[] } }) => {
      const { error } = await supabase
        .from("discounts")
        .update({
          code: data.is_automatic ? null : data.code,
          name: data.name,
          internal_notes: data.internal_notes,
          marketing_label: data.marketing_label,
          type: data.type,
          value: data.value,
          scope: data.scope,
          channels: ["web"],
          min_cart_subtotal: data.min_cart_subtotal,
          min_quantity: data.min_quantity,
          min_purchase_amount: data.min_purchase_amount,
          first_order_only: data.first_order_only,
          logged_in_only: data.logged_in_only,
          global_usage_limit: data.global_usage_limit,
          per_customer_limit: data.per_customer_limit,
          per_order_max_discount: data.per_order_max_discount,
          is_stackable: data.is_stackable,
          stack_with_shipping: data.stack_with_shipping,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date?.toISOString(),
          is_automatic: data.is_automatic,
          status: data.status,
          tiered_config: data.tiered_config || [],
          bogo_config: data.bogo_buy_qty && data.bogo_get_qty ? {
            buy_quantity: data.bogo_buy_qty,
            get_quantity: data.bogo_get_qty,
            get_price: data.bogo_get_price || 0
          } : null,
          bundle_products: data.bundle_products || null,
          bundle_price: data.bundle_price || null,
        } as any)
        .eq("id", id);

      if (error) throw error;

      // Delete existing associations
      await supabase.from("discount_categories").delete().eq("discount_id", id);
      await supabase.from("discount_products").delete().eq("discount_id", id);

      // Handle category associations
      if (data.scope === "categories" && data.selected_categories && data.selected_categories.length > 0) {
        const categoryInserts = data.selected_categories.map(categoryId => ({
          discount_id: id,
          category_id: categoryId,
        }));
        const { error: catError } = await supabase
          .from("discount_categories")
          .insert(categoryInserts);
        if (catError) throw catError;
      }

      // Handle product associations
      if (data.scope === "products" && data.selected_products && data.selected_products.length > 0) {
        const productInserts = data.selected_products.map(productId => ({
          discount_id: id,
          product_id: productId,
        }));
        const { error: prodError } = await supabase
          .from("discount_products")
          .insert(productInserts);
        if (prodError) throw prodError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount updated successfully");
      setEditingDiscount(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update discount");
    },
  });

  // Delete discount mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Discount deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete discount");
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: "active" | "scheduled" | "expired" | "paused" | "archived" }) => {
      const { error } = await supabase
        .from("discounts")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast.success("Status updated successfully");
    },
  });

  // Filter discounts
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((discount) => {
      const matchesSearch =
        discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          discount.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || discount.status === statusFilter;
      const matchesType = typeFilter === "all" || discount.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [discounts, searchTerm, statusFilter, typeFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const active = discounts.filter((d) => d.status === "active").length;
    const totalUses = discounts.reduce((sum, d) => sum + d.total_uses, 0);
    const totalRevenue = discounts.reduce((sum, d) => sum + d.total_revenue, 0);
    const avgDiscount =
      discounts.length > 0
        ? discounts
            .filter((d) => d.type === "percentage")
            .reduce((sum, d) => sum + d.value, 0) /
          Math.max(discounts.filter((d) => d.type === "percentage").length, 1)
        : 0;

    return { active, totalUses, totalRevenue, avgDiscount };
  }, [discounts]);

  const handleCreateDiscount = (data: DiscountFormData & { selected_categories?: string[], selected_products?: string[] }) => {
    createMutation.mutate(data);
  };

  const handleUpdateDiscount = (data: DiscountFormData & { selected_categories?: string[], selected_products?: string[] }) => {
    if (editingDiscount) {
      updateMutation.mutate({ id: editingDiscount.id, data });
    }
  };

  const handleEditDiscount = async (discount: Discount) => {
    setEditingDiscount(discount);

    // Load associated categories
    if (discount.scope === "categories") {
      const { data: categories } = await supabase
        .from("discount_categories")
        .select("category_id")
        .eq("discount_id", discount.id);
      setEditingCategories(categories?.map(c => c.category_id) || []);
    } else {
      setEditingCategories([]);
    }

    // Load associated products
    if (discount.scope === "products") {
      const { data: products } = await supabase
        .from("discount_products")
        .select("product_id")
        .eq("discount_id", discount.id);
      setEditingProducts(products?.map(p => p.product_id) || []);
    } else {
      setEditingProducts([]);
    }
  };

  const handleDuplicate = (discount: Discount) => {
    setEditingDiscount({
      ...discount,
      id: "",
      name: `Copy of ${discount.name}`,
      code: discount.code ? `${discount.code}_COPY` : null,
      status: "scheduled",
    });
  };

  const getDiscountValue = (discount: Discount) => {
    if (discount.type === "percentage") return `${discount.value}%`;
    if (discount.type === "fixed_amount") return formatPrice(discount.value);
    if (discount.type === "free_shipping") return "Free";
    if (discount.type === "bogo_x_for_y") return "BOGO";
    if (discount.type === "tiered") return "Tiered";
    if (discount.type === "bundle") return formatPrice(discount.value || 0);
    if (discount.type === "volume") return `${discount.value}%`;
    if (discount.type === "clearance") return `${discount.value}%`;
    if (discount.type === "flash_sale") return `${discount.value}%`;
    return "-";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      scheduled: "secondary",
      expired: "destructive",
      paused: "outline",
      archived: "outline",
    };
    return variants[status] || "default";
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discount Codes</h1>
          <p className="text-muted-foreground">Create and manage discount codes and promotions</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">{kpis.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Uses</p>
                <p className="text-2xl font-bold">{kpis.totalUses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Discount</p>
                <p className="text-2xl font-bold">{kpis.avgDiscount.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Impact</p>
                <p className="text-2xl font-bold">{formatPrice(kpis.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                <SelectItem value="bogo_x_for_y">BOGO</SelectItem>
                <SelectItem value="tiered">Tiered</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                <SelectItem value="clearance">Clearance</SelectItem>
                <SelectItem value="flash_sale">Flash Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Codes ({filteredDiscounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No discounts found. Create your first discount to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code/Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => (
                  <TableRow key={discount.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          {discount.is_automatic ? (
                            <Badge variant="secondary" className="text-xs">AUTO</Badge>
                          ) : (
                            <Tag className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-mono font-bold">
                            {discount.code || discount.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{discount.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{discount.type.replace("_", " ")}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {getDiscountValue(discount)}
                    </TableCell>
                    <TableCell className="capitalize">{discount.scope.replace("_", " ")}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {discount.total_uses}
                          {discount.global_usage_limit && ` / ${discount.global_usage_limit}`}
                        </p>
                        {discount.global_usage_limit && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (discount.total_uses / discount.global_usage_limit) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(discount.status)}>
                        {discount.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(discount.start_date), "MMM dd, yyyy")}</div>
                        {discount.end_date && (
                          <div className="text-muted-foreground">
                            to {format(new Date(discount.end_date), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewDiscount(discount)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {discount.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleStatusMutation.mutate({ id: discount.id, newStatus: "paused" })
                            }
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : discount.status === "paused" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleStatusMutation.mutate({ id: discount.id, newStatus: "active" })
                            }
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDiscount(discount)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(discount)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(discount.id)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Discount</DialogTitle>
          </DialogHeader>
          <DiscountForm
            onSubmit={handleCreateDiscount}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDiscount} onOpenChange={() => setEditingDiscount(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          {editingDiscount && (
            <DiscountForm
              initialData={{
                code: editingDiscount.code || undefined,
                name: editingDiscount.name,
                type: editingDiscount.type as "percentage" | "fixed_amount" | "bogo_x_for_y" | "tiered" | "bundle" | "volume" | "free_shipping" | "clearance" | "flash_sale",
                value: editingDiscount.value,
                scope: editingDiscount.scope as "store_wide" | "categories" | "products" | "flags",
                min_cart_subtotal: editingDiscount.min_cart_subtotal,
                is_automatic: editingDiscount.is_automatic,
                start_date: new Date(editingDiscount.start_date),
                end_date: editingDiscount.end_date ? new Date(editingDiscount.end_date) : undefined,
                status: editingDiscount.status as "active" | "scheduled" | "expired" | "paused" | "archived",
                selected_categories: editingCategories,
                selected_products: editingProducts,
              }}
              onSubmit={handleUpdateDiscount}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDiscount} onOpenChange={() => setPreviewDiscount(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discount Details</DialogTitle>
          </DialogHeader>
          {previewDiscount && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {previewDiscount.is_automatic ? (
                      <Badge variant="secondary">AUTOMATIC</Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono">{previewDiscount.code}</Badge>
                    )}
                    <Badge variant={getStatusBadge(previewDiscount.status)}>
                      {previewDiscount.status}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold">{previewDiscount.name}</h3>
                  {previewDiscount.marketing_label && (
                    <p className="text-muted-foreground mt-1">{previewDiscount.marketing_label}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {getDiscountValue(previewDiscount)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {previewDiscount.type.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Scope</p>
                  <p className="font-medium capitalize">{previewDiscount.scope.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Application</p>
                  <p className="font-medium">{previewDiscount.is_automatic ? "Automatic" : "Coupon Code"}</p>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Uses</p>
                    <p className="text-2xl font-bold">
                      {previewDiscount.total_uses}
                      {previewDiscount.global_usage_limit && ` / ${previewDiscount.global_usage_limit}`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Revenue Impact</p>
                    <p className="text-2xl font-bold">{formatPrice(previewDiscount.total_revenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Per Customer</p>
                    <p className="text-2xl font-bold">
                      {previewDiscount.per_customer_limit || "Unlimited"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Rules */}
              <div>
                <h4 className="font-semibold mb-3">Eligibility Rules</h4>
                <div className="space-y-2">
                  {previewDiscount.min_cart_subtotal > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Min. Cart</Badge>
                      <span>{formatPrice(previewDiscount.min_cart_subtotal)}</span>
                    </div>
                  )}
                  {previewDiscount.first_order_only && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">First Order Only</Badge>
                    </div>
                  )}
                  {previewDiscount.logged_in_only && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Logged-in Users Only</Badge>
                    </div>
                  )}
                  {previewDiscount.is_stackable && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Stackable</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h4 className="font-semibold mb-3">Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(previewDiscount.start_date), "PPP")}</p>
                  </div>
                  {previewDiscount.end_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(new Date(previewDiscount.end_date), "PPP")}</p>
                    </div>
                  )}
                </div>
              </div>

              {previewDiscount.internal_notes && (
                <div>
                  <h4 className="font-semibold mb-2">Internal Notes</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {previewDiscount.internal_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discounts;
