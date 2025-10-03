import PromoBanner from "@/components/PromoBanner";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCardEnhanced from "@/components/ProductCardEnhanced";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";
import productShoes1 from "@/assets/product-shoes-1.jpg";
import productShoes2 from "@/assets/product-shoes-2.jpg";
import productShoes3 from "@/assets/product-shoes-3.jpg";
import productShoes4 from "@/assets/product-shoes-4.jpg";
import productApparel1 from "@/assets/product-apparel-1.jpg";
import productApparel2 from "@/assets/product-apparel-2.jpg";

const featuredProducts = [
  { 
    id: 1, 
    name: "Peak Basketball Pro X", 
    price: 2500000, 
    image: productShoes1, 
    category: "Basketball", 
    isNew: true,
    colors: ["black", "red"],
    sizes: ["40", "41", "42", "43"],
    rating: 4.8,
  },
  { 
    id: 2, 
    name: "Peak Running Elite", 
    price: 1800000, 
    image: productShoes2, 
    category: "Running", 
    isNew: true,
    colors: ["black", "white"],
    sizes: ["40", "41", "42", "43"],
    rating: 4.6,
  },
  { 
    id: 5, 
    name: "Peak Court Master", 
    price: 2200000, 
    image: productShoes3, 
    category: "Basketball", 
    isNew: false,
    colors: ["white", "red"],
    sizes: ["40", "41", "42", "43"],
    rating: 4.9,
  },
  { 
    id: 6, 
    name: "Peak Speed Runner", 
    price: 1900000, 
    image: productShoes4, 
    category: "Running", 
    isNew: true,
    colors: ["gray", "black"],
    sizes: ["40", "41", "42", "43"],
    rating: 4.7,
  },
];

const categories = [
  { name: "Basketball", icon: TrendingUp, description: "Pro-level basketball gear" },
  { name: "Running", icon: Zap, description: "Performance running shoes" },
  { name: "Apparel", icon: Shield, description: "Premium athletic wear" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PromoBanner />
      <Navbar />
      <HeroSection />
      <WhatsAppButton />

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Collection</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover our handpicked selection of premium sportswear
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product, index) => (
              <div 
                key={product.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
              >
                <ProductCardEnhanced {...product} />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/products">
              <Button variant="default" size="lg" className="group">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg">Find your perfect sport</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  to={`/products?category=${category.name.toLowerCase()}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="group bg-card p-8 rounded-lg shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden relative"
                >
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{category.name}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                    <div className="flex items-center text-primary font-semibold group-hover:gap-3 transition-all">
                      Explore Collection
                      <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-20 bg-secondary text-secondary-foreground overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
              <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">100% Authentic</h3>
              <p className="text-secondary-foreground/80 text-lg">Official PEAK distributor in Syria</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fast Delivery</h3>
              <p className="text-secondary-foreground/80 text-lg">Quick shipping across Syria</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Premium Quality</h3>
              <p className="text-secondary-foreground/80 text-lg">World-class sportswear</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
