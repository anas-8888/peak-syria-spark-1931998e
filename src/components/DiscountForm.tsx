import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

const discountSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  internal_notes: z.string().optional(),
  marketing_label: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount", "bogo_x_for_y", "tiered", "bundle", "volume", "free_shipping", "clearance", "flash_sale"]),
  value: z.preprocess(
    (val) => val === '' || val === null || val === undefined || Number.isNaN(val) ? 0 : Number(val),
    z.number().min(0)
  ),
  scope: z.enum(["store_wide", "categories", "products", "flags"]),
  min_cart_subtotal: z.number().min(0).default(0),
  min_quantity: z.number().min(0).default(0),
  first_order_only: z.boolean().default(false),
  global_usage_limit: z.preprocess(
    (val) => val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  per_customer_limit: z.preprocess(
    (val) => val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : Number(val),
    z.number().int().positive().optional()
  ),
  per_order_max_discount: z.preprocess(
    (val) => val === '' || val === null || val === undefined || Number.isNaN(val) ? undefined : Number(val),
    z.number().positive().optional()
  ),
  is_stackable: z.boolean().default(false),
  stack_with_shipping: z.boolean().default(true),
  start_date: z.date().optional(),
  end_date: z.date().optional().nullable(),
  is_automatic: z.boolean().default(false),
  status: z.enum(["active", "scheduled", "expired", "paused", "archived"]).default("scheduled"),
  selected_categories: z.array(z.string()).optional(),
  selected_products: z.array(z.string()).optional(),
  selectedFlag: z.string().optional(),
  // Type-specific fields
  min_purchase_amount: z.number().optional(),
  bogo_buy_qty: z.number().optional(),
  bogo_get_qty: z.number().optional(),
  bogo_get_discount_percentage: z.number().min(0).max(100).optional(),
  tiered_config: z.array(z.object({
    min_amount: z.number(),
    discount_percent: z.number()
  })).optional(),
  bundle_products: z.array(z.string()).optional(),
  bundle_price: z.number().optional(),
}).refine((data) => {
  if (!data.is_automatic && (!data.code || data.code.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Discount code is required when not automatic",
  path: ["code"],
});

export type DiscountFormData = z.infer<typeof discountSchema>;

// Calculate total price of selected bundle products
const calculateBundleTotalPrice = (productsList: any[], bundleProductIds: string[]) => {
  if (!bundleProductIds.length || !productsList) return 0;
  return productsList
    .filter(p => bundleProductIds.includes(p.id))
    .reduce((sum, p) => sum + Number(p.price || 0), 0);
};

interface DiscountFormProps {
  initialData?: Partial<DiscountFormData>;
  onSubmit: (data: DiscountFormData & { selected_categories?: string[], selected_products?: string[] }) => void;
  isLoading?: boolean;
}

export function DiscountForm({ initialData, onSubmit, isLoading }: DiscountFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.selected_categories || []);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initialData?.selected_products || []);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedFlag, setSelectedFlag] = useState<string>(initialData?.selectedFlag || "");
  const [tiers, setTiers] = useState<Array<{min_amount: number, discount_percent: number}>>(
    (initialData?.tiered_config || []).map(t => ({
      min_amount: t.min_amount || 0,
      discount_percent: t.discount_percent || 0
    }))
  );
  const [bundleProducts, setBundleProducts] = useState<string[]>(initialData?.bundle_products || []);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setSelectedCategories(initialData.selected_categories || []);
      setSelectedProducts(initialData.selected_products || []);
      setSelectedFlag(initialData.selectedFlag || "");
      setTiers((initialData.tiered_config || []).map(t => ({
        min_amount: t.min_amount || 0,
        discount_percent: t.discount_percent || 0
      })));
      setBundleProducts(initialData.bundle_products || []);
    }
  }, [initialData]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, price")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  
  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      internal_notes: initialData?.internal_notes || "",
      marketing_label: initialData?.marketing_label || "",
      type: initialData?.type || "percentage",
      value: initialData?.value || 0,
      scope: initialData?.scope || "store_wide",
      min_cart_subtotal: initialData?.min_cart_subtotal || 0,
      min_quantity: initialData?.min_quantity || 0,
      first_order_only: initialData?.first_order_only || false,
      is_stackable: initialData?.is_stackable || false,
      stack_with_shipping: initialData?.stack_with_shipping || true,
      start_date: initialData?.start_date || new Date(),
      is_automatic: initialData?.is_automatic || false,
      status: initialData?.status || "scheduled",
    },
  });

  const discountType = form.watch("type");
  const isAutomatic = form.watch("is_automatic");
  const scope = form.watch("scope");

  const handleCategoryToggle = (categoryId: string) => {
    const updated = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(updated);
  };

  const handleProductToggle = (productId: string) => {
    const updated = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    setSelectedProducts(updated);
  };

  const handleFormSubmit = (data: DiscountFormData) => {
    onSubmit({
      ...data,
      selected_categories: scope === "categories" ? selectedCategories : undefined,
      selected_products: scope === "products" ? selectedProducts : undefined,
      selectedFlag: scope === "flags" ? selectedFlag : undefined,
      tiered_config: discountType === "tiered" ? tiers : undefined,
      bundle_products: discountType === "bundle" ? bundleProducts : undefined,
    });
  };

  // Filter categories and products by search
  const filteredCategories = categories.filter((cat: any) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredProducts = products.filter((prod: any) =>
    prod.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Discount Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Summer Sale 2025"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Discount Code {!isAutomatic && "*"}</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="SUMMER25"
                disabled={isAutomatic}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketing_label">Marketing Label</Label>
            <Input
              id="marketing_label"
              {...form.register("marketing_label")}
              placeholder="SALE 20% OFF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              {...form.register("internal_notes")}
              placeholder="Private notes for team..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                  <SelectItem value="bogo_x_for_y">BOGO / X-for-Y</SelectItem>
                  <SelectItem value="tiered">Tiered Discount</SelectItem>
                  <SelectItem value="bundle">Bundle Price</SelectItem>
                  <SelectItem value="volume">Volume Discount</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  <SelectItem value="clearance">Clearance</SelectItem>
                  <SelectItem value="flash_sale">Flash Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic value field based on discount type */}
            {discountType === "percentage" && (
              <div className="space-y-2">
                <Label htmlFor="value">Percentage %</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...form.register("value", { valueAsNumber: true })}
                  placeholder="20"
                />
              </div>
            )}
            
            {discountType === "fixed_amount" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="value">Discount Amount</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    {...form.register("value", { valueAsNumber: true })}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_purchase_amount">Minimum Purchase Amount</Label>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    step="0.01"
                    {...form.register("min_purchase_amount", { valueAsNumber: true })}
                    placeholder="50000"
                  />
                  <p className="text-xs text-muted-foreground">Customer must buy equal or above this amount</p>
                </div>
              </>
            )}
            
            {discountType === "bogo_x_for_y" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bogo_buy_qty">Buy Quantity</Label>
                  <Input
                    id="bogo_buy_qty"
                    type="number"
                    {...form.register("bogo_buy_qty", { valueAsNumber: true })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bogo_get_qty">Get Quantity</Label>
                  <Input
                    id="bogo_get_qty"
                    type="number"
                    {...form.register("bogo_get_qty", { valueAsNumber: true })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bogo_get_discount_percentage">Discount % for 2nd Item</Label>
                  <Input
                    id="bogo_get_discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...form.register("bogo_get_discount_percentage", { valueAsNumber: true })}
                    placeholder="50"
                  />
                  <p className="text-xs text-muted-foreground">Discount percentage on the 2nd item</p>
                </div>
              </>
            )}
            
            {discountType === "volume" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Minimum Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    {...form.register("min_quantity", { valueAsNumber: true })}
                    placeholder="3"
                  />
                  <p className="text-xs text-muted-foreground">Number of units to buy</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Discount %</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    {...form.register("value", { valueAsNumber: true })}
                    placeholder="15"
                  />
                </div>
              </>
            )}
            
            {discountType === "bundle" && bundleProducts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bundle_price">Bundle Price</Label>
                <Input
                  id="bundle_price"
                  type="number"
                  step="0.01"
                  max={calculateBundleTotalPrice(products, bundleProducts)}
                  {...form.register("bundle_price", {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const value = parseFloat(e.target.value);
                      const maxPrice = calculateBundleTotalPrice(products, bundleProducts);
                      if (value > maxPrice) {
                        form.setValue("bundle_price", maxPrice);
                      }
                    }
                  })}
                  placeholder="90000"
                />
                <p className="text-xs text-muted-foreground">
                  Total price: ${calculateBundleTotalPrice(products, bundleProducts).toLocaleString()} (Max allowed)
                </p>
              </div>
            )}
            
            {(discountType === "clearance" || discountType === "flash_sale") && (
              <div className="space-y-2">
                <Label htmlFor="value">Discount %</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...form.register("value", { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            )}
            
            {discountType === "free_shipping" && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="min_cart_subtotal">Minimum Order Amount</Label>
                <Input
                  id="min_cart_subtotal"
                  type="number"
                  step="0.01"
                  {...form.register("min_cart_subtotal", { valueAsNumber: true })}
                  placeholder="75000"
                />
                <p className="text-xs text-muted-foreground">Free shipping for orders above this amount</p>
              </div>
            )}

            {discountType !== "bundle" && (
              <div className="space-y-2">
                <Label htmlFor="scope">Applies To</Label>
                <Select
                  value={form.watch("scope")}
                  onValueChange={(value) => form.setValue("scope", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_wide">Entire Store</SelectItem>
                    <SelectItem value="categories">Specific Categories</SelectItem>
                    <SelectItem value="products">Specific Products</SelectItem>
                    <SelectItem value="flags">Product Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Category Selection */}
          {scope === "categories" && (
            <div className="space-y-2">
              <Label>Select Categories</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories found</p>
                ) : (
                  filteredCategories.map((category: any) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
                </p>
              )}
            </div>
          )}

          {/* Product Selection */}
          {scope === "products" && (
            <div className="space-y-2">
              <Label>Select Products</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products found</p>
                ) : (
                  filteredProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {product.name}
                        <span className="text-muted-foreground ml-2">({product.category})</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {selectedProducts.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedProducts.length} {selectedProducts.length === 1 ? "product" : "products"} selected
                </p>
              )}
            </div>
          )}

          {/* Flag Selection */}
          {scope === "flags" && (
            <div className="space-y-2">
              <Label>Select Product Flag</Label>
              <Select
                value={selectedFlag}
                onValueChange={(value) => setSelectedFlag(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New Arrival">New Arrival</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Best Seller">Best Seller</SelectItem>
                  <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This discount will apply to all products with the selected flag
              </p>
            </div>
          )}

          {/* Tiered Discount Configuration */}
          {discountType === "tiered" && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-base">Discount Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTiers([...tiers, { min_amount: 0, discount_percent: 0 }])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tier
                </Button>
              </div>
              {tiers.map((tier, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Min Amount (e.g., 100000)"
                      value={tier.min_amount || ''}
                      onChange={(e) => {
                        const newTiers = [...tiers];
                        newTiers[index].min_amount = Number(e.target.value);
                        setTiers(newTiers);
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Discount % (e.g., 10)"
                      value={tier.discount_percent || ''}
                      onChange={(e) => {
                        const newTiers = [...tiers];
                        newTiers[index].discount_percent = Number(e.target.value);
                        setTiers(newTiers);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTiers(tiers.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {tiers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click "Add Tier" to create discount tiers
                </p>
              )}
            </div>
          )}

          {/* Bundle Product Selection */}
          {discountType === "bundle" && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <Label className="text-base">Bundle Products</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products for bundle..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products found</p>
                ) : (
                  filteredProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bundle-${product.id}`}
                        checked={bundleProducts.includes(product.id)}
                        onCheckedChange={() => {
                          const updated = bundleProducts.includes(product.id)
                            ? bundleProducts.filter(id => id !== product.id)
                            : [...bundleProducts, product.id];
                          setBundleProducts(updated);
                        }}
                      />
                      <Label
                        htmlFor={`bundle-${product.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {product.name} - ${Number(product.price || 0).toLocaleString()}
                        <span className="text-muted-foreground ml-2">({product.category})</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {bundleProducts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {bundleProducts.map(id => {
                      const product = products.find((p: any) => p.id === id);
                      return product ? (
                        <Badge key={id} variant="secondary">
                          {product.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <div className="p-2 bg-muted rounded text-sm font-semibold">
                    Total Price: ${calculateBundleTotalPrice(products, bundleProducts).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_automatic"
              checked={form.watch("is_automatic")}
              onCheckedChange={(checked) => form.setValue("is_automatic", checked)}
            />
            <Label htmlFor="is_automatic">Automatic (apply when rules match)</Label>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          {/* Only show min cart/quantity for relevant discount types */}
          {!["free_shipping", "tiered"].includes(discountType) && (
            <div className="grid grid-cols-2 gap-4">
              {!["bogo_x_for_y", "volume", "bundle"].includes(discountType) && (
                <div className="space-y-2">
                  <Label htmlFor="min_cart_subtotal">Min. Cart Subtotal ($)</Label>
                  <Input
                    id="min_cart_subtotal"
                    type="number"
                    step="0.01"
                    {...form.register("min_cart_subtotal", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              )}

              {!["volume", "bogo_x_for_y"].includes(discountType) && (
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Min. Quantity</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    {...form.register("min_quantity", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="first_order_only"
                checked={form.watch("first_order_only")}
                onCheckedChange={(checked) => form.setValue("first_order_only", checked)}
              />
              <Label htmlFor="first_order_only">First Order Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_stackable"
                checked={form.watch("is_stackable")}
                onCheckedChange={(checked) => form.setValue("is_stackable", checked)}
              />
              <Label htmlFor="is_stackable">Stackable with Other Discounts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="stack_with_shipping"
                checked={form.watch("stack_with_shipping")}
                onCheckedChange={(checked) => form.setValue("stack_with_shipping", checked)}
              />
              <Label htmlFor="stack_with_shipping">Stack with Shipping Discounts</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="global_usage_limit">Global Usage Limit</Label>
            <Input
              id="global_usage_limit"
              type="number"
              {...form.register("global_usage_limit", { valueAsNumber: true })}
              placeholder="Unlimited"
            />
            <p className="text-xs text-muted-foreground">
              Total times this discount can be used across all customers
            </p>
          </div>

          {!form.watch("first_order_only") && (
            <div className="space-y-2">
              <Label htmlFor="per_customer_limit">Per Customer Limit</Label>
              <Input
                id="per_customer_limit"
                type="number"
                {...form.register("per_customer_limit", { valueAsNumber: true })}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Max times a single customer can use this discount
              </p>
            </div>
          )}

          {discountType !== "bundle" && (
            <div className="space-y-2">
              <Label htmlFor="per_order_max_discount">
                {discountType === "free_shipping" ? "Max Shipping Discount" : "Max Discount per Order ($)"}
              </Label>
              <Input
                id="per_order_max_discount"
                type="number"
                step="0.01"
                {...form.register("per_order_max_discount", { valueAsNumber: true })}
                placeholder="No limit"
              />
              <p className="text-xs text-muted-foreground">
                {discountType === "free_shipping" ? "Cap the maximum shipping discount" : "Cap the maximum discount amount per order"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {form.watch("status") !== "active" && (
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("start_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("start_date") ? (
                        format(form.watch("start_date"), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.watch("start_date")}
                      onSelect={(date) => date && form.setValue("start_date", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("end_date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("end_date") ? (
                      format(form.watch("end_date"), "PPP")
                    ) : (
                      <span>No end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("end_date")}
                    onSelect={(date) => form.setValue("end_date", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Discount" : "Create Discount"}
        </Button>
      </div>
    </form>
  );
}
