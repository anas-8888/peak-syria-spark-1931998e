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
      {/* Desktop: Top-right floating button */}
      <div className="hidden md:block fixed top-20 right-6 z-50 animate-fade-in">
        <Button
          onClick={() => setIsPopupOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 px-6"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Sign in with Google
        </Button>
      </div>

      {/* Mobile: Bottom-center floating button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <Button
          onClick={() => setIsPopupOpen(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl bg-gradient-to-r from-primary via-red-500 to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500 px-6"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Sign in with Google
        </Button>
      </div>

      {/* Popup Modal */}
      <GoogleSignInPopup open={isPopupOpen} onOpenChange={setIsPopupOpen} />
    </>
  );
};

export default GoogleSignInButton;
