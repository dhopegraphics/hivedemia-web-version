// app/store/chatStore.js
import { create } from 'zustand'
import { supabase } from '@/backend/supabase'

export const useChatStore = create((set, get) => ({
  directChats: [],
  groupChats: [],
  onlineUsers: {},
  typingUsers: {},

  setTyping: (chatId, userId, isTyping) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: {
          ...(state.typingUsers[chatId] || {}),
          [userId]: isTyping,
        },
      },
    }))
  },

  fetchChats: async () => {
    try {
      const [direct, group] = await Promise.all([
        supabase.from('direct_chats').select(`
          id, user1_id, user2_id,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `),
        supabase.from('group_members')
          .select(`group:group_id(*, created_by, group_members(count))`)
          .eq('user_id', supabase.auth.getUser().data.user.id),
      ])
      set({ directChats: direct.data || [], groupChats: group.data?.map(g => g.group) || [] })
    } catch (e) {
      console.error('Error fetching chats:', e.message)
    }
  },

  resetStore: () => set({ directChats: [], groupChats: [], typingUsers: {} }),
}))