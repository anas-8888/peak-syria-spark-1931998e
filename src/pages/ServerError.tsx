import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ServerCrash, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ServerError = () => {
  useEffect(() => {
    console.error("500 Error: Internal Server Error occurred");
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <ServerCrash className="h-12 w-12 text-destructive" />
            </div>
          </div>

          {/* Error Code */}
          <div>
            <h1 className="text-8xl font-bold text-destructive mb-4">500</h1>
            <h2 className="text-3xl font-bold mb-2">Internal Server Error</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Something went wrong on our end. We're working to fix the issue. Please try again later.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Link to="/">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </div>

          {/* Support Info */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              If this problem persists, please contact our support team:
            </p>
            <Link to="/contact" className="text-primary hover:underline font-medium">
              Contact Support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerError;
