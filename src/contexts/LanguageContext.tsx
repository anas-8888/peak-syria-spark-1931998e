import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navbar
    "nav.allProducts": "All Products",
    "nav.basketball": "Basketball",
    "nav.running": "Running",
    "nav.casual": "Casual",
    "nav.about": "About",
    
    // Home
    "home.featuredTitle": "Featured Collection",
    "home.featuredDesc": "Discover our handpicked selection of premium sportswear",
    "home.viewAll": "View All Products",
    "home.categoryTitle": "Shop by Category",
    "home.categoryDesc": "Find your perfect sport",
    "home.explore": "Explore Collection",
    
    // Categories
    "category.basketball": "Basketball",
    "category.running": "Running",
    "category.apparel": "Apparel",
    "category.basketballDesc": "Pro-level basketball gear",
    "category.runningDesc": "Performance running shoes",
    "category.apparelDesc": "Premium athletic wear",
    
    // Trust Section
    "trust.authentic": "100% Authentic",
    "trust.authenticDesc": "Official PEAK distributor in Syria",
    "trust.delivery": "Fast Delivery",
    "trust.deliveryDesc": "Quick shipping across Syria",
    "trust.quality": "Premium Quality",
    "trust.qualityDesc": "World-class sportswear",
    
    // Products
    "product.addToCart": "Add to Cart",
    "product.colors": "Colors",
    "product.sizes": "Sizes",
    "product.new": "New",
    
    // Currency
    "currency.syp": "SYP",
    "currency.usd": "USD",
  },
  ar: {
    // Navbar
    "nav.allProducts": "جميع المنتجات",
    "nav.basketball": "كرة السلة",
    "nav.running": "الجري",
    "nav.casual": "عادي",
    "nav.about": "معلومات عنا",
    
    // Home
    "home.featuredTitle": "المجموعة المميزة",
    "home.featuredDesc": "اكتشف مجموعتنا المختارة من الملابس الرياضية المميزة",
    "home.viewAll": "عرض جميع المنتجات",
    "home.categoryTitle": "تسوق حسب الفئة",
    "home.categoryDesc": "اعثر على رياضتك المثالية",
    "home.explore": "استكشف المجموعة",
    
    // Categories
    "category.basketball": "كرة السلة",
    "category.running": "الجري",
    "category.apparel": "الملابس",
    "category.basketballDesc": "معدات كرة السلة الاحترافية",
    "category.runningDesc": "أحذية الجري عالية الأداء",
    "category.apparelDesc": "ملابس رياضية فاخرة",
    
    // Trust Section
    "trust.authentic": "أصلي 100%",
    "trust.authenticDesc": "موزع PEAK الرسمي في سوريا",
    "trust.delivery": "توصيل سريع",
    "trust.deliveryDesc": "شحن سريع في جميع أنحاء سوريا",
    "trust.quality": "جودة عالية",
    "trust.qualityDesc": "ملابس رياضية عالمية المستوى",
    
    // Products
    "product.addToCart": "أضف إلى السلة",
    "product.colors": "الألوان",
    "product.sizes": "المقاسات",
    "product.new": "جديد",
    
    // Currency
    "currency.syp": "ل.س",
    "currency.usd": "دولار",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
