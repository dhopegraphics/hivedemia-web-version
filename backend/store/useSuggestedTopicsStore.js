import { sendMessageToGemini } from "@/hooks/geminiApi";
import { webDB } from "@/backend/services/WebDatabase";
import { create } from "zustand";

export const useSuggestedTopicsStore = create((set, get) => ({
  topics: [],
  loading: false,
  lastRequestTime: 0, // Track last API request time
  requestCooldown: 5000, // 5 second cooldown between requests

  // Check if we can generate topics (not in cooldown)
  canGenerateTopics: () => {
    const state = get();
    const now = Date.now();
    return (
      now - state.lastRequestTime >= state.requestCooldown && !state.loading
    );
  },

  initTable: async () => {
    await webDB.execAsync(`
      CREATE TABLE IF NOT EXISTS suggested_topics (
        exam_id TEXT PRIMARY KEY,
        topics TEXT
      );
    `);
  },

  fetchTopics: async (examId) => {
    const rows = await webDB.getAllAsync(
      "SELECT topics FROM suggested_topics WHERE exam_id = ?",
      [examId]
    );
    if (rows.length > 0) {
      const topics = JSON.parse(rows[0].topics);
      set({ topics });
      return topics;
    } else {
      set({ topics: [] });
      return [];
    }
  },

  saveTopics: async (examId, topics) => {
    await webDB.runAsync(
      "INSERT OR REPLACE INTO suggested_topics (exam_id, topics) VALUES (?, ?)",
      [examId, JSON.stringify(topics)]
    );
  },

  // Check if topics should be regenerated for an exam
  shouldRegenerateTopics: async (examId) => {
    const rows = await webDB.getAllAsync(
      "SELECT topics FROM suggested_topics WHERE exam_id = ?",
      [examId]
    );

    if (rows.length === 0) {
      console.log("No existing topics found, should generate");
      return true; // No topics exist, should generate
    }

    // If topics exist, they stay until there's a new exam (different ID)
    // The UI component handles the exam change logic
    console.log("Topics exist for this exam, not regenerating");
    return false;
  },

  generateAndStoreTopics: async (nextExam) => {
    const state = get();
    const now = Date.now();

    // Rate limiting: Check if we're in cooldown period
    if (now - state.lastRequestTime < state.requestCooldown) {
      console.log("Rate limit: Request too soon, skipping API call");
      return state.topics;
    }

    // Check if already loading to prevent duplicate requests
    if (state.loading) {
      console.log("Already generating topics, skipping duplicate request");
      return state.topics;
    }

    set({ loading: true, lastRequestTime: now });

    try {
      const prompt = `Generate a list of at least 15 important 
     study topics for the following university exam.
      Each topic should be only 1 or 2 words, no explanations.
      you must Only return the topics as a plain numbered or bulleted list, no additional text.
      Do not include any introductory text or explanations.
       no extra text:\n\nCourse: ${nextExam.course}\nCode: ${nextExam.code}\nTitle: ${nextExam.title}\nDate: ${nextExam.date}`;

      const aiResponse = await sendMessageToGemini([
        { role: "user", content: prompt },
      ]);

      if (!aiResponse || typeof aiResponse !== "string") {
        console.error("AI did not return a string:", aiResponse);
        set({ loading: false });
        return [];
      }

      const topics = aiResponse
        .split(/\n|•|-|\d+\./)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);

      await get().saveTopics(nextExam.id, topics);
      set({ topics, loading: false });
      return topics;
    } catch (err) {
      console.error("Error in generateAndStoreTopics:", err);

      // Handle rate limit error specifically
      if (err.message?.includes("429")) {
        console.log("Rate limit hit, will retry later");
        // Set a longer cooldown for rate limit errors
        set({ loading: false, lastRequestTime: now + 30000 }); // 30 second cooldown
      } else {
        set({ loading: false });
      }

      return [];
    }
  },
}));
