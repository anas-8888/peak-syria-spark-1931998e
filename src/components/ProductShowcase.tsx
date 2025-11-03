import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
interface HeroShowcase {
  id: string;
  hero_title: string;
  hero_subtitle: string | null;
  hero_description: string;
  hero_image_url: string;
  cta_text: string;
  cta_url: string | null;
}
interface ShowcaseProduct {
  product_id: string;
  display_order: number;
  products: {
    id: string;
    name: string;
    image_url: string;
    price: number;
  };
}
const ProductShowcase = () => {
  const {
    data: showcases
  } = useQuery({
    queryKey: ["product-showcases"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("hero_showcase").select("*").eq("is_active", true).order("position");
      if (error) throw error;
      return data as HeroShowcase[];
    }
  });
  const {
    data: showcaseProductsMap
  } = useQuery({
    queryKey: ["showcase-products-map"],
    queryFn: async () => {
      const {
        data: showcaseData,
        error: showcaseError
      } = await supabase.from("showcase_products").select(`
          showcase_id,
          product_id,
          display_order,
          products:product_id (
            id,
            name,
            price
          )
        `).order("display_order");
      if (showcaseError) throw showcaseError;

      // Get all product IDs
      const productIds = showcaseData.map((item: any) => item.product_id);
      
      // Fetch primary images for all products
      const { data: imagesData, error: imagesError } = await supabase
        .from("product_images")
        .select("product_id, image_url")
        .in("product_id", productIds)
        .eq("is_primary", true);
      
      if (imagesError) throw imagesError;

      // Create image map
      const imageMap: Record<string, string> = {};
      imagesData?.forEach((img: any) => {
        imageMap[img.product_id] = img.image_url;
      });

      // Group by showcase_id and add image_url
      const map: Record<string, ShowcaseProduct[]> = {};
      showcaseData.forEach((item: any) => {
        if (!map[item.showcase_id]) {
          map[item.showcase_id] = [];
        }
        map[item.showcase_id].push({
          ...item,
          products: {
            ...item.products,
            image_url: imageMap[item.product_id] || ""
          }
        });
      });
      return map;
    }
  });
  if (!showcases || showcases.length === 0) return null;
  return <div className="w-full space-y-24">
      {showcases.map(showcase => {
      const products = showcaseProductsMap?.[showcase.id] || [];
      return <section key={showcase.id} className="py-16 overflow-hidden">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {/* Hero Section - Split Layout */}
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                {/* Left: Large Product Image */}
                <div className="relative group">
                  {/* Animated Background Elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-3xl transform rotate-6 group-hover:rotate-3 transition-transform duration-700" />
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 to-transparent rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                  
                  {/* Main Image */}
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={showcase.hero_image_url} 
                      alt={showcase.hero_title}
                      width="614"
                      height="500"
                      loading="lazy"
                      className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700" 
                    />
                  {/* Floating Badge */}
                  <div className="absolute top-6 left-6 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold text-sm shadow-lg animate-bounce-slow">
                    Featured
                  </div>
                  </div>

                  {/* Decorative Floating Elements */}
                  <div className="absolute -right-4 top-1/4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <div className="absolute -left-4 bottom-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{
                animationDelay: "1s"
              }} />
                </div>

                {/* Right: Content */}
                <div className="space-y-6 animate-fade-in">
                  {showcase.hero_subtitle && <div className="inline-block">
                      <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        {showcase.hero_subtitle}
                      </span>
                    </div>}
                  
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    {showcase.hero_title}
                  </h2>
                  
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    {showcase.hero_description}
                  </p>

                  <Link to={showcase.cta_url || "/products"}>
                    <Button size="lg" className="group text-lg py-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mx-0 px-[33px] my-[14px]">
                      {showcase.cta_text}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Product Grid */}
              {products.length > 0 && <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {products.map((item, index) => {
              const product = item.products as any;
              return <Link key={product.id} to={`/product/${product.id}`} className="group relative" style={{
                animationDelay: `${index * 100}ms`
              }}>
                        <div className="relative overflow-hidden rounded-xl bg-muted shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in">
                          {/* Product Image */}
                          <div className="aspect-square overflow-hidden bg-background">
                            <img 
                              src={product.image_url || ""} 
                              alt={product.name}
                              width="280"
                              height="280"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Product Info Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-white font-semibold text-sm truncate">{product.name}</p>
                            <p className="text-white/90 text-sm font-bold">${product.price}</p>
                          </div>

                          {/* Corner Animation */}
                          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
                        </div>
                      </Link>;
            })}
                </div>}
            </div>
          </section>;
    })}
    </div>;
};
export default ProductShowcase;