import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Package, CheckCircle, Truck, XCircle, Clock, Home, Settings, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { OrderCancellationDialog } from "@/components/OrderCancellationDialog";
import { useLanguage } from "@/contexts/LanguageContext";

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
  pending_at: string | null;
  processing_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  cancel_date: string | null;
  cancel_status: string | null;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    selected_color: string | null;
    selected_size: string | null;
    products: {
      name: string;
      image_url: string;
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
  pending: Clock,
  processing: Settings,
  cancelled: XCircle,
};

const statusColors = {
  delivered: "bg-green-500",
  shipped: "bg-blue-500",
  pending: "bg-yellow-500",
  processing: "bg-blue-400",
  cancelled: "bg-red-500",
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

const OrderTracking = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdFromUrl || "");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Fetch user's orders
  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch selected order details with auto-refresh
  const { data: orderDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["order-details", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const { data, error } = await supabase
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
          pending_at,
          processing_at,
          shipped_at,
          delivered_at,
          cancelled_at,
          cancel_reason,
          cancel_date,
          cancel_status,
          order_items (
            id,
            quantity,
            price,
            selected_color,
            selected_size,
            products (
              name,
              image_url,
              product_images (
                image_url,
                is_primary,
                display_order
              )
            )
          ),
          discount_usages (
            id,
            discount_amount,
            discounts (
              name,
              code,
              type
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
        .eq("id", selectedOrderId)
        .maybeSingle();

      if (error) throw error;
      return data as OrderWithDetails | null;
    },
    enabled: !!selectedOrderId,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  // Fetch order review
  const { data: orderReview } = useQuery({
    queryKey: ["order-review", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId || !user) return null;
      const { data, error } = await supabase
        .from("order_reviews")
        .select("*")
        .eq("order_id", selectedOrderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrderId && !!user,
  });

  // Mutation to confirm receipt
  const confirmReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ 
          customer_confirmed_receipt: true,
          receipt_confirmed_at: new Date().toISOString()
        })
        .eq("id", orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-details"] });
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["latest-order"] });
      toast.success(t("Thank you for confirming receipt!"), {
        description: t("We hope you enjoy your purchase!"),
      });
    },
    onError: () => {
      toast.error(t("Failed to confirm receipt"), {
        description: t("Please try again later."),
      });
    },
  });

  // Mutation to submit review
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedOrderId) throw new Error("Missing user or order");
      if (reviewRating === 0) throw new Error("Please select a rating");
      if (!reviewComment.trim()) throw new Error("Please write a comment");

      const { error } = await supabase
        .from("order_reviews")
        .insert({
          order_id: selectedOrderId,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-review"] });
      setReviewRating(0);
      setReviewComment("");
      toast.success(t("Thank you for your review!"), {
        description: t("Your feedback helps us improve."),
      });
    },
    onError: (error: any) => {
      toast.error(t("Failed to submit review"), {
        description: error.message || t("Please try again later."),
      });
    },
  });

  // Update selected order when URL changes or when user's first order loads
  useEffect(() => {
    if (orderIdFromUrl) {
      setSelectedOrderId(orderIdFromUrl);
    } else if (userOrders && userOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(userOrders[0].id);
    }
  }, [orderIdFromUrl, userOrders, selectedOrderId]);

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSearchParams({ orderId });
  };

  const getOrderTimeline = (order: OrderWithDetails) => {
    const stages = [
      { 
        status: "pending", 
        label: t("Order Placed"), 
        icon: Package,
        date: order.pending_at || order.created_at
      },
      { 
        status: "processing", 
        label: t("Order Confirmed"), 
        icon: CheckCircle,
        date: order.processing_at
      },
      { 
        status: "shipped", 
        label: t("Shipped"), 
        icon: Truck,
        date: order.shipped_at
      },
      { 
        status: "delivered", 
        label: t("Delivered"), 
        icon: Home,
        date: order.delivered_at
      },
    ];

    const statusOrder = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const currentIndex = statusOrder.indexOf(order.status);

    return stages.map((stage, index) => {
      let completed = false;
      if (order.status === "cancelled") {
        completed = index === 0; // Only first stage completed for cancelled
      } else {
        completed = statusOrder.indexOf(stage.status) <= currentIndex;
      }

      return {
        ...stage,
        completed,
      };
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">{t("Track Your Order")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("Please log in to view your order history and track your orders.")}
              </p>
              <Link to="/login">
                <Button>{t("Log In")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back to Home")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("Track Your Order")}</h1>

        {/* Order Selection */}
        {userOrders && userOrders.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("Select Order")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("Choose an order")} />
                  </SelectTrigger>
                  <SelectContent>
                    {userOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.id.slice(0, 8)} - {format(new Date(order.created_at), "MMM dd, yyyy")} - {formatPrice(order.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Order Status Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t("Order Status")}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("Order ID")}: #{orderDetails.id.slice(0, 8)}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariants[orderDetails.status as keyof typeof statusVariants] as any}
                        className="gap-2"
                      >
                        {React.createElement(statusIcons[orderDetails.status as keyof typeof statusIcons], {
                          className: "h-4 w-4",
                        })}
                        {statusLabels[orderDetails.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Timeline */}
                    <div className="space-y-6">
                      {getOrderTimeline(orderDetails).map((stage, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`rounded-full p-3 transition-colors ${
                                stage.completed
                                  ? statusColors[orderDetails.status as keyof typeof statusColors]
                                  : "bg-muted"
                              } text-white`}
                            >
                              <stage.icon className="h-5 w-5" />
                            </div>
                            {index < 3 && (
                              <div
                                className={`w-0.5 h-12 transition-colors ${
                                  stage.completed ? statusColors[orderDetails.status as keyof typeof statusColors] : "bg-muted"
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <h3
                              className={`font-semibold ${
                                stage.completed ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {stage.label}
                            </h3>
                            {stage.date && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(stage.date), "MMM dd, yyyy 'at' HH:mm")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {orderDetails.status === "delivered" && !orderDetails.customer_confirmed_receipt && (
                      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm font-medium mb-3">
                          Have you received your order?
                        </p>
                        <Button
                          onClick={() => confirmReceiptMutation.mutate(orderDetails.id)}
                          disabled={confirmReceiptMutation.isPending}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {confirmReceiptMutation.isPending ? "Confirming..." : "Confirm Receipt"}
                        </Button>
                      </div>
                    )}

                    {orderDetails.customer_confirmed_receipt && (
                      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            You confirmed receipt on{" "}
                            {format(new Date(orderDetails.receipt_confirmed_at!), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Review Section */}
                    {orderDetails.customer_confirmed_receipt && (
                      <div className="mt-6">
                        {orderReview ? (
                          <div className="p-4 bg-muted/50 border rounded-lg">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              Your Review
                            </h4>
                            <div className="flex gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= orderReview.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{orderReview.comment}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(orderReview.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        ) : (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Rate Your Order</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Your Rating</label>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setReviewRating(star)}
                                      onMouseEnter={() => setHoveredRating(star)}
                                      onMouseLeave={() => setHoveredRating(0)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`h-8 w-8 ${
                                          star <= (hoveredRating || reviewRating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
                                  Your Review
                                </label>
                                <Textarea
                                  id="review-comment"
                                  placeholder="Tell us about your experience with this order..."
                                  rows={4}
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                />
                              </div>
                              <Button
                                onClick={() => submitReviewMutation.mutate()}
                                disabled={submitReviewMutation.isPending}
                                className="w-full"
                              >
                                {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {orderDetails.status === "pending" && !orderDetails.cancel_status && (
                      <div className="mt-6">
                        <Button
                          variant="destructive"
                          onClick={() => setCancelDialogOpen(true)}
                          className="w-full sm:w-auto"
                        >
                          Cancel Order
                        </Button>
                      </div>
                    )}

                    {orderDetails.cancel_status === "pending" && (
                      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm font-medium">
                          Cancellation request pending admin approval
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {orderDetails.cancel_reason}
                        </p>
                      </div>
                    )}

                    {orderDetails.status === "cancelled" && (
                      <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive font-medium">
                          This order has been cancelled. Please contact support if you have any questions.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{orderDetails.shipping_address}</p>
                    </div>
                    {orderDetails.regions && (
                      <div>
                        <p className="text-sm text-muted-foreground">Region</p>
                        <p className="font-medium">{orderDetails.regions.name}</p>
                      </div>
                    )}
                    {orderDetails.shipping_carriers && (
                      <div>
                        <p className="text-sm text-muted-foreground">Shipping Carrier</p>
                        <div className="flex items-center gap-2">
                          {orderDetails.shipping_carriers.image_url && (
                            <img
                              src={orderDetails.shipping_carriers.image_url}
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                          )}
                          <p className="font-medium">{orderDetails.shipping_carriers.name}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">{orderDetails.customer_phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orderDetails.order_items.map((item) => {
                        const productImages = (item as any).products?.product_images ?? [];
                        const primary = productImages.find((img: any) => img.is_primary);
                        const derivedImage = item.products?.image_url || primary?.image_url || productImages[0]?.image_url || "/placeholder.svg";
                        return (
                          <div key={item.id} className="flex items-center gap-4">
                            <img
                              src={derivedImage}
                              alt={item.products.name}
                              className="h-20 w-20 object-cover rounded-lg bg-muted"
                              loading="lazy"
                              width={80}
                              height={80}
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.src.endsWith("/placeholder.svg")) {
                                  target.src = "/placeholder.svg";
                                }
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.products.name}</h4>
                              {(item.selected_color || item.selected_size) && (
                                <p className="text-sm text-muted-foreground">
                                  {item.selected_color && <span>Color: {item.selected_color}</span>}
                                  {item.selected_color && item.selected_size && <span> • </span>}
                                  {item.selected_size && <span>Size: {item.selected_size}</span>}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.price)} each
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-6" />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(orderDetails.total_amount - orderDetails.shipping_cost + ((orderDetails as any).discount_usages?.reduce((sum: number, du: any) => sum + Number(du.discount_amount), 0) || 0))}</span>
                      </div>
                      {(orderDetails as any).discount_usages && (orderDetails as any).discount_usages.length > 0 && (
                        <div className="space-y-1">
                          {(orderDetails as any).discount_usages.map((usage: any) => (
                            <div key={usage.id} className="flex justify-between text-sm text-green-600">
                              <span>
                                Discount: {usage.discounts.name}
                                {usage.discounts.code && ` (${usage.discounts.code})`}
                                {usage.discounts.type === 'free_shipping' && ' - Free Shipping'}
                              </span>
                              <span className="font-medium">-{formatPrice(usage.discount_amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatPrice(orderDetails.shipping_cost)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(orderDetails.total_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{orderDetails.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{orderDetails.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{orderDetails.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {format(new Date(orderDetails.created_at), "MMMM dd, yyyy 'at' HH:mm")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Order not found</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Link to="/">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />

      {/* Cancellation Dialog */}
      {orderDetails && (
        <OrderCancellationDialog
          orderId={orderDetails.id}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["order-details"] });
            queryClient.invalidateQueries({ queryKey: ["user-orders"] });
          }}
        />
      )}
    </div>
  );
};

export default OrderTracking;
