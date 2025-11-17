import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Cache admin status in memory to prevent repeated RPC calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // Cache for 30 minutes

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading first
    if (authLoading) {
      return;
    }

    const checkAdminStatus = async () => {
      // If no user, not admin
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = adminCache.get(user.id);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        setIsAdmin(cached.isAdmin);
        setLoading(false);
        return;
      }

      // Fetch from database
      try {
        const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
        if (error) throw error;
        
        const adminStatus = Boolean(data);
        setIsAdmin(adminStatus);
        
        // Cache the result
        adminCache.set(user.id, {
          isAdmin: adminStatus,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, authLoading]);

  return { isAdmin, loading };
};
