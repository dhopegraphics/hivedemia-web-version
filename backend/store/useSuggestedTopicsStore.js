import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import { sendMessageToGemini } from "@/hooks/geminiApi";

let dbPromise = SQLite.openDatabaseAsync("suggestedCourses.db");

export const useSuggestedTopicsStore = create((set, get) => ({
  topics: [],
  loading: false,

  initTable: async () => {
    const db = await dbPromise;
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS suggested_topics (
        exam_id TEXT PRIMARY KEY,
        topics TEXT
      );
    `);
  },

  fetchTopics: async (examId) => {
    const db = await dbPromise;
    const rows = await db.getAllAsync(
      "SELECT topics FROM suggested_topics WHERE exam_id = ?",
      examId
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
    const db = await dbPromise;
    await db.runAsync(
      "INSERT OR REPLACE INTO suggested_topics (exam_id, topics) VALUES (?, ?)",
      examId,
      JSON.stringify(topics)
    );
  },

  generateAndStoreTopics: async (nextExam) => {
    set({ loading: true });
    try {
     const prompt = `Generate a list of at least 15 important 
     study topics for the following university exam.
      Each topic should be only 1 or 2 words, no explanations.
      Only return the topics as a plain numbered or bulleted list,
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
      set({ loading: false });
      return [];
    }
  },
}));