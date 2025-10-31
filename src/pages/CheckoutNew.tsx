import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as LucideIcons from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const shippingAddressSchema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  postalCode: z.string().min(4, "Postal code is required"),
});

type ShippingFormData = z.infer<typeof shippingAddressSchema>;

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

export default function CheckoutNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart, loading: cartLoading } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingAddressSchema),
  });

  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  useEffect(() => {
    if (!user) {
      toast.error("Please log in to checkout");
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  const shippingCost = 5000;
  const total = cartTotal + shippingCost;

  const onSubmit = async (data: ShippingFormData) => {
    if (!user || !profile) {
      toast.error("User information not found");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);

    try {
      // Create order with items
      const { data: orderData, error: orderError } = await supabase.rpc(
        "create_order_with_items",
        {
          p_user_id: user.id,
          p_total_amount: total,
          p_shipping_address: `${data.address}, ${data.city}, ${data.postalCode}`,
          p_customer_name: profile.full_name || user.email,
          p_customer_email: profile.email || user.email,
          p_customer_phone: profile.phone || "",
          p_items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.offer_price || item.product.price,
          })),
        }
      );

      if (orderError) throw orderError;

      const orderId = orderData;

      // Get selected payment method name
      const paymentMethod = paymentMethods?.find((pm) => pm.id === selectedPaymentMethod);

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: orderId,
        amount: total,
        payment_method: paymentMethod?.name || "Unknown",
        status: "pending",
        customer_name: profile.full_name || user.email,
      });

      if (paymentError) throw paymentError;

      // Clear cart
      await clearCart();

      toast.success("Order placed successfully!");

      // Navigate based on payment method
      if (paymentMethod?.name.toLowerCase().includes("cash")) {
        navigate(`/order-tracking?orderId=${orderId}`);
      } else {
        navigate(`/payment?orderId=${orderId}&amount=${total}`);
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  if (cartLoading || profileLoading || paymentMethodsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add items to your cart before checking out
            </p>
            <Button asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const IconComponent = (iconName: string | null) => {
    if (!iconName) return <CreditCard className="h-5 w-5" />;
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          to="/cart"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information - Auto-filled, non-editable */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={profile?.email || user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      From your account (cannot be changed here)
                    </p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={profile?.phone || "Not provided"}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      From your account (cannot be changed here)
                    </p>
                  </div>
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={profile?.full_name || user.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      From your account (cannot be changed here)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="Street address, building number"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" {...register("city")} placeholder="City" />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input id="postalCode" {...register("postalCode")} placeholder="12345" />
                      {errors.postalCode && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                {paymentMethods && paymentMethods.length > 0 ? (
                  <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label
                          htmlFor={method.id}
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                        >
                          {IconComponent(method.icon)}
                          <div>
                            <div className="font-medium">{method.name}</div>
                            {method.description && (
                              <div className="text-sm text-muted-foreground">
                                {method.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <p className="text-muted-foreground">No payment methods available</p>
                )}
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Processing..." : `Place Order - ${formatPrice(total)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((item.product.offer_price || item.product.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{formatPrice(shippingCost)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}