import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ReactNode } from "react";
import Maintenance from "@/pages/Maintenance";
import { Loader2 } from "lucide-react";

interface MaintenanceCheckProps {
  children: ReactNode;
}

const MaintenanceCheck = ({ children }: MaintenanceCheckProps) => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();

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
  });

  // Show loading while checking
  if (isLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is enabled and user is not an admin, show maintenance page
  if (settings?.maintenance_mode && !isAdmin) {
    return <Maintenance />;
  }

  // Otherwise, show the regular content
  return <>{children}</>;
};

export default MaintenanceCheck;

