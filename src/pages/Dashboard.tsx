import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        toast.error(t("Authentication Required"), {
          description: t("Please login to access the dashboard"),
        });
        navigate("/admin-login");
      } else if (!isAdmin) {
        toast.error(t("Access Denied"), {
          description: t("You don't have admin privileges"),
        });
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  // Return null until verification completes - don't render anything
  if (authLoading || adminLoading || !user || !isAdmin) {
    return null;
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
