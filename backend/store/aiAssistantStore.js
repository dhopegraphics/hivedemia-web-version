// stores/aiAssistantStore.js
import { create } from 'zustand';

export const useAIAssistantStore = create((set) => ({
   isVisible: false,
  context: null,
  messages: [],
  originalSolution: null, // <-- add this

  
  showAssistant: (payload) => set({
    isVisible: true,
    context: typeof payload === "string" ? payload : payload.context,
    originalSolution: typeof payload === "object" ? payload.originalSolution : null,
    messages: [{
      id: 'welcome',
      text: typeof payload === "string"
        ? payload
        : payload.context,
      isUser: false,
      timestamp: new Date().toISOString()
    }]
  }),
  
  hideAssistant: () => set({
    isVisible: false,
    context: null
  }),
  
  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: Math.random().toString(36).substring(7),
        text: message.text,
        isUser: message.isUser,
        timestamp: new Date().toISOString()
      }
    ]
  })),
  
  clearMessages: () => set({ messages: [] })
}));