import { smartHiveSnapToSolveDb } from "@/data/localDb";
import { create } from "zustand";
// --- Zustand Store for Snap & Solve ---
export const useSnapToSolveStore = create((set, get) => ({
  solutions: [],
  loading: false,
  error: null,

  initSnapToSolveTables: async () => {
    try {
      await smartHiveSnapToSolveDb.execAsync(`
        CREATE TABLE IF NOT EXISTS snap_solutions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_uri TEXT,
          question_type TEXT,
          subject TEXT,
          user_prompt TEXT,
          steps TEXT,
          final_answer TEXT,
          explanation TEXT,
          created_at TEXT
        );
      `);
    } catch (err) {
      set({ error: "Failed to initialize SnapToSolve DB" });
    }
  },

  saveSolution: async (solutionObj) => {
    try {
      await smartHiveSnapToSolveDb.runAsync(
        `INSERT INTO snap_solutions 
        (image_uri, question_type, subject, user_prompt, steps, final_answer, explanation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          solutionObj.image,
          solutionObj.questionType,
          solutionObj.subject,
          solutionObj.userPrompt,
          JSON.stringify(solutionObj.steps),
          solutionObj.finalAnswer,
          solutionObj.explanation,
          new Date().toISOString(),
        ]
      );
      set((state) => ({
        solutions: [solutionObj, ...state.solutions],
      }));
    } catch (err) {
      set({ error: "Failed to save solution" });
    }
  },

  getAllSolutions: async () => {
    try {
      const rows = await smartHiveSnapToSolveDb.getAllAsync(
        `SELECT * FROM snap_solutions ORDER BY created_at DESC`
      );
      set({
        solutions: rows.map((row) => ({
          ...row,
          steps: JSON.parse(row.steps),
        })),
      });
    } catch (err) {
      set({ error: "Failed to fetch solutions" });
    }
  },

  clearError: () => set({ error: null }),
}));