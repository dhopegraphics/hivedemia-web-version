import { create } from 'zustand'
import { supabase } from '@/backend/supabase'

export const useReactionsStore = create((set, get) => ({
  reactions: {},

  fetchReactions: async (messageIds) => {
    if (!messageIds?.length) return

    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds)

    if (error) return console.error('Fetch error:', error)

    const grouped = {}
    for (const r of data) {
      grouped[r.message_id] ??= []
      grouped[r.message_id].push(r)
    }
    set({ reactions: grouped })
  },

  addReaction: async (messageId, emoji, userId) => {
    const { error } = await supabase.from('message_reactions').upsert({
      message_id: messageId,
      emoji,
      user_id: userId,
    })
    if (error) console.error('Add reaction error:', error)
  },

  removeReaction: async (messageId, emoji, userId) => {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .match({ message_id: messageId, emoji, user_id: userId })

    if (error) console.error('Remove reaction error:', error)
  },

  handleRealtimeReaction: (event) => {
    const current = get().reactions
    const r = event.new || event.old

    let messageReactions = current[r.message_id] || []
    if (event.eventType === 'INSERT') {
      messageReactions.push(r)
    } else if (event.eventType === 'DELETE') {
      messageReactions = messageReactions.filter(
        (rx) => !(rx.user_id === r.user_id && rx.emoji === r.emoji)
      )
    }
    set({
      reactions: {
        ...current,
        [r.message_id]: messageReactions,
      },
    })
  },
}))