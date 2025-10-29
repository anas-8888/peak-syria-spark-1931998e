import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, CreditCard, Settings, ChevronLeft, ChevronRight, Users, BarChart3, Star, Tag, Truck, Megaphone, Menu, X, FolderTree, Shield, ExternalLink, LogOut, MapPin, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import peakLogo from "@/assets/peak-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
const menuItems = [{
  title: "Overview",
  path: "/dashboard",
  icon: LayoutDashboard,
  end: true
}, {
  title: "Hero Slides",
  path: "/dashboard/hero-slides",
  icon: Image,
  end: false
}, {
  title: "Analytics",
  path: "/dashboard/analytics",
  icon: BarChart3,
  end: false
}, {
  title: "Categories",
  path: "/dashboard/categories",
  icon: FolderTree,
  end: false
}, {
  title: "Regions",
  path: "/dashboard/regions",
  icon: MapPin,
  end: false
}, {
  title: "Products",
  path: "/dashboard/products",
  icon: Package,
  end: false
}, {
  title: "Orders",
  path: "/dashboard/orders",
  icon: ShoppingBag,
  end: false
}, {
  title: "Payments",
  path: "/dashboard/payments",
  icon: CreditCard,
  end: false
}, {
  title: "Reviews",
  path: "/dashboard/reviews",
  icon: Star,
  end: false
}, {
  title: "Discounts",
  path: "/dashboard/discounts",
  icon: Tag,
  end: false
}, {
  title: "Shipping",
  path: "/dashboard/shipping",
  icon: Truck,
  end: false
}, {
  title: "Marketing",
  path: "/dashboard/marketing",
  icon: Megaphone,
  end: false
}, {
  title: "Roles",
  path: "/dashboard/roles",
  icon: Shield,
  end: false
}, {
  title: "Users",
  path: "/dashboard/users",
  icon: Users,
  end: false
}, {
  title: "Settings",
  path: "/dashboard/settings",
  icon: Settings,
  end: false
}];
const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
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
            {!collapsed && <span className="font-medium whitespace-nowrap">Browse Website</span>}
          </NavLink>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 pt-0 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">

          {menuItems.map(item => {
          const Icon = item.icon;
          return <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMobileOpen(false)} className={({
            isActive
          }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium whitespace-nowrap">{item.title}</span>}
              </NavLink>;
        })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Logout Button */}
          <Button onClick={handleLogout} variant="outline" className={`w-full gap-3 ${collapsed ? 'px-0 justify-center' : 'justify-start'}`}>
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Log Out</span>}
          </Button>

          {!collapsed}
        </div>
      </aside>
    </>;
};
export default DashboardSidebar;