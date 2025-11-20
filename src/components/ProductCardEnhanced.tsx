import { useState, useEffect } from "react";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getOptimizedImageUrl } from "@/utils/imageCache";

interface ProductCardEnhancedProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  colors?: string[];
  sizes?: string[];
  rating?: number;
  colorImages?: Record<string, string>;
  colorHexMap?: Record<string, string>;
  viewMode?: "grid" | "list";
  targetGender?: string;
  flag?: string;
  offerPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  unifiedPricing?: boolean;
}

const ProductCardEnhanced = ({
  id,
  name,
  price,
  image,
  category,
  isNew,
  colors = ["black", "white", "red"],
  sizes = ["40", "41", "42", "43"],
  rating = 4.5,
  colorImages,
  colorHexMap,
  viewMode = "grid",
  targetGender,
  flag,
  offerPrice,
  minPrice,
  maxPrice,
  unifiedPricing,
}: ProductCardEnhancedProps) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(image);
  const [isLoading, setIsLoading] = useState(false);
  const { formatPrice } = useCurrency();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Fetch approved reviews for this product to calculate real rating
  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews-card', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', id)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate average rating from approved reviews
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Use calculated rating (0 if no reviews)
  const displayRating = averageRating;

  // Update current image when image prop changes
  useEffect(() => {
    setCurrentImage(image);
    
    // Find and set the color that matches the primary image
    if (colorImages) {
      const matchingColor = Object.entries(colorImages).find(
        ([_, imageUrl]) => imageUrl === image
      );
      if (matchingColor) {
        setSelectedColor(matchingColor[0]);
      }
    }
  }, [image, colorImages]);

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user) {
        setIsFavorite(false);
        return;
      }

      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      setIsFavorite(!!data);
    };

    checkWishlist();
  }, [user, id]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (colorImages && colorImages[color]) {
      setCurrentImage(colorImages[color]);
    }
  };

  const handleAddToCart = async () => {
    // Always navigate to product detail page for variant selection
    navigate(`/product/${id}`);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error(t("Please log in to add items to your wishlist"));
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success(t("Removed from wishlist"));
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: id
          });

        if (error) throw error;
        setIsFavorite(true);
        toast.success(t("Added to wishlist"));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(t("Failed to update wishlist"));
    } finally {
      setIsLoading(false);
    }
  };

  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#E31E24",
    gray: "#808080",
    blue: "#0066CC",
  };

  const resolveColorHex = (color: string) => {
    const hex = colorHexMap?.[color];
    if (hex) return hex;
    const mapped = colorMap[color];
    if (mapped) return mapped;
    return color;
  };

  const uniqueColors = [...new Set(colors)];

  return (
    <>
      <div className={`group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-in ${
        viewMode === "list" ? "flex flex-row" : ""
      }`}>
        {/* Product Image */}
        <div className={`relative overflow-hidden bg-muted ${
          viewMode === "list" ? "w-36 sm:w-32 md:w-48 h-36 sm:h-32 md:h-48 flex-shrink-0" : "aspect-square"
        }`}>
          <img
            src={getOptimizedImageUrl(currentImage, {
              width: viewMode === "list" ? 192 : 400,
              quality: 85,
              format: 'webp'
            })}
            alt={name}
            loading="lazy"
            decoding="async"
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 192 : 400}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== '/placeholder.svg') {
                target.src = '/placeholder.svg';
              }
            }}
          />

          {/* Overlay on Hover - Only in grid mode */}
          {viewMode === "grid" && (
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden sm:flex flex-col items-center justify-end gap-3 pb-6">
              <div className="flex gap-2">
                <Button
                  variant="outlineWhite"
                  size="icon"
                  onClick={() => setQuickViewOpen(true)}
                  className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <Button
                  variant={isFavorite ? "hero" : "outlineWhite"}
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                  className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              </div>
              <Button
                variant="hero"
                size="lg"
                onClick={handleAddToCart}
                className="w-5/6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("Add to Cart")}
              </Button>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && (
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg animate-scale-in">
                {t("New")}
              </div>
            )}
          </div>

          {/* Flag Watermark */}
          {flag && (
            <div className="absolute bottom-3 left-3 bg-secondary/80 backdrop-blur-sm text-secondary-foreground px-2 py-1 rounded text-[10px] font-semibold uppercase">
              {flag}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`space-y-1 sm:space-y-1.5 md:space-y-2 ${viewMode === "list" ? "flex-1 p-1.5 sm:p-2 md:p-4 lg:p-6 flex flex-col" : "p-2 sm:p-3 md:p-4"}`}>
          <div className={viewMode === "list" ? "flex-1" : ""}>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{t(category)}</p>
            <Link to={`/product/${id}`}>
              <h3 className={`font-semibold text-card-foreground hover:text-primary transition-colors ${
                viewMode === "list" ? "text-sm sm:text-base md:text-lg mt-1 line-clamp-2" : "text-xs sm:text-base min-h-[2.5rem] sm:min-h-[3rem] line-clamp-2"
              }`}>
                {t(name)}
              </h3>
            </Link>
            {targetGender && targetGender !== "both" && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {targetGender === "men" ? t("Men's") : t("Women's")}
              </p>
            )}
          </div>

          {/* Colors */}
          <div className="flex gap-1 sm:gap-3">
            {[...new Set(colors)].slice(0, viewMode === "list" ? 3 : colors.length).map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`rounded-full border transition-all ${
                  viewMode === "list" 
                    ? `w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-5 md:h-5 ${selectedColor === color ? "border-primary sm:scale-110 ring-1 ring-primary ring-offset-0.5" : "border-border"}`
                    : `w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-6 md:h-6 ${selectedColor === color ? "border-primary sm:scale-110 ring-1 ring-primary ring-offset-0.5" : "border-border"}`
                }`}
                style={{ backgroundColor: resolveColorHex(color) }}
                title={color}
              />
            ))}
            {viewMode === "list" && [...new Set(colors)].length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground self-center">+{[...new Set(colors)].length - 3}</span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`${viewMode === "list" ? "text-[10px] sm:text-xs md:text-sm" : "text-xs sm:text-sm"} ${i < Math.floor(displayRating) ? "text-primary" : "text-muted-foreground"}`}>
                ★
              </span>
            ))}
            <span className={`${viewMode === "list" ? "text-[10px] sm:text-xs" : "text-xs"} text-muted-foreground ml-0.5 sm:ml-1`}>
              {reviews.length > 0 ? `${displayRating.toFixed(1)} (${reviews.length})` : '(0)'}
            </span>
          </div>

          {/* Sizes - Hide on small mobile in list view */}
          {sizes.length > 0 && (
            <div className={`${viewMode === "list" ? "hidden sm:block text-[10px] sm:text-xs" : "text-xs sm:text-xs"} text-muted-foreground`}>
              {t("Sizes")}: {sizes.slice(0, 4).join(", ")}{sizes.length > 4 && "..."}
            </div>
          )}

          <div className={`flex flex-col gap-1 sm:gap-2 md:gap-3 ${viewMode === "list" ? "justify-between mt-auto pt-1.5 sm:pt-2 md:pt-4 border-t" : "justify-center sm:justify-between pt-0.5 sm:pt-1.5 md:pt-2 border-t"}`}>
            {/* Price Display - Show range if variants exist and prices differ */}
            {minPrice && maxPrice && minPrice !== maxPrice && !unifiedPricing ? (
              <span className={`font-bold text-primary block w-full ${isRTL ? 'text-left' : 'text-left'} ${viewMode === "list" ? "text-sm sm:text-base md:text-xl lg:text-2xl" : "text-base sm:text-sm md:text-xl"}`} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                {formatPrice(minPrice)} - {formatPrice(maxPrice)}
              </span>
            ) : offerPrice ? (
              <div className={`flex items-center gap-1 sm:gap-2 w-full ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <span className={`font-bold text-primary ${viewMode === "list" ? "text-sm sm:text-base md:text-xl lg:text-2xl" : "text-base sm:text-sm md:text-xl"}`}>
                  {formatPrice(offerPrice)}
                </span>
                <span className={`line-through text-muted-foreground ${viewMode === "list" ? "text-xs sm:text-sm md:text-base" : "text-[8px] sm:text-xs md:text-sm"}`}>
                  {formatPrice(price)}
                </span>
              </div>
            ) : (
              <span className={`font-bold text-primary block w-full ${isRTL ? 'text-left' : 'text-left'} ${viewMode === "list" ? "text-sm sm:text-base md:text-xl lg:text-2xl" : "text-base sm:text-sm md:text-xl"}`} style={isRTL ? { textAlign: 'right' } : { textAlign: 'left' }}>
                {formatPrice(minPrice || price)}
              </span>
            )}
            
            {/* Action Buttons - Always on new line */}
            {viewMode === "list" ? (
              <div className="flex gap-2 sm:gap-1 md:gap-1.5 lg:gap-2 w-full">
                <Button
                  variant="outline"
                  size="iconXs"
                  onClick={() => setQuickViewOpen(true)}
                  className="hidden sm:flex flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 p-0"
                >
                  <Eye className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                </Button>
                <Button
                  variant={isFavorite ? "hero" : "outline"}
                  size="iconXs"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                  className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 lg:h-10 lg:w-10 p-0"
                >
                  <Heart className={`h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-4 lg:w-4 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button 
                  variant="hero" 
                  size="xs" 
                  className="flex-1 sm:flex-initial text-xs sm:text-xs md:text-sm lg:text-base h-9 sm:h-7 md:h-8 lg:h-10 px-4 sm:px-3 md:px-4 rounded-xl sm:rounded-md font-semibold max-w-[110px] sm:max-w-none shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 border-0 sm:border-0" 
                  asChild
                >
                  <Link to={`/product/${id}`}>
                    <span className="hidden sm:inline">{t("View Details")}</span>
                    <span className="sm:hidden font-medium tracking-wide">{t("View")}</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <Button size="xs" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 text-sm sm:text-xs md:text-sm h-8 sm:h-7 md:h-9 px-4 sm:px-3 md:px-4 w-full sm:w-auto" asChild>
                <Link to={`/product/${id}`}>
                  {t("View Details")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("Quick View")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img 
                src={getOptimizedImageUrl(currentImage, {
                  width: 600,
                  quality: 90,
                  format: 'webp'
                })} 
                alt={name} 
                loading="eager"
                decoding="async"
                width={600}
                height={600}
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== '/placeholder.svg') {
                    target.src = '/placeholder.svg';
                  }
                }}
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase">{t(category)}</p>
                <h2 className="text-2xl font-bold">{t(name)}</h2>
                {targetGender && targetGender !== "both" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {targetGender === "men" ? t("Men's") : t("Women's")}
                  </p>
                )}
                {flag && (
                  <div className="inline-block bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-semibold uppercase mt-2">
                    {flag}
                  </div>
                )}
              </div>
              {/* Price Display - Show range if variants exist and prices differ */}
              {minPrice && maxPrice && minPrice !== maxPrice && !unifiedPricing ? (
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                </div>
              ) : offerPrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(offerPrice)}
                  </span>
                  <span className="text-xl line-through text-muted-foreground">
                    {formatPrice(price)}
                  </span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(minPrice || price)}
                </div>
              )}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < Math.floor(displayRating) ? "text-primary" : "text-muted-foreground"}`}>
                    ★
                  </span>
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {reviews.length > 0 ? `${displayRating.toFixed(1)} (${reviews.length} ${t("Reviews").toLowerCase()})` : t("No reviews yet")}
                </span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("Colors")}:</h4>
                <div className="flex gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? "border-primary scale-110 ring-2 ring-primary ring-offset-2" : "border-border"
                      }`}
                      style={{ backgroundColor: resolveColorHex(color) }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("Sizes")}:</h4>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <div key={size} className="border-2 border-border px-3 py-1 rounded-md">
                      {size}
                    </div>
                  ))}
                </div>
              </div>
              <Link to={`/product/${id}`}>
                <Button variant="hero" size="lg" className="w-full mt-6">
                  {t("View Full Details")}
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCardEnhanced;
