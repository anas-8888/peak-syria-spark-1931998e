import { useState } from "react";
import { Button } from "@/components/ui/button";
import GoogleSignInPopup from "./GoogleSignInPopup";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

const GoogleSignInButton = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { user, loading } = useAuth();

  // Don't show if user is logged in or still loading
  if (user || loading) return null;

  return (
    <>
      {/* Desktop navbar button - compact with icon */}
      <Button
        onClick={() => setIsPopupOpen(true)}
        size="sm"
        className="hidden lg:flex rounded-full shadow-md hover:shadow-lg bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 px-4 h-9 gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="white"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="white"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="white"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="white"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-semibold hidden xl:inline">Google</span>
      </Button>

      {/* Mobile menu button - full width */}
      <Button
        onClick={() => setIsPopupOpen(true)}
        size="sm"
        className="lg:hidden w-full rounded-full shadow-md hover:shadow-lg bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 h-9 gap-2"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="white"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="white"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="white"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="white"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-sm font-semibold">Sign in with Google</span>
      </Button>

      {/* Popup Modal */}
      <GoogleSignInPopup open={isPopupOpen} onOpenChange={setIsPopupOpen} />
    </>
  );
};

export default GoogleSignInButton;
