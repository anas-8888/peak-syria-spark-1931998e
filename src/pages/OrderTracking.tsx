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
import { ArrowLeft, Package, CheckCircle, Truck, XCircle, Clock, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
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
  cancelled: XCircle,
};

const statusColors = {
  delivered: "bg-green-500",
  shipped: "bg-blue-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
};

const statusVariants = {
  delivered: "default",
  shipped: "secondary",
  pending: "secondary",
  cancelled: "destructive",
};

const statusLabels = {
  delivered: "Delivered",
  shipped: "In Transit",
  pending: "Processing",
  cancelled: "Cancelled",
};

const OrderTracking = () => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get("orderId");
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderIdFromUrl || "");

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
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_url
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

  const getOrderTimeline = (status: string, createdAt: string) => {
    const stages = [
      { status: "pending", label: "Order Placed", icon: Package },
      { status: "pending", label: "Order Confirmed", icon: CheckCircle },
      { status: "shipped", label: "Shipped", icon: Truck },
      { status: "delivered", label: "Delivered", icon: Home },
    ];

    const statusOrder = ["pending", "shipped", "delivered", "cancelled"];
    const currentIndex = statusOrder.indexOf(status);

    return stages.map((stage, index) => {
      let completed = false;
      if (status === "cancelled") {
        completed = index === 0; // Only first stage completed for cancelled
      } else {
        completed = statusOrder.indexOf(stage.status) <= currentIndex;
      }

      return {
        ...stage,
        completed,
        date: index === 0 ? format(new Date(createdAt), "MMM dd, yyyy") : null,
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
              <h2 className="text-2xl font-bold mb-2">Track Your Order</h2>
              <p className="text-muted-foreground mb-4">
                Please log in to view your order history and track your orders.
              </p>
              <Link to="/login">
                <Button>Log In</Button>
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
          Back to Home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Track Your Order</h1>

        {/* Order Selection */}
        {userOrders && userOrders.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Order</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
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
                        <CardTitle>Order Status</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Order ID: #{orderDetails.id.slice(0, 8)}
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
                      {getOrderTimeline(orderDetails.status, orderDetails.created_at).map((stage, index) => (
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
                              <p className="text-sm text-muted-foreground">{stage.date}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

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
                      {orderDetails.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-20 w-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.products.name}</h4>
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
                      ))}
                    </div>

                    <Separator className="my-6" />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(orderDetails.total_amount - orderDetails.shipping_cost)}</span>
                      </div>
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
    </div>
  );
};

export default OrderTracking;
