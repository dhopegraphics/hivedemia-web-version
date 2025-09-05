import { dbManager } from "@/backend/services/DatabaseManager";
import { sendMessageToGemini } from "@/hooks/geminiApi";
import { create } from "zustand";

type AiSuggestionType = {
  suggestion_id: number;
  plan_id: number;
  suggestion_message: string[];
  created_at: string;
  next_regen: string;
};

type AiSuggestionStore = {
  suggestion: AiSuggestionType | null;
  loading: boolean;
  fetchSuggestion: (plannerSchedules: any) => Promise<void>;
  clearSuggestion: () => Promise<void>;
  loadSuggestionFromDb: () => Promise<void>;
};

const getRandomInterval = () => {
  // 1 day (rare), 3 days, 7 days, 14 days
  const intervals = [1, 3, 7, 14, 3, 7, 14, 3, 7, 14]; // 1 day is rare
  const days = intervals[Math.floor(Math.random() * intervals.length)];
  return days;
};

export const useAiSuggestionStore = create<AiSuggestionStore>((set, get) => ({
  suggestion: null,
  loading: false,

  loadSuggestionFromDb: async () => {
    await dbManager.executeWithRetry("ai_suggestions.db", async (db) => {
      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS ai_suggestion (
        suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER,
        suggestion_message TEXT,
        created_at TEXT,
        next_regen TEXT
      )`
      );
      const res = await db.getAllAsync(
        `SELECT * FROM ai_suggestion ORDER BY created_at DESC LIMIT 1`
      );
      if (res.length > 0) {
        const record = res[0] as any;
        set({
          suggestion: {
            ...record,
            suggestion_message: JSON.parse(record.suggestion_message),
          },
        });
      } else {
        set({ suggestion: null });
      }
    });
  },

  fetchSuggestion: async (plannerSchedules) => {
    if (!plannerSchedules?.tasks?.length) return;

    set({ loading: true });
    await dbManager.executeWithRetry("ai_suggestions.db", async (db) => {
      // Check if we need to regenerate
      const res = (await db.getAllAsync(
        `SELECT * FROM ai_suggestion ORDER BY created_at DESC LIMIT 1`
      )) as AiSuggestionType[];
      const now = new Date();
      if (res.length > 0) {
        const { next_regen } = res[0];
        if (new Date(next_regen) > now) {
          const record = res[0] as any;
          set({
            suggestion: {
              ...record,
              suggestion_message: JSON.parse(record.suggestion_message),
            },
            loading: false,
          });
          return;
        }
      }

      // Prepare prompt for Gemini
      const planSummary = plannerSchedules.tasks
        .map((plan: any) => {
          return `Plan: ${plan.focus}, Tasks: ${plan.tasks
            .map((t: any) => t.title)
            .join(", ")}`;
        })
        .join("\n");

      const prompt = [
        {
          role: "user" as const,
          content: `Based on my current study plans and tasks:\n${planSummary}\nGive me 3 actionable, personalized study suggestions. the suggestion should be concise and specific and must be less than 22 words in total in a single sentence . Do not include any numbers or bullet points, just the suggestions themselves. go straight ahead and give the suggestions without any preamble or explanation.`,
        },
      ];

      try {
        const aiText = await sendMessageToGemini(prompt);
        // Split into suggestions (try to split by line or number)
        const suggestions = aiText
          .split(/\n|[0-9]\./)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3);

        const created_at = now.toISOString();
        const interval = getRandomInterval();
        const next_regen = new Date(
          now.getTime() + interval * 24 * 60 * 60 * 1000
        ).toISOString();

        // Save to DB
        await db.runAsync(`DELETE FROM ai_suggestion`); // Only keep one
        await db.runAsync(
          `INSERT INTO ai_suggestion (plan_id, suggestion_message, created_at, next_regen) VALUES (?, ?, ?, ?)`,
          [1, JSON.stringify(suggestions), created_at, next_regen]
        );

        set({
          suggestion: {
            suggestion_id: 1,
            plan_id: 1,
            suggestion_message: suggestions,
            created_at,
            next_regen,
          },
          loading: false,
        });
      } catch {
        set({ loading: false });
      }
    });
  },

  clearSuggestion: async () => {
    await dbManager.executeWithRetry("ai_suggestions.db", async (db) => {
      await db.runAsync(`DELETE FROM ai_suggestion`);
      set({ suggestion: null });
    });
  },
}));
