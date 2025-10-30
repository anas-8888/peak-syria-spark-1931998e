import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Trophy, Target, Flame, Star } from "lucide-react";
import * as Icons from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  icon_name: string;
  background_gradient: string;
  position: number;
}

const FeaturedCollections = () => {
  const { data: collections } = useQuery({
    queryKey: ["featured-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as Collection[];
    },
  });

  if (!collections || collections.length === 0) return null;

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as any;
    return IconComponent || Sparkles;
  };

  return (
    <section className="py-16 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Featured Collections
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Curated selections for every athlete and style
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => {
            const IconComponent = getIcon(collection.icon_name);
            
            return (
              <Link
                key={collection.id}
                to={collection.link_url || "#"}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={collection.image_url}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${collection.background_gradient} backdrop-blur-[2px]`} />
                </div>

                {/* Content */}
                <div className="relative p-8 min-h-[320px] flex flex-col justify-between">
                  {/* Icon Badge */}
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-background/90 backdrop-blur-sm shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>

                  {/* Text Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {collection.title}
                    </h3>
                    {collection.description && (
                      <p className="text-muted-foreground leading-relaxed">
                        {collection.description}
                      </p>
                    )}
                    
                    {/* CTA */}
                    <div className="flex items-center gap-2 text-primary font-semibold pt-2">
                      <span>Explore Collection</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
