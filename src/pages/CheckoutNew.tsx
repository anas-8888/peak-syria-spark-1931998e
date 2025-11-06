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
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
  const [selectedAutoDiscountId, setSelectedAutoDiscountId] = useState<string | null>(null);

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
      // Priority 1: Check sessionStorage for previously selected region
      const savedData = sessionStorage.getItem("checkoutFormData");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.selectedRegion) {
            // Verify the saved region still exists in the database
            const regionExists = regions.find(r => r.id === parsed.selectedRegion);
            if (regionExists) {
              setSelectedRegion(parsed.selectedRegion);
              setValue("regionId", parsed.selectedRegion);
              return;
            }
          } else if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
            // Clear expired data
            sessionStorage.removeItem("checkoutFormData");
          }
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error("Error restoring saved region:", e);
          }
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
      toast.error(t("Please log in to checkout"));
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
        const savedData = sessionStorage.getItem("checkoutFormData");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            
            // Check if data hasn't expired (30 minutes)
            if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
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
                      toast.success(t("Previously applied discount restored"));
                    }
                  });
                }
              } else {
                // Check localStorage for manual discount from cart
                const savedCode = localStorage.getItem("manualDiscountCode");
                const savedDiscount = localStorage.getItem("appliedCartDiscount");
                if (savedCode && savedDiscount) {
                  try {
                    const discount = JSON.parse(savedDiscount);
                    setDiscountCode(savedCode);
                    // Ensure free_shipping flag is present
                    if (discount && discount.id && typeof discount.free_shipping === "undefined") {
                      const { data: meta } = await supabase
                        .from("discounts")
                        .select("type, stack_with_shipping")
                        .eq("id", discount.id)
                        .single();
                      discount.free_shipping = meta?.type === "free_shipping";
                      discount.stack_with_shipping = !!meta?.stack_with_shipping;
                    }
                    setAppliedDiscount(discount);
                    setDiscountAmount(discount.amount);
                    setAutoDiscountsDisabled(true);
                  } catch (e) {
                    console.error("Error loading manual discount:", e);
                  }
                }
              }
              
              // Restore address (takes priority over profile address)
              if (parsed.address) {
                setValue("address", parsed.address);
              } else if (data.address) {
                // Fall back to profile address if no saved address
                setValue("address", data.address);
              }
            } else {
              // Data expired, clear it
              sessionStorage.removeItem("checkoutFormData");
              if (data.address) {
                setValue("address", data.address);
              }
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error("Error loading saved checkout data:", e);
            }
          }
        } else if (data.address) {
          // No saved checkout data, use profile address
          setValue("address", data.address);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching profile:", error);
        }
        toast.error(t("Failed to load profile information"));
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
              
              toast.success(t("Location detected successfully!"));
            }
          } catch (error) {
            console.error("Error getting location details:", error);
            toast.error(t("Could not get location details"));
          } finally {
            setLoadingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error(t("Could not access your location"));
          setLoadingLocation(false);
        }
      );
    } else {
      toast.error(t("Geolocation is not supported by your browser"));
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

      // Check for selected auto discount ID from cart
      const selectedId = localStorage.getItem("selectedAutoDiscountId");
      if (selectedId) {
        setSelectedAutoDiscountId(selectedId);
        // Will be validated by the cart, just load it here
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

  // Revalidate manual discount code when cart changes
  useEffect(() => {
    const revalidateDiscount = async () => {
      if (!appliedDiscount || !appliedDiscount.code || cartItems.length === 0) return;
      
      const result = await validateDiscount(appliedDiscount.code, true);
      if (!result?.is_valid) {
        // Discount no longer valid
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setDiscountCode("");
        localStorage.removeItem("appliedCartDiscount");
        localStorage.removeItem("manualDiscountCode");
        toast.error(t("Your discount code is no longer valid for this cart"));
      } else if (result && 'discount_amount' in result && result.discount_amount !== appliedDiscount.amount) {
        // Update discount amount if it changed
        setAppliedDiscount({
          ...appliedDiscount,
          amount: result.discount_amount,
        });
        setDiscountAmount(result.discount_amount);
        localStorage.setItem("appliedCartDiscount", JSON.stringify({
          ...appliedDiscount,
          amount: result.discount_amount,
        }));
      }
    };

    revalidateDiscount();
  }, [cartTotal, cartItems.length]);

  // Save form data to sessionStorage with expiration (30 minutes)
  useEffect(() => {
    const formData = {
      selectedRegion,
      selectedCarrier,
      selectedPaymentMethod,
      discountCode: appliedDiscount?.code || "",
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    sessionStorage.setItem("checkoutFormData", JSON.stringify(formData));
  }, [selectedRegion, selectedCarrier, selectedPaymentMethod, appliedDiscount]);

  // Save address field separately when it changes
  useEffect(() => {
    const subscription = watch((value) => {
      if (value.address !== undefined) {
        const savedData = sessionStorage.getItem("checkoutFormData");
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            // Check if data hasn't expired
            if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
              parsed.address = value.address || "";
              sessionStorage.setItem("checkoutFormData", JSON.stringify(parsed));
            } else {
              sessionStorage.removeItem("checkoutFormData");
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error("Error updating saved address:", e);
            }
          }
        } else {
          // Create initial save with address
          const formData = {
            selectedRegion,
            selectedCarrier,
            selectedPaymentMethod,
            discountCode: appliedDiscount?.code || "",
            address: value.address || "",
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
          };
          sessionStorage.setItem("checkoutFormData", JSON.stringify(formData));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedRegion, selectedCarrier, selectedPaymentMethod, appliedDiscount]);

  // Load saved form data is now handled in the profile fetch effect above
  // Cleanup sessionStorage on component unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("checkoutFormData");
    };
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
          // Fetch discount metadata to detect free shipping type
          const { data: discountMeta } = await supabase
            .from("discounts")
            .select("type, stack_with_shipping")
            .eq("id", result.discount_id)
            .single();

          const isFreeShipping = discountMeta?.type === "free_shipping";
          const appliedObj = {
            id: result.discount_id,
            code: code,
            amount: result.discount_amount,
            message: isFreeShipping ? t("Free shipping applied") : (t(result.message || "Discount applied successfully")),
            free_shipping: isFreeShipping,
            stack_with_shipping: !!discountMeta?.stack_with_shipping,
          } as any;

          setAppliedDiscount(appliedObj);
          setDiscountAmount(Number(result.discount_amount));
          return { ...result, free_shipping: isFreeShipping, applied: appliedObj } as any;
        } else {
          if (!silent) {
            toast.error(t(result.message || "Invalid discount code"));
          }
          return result;
        }
      } else {
        // No data returned from RPC — treat as invalid
        if (!silent) {
            toast.error(t("Invalid discount code"), {
            description: t("The code you entered is not valid or has expired."),
            duration: 4000,
          });
        }
        return { is_valid: false };
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || t("Error validating discount"));
      }
      return { is_valid: false };
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error(t("Please enter a discount code"));
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
    } else {
      setDiscountCode("");
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setDiscountCode("");
    setSelectedAutoDiscountId(null);
    setAutoDiscountsDisabled(false);
    localStorage.removeItem("autoDiscountsDisabled");
    localStorage.removeItem("appliedCartDiscount");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    localStorage.removeItem("selectedAutoDiscountId");
    toast.success(t("Discount removed"));
  };

  const handleRemoveAutoDiscounts = () => {
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setSelectedAutoDiscountId(null);
    setAutoDiscountsDisabled(true);
    localStorage.setItem("autoDiscountsDisabled", "true");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    localStorage.removeItem("selectedAutoDiscountId");
    toast.success(t("Automatic discounts removed. You can now apply a discount code."));
  };

  const shippingDiscount = appliedDiscount?.free_shipping ? shippingCost : 0;
  const total = cartTotal + shippingCost - discountAmount - shippingDiscount;

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user || !profile) {
      toast.error(t("User information not found"));
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error(t("Please select a payment method"));
      return;
    }

    if (!selectedRegion) {
      toast.error(t("Please select a region"));
      return;
    }

    if (!selectedCarrier) {
      toast.error(t("Please select a shipping method"));
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t("Your cart is empty"));
      return;
    }

    setSubmitting(true);

    try {
      // Revalidate discount before placing order
      if (appliedDiscount && appliedDiscount.code) {
        const revalidation = await validateDiscount(appliedDiscount.code, true);
        if (!revalidation?.is_valid) {
          toast.error(t("Your discount code is no longer valid"), {
            description: t("The discount has expired or no longer applies to your cart"),
            duration: 5000,
          });
          setAppliedDiscount(null);
          setDiscountAmount(0);
          setSubmitting(false);
          return;
        }
      }

      // Check stock availability for all items
      for (const item of cartItems) {
        if (item.variant_id) {
          // Check variant stock for items with variants
          const { data: variant, error: variantError } = await supabase
            .from("product_variants")
            .select("stock_quantity, size, colors(name)")
            .eq("id", item.variant_id)
            .single();

          if (variantError) throw variantError;

          if (variant.stock_quantity < item.quantity) {
            const colorName = (variant.colors as any)?.name || '';
            toast.error(
              `${t("Insufficient stock for")} ${t(item.product.name)} (${colorName} - ${variant.size}). ${t("Available")}: ${variant.stock_quantity}, ${t("Requested")}: ${item.quantity}`
            );
            setSubmitting(false);
            return;
          }
        } else {
          // Check product stock for non-variant items
          const { data: product, error: stockError } = await supabase
            .from("products")
            .select("stock_quantity, name")
            .eq("id", item.product_id)
            .single();

          if (stockError) throw stockError;

          if (product.stock_quantity < item.quantity) {
            toast.error(
              `${t("Insufficient stock for")} ${product.name}. ${t("Available")}: ${product.stock_quantity}, ${t("Requested")}: ${item.quantity}`
            );
            setSubmitting(false);
            return;
          }
        }
      }

      // Check phone number requirement
      if (!profile?.phone || profile.phone.trim() === "") {
        toast.error(t("Please add your phone number in your profile to complete the order"));
        navigate("/profile");
        setSubmitting(false);
        return;
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
          p_discount_amount: discountAmount + (appliedDiscount?.free_shipping ? shippingCost : 0),
          p_items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.variant_price || item.product.offer_price || item.product.price,
            notes: item.notes || "",
            variant_id: item.variant_id || null,
            selected_color: item.selected_color || null,
            selected_size: item.selected_size || null,
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
          p_discount_amount: (appliedDiscount.amount || 0) + (appliedDiscount.free_shipping ? shippingCost : 0),
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
      sessionStorage.removeItem("checkoutFormData");
      localStorage.removeItem("appliedCartDiscount");
      localStorage.removeItem("appliedCartDiscounts");
      localStorage.removeItem("appliedCartDiscountAmount");

      toast.success(t("Order placed successfully!"));

      // Navigate based on payment method
      if (paymentMethod?.name.toLowerCase().includes("cash")) {
        navigate(`/order-tracking?orderId=${orderId}`);
      } else {
        navigate(`/payment?orderId=${orderId}&amount=${total}`);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating order:", error);
      }
      toast.error(error.message || t("Failed to place order"));
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
            <h1 className="text-3xl font-bold mb-4">{t("Your cart is empty")}</h1>
            <p className="text-muted-foreground mb-8">
              {t("Add items to your cart before checking out")}
            </p>
            <Button asChild>
              <Link to="/products">{t("Continue Shopping")}</Link>
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
          {t("Back to Cart")}
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Contact Information */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">{t("Contact Information")}</h2>
                <div className="space-y-4">
                  <div>
                    <Label>{t("Email")}</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.email || user.email}
                    </div>
                  </div>
                  <div>
                    <Label>{t("Phone")}</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.phone || t("Not provided")}
                    </div>
                  </div>
                  <div>
                    <Label>{t("Full Name")}</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {profile?.full_name || t("Not provided")}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("To update your contact information, please visit your profile page.")}
                  </p>
                </div>
              </Card>

              {/* Region Selection */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{t("Delivery Region")}</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={loadingLocation}
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    {loadingLocation ? t("Getting Location...") : t("Use GPS")}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="regionId">{t("Select Region")} *</Label>
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
                      <SelectValue placeholder={t("Choose your region")} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions?.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {t(region.name)} {region.country && `- ${t(region.country)}`}
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
                <h2 className="text-xl font-bold mb-4">{t("Shipping Address")}</h2>
                <div>
                  <Label htmlFor="address">{t("Detailed Address")} *</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder={t("Street, building number, floor, etc.")}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                  )}
                </div>
              </Card>

              {/* Shipping Method */}
              {selectedRegion && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">{t("Shipping Method")}</h2>
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
                                    alt={t(carrier.name)}
                                    className="w-12 h-12 object-contain rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{t(carrier.name)}</div>
                                  {carrier.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {t(carrier.description)}
                                    </div>
                                  )}
                                  {carrier.estimated_days && (
                                    <div className="text-sm text-muted-foreground">
                                      {t("Delivery")}: {carrier.estimated_days}
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
                      {t("No shipping methods available for this region")}
                    </p>
                  )}
                  {errors.carrierId && (
                    <p className="text-sm text-destructive mt-2">{errors.carrierId.message}</p>
                  )}
                </Card>
              )}

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">{t("Payment Method")}</h2>
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
                            <div className="font-medium">{t(method.name)}</div>
                            {method.description && (
                              <div className="text-sm text-muted-foreground">
                                {t(method.description)}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <p className="text-muted-foreground">{t("No payment methods available")}</p>
                )}
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={submitting || !selectedCarrier}>
                {submitting ? t("Processing...") : `${t("Place Order")} - ${formatPrice(total)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">{t("Order Summary")}</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0">
                      {item.product.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={t(item.product.name)}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t(item.product.name)}</p>
                      {(item.selected_color || item.selected_size) && (
                        <p className="text-xs text-muted-foreground">
                          {item.selected_color && <span>{t("Color")}: {item.selected_color}</span>}
                          {item.selected_color && item.selected_size && <span> • </span>}
                          {item.selected_size && <span>{t("Size")}: {item.selected_size}</span>}
                        </p>
                      )}
                      <p className="text-muted-foreground">{t("Qty")}: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      {formatPrice((item.variant_price || item.product.offer_price || item.product.price) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Subtotal")}</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Shipping")}</span>
                  <span className="font-medium">
                    {shippingCost > 0 ? formatPrice(shippingCost) : t("Select shipping method")}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t("Discount")}</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Discount Code Section */}
              {!appliedDiscount && appliedDiscounts.length === 0 ? (
                <div className="mb-4">
                  <Label htmlFor="discount">{t("Discount Code")}</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="discount"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder={t("Enter code")}
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
                      {validatingDiscount ? "..." : t("Apply")}
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
                            {t(appliedDiscount.message)}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {t("Code")}: {appliedDiscount.code}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDiscount}
                          className="text-green-800 hover:text-green-900 dark:text-green-200"
                        >
                          {t("Remove")}
                        </Button>
                      </div>
                    )}
                    {appliedDiscounts.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                          {appliedDiscounts.length > 1 ? t("Multiple Discounts Applied") : t("Automatic Discount Applied")}
                        </p>
                        {appliedDiscounts.map((discount, idx) => (
                          <p key={idx} className="text-xs text-green-600 dark:text-green-400">
                            • {t(discount.message)}
                          </p>
                        ))}
                        <p className="text-sm font-bold text-green-700 dark:text-green-300 mt-2">
                          {t("Total Savings")}: {formatPrice(discountAmount)}
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
                    {t("Remove")} {appliedDiscount ? t("Discount Code") : t("Auto Discount")}
                  </Button>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold">
                <span>{t("Total")}</span>
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
