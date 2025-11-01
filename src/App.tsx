import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { HelmetProvider } from "react-helmet-async";
import ProfileCompletionCheck from "./components/ProfileCompletionCheck";
import Index from "./pages/Index";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import FlagProducts from "./pages/FlagProducts";
import CategoryBrowse from "./pages/CategoryBrowse";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CartNew from "./pages/CartNew";
import Checkout from "./pages/Checkout";
import CheckoutNew from "./pages/CheckoutNew";
import Payment from "./pages/Payment";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/dashboard/Overview";
import HeroSlides from "./pages/dashboard/HeroSlides";
import Banners from "./pages/dashboard/Banners";
import HeroShowcase from "./pages/dashboard/HeroShowcase";
import Products from "./pages/dashboard/Products";
import Orders from "./pages/dashboard/Orders";
import Payments from "./pages/dashboard/Payments";
import PaymentMethods from "./pages/dashboard/PaymentMethods";
import Users from "./pages/dashboard/Users";
import Roles from "./pages/dashboard/Roles";
import Analytics from "./pages/dashboard/Analytics";
import Reviews from "./pages/dashboard/Reviews";
import Discounts from "./pages/dashboard/Discounts";
import Shipping from "./pages/dashboard/Shipping";
import Marketing from "./pages/dashboard/Marketing";
import DashboardSettings from "./pages/dashboard/Settings";
import Categories from "./pages/dashboard/Categories";
import Regions from "./pages/dashboard/Regions";
import Colors from "./pages/dashboard/Colors";
import AboutManagement from "./pages/dashboard/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import LegalPages from "./pages/dashboard/LegalPages";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <CartProvider>
                  <ProfileCompletionCheck>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<ProductsEnhanced />} />
                  <Route path="/flag-products" element={<FlagProducts />} />
                  <Route path="/categories/:categoryId" element={<CategoryBrowse />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<CartNew />} />
                  <Route path="/checkout" element={<CheckoutNew />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/order-tracking" element={<OrderTracking />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/refund" element={<Refund />} />
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={<Dashboard />}>
                    <Route index element={<Overview />} />
                    <Route path="hero-slides" element={<HeroSlides />} />
                    <Route path="banners" element={<Banners />} />
                    <Route path="showcase" element={<HeroShowcase />} />
                    <Route path="products" element={<Products />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="colors" element={<Colors />} />
                  <Route path="regions" element={<Regions />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="payment-methods" element={<PaymentMethods />} />
                    <Route path="users" element={<Users />} />
                    <Route path="roles" element={<Roles />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="discounts" element={<Discounts />} />
                    <Route path="shipping" element={<Shipping />} />
                    <Route path="marketing" element={<Marketing />} />
                  <Route path="about" element={<AboutManagement />} />
                  <Route path="legal-pages" element={<LegalPages />} />
                    <Route path="settings" element={<DashboardSettings />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                  </TooltipProvider>
                </ProfileCompletionCheck>
              </CartProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
