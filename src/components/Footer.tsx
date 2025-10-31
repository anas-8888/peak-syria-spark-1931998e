import { MessageCircle, Facebook, Instagram, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  // Fetch root categories
  const { data: categories } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <footer className="relative bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-secondary-foreground border-t border-primary/30 w-full overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative w-full px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PEAK Syria
            </h3>
            <p className="text-secondary-foreground/80 leading-relaxed">
              {settings?.brand_description || 'Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.'}
            </p>
            <div className="flex gap-4">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-secondary-foreground/5 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <Facebook className="h-5 w-5 group-hover:text-primary transition-colors" />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-secondary-foreground/5 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <Instagram className="h-5 w-5 group-hover:text-primary transition-colors" />
                </a>
              )}
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-secondary-foreground/5 rounded-lg hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <MessageCircle className="h-5 w-5 group-hover:text-primary transition-colors" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                  <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                  <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                  <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cart" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                  <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Categories
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-3">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      to={`/category/${category.id}`} 
                      className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1"
                    >
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/products?category=basketball" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                      Basketball
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=running" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                      Running
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=apparel" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                      Apparel
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=accessories" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2 hover:translate-x-1">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-4 transition-all duration-300"></span>
                      Accessories
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-primary rounded-full"></span>
            </h4>
            <ul className="space-y-4">
              <li className="group flex items-center gap-3 text-secondary-foreground/80 hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <span>{settings?.store_phone || '+963 XXX XXX XXX'}</span>
              </li>
              <li className="group flex items-center gap-3 text-secondary-foreground/80 hover:text-primary transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span>{settings?.store_email || 'info@peaksyria.com'}</span>
              </li>
              {settings?.whatsapp_number && (
                <li className="group flex items-center gap-3 text-secondary-foreground/80">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <a href={`https://wa.me/${settings.whatsapp_number}`} className="hover:text-primary transition-colors">
                    WhatsApp Support
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/30 mt-12 pt-8 text-center text-secondary-foreground/70 text-sm space-y-3">
          <p className="font-medium">&copy; {new Date().getFullYear()} PEAK Syria. All rights reserved. Powered by passion for sports.</p>
          <p className="text-xs">
            Developed by{" "}
            <a 
              href="https://nexa-group.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/90 transition-all duration-300 font-semibold relative inline-block group"
            >
              NEXA GROUP
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
