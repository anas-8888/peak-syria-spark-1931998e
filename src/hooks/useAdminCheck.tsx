import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    // Always start in loading state when (re)checking
    setLoading(true);

    // React to auth state changes to keep role up-to-date
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const uid = session?.user?.id;
      if (!uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      checkAdminStatus(uid);
    });

    // Initial check using current session or provided user
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id || user?.id || null;
      if (!uid) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      checkAdminStatus(uid);
    })();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const checkAdminStatus = async (uid?: string) => {
    // Ensure loading is true every time we (re)check to avoid race conditions
    setLoading(true);

    const targetId = uid ?? user?.id ?? null;
    if (!targetId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("is_admin", { _user_id: targetId });
      if (error) throw error;
      setIsAdmin(Boolean(data));
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading, checkAdminStatus };
};
