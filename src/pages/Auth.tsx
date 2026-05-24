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

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If the user was created and we have a user ID, create the profile and role
      if (data.user) {
        const userId = data.user.id;

        // Create a profile for the new user
        await supabase.from("profiles").insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          filiere: null,
          niveau: null,
          groupe: null,
        });

        // Assign the student role by default
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "student",
        });

        toast({
          title: "Inscription réussie !",
          description: "Vérifiez votre email pour confirmer votre compte, puis connectez-vous.",
        });
      }

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

  return <AnimatedCharactersLoginPage onSubmit={submit} onSignUp={signUp} onGoogleLogin={loginWithGoogle} brandName="FSBridge." />;
};

export default Auth;
