import { MessageCircle, Facebook, Instagram, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
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
        {/* Main Footer Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-8 lg:gap-10">
              {/* About PEAK Syria - Spans 2 columns */}
              <div className="lg:col-span-2 space-y-1.5 sm:space-y-4">
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  PEAK Syria
                </h3>
                <p className="text-secondary-foreground/80 leading-relaxed text-xs sm:text-sm">
                  {settings?.brand_description ? t(settings.brand_description) : t('Official distributor of PEAK sportswear in Syria. Premium quality, authentic products.')}
                </p>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm mb-1.5 sm:mb-3 text-secondary-foreground/90">{t("CONNECT WITH US")}</h4>
                  <div className="flex gap-1 sm:gap-2">
                    {settings?.facebook_url && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="group relative p-1.5 sm:p-2 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110 flex items-center justify-center">
                        <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                    {settings?.instagram_url && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="group relative p-1.5 sm:p-2 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110 flex items-center justify-center">
                        <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                    {settings?.whatsapp_number && <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="group relative p-1.5 sm:p-2 bg-primary/10 rounded-lg hover:bg-primary transition-all duration-300 hover:scale-110 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                      </a>}
                  </div>
                </div>
              </div>

              {/* Shop */}
              <div>
                <h4 className="font-bold text-lg sm:text-base uppercase mb-4 sm:mb-4 relative inline-block tracking-wider">
                  {t("Shop")}
                  <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-0 sm:space-y-1 [&>li]:!my-0 sm:[&>li]:!my-0">
                  <li>
                    <Link to="/products" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("All Products")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=new-arrival" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("New Arrivals")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=best-seller" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Best Sellers")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=limited-edition" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Limited Edition")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?flag=offer" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Special Offers")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-bold text-lg sm:text-base uppercase mb-4 sm:mb-4 relative inline-block tracking-wider">
                  {t("Categories")}
                  <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-0 sm:space-y-1 [&>li]:!my-0 sm:[&>li]:!my-0">
                  {categories && categories.length > 0 ? categories.slice(0, 5).map(category => <li key={category.id}>
                        <Link to={`/categories/${category.id}`} className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                          <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                          {t(category.name)}
                        </Link>
                      </li>) : <> 
                    </>}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-bold text-lg sm:text-base uppercase mb-4 sm:mb-4 relative inline-block tracking-wider">
                  {t("Support")}
                  <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-0 sm:space-y-1 [&>li]:!my-0 sm:[&>li]:!my-0">
                  <li>
                    <Link to="/contact" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Contact Us")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("About Us")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/order-tracking" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Track Your Order")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/cart" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("Shopping Cart")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/wishlist" className="group text-secondary-foreground/80 hover:text-primary transition-all duration-300 inline-flex sm:flex items-center gap-1 sm:gap-2 text-sm sm:text-sm">
                      <span className="w-0 h-0.5 bg-primary group-hover:w-3 transition-all duration-300"></span>
                      {t("My Wishlist")}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Get In Touch */}
              <div>
                <h4 className="font-bold text-lg sm:text-base uppercase mb-4 sm:mb-4 relative inline-block tracking-wider">
                  {t("Get In Touch")}
                  <span className="absolute -bottom-1.5 left-0 w-8 h-0.5 bg-primary"></span>
                </h4>
                <ul className="space-y-0 sm:space-y-1.5 [&>li]:!my-0 sm:[&>li]:!my-0">
                  <li className="flex items-start gap-2 text-secondary-foreground/80 text-sm sm:text-sm">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{settings?.store_phone || '+963 XXX XXX XXX'}</span>
                  </li>
                  <li className="flex items-start gap-2 text-secondary-foreground/80 text-sm sm:text-sm">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="break-all">{settings?.store_email || 'info@peaksyria.com'}</span>
                  </li>
                  {settings?.whatsapp_number && <li className="flex items-start gap-2 text-secondary-foreground/80 text-sm sm:text-sm">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                      <a href={`https://wa.me/${settings.whatsapp_number}`} className="hover:text-primary transition-colors inline-block">
                        {t("WhatsApp Support")}
                      </a>
                    </li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary/30 px-4 sm:px-6 py-3 sm:py-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-secondary-foreground/70">
              <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                <p className="font-semibold text-center md:text-left text-xs sm:text-sm">
                  &copy; {new Date().getFullYear()} PEAK Syria. {t("All rights reserved.")}
                </p>
                <div className="text-[11px] sm:text-xs">
                  <Link to="/terms" className="hover:text-primary transition-colors inline">{t("Terms")}</Link>
                  <span className=" sm:inline mx-1">•</span>
                  <Link to="/privacy" className="hover:text-primary transition-colors inline mx-1 sm:mx-0">{t("Privacy")}</Link>
                  <span className=" sm:inline mx-1">•</span>
                  <Link to="/refund" className="hover:text-primary transition-colors inline mx-1 sm:mx-0">{t("Refund Policy")}</Link>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-center md:text-right">
                {t("Developed by")}{" "}
                <a href="https://nexa-group.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90 transition-all duration-300 font-semibold relative inline-block group">
                  NEXA GROUP
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;