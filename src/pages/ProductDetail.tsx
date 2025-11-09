import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft, Star, Copy, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ReviewForm } from "@/components/ReviewForm";
import { getOptimizedImageUrl } from "@/utils/imageCache";
import { ReviewsList } from "@/components/ReviewsList";
import GoogleSignInPopup from "@/components/GoogleSignInPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProductImage = {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  colors?: { color: string; image_id: string }[];
  offer_price?: number | null;
  rating?: number;
  sizes?: string[];
  sku?: string;
  features?: string[];
  flag?: string | null;
  target_gender?: string;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});
  const [imageZoomOrigin, setImageZoomOrigin] = useState({ x: 50, y: 50 });
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImageZoomOrigin({ x, y });
  };

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        colors: (data.colors as any) as { color: string; image_id: string }[] | undefined,
      } as Product;
    },
    enabled: !!id,
  });

  // Fetch product images
  const { data: images = [] } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!id,
  });

  // Fetch product colors with image mappings
  const { data: productColors = [] } = useQuery({
    queryKey: ["product-colors", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_colors")
        .select(`
          color_id,
          image_id,
          colors:color_id (
            name,
            hex_code
          )
        `)
        .eq("product_id", id);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch product variants
  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          *,
          colors (
            id,
            name,
            hex_code
          )
        `)
        .eq("product_id", id)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch applicable automatic discounts for this product
  const { data: applicableDiscounts = [] } = useQuery({
    queryKey: ["product-discounts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*, discount_products(product_id)")
        .eq("is_automatic", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) throw error;
      
      // Filter to only show discounts that apply to this product
      return data.filter(discount => {
        if (discount.scope === "store_wide") return true;
        if (discount.scope === "products") {
          const discountProductIds = (discount.discount_products as any[])?.map(dp => dp.product_id) || [];
          return discountProductIds.includes(id);
        }
        if (discount.scope === "flags" && product?.flag) {
          // Would need to check flag match
          return false;
        }
        return false;
      });
    },
    enabled: !!id && !!product,
  });

  // Fetch product reviews with auto-refresh
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          *
        `)
        .eq("product_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all(
        data.map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.user_id)
            .maybeSingle();
          
          return {
            ...review,
            profiles: profile,
          };
        })
      );
      
      return reviewsWithProfiles;
    },
    enabled: !!id,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Calculate average rating from approved reviews
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user || !id) return;
      
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .maybeSingle();
      
      setIsInWishlist(!!data);
    };
    
    checkWishlist();
  }, [user, id]);

  // Build color to image mapping
  useEffect(() => {
    if (productColors.length > 0 && images.length > 0) {
      const mapping: Record<string, string> = {};
      productColors.forEach((pc) => {
        const colorName = (pc.colors as any)?.name?.toLowerCase();
        if (colorName && pc.image_id) {
          const image = images.find(img => img.id === pc.image_id);
          if (image) {
            mapping[colorName] = image.image_url;
          }
        }
      });
      setColorImageMap(mapping);
    }
  }, [productColors, images]);

  // Set initial selected image
  useEffect(() => {
    if (images.length > 0) {
      const primaryImage = images.find(img => img.is_primary);
      setSelectedImageUrl(primaryImage?.image_url || images[0].image_url);
    }
  }, [images]);

  // Initialize with first variant or product price
  useEffect(() => {
    if (variants.length > 0) {
      // Set first color
      const firstVariant = variants[0];
      setSelectedColorId(firstVariant.color_id);
      setSelectedColor(firstVariant.colors?.name?.toLowerCase() || '');
      
      // Find image for this color
      if (colorImageMap[firstVariant.colors?.name?.toLowerCase()]) {
        setSelectedImageUrl(colorImageMap[firstVariant.colors?.name?.toLowerCase()]);
      }
      
      // Get available sizes for this color
      const sizesForColor = variants
        .filter((v: any) => v.color_id === firstVariant.color_id && v.stock_quantity > 0)
        .sort((a: any, b: any) => a.size.localeCompare(b.size));
      
      setAvailableSizes(sizesForColor);
      
      if (sizesForColor.length > 0) {
        setSelectedSize(sizesForColor[0].size);
        setSelectedVariantId(sizesForColor[0].id);
        setCurrentPrice(sizesForColor[0].price);
      }
    } else if (product) {
      // Fallback to product base price (use offer_price if available)
      setCurrentPrice(product.offer_price || product.price || 0);
    }
  }, [variants, product, colorImageMap]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">{t("Loading...")}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">{t("Product not found")}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle color selection
  const handleColorSelect = (colorId: string, colorName: string) => {
    setSelectedColorId(colorId);
    setSelectedColor(colorName.toLowerCase());
    
    // Update image
    if (colorImageMap[colorName.toLowerCase()]) {
      setSelectedImageUrl(colorImageMap[colorName.toLowerCase()]);
    }
    
    // Get available sizes for selected color
    const sizesForColor = variants
      .filter((v: any) => v.color_id === colorId && v.stock_quantity > 0)
      .sort((a: any, b: any) => a.size.localeCompare(b.size));
    
    setAvailableSizes(sizesForColor);
    
    // Reset size selection
    if (sizesForColor.length > 0) {
      setSelectedSize(sizesForColor[0].size);
      setSelectedVariantId(sizesForColor[0].id);
      setCurrentPrice(sizesForColor[0].price);
    } else {
      setSelectedSize('');
      setSelectedVariantId('');
    }
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = availableSizes.find((v: any) => v.size === size);
    if (variant) {
      setSelectedVariantId(variant.id);
      setCurrentPrice(variant.price);
    }
  };

  const displayPrice = variants.length > 0 ? currentPrice : (product.offer_price || product.price);
  const hasDiscount = !!product.offer_price;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link to="/products" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 sm:mb-6 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("Back to Products")}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div 
              className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-zoom-in"
              onMouseMove={handleImageMouseMove}
            >
              <img 
                src={getOptimizedImageUrl(selectedImageUrl || images[0]?.image_url, {
                  width: 800,
                  quality: 90,
                  format: 'webp'
                }) || "/placeholder.svg"} 
                alt={product.name}
                loading="eager"
                decoding="async"
                width={800}
                height={800}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150" 
                style={{
                  transformOrigin: `${imageZoomOrigin.x}% ${imageZoomOrigin.y}%`
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== '/placeholder.svg') {
                    target.src = '/placeholder.svg';
                  }
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image) => (
                  <div 
                    key={image.id} 
                    className={`aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                      selectedImageUrl === image.image_url ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedImageUrl(image.image_url);
                      // Find and set the color associated with this image
                      const colorForImage = Object.entries(colorImageMap).find(
                        ([_, imageUrl]) => imageUrl === image.image_url
                      );
                      if (colorForImage) {
                        setSelectedColor(colorForImage[0]);
                      }
                    }}
                  >
                    <img 
                      src={getOptimizedImageUrl(image.image_url, {
                        width: 200,
                        quality: 80,
                        format: 'webp'
                      })} 
                      alt="Thumbnail" 
                      loading="lazy"
                      decoding="async"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== '/placeholder.svg') {
                          target.src = '/placeholder.svg';
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              {product.flag && (
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 sm:mb-4">
                  {product.flag}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{t(product.name)}</h1>
              {product.sku && (
                <p className="text-muted-foreground text-sm sm:text-base">SKU: {product.sku}</p>
              )}
              {product.target_gender && product.target_gender !== 'both' && (
                <div className="inline-block">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {product.target_gender === 'men' ? t("Men's") : t("Women's")}
                  </Badge>
                </div>
              )}
              {averageRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)}/5 ({reviews.length} {reviews.length === 1 ? t("review") : t("Reviews").toLowerCase()})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {formatPrice(displayPrice)}
              </div>
              {hasDiscount && product.offer_price && (
                <div className="text-lg sm:text-xl line-through text-muted-foreground">
                  {formatPrice(product.price)}
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {t(product.description)}
              </p>
            )}

            {/* Automatic Discounts */}
            {applicableDiscounts.length > 0 && (
              <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Badge className="bg-green-600">Auto Applied</Badge>
                  Active Discounts
                </h3>
                {applicableDiscounts.map((discount: any) => (
                  <div key={discount.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {discount.marketing_label || discount.name}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {discount.type === "percentage" ? `${discount.value}% ${t("off")}` : `${formatPrice(discount.value)} ${t("off")}`}
                          {discount.scope === "products" && ` - ${t("Applies to this product")}`}
                          {discount.scope === "store_wide" && ` - ${t("Store-wide")}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      {discount.min_cart_subtotal > 0 && (
                        <p>• {t("Minimum cart")}: {formatPrice(discount.min_cart_subtotal)}</p>
                      )}
                      {discount.min_quantity > 0 && (
                        <p>• {t("Minimum quantity")}: {discount.min_quantity}</p>
                      )}
                      {discount.per_customer_limit && (
                        <p>• {t("Limit")}: {discount.per_customer_limit} {t("use")}{discount.per_customer_limit > 1 ? 's' : ''} {t("per customer")}</p>
                      )}
                      {discount.first_order_only && (
                        <p>• {t("First order only")}</p>
                      )}
                      {discount.end_date && (
                        <p>• {t("Valid until")}: {new Date(discount.end_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-green-600 dark:text-green-400 italic">
                  ✓ {t("Discount will be automatically applied at checkout when conditions are met")}
                </p>
              </div>
            )}

            {/* Color Selection - Must select first */}
            {variants.length > 0 && productColors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">
                  {t("Select Color")} <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {productColors.map((colorData, idx) => {
                    const colorId = colorData.color_id;
                    const colorName = (colorData.colors as any)?.name || '';
                    const colorHex = (colorData.colors as any)?.hex_code || '#000000';
                    const hasStock = variants.some((v: any) => v.color_id === colorId && v.stock_quantity > 0);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => hasStock && handleColorSelect(colorId, colorName)}
                        disabled={!hasStock}
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColorId === colorId
                            ? "border-primary scale-110 ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary"
                        } ${!hasStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: colorHex }}
                        title={`${colorName}${!hasStock ? ` (${t("Out of Stock")})` : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection - Filtered by color */}
            {variants.length > 0 && availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">
                  {t("Select Size")} <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSizes.map((sizeVariant: any) => (
                    <button
                      key={sizeVariant.id}
                      onClick={() => handleSizeSelect(sizeVariant.size)}
                      disabled={sizeVariant.stock_quantity === 0}
                      className={`py-2 px-3 rounded-md border-2 transition-all text-sm sm:text-base ${
                        selectedSize === sizeVariant.size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      } ${sizeVariant.stock_quantity === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {sizeVariant.size}
                      {sizeVariant.stock_quantity === 0 && (
                        <span className="block text-xs">{t("Out of Stock")}</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedSize && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("Stock available")}: {availableSizes.find((v: any) => v.size === selectedSize)?.stock_quantity || 0}
                  </p>
                )}
              </div>
            )}

            {/* Legacy: No variants - show old size/color system */}
            {variants.length === 0 && product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">{t("Select Size")} (EU)</label>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-3 rounded-md border-2 transition-all text-sm sm:text-base ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variants.length === 0 && productColors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">{t("Select Color")}</label>
                <div className="flex gap-2">
                  {productColors.map((colorData, idx) => {
                    const colorName = (colorData.colors as any)?.name || '';
                    const colorHex = (colorData.colors as any)?.hex_code || '#000000';
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const colorLower = colorName.toLowerCase();
                          setSelectedColor(colorLower);
                          if (colorImageMap[colorLower]) {
                            setSelectedImageUrl(colorImageMap[colorLower]);
                          }
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === colorName.toLowerCase()
                            ? "border-primary scale-110 ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary"
                        }`}
                        style={{ backgroundColor: colorHex }}
                        title={colorName}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-3">{t("Quantity")}</label>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-lg sm:text-xl font-semibold w-8 sm:w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const maxStock = variants.length > 0 && selectedVariantId
                      ? availableSizes.find((v: any) => v.id === selectedVariantId)?.stock_quantity || product.stock_quantity
                      : product.stock_quantity;
                    if (quantity < maxStock) {
                      setQuantity(quantity + 1);
                    }
                  }}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  disabled={(() => {
                    const maxStock = variants.length > 0 && selectedVariantId
                      ? availableSizes.find((v: any) => v.id === selectedVariantId)?.stock_quantity || product.stock_quantity
                      : product.stock_quantity;
                    return quantity >= maxStock;
                  })()}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {variants.length > 0 && selectedVariantId
                    ? `${availableSizes.find((v: any) => v.id === selectedVariantId)?.stock_quantity || 0} ${t("available")}`
                    : `${product.stock_quantity} ${t("available")}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 sm:space-y-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                onClick={async () => {
                  if (!user) {
                    setShowSignInPopup(true);
                    return;
                  }
                  
                  // Require variant selection if variants exist
                  if (variants.length > 0) {
                    if (!selectedColorId || !selectedSize) {
                      toast.error(t("Please select both color and size before adding to cart"));
                      return;
                    }
                    if (!selectedVariantId) {
                      toast.error(t("Selected variant is out of stock"));
                      return;
                    }
                    
                    // Validate quantity against variant stock
                    const selectedVariant = availableSizes.find((v: any) => v.id === selectedVariantId);
                    if (selectedVariant && quantity > selectedVariant.stock_quantity) {
                      toast.error(t("Only") + ` ${selectedVariant.stock_quantity} ` + t("items available for this variant"));
                      return;
                    }
                  } else {
                    // Validate quantity against product stock for non-variant products
                    if (quantity > product.stock_quantity) {
                      toast.error(t("Only") + ` ${product.stock_quantity} ` + t("items available"));
                      return;
                    }
                  }
                  
                  if (id) {
                    try {
                      await addToCart({ 
                        productId: id, 
                        quantity,
                        selectedColor: selectedColor,
                        selectedSize: selectedSize,
                        variantId: selectedVariantId || undefined,
                        variantPrice: variants.length > 0 ? currentPrice : undefined,
                      });
                      toast.success(t("Added") + ` ${quantity} ${product.name} ` + t("to cart"));
                    } catch (error) {
                      console.error('Error adding to cart:', error);
                      toast.error(t("Failed to add to cart"));
                    }
                  }
                }}
                disabled={(() => {
                  if (variants.length > 0) {
                    return !selectedVariantId || availableSizes.find((v: any) => v.id === selectedVariantId)?.stock_quantity === 0;
                  }
                  return product.stock_quantity === 0;
                })()}
              >
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {(() => {
                  if (variants.length > 0 && selectedVariantId) {
                    const variantStock = availableSizes.find((v: any) => v.id === selectedVariantId)?.stock_quantity || 0;
                    return variantStock > 0 ? t("Add to Cart") : t("Out of Stock");
                  }
                  return product.stock_quantity > 0 ? t("Add to Cart") : t("Out of Stock");
                })()}
              </Button>
              <div className="flex gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
                  onClick={async () => {
                    if (!user) {
                      setShowSignInPopup(true);
                      return;
                    }
                    
                    if (!id) return;
                    
                    try {
                      if (isInWishlist) {
                        // Remove from wishlist
                        const { error } = await supabase
                          .from("wishlist")
                          .delete()
                          .eq("user_id", user.id)
                          .eq("product_id", id);
                        
                        if (error) throw error;
                        
                        setIsInWishlist(false);
                        toast.success(t("Removed from wishlist"));
                      } else {
                        // Add to wishlist
                        const { error } = await supabase
                          .from("wishlist")
                          .insert({
                            user_id: user.id,
                            product_id: id,
                          });
                        
                        if (error) throw error;
                        
                        setIsInWishlist(true);
                        toast.success(t("Added to wishlist"));
                      }
                    } catch (error) {
                      console.error("Wishlist error:", error);
                      toast.error(t("Failed to update wishlist"));
                    }
                  }}
                >
                  <Heart className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist ? "fill-current text-primary" : ""}`} />
                  {isInWishlist ? t("In Wishlist") : t("Wishlist")}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
                    >
                      <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {t("Share")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(url);
                        toast.success(t("Link copied to clipboard!"));
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {t("Copy Link")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const url = window.location.href;
                        const text = `${t("Check out")} ${product.name} ${t("on PEAK Syria")}`;
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t("Share on WhatsApp")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="border-t pt-4 sm:pt-6 space-y-3">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-5xl mx-auto mt-12 space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("Customer Reviews")}</h2>
          
          {user ? (
            <ReviewForm productId={id!} onSuccess={refetchReviews} />
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                {t("Please log in to write a review")}
              </p>
              <Button onClick={() => setShowSignInPopup(true)} variant="outline">
                {t("Log In")}
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold mb-4">
              {t("Reviews")} ({reviews.length})
            </h3>
            <ReviewsList reviews={reviews as any} />
          </div>
        </div>
      </div>

      <Footer />
      
      <GoogleSignInPopup open={showSignInPopup} onOpenChange={setShowSignInPopup} />
    </div>
  );
};

export default ProductDetail;
