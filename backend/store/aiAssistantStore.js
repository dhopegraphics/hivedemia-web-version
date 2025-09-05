// stores/aiAssistantStore.js
import { create } from "zustand";

export const useAIAssistantStore = create((set) => ({
  isVisible: false,
  context: null,
  messages: [],
  originalSolution: null, // <-- add this
  courseContext: null, // <-- add course context
  documentContext: null, // <-- add document context
  currentFiles: null, // <-- add current files array

  showAssistant: (payload) =>
    set({
      isVisible: true,
      context: typeof payload === "string" ? payload : payload.context,
      originalSolution:
        typeof payload === "object" ? payload.originalSolution : null,
      courseContext: typeof payload === "object" ? payload.courseContext : null,
      documentContext:
        typeof payload === "object" ? payload.documentContext : null,
      currentFiles: typeof payload === "object" ? payload.currentFiles : null,
      messages: [
        {
          id: "welcome",
          text: typeof payload === "string" ? payload : payload.context,
          isUser: false,
          timestamp: new Date().toISOString(),
        },
      ],
    }),

  hideAssistant: () =>
    set({
      isVisible: false,
      context: null,
      courseContext: null,
      documentContext: null,
      currentFiles: null,
    }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Math.random().toString(36).substring(7),
          text: message.text,
          isUser: message.isUser,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),
}));
