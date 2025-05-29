// src/backend/auth/initSupabaseSession.ts
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '../store/authStore';
import { supabase } from '@/backend/supabase';

export async function initSupabaseSession() {
  const { session, setSession } = useAuthStore.getState();

  const { isConnected } = await NetInfo.fetch();
  if (!isConnected) return;

  if (!session) return;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = session.expires_at < now;

  if (isExpired) {
    const { data, error } = await supabase.auth.refreshSession();
    if (data?.session) {
      await setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.session.user.id,
          email: data.session.user.email!,
        },
        expires_at: data.session.expires_at!,
      });
    } else {
      console.warn('Failed to refresh session:', error?.message);
    }
  }
}
