import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/backend/supabase";

const PROFILE_KEY = "userProfile";

export type UserProfile = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  university_id: string | null;
  email: string | null;
  avatar_url: string | null;
  updated_at: string;
};

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  profileCache: Record<string, UserProfile>;
  hydrateProfile: () => Promise<void>;
  fetchProfileFromSupabase: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserProfile | null>;
}

const persistProfile = async (profile: UserProfile | null): Promise<void> => {
  if (profile) {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  } else {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
  }
};

export const useUserStore = create<UserState>((set, get) => {
  // Smart setter that watches profile changes
  const smartSet = (
    updater: Partial<UserState> | ((state: UserState) => Partial<UserState>)
  ) => {
    set((state) => {
      const result = typeof updater === "function" ? updater(state) : updater;

      if (Object.prototype.hasOwnProperty.call(result, "profile")) {
        void persistProfile(result.profile ?? null);
      }

      return result;
    });
  };

  return {
    profile: null,
    loading: false,
    error: null,
    profileCache: {},

    hydrateProfile: async () => {
      try {
        const raw = await SecureStore.getItemAsync(PROFILE_KEY);
        if (raw) {
          const profile: UserProfile = JSON.parse(raw);
          smartSet({ profile });
        }
      } catch (e) {
        console.error("Error hydrating profile:", e);
      }
    },

    fetchProfileFromSupabase: async () => {
      smartSet({ loading: true, error: null });

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !authData?.user)
          throw authError || new Error("No user found");

        const userId = authData.user.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error || !data) throw error || new Error("Profile not found");

        const existing = get().profile;
        const isNewer =
          !existing ||
          new Date(data.updated_at) > new Date(existing.updated_at);

        if (isNewer) {
          smartSet({ profile: data });
        }
      } catch (e: any) {
        console.error("fetchProfileFromSupabase error:", e);
        smartSet({ error: e.message || "Failed to fetch profile" });
      } finally {
        smartSet({ loading: false });
      }
    },

    updateProfile: async (updates: Partial<UserProfile>) => {
      const current = get().profile;
      if (!current) throw new Error("No profile to update");

      const updated_at = new Date().toISOString();
      const updatedProfile: UserProfile = {
        ...current,
        ...updates,
        updated_at,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("user_id", current.user_id);

      if (error) throw error;

      smartSet({ profile: updatedProfile });
    },

    clearProfile: async () => {
      smartSet({ profile: null });
    },

    getUserProfile: async (userId: string): Promise<UserProfile | null> => {
      const cache = get().profileCache;

      if (cache[userId]) return cache[userId];

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error || !data) throw error || new Error("Profile not found");

        smartSet((state) => ({
          profileCache: {
            ...state.profileCache,
            [userId]: data,
          },
        }));

        return data;
      } catch (err) {
        console.error("getUserProfile error:", err);
        return null;
      }
    },
  };
});
