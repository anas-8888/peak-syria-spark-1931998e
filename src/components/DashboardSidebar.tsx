import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  Star,
  Tag,
  Warehouse,
  Truck,
  Megaphone,
  Menu,
  X,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import peakLogo from "@/assets/peak-logo.png";

const menuItems = [
  { title: "Overview", path: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Products", path: "/dashboard/products", icon: Package, end: false },
  { title: "Categories", path: "/dashboard/categories", icon: FolderTree, end: false },
  { title: "Orders", path: "/dashboard/orders", icon: ShoppingBag, end: false },
  { title: "Payments", path: "/dashboard/payments", icon: CreditCard, end: false },
  { title: "Customers", path: "/dashboard/customers", icon: Users, end: false },
  { title: "Analytics", path: "/dashboard/analytics", icon: BarChart3, end: false },
  { title: "Reviews", path: "/dashboard/reviews", icon: Star, end: false },
  { title: "Discounts", path: "/dashboard/discounts", icon: Tag, end: false },
  { title: "Inventory", path: "/dashboard/inventory", icon: Warehouse, end: false },
  { title: "Shipping", path: "/dashboard/shipping", icon: Truck, end: false },
  { title: "Marketing", path: "/dashboard/marketing", icon: Megaphone, end: false },
  { title: "Settings", path: "/dashboard/settings", icon: Settings, end: false },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top left */}
      <Button
        onClick={() => setMobileOpen(!mobileOpen)}
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-20 left-4 z-50 rounded-full shadow-lg bg-background border-2"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-fade-in backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${collapsed ? "w-20" : "w-64"}
          min-h-screen max-h-screen
          bg-card border-l border-border transition-all duration-300 flex flex-col
          lg:static lg:translate-x-0
          fixed inset-y-0 right-0 z-50
          ${mobileOpen ? "translate-x-0" : "translate-x-full"}
          shadow-2xl lg:shadow-none
        `}
      >
        {/* Mobile Close Button */}
        <Button
          onClick={() => setMobileOpen(false)}
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 left-4 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-border pt-4 lg:pt-0">
          {!collapsed && (
            <img src={peakLogo} alt="PEAK Logo" className="h-12 w-auto" />
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">P</span>
            </div>
          )}
        </div>

        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:block absolute -left-3 top-24 bg-card border border-border rounded-full shadow-md hover:bg-accent z-10"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-primary mb-1">Admin Panel</p>
              <p className="text-xs text-muted-foreground">PEAK Syria</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default DashboardSidebar;
