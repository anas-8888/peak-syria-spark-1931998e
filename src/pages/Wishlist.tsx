import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import PromoBanner from "@/components/PromoBanner";
import PercentageLoader from "@/components/PercentageLoader";
import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import GoogleSignInPopup from "@/components/GoogleSignInPopup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  offerPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  unifiedPricing?: boolean;
  image: string;
  category: string;
  isNew: boolean;
  colors: string[];
  sizes: string[];
  rating: number;
  colorImages?: Record<string, string>;
  colorHexMap?: Record<string, string>;
  targetGender?: string;
  flag?: string | null;
}

const Wishlist = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const { data: wishlistProducts = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      if (wishlistError) throw wishlistError;

      if (!wishlistData || wishlistData.length === 0) return [];

      const productIds = wishlistData.map(w => w.product_id);

      // Get products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("is_active", true);

      if (productsError) throw productsError;

      // Fetch product images
      const { data: allImagesData } = await supabase
        .from("product_images")
        .select("id, product_id, image_url, is_primary")
        .in("product_id", productIds);

      // Fetch product colors
      const { data: productColorsData } = await supabase
        .from("product_colors")
        .select(`
          product_id,
          image_id,
          colors:color_id (
            name,
            hex_code
          )
        `)
        .in("product_id", productIds);

      const productsWithImages = productsData.map((product) => {
        const primaryImage = allImagesData?.find((img) => img.product_id === product.id && img.is_primary);
        const productColorsForItem = productColorsData?.filter((pc) => pc.product_id === product.id) || [];
        
        const productColors = productColorsForItem
          .map((pc) => (pc.colors as any)?.name?.toLowerCase() || '')
          .filter(Boolean);

        // Create color to image mapping
        const colorImages: Record<string, string> = {};
      const colorHexMap: Record<string, string> = {};
        for (const pc of productColorsForItem) {
          const colorName = (pc.colors as any)?.name?.toLowerCase();
        const rawHex = (pc.colors as any)?.hex_code?.trim();
        if (colorName && rawHex) {
          const normalizedHex = rawHex.startsWith("#") ? rawHex : `#${rawHex}`;
          colorHexMap[colorName] = normalizedHex;
        }
          if (colorName && pc.image_id) {
            const colorImage = allImagesData?.find((img) => img.id === pc.image_id);
            if (colorImage) {
              colorImages[colorName] = colorImage.image_url;
            }
          }
        }

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          offerPrice: product.offer_price,
          minPrice: product.min_price,
          maxPrice: product.max_price,
          unifiedPricing: product.unified_pricing,
          image: primaryImage?.image_url || product.image_url || '',
          category: product.category,
          isNew: product.flag === 'New Arrival',
          colors: productColors || [],
          sizes: product.sizes || [],
          rating: product.rating || 0,
          colorImages: Object.keys(colorImages).length > 0 ? colorImages : undefined,
        colorHexMap: Object.keys(colorHexMap).length > 0 ? colorHexMap : undefined,
          targetGender: product.target_gender,
          flag: product.flag,
        };
      });

      return productsWithImages as WishlistProduct[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <PercentageLoader message={t("Loading...")} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PromoBanner />
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 sm:py-16 md:py-20">
          <Card className="max-w-md mx-4 my-8 sm:my-12">
            <CardContent className="pt-6 pb-6 sm:pt-8 sm:pb-8 text-center">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">{t("My Wishlist")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("Please log in to view your wishlist and save your favorite products.")}
              </p>
              <Button onClick={() => setLoginModalOpen(true)}>{t("Log In")}</Button>
              <GoogleSignInPopup open={loginModalOpen} onOpenChange={setLoginModalOpen} />
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PromoBanner />
      <Navbar />

      {/* Page Header */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary to-secondary/80 py-16 sm:py-20 text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(227,30,36,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(227,30,36,0.2),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold animate-fade-in">
              {t("My Wishlist")}
            </h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/80 animate-slide-in-left">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? t("item") : t("items")} {t("saved for later")}
          </p>
        </div>
      </section>

      {/* Wishlist Content */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {wishlistProducts.map((product, index) => (
                <div
                  key={product.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                >
                  <ProductCardEnhanced 
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    offerPrice={product.offerPrice}
                    minPrice={product.minPrice}
                    maxPrice={product.maxPrice}
                    unifiedPricing={product.unifiedPricing}
                    image={product.image}
                    category={product.category}
                    isNew={product.isNew}
                    colors={product.colors}
                    sizes={product.sizes}
                    rating={product.rating}
                    colorImages={product.colorImages}
                    colorHexMap={product.colorHexMap}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-card rounded-lg">
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("Your wishlist is empty")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("Start adding products you love to your wishlist!")}
              </p>
              <a
                href="/products"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
              >
                {t("View All Products")}
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Wishlist;
