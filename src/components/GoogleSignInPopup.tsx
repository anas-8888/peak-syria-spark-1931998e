import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import peakLogo from "@/assets/peak-logo-new.png";

interface GoogleSignInPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GoogleSignInPopup = ({ open, onOpenChange }: GoogleSignInPopupProps) => {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        title: t("Sign In Failed"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Close popup on success - the redirect will happen automatically
      onOpenChange(false);
    }
  };

  return (
    <>
      {/* Backdrop with blur */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] animate-fade-in" onClick={() => onOpenChange(false)} />
      )}
      
      {/* Popup Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px] sm:max-h-[90vh] p-0 overflow-y-auto border-2 border-primary/20 shadow-2xl animate-scale-in z-[101]">
          <VisuallyHidden>
            <DialogTitle>{t("Welcome to PEAK Syria")}</DialogTitle>
            <DialogDescription>{t("Sign in to access exclusive products, track orders, and enjoy personalized shopping")}</DialogDescription>
          </VisuallyHidden>
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary via-red-500 to-primary p-8 text-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 w-fit mx-auto mb-4 shadow-xl">
              <img src={peakLogo} alt="PEAK Logo" className="h-12 w-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white drop-shadow-md">
              {t("Welcome to PEAK Syria")}
            </h2>
            <p className="text-white/90 text-sm mt-2">{t("Official PEAK distributor")}</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 pb-8">
            <p className="text-center text-muted-foreground text-sm leading-relaxed">
              {t("Sign in to access exclusive products, track orders, and enjoy personalized shopping")}
            </p>

            {/* Google Sign In Button */}
            <Button 
              onClick={handleGoogleSignIn}
              size="lg"
              className="w-full h-16 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-primary/30 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="mr-3 h-7 w-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-lg font-semibold">{t("Continue with Google")}</span>
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4 px-2 pb-2">
              {t("By signing in, you agree to our")}{" "}
              <a href="/terms" className="text-primary hover:underline">{t("Terms")}</a> {t("and")}{" "}
              <a href="/privacy" className="text-primary hover:underline">{t("Privacy Policy")}</a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleSignInPopup;
