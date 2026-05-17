import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Extract JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    
    // Verify caller is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);
    if (!user || userError) throw new Error("Non autorisé: " + (userError?.message || "Utilisateur non authentifié"));

    // Create service role client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    // Check role using admin client to avoid RLS read restrictions
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      throw new Error("Privilèges insuffisants: Vous n'avez pas le rôle 'admin' dans la base de données.");
    }

    const { action = "create", userId, email, password, prenom, nom, role, filiere, niveau, bureau } = await req.json();

    if (action === "delete") {
      if (!userId) throw new Error("ID de l'utilisateur requis pour la suppression.");

      // Delete roles
      const { error: delRoleError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (delRoleError) throw delRoleError;

      // Delete profiles
      const { error: delProfileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (delProfileError) throw delProfileError;

      // Delete auth user
      const { error: delAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (delAuthError) throw delAuthError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "update") {
      if (!userId) throw new Error("ID de l'utilisateur requis pour la modification.");

      // 1. Update auth details if provided
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;
      if (prenom || nom) {
        updateData.user_metadata = { prenom, nom };
      }

      if (Object.keys(updateData).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
        if (authError) throw authError;
      }

      // 2. Update profile
      const { error: profileError } = await supabaseAdmin.from("profiles").update({
        email: email || undefined,
        prenom: prenom || undefined,
        nom: nom || undefined,
        filiere: filiere !== undefined ? (filiere || null) : undefined,
        niveau: niveau !== undefined ? (niveau || null) : undefined,
        bureau: bureau !== undefined ? (bureau || null) : undefined
      }).eq("user_id", userId);

      if (profileError) throw profileError;

      // 3. Update role if provided
      if (role) {
        const { data: existingRoles, error: checkRoleError } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId);

        if (checkRoleError) throw checkRoleError;

        let roleError;
        if (existingRoles && existingRoles.length > 0) {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .update({ role })
            .eq("user_id", userId);
          roleError = error;
        } else {
          const { error } = await supabaseAdmin
            .from("user_roles")
            .insert({ user_id: userId, role });
          roleError = error;
        }

        if (roleError) throw roleError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Default "create" action
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { prenom, nom }
    });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // 2. Update profile (since a DB trigger might have already created it)
    const { error: profileError } = await supabaseAdmin.from("profiles").update({
      email,
      prenom,
      nom,
      filiere: filiere || null,
      niveau: niveau || null,
      bureau: bureau || null
    }).eq("user_id", newUserId);

    if (profileError) throw profileError;

    // 3. Assign role (checking if a trigger already inserted a role row)
    const { data: existingRoles, error: checkRoleError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", newUserId);

    if (checkRoleError) throw checkRoleError;

    let roleError;
    if (existingRoles && existingRoles.length > 0) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUserId);
      roleError = error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role });
      roleError = error;
    }

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
