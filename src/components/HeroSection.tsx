import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { preloadImage, getOptimizedImageUrl } from "@/utils/imageCache";

const HeroSection = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch hero slides from database
  const { data: dbSlides, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching hero slides:", error);
        throw error;
      }
      return data;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus to prevent flickering
    refetchOnMount: false, // Don't refetch if data is fresh
  });

  const slides = dbSlides || [];

  // Preload next slide images for better performance
  useEffect(() => {
    if (slides.length > 0) {
      // Preload current and next slide images
      const currentSlideImage = slides[currentSlide]?.image_url;
      const nextSlideImage = slides[(currentSlide + 1) % slides.length]?.image_url;
      
      if (currentSlideImage) {
        preloadImage(currentSlideImage).catch(() => {
          // Silently fail - image will load normally
        });
      }
      if (nextSlideImage && nextSlideImage !== currentSlideImage) {
        preloadImage(nextSlideImage).catch(() => {
          // Silently fail - image will load normally
        });
      }
    }
  }, [slides, currentSlide]);

  useEffect(() => {
    if (slides.length === 0 || isHovering) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    // Clear any existing timer before starting a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slides.length, isHovering]);

  // Restart timer after manual navigation (when timer was cleared by button click)
  useEffect(() => {
    if (slides.length === 0 || isHovering || timerRef.current) return;
    
    // Only restart if timer was cleared (i.e., manual navigation happened)
    const timeoutId = setTimeout(() => {
      if (!timerRef.current && !isHovering && slides.length > 0) {
        timerRef.current = setInterval(() => {
          setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [currentSlide, slides.length, isHovering]);

  // If no slides, don't render anything
  if (isLoading || slides.length === 0) {
    return null;
  }

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Clear auto-slide timer to prevent conflicts
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Move to next slide (one at a time)
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Clear auto-slide timer to prevent conflicts
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Move to previous slide (one at a time)
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-secondary w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0">
            <img
              src={getOptimizedImageUrl(slide.image_url, {
                width: 1920,
                quality: 85,
                format: 'webp'
              })}
              alt={t(slide.title)}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              width={1920}
              height={1080}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center center" }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== '/placeholder.svg') {
                  target.src = '/placeholder.svg';
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          </div>

          <div className="relative h-full w-full px-3 sm:px-6 md:px-8 lg:px-12 flex items-center">
            <div className="w-full max-w-3xl lg:max-w-4xl space-y-1.5 sm:space-y-12 md:space-y-5 lg:space-y-7 text-center md:text-left md:ml-8 lg:ml-12">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-0.5 text-primary text-[10px] sm:text-sm font-semibold animate-slide-in-left mx-auto md:mx-0">
                <span className="text-[10px] sm:text-sm">✨</span>
                <span className="text-[10px] sm:text-sm">{t(slide.flag_name)}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight animate-slide-up">
                {t(slide.title)}
              </h1>
              <p
                className="text-base sm:text-xl md:text-lg lg:text-xl text-white/90 font-medium animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                {t(slide.subtitle)}
              </p>
              <div
                className="flex flex-row sm:flex-row gap-1 sm:gap-2 md:gap-4 animate-fade-in justify-center md:justify-start mt-8 sm:mt-10 md:mt-0"
                style={{ animationDelay: "400ms" }}
              >
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="group w-auto max-w-[230px] sm:max-w-[240px] md:max-w-none sm:w-auto text-[10px] sm:text-sm md:text-sm !h-3 sm:!h-6 md:!h-10 !px-3 sm:!px-5 md:!px-4 !py-0 sm:!py-1 md:!py-2 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Link to={slide.button_url}>
                    {t(slide.button_text)}
                    <ArrowRight className="ml-0.5 sm:ml-1.5 h-2 w-2 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineWhite"
                  size="sm"
                  className="w-auto max-w-[175px] sm:max-w-[195px] md:max-w-none sm:w-auto text-[10px] sm:text-sm md:text-sm !h-3 sm:!h-6 md:!h-10 !px-3 sm:!px-5 md:!px-4 !py-0 sm:!py-1 md:!py-2 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Link to="/products">{t("View All Products")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={(e) => prevSlide(e)}
        type="button"
        className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 backdrop-blur text-white p-0.5 sm:p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20 flex items-center justify-center"
        aria-label={t("Previous slide")}
      >
        <ChevronLeft className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>
      <button
        onClick={(e) => nextSlide(e)}
        type="button"
        className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 backdrop-blur text-white p-0.5 sm:p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20 flex items-center justify-center"
        aria-label={t("Next slide")}
      >
        <ChevronRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>

      {/* Dots Indicator */}
      <div className="flex absolute bottom-8 left-1/2 -translate-x-1/2 gap-2.5 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 hover:scale-110 shadow-sm !min-h-0 !min-w-0 ${
              index === currentSlide
                ? "h-2.5 w-10 bg-red-500 rounded-full"
                : "h-2.5 w-2.5 bg-gray-400 hover:bg-gray-300 rounded-full"
            }`}
            aria-label={`${t("Go to slide")} ${index + 1}`}
            style={{ minHeight: 0, minWidth: 0 }}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
