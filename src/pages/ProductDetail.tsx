import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Heart, Share2, ArrowLeft, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
};

const ProductDetail = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [colorImageMap, setColorImageMap] = useState<Record<string, string>>({});

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
            <div className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-zoom-in">
              <img 
                src={selectedImageUrl || images[0]?.image_url || "/placeholder.svg"} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-125" 
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
                onClick={() => toast.success("Added to cart!")}
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
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
