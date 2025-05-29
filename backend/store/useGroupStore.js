import { create } from "zustand";
import { supabase } from "@/backend/supabase";

export const useGroupStore = create((set) => ({
  // State
  groups: {
    createdByUser: [],
    publicGroups: [],
    joinedGroups: [],
  },
  group: null,
  members: [],
  loading: false,
  error: null,

  fetchJoinedGroups: async (userId) => {
    set({ loading: true, error: null });
  
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id, groups(*)")
      .eq("user_id", userId);
  
    if (error) {
      console.error("fetchJoinedGroups error:", error);
      set({ error, loading: false });
      return;
    }
  
    const joinedGroups = data.map((item) => item.groups).filter(Boolean);
  
    set((state) => ({
      groups: {
        ...state.groups,
        joinedGroups,
      },
      loading: false,
    }));
  },

  // Fetch all groups for HubScreen
  fetchGroups: async (userId) => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
    .from("groups")
    .select("*")
    .or(`created_by.eq.${userId},and(isPrivate.eq.false,created_by.neq.${userId})`);
  

    if (error) {
      set({ error, loading: false });
      console.error("fetchGroups error:", error);
      return;
    }

    const createdByUser = data.filter((g) => g.created_by === userId);
    const publicGroups = data.filter(
      (g) => g.created_by !== userId && g.isPrivate === false
    );

    set({
      groups: {
        createdByUser,
        publicGroups,
      },
      loading: false,
    });
  },

  // Fetch single group details + members
  fetchGroupDetails: async (groupId) => {
    set({ loading: true, error: null });

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*, profiles(*)")
      .eq("group_id", groupId);

    if (groupError || membersError) {
      console.error(groupError || membersError);
      set({ loading: false, error: groupError || membersError });
      return;
    }

    set({
      group,
      members,
      loading: false,
    });
  },

  // Update group metadata
  updateGroup: async (groupId, updates) => {
    const { error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId);

    if (error) {
      console.error("updateGroup error:", error);
      set({ error });
    }
  },

  // Remove a member from the group
  removeMember: async (groupId, userId) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .match({ group_id: groupId, user_id: userId });

    if (error) {
      console.error("removeMember error:", error);
      set({ error });
    }
  },

  // Promote/demote a group member to/from admin
  promoteAdmin: async (groupId, userId, isAdmin) => {
    const { error } = await supabase
      .from("group_members")
      .update({ is_admin: isAdmin })
      .match({ group_id: groupId, user_id: userId });

    if (error) {
      console.error("promoteAdmin error:", error);
      set({ error });
    }
  },

  // Transfer group ownership
  transferOwnership: async (groupId, newOwnerId) => {
    const { error } = await supabase
      .from("groups")
      .update({ created_by: newOwnerId })
      .eq("id", groupId);

    if (error) {
      console.error("transferOwnership error:", error);
      set({ error });
    }
  },
}));