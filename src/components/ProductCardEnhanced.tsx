import { useState } from "react";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductCardEnhancedProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  colors?: string[];
  sizes?: string[];
  rating?: number;
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
}: ProductCardEnhancedProps) => {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#E31E24",
    gray: "#808080",
    blue: "#0066CC",
  };

  return (
    <>
      <div className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Overlay on Hover */}
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
                onClick={() => setIsFavorite(!isFavorite)}
                className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            </div>
            <Button
              variant="hero"
              size="lg"
              className="w-5/6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t("product.addToCart")}
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isNew && (
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg animate-scale-in">
                {t("product.new")}
              </div>
            )}
          </div>

          {/* Favorite Icon (Always Visible) */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
          <Link to={`/product/${id}`}>
            <h3 className="font-semibold text-card-foreground hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
              {name}
            </h3>
          </Link>

          {/* Colors */}
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  selectedColor === color ? "border-primary scale-110 ring-2 ring-primary ring-offset-2" : "border-border"
                }`}
                style={{ backgroundColor: colorMap[color] || color }}
                title={color}
              />
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-sm ${i < Math.floor(rating) ? "text-primary" : "text-muted-foreground"}`}>
                ★
              </span>
            ))}
            <span className="text-xs text-muted-foreground ml-1">({rating})</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xl font-bold text-primary">{formatPrice(price)}</span>
            <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
              View Details
            </Button>
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
              <img src={image} alt={name} className="w-full h-full object-cover" />
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
                    <div
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: colorMap[color] || color }}
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
                <Button variant="hero" size="lg" className="w-full">
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
