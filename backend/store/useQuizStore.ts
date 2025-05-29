import { create } from "zustand";
import { quizzesDb } from "../../data/localDb";

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
  options: string; // JSON stringified
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
      await quizzesDb.execAsync(`
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
      await quizzesDb.execAsync(`
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

      await quizzesDb.runAsync(
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
    await quizzesDb.execAsync("BEGIN TRANSACTION;");
    try {
      for (const question of questions) {
        const id = Math.random().toString(36).substring(2, 9);
       await quizzesDb.runAsync(
  `INSERT INTO quiz_questions (id, quizId, type, question, options, correctAnswer, explanation) 
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    id,
    quizId,
    question.type,
    question.question,
    JSON.stringify(question.options), // <- Fix here
    question.correctAnswer,
    question.explanation,
  ]
);
      }
      await quizzesDb.execAsync("COMMIT;");
    } catch (err) {
      await quizzesDb.execAsync("ROLLBACK;");
      throw err;
    }
  },

  getQuizzesByUser: async (userId) => {
    try {
      set({ isLoading: true });
      const quizzes = (await quizzesDb.getAllAsync(
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
      const quiz = (await quizzesDb.getFirstAsync(
        "SELECT * FROM quizzes WHERE id = ?",
        [quizId]
      )) as Quiz | null;

      const questions = (await quizzesDb.getAllAsync(
        "SELECT * FROM quiz_questions WHERE quizId = ?",
        [quizId]
      )) as QuizQuestion[];

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
      set({ isLoading: true });
      await quizzesDb.runAsync("DELETE FROM quizzes WHERE id = ?", [quizId]);
      set((state) => ({
        quizzes: state.quizzes.filter((q) => q.id !== quizId),
      }));
    } catch (err) {
      set({ error: "Failed to delete quiz" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
