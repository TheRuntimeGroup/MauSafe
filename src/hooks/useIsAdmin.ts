import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        setIsAdmin(!error && data?.role === "admin");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return { isAdmin, loading };
}
