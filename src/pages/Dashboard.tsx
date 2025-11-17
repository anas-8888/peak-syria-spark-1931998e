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

  useEffect(() => {
    // Check auth and admin status once loading completes
    if (!authLoading && !adminLoading) {
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
  }, [user, isAdmin, authLoading, adminLoading, navigate, t, toast]);

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
