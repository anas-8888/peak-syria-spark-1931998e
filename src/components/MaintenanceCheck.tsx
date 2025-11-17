import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Maintenance from "@/pages/Maintenance";
import { Loader2 } from "lucide-react";

interface MaintenanceCheckProps {
  children: ReactNode;
}

const MaintenanceCheck = ({ children }: MaintenanceCheckProps) => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const location = useLocation();
  
  // Allow access to admin routes regardless of maintenance mode
  const isAdminRoute = location.pathname === '/admin-login' || location.pathname.startsWith('/dashboard');

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store_settings_maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("maintenance_mode")
        .single();

      if (error) throw error;
      return data;
    },
    retry: 2,
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Show loading while checking
  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is enabled and user is not an admin and not on admin route, show maintenance page
  if (settings?.maintenance_mode && !isAdmin && !isAdminRoute) {
    return <Maintenance />;
  }

  // Otherwise, show the regular content
  return <>{children}</>;
};

export default MaintenanceCheck;

