import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
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

      // Fetch primary images for each product
      const itemsWithImages = await Promise.all(
        (data || []).map(async (item: any) => {
          // First try to get primary image from product_images table
          const { data: imageData } = await supabase
            .from("product_images")
            .select("image_url")
            .eq("product_id", item.product_id)
            .eq("is_primary", true)
            .single();

          return {
            ...item,
            product: {
              ...item.product,
              image_url: imageData?.image_url || item.product.image_url
            }
          };
        })
      );

      setCartItems(itemsWithImages as CartItem[]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (options: AddToCartOptions) => {
    const { productId, quantity = 1, notes = "", variantId, selectedColor, selectedSize, variantPrice } = options;
    
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }

    try {
      // Check if this exact variant already in cart
      const existingItem = cartItems.find(item => 
        item.product_id === productId && 
        (variantId ? item.variant_id === variantId : !item.variant_id)
      );

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        await updateQuantity(existingItem.id, newQuantity);
        toast.success("Cart updated");
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            notes: notes || null,
            variant_id: variantId || null,
            selected_color: selectedColor || null,
            selected_size: selectedSize || null,
            variant_price: variantPrice || null,
          });

        if (error) throw error;
        await fetchCart();
        toast.success("Added to cart");
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      // Get the cart item to check variant stock
      const cartItem = cartItems.find(item => item.id === itemId);
      if (!cartItem) {
        toast.error("Cart item not found");
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
          toast.error(`Only ${variant.stock_quantity} items available for this variant`);
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
          toast.error(`Only ${product.stock_quantity} items available`);
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
      toast.error("Failed to update quantity");
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
      toast.success("Notes updated");
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Failed to update notes");
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
      toast.success("Removed from cart");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item");
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
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
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