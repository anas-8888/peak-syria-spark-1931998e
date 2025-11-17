import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Search, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type OrderItem = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes: string | null;
  selected_color: string | null;
  selected_size: string | null;
  variant_id: string | null;
  max_stock?: number;
  products: {
    name: string;
    image_url: string;
  };
};

type OrderWithDetails = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  shipping_region_id: string | null;
  shipping_carrier_id: string | null;
  order_items: OrderItem[];
};

interface OrderEditDialogProps {
  order: OrderWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderEditDialog({ order, open, onOpenChange }: OrderEditDialogProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [status, setStatus] = useState("");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [carrierId, setCarrierId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  // Fetch regions
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch carriers
  const { data: carriers } = useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_carriers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Search products with images
  const { data: searchProducts } = useQuery({
    queryKey: ["products-search", productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, 
          name, 
          price, 
          image_url,
          product_images!inner(image_url, is_primary)
        `)
        .ilike("name", `%${productSearch}%`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;
      
      // Get primary image or first image for each product
      return data.map(product => {
        const images = product.product_images as any[];
        const primaryImage = images.find(img => img.is_primary);
        return {
          ...product,
          image_url: primaryImage?.image_url || images[0]?.image_url || product.image_url
        };
      });
    },
    enabled: showProductSearch && productSearch.length >= 2,
  });

  // Fetch colors and sizes for a product
  const fetchProductVariants = async (productId: string) => {
    const { data: colors } = await supabase
      .from("product_colors")
      .select(`
        color_id,
        colors(id, name, hex_code)
      `)
      .eq("product_id", productId);

    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, size, color_id, price, stock_quantity")
      .eq("product_id", productId)
      .eq("is_active", true);

    return { colors, variants };
  };

  // Initialize form with order data
  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name);
      setCustomerEmail(order.customer_email);
      setCustomerPhone(order.customer_phone);
      setShippingAddress(order.shipping_address);
      setShippingCost(order.shipping_cost || 0);
      setStatus(order.status);
      setRegionId(order.shipping_region_id);
      setCarrierId(order.shipping_carrier_id);
      setItems(order.order_items || []);
    }
  }, [order]);

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;

      // Validate stock for all items
      const errors: Record<string, string> = {};
      for (const item of items) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", item.variant_id)
            .single();
          
          if (variant && item.quantity > variant.stock_quantity) {
            errors[item.id] = `Only ${variant.stock_quantity} available`;
          }
        } else {
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();
          
          if (product && item.quantity > (product.stock_quantity || 0)) {
            errors[item.id] = `Only ${product.stock_quantity || 0} available`;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setStockErrors(errors);
        throw new Error("Insufficient stock for some items");
      }

      // Calculate new total
      const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = itemsTotal + shippingCost;

      // Update order details
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: shippingAddress,
          shipping_cost: shippingCost,
          status,
          shipping_region_id: regionId,
          shipping_carrier_id: carrierId,
          total_amount: totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Delete removed items
      const currentItemIds = items.map(i => i.id).filter(id => id.startsWith('order-'));
      const originalItemIds = order.order_items.map(i => i.id);
      const itemsToDelete = originalItemIds.filter(id => !currentItemIds.includes(id));

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("order_items")
          .delete()
          .in("id", itemsToDelete);
        if (deleteError) throw deleteError;
      }

      // Update or insert items
      for (const item of items) {
        if (item.id.startsWith('order-')) {
          // Update existing item
          const { error: itemError } = await supabase
            .from("order_items")
            .update({
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
              selected_color: item.selected_color,
              selected_size: item.selected_size,
            })
            .eq("id", item.id);
          if (itemError) throw itemError;
        } else {
          // Insert new item
          const { error: itemError } = await supabase
            .from("order_items")
            .insert({
              order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes,
              selected_color: item.selected_color,
              selected_size: item.selected_size,
              variant_id: item.variant_id,
            });
          if (itemError) throw itemError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setStockErrors({});
      toast.success(t("Order updated successfully"));
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Update order error:", error);
      if (error.message === "Insufficient stock for some items") {
        toast.error(t("Some items have insufficient stock"));
      } else {
        toast.error(t("Failed to update order"));
      }
    },
  });

  const handleAddProduct = async (product: any) => {
    // Fetch product image if not available
    let imageUrl = product.image_url;
    if (!imageUrl) {
      const { data: imageData } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", product.id)
        .eq("is_primary", true)
        .maybeSingle();
      imageUrl = imageData?.image_url || "/placeholder.svg";
    }

    const newItem: OrderItem = {
      id: `new-${Date.now()}`,
      product_id: product.id,
      quantity: 1,
      price: product.price,
      notes: null,
      selected_color: null,
      selected_size: null,
      variant_id: null,
      products: {
        name: product.name,
        image_url: imageUrl,
      },
    };
    setItems([...items, newItem]);
    setShowProductSearch(false);
    setProductSearch("");
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleUpdateItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Validate stock
    let maxStock = 0;
    if (item.variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variant_id)
        .single();
      maxStock = variant?.stock_quantity || 0;
    } else {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      maxStock = product?.stock_quantity || 0;
    }

    if (quantity > maxStock) {
      setStockErrors({ ...stockErrors, [itemId]: `Only ${maxStock} available` });
      return;
    } else {
      const newErrors = { ...stockErrors };
      delete newErrors[itemId];
      setStockErrors(newErrors);
    }

    setItems(items.map(i => 
      i.id === itemId ? { ...i, quantity, max_stock: maxStock } : i
    ));
  };

  const handleUpdateItemPrice = (itemId: string, price: number) => {
    if (price < 0) return;
    setItems(items.map(item => 
      item.id === itemId ? { ...item, price } : item
    ));
  };

  const handleUpdateItemColor = async (itemId: string, colorName: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Get color by name
    const { data: colorData } = await supabase
      .from("colors")
      .select("id")
      .eq("name", colorName)
      .single();

    if (!colorData) return;

    // Find variant with this color and current size (or any size if no size selected)
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, price, stock_quantity, size")
      .eq("product_id", item.product_id)
      .eq("color_id", colorData.id)
      .eq("is_active", true)
      .maybeSingle();

    if (variant) {
      setItems(items.map(i => 
        i.id === itemId 
          ? { 
              ...i, 
              selected_color: colorName,
              variant_id: variant.id,
              price: variant.price,
              selected_size: variant.size,
              max_stock: variant.stock_quantity 
            } 
          : i
      ));
    } else {
      setItems(items.map(i => 
        i.id === itemId ? { ...i, selected_color: colorName, variant_id: null } : i
      ));
    }
  };

  const handleUpdateItemSize = async (itemId: string, size: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Get color ID if color is selected
    let colorId = null;
    if (item.selected_color) {
      const { data: colorData } = await supabase
        .from("colors")
        .select("id")
        .eq("name", item.selected_color)
        .single();
      colorId = colorData?.id;
    }

    // Find variant with this size and current color (if any)
    let query = supabase
      .from("product_variants")
      .select("id, price, stock_quantity")
      .eq("product_id", item.product_id)
      .eq("size", size)
      .eq("is_active", true);

    if (colorId) {
      query = query.eq("color_id", colorId);
    }

    const { data: variant } = await query.maybeSingle();

    if (variant) {
      setItems(items.map(i => 
        i.id === itemId 
          ? { 
              ...i, 
              selected_size: size,
              variant_id: variant.id,
              price: variant.price,
              max_stock: variant.stock_quantity 
            } 
          : i
      ));
    } else {
      setItems(items.map(i => 
        i.id === itemId ? { ...i, selected_size: size, variant_id: null } : i
      ));
    }
  };

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = itemsTotal + shippingCost;

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Edit Order")} #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t("Customer Details")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("Name")}</Label>
                <Input 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Email")}</Label>
                <Input 
                  type="email"
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Phone")}</Label>
                <Input 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("Status")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("Pending")}</SelectItem>
                    <SelectItem value="processing">{t("Processing")}</SelectItem>
                    <SelectItem value="shipped">{t("Shipped")}</SelectItem>
                    <SelectItem value="delivered">{t("Delivered")}</SelectItem>
                    <SelectItem value="cancelled">{t("Cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("Shipping Address")}</Label>
              <Textarea 
                value={shippingAddress} 
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Shipping Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{t("Shipping Details")}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("Region")}</Label>
                <Select value={regionId || ""} onValueChange={setRegionId}>
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
              <div className="space-y-2">
                <Label>{t("Carrier")}</Label>
                <Select value={carrierId || ""} onValueChange={setCarrierId}>
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
              <div className="space-y-2">
                <Label>{t("Shipping Cost")}</Label>
                <Input 
                  type="number"
                  value={shippingCost} 
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">{t("Order Items")}</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProductSearch(!showProductSearch)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("Add Product")}
              </Button>
            </div>

            {showProductSearch && (
              <Card className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("Search products...")}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchProducts && searchProducts.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <img 
                          src={product.image_url || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={item.products.image_url || "/placeholder.svg"} 
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.products.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Color and Size Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Color")}</Label>
                          <Input
                            value={item.selected_color || ""}
                            onChange={(e) => handleUpdateItemColor(item.id, e.target.value)}
                            placeholder={t("Enter color")}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Size")}</Label>
                          <Input
                            value={item.selected_size || ""}
                            onChange={(e) => handleUpdateItemSize(item.id, e.target.value)}
                            placeholder={t("Enter size")}
                          />
                        </div>
                      </div>

                      {stockErrors[item.id] && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{stockErrors[item.id]}</AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Quantity")}</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(item.id, Number(e.target.value))}
                            min="1"
                            max={item.max_stock}
                          />
                          {item.max_stock && (
                            <p className="text-xs text-muted-foreground">
                              {t("Available")}: {item.max_stock}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Price")}</Label>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateItemPrice(item.id, Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("Subtotal")}</Label>
                          <p className="text-sm font-medium pt-2">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("Items Total")}:</span>
              <span className="font-medium">{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t("Shipping")}:</span>
              <span className="font-medium">{formatPrice(shippingCost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>{t("Total")}:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button 
              onClick={() => updateOrderMutation.mutate()}
              disabled={updateOrderMutation.isPending}
            >
              {updateOrderMutation.isPending ? t("Saving...") : t("Save Changes")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
