import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import peakLogo from "@/assets/peak-logo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "All Products", path: "/products" },
    { name: "Basketball", path: "/products?category=basketball" },
    { name: "Running", path: "/products?category=running" },
    { name: "Casual", path: "/products?category=apparel" },
    { name: "About", path: "/about" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <img 
              src={peakLogo} 
              alt="PEAK Official Logo" 
              className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto transition-transform duration-300 group-hover:scale-110"
            />
            <div className="flex items-center">
              <span className="text-sm sm:text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-primary tracking-[0.25em] uppercase animate-pulse" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>SYRIA</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary relative whitespace-nowrap ${
                  isActive(link.path) ? "text-primary" : "text-foreground/70"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-6 left-0 w-full h-0.5 bg-primary" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" title="Dashboard" className="h-9 w-9">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  0
                </span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-4 animate-fade-in border-t bg-background/95 backdrop-blur-md">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive(link.path) 
                    ? "text-primary bg-primary/10" 
                    : "text-foreground/70 hover:text-primary hover:bg-accent/50"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center justify-center space-x-4 pt-4 border-t">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Search className="h-5 w-5" />
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" title="Dashboard" className="h-10 w-10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/cart">
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    0
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
