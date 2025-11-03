import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
      console.log("Fetched hero slides:", data);
      return data;
    },
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
  });

  const slides = dbSlides || [];

  useEffect(() => {
    if (slides.length === 0 || isHovering) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isHovering]);

  // If no slides, don't render anything
  if (isLoading || slides.length === 0) {
    return null;
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

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
      className="relative h-[350px] sm:h-[450px] md:h-[600px] lg:h-[700px] overflow-hidden bg-secondary w-full"
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
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${slide.image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 md:from-black/80 md:via-black/50 md:to-black/20" />
          </div>

          <div className="relative h-full w-full px-4 sm:px-6 md:px-10 lg:px-16 flex items-center sm:items-center md:items-start">
            <div className="w-full max-w-[90%] sm:max-w-[70%] md:max-w-[50%] space-y-2 sm:space-y-3 md:space-y-5 lg:space-y-7 text-center sm:text-center md:text-left mx-auto md:mx-0">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-0.5 text-primary text-[10px] sm:text-xs font-semibold animate-slide-in-left">
                <span className="text-[10px] sm:text-xs">✨</span>
                <span className="text-[10px] sm:text-xs">{slide.flag_name}</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-3xl lg:text-5xl font-bold text-white leading-tight animate-slide-up">
                {slide.title}
              </h1>
              <p
                className="text-xs sm:text-sm md:text-lg lg:text-xl text-white/90 font-medium animate-fade-in"
                style={{ animationDelay: "200ms" }}
              >
                {slide.subtitle}
              </p>
              <div
                className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-4 animate-fade-in justify-center md:justify-start"
                style={{ animationDelay: "400ms" }}
              >
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="group w-full sm:w-auto text-xs sm:text-sm md:text-base h-6 sm:h-8 md:h-10 px-2 sm:px-4 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Link to={slide.button_url}>
                    {slide.button_text}
                    <ArrowRight className="ml-1 sm:ml-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineWhite"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm md:text-base h-6 sm:h-8 md:h-10 px-2 sm:px-4 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Link to="/products">View All</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 md:left-6 top-[40%] sm:top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 backdrop-blur text-white p-0.5 sm:p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20 flex items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 md:right-6 top-[40%] sm:top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/30 backdrop-blur text-white p-0.5 sm:p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110 shadow-lg z-20 flex items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>

      {/* Dots Indicator */}
      <div className="flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 hover:scale-110 shadow-sm ${
              index === currentSlide
                ? "h-1 w-3 bg-red-500 rounded-full"
                : "h-1 w-1.5 bg-gray-400 hover:bg-gray-300 rounded-full"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
