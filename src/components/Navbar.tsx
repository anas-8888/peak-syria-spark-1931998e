import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, Search as SearchIcon, LogOut, User, LayoutDashboard, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import GoogleSignInButton from "./GoogleSignInButton";
import peakLogo from "@/assets/peak-logo-new.png";
import { getOptimizedImageUrl } from "@/utils/imageCache";
const Navbar = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    cartCount
  } = useCart();
  const [fullName, setFullName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Fetch hero slides that should show in navbar
  const {
    data: navbarFlags = []
  } = useQuery({
    queryKey: ["navbar-flags"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("hero_slides").select("flag_name, button_url").eq("is_active", true).eq("show_in_navbar", true).order("display_order");
      if (error) throw error;
      // Transform button_url to use /flag-products route with query param
      return (data || []).map(flag => ({
        ...flag,
        button_url: `/flag-products?flag=${encodeURIComponent(flag.flag_name)}`
      }));
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Fetch categories that should show in navbar
  const {
    data: navbarCategories = []
  } = useQuery({
    queryKey: ["navbar-categories"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("categories").select("id, name").eq("is_active", true).eq("show_in_navbar", true).order("display_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Fetch user profile with React Query cache (no timestamp - allows browser caching)
  const { data: profileData } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, role_id")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus to prevent flickering
  });

  // Update local state when profile data changes
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || "");
      
      // Get role name
      if (profileData.role_id) {
        supabase
          .from("roles")
          .select("name")
          .eq("id", profileData.role_id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUserRole(data.name.toLowerCase());
            }
          });
      }
    }
  }, [profileData]);

  // Listen for avatar update events from Profile page
  useEffect(() => {
    const handleAvatarUpdate = () => {
      // Invalidate profile cache to refetch
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user?.id, queryClient]);

  // Get optimized avatar URL with caching (no timestamp - allows browser cache)
  const avatarUrl = profileData?.avatar_url 
    ? getOptimizedImageUrl(profileData.avatar_url, {
        width: 80,
        quality: 85,
        format: 'webp'
      })
    : "";
  const navLinks = [{
    name: t("All Products"),
    path: "/products"
  },
  // Add flag navigation items from hero slides
  ...navbarFlags.map(flag => ({
    name: t(flag.flag_name), // Translate flag names from database
    path: flag.button_url
  })),
  // Add category navigation items - translate category names from database
  ...navbarCategories.map(category => ({
    name: t(category.name), // Translate category names from database
    path: `/products?category=${encodeURIComponent(category.name.toLowerCase())}`
  })), {
    name: t("About"),
    path: "/about"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0 mx-[15px]">
            <img src={peakLogo} alt="PEAK Official Logo" width="110" height="96" className="h-12 sm:h-12 md:h-14 lg:h-16 w-auto transition-transform duration-300 group-hover:scale-110" />
            <div className="flex items-center">
              
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={`text-xs font-medium transition-colors hover:text-primary relative whitespace-nowrap px-2 ${isActive(link.path) ? "text-primary" : "text-foreground/70"}`}>
                {link.name}
                {isActive(link.path) && <span className="absolute -bottom-6 left-0 w-full h-0.5 bg-primary" />}
              </Link>)}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {user && userRole && userRole !== "customer" && <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110" title={t("Dashboard")}>
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
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {cartCount}
                  </span>}
              </Button>
            </Link>
            {user ? <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 rounded-full px-3 py-2 h-auto hover:bg-accent/50 transition-all duration-300 hover:scale-105">
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={fullName}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {!avatarUrl && <AvatarFallback className="bg-gradient-to-r from-primary to-red-500 text-white font-bold text-sm">
                          {fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>}
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
                        {fullName || t("User")}
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
                      {t("My Profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      {t("My Wishlist")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("Sign Out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <GoogleSignInButton />}
          </div>

          {/* Mobile Actions - Search, Cart, and Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-accent/50 transition-all" asChild>
              <Link to="/search">
                <SearchIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-all">
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-primary to-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-lg">
                    {cartCount}
                  </span>}
              </Button>
            </Link>
            <button className="p-1.5 rounded-md hover:bg-accent transition-colors text-xs flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={t("Toggle menu")}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden py-1.5 space-y-0.5 animate-fade-in border-t bg-background/95 backdrop-blur-md">
            {navLinks.map(link => <Link key={link.path} to={link.path} className={`flex items-center text-xs font-medium py-1 px-3 rounded-lg transition-colors ${isActive(link.path) ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-primary hover:bg-accent/50"}`} onClick={() => setMobileMenuOpen(false)}>
                {link.name}
              </Link>)}
            <div className="flex flex-col items-center justify-center gap-2 pt-2 border-t mt-1.5">
              {user ? <div className="flex flex-col gap-1.5 w-full px-3">
                  <div className="flex items-center justify-center gap-1.5 p-1.5 bg-accent/50 rounded-full">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border border-primary/20">
                      <AvatarImage 
                        src={avatarUrl} 
                        alt={fullName}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {!avatarUrl && <AvatarFallback className="bg-gradient-to-r from-primary to-red-500 text-white font-bold text-[10px] sm:text-xs">
                          {fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>}
                    </Avatar>
                    <span className="font-semibold text-[10px] sm:text-xs">
                      {fullName || user.email?.split('@')[0]}
                    </span>
                  </div>
                  {userRole && userRole !== "customer" && <Link to="/dashboard" className="w-full">
                      <Button variant="outline" size="sm" className="gap-1.5 w-full rounded-full border hover:bg-accent/50 font-semibold h-7 sm:h-7 text-[10px] sm:text-xs transition-all">
                        <LayoutDashboard className="h-3 w-3" />
                        {t("Dashboard")}
                      </Button>
                    </Link>}
                  <Link to="/profile" className="w-full">
                    <Button variant="outline" size="sm" className="gap-1.5 w-full rounded-full border hover:bg-accent/50 font-semibold h-7 sm:h-7 text-[10px] sm:text-xs transition-all">
                      <User className="h-3 w-3" />
                      {t("My Profile")}
                    </Button>
                  </Link>
                  <Link to="/wishlist" className="w-full">
                    <Button variant="outline" size="sm" className="gap-1.5 w-full rounded-full border hover:bg-accent/50 font-semibold h-7 sm:h-7 text-[10px] sm:text-xs transition-all">
                      <Heart className="h-3 w-3" />
                      {t("My Wishlist")}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-1.5 w-full rounded-full border hover:bg-accent/50 font-semibold text-red-600 hover:text-red-600 h-7 sm:h-7 text-[10px] sm:text-xs transition-all">
                    <LogOut className="h-3 w-3" />
                    {t("Sign Out")}
                  </Button>
                </div> : <div className="w-full px-3 pt-1">
                    <GoogleSignInButton />
                  </div>}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;