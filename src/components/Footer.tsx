import { MessageCircle, Facebook, Instagram, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
const Footer = () => {
  // Fetch root categories
  const {
    data: categories
  } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('categories').select('id, name').is('parent_id', null).eq('is_active', true).order('display_order', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch store settings
  const {
    data: settings
  } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('store_settings').select('*').limit(1).single();
      if (error) throw error;
      return data;
    }
  });
  return <footer className="relative bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground border-t-2 border-primary/40 w-full overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>
      
      <div className="relative w-full">
        {/* Newsletter Section */}
        

        {/* Main Footer Content */}
        <div className="px-4 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
              {/* About PEAK Syria - Spans 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  PEAK Syria
                </h3>
                <p className="text-secondary-foreground/80 leading-relaxed">
                  {settings?.brand_description || 'Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.'}
                </p>
                <div>
                  <h4 className="font-semibold text-sm mb-4 text-secondary-foreground/90">CONNECT WITH US</h4>
                  <div className="flex gap-3">
                    {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110">
                        <Facebook className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                    {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110">
                        <Instagram className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                    {settings?.whatsapp_number && <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="group relative p-3 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110">
                        <MessageCircle className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                  </div>
                </div>
              </div>

              {/* Shop */}
              <div>
                <h4 className="font-bold text-sm uppercase mb-6 relative inline-block tracking-wider">
                  Shop
                  <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/products" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=new-arrival" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=best-seller" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Best Sellers
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=offer" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Special Offers
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-bold text-sm uppercase mb-6 relative inline-block tracking-wider">
                  Categories
                  <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-3">
                  {categories && categories.length > 0 ? categories.slice(0, 5).map(category => <li key={category.id}>
                        <Link to={`/category/${category.id}`} className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                          <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                          {category.name}
                        </Link>
                      </li>) : <>
                      <li>
                        <Link to="/products?category=basketball" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                          <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                          Basketball
                        </Link>
                      </li>
                      <li>
                        <Link to="/products?category=running" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                          <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                          Running
                        </Link>
                      </li>
                      <li>
                        <Link to="/products?category=apparel" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                          <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                          Apparel
                        </Link>
                      </li>
                    </>}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-bold text-sm uppercase mb-6 relative inline-block tracking-wider">
                  Support
                  <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/contact" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/order-tracking" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Track Order
                    </Link>
                  </li>
                  <li>
                    <Link to="/cart" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Shopping Cart
                    </Link>
                  </li>
                  <li>
                    <Link to="/wishlist" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 flex items-center gap-2">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      Wishlist
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-sm uppercase mb-6 relative inline-block tracking-wider">
                  Get In Touch
                  <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-secondary-foreground/80 text-sm">
                    <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{settings?.store_phone || '+963 XXX XXX XXX'}</span>
                  </li>
                  <li className="flex items-start gap-3 text-secondary-foreground/80 text-sm">
                    <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all">{settings?.store_email || 'info@peaksyria.com'}</span>
                  </li>
                  {settings?.whatsapp_number && <li className="flex items-start gap-3 text-secondary-foreground/80 text-sm">
                      <MessageCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <a href={`https://wa.me/${settings.whatsapp_number}`} className="hover:text-primary transition-colors">
                        WhatsApp Support
                      </a>
                    </li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/30 px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/70">
              <p className="font-medium">
                &copy; {new Date().getFullYear()} PEAK Syria. All rights reserved. Powered by passion for sports.
              </p>
              <p className="text-xs">
                Developed by{" "}
                <a href="https://nexa-group.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90 transition-all duration-300 font-semibold relative inline-block group">
                  NEXA GROUP
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;