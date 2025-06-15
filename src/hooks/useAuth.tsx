
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
    const fetchUserLanguage = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore if profile doesn't exist yet
          throw error;
        }

        if (profile && profile.language) {
          setLanguage(profile.language);
        } else {
          setLanguage('en');
        }
      } catch (error) {
        console.error('Error fetching user language:', error);
        // Set a fallback language on error
        setLanguage('en');
      }
    };

    const handleAuthChange = async (session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserLanguage(session.user.id);
      } else {
        setLanguage('en');
      }
      setLoading(false);
    };

    // Get initial session and handle it
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      handleAuthChange(session);
    }).catch(error => {
      console.error("Error in getSession:", error);
      setLoading(false);
    });

    // Listen for subsequent auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        handleAuthChange(session);
      }
    );

    return () => subscription.unsubscribe();
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
