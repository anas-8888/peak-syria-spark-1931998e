import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string;
  background_color: string;
  text_color: string;
  display_type: string;
}
const HomeBanners = () => {
  const {
    data: banners
  } = useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("banners").select("*").eq("is_active", true).order("position");
      if (error) throw error;
      return data as Banner[];
    }
  });
  if (!banners || banners.length === 0) return null;
  const fullWidthBanners = banners.filter(b => b.display_type === "full-width");
  const halfWidthBanners = banners.filter(b => b.display_type === "half-width");
  const cardBanners = banners.filter(b => b.display_type === "card");
  return <section className="py-12 space-y-8">
      {/* Full Width Banners */}
      {fullWidthBanners.map(banner => <div key={banner.id} className="relative h-[400px] rounded-2xl overflow-hidden group" style={{
      backgroundColor: banner.background_color
    }}>
          <img 
            src={banner.image_url} 
            alt={banner.title}
            width="1276"
            height="400"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" 
          />
          <div className="relative h-full flex items-center justify-center text-center px-8">
            <div className="max-w-3xl space-y-6" style={{
          color: banner.text_color
        }}>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-in">
                {banner.title}
              </h2>
              {banner.subtitle && <p className="text-xl md:text-2xl opacity-90">
                  {banner.subtitle}
                </p>}
              {banner.link_url && <Link to={banner.link_url}>
                  <Button size="lg" style={{
              backgroundColor: banner.text_color,
              color: banner.background_color
            }} className="group-hover:scale-105 transition-transform my-[15px]">
                    {banner.link_text}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>}
            </div>
          </div>
        </div>)}

      {/* Half Width Banners */}
      {halfWidthBanners.length > 0 && <div className="grid md:grid-cols-2 gap-8">
          {halfWidthBanners.map(banner => <div key={banner.id} className="relative h-[300px] rounded-2xl overflow-hidden group" style={{
        backgroundColor: banner.background_color
      }}>
              <img 
                src={banner.image_url} 
                alt={banner.title}
                width="638"
                height="300"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-70" 
              />
              <div className="relative h-full flex items-center justify-center text-center px-6">
                <div className="space-y-4" style={{
            color: banner.text_color
          }}>
                  <h3 className="text-3xl md:text-4xl font-bold">
                    {banner.title}
                  </h3>
                  {banner.subtitle && <p className="text-lg opacity-90">{banner.subtitle}</p>}
                  {banner.link_url && <Link to={banner.link_url}>
                      <Button size="lg" variant="outline" className="group-hover:scale-105 transition-transform border-2" style={{
                borderColor: banner.text_color,
                color: banner.text_color
              }}>
                        {banner.link_text}
                      </Button>
                    </Link>}
                </div>
              </div>
            </div>)}
        </div>}

      {/* Card Style Banners */}
      {cardBanners.length > 0 && <div className="grid md:grid-cols-3 gap-6">
          {cardBanners.map(banner => <Link key={banner.id} to={banner.link_url || "#"} className="group">
              <div className="relative h-[320px] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <img 
                  src={banner.image_url} 
                  alt={banner.title}
                  width="409"
                  height="320"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2" style={{
            color: banner.text_color
          }}>
                  <h4 className="text-2xl font-bold">{banner.title}</h4>
                  {banner.subtitle && <p className="text-sm opacity-90">{banner.subtitle}</p>}
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {banner.link_text}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>)}
        </div>}
    </section>;
};
export default HomeBanners;