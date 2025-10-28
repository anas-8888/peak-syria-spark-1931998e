import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        toast.error("Authentication Required", {
          description: "Please login to access the dashboard",
        });
        navigate("/admin-login");
      } else if (!isAdmin) {
        toast.error("Access Denied", {
          description: "You don't have admin privileges",
        });
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
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
