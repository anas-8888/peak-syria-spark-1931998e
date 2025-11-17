import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggleFloating from "@/components/LanguageToggleFloating";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Wrench, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const Maintenance = () => {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("maintenance_image_url")
        .single();

      if (error) throw error;
      return data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{t("Error Loading Page")}</h2>
              <p className="text-muted-foreground text-lg">
                {t("Unable to load maintenance page settings. Please try again later.")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-card relative overflow-hidden p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Language Toggle */}
      <LanguageToggleFloating />

      {/* Content */}
      <Card className="relative z-10 max-w-3xl w-full border-0 shadow-none">
        <CardContent className="pt-12 pb-12 px-6 md:px-12 text-center space-y-8">
          {/* Maintenance Icon or Image */}
          {settings?.maintenance_image_url && !imageError ? (
            <div className="mb-8 flex justify-center">
              <div className="relative animate-float">
                <img
                  src={settings.maintenance_image_url}
                  alt={t("We are under maintenance")}
                  className="max-w-xs md:max-w-sm h-auto object-contain"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="mb-8 flex justify-center">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-primary/10 flex items-center justify-center animate-float">
                <Wrench className="h-16 w-16 md:h-20 md:w-20 text-primary" />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
              {t("We are under maintenance")}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {t("We're currently improving your experience. We'll be back soon!")}
            </p>
          </div>

          {/* Additional Info */}
          <div className="flex flex-col gap-3 text-sm md:text-base text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="font-medium text-primary text-base md:text-lg">
              {t("Thank you for your patience and understanding")}
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center gap-2 pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;
