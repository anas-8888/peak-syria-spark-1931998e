import { createContext, useContext, ReactNode } from "react";

interface LanguageContextType {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
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
  
  // AI Assistant
  "ai.chatWithUs": "Chat with us",
  "ai.askQuestion": "Ask a question...",
  "ai.send": "Send",
  "ai.typing": "AI is typing...",
  "ai.welcome": "Hello! How can I help you today?",
  "ai.close": "Close",
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const t = (key: string): string => {
    return translations[key as keyof typeof translations] || key;
  };

  return (
    <LanguageContext.Provider value={{ t }}>
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
