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
  viewMode?: "grid" | "list";
  targetGender?: string;
  flag?: string;
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
  viewMode = "grid",
  targetGender,
  flag,
}: ProductCardEnhancedProps) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImage, setCurrentImage] = useState(image);
  const [isLoading, setIsLoading] = useState(false);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
        .single();

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
    if (!user) {
      toast.error("Please log in to add items to cart");
      navigate("/login");
      return;
    }
    await addToCart(id, 1);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to add items to your wishlist");
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
        toast.success("Removed from wishlist");
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
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error("Failed to update wishlist");
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

  return (
    <>
      <div className={`group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-in ${
        viewMode === "list" ? "flex flex-col sm:flex-row" : ""
      }`}>
        {/* Product Image */}
        <div className={`relative overflow-hidden bg-muted ${
          viewMode === "list" ? "w-full sm:w-48 h-48 sm:h-48 flex-shrink-0" : "aspect-square"
        }`}>
          <img
            src={currentImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Overlay on Hover - Only in grid mode */}
          {viewMode === "grid" && (
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-end gap-3 pb-6">
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
                {t("product.addToCart")}
              </Button>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && (
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg animate-scale-in">
                {t("product.new")}
              </div>
            )}
            {targetGender && targetGender !== 'both' && (
              <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg">
                {targetGender === 'men' ? "MEN" : "WOMEN"}
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
        <div className={`space-y-2 sm:space-y-3 ${viewMode === "list" ? "flex-1 p-4 sm:p-6 flex flex-col" : "p-3 sm:p-4"}`}>
          <div className={viewMode === "list" ? "flex-1" : ""}>
            <p className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
            <Link to={`/product/${id}`}>
              <h3 className={`font-semibold text-card-foreground hover:text-primary transition-colors line-clamp-2 ${
                viewMode === "list" ? "text-base sm:text-lg mt-1" : "text-xs sm:text-base min-h-[2.5rem] sm:min-h-[3rem]"
              }`}>
                {name}
              </h3>
            </Link>
          </div>

          {/* Colors */}
          <div className="flex gap-1 sm:gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border transition-all ${
                  selectedColor === color ? "border-primary scale-110 ring-1 sm:ring-2 ring-primary ring-offset-1 sm:ring-offset-2" : "border-border"
                }`}
                style={{ backgroundColor: colorMap[color] || color }}
                title={color}
              />
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-xs sm:text-sm ${i < Math.floor(rating) ? "text-primary" : "text-muted-foreground"}`}>
                ★
              </span>
            ))}
            <span className="text-xs sm:text-xs text-muted-foreground ml-0.5 sm:ml-1">({rating})</span>
          </div>

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="text-xs sm:text-xs text-muted-foreground">
              Sizes: {sizes.join(", ")}
            </div>
          )}

          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${viewMode === "list" ? "justify-between mt-auto pt-4 border-t" : "justify-between pt-1.5 sm:pt-2 border-t"}`}>
            <span className={`font-bold text-primary ${viewMode === "list" ? "text-xl sm:text-2xl" : "text-sm sm:text-xl"}`}>{formatPrice(price)}</span>
            {viewMode === "list" ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuickViewOpen(true)}
                  className="flex-shrink-0"
                >
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant={isFavorite ? "hero" : "outline"}
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={isLoading}
                  className="flex-shrink-0"
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? "fill-current" : ""}`} />
                </Button>
                <Button variant="hero" size="default" className="flex-1 sm:flex-initial" asChild>
                  <Link to={`/product/${id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 text-[9px] sm:text-sm h-6 sm:h-9 px-2 sm:px-4" asChild>
                <Link to={`/product/${id}`}>
                  View Details
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
            <DialogTitle>Quick View</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={currentImage} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase">{category}</p>
                <h2 className="text-2xl font-bold">{name}</h2>
              </div>
              <div className="text-3xl font-bold text-primary">{formatPrice(price)}</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < Math.floor(rating) ? "text-primary" : "text-muted-foreground"}`}>
                    ★
                  </span>
                ))}
                <span className="text-sm text-muted-foreground ml-2">({rating} / 5)</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("product.colors")}:</h4>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? "border-primary scale-110 ring-2 ring-primary ring-offset-2" : "border-border"
                      }`}
                      style={{ backgroundColor: colorMap[color] || color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t("product.sizes")}:</h4>
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
                  View Full Details
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
