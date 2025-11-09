import { createContext, useContext, ReactNode, useMemo } from "react";
import { useLanguage } from "./LanguageContext";

interface CurrencyContextType {
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useLanguage();
  
  const formatPrice = useMemo(() => {
    return (price: number): string => {
      // Format number with commas for thousands, remove .00 if it's a whole number
      const formatted = price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      // Remove .00 if present
      const cleaned = formatted.replace(/\.00$/, '');
      return `${cleaned} ${t("s.p")}`;
    };
  }, [t]);

  const value = useMemo(() => ({ formatPrice }), [formatPrice]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};
