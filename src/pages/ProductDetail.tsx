import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";

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
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});
  const [imageZoomOrigin, setImageZoomOrigin] = useState({ x: 50, y: 50 });

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

  // Fetch product reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles:user_id (
            full_name
          )
        `)
        .eq("product_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  // Set initial selected size
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product?.sizes, selectedSize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
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
          <div className="text-center">Product not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = product.offer_price || product.price;
  const hasDiscount = !!product.offer_price;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link to="/products" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 sm:mb-6 text-sm sm:text-base">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div 
              className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-zoom-in"
              onMouseMove={handleImageMouseMove}
            >
              <img 
                src={selectedImageUrl || images[0]?.image_url || "/placeholder.svg"} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150" 
                style={{
                  transformOrigin: `${imageZoomOrigin.x}% ${imageZoomOrigin.y}%`
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
                    <img src={image.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              {product.sku && (
                <p className="text-muted-foreground text-sm sm:text-base">SKU: {product.sku}</p>
              )}
              {product.target_gender && product.target_gender !== 'both' && (
                <div className="inline-block">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {product.target_gender === 'men' ? "Men's" : "Women's"}
                  </Badge>
                </div>
              )}
              {product.rating !== undefined && product.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">({product.rating}/5)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                ${displayPrice.toFixed(2)}
              </div>
              {hasDiscount && (
                <div className="text-lg sm:text-xl line-through text-muted-foreground">
                  ${product.price.toFixed(2)}
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
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
                          {discount.type === "percentage" ? `${discount.value}% off` : `$${discount.value} off`}
                          {discount.scope === "products" && " - Applies to this product"}
                          {discount.scope === "store_wide" && " - Store-wide"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
                      {discount.min_cart_subtotal > 0 && (
                        <p>• Minimum cart: ${discount.min_cart_subtotal.toFixed(2)}</p>
                      )}
                      {discount.min_quantity > 0 && (
                        <p>• Minimum quantity: {discount.min_quantity}</p>
                      )}
                      {discount.per_customer_limit && (
                        <p>• Limit: {discount.per_customer_limit} use{discount.per_customer_limit > 1 ? 's' : ''} per customer</p>
                      )}
                      {discount.first_order_only && (
                        <p>• First order only</p>
                      )}
                      {discount.end_date && (
                        <p>• Valid until: {new Date(discount.end_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-green-600 dark:text-green-400 italic">
                  ✓ Discount will be automatically applied at checkout when conditions are met
                </p>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">Select Size (EU)</label>
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

            {/* Color Selection */}
            {productColors.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3">Select Color</label>
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
              <label className="block text-sm font-semibold mb-3">Quantity</label>
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
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {product.stock_quantity} available
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
                    toast.error("Please log in to add items to cart");
                    navigate("/login");
                    return;
                  }
                  if (id) {
                    await addToCart(id, quantity);
                  }
                }}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
              <div className="flex gap-2 sm:gap-3">
                <Button variant="outline" size="lg" className="flex-1 h-10 sm:h-12 text-sm sm:text-base">
                  <Heart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Wishlist
                </Button>
                <Button variant="outline" size="lg" className="flex-1 h-10 sm:h-12 text-sm sm:text-base">
                  <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Share
                </Button>
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
          <h2 className="text-2xl sm:text-3xl font-bold">Customer Reviews</h2>
          
          {user ? (
            <ReviewForm productId={id!} onSuccess={refetchReviews} />
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg text-center">
              <p className="text-muted-foreground mb-4">
                Please log in to write a review
              </p>
              <Button onClick={() => navigate("/login")} variant="outline">
                Log In
              </Button>
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold mb-4">
              Reviews ({reviews.length})
            </h3>
            <ReviewsList reviews={reviews as any} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
