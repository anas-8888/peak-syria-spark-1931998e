import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggleFloating from "@/components/LanguageToggleFloating";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Maintenance = () => {
  const { t } = useLanguage();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("maintenance_image_url")
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Language Toggle */}
      <LanguageToggleFloating />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Animated Image */}
        {settings?.maintenance_image_url && (
          <div className="mb-8 flex justify-center">
            <div className="relative animate-[float_6s_ease-in-out_infinite]">
              <img
                src={settings.maintenance_image_url}
                alt={t("maintenance.title")}
                className="max-w-xs md:max-w-sm h-auto object-contain drop-shadow-2xl"
                style={{
                  animation: 'float 6s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
          {t("maintenance.title")}
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {t("maintenance.description")}
        </p>

        {/* Additional Info */}
        <div className="flex flex-col gap-2 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p>{t("maintenance.message")}</p>
          <p className="font-medium text-primary">{t("maintenance.thanks")}</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default Maintenance;
