import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const Payment = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const total = 2550000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/order-tracking");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/checkout" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("checkout.title")}
        </Link>

        <div className="bg-card p-8 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{t("payment.title")}</h1>
            <Lock className="h-6 w-6 text-green-600" />
          </div>

          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("cart.total")}</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="cardNumber" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                {t("payment.cardNumber")}
              </Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                required
                maxLength={19}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cardName">{t("payment.cardName")}</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="John Doe"
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">{t("payment.expiryDate")}</Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  required
                  maxLength={5}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cvv">{t("payment.cvv")}</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  required
                  maxLength={4}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? t("payment.processing") : t("payment.pay")}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              <Lock className="inline h-3 w-3 mr-1" />
              Your payment information is secure and encrypted
            </p>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Payment;