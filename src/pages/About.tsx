import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Award, Users, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

const iconMap: Record<string, any> = {
  Shield,
  Award,
  Users,
  TrendingUp,
};

const About = () => {
  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["about-us"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_us")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const values = (aboutData?.values as Array<{ icon: string; title: string; description: string }>) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 py-20 text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {aboutData?.hero_title || "About PEAK Syria"}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/70 max-w-3xl mx-auto leading-relaxed">
            {aboutData?.hero_subtitle || "The official and exclusive distributor of PEAK sportswear in Syria"}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center">
              {aboutData?.story_title || "Our Story"}
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {aboutData?.story_content?.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      {values.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-center">Why Choose Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value: any, index: number) => {
                const IconComponent = iconMap[value.icon] || Shield;
                return (
                  <div key={index} className="bg-card p-6 sm:p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
              {aboutData?.mission_title || "Our Mission"}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-secondary-foreground/80 leading-relaxed">
              {aboutData?.mission_content}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
