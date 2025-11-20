import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import PromoBanner from "@/components/PromoBanner";
import PercentageLoader from "@/components/PercentageLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X, TrendingUp } from "lucide-react";
import { debounce } from "lodash-es";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  name: string;
  price: number;
  offer_price?: number | null;
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
  description?: string | null;
}

const Search = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Anchor for dropdown positioning
  const inputWrapperRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<any>({});

  useLayoutEffect(() => {
    if (!showSuggestions) return;
    const el = inputWrapperRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', left: rect.left, top: rect.bottom + 8, width: rect.width, zIndex: 9999 });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [showSuggestions]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Fetch all products and related data
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (productsError) throw productsError;

      // Fetch images
      const { data: allImagesData } = await supabase
        .from("product_images")
        .select("id, product_id, image_url, is_primary");

      // Fetch product colors with display order
      const { data: productColorsData } = await supabase
        .from("product_colors")
        .select(`
          product_id,
          image_id,
          display_order,
          colors:color_id (
            name,
            hex_code
          )
        `);

      const productsWithImages = productsData.map((product) => {
        const primaryImage = allImagesData?.find((img) => img.product_id === product.id && img.is_primary);
        const productColorsForItem = productColorsData?.filter((pc) => pc.product_id === product.id) || [];
        
        const productColors = productColorsForItem
          .map((pc) => (pc.colors as any)?.name?.toLowerCase() || '')
          .filter(Boolean);

        // Create color to image mapping - use first image (lowest display_order) for each color
        const colorImages: Record<string, string> = {};
        const colorHexMap: Record<string, string> = {};
        
        // Group by color and sort by display_order
        const colorGroups: Record<string, any[]> = {};
        for (const pc of productColorsForItem) {
          const colorName = (pc.colors as any)?.name?.toLowerCase();
          if (colorName) {
            if (!colorGroups[colorName]) {
              colorGroups[colorName] = [];
            }
            colorGroups[colorName].push(pc);
          }
        }
        
        // For each color, get the first image by display_order
        for (const [colorName, colorItems] of Object.entries(colorGroups)) {
          const sortedItems = colorItems.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          const firstItem = sortedItems[0];
          
          const rawHex = (firstItem.colors as any)?.hex_code?.trim();
          if (rawHex) {
            const normalizedHex = rawHex.startsWith("#") ? rawHex : `#${rawHex}`;
            colorHexMap[colorName] = normalizedHex;
          }
          
          if (firstItem.image_id) {
            const colorImage = allImagesData?.find((img) => img.id === firstItem.image_id);
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
          description: product.description,
        };
      });

      return productsWithImages as (Product & { flag?: string; description?: string })[];
    },
  });

  // Search and filter products (supports both English and Arabic)
  const searchProducts = (query: string) => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return allProducts.filter((product) => {
      // Search in English text
      const matchNameEn = product.name.toLowerCase().includes(lowerQuery);
      const matchCategoryEn = product.category.toLowerCase().includes(lowerQuery);
      const matchFlagEn = product.flag?.toLowerCase().includes(lowerQuery);
      const matchDescriptionEn = product.description?.toLowerCase().includes(lowerQuery);
      
      // Search in Arabic translations
      const translatedName = t(product.name).toLowerCase();
      const translatedCategory = t(product.category).toLowerCase();
      const translatedFlag = product.flag ? t(product.flag).toLowerCase() : '';
      const translatedDescription = product.description ? t(product.description).toLowerCase() : '';
      
      const matchNameAr = translatedName.includes(lowerQuery);
      const matchCategoryAr = translatedCategory.includes(lowerQuery);
      const matchFlagAr = translatedFlag.includes(lowerQuery);
      const matchDescriptionAr = translatedDescription.includes(lowerQuery);
      
      // Search in colors and sizes (both English and Arabic)
      const matchColor = product.colors.some(c => {
        const colorEn = c.toLowerCase();
        const colorAr = t(c).toLowerCase();
        return colorEn.includes(lowerQuery) || colorAr.includes(lowerQuery);
      });
      
      const matchSize = product.sizes.some(s => {
        const sizeEn = s.toLowerCase();
        return sizeEn.includes(lowerQuery);
      });
      
      return matchNameEn || matchNameAr || 
             matchCategoryEn || matchCategoryAr || 
             matchFlagEn || matchFlagAr || 
             matchColor || matchSize || 
             matchDescriptionEn || matchDescriptionAr;
    });
  };

  const results = searchQuery ? searchProducts(searchQuery) : [];

  // Get suggestions for autocomplete (supports both English and Arabic)
  const getSuggestions = (query: string) => {
    if (!query.trim() || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    allProducts.forEach((product) => {
      // Check English name
      if (product.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(product.name);
      }
      // Check Arabic translation of name
      const translatedName = t(product.name).toLowerCase();
      if (translatedName.includes(lowerQuery) && translatedName !== product.name.toLowerCase()) {
        suggestions.add(t(product.name));
      }
      
      // Check English category
      if (product.category.toLowerCase().includes(lowerQuery)) {
        suggestions.add(product.category);
      }
      // Check Arabic translation of category
      const translatedCategory = t(product.category).toLowerCase();
      if (translatedCategory.includes(lowerQuery) && translatedCategory !== product.category.toLowerCase()) {
        suggestions.add(t(product.category));
      }
      
      // Check English flag
      if (product.flag?.toLowerCase().includes(lowerQuery)) {
        suggestions.add(product.flag);
      }
      // Check Arabic translation of flag
      if (product.flag) {
        const translatedFlag = t(product.flag).toLowerCase();
        if (translatedFlag.includes(lowerQuery) && translatedFlag !== product.flag.toLowerCase()) {
          suggestions.add(t(product.flag));
        }
      }
      
      // Check colors (both English and Arabic)
      product.colors.forEach(color => {
        const colorEn = color.toLowerCase();
        const colorAr = t(color).toLowerCase();
        if (colorEn.includes(lowerQuery)) {
          suggestions.add(color.charAt(0).toUpperCase() + color.slice(1));
        }
        if (colorAr.includes(lowerQuery) && colorAr !== colorEn) {
          suggestions.add(t(color));
        }
      });
    });

    return Array.from(suggestions).slice(0, 8);
  };

  const suggestions = getSuggestions(searchQuery);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value)}`);
        saveSearch(value);
      }
    }, 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    saveSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/search');
  };

  const removeRecentSearch = (search: string) => {
    const updated = recentSearches.filter(s => s !== search);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  if (productsLoading) {
    return <PercentageLoader message={t("Loading...")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PromoBanner />
      <Navbar />

      {/* Search Section */}
      <section className="relative z-20 bg-gradient-to-br from-secondary via-secondary to-secondary/80 py-12 sm:py-16 pb-32 text-secondary-foreground overflow-visible">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(227,30,36,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(227,30,36,0.2),transparent_50%)]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-center animate-fade-in">
            {t("Search Products")}
          </h1>

          {/* Search Input */}
          <div className="relative z-[200]" ref={inputWrapperRef}>
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Search by name, category, color, size, flag...")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-12 py-6 text-lg rounded-full bg-background/95 backdrop-blur-sm border-2 border-border focus:border-primary transition-all"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions &&
              createPortal(
                <div style={dropdownStyle} className="bg-card/100 backdrop-blur-xl border-2 border-border rounded-2xl shadow-2xl animate-fade-in max-h-96 overflow-y-auto">
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="p-2 border-b bg-card/100 backdrop-blur-xl">
                      <p className="text-xs text-muted-foreground px-3 py-2 font-semibold">{t("Recent Searches")}</p>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent rounded-lg transition-colors group"
                        >
                          <span className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{search}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(search);
                            }}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {suggestions.length > 0 ? (
                    <div className="p-2 bg-card/100 backdrop-blur-xl">
                      <p className="text-xs text-muted-foreground px-3 py-2 font-semibold">{t("Suggestions")}</p>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <span className="text-sm flex items-center gap-2">
                            <SearchIcon className="h-4 w-4 text-muted-foreground" />
                            {suggestion}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-card/100 text-muted-foreground">
                      <p className="text-sm">{t("No suggestions. Try different keywords.")}</p>
                    </div>
                  )}
                </div>,
                document.body
              )
            }


          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchQuery ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {t("Search Results for")} "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {t("Found")} {results.length} {results.length === 1 ? t("product") : t("products")}
                </p>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {results.map((product, index) => (
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
                  <SearchIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">{t("No results found")}</h2>
                  <p className="text-muted-foreground mb-6">
                    {t("Try adjusting your search terms or browse all products")}
                  </p>
                  <a
                    href="/products"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
                  >
                    {t("View All Products")}
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <SearchIcon className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">{t("Start Your Search")}</h2>
              <p className="text-muted-foreground">
                {t("Search for products by name, category, color, size, or any keyword")}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Search;
