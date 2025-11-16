import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "./LanguageContext";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Use refs to track previous values and prevent unnecessary re-renders
  const previousUserIdRef = useRef<string | undefined>(undefined);
  const previousSessionIdRef = useRef<string | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Ignore TOKEN_REFRESHED events to prevent unnecessary re-renders
        // Only update state if user actually changed (sign in/out)
        if (event === 'TOKEN_REFRESHED') {
          // Token refreshed but user is the same, don't trigger re-renders
          return;
        }
        
        const newUserId = session?.user?.id;
        const newSessionId = session?.access_token;
        const previousUserId = previousUserIdRef.current;
        
        // Only update state if user or session actually changed
        if (previousUserIdRef.current !== newUserId || previousSessionIdRef.current !== newSessionId) {
          previousUserIdRef.current = newUserId;
          previousSessionIdRef.current = newSessionId;
          setSession(session);
          setUser(session?.user ?? null);
          
          // Show toast on sign in/out (only after initialization to avoid showing on page load)
          if (hasInitializedRef.current) {
            if (event === 'SIGNED_IN' && newUserId && !previousUserId) {
              toast({
                title: t("Welcome Back! 👋"),
                description: t("You have successfully signed in"),
              });
            } else if (event === 'SIGNED_OUT' && previousUserId && !newUserId) {
              toast({
                title: t("Signed Out Successfully! 👋"),
                description: t("See you next time!"),
              });
            }
          }
        }
        
        if (hasInitializedRef.current) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session (only once on mount)
    if (!hasInitializedRef.current) {
    supabase.auth.getSession().then(({ data: { session } }) => {
        const newUserId = session?.user?.id;
        const newSessionId = session?.access_token;
        
        previousUserIdRef.current = newUserId;
        previousSessionIdRef.current = newSessionId;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
        hasInitializedRef.current = true;
    });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
