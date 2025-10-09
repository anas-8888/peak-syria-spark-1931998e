import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft } from "lucide-react";
import productShoes1 from "@/assets/product-shoes-1.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("42");

  const sizes = ["38", "39", "40", "41", "42", "43", "44", "45"];

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
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={productShoes1} alt="Product" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <img src={productShoes1} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 sm:mb-4">
                New Arrival
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Peak Basketball Pro X</h1>
              <p className="text-muted-foreground text-sm sm:text-base">SKU: PEAK-BBX-001</p>
            </div>

            <div className="text-2xl sm:text-3xl font-bold text-primary">$45</div>

            <p className="text-muted-foreground leading-relaxed">
              Experience peak performance with our flagship basketball shoe. Featuring advanced cushioning technology,
              superior grip, and premium materials designed for professional athletes. The Pro X delivers unmatched
              court feel and explosive power for your game.
            </p>

            {/* Size Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3">Select Size (EU)</label>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map((size) => (
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
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 sm:space-y-4">
              <Button variant="hero" size="lg" className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold">
                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Add to Cart
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
            <div className="border-t pt-4 sm:pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-sm sm:text-base">Premium cushioning technology</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-sm sm:text-base">Advanced grip pattern</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-sm sm:text-base">Breathable mesh upper</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <span className="text-sm sm:text-base">Reinforced ankle support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
