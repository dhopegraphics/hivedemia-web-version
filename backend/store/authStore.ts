// src/store/useAuthStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/backend/supabase';

type Session = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
  expires_at: number;
};

interface AuthState {
  session: Session | null;
  hydrated: boolean;
  hasCompletedOnboarding: boolean;
  user: Session['user'] | null;
  setSession: (session: Session | null) => Promise<void>;
  hydrateSession: () => Promise<void>;
  logout: () => Promise<void>;
  setOnboarded: (value: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hasCompletedOnboarding: false,
  user: null,

  setSession: async (session) => {
    if (session) {
      await SecureStore.setItemAsync('session', JSON.stringify(session));
    } else {
      await SecureStore.deleteItemAsync('session');
    }
    set({ session, user: session?.user ?? null });
  },

  setOnboarded: async (value: boolean) => {
    await SecureStore.setItemAsync('onboardingComplete', value ? 'true' : 'false');
    set({ hasCompletedOnboarding: value });
  },

  hydrateSession: async () => {
    try {
      const [rawSession, onboarded] = await Promise.all([
        SecureStore.getItemAsync('session'),
        SecureStore.getItemAsync('onboardingComplete'),
      ]);

      let parsed: Session | null = null;

      if (rawSession) {
        parsed = JSON.parse(rawSession);
        if (parsed) {
          set({ session: parsed, user: parsed.user });
        } else {
          set({ session: null, user: null });
        }
      }

      set({ hasCompletedOnboarding: onboarded === 'true' });
    } catch (e) {
      console.error('Failed to hydrate auth store', e);
    } finally {
      set({ hydrated: true });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('session');
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));