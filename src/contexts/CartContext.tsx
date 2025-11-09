import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  variant_id?: string | null;
  selected_color?: string | null;
  selected_size?: string | null;
  variant_price?: number | null;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    offer_price: number | null;
  };
}

interface AddToCartOptions {
  productId: string;
  quantity?: number;
  notes?: string;
  variantId?: string;
  selectedColor?: string;
  selectedSize?: string;
  variantPrice?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (options: AddToCartOptions) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateNotes: (itemId: string, notes: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          notes,
          variant_id,
          selected_color,
          selected_size,
          variant_price,
          product:products(
            id, 
            name, 
            price, 
            offer_price,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch images for each product - prefer variant color image, then selected color, then primary
      const itemsWithImages = await Promise.all(
        (data || []).map(async (item: any) => {
          let imageUrl = item.product.image_url as string | null;

          // 1) If item has a variant, derive color_id from variant first (most reliable)
          if (item.variant_id) {
            const { data: variant } = await supabase
              .from("product_variants")
              .select("color_id")
              .eq("id", item.variant_id)
              .single();

            const colorId = variant?.color_id as string | null;
            if (colorId) {
              const { data: productColor } = await supabase
                .from("product_colors")
                .select("image_id")
                .eq("product_id", item.product_id)
                .eq("color_id", colorId)
                .single();

              if (productColor?.image_id) {
                const { data: colorImage } = await supabase
                  .from("product_images")
                  .select("image_url")
                  .eq("id", productColor.image_id)
                  .single();
                if (colorImage?.image_url) {
                  imageUrl = colorImage.image_url;
                }
              }
            }
          }

          // 2) If still no image from variant, try selected_color by name
          if ((!imageUrl || imageUrl === item.product.image_url) && item.selected_color) {
            const { data: colorData } = await supabase
              .from("colors")
              .select("id")
              .eq("name", item.selected_color)
              .maybeSingle();

            if (colorData?.id) {
              const { data: productColorData } = await supabase
                .from("product_colors")
                .select("image_id")
                .eq("product_id", item.product_id)
                .eq("color_id", colorData.id)
                .maybeSingle();

              if (productColorData?.image_id) {
                const { data: imageData } = await supabase
                  .from("product_images")
                  .select("image_url")
                  .eq("id", productColorData.image_id)
                  .maybeSingle();
                if (imageData?.image_url) {
                  imageUrl = imageData.image_url;
                }
              }
            }
          }

          // 3) Fallback to primary product image
          if (!imageUrl || imageUrl === item.product.image_url) {
            const { data: primaryImageData } = await supabase
              .from("product_images")
              .select("image_url")
              .eq("product_id", item.product_id)
              .eq("is_primary", true)
              .maybeSingle();

            if (primaryImageData?.image_url) {
              imageUrl = primaryImageData.image_url;
            }
          }

          return {
            ...item,
            product: {
              ...item.product,
              image_url: imageUrl
            }
          };
        })
      );

      setCartItems(itemsWithImages as CartItem[]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error(t("Failed to load cart"));
    } finally {
      setLoading(false);
    }
  };

  // Use ref to track previous user ID to prevent unnecessary refetches
  const prevUserIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Only fetch cart if user actually changed (not just token refresh)
    const currentUserId = user?.id;
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      fetchCart();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const addToCart = async (options: AddToCartOptions) => {
    const { productId, quantity = 1, notes = "", variantId, selectedColor, selectedSize, variantPrice } = options;
    
    if (!user) {
      toast.error(t("Please log in to add items to cart"));
      return;
    }

    try {
      // Normalize values to match database behavior
      const normalizedColor = selectedColor || null;
      const normalizedSize = selectedSize || null;
      
      // Check if this exact variant already in cart (match by product + color + size)
      const existingItem = cartItems.find(item => 
        item.product_id === productId && 
        item.selected_color === normalizedColor &&
        item.selected_size === normalizedSize
      );

      if (existingItem) {
        // Verify stock before updating quantity
        const newQuantity = existingItem.quantity + quantity;
        
        if (variantId || existingItem.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", variantId || existingItem.variant_id)
            .single();
          
          if (variant && newQuantity > variant.stock_quantity) {
            toast.error(t(`Only ${variant.stock_quantity} items available`));
            return;
          }
        }
        
        await updateQuantity(existingItem.id, newQuantity);
        toast.success(t("Cart updated"));
      } else {
        // Verify stock before adding new item
        if (variantId) {
          const { data: variant, error: stockError } = await supabase
            .from("product_variants")
            .select("stock_quantity")
            .eq("id", variantId)
            .single();
          
          if (stockError) {
            toast.error(t("Failed to check stock availability"));
            return;
          }
          
          if (variant && quantity > variant.stock_quantity) {
            toast.error(t(`Only ${variant.stock_quantity} items available`));
            return;
          }
        }
        
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            notes: notes || null,
            variant_id: variantId || null,
            selected_color: normalizedColor,
            selected_size: normalizedSize,
            variant_price: variantPrice || null,
          });

        if (error) {
          console.error("Error adding to cart:", error);
          throw error;
        }
        await fetchCart();
        toast.success(t("Added to cart"));
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || t("Failed to add to cart"));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      // Get the cart item to check variant stock
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) {
        toast.error(t("Cart item not found"));
        return;
      }

      // If item has a variant, check variant stock
      if (cartItem.variant_id) {
        const { data: variant, error: variantError } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", cartItem.variant_id)
          .single();

        if (variantError) throw variantError;

        if (quantity > variant.stock_quantity) {
          toast.error(t(`Only ${variant.stock_quantity} items available for this variant`));
          return;
        }
      } else {
        // Check product stock for non-variant items
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", cartItem.product_id)
          .single();

        if (productError) throw productError;

        if (quantity > product.stock_quantity) {
          toast.error(t(`Only ${product.stock_quantity} items available`));
          return;
        }
      }

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(t("Failed to update quantity"));
    }
  };

  const updateNotes = async (itemId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ notes: notes || null })
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
      toast.success(t("Notes updated"));
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error(t("Failed to update notes"));
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
      toast.success(t("Removed from cart"));
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error(t("Failed to remove item"));
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems([]);
      toast.success(t("Cart cleared"));
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error(t("Failed to clear cart"));
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.variant_price || item.product.offer_price || item.product.price;
    return total + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        updateNotes,
        removeFromCart,
        clearCart,
        loading,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};