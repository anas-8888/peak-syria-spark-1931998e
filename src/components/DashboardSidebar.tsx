import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, CreditCard, Settings, ChevronLeft, ChevronRight, Users, BarChart3, Star, Tag, Truck, Megaphone, Menu, X, FolderTree, Shield, ExternalLink, LogOut, MapPin, Image, Palette, FileText, LayoutGrid, Presentation, Mail, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import peakLogo from "@/assets/peak-logo-new.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";
// Menu items with their required permissions
const menuItems = [{
  title: "Overview",
  path: "/dashboard",
  icon: LayoutDashboard,
  end: true,
  permission: "view_overview"
}, {
  title: "Analytics",
  path: "/dashboard/analytics",
  icon: BarChart3,
  end: false,
  permission: "view_analytics"
}, {
  title: "Roles",
  path: "/dashboard/roles",
  icon: Shield,
  end: false,
  permission: "view_roles"
}, {
title: "Users",
path: "/dashboard/users",
icon: Users,
end: false,
permission: "view_users"
}, {
  title: "Categories",
  path: "/dashboard/categories",
  icon: FolderTree,
  end: false,
  permission: "view_categories"
}, {
  title: "Colors",
  path: "/dashboard/colors",
  icon: Palette,
  end: false,
  permission: "view_colors"
}, {
  title: "Regions",
  path: "/dashboard/regions",
  icon: MapPin,
  end: false,
  permission: "view_regions"
}, {
  title: "Products",
  path: "/dashboard/products",
  icon: Package,
  end: false,
  permission: "view_products"
}, {
  title: "Discounts",
  path: "/dashboard/discounts",
  icon: Tag,
  end: false,
  permission: "view_discounts"
}, {
  title: "Shipping",
  path: "/dashboard/shipping",
  icon: Truck,
  end: false,
  permission: "view_shipping"
}, {
  title: "Orders",
  path: "/dashboard/orders",
  icon: ShoppingBag,
  end: false,
  permission: "view_orders"
}, {
  title: "Payments",
  path: "/dashboard/payments",
  icon: CreditCard,
  end: false,
  permission: "view_payments"
}, {
  title: "Payment Methods",
  path: "/dashboard/payment-methods",
  icon: CreditCard,
  end: false,
  permission: "view_payment_methods"
}, {
  title: "Reviews",
  path: "/dashboard/reviews",
  icon: Star,
  end: false,
  permission: "view_reviews"
}, {
  title: "Messages",
  path: "/dashboard/messages",
  icon: Mail,
  end: false,
  permission: "view_messages"
}, {
  title: "Marketing",
  path: "/dashboard/marketing",
  icon: Megaphone,
  end: false,
  permission: "view_marketing"
}, {
  title: "Hero Slides",
  path: "/dashboard/hero-slides",
  icon: Image,
  end: false,
  permission: "view_hero_slides"
}, {
  title: "Banners",
  path: "/dashboard/banners",
  icon: LayoutGrid,
  end: false,
  permission: "view_banners"
}, {
  title: "Product Showcase",
  path: "/dashboard/showcase",
  icon: Presentation,
  end: false,
  permission: "view_showcase"
}, {
  title: "About Page",
  path: "/dashboard/about",
  icon: FileText,
  end: false,
  permission: "view_about"
},   {
    title: "Legal Pages",
    path: "/dashboard/legal-pages",
    icon: FileText,
    end: false,
    permission: "view_legal_pages"
  }, {
    title: "Translations",
    path: "/dashboard/translations",
    icon: Languages,
    end: false,
    permission: "view_translations"
  }, {
  title: "Settings",
  path: "/dashboard/settings",
  icon: Settings,
  end: false,
  permission: "manage_settings"
}];
const DashboardSidebar = () => {
  const { t, language, setLanguage } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const { hasPermission } = usePermissions();
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t("Logged out successfully"));
      navigate("/");
    } catch (error) {
      toast.error(t("Failed to logout"));
    }
  };
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };
  return <>
      {/* Mobile Menu Button - Fixed at top left */}
      <Button onClick={() => setMobileOpen(!mobileOpen)} variant="outline" size="icon" className="lg:hidden fixed top-20 left-4 z-50 rounded-full shadow-lg bg-background border-2">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
          ${collapsed ? "w-20" : "w-64"}
          min-h-screen max-h-screen
          bg-card border-l border-border transition-all duration-300 flex flex-col
          lg:static lg:translate-x-0
          fixed inset-y-0 right-0 z-50
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
          shadow-2xl lg:shadow-none
        `}>
        {/* Mobile Close Button */}
        <Button onClick={() => setMobileOpen(false)} variant="ghost" size="icon" className="lg:hidden absolute top-4 left-4 rounded-full">
          <X className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-border pt-4 lg:pt-0">
          {!collapsed && <img src={peakLogo} alt="PEAK Logo" className="h-12 w-auto" />}
          {collapsed && <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>}
        </div>

        {/* Browse Website Link */}
        <div className="p-4 pb-2">
          <NavLink to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <ExternalLink className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium whitespace-nowrap">{t("Browse Website")}</span>}
          </NavLink>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 pt-0 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">

          {menuItems.map(item => {
          const Icon = item.icon;
          // Check if user has permission for this menu item
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          return <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMobileOpen(false)} className={({
            isActive
          }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium whitespace-nowrap">{t(item.title)}</span>}
              </NavLink>;
        })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Language Toggle Button */}
          <Button onClick={toggleLanguage} variant="outline" className={`w-full gap-3 ${collapsed ? 'px-0 justify-center' : 'justify-start'}`}>
            <Languages className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{language === "en" ? "العربية" : "English"}</span>}
          </Button>
          
          {/* Logout Button */}
          <Button onClick={handleLogout} variant="outline" className={`w-full gap-3 ${collapsed ? 'px-0 justify-center' : 'justify-start'}`}>
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{t("Sign Out")}</span>}
          </Button>
        </div>
      </aside>
    </>;
};
export default DashboardSidebar;