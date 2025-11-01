import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
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
  const { user } = useAuth();
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [appliedDiscounts, setAppliedDiscounts] = useState<any[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const shippingCost = 0; // Will be calculated at checkout
  const total = cartTotal - discountAmount;

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
          toast.success(result.message || "Discount applied successfully!");
          return result;
        } else {
          toast.error(result.message || "Invalid discount code");
          return result;
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error validating discount");
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
    setAppliedDiscounts([]);
    setDiscountAmount(0);
    setDiscountCode("");
    toast.success("Discount removed");
  };

  const checkAutoDiscounts = async () => {
    try {
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

      if (applicableDiscounts.length === 0) return;

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

        setAppliedDiscounts(discountsToApply);
        setDiscountAmount(totalDiscount);
        
        const discountNames = finalDiscounts.map(d => d.name).join(" + ");
        toast.success(`${discountNames} applied! You save ${formatPrice(totalDiscount)}`);
      }
    } catch (error) {
      console.error("Error checking auto discounts:", error);
    }
  };

  // Check for auto-apply discounts and remove if products removed
  useEffect(() => {
    if (cartItems.length === 0 && (appliedDiscount || appliedDiscounts.length > 0)) {
      // Cart is empty, remove discounts
      setAppliedDiscount(null);
      setAppliedDiscounts([]);
      setDiscountAmount(0);
      return;
    }

    // Recalculate discounts when cart changes
    if (appliedDiscounts.length > 0) {
      let totalNewDiscount = 0;
      const updatedDiscounts: any[] = [];
      let shouldRemove = false;

      for (const discount of appliedDiscounts) {
        if (discount.scope === "products" && discount.product_ids) {
          // Check if any matching products are still in cart
          const matchingItems = cartItems.filter(item => 
            discount.product_ids.includes(item.product_id)
          );
          
          if (matchingItems.length === 0) {
            shouldRemove = true;
            continue;
          }
          
          // Recalculate discount
          let newDiscountValue = 0;
          const perCustomerLimit = discount.per_customer_limit || 999999;
          let totalQuantityProcessed = 0;
          
          for (const item of matchingItems) {
            const quantityToApply = Math.min(
              item.quantity,
              perCustomerLimit - totalQuantityProcessed
            );
            
            if (quantityToApply <= 0) break;
            
            const itemPrice = item.product.offer_price || item.product.price;
            const discountPercent = discount.discount_percentage || (discount.amount / cartTotal * 100);
            newDiscountValue += (itemPrice * quantityToApply) * (discountPercent / 100);
            totalQuantityProcessed += quantityToApply;
            
            if (totalQuantityProcessed >= perCustomerLimit) break;
          }
          
          updatedDiscounts.push({
            ...discount,
            amount: newDiscountValue,
          });
          totalNewDiscount += newDiscountValue;
        } else {
          updatedDiscounts.push(discount);
          totalNewDiscount += discount.amount;
        }
      }

      if (shouldRemove) {
        setAppliedDiscounts([]);
        setDiscountAmount(0);
        toast.info("Discount removed: product no longer in cart");
        // Recheck for new applicable discounts
        setTimeout(() => checkAutoDiscounts(), 100);
      } else if (Math.abs(totalNewDiscount - discountAmount) > 0.01) {
        setAppliedDiscounts(updatedDiscounts);
        setDiscountAmount(totalNewDiscount);
      }
    } else if (cartItems.length > 0 && !appliedDiscount && appliedDiscounts.length === 0 && cartTotal > 0) {
      // No discounts applied, check for auto-discounts
      checkAutoDiscounts();
    }
  }, [cartItems, cartTotal]);

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
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Start shopping to add items to your cart
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">{cartItems.length} items in your cart</p>
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
                      alt={item.product.name}
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
                        <h3 className="font-semibold text-lg truncate">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.product.offer_price || item.product.price)} each
                        </p>
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
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val > 0) updateQuantity(item.id, val);
                        }}
                        className="w-16 h-8 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="ml-auto font-semibold">
                        {formatPrice((item.product.offer_price || item.product.price) * item.quantity)}
                      </span>
                    </div>

                    {/* Notes - Auto-save */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add notes for this item (saves automatically)..."
                        value={noteTexts[item.id] || ""}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="min-h-[60px]"
                      />
                      {noteTexts[item.id] && (
                        <p className="text-xs text-muted-foreground">
                          ✓ Notes saved automatically
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
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-xs">Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
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
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
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
              )}

              <Button 
                asChild 
                className="w-full mb-3"
                onClick={() => {
                  // Save discount info to localStorage for checkout
                  if (appliedDiscount) {
                    localStorage.setItem("appliedCartDiscount", JSON.stringify(appliedDiscount));
                  } else if (appliedDiscounts.length > 0) {
                    localStorage.setItem("appliedCartDiscounts", JSON.stringify(appliedDiscounts));
                    localStorage.setItem("appliedCartDiscountAmount", discountAmount.toString());
                  } else {
                    localStorage.removeItem("appliedCartDiscount");
                    localStorage.removeItem("appliedCartDiscounts");
                    localStorage.removeItem("appliedCartDiscountAmount");
                  }
                }}
              >
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}