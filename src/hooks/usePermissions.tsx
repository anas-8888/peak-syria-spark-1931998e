import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Cache permissions in memory
const permissionsCache = new Map<string, { permissions: string[]; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // Cache for 5 minutes

export const usePermissions = () => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const hasCheckedRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(undefined);

  // Fetch user permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Check cache first
      const cached = permissionsCache.get(user.id);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.permissions;
      }

      // Fetch user's role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching user profile:", profileError);
        return [];
      }

      const roleId = (profile as any).role_id;
      if (!roleId) return [];

      // Fetch permissions for this role
      const { data: rolePermissions, error: permError } = await supabase
        .from("role_permissions")
        .select("permission_id, permissions(name)")
        .eq("role_id", roleId);

      if (permError) {
        console.error("Error fetching permissions:", permError);
        return [];
      }

      const permissionNames = (rolePermissions || [])
        .map((rp: any) => rp.permissions?.name)
        .filter(Boolean) as string[];

      // Cache the result
      permissionsCache.set(user.id, {
        permissions: permissionNames,
        timestamp: now,
      });

      return permissionNames;
    },
    enabled: !!user?.id,
    staleTime: CACHE_DURATION,
  });

  useEffect(() => {
    if (!permissionsLoading && permissionsData) {
      setUserPermissions(permissionsData);
      setLoading(false);
    } else if (!user?.id) {
      setUserPermissions([]);
      setLoading(false);
    }
  }, [permissionsData, permissionsLoading, user?.id]);

  // Check if user has a specific permission
  const hasPermission = (permissionName: string): boolean => {
    return userPermissions.includes(permissionName);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some((name) => userPermissions.includes(name));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every((name) => userPermissions.includes(name));
  };

  // Clear cache (useful when permissions are updated)
  const clearCache = () => {
    if (user?.id) {
      permissionsCache.delete(user.id);
    }
  };

  return {
    permissions: userPermissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    clearCache,
  };
};

