import { supabase } from "@/backend/supabase";

export const updateUserOnlineStatus = async (isOnline) => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) return;

  const userId = userData.user.id;

  const { error } = await supabase
    .from("user_status")
    .upsert({
      user_id: userId,
      is_online: isOnline,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }); // ensures only one row per user

  if (error) console.error("Failed to update user status", error.message);
};
