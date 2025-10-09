import { createContext, useContext, ReactNode } from "react";

interface CurrencyContextType {
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const formatPrice = (price: number): string => {
    return `$${price.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ formatPrice }}>
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
