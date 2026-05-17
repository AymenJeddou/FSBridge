import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page";

const Auth = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();

  // Navigate away as soon as auth context confirms the user is logged in AND role is loaded
  useEffect(() => {
    if (user && role) {
      if (role === "admin") nav("/admin", { replace: true });
      else if (role === "professor") nav("/emploi-du-temps", { replace: true });
      else nav("/dashboard", { replace: true });
    }
  }, [user, role, nav]);

  const submit = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: error.message };
      }
      // Navigation is handled by the useEffect above once user state updates
      return {};
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
      return { error: err.message };
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({ title: "Erreur OAuth", description: error.message, variant: "destructive" });
    }
  };

  return <AnimatedCharactersLoginPage onSubmit={submit} onGoogleLogin={loginWithGoogle} brandName="FSBridge." />;
};

export default Auth;
