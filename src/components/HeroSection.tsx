import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-secondary">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/60 to-transparent" />
          </div>

          <div className="relative h-full container mx-auto px-4 flex items-center">
            <div className="max-w-2xl animate-fade-in">
              <h2 className="text-primary text-sm md:text-base font-bold uppercase tracking-[0.3em] mb-4">
                New Arrival
              </h2>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-foreground mb-6 leading-tight">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-secondary-foreground/80 mb-8">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={slide.link}>
                  <Button variant="hero" size="xl">
                    {slide.cta}
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outlineWhite" size="xl">
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-secondary-foreground/20 hover:bg-secondary-foreground/40 backdrop-blur-sm text-secondary-foreground p-3 rounded-full transition-all duration-300"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-secondary-foreground/20 hover:bg-secondary-foreground/40 backdrop-blur-sm text-secondary-foreground p-3 rounded-full transition-all duration-300"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "w-8 bg-primary" : "w-2 bg-secondary-foreground/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
