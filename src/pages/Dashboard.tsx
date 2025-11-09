import { useEffect, useRef } from "react";
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
