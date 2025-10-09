import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, CheckCircle, Truck, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const OrderTracking = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [orderNumber, setOrderNumber] = useState("ORD-2024-001");
  const [showTracking, setShowTracking] = useState(true);

  const orderStatus = [
    { status: t("tracking.placed"), completed: true, icon: Package, date: "2024-01-15" },
    { status: t("tracking.confirmed"), completed: true, icon: CheckCircle, date: "2024-01-15" },
    { status: t("tracking.shipped"), completed: true, icon: Truck, date: "2024-01-16" },
    { status: t("tracking.delivered"), completed: false, icon: Home, date: "Est. 2024-01-18" },
  ];

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setShowTracking(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("nav.allProducts")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t("tracking.title")}</h1>

        {/* Order Number Input */}
        <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">{t("tracking.orderNumber")}</Label>
              <Input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-2024-XXXXX"
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" variant="hero" className="w-full md:w-auto">
              {t("tracking.trackOrder")}
            </Button>
          </form>
        </div>

        {/* Order Status */}
        {showTracking && (
          <div className="bg-card p-8 rounded-lg shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{t("tracking.status")}</h2>
              <p className="text-muted-foreground">Order #{orderNumber}</p>
            </div>

            {/* Status Timeline */}
            <div className="space-y-6">
              {orderStatus.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full p-3 ${
                        item.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    {index < orderStatus.length - 1 && (
                      <div
                        className={`w-0.5 h-16 ${
                          item.completed ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <h3
                      className={`font-semibold ${
                        item.completed ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.status}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Details */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold mb-4">{t("checkout.orderSummary")}</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span>{formatPrice(2500000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cart.shipping")}</span>
                  <span>{formatPrice(50000)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>{t("cart.total")}</span>
                  <span className="text-primary">{formatPrice(2550000)}</span>
                </div>
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <p className="font-semibold text-center">
                {t("tracking.estimatedDelivery")}: <span className="text-primary">18 يناير 2024</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default OrderTracking;