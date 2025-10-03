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
    
    // Cart & Checkout
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Add some products to get started",
    "cart.continueShopping": "Continue Shopping",
    "cart.startShopping": "Start Shopping",
    "cart.size": "Size",
    "cart.quantity": "Quantity",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.total": "Total",
    "cart.checkout": "Proceed to Checkout",
    
    // Checkout
    "checkout.title": "Checkout",
    "checkout.contactInfo": "Contact Information",
    "checkout.email": "Email",
    "checkout.phone": "Phone Number",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.fullName": "Full Name",
    "checkout.address": "Address",
    "checkout.city": "City",
    "checkout.postalCode": "Postal Code",
    "checkout.paymentMethod": "Payment Method",
    "checkout.cashOnDelivery": "Cash on Delivery",
    "checkout.creditCard": "Credit/Debit Card",
    "checkout.placeOrder": "Place Order",
    "checkout.orderSummary": "Order Summary",
    
    // Payment
    "payment.title": "Payment",
    "payment.processing": "Processing Payment",
    "payment.success": "Payment Successful!",
    "payment.failed": "Payment Failed",
    "payment.cardNumber": "Card Number",
    "payment.cardName": "Name on Card",
    "payment.expiryDate": "Expiry Date",
    "payment.cvv": "CVV",
    "payment.pay": "Pay Now",
    
    // Order Tracking
    "tracking.title": "Order Tracking",
    "tracking.orderNumber": "Order Number",
    "tracking.trackOrder": "Track Order",
    "tracking.status": "Order Status",
    "tracking.placed": "Order Placed",
    "tracking.confirmed": "Confirmed",
    "tracking.shipped": "Shipped",
    "tracking.delivered": "Delivered",
    "tracking.estimatedDelivery": "Estimated Delivery",
    
    // Auth
    "auth.login": "Login",
    "auth.signup": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot Password?",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.alreadyHaveAccount": "Already have an account?",
    "auth.loginButton": "Login",
    "auth.signupButton": "Create Account",
    "auth.or": "or",
    "auth.continueWithGoogle": "Continue with Google",
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
    
    // Cart & Checkout
    "cart.title": "سلة التسوق",
    "cart.empty": "سلتك فارغة",
    "cart.emptyDesc": "أضف بعض المنتجات للبدء",
    "cart.continueShopping": "متابعة التسوق",
    "cart.startShopping": "ابدأ التسوق",
    "cart.size": "المقاس",
    "cart.quantity": "الكمية",
    "cart.subtotal": "المجموع الفرعي",
    "cart.shipping": "التوصيل",
    "cart.total": "المجموع الإجمالي",
    "cart.checkout": "إتمام الطلب",
    
    // Checkout
    "checkout.title": "إتمام الطلب",
    "checkout.contactInfo": "معلومات الاتصال",
    "checkout.email": "البريد الإلكتروني",
    "checkout.phone": "رقم الهاتف",
    "checkout.shippingAddress": "عنوان التوصيل",
    "checkout.fullName": "الاسم الكامل",
    "checkout.address": "العنوان",
    "checkout.city": "المدينة",
    "checkout.postalCode": "الرمز البريدي",
    "checkout.paymentMethod": "طريقة الدفع",
    "checkout.cashOnDelivery": "الدفع عند الاستلام",
    "checkout.creditCard": "بطاقة ائتمان",
    "checkout.placeOrder": "تأكيد الطلب",
    "checkout.orderSummary": "ملخص الطلب",
    
    // Payment
    "payment.title": "الدفع",
    "payment.processing": "جاري معالجة الدفع",
    "payment.success": "تم الدفع بنجاح!",
    "payment.failed": "فشل الدفع",
    "payment.cardNumber": "رقم البطاقة",
    "payment.cardName": "الاسم على البطاقة",
    "payment.expiryDate": "تاريخ الانتهاء",
    "payment.cvv": "رمز الأمان",
    "payment.pay": "ادفع الآن",
    
    // Order Tracking
    "tracking.title": "تتبع الطلب",
    "tracking.orderNumber": "رقم الطلب",
    "tracking.trackOrder": "تتبع الطلب",
    "tracking.status": "حالة الطلب",
    "tracking.placed": "تم تقديم الطلب",
    "tracking.confirmed": "تم التأكيد",
    "tracking.shipped": "قيد الشحن",
    "tracking.delivered": "تم التوصيل",
    "tracking.estimatedDelivery": "موعد التوصيل المتوقع",
    
    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.confirmPassword": "تأكيد كلمة المرور",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.dontHaveAccount": "ليس لديك حساب؟",
    "auth.alreadyHaveAccount": "لديك حساب بالفعل؟",
    "auth.loginButton": "تسجيل الدخول",
    "auth.signupButton": "إنشاء حساب",
    "auth.or": "أو",
    "auth.continueWithGoogle": "المتابعة مع جوجل",
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
