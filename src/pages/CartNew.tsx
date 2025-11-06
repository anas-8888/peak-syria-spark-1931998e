import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function CartNew() {
  const { cartItems, updateQuantity, updateNotes, removeFromCart, loading, cartTotal } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [autoDiscountsDisabled, setAutoDiscountsDisabled] = useState(false);
  const [availableAutoDiscounts, setAvailableAutoDiscounts] = useState<any[]>([]);
  const [showingAvailableDiscounts, setShowingAvailableDiscounts] = useState(false);
  const [checkingAutoDiscounts, setCheckingAutoDiscounts] = useState(false);
  const [selectedAutoDiscountId, setSelectedAutoDiscountId] = useState<string | null>(null);
  const lastAppliedDiscountIds = useRef<string>("");
  const isCheckingDiscounts = useRef<boolean>(false);
  const lastCartSnapshot = useRef<string>("");
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [discountFeedback, setDiscountFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});

  const shippingCost = 0; // Will be calculated at checkout
  const total = cartTotal - discountAmount;

  // Fetch variant stocks for cart items
  useEffect(() => {
    const fetchVariantStocks = async () => {
      const stocks: Record<string, number> = {};
      
      for (const item of cartItems) {
        if (item.variant_id) {
          const { data, error } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", item.variant_id)
            .single();
          
          if (!error && data) {
            stocks[item.id] = data.stock_quantity;
          }
        } else {
          // For non-variant items, use product stock
          const { data, error } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();
          
          if (!error && data) {
            stocks[item.id] = data.stock_quantity;
          }
        }
      }
      
      setVariantStocks(stocks);
    };

    if (cartItems.length > 0) {
      fetchVariantStocks();
    }
  }, [cartItems]);

  // Initialize note texts from cart items
  useEffect(() => {
    const initialNotes: Record<string, string> = {};
    cartItems.forEach((item) => {
      initialNotes[item.id] = item.notes || "";
    });
    setNoteTexts(initialNotes);
  }, [cartItems.length]); // Only re-initialize when cart items count changes

  // Auto-save notes with debouncing
  const handleNoteChange = (itemId: string, value: string) => {
    setNoteTexts((prev) => ({ ...prev, [itemId]: value }));

    // Clear existing timeout for this item
    if (saveTimeoutRef.current[itemId]) {
      clearTimeout(saveTimeoutRef.current[itemId]);
    }

    // Set new timeout to save after 1 second of no typing
    saveTimeoutRef.current[itemId] = setTimeout(() => {
      updateNotes(itemId, value);
    }, 1000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const validateDiscount = async (code: string) => {
    try {
      console.log("Validating discount code:", code);
      console.log("Cart total:", cartTotal);
      console.log("Cart items:", cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })));
      
      const { data, error } = await supabase.rpc("validate_discount_code", {
        p_code: code,
        p_user_id: user?.id || null,
        p_cart_subtotal: cartTotal,
        p_cart_items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      console.log("RPC response - data:", data, "error:", error);

      if (error) {
        console.error("RPC error:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log("Validation result:", result);
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
            message: isFreeShipping ? "Free shipping applied" : (result.message || "Discount applied successfully!"),
            free_shipping: isFreeShipping,
            stack_with_shipping: !!discountMeta?.stack_with_shipping,
          } as any;

          setAppliedDiscount(appliedObj);
          setDiscountAmount(Number(result.discount_amount));
          toast.success(appliedObj.message);
          return { ...result, free_shipping: isFreeShipping, applied: appliedObj } as any;
        }
      }

      // Fallback: validate code from discounts table
      console.log("Checking discounts table directly for code:", code);
      const { data: discountRow } = await supabase
        .from("discounts")
        .select("*")
        .eq("code", code)
        .eq("status", "active")
        .maybeSingle();

      console.log("Direct discount lookup:", discountRow);

      if (discountRow) {
        const now = new Date();
        const startsOk = discountRow.start_date ? new Date(discountRow.start_date) <= now : true;
        const endsOk = discountRow.end_date ? new Date(discountRow.end_date) >= now : true;
        const channelOk = !discountRow.channels || discountRow.channels.includes("web");
        const loginOk = !discountRow.logged_in_only || !!user;
        const subtotalOk = Number(discountRow.min_cart_subtotal || 0) <= cartTotal;

        console.log("Validation checks:", { startsOk, endsOk, channelOk, loginOk, subtotalOk });

        if (startsOk && endsOk && channelOk && loginOk && subtotalOk) {
          let amount = 0;
          let isFreeShipping = false;
          if (discountRow.type === "percentage") {
            amount = (Number(discountRow.value) / 100) * cartTotal;
            if (discountRow.per_order_max_discount) {
              amount = Math.min(amount, Number(discountRow.per_order_max_discount));
            }
          } else if (discountRow.type === "fixed_amount") {
            amount = Number(discountRow.value);
          } else if (discountRow.type === "free_shipping") {
            // Cart page does not know shipping cost, mark as free shipping for checkout
            amount = 0;
            isFreeShipping = true;
          }

          const msg = isFreeShipping
            ? (discountRow.marketing_label || "Free shipping applied")
            : (discountRow.marketing_label || `${discountRow.value}% off applied`);
          const appliedObj = { id: discountRow.id, code, amount, message: msg, free_shipping: isFreeShipping } as any;
          setAppliedDiscount(appliedObj);
          setDiscountAmount(amount);
          toast.success(msg);
          return { is_valid: true, discount_id: discountRow.id, discount_amount: amount, message: msg, free_shipping: isFreeShipping, applied: appliedObj } as any;
        }
      }

      toast.error(t("Invalid discount code"), {
        description: t("The code you entered is not valid or has expired."),
        duration: 4000,
      });
      return { is_valid: false };
    } catch (error: any) {
      console.error("Discount validation error:", error);
      toast.error(error.message || t("Error validating discount"));
      return { is_valid: false };
    }
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) {
      toast.error(t("Please enter a discount code"));
      setDiscountFeedback({ type: 'error', message: t('Please enter a discount code') });
      return;
    }

    setValidatingDiscount(true);
    setDiscountFeedback(null);
    const result = await validateDiscount(code.toUpperCase());
    setValidatingDiscount(false);

    if (result?.is_valid) {
      const successMsg = (result && (result as any).message) || 'Discount applied successfully!';
      setDiscountFeedback({ type: 'success', message: successMsg });
      
      // Save manual discount code to localStorage using the validated object
      const toSave = (result as any).applied || appliedDiscount;
      localStorage.setItem("appliedCartDiscount", JSON.stringify(toSave));
      localStorage.setItem("manualDiscountCode", (toSave?.code || code).toUpperCase());
      
      // Clear auto discounts and disable them
      setAppliedDiscounts([]);
      setAutoDiscountsDisabled(true);
      localStorage.setItem("autoDiscountsDisabled", "true");
      localStorage.removeItem("appliedCartDiscounts");
      localStorage.removeItem("appliedCartDiscountAmount");
      localStorage.removeItem("selectedAutoDiscountId");
    } else {
      setAppliedDiscount(null);
      setDiscountCode("");
      setDiscountFeedback({ type: 'error', message: 'Invalid or expired discount code' });
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setDiscountCode("");
    setSelectedAutoDiscountId(null);
    lastAppliedDiscountIds.current = "";
    setAutoDiscountsDisabled(false);
    setDiscountFeedback(null);
    localStorage.removeItem("autoDiscountsDisabled");
    localStorage.removeItem("appliedCartDiscount");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    localStorage.removeItem("selectedAutoDiscountId");
    localStorage.removeItem("manualDiscountCode");
    toast.success(t("Discount removed"));
  };

  const handleRemoveAutoDiscounts = () => {
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setSelectedAutoDiscountId(null);
    lastAppliedDiscountIds.current = "";
    setAutoDiscountsDisabled(true);
    localStorage.setItem("autoDiscountsDisabled", "true");
    localStorage.removeItem("appliedCartDiscounts");
    localStorage.removeItem("appliedCartDiscountAmount");
    localStorage.removeItem("selectedAutoDiscountId");
    toast.success(t("Automatic discounts removed. You can now apply a discount code."));
  };

  const handleApplySelectedDiscount = async (discountId: string) => {
    try {
      // Fetch the specific discount
      const { data: discount, error } = await supabase
        .from("discounts")
        .select("*, discount_products(product_id), discount_categories(category_id)")
        .eq("id", discountId)
        .single();

      if (error) throw error;

      // Validate the discount still qualifies
      const meetsMinimum = cartTotal >= (discount.min_cart_subtotal || 0);
      
      let meetsQuantity = true;
      if (discount.min_quantity && discount.min_quantity > 0) {
        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        meetsQuantity = totalQuantity >= discount.min_quantity;
      }

      let matchingItems = cartItems;
      let meetsScope = true;
      if (discount.scope === "products") {
        const discountProductIds = (discount.discount_products as any[])?.map(dp => dp.product_id) || [];
        matchingItems = cartItems.filter(item => discountProductIds.includes(item.product_id));
        meetsScope = matchingItems.length > 0;
      } else if (discount.scope === "categories") {
        meetsScope = false;
      }

      if (!meetsMinimum || !meetsQuantity || !meetsScope) {
        toast.error(t("You no longer qualify for this discount"));
        return;
      }

      // Calculate discount value
      let discountValue = 0;
      const perCustomerLimit = discount.per_customer_limit || 999999;
      
      if (discount.type === "percentage") {
        let totalQuantityProcessed = 0;
        
        for (const item of matchingItems) {
          const quantityToApply = Math.min(
            item.quantity,
            perCustomerLimit - totalQuantityProcessed
          );
          
          if (quantityToApply <= 0) break;
          
          const itemPrice = item.product.offer_price || item.product.price;
          discountValue += (itemPrice * quantityToApply) * (discount.value / 100);
          totalQuantityProcessed += quantityToApply;
          
          if (totalQuantityProcessed >= perCustomerLimit) break;
        }
      } else if (discount.type === "fixed_amount") {
        discountValue = discount.value;
      }

      // Apply the discount
      const discountToApply = {
        ...discount,
        calculatedAmount: discountValue,
        message: discount.marketing_label || discount.name,
      };
      
      setAppliedDiscounts([discountToApply]);
      setDiscountAmount(discountValue);
      setSelectedAutoDiscountId(discountId);
      setAutoDiscountsDisabled(false);
      lastAppliedDiscountIds.current = discountId;
      
      // Save to localStorage for persistence
      localStorage.setItem("selectedAutoDiscountId", discountId);
      localStorage.setItem("appliedCartDiscounts", JSON.stringify([discountToApply]));
      localStorage.setItem("appliedCartDiscountAmount", discountValue.toString());
      localStorage.removeItem("autoDiscountsDisabled");
      localStorage.removeItem("manualDiscountCode");
      localStorage.removeItem("appliedCartDiscount");
      
      toast.success(t(`${discount.name} applied! You save ${formatPrice(discountValue)}`));
      setShowingAvailableDiscounts(false);
    } catch (error) {
      console.error("Error applying discount:", error);
      toast.error(t("Failed to apply discount"));
    }
  };

  const handleCheckAvailableDiscounts = async () => {
    if (cartItems.length === 0) {
      toast.error(t("Add items to your cart first"));
      return;
    }

    setCheckingAutoDiscounts(true);
    setShowingAvailableDiscounts(true);
    
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*, discount_products(product_id), discount_categories(category_id)")
        .eq("is_automatic", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvailableAutoDiscounts([]);
        toast.info(t("No automatic discounts available at the moment"));
        return;
      }

      const availableDiscounts: any[] = [];

      for (const autoDiscount of data) {
        // Check if cart meets minimum requirements
        const meetsMinimum = cartTotal >= (autoDiscount.min_cart_subtotal || 0);
        
        // Check minimum quantity
        let meetsQuantity = true;
        if (autoDiscount.min_quantity && autoDiscount.min_quantity > 0) {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          meetsQuantity = totalQuantity >= autoDiscount.min_quantity;
        }

        // Check scope restrictions
        let matchingItems = cartItems;
        let meetsScope = true;
        if (autoDiscount.scope === "products") {
          const discountProductIds = (autoDiscount.discount_products as any[])?.map(dp => dp.product_id) || [];
          matchingItems = cartItems.filter(item => discountProductIds.includes(item.product_id));
          meetsScope = matchingItems.length > 0;
        } else if (autoDiscount.scope === "categories") {
          meetsScope = false;
        }

        const isQualified = meetsMinimum && meetsQuantity && meetsScope;

        // Calculate potential discount value
        let discountValue = 0;
        if (isQualified && !autoDiscount.code) {
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
        }

        availableDiscounts.push({
          ...autoDiscount,
          isQualified,
          meetsMinimum,
          meetsQuantity,
          meetsScope,
          calculatedAmount: discountValue,
          missingAmount: !meetsMinimum ? (autoDiscount.min_cart_subtotal || 0) - cartTotal : 0,
        });
      }

      // Sort by qualified first, then by discount amount
      availableDiscounts.sort((a, b) => {
        if (a.isQualified && !b.isQualified) return -1;
        if (!a.isQualified && b.isQualified) return 1;
        return b.calculatedAmount - a.calculatedAmount;
      });

      setAvailableAutoDiscounts(availableDiscounts);
      
      if (availableDiscounts.length === 0) {
        toast.info(t("No automatic discounts available"));
      }
    } catch (error) {
      console.error("Error checking available discounts:", error);
      toast.error(t("Failed to load available discounts"));
    } finally {
      setCheckingAutoDiscounts(false);
    }
  };

  const checkAutoDiscounts = async () => {
    // Prevent concurrent discount checks
    if (isCheckingDiscounts.current) {
      return;
    }

    try {
      isCheckingDiscounts.current = true;

      // If user has manually selected a specific auto discount, validate it
      if (selectedAutoDiscountId) {
        const { data: selectedDiscount, error } = await supabase
          .from("discounts")
          .select("*, discount_products(product_id), discount_categories(category_id)")
          .eq("id", selectedAutoDiscountId)
          .eq("is_automatic", true)
          .eq("status", "active")
          .single();

        if (error || !selectedDiscount) {
          // Selected discount no longer valid
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          setSelectedAutoDiscountId(null);
          localStorage.removeItem("selectedAutoDiscountId");
          toast.error(t("Your selected discount is no longer available"));
          return;
        }

        // Check if still qualifies
        const meetsMinimum = cartTotal >= (selectedDiscount.min_cart_subtotal || 0);
        
        let meetsQuantity = true;
        if (selectedDiscount.min_quantity && selectedDiscount.min_quantity > 0) {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          meetsQuantity = totalQuantity >= selectedDiscount.min_quantity;
        }

        let matchingItems = cartItems;
        let meetsScope = true;
        if (selectedDiscount.scope === "products") {
          const discountProductIds = (selectedDiscount.discount_products as any[])?.map(dp => dp.product_id) || [];
          matchingItems = cartItems.filter(item => discountProductIds.includes(item.product_id));
          meetsScope = matchingItems.length > 0;
        } else if (selectedDiscount.scope === "categories") {
          meetsScope = false;
        }

        if (!meetsMinimum || !meetsQuantity || !meetsScope) {
          // No longer qualifies
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          setSelectedAutoDiscountId(null);
          localStorage.removeItem("selectedAutoDiscountId");
          
          let reason = "";
          if (!meetsMinimum) {
            const missing = (selectedDiscount.min_cart_subtotal || 0) - cartTotal;
            reason = `Add ${formatPrice(missing)} more to your cart`;
          } else if (!meetsQuantity) {
            reason = `You need ${selectedDiscount.min_quantity} items`;
          } else if (!meetsScope) {
            reason = "Required products removed from cart";
          }
          
          toast.error(`Discount removed: ${reason}`);
          return;
        }

        // Still qualifies, recalculate amount
        let discountValue = 0;
        const perCustomerLimit = selectedDiscount.per_customer_limit || 999999;
        
        if (selectedDiscount.type === "percentage") {
          let totalQuantityProcessed = 0;
          
          for (const item of matchingItems) {
            const quantityToApply = Math.min(
              item.quantity,
              perCustomerLimit - totalQuantityProcessed
            );
            
            if (quantityToApply <= 0) break;
            
            const itemPrice = item.product.offer_price || item.product.price;
            discountValue += (itemPrice * quantityToApply) * (selectedDiscount.value / 100);
            totalQuantityProcessed += quantityToApply;
            
            if (totalQuantityProcessed >= perCustomerLimit) break;
          }
        } else if (selectedDiscount.type === "fixed_amount") {
          discountValue = selectedDiscount.value;
        }

        // Update with recalculated amount
        setAppliedDiscounts([{
          ...selectedDiscount,
          calculatedAmount: discountValue,
          message: selectedDiscount.marketing_label || selectedDiscount.name,
        }]);
        setDiscountAmount(discountValue);
        return;
      }

      const { data, error } = await supabase
        .from("discounts")
        .select("*, discount_products(product_id), discount_categories(category_id)")
        .eq("is_automatic", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Clear discounts if none are applicable
        if (appliedDiscounts.length > 0) {
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          lastAppliedDiscountIds.current = "";
        }
        return;
      }

      // Calculate discount amount for each applicable discount
      const applicableDiscounts: any[] = [];

      for (const autoDiscount of data) {
        // Check if cart meets minimum requirements
        if (cartTotal < (autoDiscount.min_cart_subtotal || 0)) continue;

        // Check minimum quantity if specified
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
          const discountCategoryIds = (autoDiscount.discount_categories as any[])?.map(dc => dc.category_id) || [];
          continue; // Skip category-based for now
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
              matchingItems,
              product_ids: autoDiscount.scope === "products" 
                ? (autoDiscount.discount_products as any[])?.map(dp => dp.product_id) || []
                : [],
            });
          }
        }
      }

      if (applicableDiscounts.length === 0) {
        // Clear discounts if none are applicable
        if (appliedDiscounts.length > 0) {
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          lastAppliedDiscountIds.current = "";
        }
        return;
      }

      // Separate stackable and non-stackable discounts
      const stackable = applicableDiscounts.filter(d => d.is_stackable);
      const nonStackable = applicableDiscounts.filter(d => !d.is_stackable);

      let finalDiscounts: any[] = [];
      let totalDiscount = 0;

      // Strategy: Compare best combinations
      // Option 1: All stackable discounts combined
      const stackableTotal = stackable.reduce((sum, d) => sum + d.calculatedAmount, 0);

      // Option 2: Best non-stackable discount
      const bestNonStackable = nonStackable.length > 0 
        ? nonStackable.reduce((best, current) => 
            current.calculatedAmount > best.calculatedAmount ? current : best
          )
        : null;

      // Choose the better option
      if (stackableTotal >= (bestNonStackable?.calculatedAmount || 0) && stackable.length > 0) {
        // Use all stackable discounts
        finalDiscounts = stackable;
        totalDiscount = stackableTotal;
      } else if (bestNonStackable) {
        // Use best non-stackable discount
        finalDiscounts = [bestNonStackable];
        totalDiscount = bestNonStackable.calculatedAmount;
      }

      if (finalDiscounts.length > 0 && totalDiscount > 0) {
        const discountsToApply = finalDiscounts.map(d => ({
          id: d.id,
          code: null,
          amount: d.calculatedAmount,
          message: d.marketing_label || d.name,
          scope: d.scope,
          product_ids: d.product_ids,
          per_customer_limit: d.per_customer_limit || 999999,
          discount_percentage: d.type === "percentage" ? d.value : null,
          is_stackable: d.is_stackable,
          stack_with_shipping: d.stack_with_shipping,
        }));

        // Create a unique identifier for this discount combination
        const currentDiscountIds = discountsToApply.map(d => d.id).sort().join(",");
        
        setAppliedDiscounts(discountsToApply);
        setDiscountAmount(totalDiscount);
        
        // Only show toast if discount combination changed
        if (currentDiscountIds !== lastAppliedDiscountIds.current) {
          lastAppliedDiscountIds.current = currentDiscountIds;
          const discountNames = finalDiscounts.map(d => d.name).join(" + ");
          toast.success(t(`${discountNames} applied! You save ${formatPrice(totalDiscount)}`));
        }
      } else {
        // No applicable discounts, clear if we had some before
        if (appliedDiscounts.length > 0) {
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          lastAppliedDiscountIds.current = "";
        }
      }
    } catch (error) {
      console.error("Error checking auto discounts:", error);
    } finally {
      isCheckingDiscounts.current = false;
    }
  };

  // Load auto discounts disabled state and selected discount on mount
  useEffect(() => {
    const disabled = localStorage.getItem("autoDiscountsDisabled");
    if (disabled === "true") {
      setAutoDiscountsDisabled(true);
    }
    
    const selectedId = localStorage.getItem("selectedAutoDiscountId");
    if (selectedId) {
      setSelectedAutoDiscountId(selectedId);
    }

    // Load and revalidate manual discount code
    const savedCode = localStorage.getItem("manualDiscountCode");
    if (savedCode && cartItems.length > 0) {
      setDiscountCode(savedCode);
      // Revalidate the saved code
      validateDiscount(savedCode).then((result) => {
        if (result?.is_valid) {
          setDiscountFeedback({ type: 'success', message: 'Discount code restored' });
        } else {
          // Invalid, clear it
          localStorage.removeItem("manualDiscountCode");
          localStorage.removeItem("appliedCartDiscount");
          setDiscountCode("");
        }
      });
    }
  }, [cartItems.length]);

  // Restore and validate previously selected discount on mount
  useEffect(() => {
    const restoreSelectedDiscount = async () => {
      if (!selectedAutoDiscountId || cartItems.length === 0) return;

      try {
        const { data: discount, error } = await supabase
          .from("discounts")
          .select("*, discount_products(product_id), discount_categories(category_id)")
          .eq("id", selectedAutoDiscountId)
          .eq("is_automatic", true)
          .eq("status", "active")
          .single();

        if (error || !discount) {
          // Discount no longer exists
          setSelectedAutoDiscountId(null);
          localStorage.removeItem("selectedAutoDiscountId");
          return;
        }

        // Check if still qualifies
        const meetsMinimum = cartTotal >= (discount.min_cart_subtotal || 0);
        
        let meetsQuantity = true;
        if (discount.min_quantity && discount.min_quantity > 0) {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          meetsQuantity = totalQuantity >= discount.min_quantity;
        }

        let matchingItems = cartItems;
        let meetsScope = true;
        if (discount.scope === "products") {
          const discountProductIds = (discount.discount_products as any[])?.map(dp => dp.product_id) || [];
          matchingItems = cartItems.filter(item => discountProductIds.includes(item.product_id));
          meetsScope = matchingItems.length > 0;
        } else if (discount.scope === "categories") {
          meetsScope = false;
        }

        if (!meetsMinimum || !meetsQuantity || !meetsScope) {
          // No longer qualifies
          setAppliedDiscounts([]);
          setDiscountAmount(0);
          setSelectedAutoDiscountId(null);
          localStorage.removeItem("selectedAutoDiscountId");
          localStorage.removeItem("appliedCartDiscounts");
          localStorage.removeItem("appliedCartDiscountAmount");
          return;
        }

        // Calculate discount value
        let discountValue = 0;
        const perCustomerLimit = discount.per_customer_limit || 999999;
        
        if (discount.type === "percentage") {
          let totalQuantityProcessed = 0;
          
          for (const item of matchingItems) {
            const quantityToApply = Math.min(
              item.quantity,
              perCustomerLimit - totalQuantityProcessed
            );
            
            if (quantityToApply <= 0) break;
            
            const itemPrice = item.product.offer_price || item.product.price;
            discountValue += (itemPrice * quantityToApply) * (discount.value / 100);
            totalQuantityProcessed += quantityToApply;
            
            if (totalQuantityProcessed >= perCustomerLimit) break;
          }
        } else if (discount.type === "fixed_amount") {
          discountValue = discount.value;
        }

        // Restore the discount
        const appliedDiscount = {
          ...discount,
          calculatedAmount: discountValue,
          message: discount.marketing_label || discount.name,
        };
        
        setAppliedDiscounts([appliedDiscount]);
        setDiscountAmount(discountValue);
        
        // Save to localStorage for checkout
        localStorage.setItem("appliedCartDiscounts", JSON.stringify([appliedDiscount]));
        localStorage.setItem("appliedCartDiscountAmount", discountValue.toString());
      } catch (error) {
        console.error("Error restoring selected discount:", error);
      }
    };

    // Only run once on mount when cart is loaded
    if (cartItems.length > 0 && selectedAutoDiscountId && !loading) {
      restoreSelectedDiscount();
    }
  }, [loading]); // Only depend on loading to run once when cart loads

  // Automatically recalculate discounts on cart changes with optimization
  useEffect(() => {
    // Empty cart - clear all discounts
    if (cartItems.length === 0) {
      if (appliedDiscount || appliedDiscounts.length > 0) {
        setAppliedDiscount(null);
        setAppliedDiscounts([]);
        setDiscountAmount(0);
        lastAppliedDiscountIds.current = "";
        localStorage.removeItem("appliedCartDiscount");
        localStorage.removeItem("appliedCartDiscounts");
        localStorage.removeItem("appliedCartDiscountAmount");
        localStorage.removeItem("manualDiscountCode");
      }
      return;
    }

    // Skip if cart total is 0
    if (cartTotal <= 0) return;
    
    // Revalidate manual discount code on cart changes
    if (appliedDiscount && appliedDiscount.code) {
      const revalidateManualCode = async () => {
        const result = await validateDiscount(appliedDiscount.code);
        if (!result?.is_valid) {
          // No longer valid, clear it
          setAppliedDiscount(null);
          setDiscountAmount(0);
          setDiscountCode("");
          localStorage.removeItem("appliedCartDiscount");
          localStorage.removeItem("manualDiscountCode");
          toast.error(t("Your discount code is no longer valid for this cart"));
        }
      };
      revalidateManualCode();
      return;
    }
    
    // Skip if auto discounts are disabled (user chose manual code)
    if (autoDiscountsDisabled) return;

    // Create cart snapshot to detect meaningful changes
    const cartSnapshot = JSON.stringify(
      cartItems.map(item => ({
        id: item.product_id,
        qty: item.quantity,
      }))
    );

    // Only check discounts if cart actually changed
    if (cartSnapshot === lastCartSnapshot.current) {
      return;
    }

    lastCartSnapshot.current = cartSnapshot;

    // Increased debounce to reduce API calls during rapid changes
    const timeoutId = setTimeout(() => {
      // Only recalculate if no manual discount code is applied
      // But DO check if a selected auto discount still qualifies
      if (!appliedDiscount) {
        checkAutoDiscounts();
      }
    }, 500); // Longer debounce for better performance

    return () => clearTimeout(timeoutId);
  }, [cartItems, cartTotal, selectedAutoDiscountId]);

  if (loading) {
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
            <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold mb-4">{t("Your cart is empty")}</h1>
            <p className="text-muted-foreground mb-8">
              {t("Add some products to get started")}
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{t("Shopping Cart")}</h1>
          <p className="text-muted-foreground">{cartItems.length} {t("items in your cart")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.product.image_url || '/placeholder.svg'}
                      alt={t(item.product.name)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg truncate">{t(item.product.name)}</h3>
                        {(item.selected_color || item.selected_size) && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {item.selected_color && <span>{t("Color")}: {item.selected_color}</span>}
                            {item.selected_color && item.selected_size && <span> | </span>}
                            {item.selected_size && <span>{t("Size")}: {item.selected_size}</span>}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.variant_price || item.product.offer_price || item.product.price)} {t("each")}
                        </p>
                        {variantStocks[item.id] !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {variantStocks[item.id]} {t("available")}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPendingQuantities(prev => ({ 
                          ...prev, 
                          [item.id]: Math.max((prev[item.id] ?? item.quantity) - 1, 1)
                        }))}
                        disabled={(pendingQuantities[item.id] ?? item.quantity) <= 1}
                      >
                      <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={pendingQuantities[item.id] ?? item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0 && val <= (variantStocks[item.id] || Number.MAX_SAFE_INTEGER)) {
                            setPendingQuantities(prev => ({ ...prev, [item.id]: val }));
                          }
                        }}
                        className="w-16 h-8 text-center"
                        min="1"
                        max={variantStocks[item.id] || undefined}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPendingQuantities(prev => ({ 
                          ...prev, 
                          [item.id]: Math.min((prev[item.id] ?? item.quantity) + 1, variantStocks[item.id] || Number.MAX_SAFE_INTEGER)
                        }))}
                        disabled={variantStocks[item.id] !== undefined && (pendingQuantities[item.id] ?? item.quantity) >= variantStocks[item.id]}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {pendingQuantities[item.id] !== undefined && pendingQuantities[item.id] !== item.quantity && (
                        <Button
                          variant="default"
                          size="sm"
                          className="ml-2 h-8"
                          onClick={() => {
                            updateQuantity(item.id, pendingQuantities[item.id]);
                            setPendingQuantities(prev => {
                              const updated = { ...prev };
                              delete updated[item.id];
                              return updated;
                            });
                          }}
                        >
                          {t("Apply")}
                        </Button>
                      )}
                      <span className="ml-auto font-semibold">
                        {formatPrice((item.variant_price || item.product.offer_price || item.product.price) * (pendingQuantities[item.id] ?? item.quantity))}
                      </span>
                    </div>

                    {/* Notes - Auto-save */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder={t("Add notes for this item (saves automatically)...")}
                        value={noteTexts[item.id] || ""}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="min-h-[60px]"
                      />
                      {noteTexts[item.id] && (
                        <p className="text-xs text-muted-foreground">
                          ✓ {t("Notes saved automatically")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">{t("Order Summary")}</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Subtotal")}</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t("Discount")}</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("Shipping")}</span>
                  <span className="font-medium text-xs">{t("Calculated at checkout")}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("Total")}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Discount Code Section */}
              {!appliedDiscount && appliedDiscounts.length === 0 ? (
                <div className="mb-4 space-y-2">
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
                      {validatingDiscount ? t("Applying...") : t("Apply")}
                    </Button>
                  </div>
                  {discountFeedback && (
                    <p className={`${discountFeedback.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'} text-xs`}>
                      {discountFeedback.message}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckAvailableDiscounts}
                    disabled={checkingAutoDiscounts}
                    className="w-full"
                  >
                    {checkingAutoDiscounts ? t("Checking...") : t("Check Auto Discounts")}
                  </Button>
                </div>
              ) : (
                <div className="mb-4 space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    {appliedDiscount && (
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {appliedDiscount.message}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Code: {appliedDiscount.code}
                        </p>
                      </div>
                    )}
                    {appliedDiscounts.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                          {appliedDiscounts.length > 1 ? t("Multiple Discounts Applied") : t("Automatic Discount Applied")}
                        </p>
                        {appliedDiscounts.map((discount, idx) => (
                          <p key={idx} className="text-xs text-green-600 dark:text-green-400">
                            • {discount.message}
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

              {/* Available Auto Discounts Display */}
              {showingAvailableDiscounts && availableAutoDiscounts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t("Available Auto Discounts")}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowingAvailableDiscounts(false)}
                      className="h-6 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableAutoDiscounts.map((discount, idx) => (
                      <Card
                        key={idx}
                        className={`p-3 ${
                          discount.isQualified
                            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 transition-colors'
                            : 'bg-muted/50 border-muted'
                        }`}
                        onClick={() => discount.isQualified && handleApplySelectedDiscount(discount.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${
                              discount.isQualified
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-muted-foreground'
                            }`}>
                              {discount.name}
                            </p>
                            {discount.isQualified && (
                              <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                {formatPrice(discount.calculatedAmount)} OFF
                              </span>
                            )}
                          </div>
                          
                          {discount.marketing_label && (
                            <p className="text-xs text-muted-foreground">
                              {discount.marketing_label}
                            </p>
                          )}

                          {!discount.isQualified && (
                            <div className="text-xs space-y-0.5 text-muted-foreground">
                              {!discount.meetsMinimum && (
                                <p>• {t("Add")} {formatPrice(discount.missingAmount)} {t("more to qualify")}</p>
                              )}
                              {!discount.meetsQuantity && (
                                <p>• {t("Minimum")} {discount.min_quantity} {t("items required")}</p>
                              )}
                              {!discount.meetsScope && (
                                <p>• {t("Only applies to specific products")}</p>
                              )}
                            </div>
                          )}

                          {discount.isQualified && (
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-green-600 dark:text-green-400">
                                ✓ {t("You qualify!")} {discount.is_stackable ? `(${t("Stackable")})` : `(${t("Not stackable")})`}
                              </p>
                              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                                {t("Click to apply")}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                asChild 
                className="w-full mb-3"
                onClick={() => {
                  // Save discount info to localStorage for checkout
                  if (appliedDiscount) {
                    localStorage.setItem("appliedCartDiscount", JSON.stringify(appliedDiscount));
                    localStorage.removeItem("appliedCartDiscounts");
                    localStorage.removeItem("appliedCartDiscountAmount");
                  } else if (appliedDiscounts.length > 0) {
                    localStorage.setItem("appliedCartDiscounts", JSON.stringify(appliedDiscounts));
                    localStorage.setItem("appliedCartDiscountAmount", discountAmount.toString());
                    localStorage.removeItem("appliedCartDiscount");
                  } else {
                    localStorage.removeItem("appliedCartDiscount");
                    localStorage.removeItem("appliedCartDiscounts");
                    localStorage.removeItem("appliedCartDiscountAmount");
                  }
                  // Persist auto discount and selection preferences
                  if (autoDiscountsDisabled) {
                    localStorage.setItem("autoDiscountsDisabled", "true");
                  } else {
                    localStorage.removeItem("autoDiscountsDisabled");
                  }
                  if (selectedAutoDiscountId) {
                    localStorage.setItem("selectedAutoDiscountId", selectedAutoDiscountId);
                  } else {
                    localStorage.removeItem("selectedAutoDiscountId");
                  }
                }}
              >
                <Link to="/checkout">{t("Proceed to Checkout")}</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/products">{t("Continue Shopping")}</Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}