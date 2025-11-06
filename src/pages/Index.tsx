import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HomeBanners from "@/components/HomeBanners";
import ProductShowcase from "@/components/ProductShowcase";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PromoBanner from "@/components/PromoBanner";
import PercentageLoader from "@/components/PercentageLoader";
import { OrderStatusBanner } from "@/components/OrderStatusBanner";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { t } = useLanguage();

  // Fetch featured products from database (New Arrivals only)
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("flag", "New Arrival")
        .order("created_at", { ascending: false })
        .limit(8);

      if (productsError) throw productsError;

      // Fetch ALL product images (not just primary)
      const { data: allImagesData } = await supabase
        .from("product_images")
        .select("id, product_id, image_url, is_primary");

      // Fetch product colors with images
      const { data: productColorsData } = await supabase
        .from("product_colors")
        .select(`
          product_id,
          image_id,
          colors:color_id (
            name,
            hex_code
          )
        `);

      // Map images and colors to products
      const productsWithImages = productsData.map((product) => {
        const primaryImage = allImagesData?.find((img) => img.product_id === product.id && img.is_primary);
        const productColorsForItem = productColorsData?.filter((pc) => pc.product_id === product.id) || [];
        
        const productColors = productColorsForItem
          .map((pc) => (pc.colors as any)?.name?.toLowerCase() || '')
          .filter(Boolean);

        // Create color to image mapping
        const colorImages: Record<string, string> = {};
        for (const pc of productColorsForItem) {
          const colorName = (pc.colors as any)?.name?.toLowerCase();
          if (colorName && pc.image_id) {
            // Find the specific image by image_id
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
          targetGender: product.target_gender,
          flag: product.flag,
        };
      });

      return productsWithImages;
    },
  });

  // Fetch root categories only (no parent)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, description, parent_id, image_url")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("display_order");

      if (error) throw error;
      
      // Check which categories have children
      const categoryIds = data?.map(c => c.id) || [];
      const { data: childrenData } = await supabase
        .from("categories")
        .select("parent_id")
        .in("parent_id", categoryIds)
        .eq("is_active", true);
      
      const categoriesWithChildren = new Set(
        childrenData?.map(c => c.parent_id) || []
      );
      
      return (data || []).map(category => ({
        id: category.id,
        name: category.name,
        description: category.description || t(`Explore our ${category.name.toLowerCase()} collection`),
        path: category.name.toLowerCase(),
        icon: TrendingUp,
        hasChildren: categoriesWithChildren.has(category.id),
        image_url: category.image_url,
      }));
    },
  });

  if (isLoading) {
    return <PercentageLoader message={t("Loading homepage...")} />;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <PromoBanner />
      <Navbar />
      <OrderStatusBanner />
      <HeroSection />
      <WhatsAppButton />

      {/* Promotional Banners */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <HomeBanners />
      </div>

      {/* Featured Products */}
      <section className="pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">{t("Featured Collection")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              {t("Discover our handpicked selection of premium sportswear")}
            </p>
          </div>

          {/* Featured Products Carousel */}
          <div className="relative carousel-container mb-8">
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = document.getElementById('featured-scroll');
                if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background shadow-lg rounded-full p-3 opacity-0 carousel-container:hover:opacity-100 transition-opacity pointer-events-auto"
              aria-label="Scroll left"
            >
              <ArrowRight className="h-6 w-6 rotate-180" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = document.getElementById('featured-scroll');
                if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background shadow-lg rounded-full p-3 opacity-0 carousel-container:hover:opacity-100 transition-opacity pointer-events-auto"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-6 w-6" />
            </button>

            <div id="featured-scroll" className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 sm:gap-6 pb-4" style={{ width: 'max-content' }}>
                {featuredProducts.map((product, index) => (
                  <div 
                    key={product.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="animate-fade-in w-[230px] sm:w-[280px] flex-shrink-0 isolate"
                  >
                    <ProductCardEnhanced {...product} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/products">
              <Button variant="default" size="sm" className="group w-full sm:w-auto text-xs sm:text-base h-8 sm:h-10 px-4 sm:px-6">
                {t("View All Products")}
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pt-6 sm:pt-8 pb-6 sm:pb-16 bg-muted/50 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">{t("Shop by Category")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">{t("Find your perfect sport")}</p>
          </div>

          {/* Categories Carousel */}
          <div className="relative carousel-container">
            {/* Left Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = document.getElementById('categories-scroll');
                if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
              }}
              className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background shadow-lg rounded-full p-3 opacity-0 carousel-container:hover:opacity-100 transition-opacity pointer-events-auto"
              aria-label="Scroll left"
            >
              <ArrowRight className="h-6 w-6 rotate-180" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const container = document.getElementById('categories-scroll');
                if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
              }}
              className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/90 hover:bg-background shadow-lg rounded-full p-3 opacity-0 carousel-container:hover:opacity-100 transition-opacity pointer-events-auto"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-6 w-6" />
            </button>

            <div id="categories-scroll" className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 sm:gap-6 md:gap-8 pb-4" style={{ width: 'max-content' }}>
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <Link
                      key={category.id}
                      to={category.hasChildren ? `/categories/${category.id}` : `/products?category=${category.path}`}
                      style={{ animationDelay: `${index * 150}ms` }}
                      className="group bg-card rounded-lg shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden w-[200px] sm:w-[280px] md:w-[280px] flex-shrink-0"
                    >
                      {/* Category Image */}
                      {category.image_url ? (
                        <div className="h-[140px] sm:aspect-video md:w-[280px] overflow-hidden bg-muted relative">
                          <img
                            src={category.image_url}
                            alt={t(category.name)}
                            width="320"
                            height="180"
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <div className="h-[140px] sm:aspect-video md:w-[320px] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Icon className="h-10 w-10 sm:h-16 sm:w-16 text-primary/40" />
                        </div>
                      )}
                      
                      {/* Category Content */}
                      <div className="p-4 sm:p-6 md:p-8">
                        <div className="flex flex-col items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                          <h3 className="text-base sm:text-xl md:text-2xl font-bold group-hover:text-primary transition-colors text-center">{t(category.name)}</h3>
                        </div>
                        <p className="text-muted-foreground mb-2 sm:mb-4 text-xs sm:text-sm md:text-base text-center line-clamp-2">{t(category.description)}</p>
                        <div className="flex items-center justify-center text-primary font-semibold group-hover:gap-3 transition-all text-xs sm:text-sm md:text-base">
                          {t("Explore Collection")}
                          <ArrowRight className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <ProductShowcase />

      {/* Trust Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-secondary text-secondary-foreground overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
              <div className="bg-primary/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{t("100% Authentic")}</h3>
              <p className="text-secondary-foreground/80 text-sm sm:text-base lg:text-lg">{t("Official PEAK distributor in Syria")}</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <div className="bg-primary/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{t("Fast Delivery")}</h3>
              <p className="text-secondary-foreground/80 text-sm sm:text-base lg:text-lg">{t("Quick shipping across Syria")}</p>
            </div>
            <div className="animate-fade-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: "300ms" }}>
              <div className="bg-primary/20 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{t("Premium Quality")}</h3>
              <p className="text-secondary-foreground/80 text-sm sm:text-base lg:text-lg">{t("World-class sportswear")}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
