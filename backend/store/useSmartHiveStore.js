import { dbManager } from "@/backend/services/DatabaseManager";
import { sendMessageToCohere } from "@/hooks/cohereApi";
import { create } from "zustand";
import { useUserStore } from "./useUserStore";

// Web platform detection
const webPlatform = {
  OS: "web",
  isWeb: true,
};

// Constants for better maintainability
const CONFIG = {
  DB_NAME: "smartHiveChat.db",
  MAX_RETRY_ATTEMPTS: 1, // Web doesn't need as many retries as Android
  BASE_RETRY_DELAY: 200,
  AI_REQUEST_TIMEOUT: 30000,
  AI_RETRY_ATTEMPTS: 3,
  AI_BASE_RETRY_DELAY: 1000,
  QUICK_REPLY_TIMEOUT: 10000,
  MAX_MESSAGES_HISTORY: 10,
  MAX_QUICK_REPLIES: 3,
  MESSAGE_ORDERING_DELAY: 500,
  CIRCUIT_BREAKER_THRESHOLD: 5, // Number of failures before circuit opens
  CIRCUIT_BREAKER_RESET_TIMEOUT: 60000, // 1 minute
};

// Circuit breaker for AI requests to prevent cascading failures
class AIRequestCircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
  }

  canMakeRequest() {
    if (this.state === "CLOSED") return true;

    if (this.state === "OPEN") {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > CONFIG.CIRCUIT_BREAKER_RESET_TIMEOUT) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }

    if (this.state === "HALF_OPEN") return true;

    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.lastFailureTime = null;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      this.state = "OPEN";
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Global circuit breaker instance
const aiCircuitBreaker = new AIRequestCircuitBreaker();

// Enhanced AI request with retry logic and circuit breaker
async function makeAIRequestWithRetry(chatHistory, attempt = 0) {
  // Check circuit breaker
  if (!aiCircuitBreaker.canMakeRequest()) {
    throw new Error(
      "AI service temporarily unavailable. Please try again later."
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, CONFIG.AI_REQUEST_TIMEOUT);

    // Make the actual request with abort signal
    const aiResponse = await Promise.race([
      sendMessageToCohere(chatHistory, { signal: controller.signal }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout")),
          CONFIG.AI_REQUEST_TIMEOUT
        )
      ),
    ]);

    clearTimeout(timeoutId);

    // Validate response
    if (!aiResponse || typeof aiResponse !== "string" || !aiResponse.trim()) {
      throw new Error("Invalid or empty AI response received");
    }

    // Record success for circuit breaker
    aiCircuitBreaker.recordSuccess();

    return aiResponse.trim();
  } catch (error) {
    console.error(`AI request attempt ${attempt + 1} failed:`, error);

    // Don't retry for certain error types
    const nonRetryableErrors = [
      "authentication",
      "authorization",
      "quota exceeded",
      "invalid request",
    ];
    const isNonRetryable = nonRetryableErrors.some((errorType) =>
      error.message.toLowerCase().includes(errorType)
    );

    if (isNonRetryable || attempt >= CONFIG.AI_RETRY_ATTEMPTS - 1) {
      // Record failure for circuit breaker
      aiCircuitBreaker.recordFailure();
      throw error;
    }

    // Exponential backoff with jitter
    const delay =
      CONFIG.AI_BASE_RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
    console.log(
      `Retrying AI request in ${delay}ms... (attempt ${attempt + 2}/${
        CONFIG.AI_RETRY_ATTEMPTS
      })`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return makeAIRequestWithRetry(chatHistory, attempt + 1);
  }
}

// Request deduplication cache
const activeAIRequests = new Map();

