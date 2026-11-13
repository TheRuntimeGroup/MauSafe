import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, type Profile } from "@/lib/profile";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionUserId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!sessionUserId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      setProfile(await fetchProfile(sessionUserId));
    } finally {
      setProfileLoading(false);
    }
  }, [sessionUserId]);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session);
        setProfileLoading(Boolean(data.session));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setProfileLoading(Boolean(nextSession?.user));
      setError(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!sessionUserId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    fetchProfile(sessionUserId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionUserId]);

  const signOut = useCallback(async () => {
    setError(null);
    setProfile(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      error,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, profileLoading, error, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a SessionContextProvider");
  }
  return context;
}
