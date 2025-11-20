import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  offer_price?: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  rating?: number;
  sizes?: string[];
  flag?: string | null;
  colorHexMap?: Record<string, string>;
  colorImages?: Record<string, string>;
};

const FlagProducts = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const flagFromUrl = searchParams.get("flag") || "";
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Fetch hero slide info for this flag
  const { data: heroSlide } = useQuery({
    queryKey: ["hero-slide", flagFromUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("flag_name", flagFromUrl)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!flagFromUrl,
  });

  // Fetch products with this flag
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["flag-products", flagFromUrl],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("flag", flagFromUrl)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

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

      return productsWithImages;
    },
    enabled: !!flagFromUrl,
  });

  const pageTitle = flagFromUrl || "Products";
  const pageDescription = heroSlide?.subtitle || `Browse our ${flagFromUrl} collection`;

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = products.slice(startIndex, endIndex);

  // Reset to page 1 when flag changes
  useEffect(() => {
    setCurrentPage(1);
  }, [flagFromUrl]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle} | PEAK Syria</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${flagFromUrl}, sports shoes, athletic footwear, PEAK Syria`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        {/* Hero Section */}
        {heroSlide && (
          <section 
            className="relative h-[300px] md:h-[400px] bg-cover bg-center"
            style={{
              backgroundImage: heroSlide.image_url ? `url(${heroSlide.image_url})` : 'none',
              backgroundColor: heroSlide.image_url ? 'transparent' : 'hsl(var(--secondary))'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 text-primary text-sm font-semibold">
                  <span className="text-xs">✨</span>
                  {t(flagFromUrl)}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                  {t(heroSlide.title)}
                </h1>
                <p className="text-lg md:text-xl text-white/90">
                  {t(heroSlide.subtitle)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {t(flagFromUrl)} {t("Collection")}
            </h2>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? t("product") : t("products")} {t("found")}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("No products found")}</h3>
              <p className="text-muted-foreground">
                {t("Check back soon for")} {t(flagFromUrl)} {t("products")}!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCardEnhanced
                    key={product.id}
                    {...product}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent className="flex-wrap gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((pageNum, idx) => (
                      <PaginationItem key={idx}>
                        {pageNum === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum as number)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FlagProducts;
