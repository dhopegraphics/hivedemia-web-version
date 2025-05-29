import { create } from "zustand";
import { smartHiveDb } from "@/data/localDb";
import { useUserStore } from "./useUserStore";
import { sendMessageToCohere } from "@/hooks/cohereApi";

export const useSmartHiveStore = create((set, get) => {
  // Helper function to update session title if it's the first message
  async function updateSessionTitleIfFirstMessage(
    message,
    session_id,
    user_id
  ) {
    const session = await smartHiveDb.getAllAsync(
      `SELECT title FROM chat_sessions WHERE session_id = ? AND user_id = ?`,
      [session_id, user_id]
    );

    const title = session?.[0]?.title;

    if (title === "New Chat") {
      const messageCountResult = await smartHiveDb.getAllAsync(
        `SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ? AND user_id = ?`,
        [session_id, user_id]
      );
      const messageCount = messageCountResult?.[0]?.count ?? 0;

      if (messageCount === 1) {
        const prompt = `
Given this message:
"${message.text}"

Generate a short, meaningful session title using exactly 3 words. Do not use quotes or punctuation. Return only the 3-word title.
`;

        try {
          const aiTitle = await sendMessageToCohere([
            { role: "user", content: prompt },
          ]);

          if (
            typeof aiTitle === "string" &&
            aiTitle.trim().split(/\s+/).length === 3
          ) {
            await smartHiveDb.runAsync(
              `UPDATE chat_sessions SET title = ? WHERE session_id = ? AND user_id = ?`,
              [aiTitle.trim(), session_id, user_id]
            );
          }
        } catch (e) {
          console.warn("AI title generation failed during rename.");
        }
      }
    }
  }

  return {
    // Chat state
    messages: [],
    isTyping: false,
    loading: false,
    error: null,
    currentSessionId: null,

    // Initialize database and load initial messages
    initialize: async () => {
      try {
        set({ loading: true });
        await useUserStore.getState().hydrateProfile(); // Ensure user is available

        // Initialize tables
        await get().initSmartHiveTables();

        // Create a new session if none exists
        const sessions = await get().getChatSessions();
        if (sessions.length === 0) {
          const sessionId = await get().createChatSession();
          set({ currentSessionId: sessionId });
        } else {
          set({ currentSessionId: sessions[0].session_id });
        }

        // Load messages for current session
        await get().loadMessages();
      } catch (err) {
        console.error("Initialization error:", err);
        set({ error: "Failed to initialize chat" });
      } finally {
        set({ loading: false });
      }
    },

    // Database initialization
    initSmartHiveTables: async () => {
      try {
        await smartHiveDb.execAsync(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT,
            user_id TEXT,
            role TEXT,
            content TEXT,
            created_at TEXT,
            quick_replies TEXT
          );
          
          CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            created_at TEXT,
            last_message TEXT,
            last_updated TEXT
          );
        `);
      } catch (err) {
        console.error("Failed to initialize SmartHive database:", err);
        throw err;
      }
    },

    // Load messages for current session
    loadMessages: async () => {
      try {
        set({ loading: true });
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        const session_id = get().currentSessionId;

        if (!user_id || !session_id) {
          set({ loading: false });
          return;
        }

        const rawMessages = await smartHiveDb.getAllAsync(
          `SELECT * FROM chat_messages 
           WHERE user_id = ? AND session_id = ?
          ORDER BY created_at DESC`,
          [user_id, session_id]
        );

        // Format messages for GiftedChat
        const messages = rawMessages.map((msg) => ({
          _id: msg.id,
          text: msg.content,
          createdAt: new Date(msg.created_at),
          user: {
            _id: msg.role === "user" ? user_id : "assistant",
            name: msg.role === "user" ? "You" : "Smart Hive AI",
            avatar:
              msg.role === "user"
                ? undefined
                : "https://placehold.co/200x200/00DF82/white?text=SH",
          },
          quickReplies: msg.quick_replies
            ? JSON.parse(msg.quick_replies)
            : undefined,
        }));

        set({ messages, loading: false });
      } catch (err) {
        console.error("Failed to load messages:", err);
        set({ error: "Failed to load messages", loading: false });
      }
    },

    // Add a new message to the conversation
    addMessage: async (message) => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        let session_id = get().currentSessionId;

        if (!session_id) {
          session_id = await get().createChatSession(message.text);
          set({ currentSessionId: session_id });
        }

        if (!user_id || !session_id) return;

        const id = message._id?.toString() ?? Date.now().toString();
        const role = message.user._id === user_id ? "user" : "assistant";

        // Insert message into DB
        await smartHiveDb.runAsync(
          `INSERT INTO chat_messages (id, session_id, user_id, role, content, created_at, quick_replies)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            session_id,
            user_id,
            role,
            message.text,
            new Date(message.createdAt).toISOString(),
            message.quickReplies ? JSON.stringify(message.quickReplies) : null,
          ]
        );

        // Update local state
        set((state) => ({
          messages: [message, ...state.messages].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          ),
        }));

        // Check if session has "New Chat" title and this is the first user message
        if (role === "user") {
          await updateSessionTitleIfFirstMessage(message, session_id, user_id);
        }

        // Update last message
        await smartHiveDb.runAsync(
          `UPDATE chat_sessions 
         SET last_message = ?, last_updated = ?
         WHERE session_id = ?`,
          [message.text, new Date().toISOString(), session_id]
        );

        // Trigger AI response
        if (role === "user") {
          await get().getAIResponse(message);
        }
      } catch (err) {
        console.error("Failed to add message:", err);
        set({ error: "Failed to add message" });
      }
    },

    // Get AI response for the latest message
    getAIResponse: async (userMessage) => {
      const { profile  } = useUserStore.getState();
      const userId = profile?.user_id;
      try {
        set({ isTyping: true });

        // Prepare chat history for API
        const messages = get().messages;
        const chatHistory = [
          {
            role: "system",
            content: "You are Smart Hive AI, a helpful assistant for students.",
          },
          ...messages.map((msg) => ({
            role: msg.user._id === userId ? "user" : "assistant",
            content: msg.text,
          })),
          {
            role: "user",
            content: userMessage.text,
          },
        ];

        // Get AI response
        const aiResponse = await sendMessageToCohere(chatHistory);

        // Create AI message
        const aiMessage = {
          _id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          text: aiResponse,
          createdAt: new Date(Date.now() + 1000), // 1 second later
          user: {
            _id: 2,
            name: "Smart Hive AI",
            avatar: "https://placehold.co/200x200/00DF82/white?text=SH",
          },
        };

        const quickReplyPrompt = ` Based on the following response, suggest 2 to 4 quick replies the user might find helpful to continue the conversation.
         Respond ONLY with a raw JSON array of { "title": string, "value": string } objects. No explanation or markdown. Response:"${aiResponse}"`;

        const quickRepliesRaw = await sendMessageToCohere([
          ...chatHistory,
          { role: "user", content: quickReplyPrompt },
        ]);

        let quickReplies;
        try {
          quickReplies = JSON.parse(quickRepliesRaw);
        } catch (e) {
          console.warn("Could not parse quick replies, skipping...");
        }

        // Add quick replies if appropriate
        if (Array.isArray(quickReplies) && quickReplies.length) {
          aiMessage.quickReplies = {
            type: "radio",
            values: quickReplies,
          };
        }

        // Save AI message
        await get().addMessage(aiMessage);
      } catch (err) {
        console.error("Error getting AI response:", err);

        const errorMessage = {
          _id: Date.now().toString(),
          text: "Sorry, I'm having trouble connecting right now. Please try again later.",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Smart Hive AI",
            avatar: "https://placehold.co/200x200/00DF82/white?text=SH",
          },
        };

        await get().addMessage(errorMessage);
      } finally {
        set({ isTyping: false });
      }
    },

    // Create a new chat session
    createChatSession: async (firstMessageText = "") => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        if (!user_id) return null;

        // Check if a session already exists with no messages
        const existingSessions = await smartHiveDb.getAllAsync(
          `SELECT s.session_id FROM chat_sessions s
         LEFT JOIN chat_messages m ON s.session_id = m.session_id AND s.user_id = m.user_id
         WHERE s.user_id = ? GROUP BY s.session_id HAVING COUNT(m.id) = 0
         ORDER BY s.created_at DESC LIMIT 1`,
          [user_id]
        );

        if (existingSessions?.length) {
          const existingSessionId = existingSessions[0].session_id;
          set({ currentSessionId: existingSessionId, messages: [] });
          return existingSessionId;
        }

        const session_id = Date.now().toString();
        const created_at = new Date().toISOString();
        let title = "New Chat";

        if (firstMessageText.trim()) {
          const prompt = `
Given this message:
"${firstMessageText}"

Generate a short, meaningful session title using exactly 3 words. Do not use quotes or punctuation. Return only the 3-word title.
`;
          try {
            const aiTitle = await sendMessageToCohere([
              { role: "user", content: prompt },
            ]);

            if (
              typeof aiTitle === "string" &&
              aiTitle.trim().split(/\s+/).length === 3
            ) {
              title = aiTitle.trim();
            }
          } catch (e) {
            console.warn("AI title generation failed.");
          }
        }

        await smartHiveDb.runAsync(
          `INSERT INTO chat_sessions (session_id, user_id, title, created_at, last_updated)
         VALUES (?, ?, ?, ?, ?)`,
          [session_id, user_id, title, created_at, created_at]
        );

        set({ currentSessionId: session_id });
        return session_id;
      } catch (err) {
        console.error("Failed to create session:", err);
        return null;
      }
    },
    // Switch to a different chat session
    switchSession: async (session_id) => {
      try {
        set({ currentSessionId: session_id, messages: [] });
        await get().loadMessages();
      } catch (err) {
        console.error("Failed to switch session:", err);
        set({ error: "Failed to switch session" });
      }
    },

    // Fetch chat sessions
    getChatSessions: async () => {
      const { profile } = useUserStore.getState();
      const user_id = profile?.user_id;
      if (!user_id) return [];

      try {
        const sessions = await smartHiveDb.getAllAsync(
          `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC`,
          [user_id]
        );
        return sessions;
      } catch (err) {
        console.error("Error fetching sessions:", err);
        return [];
      }
    },

    deleteAllChatSessions: async () => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        if (!user_id) return;

        await smartHiveDb.runAsync(
          `DELETE FROM chat_sessions WHERE user_id = ?`,
          [user_id]
        );

        await smartHiveDb.runAsync(
          `DELETE FROM chat_messages WHERE user_id = ?`,
          [user_id]
        );

        // Create a new session so the app doesn't break
        const newSessionId = await get().createChatSession();
        set({ currentSessionId: newSessionId, messages: [] });
      } catch (err) {
        console.error("Failed to delete all chat sessions:", err);
        set({ error: "Failed to delete all chat sessions" });
      }
    },

    // Delete a chat session
    deleteChatSession: async (session_id) => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        if (!user_id) return;

        await smartHiveDb.runAsync(
          `DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?`,
          [session_id, user_id]
        );

        await smartHiveDb.runAsync(
          `DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?`,
          [session_id, user_id]
        );

        // If we're deleting the current session, create a new one
        if (get().currentSessionId === session_id) {
          await get().createChatSession();
        }
      } catch (err) {
        console.error("Failed to delete chat session:", err);
        set({ error: "Failed to delete chat session" });
      }
    },

    clearError: () => set({ error: null }),
  };
});
