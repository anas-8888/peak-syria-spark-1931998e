import { Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { t } = useLanguage();
  const location = window.location;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          {/* Error Code */}
          <div>
            <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-2">{t("Page Not Found")}</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t("The page you're looking for doesn't exist or has been moved.")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("Go Back")}
            </Button>
            <Link to="/">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                {t("Return to Home")}
              </Button>
            </Link>
          </div>

          {/* Additional Help */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              {t("Need help? Check out these pages:")}
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <Link to="/products" className="text-primary hover:underline">
                {t("All Products")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/about" className="text-primary hover:underline">
                {t("About")}
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/contact" className="text-primary hover:underline">
                {t("Contact Us")}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
