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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import peakLogo from "@/assets/peak-logo.png";

const menuItems = [
  { title: "Overview", path: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Products", path: "/dashboard/products", icon: Package, end: false },
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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-card border-l border-border transition-all duration-300 flex flex-col relative
        fixed lg:static inset-y-0 right-0 z-40 lg:z-0
        ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-border">
        {!collapsed && (
          <img src={peakLogo} alt="PEAK Logo" className="h-12 w-auto" />
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">P</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-3 top-24 bg-card border border-border rounded-full shadow-md hover:bg-accent z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
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
