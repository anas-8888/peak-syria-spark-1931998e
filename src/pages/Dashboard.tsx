import { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const Dashboard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  // Use refs to track previous values and prevent unnecessary re-renders
  const hasCheckedRef = useRef(false);
  const previousUserIdRef = useRef<string | undefined>(undefined);
  const previousIsAdminRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const currentUserId = user?.id;
    const currentIsAdmin = isAdmin;
    
    // Only check once when loading completes, not on every state change
    if (!authLoading && !adminLoading && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      previousUserIdRef.current = currentUserId;
      previousIsAdminRef.current = currentIsAdmin;
      
      if (!user) {
        toast({
          title: t("Authentication Required"),
          description: t("Please login to access the dashboard"),
          variant: "destructive",
        });
        navigate("/admin-login");
      } else if (!isAdmin) {
        toast({
          title: t("Access Denied"),
          description: t("You don't have admin privileges"),
          variant: "destructive",
        });
        navigate("/");
      }
    }
    
    // Only reset check flag if user or admin status actually changed
    if (previousUserIdRef.current !== currentUserId || previousIsAdminRef.current !== currentIsAdmin) {
      previousUserIdRef.current = currentUserId;
      previousIsAdminRef.current = currentIsAdmin;
      
      if (!user || !isAdmin) {
        // Reset flag if user logs out or loses admin status
        hasCheckedRef.current = false;
      }
    }
  }, [user?.id, isAdmin, authLoading, adminLoading, navigate, t, user]);

  // Show loading spinner while checking authentication and admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("Loading dashboard...")}</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin (handled in useEffect)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("Verifying access...")}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto max-h-screen w-full lg:w-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
