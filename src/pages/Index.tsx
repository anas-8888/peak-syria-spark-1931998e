import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";
import productShoes1 from "@/assets/product-shoes-1.jpg";
import productShoes2 from "@/assets/product-shoes-2.jpg";
import productApparel1 from "@/assets/product-apparel-1.jpg";
import productApparel2 from "@/assets/product-apparel-2.jpg";

const featuredProducts = [
  { id: 1, name: "Peak Basketball Pro X", price: 2500000, image: productShoes1, category: "Basketball", isNew: true },
  { id: 2, name: "Peak Running Elite", price: 1800000, image: productShoes2, category: "Running", isNew: true },
  { id: 3, name: "Peak Performance Hoodie", price: 1200000, image: productApparel1, category: "Apparel", isNew: false },
  { id: 4, name: "Peak Sports Jersey", price: 950000, image: productApparel2, category: "Apparel", isNew: false },
];

const categories = [
  { name: "Basketball", icon: TrendingUp, description: "Pro-level basketball gear" },
  { name: "Running", icon: Zap, description: "Performance running shoes" },
  { name: "Apparel", icon: Shield, description: "Premium athletic wear" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
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
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg">Find your perfect sport</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className="group bg-card p-8 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold">{category.name}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                  <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                    Explore
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% Authentic</h3>
              <p className="text-secondary-foreground/70">Official PEAK distributor in Syria</p>
            </div>
            <div className="animate-fade-in">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
              <p className="text-secondary-foreground/70">Quick shipping across Syria</p>
            </div>
            <div className="animate-fade-in">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
              <p className="text-secondary-foreground/70">World-class sportswear</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
