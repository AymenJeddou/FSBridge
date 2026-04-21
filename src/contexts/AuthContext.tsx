import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/integrations/supabase/client";

type Role = "admin" | "professor" | "student";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: Role | null;
  profileId: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRoleAndProfile = async (uid: string) => {
    const [{ data: roles }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("id").eq("user_id", uid).maybeSingle(),
    ]);
    if (roles?.length) {
      const r = roles.map((x: any) => x.role);
      setRole(r.includes("admin") ? "admin" : r.includes("professor") ? "professor" : "student");
    } else setRole(null);
    setProfileId(prof?.id ?? null);
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer to avoid deadlock
        setTimeout(() => loadRoleAndProfile(sess.user.id), 0);
      } else {
        setRole(null);
        setProfileId(null);
      }
    });
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadRoleAndProfile(s.user.id);
      setLoading(false);
    }).catch(() => {
      setRole(null);
      setProfileId(null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (user) await loadRoleAndProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Ctx.Provider value={{ user, session, loading, role, profileId, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
