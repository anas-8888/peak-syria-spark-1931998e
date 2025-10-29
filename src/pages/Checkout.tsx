import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CheckoutSchema, type CheckoutFormData } from "@/lib/validationSchemas";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const subtotal = 2500000;
  const shipping = 50000;
  const total = subtotal + shipping;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutSchema)
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // Here we would call the secure order creation function
      // Removed console.log to prevent PII exposure in browser dev tools
      
      if (paymentMethod === "card") {
        navigate("/payment");
      } else {
        navigate("/order-tracking");
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/cart" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("cart.title")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("checkout.title")}</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">{t("checkout.contactInfo")}</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t("checkout.email")}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      {...register("email")}
                      className="mt-1" 
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("checkout.phone")}</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      {...register("phone")}
                      placeholder="+963xxxxxxxxx"
                      className="mt-1" 
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">{t("checkout.shippingAddress")}</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">{t("checkout.fullName")}</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      {...register("fullName")}
                      className="mt-1" 
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">{t("checkout.address")}</Label>
                    <Input 
                      id="address" 
                      type="text" 
                      {...register("address")}
                      className="mt-1" 
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">{t("checkout.city")}</Label>
                      <Input 
                        id="city" 
                        type="text" 
                        {...register("city")}
                        className="mt-1" 
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="postal">{t("checkout.postalCode")}</Label>
                      <Input id="postal" type="text" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">{t("checkout.paymentMethod")}</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center cursor-pointer flex-1">
                      <Banknote className="mr-2 h-5 w-5" />
                      {t("checkout.cashOnDelivery")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/5">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                      <CreditCard className="mr-2 h-5 w-5" />
                      {t("checkout.creditCard")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card p-6 rounded-lg shadow-sm sticky top-24">
                <h2 className="text-xl font-bold mb-4">{t("checkout.orderSummary")}</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cart.shipping")}</span>
                    <span className="font-semibold">{formatPrice(shipping)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold">{t("cart.total")}</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "جاري المعالجة..." : t("checkout.placeOrder")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
