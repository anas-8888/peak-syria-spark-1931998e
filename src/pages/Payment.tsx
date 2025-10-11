import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PaymentSchema, type PaymentFormData } from "@/lib/validationSchemas";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();

  const total = 2550000;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema)
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate("/order-tracking");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الدفع",
        variant: "destructive"
      });
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="cardNumber" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                {t("payment.cardNumber")}
              </Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                {...register("cardNumber")}
                maxLength={19}
                className="mt-1"
              />
              {errors.cardNumber && (
                <p className="text-sm text-destructive mt-1">{errors.cardNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cardName">{t("payment.cardName")}</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="John Doe"
                {...register("cardName")}
                className="mt-1"
              />
              {errors.cardName && (
                <p className="text-sm text-destructive mt-1">{errors.cardName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">{t("payment.expiryDate")}</Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/YY"
                  {...register("expiry")}
                  maxLength={5}
                  className="mt-1"
                />
                {errors.expiry && (
                  <p className="text-sm text-destructive mt-1">{errors.expiry.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="cvv">{t("payment.cvv")}</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  {...register("cvv")}
                  maxLength={4}
                  className="mt-1"
                />
                {errors.cvv && (
                  <p className="text-sm text-destructive mt-1">{errors.cvv.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("payment.processing") : t("payment.pay")}
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