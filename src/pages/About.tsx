import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Award, Users, TrendingUp, Sparkles, Target, Heart, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, any> = {
  Shield,
  Award,
  Users,
  TrendingUp,
  Sparkles,
  Target,
  Heart,
  Zap,
};

const About = () => {
  const { t } = useLanguage();
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

      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("About Us")}</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up">
            {aboutData?.hero_title || "About PEAK Syria"}
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            {aboutData?.hero_subtitle || "The official and exclusive distributor of PEAK sportswear in Syria"}
          </p>
        </div>
      </section>

      {/* Our Story - Enhanced */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {aboutData?.story_title || "Our Story"}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {aboutData?.story_content?.split('\n\n').map((paragraph, index) => (
                <div 
                  key={index} 
                  className="bg-card/50 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20"
                >
                  <p className="text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed">
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values - Enhanced */}
      {values.length > 0 && (
        <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("Why Choose Us")}
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
                {t("Discover what makes us different")}
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {values.map((value: any, index: number) => {
                const IconComponent = iconMap[value.icon] || Shield;
                return (
                  <div 
                    key={index} 
                    className="group bg-card p-6 sm:p-8 rounded-2xl shadow-sm border border-border/50 text-center hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative">
                      <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mission - Enhanced */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/80 backdrop-blur-md p-8 sm:p-12 md:p-16 rounded-3xl border border-border/50 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {aboutData?.mission_title || "Our Mission"}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
              </div>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                {aboutData?.mission_content}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-3xl p-8 sm:p-12 md:p-16 text-center border border-border/50 shadow-lg">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {t("Join Us on Our Journey")}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              {t("Experience the best in sports fashion with PEAK Syria")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
              >
                {t("Shop Now")}
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-card text-foreground rounded-lg font-semibold border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105"
              >
                {t("Contact Us")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
