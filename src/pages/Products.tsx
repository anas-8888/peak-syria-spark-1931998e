import { useState } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import productShoes1 from "@/assets/product-shoes-1.jpg";
import productShoes2 from "@/assets/product-shoes-2.jpg";
import productApparel1 from "@/assets/product-apparel-1.jpg";
import productApparel2 from "@/assets/product-apparel-2.jpg";

const allProducts = [
  { id: 1, name: "Peak Basketball Pro X", price: 2500000, image: productShoes1, category: "Basketball", isNew: true },
  { id: 2, name: "Peak Running Elite", price: 1800000, image: productShoes2, category: "Running", isNew: true },
  { id: 3, name: "Peak Performance Hoodie", price: 1200000, image: productApparel1, category: "Apparel", isNew: false },
  { id: 4, name: "Peak Sports Jersey", price: 950000, image: productApparel2, category: "Apparel", isNew: false },
  { id: 5, name: "Peak Court Master", price: 2200000, image: productShoes1, category: "Basketball", isNew: false },
  { id: 6, name: "Peak Speed Runner", price: 1900000, image: productShoes2, category: "Running", isNew: true },
  { id: 7, name: "Peak Training Jacket", price: 1500000, image: productApparel1, category: "Apparel", isNew: false },
  { id: 8, name: "Peak Athletic Shorts", price: 750000, image: productApparel2, category: "Apparel", isNew: false },
];

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const filteredProducts =
    selectedCategory === "All"
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page Header */}
      <section className="bg-secondary py-16 text-secondary-foreground">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
          <p className="text-lg text-secondary-foreground/70">
            Premium PEAK sportswear collection
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                variant={selectedCategory === "All" ? "default" : "outline"}
                onClick={() => setSelectedCategory("All")}
              >
                All
              </Button>
              <Button
                variant={selectedCategory === "Basketball" ? "default" : "outline"}
                onClick={() => setSelectedCategory("Basketball")}
              >
                Basketball
              </Button>
              <Button
                variant={selectedCategory === "Running" ? "default" : "outline"}
                onClick={() => setSelectedCategory("Running")}
              >
                Running
              </Button>
              <Button
                variant={selectedCategory === "Apparel" ? "default" : "outline"}
                onClick={() => setSelectedCategory("Apparel")}
              >
                Apparel
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Products;
