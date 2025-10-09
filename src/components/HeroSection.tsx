import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage1 from "@/assets/hero-athlete-1.jpg";
import heroImage2 from "@/assets/hero-athlete-2.jpg";

const slides = [
  {
    image: heroImage1,
    title: "Unleash Your Peak Performance",
    subtitle: "Premium Basketball Collection 2025",
    cta: "Shop Basketball",
    link: "/products?category=basketball",
  },
  {
    image: heroImage2,
    title: "Run Beyond Limits",
    subtitle: "Revolutionary Running Shoes",
    cta: "Explore Collection",
    link: "/products?category=running",
  },
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

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
      className="relative h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[750px] overflow-hidden bg-secondary w-full"
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
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          </div>

          <div className="relative h-full w-full px-3 sm:px-4 md:px-6 lg:px-8 flex items-center">
            <div className="w-full max-w-2xl lg:max-w-3xl space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
              <h2 className="text-primary text-xs sm:text-sm lg:text-base font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] md:tracking-[0.2em] lg:tracking-[0.3em] mb-1 sm:mb-2 md:mb-4 animate-slide-in-left">
                New Arrival
              </h2>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight animate-slide-up">
                {slide.title}
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/90 mb-3 sm:mb-4 md:mb-6 lg:mb-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
                {slide.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <Link to={slide.link} className="w-full sm:w-auto">
                  <Button variant="hero" size="sm" className="group w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                    {slide.cta}
                    <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/products" className="w-full sm:w-auto">
                  <Button variant="outlineWhite" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Smaller on mobile, larger on desktop */}
      <button
        onClick={prevSlide}
        className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
      </button>

      {/* Mobile Navigation - Swipe indicators */}
      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide 
                ? "h-1.5 w-5 bg-red-500 rounded-full" 
                : "h-1.5 w-1.5 bg-gray-400 hover:bg-gray-300 rounded-full"
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
