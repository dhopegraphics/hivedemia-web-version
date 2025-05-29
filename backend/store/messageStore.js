// app/store/messageStore.js
import { create } from 'zustand'
import { supabase } from '@/backend/supabase'
import uuid from 'react-native-uuid'

export const useMessageStore = create((set, get) => ({
  messages: {},
  hasMore: {},
  loading: false,

  initChat: (chatId) => {
    if (!get().messages[chatId]) {
      set(state => ({
        messages: { ...state.messages, [chatId]: [] },
        hasMore: { ...state.hasMore, [chatId]: true },
      }))
    }
  },

  fetchMessages: async (chatId, isGroup, before) => {
    if (get().loading || !get().hasMore[chatId]) return
    set({ loading: true })
  
    let query = supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(20)
  
    if (isGroup) {
      query = query.eq('chat_type', 'group')
    } else {
      query = query.eq('chat_type', 'direct')
    }
  
    if (before) {
      query = query.lt('created_at', before)
    }
  
    const { data, error } = await query
  
    if (error) {
      console.error('Fetch messages failed', error)
    } else {
      const oldMessages = get().messages[chatId] || []
      
      // Deduplicate messages by creating a Map with message IDs as keys
      const existingIds = new Set(oldMessages.map(msg => msg.id))
      const newUniqueMessages = data.filter(msg => !existingIds.has(msg.id))
      
      set({
        messages: { 
          ...get().messages, 
          [chatId]: [...oldMessages, ...newUniqueMessages]
        },
        hasMore: { ...get().hasMore, [chatId]: data.length === 20 },
      })
    }
  
    set({ loading: false })
  },
  
  // Enhanced sendMessage function for both regular messages and forwarding
  sendMessage: async ({ chatId, senderId, text, reply_to,   message_type = 'text', file_url = null, forwarded_from = null , chat_type = null  }) => {
    // Validate required fields
    if (!chatId) {
      console.error('Missing required field: chatId');
      throw new Error('Chat ID is required');
    }
    if (!senderId) {
      console.error('Missing required field: senderId');
      throw new Error('Sender ID is required');
    }

    const localId = `local-${uuid.v4()}`;
    
    // Determine chat type based on the chat being used
    const chatType = chat_type || "group";

    const optimisticMessage = {
      id: localId,
      sender_id: senderId,
      content: text,
      chat_id: chatId,
      chat_type: chatType,
      message_type,
      file_url,
      created_at: new Date().toISOString(),
      reply_to,
      forwarded_from,
      send_failed: false,
      pending: true // Add pending flag to track optimistic updates
    };

    set(state => {
      const currentMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: [optimisticMessage, ...currentMessages],
        },
      };
    });

    const messageData = {
      sender_id: senderId,
      content: text,
      chat_id: chatId,
      chat_type: chatType,
      message_type,
      file_url,
      reply_to,
    };

    // Add forwarded_from only if it exists
    if (forwarded_from) {
      messageData.forwarded_from = forwarded_from;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error || !data) {
      console.error('Send failed:', error);
      set(state => {
        const updated = state.messages[chatId] ? state.messages[chatId].map(msg =>
          msg.id === localId ? { ...msg, send_failed: true, pending: false } : msg
        ) : [];
        return { messages: { ...state.messages, [chatId]: updated } };
      });
      throw error; // Re-throw to allow handling in the component
    }

    // Replace the optimistic message with the real server message
    set(state => {
      const updated = state.messages[chatId] ? state.messages[chatId].map(msg =>
        msg.id === localId ? { ...data, pending: false } : msg
      ) : [{ ...data, pending: false }];
      
      // Filter out any possible duplicates that may have come through the subscription
      const deduped = updated.filter((msg, index, self) => 
        index === self.findIndex(m => m.id === msg.id)
      );
      
      return { messages: { ...state.messages, [chatId]: deduped } };
    });
    
    return data;
  }
}))