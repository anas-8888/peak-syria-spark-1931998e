import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import peakLogo from "@/assets/peak-logo.png";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

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
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link to="/cart">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                  0
                </span>
              </Button>
            </Link>
            {user ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut()} 
                className="gap-2 rounded-full px-4 py-2 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 font-semibold"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 rounded-full px-4 py-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-2 rounded-full px-6 py-2 bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
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
            <div className="flex flex-col items-center justify-center gap-3 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 rounded-full hover:bg-accent/50"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Link to="/cart">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-12 w-12 rounded-full hover:bg-accent/50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    0
                  </span>
                </Button>
              </Link>
              {user ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => signOut()} 
                  className="gap-2 w-full rounded-full border-2 hover:bg-accent/50 font-semibold"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <div className="flex flex-col gap-2 w-full px-4">
                  <Link to="/login" className="w-full">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 w-full rounded-full border-2 hover:bg-accent/50 font-semibold"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" className="w-full">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="gap-2 w-full rounded-full bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] font-semibold shadow-lg"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
