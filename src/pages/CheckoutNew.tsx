import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutSchema, type CheckoutFormData } from "@/lib/validationSchemas";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as LucideIcons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
}

interface Region {
  id: string;
  name: string;
  country: string | null;
  is_active: boolean;
}

interface ShippingCarrier {
  id: string;
  name: string;
  description: string | null;
  estimated_days: string | null;
  is_active: boolean;
  image_url: string | null;
}

interface CarrierRegion {
  carrier_id: string;
  region_id: string;
  cost: number;
}

export default function CheckoutNew() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartTotal, clearCart, loading: cartLoading } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [useGPS, setUseGPS] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [autoDiscountChecked, setAutoDiscountChecked] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
    },
  });

  // Fetch regions
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ["regions-active"],
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

  // Fetch shipping carriers
  const { data: carriers, isLoading: carriersLoading } = useQuery({
    queryKey: ["shipping-carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_carriers")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as ShippingCarrier[];
    },
  });

  // Fetch carrier-region mappings
  const { data: carrierRegions, isLoading: carrierRegionsLoading } = useQuery({
    queryKey: ["shipping-carrier-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_carrier_regions")
        .select("*");
      if (error) throw error;
      return data as CarrierRegion[];
    },
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }

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
        
        // Set form values with profile data
        if (data) {
          setValue("email", data.email || user.email || "");
          setValue("phone", data.phone || "");
          setValue("fullName", data.full_name || "");
          
          // Auto-fill address if available
          if (data.address) {
            setValue("address", data.address);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate, setValue]);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods]);

  // Update shipping cost when region and carrier change
  useEffect(() => {
    if (selectedRegion && selectedCarrier && carrierRegions) {
      const mapping = carrierRegions.find(
        (cr) => cr.carrier_id === selectedCarrier && cr.region_id === selectedRegion
      );
      if (mapping) {
        setShippingCost(Number(mapping.cost));
      } else {
        // Clear carrier selection if not available in new region
        setSelectedCarrier(null);
        setShippingCost(0);
      }
    }
  }, [selectedRegion, selectedCarrier, carrierRegions]);

  // Filter available carriers based on selected region
  const availableCarriers = carriers?.filter((carrier) => {
    if (!selectedRegion) return false;
    return carrierRegions?.some(
      (cr) => cr.carrier_id === carrier.id && cr.region_id === selectedRegion
    );
  });

  // Auto-select carrier if only one available
  useEffect(() => {
    if (availableCarriers && availableCarriers.length === 1 && !selectedCarrier) {
      const singleCarrier = availableCarriers[0];
      setSelectedCarrier(singleCarrier.id);
      setValue("carrierId", singleCarrier.id);
    }
  }, [availableCarriers, selectedCarrier, setValue]);

  const handleGetLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get location details
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            
            if (data.address) {
              setValue("address", data.display_name || "");
              
              // Try to match with a region
              const matchedRegion = regions?.find((r) => 
                r.name.toLowerCase().includes(data.address.city?.toLowerCase() || "") ||
                r.name.toLowerCase().includes(data.address.state?.toLowerCase() || "")
              );
              
              if (matchedRegion) {
                setSelectedRegion(matchedRegion.id);
                setValue("regionId", matchedRegion.id);
              }
              
              toast.success("Location detected successfully!");
            }
          } catch (error) {
            console.error("Error getting location details:", error);
            toast.error("Could not get location details");
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not access your location");
          setLoadingLocation(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setLoadingLocation(false);
    }
  };

  // Check for auto-apply discounts when cart loads
  useEffect(() => {
    if (cartItems.length > 0 && !autoDiscountChecked) {
      checkAutoDiscounts();
      setAutoDiscountChecked(true);
    }
  }, [cartItems]);

  // Save form data to localStorage whenever key selections change
  useEffect(() => {
    const formData = {
      selectedRegion,
      selectedCarrier,
      selectedPaymentMethod,
      discountCode: appliedDiscount?.code || "",
    };
    localStorage.setItem("checkoutFormData", JSON.stringify(formData));
  }, [selectedRegion, selectedCarrier, selectedPaymentMethod, appliedDiscount]);

  // Save address field separately when it changes
  useEffect(() => {
    const subscription = watch((value) => {
      const savedData = localStorage.getItem("checkoutFormData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          parsed.address = value.address || "";
          localStorage.setItem("checkoutFormData", JSON.stringify(parsed));
        } catch (e) {
          console.error("Error updating saved address:", e);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load saved form data
  useEffect(() => {
    const savedData = localStorage.getItem("checkoutFormData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.selectedRegion) {
          setSelectedRegion(parsed.selectedRegion);
          setValue("regionId", parsed.selectedRegion);
        }
        if (parsed.selectedCarrier) setSelectedCarrier(parsed.selectedCarrier);
        if (parsed.selectedPaymentMethod) setSelectedPaymentMethod(parsed.selectedPaymentMethod);
        if (parsed.discountCode) {
          setDiscountCode(parsed.discountCode);
          // Auto-validate saved discount code
          if (cartItems.length > 0) {
            validateDiscount(parsed.discountCode, true).then((result) => {
              if (result.is_valid) {
                toast.success("Previously applied discount restored");
              }
            });
          }
        }
        if (parsed.address) {
          setValue("address", parsed.address);
        }
      } catch (e) {
        console.error("Error loading saved form data:", e);
      }
    }
  }, [setValue]);

  const checkAutoDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_automatic", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;

      if (data && data.length > 0) {
        // Validate the first auto discount
        const autoDiscount = data[0];
        const result = await validateDiscount(autoDiscount.code, true);
        if (result.is_valid) {
          toast.success(`Automatic discount "${autoDiscount.name}" applied!`);
        }
      }
    } catch (error) {
      console.error("Error checking auto discounts:", error);
    }
  };

  const validateDiscount = async (code: string, silent = false) => {
    try {
      const { data, error } = await supabase.rpc("validate_discount_code", {
        p_code: code,
        p_user_id: user?.id || null,
        p_cart_subtotal: cartTotal,
        p_cart_items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.is_valid) {
          setAppliedDiscount({
            id: result.discount_id,
            code: code,
            amount: result.discount_amount,
            message: result.message,
          });
          setDiscountAmount(Number(result.discount_amount));
          return result;
        } else {
          if (!silent) {
            toast.error(result.message || "Invalid discount code");
          }
          return result;
        }
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || "Error validating discount");
      }
      return { is_valid: false };
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    setValidatingDiscount(true);
    await validateDiscount(discountCode.trim());
    setValidatingDiscount(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountCode("");
    toast.success("Discount removed");
  };

  const total = cartTotal + shippingCost - discountAmount;

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user || !profile) {
      toast.error("User information not found");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!selectedRegion) {
      toast.error("Please select a region");
      return;
    }

    if (!selectedCarrier) {
      toast.error("Please select a shipping method");
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
          p_shipping_address: data.address,
          p_customer_name: profile?.full_name || user.email,
          p_customer_email: profile?.email || user.email,
          p_customer_phone: profile?.phone || "",
          p_shipping_carrier_id: selectedCarrier || "",
          p_shipping_region_id: data.regionId,
          p_shipping_cost: shippingCost,
          p_discount_id: appliedDiscount?.id || null,
          p_discount_amount: discountAmount,
          p_items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.offer_price || item.product.price,
          })),
        }
      );

      if (orderError) throw orderError;

      const orderId = orderData;

      // Update order with shipping info
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          shipping_carrier_id: selectedCarrier,
          shipping_region_id: selectedRegion,
          shipping_cost: shippingCost,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Record discount usage if applied
      if (appliedDiscount) {
        await supabase.rpc("record_discount_usage", {
          p_discount_id: appliedDiscount.id,
          p_order_id: orderId,
          p_user_id: user.id,
          p_discount_amount: discountAmount,
          p_order_subtotal: cartTotal,
        });
      }

      // Get selected payment method name
      const paymentMethod = paymentMethods?.find((pm) => pm.id === selectedPaymentMethod);

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: orderId,
        amount: total,
        payment_method: paymentMethod?.name || "Unknown",
        status: "pending",
        customer_name: profile?.full_name || user.email,
      });

      if (paymentError) throw paymentError;

      // Clear cart
      await clearCart();

      // Clear saved checkout form data
      localStorage.removeItem("checkoutFormData");

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

  if (authLoading || !user) {
    return null;
  }

  if (cartLoading || profileLoading || paymentMethodsLoading || regionsLoading || carriersLoading || carrierRegionsLoading) {
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
              {/* Contact Information */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.email || user.email}
                    </div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.phone || "Not provided"}
                    </div>
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.full_name || "Not provided"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To update your contact information, please visit your profile page.
                  </p>
                </div>
              </Card>

              {/* Region Selection */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Delivery Region</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={loadingLocation}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {loadingLocation ? "Getting Location..." : "Use GPS"}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="regionId">Select Region *</Label>
                  <Select
                    value={selectedRegion}
                    onValueChange={(value) => {
                      setSelectedRegion(value);
                      setValue("regionId", value);
                      setSelectedCarrier("");
                      setValue("carrierId", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions?.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name} {region.country && `- ${region.country}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.regionId && (
                    <p className="text-sm text-destructive mt-1">{errors.regionId.message}</p>
                  )}
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                <div>
                  <Label htmlFor="address">Detailed Address *</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="Street, building number, floor, etc."
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                  )}
                </div>
              </Card>

              {/* Shipping Method */}
              {selectedRegion && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
                  {availableCarriers && availableCarriers.length > 0 ? (
                    <RadioGroup
                      value={selectedCarrier}
                      onValueChange={(value) => {
                        setSelectedCarrier(value);
                        setValue("carrierId", value);
                      }}
                    >
                      {availableCarriers.map((carrier) => {
                        const mapping = carrierRegions?.find(
                          (cr) => cr.carrier_id === carrier.id && cr.region_id === selectedRegion
                        );
                        return (
                          <div
                            key={carrier.id}
                            className="flex items-center space-x-3 p-4 border rounded-lg"
                          >
                            <RadioGroupItem value={carrier.id} id={carrier.id} />
                            <Label
                              htmlFor={carrier.id}
                              className="flex items-center justify-between flex-1 cursor-pointer gap-3"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {carrier.image_url && (
                                  <img
                                    src={carrier.image_url}
                                    alt={carrier.name}
                                    className="w-12 h-12 object-contain rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{carrier.name}</div>
                                  {carrier.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {carrier.description}
                                    </div>
                                  )}
                                  {carrier.estimated_days && (
                                    <div className="text-sm text-muted-foreground">
                                      Delivery: {carrier.estimated_days}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-semibold">
                                {formatPrice(Number(mapping?.cost || 0))}
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <p className="text-muted-foreground">
                      No shipping methods available for this region
                    </p>
                  )}
                  {errors.carrierId && (
                    <p className="text-sm text-destructive mt-2">{errors.carrierId.message}</p>
                  )}
                </Card>
              )}

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

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !selectedCarrier}>
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
                  <span className="font-medium">
                    {shippingCost > 0 ? formatPrice(shippingCost) : "Select shipping method"}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Discount Code Section */}
              {!appliedDiscount ? (
                <div className="mb-4">
                  <Label htmlFor="discount">Discount Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="discount"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyDiscount();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount}
                    >
                      {validatingDiscount ? "..." : "Apply"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {appliedDiscount.message}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Code: {appliedDiscount.code}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      className="text-green-800 hover:text-green-900 dark:text-green-200"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

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
