import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search as SearchIcon, LogOut, User, LayoutDashboard, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import GoogleSignInButton from "./GoogleSignInButton";
import peakLogo from "@/assets/peak-logo-new.png";
const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const { cartCount } = useCart();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Fetch hero slides that should show in navbar
  const { data: navbarFlags = [] } = useQuery({
    queryKey: ["navbar-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("flag_name, button_url")
        .eq("is_active", true)
        .eq("show_in_navbar", true)
        .order("display_order");

      if (error) throw error;
      // Transform button_url to use /flag-products route with query param
      return (data || []).map(flag => ({
        ...flag,
        button_url: `/flag-products?flag=${encodeURIComponent(flag.flag_name)}`
      }));
    },
  });

  // Fetch categories that should show in navbar
  const { data: navbarCategories = [] } = useQuery({
    queryKey: ["navbar-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .eq("show_in_navbar", true)
        .order("display_order");

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Reload profile when navigating to profile page to catch any avatar updates
  useEffect(() => {
    if (user && location.pathname === "/profile") {
      loadProfile();
    }
  }, [location.pathname, user]);

  // Listen for avatar update events from Profile page
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (user) {
        loadProfile();
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user]);
  const loadProfile = async () => {
    try {
      const {
        data: profileData
      } = await supabase.from("profiles").select("avatar_url, full_name, role_id").eq("id", user?.id).single();
      if (profileData) {
        // Add cache-busting timestamp to avatar URL to prevent caching issues
        const avatarWithTimestamp = profileData.avatar_url 
          ? `${profileData.avatar_url}?t=${Date.now()}`
          : "";
        setAvatarUrl(avatarWithTimestamp);
        setFullName(profileData.full_name || "");

        // Get role name
        if (profileData.role_id) {
          const {
            data: roleData
          } = await supabase.from("roles").select("name").eq("id", profileData.role_id).single();
          if (roleData) {
            setUserRole(roleData.name.toLowerCase());
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };
  const navLinks = [{
    name: "All Products",
    path: "/products"
  },
  // Add flag navigation items from hero slides
  ...navbarFlags.map(flag => ({
    name: flag.flag_name,
    path: flag.button_url
  })),
  // Add category navigation items
  ...navbarCategories.map(category => ({
    name: category.name,
    path: `/products?category=${encodeURIComponent(category.name.toLowerCase())}`
  })),
  {
    name: "About",
    path: "/about"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <img src={peakLogo} alt="PEAK Official Logo" className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-transform duration-300 group-hover:scale-110" />
            <div className="flex items-center">
              
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={`text-xs font-medium transition-colors hover:text-primary relative whitespace-nowrap ${isActive(link.path) ? "text-primary" : "text-foreground/70"}`}>
                {link.name}
                {isActive(link.path) && <span className="absolute -bottom-6 left-0 w-full h-0.5 bg-primary" />}
              </Link>)}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {user && userRole && userRole !== "customer" && <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110" title="Dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </Link>}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110" asChild>
              <Link to="/search">
                <SearchIcon className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-full px-3 py-2 h-auto hover:bg-accent/50 transition-all duration-300 hover:scale-105">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage src={avatarUrl} alt={fullName} />
                      {!avatarUrl && (
                        <AvatarFallback className="bg-gradient-to-r from-primary to-red-500 text-white font-bold text-sm">
                          {fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-semibold hidden xl:inline-block">
                      {fullName || user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {fullName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      My Wishlist
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <GoogleSignInButton />}
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors text-xs flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden py-2 space-y-1 animate-fade-in border-t bg-background/95 backdrop-blur-md">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={`block text-xs font-medium py-1.5 px-3 rounded-lg transition-colors ${isActive(link.path) ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-primary hover:bg-accent/50"}`} onClick={() => setMobileMenuOpen(false)}>
                {link.name}
              </Link>)}
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t mt-2">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-accent/50 transition-all" asChild>
                  <Link to="/search">
                    <SearchIcon className="h-5 w-5 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-accent/50 transition-all">
                    <ShoppingCart className="h-5 w-5 sm:h-5 sm:w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-red-500 text-white text-[10px] sm:text-xs rounded-full h-5 w-5 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
              {user ? <div className="flex flex-col gap-2 sm:gap-2.5 w-full px-4 sm:px-6">
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 bg-accent/50 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/20">
                      <AvatarImage src={avatarUrl} alt={fullName} />
                      {!avatarUrl && (
                        <AvatarFallback className="bg-gradient-to-r from-primary to-red-500 text-white font-bold text-xs sm:text-sm">
                          {fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-semibold text-xs sm:text-sm">
                      {fullName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  {userRole && userRole !== "customer" && <Link to="/dashboard" className="w-full">
                      <Button variant="outline" size="sm" className="gap-2 w-full rounded-full border hover:bg-accent/50 font-semibold h-8 sm:h-9 text-xs sm:text-sm transition-all">
                        <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Dashboard
                      </Button>
                    </Link>}
                  <Link to="/profile" className="w-full">
                    <Button variant="outline" size="sm" className="gap-2 w-full rounded-full border hover:bg-accent/50 font-semibold h-8 sm:h-9 text-xs sm:text-sm transition-all">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      My Profile
                    </Button>
                  </Link>
                  <Link to="/wishlist" className="w-full">
                    <Button variant="outline" size="sm" className="gap-2 w-full rounded-full border hover:bg-accent/50 font-semibold h-8 sm:h-9 text-xs sm:text-sm transition-all">
                      <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      My Wishlist
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2 w-full rounded-full border hover:bg-accent/50 font-semibold text-red-600 hover:text-red-600 h-8 sm:h-9 text-xs sm:text-sm transition-all">
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Sign Out
                  </Button>
                </div> : <div className="w-full px-4 sm:px-6 pt-2">
                    <GoogleSignInButton />
                  </div>}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;