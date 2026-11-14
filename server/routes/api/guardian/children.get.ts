import { defineHandler } from "nitro";
import { requireSupabaseUser, supabaseServerClient } from "../../lib/guardianAuth";

export default defineHandler(async (event) => {
  const guardian = await requireSupabaseUser(event);
  const { data, error } = await supabaseServerClient()
    .from("child_accounts")
    .select("child_auth_id,child_name,child_email,consumed_at")
    .eq("guardian_user_id", guardian.id)
    .not("consumed_at", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("child_links_unavailable");
  return {
    children: (data ?? []).map((child) => ({
      id: child.child_auth_id,
      name: child.child_name,
      email: child.child_email,
      linkedAt: child.consumed_at,
    })),
  };
});
