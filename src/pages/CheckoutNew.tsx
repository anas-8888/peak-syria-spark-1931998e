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
  const [appliedDiscounts, setAppliedDiscounts] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [autoDiscountsDisabled, setAutoDiscountsDisabled] = useState(false);

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

  // Restore saved region when regions data and profile are loaded
  useEffect(() => {
    if (regions && regions.length > 0 && !selectedRegion && profile) {
      // Priority 1: Check localStorage for previously selected region
      const savedData = localStorage.getItem("checkoutFormData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.selectedRegion) {
            // Verify the saved region still exists in the database
            const regionExists = regions.find(r => r.id === parsed.selectedRegion);
            if (regionExists) {
              setSelectedRegion(parsed.selectedRegion);
              setValue("regionId", parsed.selectedRegion);
              return;
            }
          }
        } catch (e) {
          console.error("Error restoring saved region:", e);
        }
      }

      // Priority 2: Use profile's region_id if available
      if (profile.region_id) {
        const profileRegion = regions.find(r => r.id === profile.region_id);
        if (profileRegion) {
          setSelectedRegion(profile.region_id);
          setValue("regionId", profile.region_id);
        }
      }
    }
  }, [regions, selectedRegion, profile, setValue]);

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
        
        // Set form values with profile data (will be overridden by saved checkout data if exists)
        if (data) {
          setValue("email", data.email || user.email || "");
          setValue("phone", data.phone || "");
          setValue("fullName", data.full_name || "");
        }
        
        // Load saved checkout data after profile loads
        const savedData = localStorage.getItem("checkoutFormData");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            
            // Region will be restored by the regions effect above when regions data loads
            
            // Restore carrier
            if (parsed.selectedCarrier) {
              setSelectedCarrier(parsed.selectedCarrier);
            }
            
            // Restore payment method
            if (parsed.selectedPaymentMethod) {
              setSelectedPaymentMethod(parsed.selectedPaymentMethod);
            }
            
            // Restore discount code
            if (parsed.discountCode) {
              setDiscountCode(parsed.discountCode);
              if (cartItems.length > 0) {
                validateDiscount(parsed.discountCode, true).then((result) => {
                  if (result.is_valid) {
                    toast.success("Previously applied discount restored");
                  }
                });
              }
            }
            
            // Restore address (takes priority over profile address)
            if (parsed.address) {
              setValue("address", parsed.address);
            } else if (data.address) {
              // Fall back to profile address if no saved address
              setValue("address", data.address);
            }
          } catch (e) {
            console.error("Error loading saved checkout data:", e);
          }
        } else if (data.address) {
          // No saved checkout data, use profile address
          setValue("address", data.address);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate, setValue, regions]);

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

  const checkAutoDiscounts = async () => {
    try {
      // Check if auto discounts are disabled
      const disabled = localStorage.getItem("autoDiscountsDisabled");
      if (disabled === "true") {
        setAutoDiscountsDisabled(true);
        return;
      }

      // First check if there are multiple discounts from cart
      const savedCartDiscounts = localStorage.getItem("appliedCartDiscounts");
      const savedCartDiscountAmount = localStorage.getItem("appliedCartDiscountAmount");
      
      if (savedCartDiscounts && savedCartDiscountAmount) {
        try {
          const cartDiscounts = JSON.parse(savedCartDiscounts);
          const amount = parseFloat(savedCartDiscountAmount);
          setAppliedDiscounts(cartDiscounts);
          setDiscountAmount(amount);
          return;
        } catch (e) {
          console.error("Error parsing saved cart discounts:", e);
        }
      }
      
      // Check for single discount from cart
      const savedCartDiscount = localStorage.getItem("appliedCartDiscount");
      if (savedCartDiscount) {
        try {
          const cartDiscount = JSON.parse(savedCartDiscount);
          setAppliedDiscount(cartDiscount);
          setDiscountAmount(cartDiscount.amount);
          setAutoDiscountsDisabled(true);
          return;
        } catch (e) {
          console.error("Error parsing saved cart discount:", e);
        }
      }

      const { data, error } = await supabase
        .from("discounts")
        .select("*, discount_products(product_id), discount_categories(category_id)")
        .eq("is_automatic", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;

      if (!data || data.length === 0) return;

      // Calculate discount amount for each applicable discount
      const applicableDiscounts: any[] = [];

      for (const autoDiscount of data) {
        // Check if cart meets minimum requirements
        if (cartTotal < (autoDiscount.min_cart_subtotal || 0)) continue;

        // Check minimum quantity
        if (autoDiscount.min_quantity && autoDiscount.min_quantity > 0) {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          if (totalQuantity < autoDiscount.min_quantity) continue;
        }

        // Check scope restrictions
        let matchingItems = cartItems;
        if (autoDiscount.scope === "products") {
          const discountProductIds = (autoDiscount.discount_products as any[])?.map(dp => dp.product_id) || [];
          matchingItems = cartItems.filter(item => discountProductIds.includes(item.product_id));
          if (matchingItems.length === 0) continue;
        } else if (autoDiscount.scope === "categories") {
          continue;
        }

        // Calculate discount value with quantity limits
        if (!autoDiscount.code) {
          let discountValue = 0;
          const perCustomerLimit = autoDiscount.per_customer_limit || 999999;
          
          if (autoDiscount.type === "percentage") {
            let totalQuantityProcessed = 0;
            
            for (const item of matchingItems) {
              const quantityToApply = Math.min(
                item.quantity,
                perCustomerLimit - totalQuantityProcessed
              );
              
              if (quantityToApply <= 0) break;
              
              const itemPrice = item.product.offer_price || item.product.price;
              discountValue += (itemPrice * quantityToApply) * (autoDiscount.value / 100);
              totalQuantityProcessed += quantityToApply;
              
              if (totalQuantityProcessed >= perCustomerLimit) break;
            }
          } else if (autoDiscount.type === "fixed_amount") {
            discountValue = autoDiscount.value;
          }

          if (discountValue > 0) {
            applicableDiscounts.push({
              ...autoDiscount,
              calculatedAmount: discountValue,
            });
          }
        }
      }

      if (applicableDiscounts.length === 0) return;

      // Separate stackable and non-stackable discounts
      const stackable = applicableDiscounts.filter(d => d.is_stackable);
      const nonStackable = applicableDiscounts.filter(d => !d.is_stackable);

      let finalDiscounts: any[] = [];
      let totalDiscount = 0;

      // Compare best combinations
      const stackableTotal = stackable.reduce((sum, d) => sum + d.calculatedAmount, 0);
      const bestNonStackable = nonStackable.length > 0 
        ? nonStackable.reduce((best, current) => 
            current.calculatedAmount > best.calculatedAmount ? current : best
          )
        : null;

      // Choose the better option
      if (stackableTotal >= (bestNonStackable?.calculatedAmount || 0) && stackable.length > 0) {
        finalDiscounts = stackable;
        totalDiscount = stackableTotal;
      } else if (bestNonStackable) {
        finalDiscounts = [bestNonStackable];
        totalDiscount = bestNonStackable.calculatedAmount;
      }

      if (finalDiscounts.length > 0 && totalDiscount > 0) {
        const discountsToApply = finalDiscounts.map(d => ({
          id: d.id,
          code: null,
          amount: d.calculatedAmount,
          message: d.marketing_label || d.name,
          is_stackable: d.is_stackable,
          stack_with_shipping: d.stack_with_shipping,
        }));

        setAppliedDiscounts(discountsToApply);
        setDiscountAmount(totalDiscount);
      }
    } catch (error) {
      console.error("Error checking auto discounts:", error);
    }
  };

  // Check for auto-apply discounts when cart loads or when returning to checkout
  useEffect(() => {
    if (cartItems.length > 0 && !appliedDiscount && appliedDiscounts.length === 0) {
      checkAutoDiscounts();
    }
  }, [cartItems, appliedDiscount, appliedDiscounts]);

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
      if (value.address !== undefined) {
        const savedData = localStorage.getItem("checkoutFormData");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            parsed.address = value.address || "";
            localStorage.setItem("checkoutFormData", JSON.stringify(parsed));
          } catch (e) {
            console.error("Error updating saved address:", e);
          }
        } else {
          // Create initial save with address
          const formData = {
            selectedRegion,
            selectedCarrier,
            selectedPaymentMethod,
            discountCode: appliedDiscount?.code || "",
            address: value.address || "",
          };
          localStorage.setItem("checkoutFormData", JSON.stringify(formData));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedRegion, selectedCarrier, selectedPaymentMethod, appliedDiscount]);

  // Load saved form data is now handled in the profile fetch effect above
  // This empty effect is kept for clarity
  useEffect(() => {
    // Saved data loading moved to profile fetch to ensure correct order
  }, []);

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
    const result = await validateDiscount(discountCode.trim());
    setValidatingDiscount(false);
    
    if (result?.is_valid) {
      // Clear auto discounts and disable them
      setAppliedDiscounts([]);
      setAutoDiscountsDisabled(true);
      localStorage.setItem("autoDiscountsDisabled", "true");
      localStorage.removeItem("appliedCartDiscounts");
      localStorage.removeItem("appliedCartDiscountAmount");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setDiscountCode("");
    setAutoDiscountsDisabled(false);
    localStorage.removeItem("autoDiscountsDisabled");
    localStorage.removeItem("appliedCartDiscount");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    toast.success("Discount removed");
  };

  const handleRemoveAutoDiscounts = () => {
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setAutoDiscountsDisabled(true);
    localStorage.setItem("autoDiscountsDisabled", "true");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    toast.success("Automatic discounts removed. You can now apply a discount code.");
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
      // Check stock availability for all items
      for (const item of cartItems) {
        const { data: product, error: stockError } = await supabase
          .from("products")
          .select("stock_quantity, name")
          .eq("id", item.product_id)
          .single();

        if (stockError) throw stockError;

        if (product.stock_quantity < item.quantity) {
          toast.error(
            `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
          );
          setSubmitting(false);
          return;
        }
      }

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
          p_discount_amount: appliedDiscount.amount,
          p_order_subtotal: cartTotal,
        });
      }
      
      // Record multiple discount usages if applied
      if (appliedDiscounts.length > 0) {
        for (const discount of appliedDiscounts) {
          await supabase.rpc("record_discount_usage", {
            p_discount_id: discount.id,
            p_order_id: orderId,
            p_user_id: user.id,
            p_discount_amount: discount.amount,
            p_order_subtotal: cartTotal,
          });
        }
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

      // Clear saved checkout form data and discounts
      localStorage.removeItem("checkoutFormData");
      localStorage.removeItem("appliedCartDiscount");
      localStorage.removeItem("appliedCartDiscounts");
      localStorage.removeItem("appliedCartDiscountAmount");

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
              {!appliedDiscount && appliedDiscounts.length === 0 ? (
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
                <div className="mb-4 space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    {appliedDiscount && (
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
                    )}
                    {appliedDiscounts.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                          {appliedDiscounts.length > 1 ? "Multiple Discounts Applied" : "Automatic Discount Applied"}
                        </p>
                        {appliedDiscounts.map((discount, idx) => (
                          <p key={idx} className="text-xs text-green-600 dark:text-green-400">
                            • {discount.message}
                          </p>
                        ))}
                        <p className="text-sm font-bold text-green-700 dark:text-green-300 mt-2">
                          Total Savings: {formatPrice(discountAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={appliedDiscount ? handleRemoveDiscount : handleRemoveAutoDiscounts}
                    className="w-full"
                  >
                    Remove {appliedDiscount ? "Discount Code" : "Auto Discount"}
                  </Button>
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
