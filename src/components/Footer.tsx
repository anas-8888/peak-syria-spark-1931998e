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
    <footer className="bg-secondary text-secondary-foreground border-t border-primary/20 w-full">
      <div className="w-full px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <span className="text-primary">PEAK</span> Syria
            </h3>
            <p className="text-secondary-foreground/70 mb-4">
              {settings?.brand_description || 'Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.'}
            </p>
            <div className="flex gap-3">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.whatsapp_number && (
                <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      to={`/category/${category.id}`} 
                      className="text-secondary-foreground/70 hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/products?category=basketball" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                      Basketball
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=running" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                      Running
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=apparel" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                      Apparel
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=accessories" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                      Accessories
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Phone className="h-4 w-4 text-primary" />
                <span>{settings?.store_phone || '+963 XXX XXX XXX'}</span>
              </li>
              <li className="flex items-center gap-2 text-secondary-foreground/70">
                <Mail className="h-4 w-4 text-primary" />
                <span>{settings?.store_email || 'info@peaksyria.com'}</span>
              </li>
              {settings?.whatsapp_number && (
                <li className="flex items-center gap-2 text-secondary-foreground/70">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <a href={`https://wa.me/${settings.whatsapp_number}`} className="hover:text-primary transition-colors">
                    WhatsApp Support
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-8 text-center text-secondary-foreground/60 text-sm space-y-2">
          <p>&copy; {new Date().getFullYear()} PEAK Syria. All rights reserved. Powered by passion for sports.</p>
          <p className="text-xs">
            Developed by{" "}
            <a 
              href="https://nexa-group.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              NEXA GROUP
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
