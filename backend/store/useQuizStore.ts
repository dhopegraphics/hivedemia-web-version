import { webDB } from "@/backend/services/WebDatabase";
import { create } from "zustand";

export interface Quiz {
  id: string;
  userId: string;
  prompt: string;
  feedbackMode: string;
  questionCount: number;
  difficulty: string;
  questionTypes: string; // JSON stringified
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: string;
  question: string;
  options: string | string[]; // JSON stringified or parsed array
  correctAnswer: string;
  explanation: string;
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  questions: QuizQuestion[];
  isLoading: boolean;
  error: string | null;
  initializeDatabase: () => Promise<void>;
  createQuiz: (quiz: Omit<Quiz, "id" | "createdAt">) => Promise<string>;
  saveQuizQuestions: (
    quizId: string,
    questions: Omit<QuizQuestion, "id" | "quizId">[]
  ) => Promise<void>;
  getQuizzesByUser: (userId: string) => Promise<void>;
  getQuizWithQuestions: (quizId: string) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  updateQuizTitle: (quizId: string, newTitle: string) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  currentQuiz: null,
  questions: [],
  isLoading: false,
  error: null,

  initializeDatabase: async () => {
    try {
      set({ isLoading: true });
      await webDB.execAsync(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id TEXT PRIMARY KEY,
          userId TEXT,
          prompt TEXT,
          feedbackMode TEXT,
          questionCount INTEGER,
          difficulty TEXT,
          questionTypes TEXT,
          createdAt INTEGER
        );
      `);
      await webDB.execAsync(`
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id TEXT PRIMARY KEY,
          quizId TEXT,
          type TEXT,
          question TEXT,
          options TEXT,
          correctAnswer TEXT,
          explanation TEXT,
          FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE
        );
      `);
    } catch (err) {
      set({ error: "Failed to initialize database" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  createQuiz: async (quiz) => {
    try {
      set({ isLoading: true });
      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = Date.now();
      await webDB.runAsync(
        `INSERT INTO quizzes (id, userId, prompt, feedbackMode, questionCount, difficulty, questionTypes, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          quiz.userId,
          quiz.prompt,
          quiz.feedbackMode,
          quiz.questionCount,
          quiz.difficulty,
          quiz.questionTypes,
          createdAt,
        ]
      );
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      set({ error: `Failed to create quiz: ${message}` });
      console.error("createQuiz error:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  saveQuizQuestions: async (quizId, questions) => {
    await webDB.execAsync("BEGIN TRANSACTION;");
    try {
      for (const question of questions) {
        const id = Math.random().toString(36).substring(2, 9);

        // Ensure options are properly formatted for MCQ questions
        let optionsToSave = question.options;
        if (question.type === "mcq") {
          if (!optionsToSave || optionsToSave.length === 0) {
            console.error(
              `MCQ question "${question.question}" has no options!`
            );
            // Instead of throwing an error, we could generate basic options
            optionsToSave = [
              question.correctAnswer,
              "Option B",
              "Option C",
              "Option D",
            ];
            console.warn(
              `Generated fallback options for MCQ: ${optionsToSave}`
            );
          }
        }

        // Ensure we don't double-stringify: convert to proper JSON string
        let optionsString: string;
        if (Array.isArray(optionsToSave)) {
          optionsString = JSON.stringify(optionsToSave);
        } else if (typeof optionsToSave === "string") {
          // If it's already a string, check if it's valid JSON
          try {
            JSON.parse(optionsToSave);
            optionsString = optionsToSave; // It's already a valid JSON string
          } catch {
            // If it's not valid JSON, treat it as a single option
            optionsString = JSON.stringify([optionsToSave]);
          }
        } else {
          // Fallback: stringify whatever we have
          optionsString = JSON.stringify(optionsToSave || []);
        }

        await webDB.runAsync(
          `INSERT INTO quiz_questions (id, quizId, type, question, options, correctAnswer, explanation) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            quizId,
            question.type,
            question.question,
            optionsString,
            question.correctAnswer,
            question.explanation,
          ]
        );
      }
      await webDB.execAsync("COMMIT;");
    } catch (err) {
      await webDB.execAsync("ROLLBACK;");
      throw err;
    }
  },

  getQuizzesByUser: async (userId) => {
    try {
      set({ isLoading: true });
      const quizzes = (await webDB.getAllAsync(
        "SELECT * FROM quizzes WHERE userId = ? ORDER BY createdAt DESC",
        [userId]
      )) as Quiz[];
      set({ quizzes });
    } catch (err) {
      set({ error: "Failed to fetch quizzes" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  getQuizWithQuestions: async (quizId) => {
    try {
      set({ isLoading: true });
      const quiz = (await webDB.getFirstAsync(
        "SELECT * FROM quizzes WHERE id = ?",
        [quizId]
      )) as Quiz | null;

      const rawQuestions = (await webDB.getAllAsync(
        "SELECT * FROM quiz_questions WHERE quizId = ?",
        [quizId]
      )) as unknown[];

      // Parse options JSON string back to array for each question
      const questions: QuizQuestion[] = rawQuestions.map(
        (question: unknown) => {
          const q = question as Record<string, unknown>;
          return {
            ...q,
            options: (() => {
              if (!q.options) {
                return [];
              }
              if (Array.isArray(q.options)) {
                return q.options;
              }
              if (typeof q.options === "string") {
                try {
                  let parsed = JSON.parse(q.options);

                  // Handle double-stringified JSON (legacy data)
                  if (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                  }

                  return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                  console.error(
                    `Error parsing options for question ${q.id}:`,
                    error
                  );
                  return [];
                }
              }
              return [];
            })(),
          } as QuizQuestion;
        }
      );

      set({ currentQuiz: quiz, questions });
    } catch (err) {
      set({ error: "Failed to fetch quiz" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteQuiz: async (quizId) => {
    try {
      console.log("QuizStore: Starting deletion of quiz:", quizId);
      set({ isLoading: true });

      // Delete questions first, then quiz (foreign key constraint)
      const questionsResult = await webDB.runAsync(
        "DELETE FROM quiz_questions WHERE quizId = ?",
        [quizId]
      );
      console.log(
        `QuizStore: Deleted ${questionsResult.changes} questions for quiz ${quizId}`
      );

      const quizResult = await webDB.runAsync(
        "DELETE FROM quizzes WHERE id = ?",
        [quizId]
      );
      console.log(`QuizStore: Quiz deletion result:`, quizResult);

      if (quizResult.changes === 0) {
        console.warn(`QuizStore: No quiz found with id ${quizId}`);
      }

      // Update state
      set((state) => {
        const updatedQuizzes = state.quizzes.filter((q) => q.id !== quizId);
        console.log(
          `QuizStore: Updated state from ${state.quizzes.length} to ${updatedQuizzes.length} quizzes`
        );
        return {
          quizzes: updatedQuizzes,
          currentQuiz:
            state.currentQuiz?.id === quizId ? null : state.currentQuiz,
        };
      });

      console.log("QuizStore: Quiz deletion completed successfully");
    } catch (err) {
      console.error("QuizStore: Failed to delete quiz:", err);
      set({ error: "Failed to delete quiz" });
      throw err; // Re-throw to allow caller to handle
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuizTitle: async (quizId, newTitle) => {
    try {
      await webDB.runAsync("UPDATE quizzes SET prompt = ? WHERE id = ?", [
        newTitle,
        quizId,
      ]);
      set((state) => ({
        quizzes: state.quizzes.map((q) =>
          q.id === quizId ? { ...q, prompt: newTitle } : q
        ),
        currentQuiz:
          state.currentQuiz?.id === quizId
            ? { ...state.currentQuiz, prompt: newTitle }
            : state.currentQuiz,
      }));
    } catch (err) {
      console.error("Error updating quiz title:", err);
      set({ error: "Failed to update quiz title" });
    }
  },
}));
