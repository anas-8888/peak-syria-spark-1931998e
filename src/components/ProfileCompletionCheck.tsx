import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProfileCompletionCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Only check if user is logged in and not already on profile page
      if (user && !loading && location.pathname !== "/profile") {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .single();

          if (error) throw error;

          // If phone is empty, redirect to profile to complete it
          if (!profile?.phone || profile.phone.trim() === "") {
            navigate("/profile", { replace: true });
          }
        } catch (error) {
          console.error("Error checking profile:", error);
        }
      }
    };

    checkProfileCompletion();
  }, [user, loading, location.pathname, navigate]);

  return <>{children}</>;
};

export default ProfileCompletionCheck;
