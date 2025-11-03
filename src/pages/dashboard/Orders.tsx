import { useState } from "react";
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Edit, Settings } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

type OrderWithDetails = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  created_at: string;
  customer_confirmed_receipt: boolean;
  receipt_confirmed_at: string | null;
  cancel_reason: string | null;
  cancel_status: string | null;
  cancelled_at: string | null;
  itemCount: number;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    notes: string | null;
    selected_color: string | null;
    selected_size: string | null;
    variant_id: string | null;
    product_id: string;
    products: {
      name: string;
      image_url: string;
    };
  }>;
  discount_usages: Array<{
    id: string;
    discount_amount: number;
    discounts: {
      name: string;
      code: string | null;
    };
  }>;
  regions: {
    name: string;
  } | null;
  shipping_carriers: {
    name: string;
    image_url: string;
  } | null;
};

const statusIcons = {
  delivered: CheckCircle,
  shipped: Truck,
  pending: Package,
  processing: Settings,
  cancelled: XCircle,
};

const statusVariants = {
  delivered: "default",
  shipped: "secondary",
  pending: "secondary",
  processing: "secondary",
  cancelled: "destructive",
};

const statusLabels = {
  delivered: "Delivered",
  shipped: "In Transit",
  pending: "Pending",
  processing: "Processing",
  cancelled: "Cancelled",
};

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          total_amount,
          shipping_cost,
          status,
          created_at,
          customer_confirmed_receipt,
          receipt_confirmed_at,
          cancel_reason,
          cancel_status,
          cancelled_at,
          order_items (
            id,
            quantity,
            price,
            notes,
            selected_color,
            selected_size,
            variant_id,
            product_id,
            products (
              name,
              image_url
            )
          ),
          discount_usages (
            id,
            discount_amount,
            discounts (
              name,
              code
            )
          ),
          regions (
            name
          ),
          shipping_carriers (
            name,
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch color-specific images for each order item
      const ordersWithImages = await Promise.all(
        orders.map(async (order) => {
          const itemsWithImages = await Promise.all(
            (order.order_items || []).map(async (item: any) => {
              let imageUrl = item.products.image_url;

              // 1) If item has a variant, get color from variant
              if (item.variant_id) {
                const { data: variant } = await supabase
                  .from("product_variants")
                  .select("color_id")
                  .eq("id", item.variant_id)
                  .maybeSingle();

                if (variant?.color_id) {
                  const { data: productColor } = await supabase
                    .from("product_colors")
                    .select("image_id")
                    .eq("product_id", item.product_id)
                    .eq("color_id", variant.color_id)
                    .maybeSingle();

                  if (productColor?.image_id) {
                    const { data: colorImage } = await supabase
                      .from("product_images")
                      .select("image_url")
                      .eq("id", productColor.image_id)
                      .maybeSingle();
                    if (colorImage?.image_url) {
                      imageUrl = colorImage.image_url;
                    }
                  }
                }
              }

              // 2) If still no image, try selected_color by name
              if ((!imageUrl || imageUrl === item.products.image_url) && item.selected_color) {
                const { data: colorData } = await supabase
                  .from("colors")
                  .select("id")
                  .eq("name", item.selected_color)
                  .maybeSingle();

                if (colorData?.id) {
                  const { data: productColor } = await supabase
                    .from("product_colors")
                    .select("image_id")
                    .eq("product_id", item.product_id)
                    .eq("color_id", colorData.id)
                    .maybeSingle();

                  if (productColor?.image_id) {
                    const { data: colorImage } = await supabase
                      .from("product_images")
                      .select("image_url")
                      .eq("id", productColor.image_id)
                      .maybeSingle();
                    if (colorImage?.image_url) {
                      imageUrl = colorImage.image_url;
                    }
                  }
                }
              }

              // 3) Fallback to primary image
              if (!imageUrl) {
                const { data: primaryImage } = await supabase
                  .from("product_images")
                  .select("image_url")
                  .eq("product_id", item.product_id)
                  .eq("is_primary", true)
                  .maybeSingle();
                if (primaryImage?.image_url) {
                  imageUrl = primaryImage.image_url;
                }
              }

              return {
                ...item,
                products: {
                  ...item.products,
                  image_url: imageUrl
                }
              };
            })
          );

          return {
            ...order,
            order_items: itemsWithImages,
            itemCount: order.order_items?.length || 0,
          };
        })
      );

      return ordersWithImages as OrderWithDetails[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated successfully");
      setStatusDialogOpen(false);
      setDetailsDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to update order status");
    },
  });

  const orders = ordersData || [];

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOrders = orders.length;
  const inTransitOrders = orders.filter((o) => o.status === "shipped").length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">View and track all orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : inTransitOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : completedOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : cancelledOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-semibold">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.itemCount} items</TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[order.status as keyof typeof statusVariants] as any} className="gap-2">
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), "yyyy/MM/dd")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setStatusDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{selectedOrder.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right max-w-xs">{selectedOrder.shipping_address}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold mb-3">Shipping Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="font-medium">{selectedOrder.regions?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="font-medium flex items-center gap-2">
                      {selectedOrder.shipping_carriers?.image_url && (
                        <img 
                          src={selectedOrder.shipping_carriers.image_url} 
                          alt="" 
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      {selectedOrder.shipping_carriers?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping Cost:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.shipping_cost)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <img
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products.name}
                        className="h-16 w-16 object-cover rounded bg-muted"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        {(item.selected_color || item.selected_size) && (
                          <p className="text-sm text-muted-foreground">
                            {item.selected_color && <span>Color: {item.selected_color}</span>}
                            {item.selected_color && item.selected_size && <span> • </span>}
                            {item.selected_size && <span>Size: {item.selected_size}</span>}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatPrice(item.price)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="font-semibold">
                        {formatPrice(item.quantity * item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatPrice(selectedOrder.total_amount - selectedOrder.shipping_cost + (selectedOrder.discount_usages?.reduce((sum, du) => sum + Number(du.discount_amount), 0) || 0))}
                    </span>
                  </div>
                  {selectedOrder.discount_usages && selectedOrder.discount_usages.length > 0 && (
                    <div className="space-y-1">
                      {selectedOrder.discount_usages.map((usage) => (
                        <div key={usage.id} className="flex justify-between text-green-600">
                          <span>
                            Discount: {usage.discounts.name}
                            {usage.discounts.code && ` (${usage.discounts.code})`}
                          </span>
                          <span className="font-medium">-{formatPrice(usage.discount_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">{formatPrice(selectedOrder.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold mb-3">Order Status</h3>
                <Badge variant={statusVariants[selectedOrder.status as keyof typeof statusVariants] as any} className="gap-2">
                  {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                </Badge>
                
                {/* Cancellation Information */}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancel_reason && (
                  <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-destructive mb-1">Order Cancelled</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Reason: </span>
                          {selectedOrder.cancel_reason}
                        </p>
                        {selectedOrder.cancel_status && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Status: </span>
                            {selectedOrder.cancel_status === 'approved' ? 'Cancellation Approved' : 
                             selectedOrder.cancel_status === 'rejected' ? 'Cancellation Rejected' : 
                             'Pending Approval'}
                          </p>
                        )}
                        {selectedOrder.cancelled_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Cancelled on {format(new Date(selectedOrder.cancelled_at), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Receipt Confirmation */}
                {selectedOrder.status === 'delivered' && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm">
                      {selectedOrder.customer_confirmed_receipt ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            Customer confirmed receipt
                          </span>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Waiting for customer to confirm receipt
                          </span>
                        </>
                      )}
                    </div>
                    {selectedOrder.receipt_confirmed_at && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Confirmed on {format(new Date(selectedOrder.receipt_confirmed_at), "MMM dd, yyyy 'at' HH:mm")}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Quick Status Actions */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'processing' })}
                          disabled={updateStatusMutation.isPending}
                          className="gap-2"
                        >
                          <Package className="h-4 w-4" />
                          Confirm Order
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'cancelled' })}
                          disabled={updateStatusMutation.isPending}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Order
                        </Button>
                      </>
                    )}
                    {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'shipped' })}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2 col-span-2"
                      >
                        <Truck className="h-4 w-4" />
                        Mark as Shipped
                      </Button>
                    )}
                    {selectedOrder.status === 'shipped' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, status: 'delivered' })}
                        disabled={updateStatusMutation.isPending}
                        className="gap-2 col-span-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Delivered
                      </Button>
                    )}
                    {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                      <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                        Order is {selectedOrder.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status of order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Processing</SelectItem>
                  <SelectItem value="shipped">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                if (selectedOrder) {
                  updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
