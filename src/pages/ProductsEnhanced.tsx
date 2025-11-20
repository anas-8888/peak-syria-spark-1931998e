import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import ProductFilters from "@/components/ProductFilters";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PromoBanner from "@/components/PromoBanner";
import PercentageLoader from "@/components/PercentageLoader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  price: number;
  offer_price?: number | null;
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
  target_gender?: string;
  flag?: string | null;
}

const ProductsEnhanced = () => {
  const { t, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  // Set default view mode to list on mobile, grid on desktop
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640 ? "list" : "grid";
    }
    return "grid";
  });
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [priceInitialized, setPriceInitialized] = useState(false);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    priceRange: [0, 1000] as [number, number],
  });

  // Fetch products from database
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch ALL product images (not just primary)
      const { data: allImagesData } = await supabase
        .from("product_images")
        .select("id, product_id, image_url, is_primary");

      // Fetch product colors with images and display order
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

      // Map images and colors to products
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
          offer_price: product.offer_price,
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
          target_gender: product.target_gender,
          flag: product.flag,
        };
      });

      return productsWithImages as Product[];
    },
  });

  // Fetch categories from database with hierarchy
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch colors that are actually used in products
  const { data: availableColors = [] } = useQuery({
    queryKey: ["colors-used-in-products"],
    queryFn: async () => {
      // Get colors that are linked to products
      const { data: productColors, error: pcError } = await supabase
        .from("product_colors")
        .select(`
          colors:color_id (
            name,
            hex_code
          )
        `);
      
      if (pcError) throw pcError;
      
      // Extract unique colors
      const uniqueColors = new Map();
      productColors?.forEach((pc) => {
        const color = (pc.colors as any);
        if (color?.name && color?.hex_code) {
          uniqueColors.set(color.name, {
            name: color.name,
            value: color.name.toLowerCase(),
            hex: color.hex_code
          });
        }
      });
      
      return Array.from(uniqueColors.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  // Get unique sizes from all products
  const availableSizes = [...new Set(allProducts.flatMap(p => p.sizes || []))].sort();

  // Calculate price range from products
  const prices = allProducts
    .map(p => Number(p.offer_price ?? p.price))
    .filter(p => !Number.isNaN(p));
  const minPrice = prices.length > 0 ? Math.floor(Math.min(...prices)) : 0;
  const maxPrice = prices.length > 0 ? Math.ceil(Math.max(...prices)) : 1000;

  // Initialize filters from URL on mount
  useEffect(() => {
    const category = searchParams.get('category');
    const colors = searchParams.get('colors');
    const sizes = searchParams.get('sizes');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (category || colors || sizes || minPrice || maxPrice) {
      setFilters(prev => ({
        ...prev,
        categories: category ? category.split(',') : prev.categories,
        colors: colors ? colors.split(',') : prev.colors,
        sizes: sizes ? sizes.split(',') : prev.sizes,
        priceRange: [
          minPrice ? Number(minPrice) : prev.priceRange[0],
          maxPrice ? Number(maxPrice) : prev.priceRange[1]
        ]
      }));
    }
  }, [searchParams]);

  // Initialize price range filter when data loads (only once)
  useEffect(() => {
    if (allProducts.length > 0 && !priceInitialized) {
      const urlMinPrice = searchParams.get('minPrice');
      const urlMaxPrice = searchParams.get('maxPrice');
      
      const initialPriceRange: [number, number] = [
        urlMinPrice ? Number(urlMinPrice) : minPrice,
        urlMaxPrice ? Number(urlMaxPrice) : maxPrice
      ];
      
      setFilters(prev => ({
        ...prev,
        priceRange: initialPriceRange
      }));
      setPriceInitialized(true);
    }
  }, [allProducts.length, minPrice, maxPrice, priceInitialized, searchParams]);

  // Update URL when filters change
  useEffect(() => {
    if (!priceInitialized) return;

    const params = new URLSearchParams();
    
    if (filters.categories.length > 0) {
      params.set('category', filters.categories.join(','));
    }
    if (filters.colors.length > 0) {
      params.set('colors', filters.colors.join(','));
    }
    if (filters.sizes.length > 0) {
      params.set('sizes', filters.sizes.join(','));
    }
    if (filters.priceRange[0] !== minPrice) {
      params.set('minPrice', filters.priceRange[0].toString());
    }
    if (filters.priceRange[1] !== maxPrice) {
      params.set('maxPrice', filters.priceRange[1].toString());
    }

    setSearchParams(params, { replace: true });
  }, [filters, priceInitialized, minPrice, maxPrice, setSearchParams]);

  // Helper function to get all child category names recursively
  const getAllChildCategories = (parentName: string, allCategories: any[]): string[] => {
    const parent = allCategories.find(cat => cat.name.toLowerCase() === parentName.toLowerCase());
    if (!parent) return [];
    
    const children = allCategories.filter(cat => cat.parent_id === parent.id);
    let allChildren: string[] = [];
    
    for (const child of children) {
      allChildren.push(child.name);
      // Recursively get children of children
      allChildren = [...allChildren, ...getAllChildCategories(child.name, allCategories)];
    }
    
    return allChildren;
  };

  // Apply filters
  const filteredProducts = allProducts.filter((product) => {
    // Category matching: include products from selected categories AND their children
    const categoryMatch = filters.categories.length === 0 || 
      filters.categories.some(cat => {
        // Direct match
        if (product.category.toLowerCase() === cat.toLowerCase() ||
            product.category.toLowerCase().includes(cat.toLowerCase())) {
          return true;
        }
        
        // Check if product category is a child of the selected category
        const childCategories = getAllChildCategories(cat, categories || []);
        return childCategories.some(childCat => 
          product.category.toLowerCase() === childCat.toLowerCase() ||
          product.category.toLowerCase().includes(childCat.toLowerCase())
        );
      });
      
    const colorMatch = filters.colors.length === 0 || 
      filters.colors.some((c) => product.colors.includes(c.toLowerCase()));
    const sizeMatch = filters.sizes.length === 0 || 
      filters.sizes.some((s) => product.sizes.includes(s));
    const actualPrice = product.offer_price || product.price;
    const priceMatch = actualPrice >= filters.priceRange[0] && actualPrice <= filters.priceRange[1];

    return categoryMatch && colorMatch && sizeMatch && priceMatch;
  });

  // Helper function to get the sorting price for a product
  const getSortingPrice = (product: Product): number => {
    // 1. If product has offer_price (discount), use it
    if (product.offer_price && product.offer_price > 0) {
      return product.offer_price;
    }
    // 2. If product has multiple prices (minPrice), use the minimum
    if (product.minPrice && product.minPrice > 0) {
      return product.minPrice;
    }
    // 3. Otherwise, use the fixed price
    return product.price;
  };

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") {
      const priceA = getSortingPrice(a);
      const priceB = getSortingPrice(b);
      return priceA - priceB;
    }
    if (sortBy === "price-high") {
      const priceA = getSortingPrice(a);
      const priceB = getSortingPrice(b);
      return priceB - priceA;
    }
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (isLoading) {
    return <PercentageLoader message={t("Loading...")} />;
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
            {searchParams.get('category') ? `${searchParams.get('category')} ${t("Collection")}` : t("Our Collection")}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/80 animate-slide-in-left">
            {sortedProducts.length} {t("Premium PEAK Products")}
            {searchParams.get('category') && ` ${t("in")} ${searchParams.get('category')}`}
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {isRTL ? (
              <>
                {/* Sidebar Filters */}
                <div className="lg:col-span-1">
                  <ProductFilters 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    categories={categories}
                    colors={availableColors}
                    sizes={availableSizes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                  />
                </div>

                {/* Products Area */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Controls Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {t("Showing")} {sortedProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, sortedProducts.length)} {t("of")} {sortedProducts.length} {t("products").toLowerCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* View Mode Toggle */}
                      <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className="h-8 w-8 p-0"
                        >
                          <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                          className="h-8 w-8 p-0"
                        >
                          <List className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>

                      {/* Sort Dropdown */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t("Sort by")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">{t("Featured")}</SelectItem>
                          <SelectItem value="rating">{t("Top Rated")}</SelectItem>
                          <SelectItem value="price-low">{t("Price: Low to High")}</SelectItem>
                          <SelectItem value="price-high">{t("Price: High to Low")}</SelectItem>
                          <SelectItem value="name">{t("Name")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Products Grid/List */}
                  {sortedProducts.length > 0 ? (
                    <>
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                            : "space-y-3 sm:space-y-4"
                        }
                      >
                        {paginatedProducts.map((product, index) => (
                          <div
                            key={product.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="animate-fade-in"
                          >
                            <ProductCardEnhanced 
                              id={product.id}
                              name={product.name}
                              price={product.price}
                              offerPrice={product.offer_price}
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
                              viewMode={viewMode}
                              targetGender={product.target_gender}
                              flag={product.flag}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Pagination className="mt-8">
                          <PaginationContent className="flex-wrap gap-2">
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>

                            {getPageNumbers().map((pageNum, idx) => (
                              <PaginationItem key={idx}>
                                {pageNum === 'ellipsis' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    href="#"
                                    size="default"
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum as number); }}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                    aria-label={t("Go to page") + ` ${pageNum}`}
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 sm:py-16 bg-card rounded-lg">
                      <p className="text-muted-foreground text-base sm:text-lg mb-4">
                        {t("No products match your filters")}
                      </p>
                       <Button 
                        variant="outline" 
                        onClick={() => {
                          setPriceInitialized(false);
                          setFilters({
                            categories: [],
                            colors: [],
                            sizes: [],
                            priceRange: [minPrice, maxPrice],
                          });
                        }}
                        className="text-sm sm:text-base"
                      >
                        {t("Clear All Filters")}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Sidebar Filters */}
                <div className="lg:col-span-1">
                  <ProductFilters 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    categories={categories}
                    colors={availableColors}
                    sizes={availableSizes}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                  />
                </div>

                {/* Products Area */}
                <div className="lg:col-span-3 space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {t("Showing")} {sortedProducts.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, sortedProducts.length)} {t("of")} {sortedProducts.length} {t("products").toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex gap-1 bg-muted p-1 rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="h-8 w-8 p-0"
                    >
                      <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("Sort by")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">{t("Featured")}</SelectItem>
                      <SelectItem value="rating">{t("Top Rated")}</SelectItem>
                      <SelectItem value="price-low">{t("Price: Low to High")}</SelectItem>
                      <SelectItem value="price-high">{t("Price: High to Low")}</SelectItem>
                      <SelectItem value="name">{t("Name")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid/List */}
              {sortedProducts.length > 0 ? (
                <>
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                        : "space-y-3 sm:space-y-4"
                    }
                  >
                    {paginatedProducts.map((product, index) => (
                      <div
                        key={product.id}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="animate-fade-in"
                      >
                        <ProductCardEnhanced 
                          id={product.id}
                          name={product.name}
                          price={product.price}
                          offerPrice={product.offer_price}
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
                          viewMode={viewMode}
                          targetGender={product.target_gender}
                          flag={product.flag}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-8">
                      <PaginationContent className="flex-wrap gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {getPageNumbers().map((pageNum, idx) => (
                          <PaginationItem key={idx}>
                            {pageNum === 'ellipsis' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                href="#"
                                size="default"
                                onClick={(e) => { e.preventDefault(); setCurrentPage(pageNum as number); }}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                                aria-label={t("Go to page") + ` ${pageNum}`}
                              >
                                {pageNum}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              ) : (
                <div className="text-center py-12 sm:py-16 bg-card rounded-lg">
                  <p className="text-muted-foreground text-base sm:text-lg mb-4">
                    {t("No products match your filters")}
                  </p>
                   <Button 
                    variant="outline" 
                    onClick={() => {
                      setPriceInitialized(false);
                      setFilters({
                        categories: [],
                        colors: [],
                        sizes: [],
                        priceRange: [minPrice, maxPrice],
                      });
                    }}
                    className="text-sm sm:text-base"
                  >
                    {t("Clear All Filters")}
                  </Button>
                </div>
              )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default ProductsEnhanced;
