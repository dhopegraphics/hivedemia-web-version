import { dbManager } from "@/backend/services/DatabaseManager";
import { sendMessageToGemini } from "@/hooks/geminiApi";
import { create } from "zustand";

const dbPromise = dbManager.getDatabase("suggestedGeneratedNotes.db");

export const useAiPlannerNote = create((set, get) => ({
  currentPlanNotes: null,
  loading: false,
  error: null,

  // Initialize database table
  initTable: async () => {
    try {
      const db = await dbPromise;
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS suggested_notes (
          plan_id TEXT PRIMARY KEY,
          focus TEXT NOT NULL,
          tasks TEXT NOT NULL,
          generated_content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err) {
      console.error("Error initializing database:", err);
      set({ error: "Failed to initialize database" });
    }
  },

  // Get notes for a specific plan
  getPlanNotes: async (planId) => {
    try {
      const db = await dbPromise;
      const result = await db.getFirstAsync(
        "SELECT * FROM suggested_notes WHERE plan_id = ?",
        [planId]
      );
      return result;
    } catch (err) {
      console.error("Error fetching plan notes:", err);
      set({ error: "Failed to fetch notes" });
      return null;
    }
  },

  // Generate and store AI notes for a plan
  generatePlanNotes: async (plan) => {
    set({ loading: true, error: null });
    try {
      // Check if notes already exist for this plan
      const existingNotes = await get().getPlanNotes(plan.plan_id);
      if (existingNotes) {
        set({ currentPlanNotes: existingNotes, loading: false });
        return existingNotes;
      }

      // Prepare prompt for AI
      const prompt = `
        Generate comprehensive study notes for the following learning plan:
        
        Focus: ${plan.focus}
        Tasks: ${plan.tasks.map((t) => t.title).join(", ")}
        
        Requirements:
        1. Break down each topic into key concepts
        2. Provide clear explanations with simple examples
        3. Include practice questions for each concept
        4. Format as markdown with headings, bullet points, and numbered lists
        5. Keep explanations concise but thorough
        6. Highlight common mistakes to avoid
        
        Output should be well-structured for easy studying.
      `;

      // Get AI response
      const aiResponse = await sendMessageToGemini([
        { role: "user", content: prompt },
      ]);

      if (!aiResponse) {
        throw new Error("AI did not return a response");
      }

      // Store in database
      const db = await dbPromise;
      await db.runAsync(
        "INSERT INTO suggested_notes (plan_id, focus, tasks, generated_content) VALUES (?, ?, ?, ?)",
        [plan.plan_id, plan.focus, JSON.stringify(plan.tasks), aiResponse]
      );

      const newNotes = {
        plan_id: plan.plan_id,
        focus: plan.focus,
        tasks: plan.tasks,
        generated_content: aiResponse,
      };

      set({ currentPlanNotes: newNotes, loading: false });
      return newNotes;
    } catch (err) {
      console.error("Error generating notes:", err);
      set({ error: "Failed to generate notes", loading: false });
      return null;
    }
  },

  // Clear current notes
  clearCurrentNotes: () => set({ currentPlanNotes: null }),
}));
