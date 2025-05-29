import { create } from 'zustand';
import { supabase } from '@/backend/supabase';

export const useGroupStats = create((set, get) => ({
  members: {},
  usersStatus: {},
  activities: {},
  subscriptions: {},

  fetchMembersCount: async (groupId) => {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId);

    set(state => ({
      members: { ...state.members, [groupId]: count ?? 0 }
    }));
  },

  fetchOnlineCount: async (groupId) => {
    // First get all user_ids in the group
    const { data: memberData } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const userIds = memberData?.map(m => m.user_id) ?? [];
    if (userIds.length === 0) {
      set(state => ({
        usersStatus: { ...state.usersStatus, [groupId]: 0 }
      }));
      return;
    }

    const { data: onlineData } = await supabase
      .from('user_status')
      .select('user_id')
      .eq('is_online', true)
      .in('user_id', userIds);

    set(state => ({
      usersStatus: { ...state.usersStatus, [groupId]: onlineData?.length || 0 }
    }));
  },

  fetchLastActivity: async (groupId) => {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', groupId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: typing } = await supabase
      .from('typing_indicators')
      .select('*')
      .eq('chat_id', groupId)
      .eq('is_typing', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    // Prefer typing indicator if someone is typing, else last message
    const lastActivity = typing?.[0] || messages?.[0] || null;

    set(state => ({
      activities: { ...state.activities, [groupId]: lastActivity }
    }));
  },

  subscribeToGroupUpdates: (groupId) => {
    // Use get() to access store actions
    const fetchMembersCount = get().fetchMembersCount;
    const fetchOnlineCount = get().fetchOnlineCount;
    const fetchLastActivity = get().fetchLastActivity;

    // Subscribe to group_members changes
    const membersChannel = supabase
      .channel(`group-members-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => fetchMembersCount(groupId)
      )
      .subscribe();

    // Subscribe to user_status changes for group members
    const statusChannel = supabase
      .channel(`user-status-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_status' },
        () => fetchOnlineCount(groupId)
      )
      .subscribe();

    // Subscribe to messages and typing_indicators for activity
    const activityChannel = supabase
      .channel(`group-activities-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${groupId}` },
        () => fetchLastActivity(groupId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `chat_id=eq.${groupId}` },
        () => fetchLastActivity(groupId)
      )
      .subscribe();

    set(state => ({
      subscriptions: {
        ...state.subscriptions,
        [groupId]: [membersChannel, statusChannel, activityChannel]
      }
    }));
  },



  unsubscribeFromGroup: (groupId) => {
    const channels = get().subscriptions[groupId] || [];
    channels.forEach(channel => supabase.removeChannel(channel));
    set(state => {
      const newSubs = { ...state.subscriptions };
      delete newSubs[groupId];
      return { subscriptions: newSubs };
    });
  } ,
  
  refreshAllStats: async (groupIds) => {
    const { fetchMembersCount, fetchOnlineCount, fetchLastActivity } = get();
    // Run all fetches in parallel for all groupIds
    await Promise.all(
      groupIds.map(async (groupId) => {
        await Promise.all([
          fetchMembersCount(groupId),
          fetchOnlineCount(groupId),
          fetchLastActivity(groupId),
        ]);
      })
    );
  },
  
}));
