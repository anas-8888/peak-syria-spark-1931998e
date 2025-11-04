import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const PromoBanner = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch active automatic discounts that should show in banner
  const { data: bannerDiscount } = useQuery({
    queryKey: ["banner-discount"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_automatic", true)
        .eq("show_in_banner", true)
        .eq("status", "active")
        .lte("start_date", new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
  });

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('promo-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('promo-banner-dismissed', 'true');
    }, 300);
  };

  // Don't show if no discount or not visible
  if (!isVisible || !bannerDiscount) return null;

  // Format the discount message
  const getDiscountMessage = () => {
    if (bannerDiscount.marketing_label) {
      return t(bannerDiscount.marketing_label);
    }
    
    const typeText = bannerDiscount.type === 'percentage' ? `${bannerDiscount.value}%` : `$${bannerDiscount.value}`;
    const minText = bannerDiscount.min_cart_subtotal > 0 ? ` ${t("for orders above")} $${bannerDiscount.min_cart_subtotal}` : '';
    return `🔥 ${t(bannerDiscount.name)}: ${t("Automatic")} ${typeText} ${t("discount")}${minText}`;
  };

  const handleBannerClick = (e: React.MouseEvent) => {
    // Only navigate on mobile, and don't navigate if clicking close button
    if (isMobile && !(e.target as HTMLElement).closest('button[aria-label="Close banner"]')) {
      navigate('/products');
    }
  };

  return (
    <div 
      onClick={handleBannerClick}
      className={`relative bg-gradient-to-r from-primary/90 via-primary/85 to-primary/80 text-primary-foreground py-3 sm:py-3 px-3 sm:px-4 text-center text-xs sm:text-sm font-medium overflow-hidden w-full transition-all duration-300 backdrop-blur-sm ${
        isAnimating ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      } ${isMobile ? 'cursor-pointer' : ''}`}
    >
      <div className="max-w-4xl mx-auto relative">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
      
      {/* Floating sparkles animation - background only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce delay-100"></div>
        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-white/25 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/15 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-1/2 left-1/6 w-1 h-1 bg-white/18 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-1/2 left-5/6 w-1.5 h-1.5 bg-white/12 rounded-full animate-bounce delay-900"></div>
      </div>

      <div className="relative flex items-center justify-center gap-1 sm:gap-2 flex-wrap px-4 sm:px-8 z-10">
        <div className="flex items-center gap-1 sm:gap-2">
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse flex-shrink-0 text-white" />
          <p className="animate-fade-in font-semibold text-center text-white drop-shadow-sm whitespace-nowrap text-xs sm:text-sm">
            {getDiscountMessage()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex absolute right-4 sm:right-8 text-white hover:bg-white/20 h-5 sm:h-6 px-1 sm:px-2 text-xs flex-shrink-0 transition-all duration-200 hover:scale-105 border border-white/20"
          asChild
        >
          <Link to="/products" onClick={(e) => e.stopPropagation()}>
            {t("Shop Now")}
            <ArrowRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
          </Link>
        </Button>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose();
        }}
        className="absolute right-6 top-1/2 -translate-y-1/2 hover:opacity-70 transition-all duration-200 p-1 rounded-full hover:bg-white/20 hover:scale-110 z-20"
        aria-label={t("Close banner")}
      >
        <X className="h-3 w-3" />
      </button>
      </div>
    </div>
  );
};

export default PromoBanner;
