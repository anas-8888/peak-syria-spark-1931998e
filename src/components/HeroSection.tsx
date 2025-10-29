import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImage1 from "@/assets/hero-athlete-1.jpg";
import heroImage2 from "@/assets/hero-athlete-2.jpg";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Fetch hero slides from database
  const { data: dbSlides } = useQuery({
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

  // Fallback slides with existing images
  const fallbackSlides = [
    {
      flag_name: "New Arrival",
      image_url: heroImage1,
      title: "Unleash Your Peak Performance",
      subtitle: "Premium Basketball Collection 2025",
      button_text: "Shop Basketball",
      button_url: "/products?category=basketball",
    },
    {
      flag_name: "Offer",
      image_url: heroImage2,
      title: "Run Beyond Limits",
      subtitle: "Revolutionary Running Shoes",
      button_text: "Explore Collection",
      button_url: "/products?category=running",
    },
  ];

  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : [];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
       className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] overflow-hidden bg-secondary w-full"
       onTouchStart={handleTouchStart}
       onTouchMove={handleTouchMove}
       onTouchEnd={handleTouchEnd}
     >
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${slide.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          </div>

           <div className="relative h-full w-full px-4 sm:px-6 md:px-8 lg:px-12 flex items-center">
             <div className="w-full max-w-3xl lg:max-w-4xl space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
               <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 text-primary text-sm font-semibold animate-slide-in-left">
                 <span className="text-xs sm:text-sm">✨</span>
                 {slide.flag_name}
               </div>
               <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight animate-slide-up">
                 {slide.title}
               </h1>
               <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-medium animate-fade-in" style={{ animationDelay: "200ms" }}>
                 {slide.subtitle}
               </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                  <Button 
                    asChild
                    variant="hero" 
                    size="lg" 
                    className="group w-full sm:w-auto text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Link to={slide.button_url}>
                      {slide.button_text}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outlineWhite" 
                    size="lg"
                    className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-12 px-6 sm:px-8 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Link to="/products">
                      View All
                    </Link>
                  </Button>
                </div>
             </div>
           </div>
        </div>
      ))}

       {/* Navigation Arrows - Smaller on mobile */}
       <button
         onClick={prevSlide}
         className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-1.5 sm:p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
         aria-label="Previous slide"
       >
         <ChevronLeft className="h-3 w-3 sm:h-5 sm:w-5 md:h-6 md:w-6" />
       </button>
       <button
         onClick={nextSlide}
         className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-1.5 sm:p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
         aria-label="Next slide"
       >
         <ChevronRight className="h-3 w-3 sm:h-5 sm:w-5 md:h-6 md:w-6" />
       </button>

      {/* Mobile Navigation - Smaller indicators */}
      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide 
                ? "h-1.5 w-4 bg-primary rounded-full" 
                : "h-1.5 w-1.5 bg-white/40 hover:bg-white/60 rounded-full"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Desktop Dots Indicator */}
      <div className="hidden sm:flex absolute bottom-4 md:bottom-6 lg:bottom-8 left-1/2 -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 hover:scale-110 ${
              index === currentSlide 
                ? "h-2 md:h-3 w-8 md:w-10 bg-red-500 rounded-full" 
                : "h-2 md:h-3 w-2 md:w-3 bg-gray-400 hover:bg-gray-300 rounded-full"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
