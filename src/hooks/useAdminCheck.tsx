import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Cache admin status in memory to prevent repeated RPC calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // Cache for 30 minutes

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Track if we've already checked to prevent unnecessary re-checks
  const hasCheckedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const currentUserId = user?.id;
    
    // If user hasn't changed and we've already checked, use cache
    if (lastUserIdRef.current === currentUserId && hasCheckedRef.current && !isCheckingRef.current) {
      const cached = adminCache.get(currentUserId || '');
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        setIsAdmin(cached.isAdmin);
        setLoading(false);
        return;
      }
    }
    
    // Only set loading if user actually changed or we haven't checked yet
    if (lastUserIdRef.current !== currentUserId || !hasCheckedRef.current) {
    setLoading(true);
    }
    
    lastUserIdRef.current = currentUserId;

    // React to auth state changes to keep role up-to-date
    // Ignore TOKEN_REFRESHED events to prevent unnecessary refetches
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      // Ignore TOKEN_REFRESHED events - user hasn't changed
      if (event === 'TOKEN_REFRESHED') {
        return;
      }
      
      const uid = session?.user?.id;
      if (!uid) {
        setIsAdmin(false);
        setLoading(false);
        hasCheckedRef.current = true;
        adminCache.delete(uid || '');
        return;
      }
      
      // Clear cache for this user if they signed out
      if (event === 'SIGNED_OUT') {
        adminCache.delete(uid);
      } else {
      checkAdminStatus(uid);
      }
    });

    // Initial check using current session or provided user
    // Only check if user changed or we haven't checked yet
    if (!hasCheckedRef.current || lastUserIdRef.current !== currentUserId) {
    (async () => {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;
        
      const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || currentUserId || null;
      if (!uid) {
        setIsAdmin(false);
        setLoading(false);
          hasCheckedRef.current = true;
          isCheckingRef.current = false;
        return;
      }
        await checkAdminStatus(uid);
        hasCheckedRef.current = true;
        isCheckingRef.current = false;
    })();
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const checkAdminStatus = async (uid?: string) => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    const targetId = uid ?? user?.id ?? null;
    if (!targetId) {
      setIsAdmin(false);
      setLoading(false);
      isCheckingRef.current = false;
      return;
    }

    // Check cache first
    const cached = adminCache.get(targetId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached value
      setIsAdmin(cached.isAdmin);
      setLoading(false);
      isCheckingRef.current = false;
      return;
    }

    // Ensure loading is true when fetching from server
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("is_admin", { _user_id: targetId });
      if (error) throw error;
      
      const adminStatus = Boolean(data);
      setIsAdmin(adminStatus);
      
      // Cache the result
      adminCache.set(targetId, {
        isAdmin: adminStatus,
        timestamp: now
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  return { isAdmin, loading, checkAdminStatus };
};
