import { ShoppingCart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
}

const ProductCard = ({ id, name, price, image, category, isNew }: ProductCardProps) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    // Always navigate to product detail page for variant selection
    navigate(`/product/${id}`);
  };

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={t(name)}
          width="280"
          height="280"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-secondary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Link to={`/product/${id}`}>
            <Button variant="outlineWhite" size="icon">
              <Eye className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="hero" size="icon" onClick={handleAddToCart}>
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>

        {/* Badges */}
        {isNew && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">
            New
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{category}</p>
        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-1">{t(name)}</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">{price.toLocaleString()} SYP</span>
          <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
