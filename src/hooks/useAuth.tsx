
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  language: string;
  setLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    let didUnmount = false;

    const fetchUserLanguage = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (profile && profile.language) {
          setLanguage(profile.language);
        } else {
          setLanguage('en');
        }
      } catch (error) {
        console.error('Error fetching user language:', error);
        setLanguage('en');
      }
    };

    const handleAuthChange = async (session: Session | null) => {
      console.log("[useAuth] handleAuthChange called. session:", session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserLanguage(session.user.id);
      } else {
        setLanguage('en');
      }
      if (!didUnmount) setLoading(false);
    };

    // Always be sure to set loading to false even in any error
    const initAuth = async () => {
      try {
        // Try to get existing session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[useAuth] Initial session:', session?.user?.email);
        await handleAuthChange(session);
      } catch (error) {
        console.error("[useAuth] Error in getSession:", error);
        if (!didUnmount) setLoading(false);
      }
    };
    initAuth();

    // Listen for subsequent auth state changes (do not make async)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[useAuth] Auth state changed:', _event, session?.user?.email);
        handleAuthChange(session);
      }
    );

    // If the request hangs too long, forcibly disable loading after X seconds
    const forceDoneTimeout = setTimeout(() => {
      if (loading) {
        console.error("[useAuth] Timeout: Still loading after 7 seconds - forcing loading=false");
        setLoading(false);
      }
    }, 7000);

    return () => {
      didUnmount = true;
      subscription.unsubscribe();
      clearTimeout(forceDoneTimeout);
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    if (user) {
      supabase.from('profiles').update({ language: lang }).eq('id', user.id).then();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, language, setLanguage: handleSetLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
