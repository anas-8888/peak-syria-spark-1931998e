import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import ProductFilters from "@/components/ProductFilters";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PromoBanner from "@/components/PromoBanner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import productShoes1 from "@/assets/product-shoes-1.jpg";
import productShoes2 from "@/assets/product-shoes-2.jpg";
import productShoes3 from "@/assets/product-shoes-3.jpg";
import productShoes4 from "@/assets/product-shoes-4.jpg";
import productApparel1 from "@/assets/product-apparel-1.jpg";
import productApparel2 from "@/assets/product-apparel-2.jpg";
import productApparel3 from "@/assets/product-apparel-3.jpg";
import productApparel4 from "@/assets/product-apparel-4.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew: boolean;
  colors: string[];
  sizes: string[];
  rating: number;
}

const allProducts: Product[] = [
  {
    id: 1,
    name: "Peak Basketball Pro X",
    price: 45,
    image: productShoes1,
    category: "Basketball",
    isNew: true,
    colors: ["black", "red"],
    sizes: ["40", "41", "42", "43", "44"],
    rating: 4.8,
  },
  {
    id: 2,
    name: "Peak Running Elite",
    price: 35,
    image: productShoes2,
    category: "Running",
    isNew: true,
    colors: ["black", "white"],
    sizes: ["39", "40", "41", "42", "43"],
    rating: 4.6,
  },
  {
    id: 3,
    name: "Peak Performance Hoodie",
    price: 25,
    image: productApparel1,
    category: "Apparel",
    isNew: false,
    colors: ["black"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
  },
  {
    id: 4,
    name: "Peak Sports Jersey",
    price: 20,
    image: productApparel2,
    category: "Apparel",
    isNew: false,
    colors: ["red", "black"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.7,
  },
  {
    id: 5,
    name: "Peak Court Master",
    price: 42,
    image: productShoes3,
    category: "Basketball",
    isNew: false,
    colors: ["white", "red"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    rating: 4.9,
  },
  {
    id: 6,
    name: "Peak Speed Runner",
    price: 38,
    image: productShoes4,
    category: "Running",
    isNew: true,
    colors: ["gray", "black"],
    sizes: ["39", "40", "41", "42", "43", "44"],
    rating: 4.7,
  },
  {
    id: 7,
    name: "Peak Training Jacket",
    price: 30,
    image: productApparel3,
    category: "Apparel",
    isNew: false,
    colors: ["white", "black"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.4,
  },
  {
    id: 8,
    name: "Peak Athletic Tank",
    price: 15,
    image: productApparel4,
    category: "Apparel",
    isNew: false,
    colors: ["black", "red"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.3,
  },
  {
    id: 9,
    name: "Peak Hoops Legend",
    price: 50,
    image: productShoes1,
    category: "Basketball",
    isNew: true,
    colors: ["black", "white", "red"],
    sizes: ["40", "41", "42", "43", "44"],
    rating: 5.0,
  },
  {
    id: 10,
    name: "Peak Marathon Pro",
    price: 40,
    image: productShoes2,
    category: "Running",
    isNew: false,
    colors: ["blue", "black"],
    sizes: ["39", "40", "41", "42", "43"],
    rating: 4.8,
  },
];

const ProductsEnhanced = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [filters, setFilters] = useState({
    categories: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
    priceRange: [0, 50] as [number, number],
  });

  // Handle URL query parameters
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({
        ...prev,
        categories: [category]
      }));
    }
  }, [searchParams]);

  const maxPrice = Math.max(...allProducts.map((p) => p.price));

  // Apply filters
  const filteredProducts = allProducts.filter((product) => {
    const categoryMatch = filters.categories.length === 0 || filters.categories.includes(product.category);
    const colorMatch = filters.colors.length === 0 || filters.colors.some((c) => product.colors.includes(c));
    const sizeMatch = filters.sizes.length === 0 || filters.sizes.some((s) => product.sizes.includes(s));
    const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];

    return categoryMatch && colorMatch && sizeMatch && priceMatch;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

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
            {searchParams.get('category') ? `${searchParams.get('category')} Collection` : 'Our Collection'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/80 animate-slide-in-left">
            {sortedProducts.length} Premium PEAK Products
            {searchParams.get('category') && ` in ${searchParams.get('category')}`}
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <ProductFilters filters={filters} onFilterChange={setFilters} maxPrice={maxPrice} />
            </div>

            {/* Products Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between bg-card p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Showing {sortedProducts.length} of {allProducts.length} products
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
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid/List */}
              {sortedProducts.length > 0 ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                      : "space-y-3 sm:space-y-4"
                  }
                >
                  {sortedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="animate-fade-in"
                    >
                      <ProductCardEnhanced {...product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 sm:py-16 bg-card rounded-lg">
                  <p className="text-muted-foreground text-base sm:text-lg mb-4">
                    No products match your filters
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({
                      categories: [],
                      colors: [],
                      sizes: [],
                      priceRange: [0, maxPrice],
                    })}
                    className="text-sm sm:text-base"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default ProductsEnhanced;