export const useSmartHiveStore = create((set, get) => {
  // Helper function to update session title if it's the first message
  async function updateSessionTitleIfFirstMessage(
    message,
    session_id,
    user_id
  ) {
    const session = await dbManager.executeWithRetry(
      CONFIG.DB_NAME,
      async (db) => {
        return await db.getAllAsync(
          `SELECT title FROM chat_sessions WHERE session_id = ? AND user_id = ?`,
          [session_id, user_id]
        );
      }
    );

    const title = session?.[0]?.title;

    if (title === "New Chat") {
      const messageCountResult = await dbManager.executeWithRetry(
        CONFIG.DB_NAME,
        async (db) => {
          return await db.getAllAsync(
            `SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ? AND user_id = ?`,
            [session_id, user_id]
          );
        }
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
            await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
              await db.runAsync(
                `UPDATE chat_sessions SET title = ? WHERE session_id = ? AND user_id = ?`,
                [aiTitle.trim(), session_id, user_id]
              );
            });
          }
        } catch (_e) {
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
    chatReady: false,

    // Initialize database and load initial messages
    initialize: async () => {
      try {
        // Clear all state first to ensure clean initialization
        set({
          loading: true,
          chatReady: false,
          error: null,
          messages: [],
          currentSessionId: null,
          isTyping: false,
        });

        console.log("Starting chat initialization...");

        // Ensure user profile is available
        await useUserStore.getState().hydrateProfile();
        const { profile } = useUserStore.getState();

        if (!profile?.user_id) {
          throw new Error("User profile not available. Please log in again.");
        }

        console.log("User profile verified, initializing database...");

        // Initialize database tables with transaction safety
        await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS chat_messages (
              id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              role TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TEXT NOT NULL,
              quick_replies TEXT,
              FOREIGN KEY (session_id, user_id) REFERENCES chat_sessions(session_id, user_id)
            );
            
            CREATE TABLE IF NOT EXISTS chat_sessions (
              session_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              title TEXT NOT NULL DEFAULT 'New Chat',
              created_at TEXT NOT NULL,
              last_message TEXT DEFAULT '',
              last_updated TEXT NOT NULL,
              PRIMARY KEY (session_id, user_id)
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_messages_session_user 
            ON chat_messages(session_id, user_id, created_at);
            
            CREATE INDEX IF NOT EXISTS idx_sessions_user_created 
            ON chat_sessions(user_id, created_at DESC);
          `);
        });

        console.log("Database initialized, checking for existing sessions...");

        // Get or create session
        const sessions = await get().getChatSessions();
        let sessionId = null;

        if (sessions.length === 0) {
          console.log("No existing sessions, creating new one...");
          sessionId = await get().createChatSession();
        } else {
          sessionId = sessions[0].session_id;
          console.log("Using existing session:", sessionId);
        }

        if (!sessionId) {
          throw new Error("Failed to create or retrieve valid session");
        }

        // Set session before loading messages
        set({ currentSessionId: sessionId });

        console.log("Loading messages for session...");

        // Load messages directly without chatReady check during initialization
        await get()._loadMessagesInternal();

        // Only set chatReady to true after everything succeeds
        set({ chatReady: true });
        console.log("Chat initialization completed successfully");
      } catch (error) {
        console.error("Chat initialization failed:", error);
        set({
          error: `Failed to initialize chat: ${error.message}`,
          chatReady: false,
          messages: [],
          currentSessionId: null,
        });
        throw error; // Re-throw to allow retry handling
      } finally {
        set({ loading: false });
      }
    },

    // Internal message loading (bypasses chatReady check for initialization)
    _loadMessagesInternal: async () => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        const session_id = get().currentSessionId;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        if (!session_id) {
          throw new Error("No active session");
        }

        const rawMessages = await dbManager.executeWithRetry(
          CONFIG.DB_NAME,
          async (db) => {
            return await db.getAllAsync(
              `SELECT * FROM chat_messages 
             WHERE user_id = ? AND session_id = ?
             ORDER BY created_at DESC`,
              [user_id, session_id]
            );
          }
        );

        // Format messages for GiftedChat with better error handling
        const messages = rawMessages.map((msg) => {
          try {
            return {
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
            };
          } catch (parseError) {
            console.warn("Failed to parse message:", msg.id, parseError);
            return {
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
            };
          }
        });

        set({ messages });
        console.log(
          `Loaded ${messages.length} messages for session ${session_id}`
        );
      } catch (error) {
        console.error("Failed to load messages:", error);
        throw error;
      }
    },

    // Load messages for current session (public API with chatReady check)
    loadMessages: async () => {
      try {
        if (!get().chatReady) {
          console.warn("Chat not ready, cannot load messages");
          return;
        }

        set({ loading: true });
        await get()._loadMessagesInternal();
        set({ loading: false });
      } catch (error) {
        console.error("Failed to load messages:", error);
        set({
          error: `Failed to load messages: ${error.message}`,
          loading: false,
        });
      }
    },

    // Add a new message to the conversation
    addMessage: async (message) => {
      try {
        if (!get().chatReady) {
          set({
            error: "Chat is not ready. Please restart the app and try again.",
          });
          return;
        }

        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        let session_id = get().currentSessionId;

        if (!user_id) {
          console.error("No user available for adding message");
          set({ error: "Please log in to continue chatting" });
          return;
        }

        if (!session_id) {
          console.error("No valid session available for adding message");
          set({ error: "Chat session invalid. Please restart the app." });
          return;
        }

        // Validate message content
        if (!message?.text?.trim()) {
          console.warn("Empty message content, skipping");
          return;
        }

        const id =
          message._id?.toString() ??
          `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const role = message.user._id === user_id ? "user" : "assistant";

        // Check for duplicates with more robust logic
        const currentMessages = get().messages;
        const messageExists = currentMessages.some(
          (msg) =>
            msg._id === id ||
            (msg.text === message.text &&
              msg.user._id === message.user._id &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(message.createdAt).getTime()
              ) < 5000)
        );

        if (messageExists) {
          console.warn("Message already exists, skipping duplicate");
          return;
        }

        // Only save user messages and successful AI responses to database
        // Error messages are kept in state only
        const shouldSaveToDb = !message.user.avatar?.includes("FF5252");

        if (shouldSaveToDb) {
          // Use DatabaseManager for atomic operations
          await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
            await db.execAsync("BEGIN TRANSACTION");
            try {
              // Insert message
              await db.runAsync(
                `INSERT INTO chat_messages (id, session_id, user_id, role, content, created_at, quick_replies)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  id,
                  session_id,
                  user_id,
                  role,
                  message.text.trim(),
                  new Date(message.createdAt).toISOString(),
                  message.quickReplies
                    ? JSON.stringify(message.quickReplies)
                    : null,
                ]
              );

              // Update session metadata
              await db.runAsync(
                `UPDATE chat_sessions 
                 SET last_message = ?, last_updated = ?
                 WHERE session_id = ? AND user_id = ?`,
                [
                  message.text.slice(0, 100),
                  new Date().toISOString(),
                  session_id,
                  user_id,
                ]
              );

              await db.execAsync("COMMIT");
            } catch (error) {
              await db.execAsync("ROLLBACK");
              throw error;
            }
          });
        }

        // Update local state with proper sorting and deduplication
        set((state) => {
          const updatedMessages = [message, ...state.messages];

          // Sort by creation time (newest first)
          const sortedMessages = updatedMessages.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Remove duplicates based on ID and content
          const uniqueMessages = sortedMessages.filter(
            (msg, index, arr) =>
              index ===
              arr.findIndex(
                (m) =>
                  m._id === msg._id ||
                  (m.text === msg.text &&
                    m.user._id === msg.user._id &&
                    Math.abs(
                      new Date(m.createdAt).getTime() -
                        new Date(msg.createdAt).getTime()
                    ) < 1000)
              )
          );

          return { messages: uniqueMessages };
        });

        // Update session title for first user message
        if (role === "user" && shouldSaveToDb) {
          // Don't await to avoid blocking UI
          updateSessionTitleIfFirstMessage(message, session_id, user_id).catch(
            (error) => console.warn("Failed to update session title:", error)
          );
        }

        // Trigger AI response for user messages
        if (role === "user") {
          // Use proper promise handling instead of setTimeout
          Promise.resolve().then(async () => {
            try {
              await new Promise((resolve) =>
                setTimeout(resolve, CONFIG.MESSAGE_ORDERING_DELAY)
              );
              await get().getAIResponse(message);
            } catch (error) {
              console.error("AI response failed:", error);
            }
          });
        }
      } catch (error) {
        console.error("Failed to add message:", error);
        set({ error: `Failed to add message: ${error.message}` });
      }
    },

    // Get AI response for the latest message (Enhanced with retry, circuit breaker, and deduplication)
    getAIResponse: async (userMessage) => {
      const requestId = `ai_request_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      try {
        if (!get().chatReady) {
          console.warn("Chat not ready, skipping AI response");
          return;
        }

        // Generate request key for deduplication
        const requestKey = `${userMessage.text.trim()}_${
          get().currentSessionId
        }`;

        // Check if identical request is already in progress
        if (activeAIRequests.has(requestKey)) {
          console.log(
            "Identical AI request already in progress, skipping duplicate"
          );
          return;
        }

        // Mark request as active
        activeAIRequests.set(requestKey, requestId);

        set({ isTyping: true, error: null });

        console.log(`[${requestId}] Starting AI response generation...`);

        // Get current user and messages
        const { profile } = useUserStore.getState();
        const userId = profile?.user_id;
        const currentMessages = get().messages;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Check circuit breaker status
        const circuitBreakerState = aiCircuitBreaker.getState();
        if (circuitBreakerState.state === "OPEN") {
          throw new Error(
            `AI service temporarily unavailable due to multiple failures. Please try again in a few minutes.`
          );
        }

        // Prepare chat history for API (limit to recent messages for efficiency)
        const recentMessages = currentMessages
          .slice(0, CONFIG.MAX_MESSAGES_HISTORY)
          .reverse();

        const chatHistory = [
          {
            role: "system",
            content: `You are Smart Hive AI, a helpful learning assistant for students. 
                     You help with academic questions, study planning, and educational support.
                     Be concise, helpful, and encouraging. Keep responses under 300 words unless specifically asked for detailed explanations.`,
          },
          ...recentMessages.map((msg) => ({
            role: msg.user._id === userId ? "user" : "assistant",
            content: msg.text,
          })),
        ];

        // Add the new user message if it's not already in the history
        if (!recentMessages.some((msg) => msg.text === userMessage.text)) {
          chatHistory.push({
            role: "user",
            content: userMessage.text,
          });
        }

        console.log(
          `[${requestId}] Sending request to AI with ${chatHistory.length} messages`
        );
        console.log(
          `[${requestId}] Circuit breaker state:`,
          circuitBreakerState
        );

        // Make AI request with enhanced error handling and retry logic
        const aiResponse = await makeAIRequestWithRetry(chatHistory);

        console.log(`[${requestId}] AI response received successfully`);

        // Create AI message with proper timestamp
        const aiMessage = {
          _id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          text: aiResponse,
          createdAt: new Date(Date.now() + CONFIG.MESSAGE_ORDERING_DELAY),
          user: {
            _id: "assistant",
            name: "Smart Hive AI",
            avatar: "https://placehold.co/200x200/00DF82/white?text=SH",
          },
        };

        // Generate quick replies with improved error handling and timeout
        if (
          aiResponse.length > 50 &&
          !aiResponse.toLowerCase().includes("sorry") &&
          !aiResponse.toLowerCase().includes("error") &&
          !aiResponse.toLowerCase().includes("cannot") &&
          !aiResponse.toLowerCase().includes("unable")
        ) {
          try {
            console.log(`[${requestId}] Generating quick replies...`);

            const quickReplyPrompt = `Based on this AI response, suggest 2-3 brief follow-up questions or actions the student might want to take. 
                                    Response: "${aiResponse.slice(0, 200)}..."
                                    
                                    Return ONLY a JSON array of objects with "title" and "value" properties. 
                                    Keep titles under 25 characters. Example: [{"title":"Explain more","value":"Can you explain this in more detail?"}]`;

            const quickRepliesController = new AbortController();
            const quickReplyTimeout = setTimeout(() => {
              quickRepliesController.abort();
            }, CONFIG.QUICK_REPLY_TIMEOUT);

            const quickRepliesResponse = await Promise.race([
              sendMessageToCohere(
                [
                  {
                    role: "system",
                    content:
                      "You are a helpful assistant that generates quick reply options. Always return valid JSON only.",
                  },
                  { role: "user", content: quickReplyPrompt },
                ],
                { signal: quickRepliesController.signal }
              ),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Quick reply timeout")),
                  CONFIG.QUICK_REPLY_TIMEOUT
                )
              ),
            ]);

            clearTimeout(quickReplyTimeout);

            if (
              quickRepliesResponse &&
              typeof quickRepliesResponse === "string"
            ) {
              const cleanResponse = quickRepliesResponse
                .replace(/```json|```/g, "")
                .trim();

              try {
                const quickReplies = JSON.parse(cleanResponse);

                if (
                  Array.isArray(quickReplies) &&
                  quickReplies.length > 0 &&
                  quickReplies.length <= 4 &&
                  quickReplies.every(
                    (reply) =>
                      typeof reply === "object" &&
                      reply.title &&
                      reply.value &&
                      typeof reply.title === "string" &&
                      typeof reply.value === "string" &&
                      reply.title.length <= 25 &&
                      reply.value.length <= 100
                  )
                ) {
                  aiMessage.quickReplies = {
                    type: "radio",
                    values: quickReplies.slice(0, CONFIG.MAX_QUICK_REPLIES),
                  };
                  console.log(
                    `[${requestId}] Quick replies generated successfully`
                  );
                } else {
                  console.warn(
                    `[${requestId}] Invalid quick replies format:`,
                    quickReplies
                  );
                }
              } catch (parseError) {
                console.warn(
                  `[${requestId}] Failed to parse quick replies JSON:`,
                  parseError
                );
              }
            }
          } catch (quickReplyError) {
            console.warn(
              `[${requestId}] Quick reply generation failed:`,
              quickReplyError.message
            );
            // Continue without quick replies - not a critical failure
          }
        } else {
          console.log(
            `[${requestId}] Skipping quick replies generation - response too short or contains error indicators`
          );
        }

        // Add AI message to store and database
        await get().addMessage(aiMessage);

        console.log(
          `[${requestId}] AI response processed and added successfully`
        );
      } catch (error) {
        console.error(`[${requestId}] Error getting AI response:`, error);

        // Enhanced error categorization with more specific handling
        let errorText =
          "I'm having trouble connecting right now. Please check your internet connection and try again.";
        let shouldRetry = true;

        if (error.message.includes("timeout")) {
          errorText =
            "The response is taking longer than usual. Please try asking your question again.";
        } else if (error.message.includes("temporarily unavailable")) {
          errorText = error.message; // Use the circuit breaker message
          shouldRetry = false;
        } else if (
          error.message.includes("authentication") ||
          error.message.includes("User not authenticated")
        ) {
          errorText = "Please make sure you're logged in and try again.";
          shouldRetry = false;
        } else if (
          error.message.includes("Invalid") ||
          error.message.includes("empty")
        ) {
          errorText =
            "I couldn't process that request properly. Please try rephrasing your question.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          errorText =
            "Network connection issue. Please check your internet and try again.";
        } else if (
          error.message.includes("quota") ||
          error.message.includes("rate limit")
        ) {
          errorText =
            "I'm experiencing high demand right now. Please wait a moment and try again.";
          shouldRetry = false;
        } else if (error.name === "AbortError") {
          errorText = "Request was cancelled. Please try again.";
        }

        // Add retry suggestion for retryable errors
        if (shouldRetry) {
          errorText += " You can also try rephrasing your question.";
        }

        const errorMessage = {
          _id: `error_${Date.now()}`,
          text: errorText,
          createdAt: new Date(),
          user: {
            _id: "assistant",
            name: "Smart Hive AI",
            avatar: "https://placehold.co/200x200/FF5252/white?text=!",
          },
        };

        // Add error message but don't save to database
        set((state) => ({
          messages: [errorMessage, ...state.messages].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
        }));
      } finally {
        // Clean up request tracking
        const requestKey = `${userMessage.text.trim()}_${
          get().currentSessionId
        }`;
        activeAIRequests.delete(requestKey);

        set({ isTyping: false });
        console.log(`[${requestId}] AI response request completed`);
      }
    },

    // Create a new chat session with improved error handling
    createChatSession: async (firstMessageText = "") => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        // Check if a session already exists with no messages (avoid duplicates)
        const existingSessions = await dbManager.executeWithRetry(
          CONFIG.DB_NAME,
          async (db) => {
            return await db.getAllAsync(
              `SELECT s.session_id FROM chat_sessions s
             LEFT JOIN chat_messages m ON s.session_id = m.session_id AND s.user_id = m.user_id
             WHERE s.user_id = ? 
             GROUP BY s.session_id 
             HAVING COUNT(m.id) = 0
             ORDER BY s.created_at DESC 
             LIMIT 1`,
              [user_id]
            );
          }
        );

        if (existingSessions?.length > 0) {
          const existingSessionId = existingSessions[0].session_id;
          console.log("Reusing empty session:", existingSessionId);
          set({ currentSessionId: existingSessionId, messages: [] });
          return existingSessionId;
        }

        // Generate unique session ID with timestamp and random component
        const session_id = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;
        const created_at = new Date().toISOString();
        let title = "New Chat";

        // Generate AI title if first message is provided
        if (firstMessageText?.trim()) {
          try {
            const titlePrompt = `
Create a short, meaningful chat session title from this message:
"${firstMessageText.trim()}"

Requirements:
- Exactly 3 words
- No quotes or punctuation
- Descriptive and relevant
- Professional tone

Return only the 3-word title.`;

            const aiTitle = await Promise.race([
              sendMessageToCohere([{ role: "user", content: titlePrompt }]),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Title generation timeout")),
                  5000
                )
              ),
            ]);

            if (typeof aiTitle === "string") {
              const cleanTitle = aiTitle.trim().replace(/['"]/g, "");
              const words = cleanTitle.split(/\s+/);
              if (words.length === 3) {
                title = cleanTitle;
              }
            }
          } catch (error) {
            console.warn("AI title generation failed:", error.message);
            // Use fallback title based on message content
            const words = firstMessageText.trim().split(/\s+/).slice(0, 3);
            if (words.length >= 2) {
              title = words.join(" ").substring(0, 30);
            }
          }
        }

        // Create session with DatabaseManager
        await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
          await db.runAsync(
            `INSERT INTO chat_sessions (session_id, user_id, title, created_at, last_updated)
             VALUES (?, ?, ?, ?, ?)`,
            [session_id, user_id, title, created_at, created_at]
          );
        });

        set({ currentSessionId: session_id, messages: [] });
        console.log("Created new session:", session_id, "with title:", title);
        return session_id;
      } catch (error) {
        console.error("Failed to create session:", error);
        set({ error: `Failed to create new chat session: ${error.message}` });
        return null;
      }
    },

    // Switch to a different chat session with proper error handling
    switchSession: async (session_id) => {
      try {
        if (!session_id) {
          throw new Error("Invalid session ID");
        }

        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        // Verify session exists and belongs to user
        const sessionExists = await dbManager.executeWithRetry(
          CONFIG.DB_NAME,
          async (db) => {
            return await db.getFirstAsync(
              `SELECT session_id FROM chat_sessions WHERE session_id = ? AND user_id = ?`,
              [session_id, user_id]
            );
          }
        );

        if (!sessionExists) {
          throw new Error("Session not found or access denied");
        }

        // Clear current state and switch
        set({
          currentSessionId: session_id,
          messages: [],
          error: null,
          isTyping: false,
        });

        // Load messages for the new session
        await get()._loadMessagesInternal();

        console.log("Successfully switched to session:", session_id);
      } catch (error) {
        console.error("Failed to switch session:", error);
        set({ error: `Failed to switch session: ${error.message}` });
      }
    },

    // Fetch chat sessions with improved error handling and caching
    getChatSessions: async () => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        if (!user_id) {
          console.warn("No user available for fetching sessions");
          return [];
        }

        const sessions = await dbManager.executeWithRetry(
          CONFIG.DB_NAME,
          async (db) => {
            return await db.getAllAsync(
              `SELECT 
               s.session_id,
               s.user_id,
               s.title,
               s.created_at,
               s.last_message,
               s.last_updated,
               COUNT(m.id) as message_count
             FROM chat_sessions s
             LEFT JOIN chat_messages m ON s.session_id = m.session_id AND s.user_id = m.user_id
             WHERE s.user_id = ?
             GROUP BY s.session_id, s.user_id, s.title, s.created_at, s.last_message, s.last_updated
             ORDER BY s.last_updated DESC, s.created_at DESC`,
              [user_id]
            );
          }
        );

        return sessions || [];
      } catch (error) {
        console.error("Error fetching sessions:", error);
        set({ error: `Failed to load chat sessions: ${error.message}` });
        return [];
      }
    },

    // Clear messages for current session (keep session, remove messages)
    clearMessages: async () => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;
        const session_id = get().currentSessionId;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        if (!session_id) {
          throw new Error("No active session");
        }

        // Use DatabaseManager for atomic operation
        await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
          await db.execAsync("BEGIN TRANSACTION");
          try {
            // Delete all messages for current session
            await db.runAsync(
              `DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?`,
              [session_id, user_id]
            );

            // Reset session metadata
            await db.runAsync(
              `UPDATE chat_sessions 
               SET title = 'New Chat', last_message = '', last_updated = ?
               WHERE session_id = ? AND user_id = ?`,
              [new Date().toISOString(), session_id, user_id]
            );

            await db.execAsync("COMMIT");
          } catch (error) {
            await db.execAsync("ROLLBACK");
            throw error;
          }
        });

        // Clear messages from state
        set({ messages: [], error: null });

        console.log("Messages cleared successfully for session:", session_id);
      } catch (error) {
        console.error("Failed to clear messages:", error);
        set({ error: `Failed to clear messages: ${error.message}` });
      }
    },

    // Delete all chat sessions with proper cleanup
    deleteAllChatSessions: async () => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        // Use DatabaseManager for atomic cleanup
        await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
          await db.execAsync("BEGIN TRANSACTION");
          try {
            await db.runAsync(`DELETE FROM chat_messages WHERE user_id = ?`, [
              user_id,
            ]);
            await db.runAsync(`DELETE FROM chat_sessions WHERE user_id = ?`, [
              user_id,
            ]);
            await db.execAsync("COMMIT");
          } catch (error) {
            await db.execAsync("ROLLBACK");
            throw error;
          }
        });

        // Create a new session to maintain app functionality
        const newSessionId = await get().createChatSession();

        if (newSessionId) {
          set({
            currentSessionId: newSessionId,
            messages: [],
            error: null,
            isTyping: false,
          });
        } else {
          throw new Error("Failed to create new session after cleanup");
        }

        console.log("All chat sessions deleted and new session created");
      } catch (error) {
        console.error("Failed to delete all chat sessions:", error);
        set({ error: `Failed to delete all chat sessions: ${error.message}` });
      }
    },

    // Delete a specific chat session
    deleteChatSession: async (session_id) => {
      try {
        const { profile } = useUserStore.getState();
        const user_id = profile?.user_id;

        if (!user_id) {
          throw new Error("User not authenticated");
        }

        if (!session_id) {
          throw new Error("Invalid session ID");
        }

        // Use DatabaseManager for atomic deletion
        await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
          await db.execAsync("BEGIN TRANSACTION");
          try {
            await db.runAsync(
              `DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?`,
              [session_id, user_id]
            );

            await db.runAsync(
              `DELETE FROM chat_sessions WHERE session_id = ? AND user_id = ?`,
              [session_id, user_id]
            );

            await db.execAsync("COMMIT");
          } catch (error) {
            await db.execAsync("ROLLBACK");
            throw error;
          }
        });

        // If we're deleting the current session, create a new one
        if (get().currentSessionId === session_id) {
          const newSessionId = await get().createChatSession();
          if (newSessionId) {
            set({
              currentSessionId: newSessionId,
              messages: [],
              error: null,
            });
          }
        }

        console.log("Deleted session:", session_id);
      } catch (error) {
        console.error("Failed to delete chat session:", error);
        set({ error: `Failed to delete chat session: ${error.message}` });
      }
    },

    // Clear error state
    clearError: () => {
      set({ error: null });
    },

    // Enhanced retry initialization with exponential backoff
    retryInitialize: async () => {
      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          console.log(`Retry attempt ${attempt + 1} of ${maxRetries}`);

          // Clear any existing error state
          set({ error: null });

          // Wait with exponential backoff (except first attempt)
          if (attempt > 0) {
            const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          await get().initialize();

          // If we get here, initialization succeeded
          console.log("Retry initialization successful");
          return;
        } catch (error) {
          attempt++;
          console.error(`Retry attempt ${attempt} failed:`, error);

          if (attempt >= maxRetries) {
            set({
              error: `Failed to initialize after ${maxRetries} attempts. Please restart the app or check your connection.`,
              chatReady: false,
              loading: false,
            });
          }
        }
      }
    },

    // Health check function to verify system state
    healthCheck: async () => {
      try {
        const state = get();
        const issues = [];

        // Check user authentication
        const { profile } = useUserStore.getState();
        if (!profile?.user_id) {
          issues.push("User not authenticated");
        }

        // Check database connectivity
        try {
          await dbManager.executeWithRetry(CONFIG.DB_NAME, async (db) => {
            await db.getFirstAsync("SELECT 1");
          });
        } catch (_dbError) {
          issues.push("Database connection failed");
        }

        // Check session validity
        if (state.chatReady && !state.currentSessionId) {
          issues.push("Chat ready but no active session");
        }

        // Check for stale error states
        if (state.error && state.chatReady) {
          issues.push("Error state inconsistent with ready state");
        }

        // Check AI service circuit breaker
        const circuitBreakerState = aiCircuitBreaker.getState();
        if (circuitBreakerState.state !== "CLOSED") {
          issues.push(
            `AI service circuit breaker is ${circuitBreakerState.state}`
          );
        }

        return {
          healthy: issues.length === 0,
          issues,
          state: {
            chatReady: state.chatReady,
            hasSession: !!state.currentSessionId,
            messageCount: state.messages.length,
            isTyping: state.isTyping,
            hasError: !!state.error,
          },
          circuitBreaker: circuitBreakerState,
        };
      } catch (error) {
        return {
          healthy: false,
          issues: [`Health check failed: ${error.message}`],
          state: null,
          circuitBreaker: null,
        };
      }
    },

    // Reset AI service circuit breaker (for manual recovery)
    resetAICircuitBreaker: () => {
      aiCircuitBreaker.recordSuccess();
      console.log("AI circuit breaker manually reset");
    },

    // Get AI service status
    getAIServiceStatus: () => {
      const circuitBreakerState = aiCircuitBreaker.getState();
      const activeRequestsCount = activeAIRequests.size;

      return {
        circuitBreaker: circuitBreakerState,
        activeRequests: activeRequestsCount,
        isAvailable:
          circuitBreakerState.state === "CLOSED" ||
          circuitBreakerState.state === "HALF_OPEN",
        lastFailureTime: circuitBreakerState.lastFailureTime
          ? new Date(circuitBreakerState.lastFailureTime).toISOString()
          : null,
      };
    },
  };
});
