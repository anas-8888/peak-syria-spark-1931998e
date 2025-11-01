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

  // Fetch hero slides
  const { data: dbSlides, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const slides = dbSlides || [];

  useEffect(() => {
    if (!slides.length || isHovering) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isHovering]);

  if (isLoading || slides.length === 0) return null;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextSlide();
    if (distance < -50) prevSlide();
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[380px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-secondary w-full"
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
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slide.image_url})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          </div>

          <div className="relative h-full w-full px-3 sm:px-6 md:px-10 flex items-center">
            <div className="w-full max-w-3xl space-y-1 sm:space-y-2 md:space-y-4">
              <div className="inline-flex items-center gap-1 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-2 py-0.5 text-primary text-[9px] sm:text-xs font-semibold">
                ✨ {slide.flag_name}
              </div>
              <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-white leading-tight">
                {slide.title}
              </h1>
              <p className="text-[11px] sm:text-sm md:text-lg text-white/90 font-medium">
                {slide.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 md:gap-4">
                <Button
                  asChild
                  variant="hero"
                  size="sm"
                  className="group w-full sm:w-auto text-[9px] sm:text-xs md:text-sm h-6 sm:h-8 md:h-10 px-2 sm:px-4 rounded-full font-semibold shadow hover:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <Link to={slide.button_url}>
                    {slide.button_text}
                    <ArrowRight className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outlineWhite"
                  size="sm"
                  className="w-full sm:w-auto text-[9px] sm:text-xs md:text-sm h-6 sm:h-8 md:h-10 px-2 sm:px-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Link to="/products">View All</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-[40%] -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur p-0.5 sm:p-1 rounded-full text-white shadow-md transition-all duration-300 hover:scale-110 z-20"
        aria-label="Previous"
      >
        <ChevronLeft className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-[40%] -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur p-0.5 sm:p-1 rounded-full text-white shadow-md transition-all duration-300 hover:scale-110 z-20"
        aria-label="Next"
      >
        <ChevronRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
      </button>

      {/* Dots */}
      <div className="flex absolute bottom-3 left-1/2 -translate-x-1/2 gap-1 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? "h-1 w-3 bg-red-500 rounded-full"
                : "h-1 w-1.5 bg-gray-400 hover:bg-gray-300 rounded-full"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
