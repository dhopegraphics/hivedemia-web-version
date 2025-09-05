import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export interface ImportedQuiz {
  id: string;
  userId: string;
  title: string;
  difficulty: string;
  feedbackMode: string;
  questionCount: number;
  questions: ImportedQuestion[];
  createdAt: string;
  fromAIImport: boolean;
  lastPlayedAt?: string;
  bestScore?: number;
}

export interface ImportedQuestion {
  id: string;
  quizId: string;
  questionText: string;
  type: "mcq" | "trueFalse" | "shortAnswer";
  options: string[];
  correctAnswer: string;
  explanation?: string;
  questionOrder: number;
}

interface ImportedQuizStore {
  importedQuizzes: ImportedQuiz[];
  currentImportedQuiz: ImportedQuiz | null;
  isLoading: boolean;

  // Actions
  saveImportedQuiz: (quizData: any, userId: string) => Promise<string>;
  getImportedQuizzes: (userId: string) => Promise<void>;
  getImportedQuizById: (quizId: string) => Promise<ImportedQuiz | null>;
  deleteImportedQuiz: (quizId: string) => Promise<void>;
  updateQuizScore: (quizId: string, score: number) => Promise<void>;
  updateImportedQuizTitle: (quizId: string, newTitle: string) => Promise<void>;
  clearImportedQuizzes: () => void;
}

const STORAGE_KEY = "hivedemia_imported_quizzes";

export const useImportedQuizStore = create<ImportedQuizStore>((set, get) => ({
  importedQuizzes: [],
  currentImportedQuiz: null,
  isLoading: false,

  saveImportedQuiz: async (quizData, userId) => {
    set({ isLoading: true });

    try {
      const quizId = `imported_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const importedQuiz: ImportedQuiz = {
        id: quizId,
        userId,
        title: quizData.title,
        difficulty: quizData.difficulty,
        feedbackMode: quizData.feedbackMode,
        questionCount: quizData.questions.length,
        questions: quizData.questions.map((q: any, index: number) => ({
          id: q.id || `q_${index}_${Date.now()}`,
          quizId,
          questionText: q.questionText || q.question, // Handle both formats
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          questionOrder: index + 1,
        })),
        createdAt: new Date().toISOString(),
        fromAIImport: true,
      };

      // Get existing quizzes
      const existingQuizzes = await AsyncStorage.getItem(STORAGE_KEY);
      const quizzes: ImportedQuiz[] = existingQuizzes
        ? JSON.parse(existingQuizzes)
        : [];

      // Add new quiz
      quizzes.unshift(importedQuiz);

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));

      // Update state
      set((state) => ({
        importedQuizzes: [importedQuiz, ...state.importedQuizzes],
        isLoading: false,
      }));

      return quizId;
    } catch (error) {
      console.error("Error saving imported quiz:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  getImportedQuizzes: async (userId) => {
    console.log("Store: Starting getImportedQuizzes for user:", userId);
    set({ isLoading: true });

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allQuizzes: ImportedQuiz[] = stored ? JSON.parse(stored) : [];
      console.log("Store: Total quizzes in storage:", allQuizzes.length);

      // Filter by user ID
      const userQuizzes = allQuizzes.filter((quiz) => quiz.userId === userId);
      console.log("Store: User quizzes after filtering:", userQuizzes.length);

      set({
        importedQuizzes: userQuizzes,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading imported quizzes:", error);
      set({
        importedQuizzes: [],
        isLoading: false,
      });
    }
  },

  getImportedQuizById: async (quizId) => {
    set({ isLoading: true });

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allQuizzes: ImportedQuiz[] = stored ? JSON.parse(stored) : [];

      const quiz = allQuizzes.find((q) => q.id === quizId);

      set({
        currentImportedQuiz: quiz || null,
        isLoading: false,
      });

      return quiz || null;
    } catch (error) {
      console.error("Error loading imported quiz:", error);
      set({
        currentImportedQuiz: null,
        isLoading: false,
      });
      return null;
    }
  },

  deleteImportedQuiz: async (quizId) => {
    console.log("ImportedQuizStore: Starting deletion of quiz:", quizId);
    set({ isLoading: true });

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allQuizzes: ImportedQuiz[] = stored ? JSON.parse(stored) : [];
      console.log(
        "ImportedQuizStore: Found quizzes in storage:",
        allQuizzes.length
      );

      const quizExists = allQuizzes.some((quiz) => quiz.id === quizId);
      if (!quizExists) {
        console.warn(`ImportedQuizStore: No quiz found with id ${quizId}`);
      }

      // Remove quiz
      const updatedQuizzes = allQuizzes.filter((quiz) => quiz.id !== quizId);
      console.log(
        "ImportedQuizStore: Quizzes after filtering:",
        updatedQuizzes.length
      );

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQuizzes));
      console.log("ImportedQuizStore: Saved updated quizzes to AsyncStorage");

      // Update state
      set((state) => {
        const newState = {
          importedQuizzes: state.importedQuizzes.filter(
            (quiz) => quiz.id !== quizId
          ),
          currentImportedQuiz:
            state.currentImportedQuiz?.id === quizId
              ? null
              : state.currentImportedQuiz,
          isLoading: false,
        };
        console.log(
          "ImportedQuizStore: Updated state, new count:",
          newState.importedQuizzes.length
        );
        return newState;
      });

      console.log("ImportedQuizStore: Quiz deletion completed successfully");
    } catch (error) {
      console.error("ImportedQuizStore: Error deleting imported quiz:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateQuizScore: async (quizId, score) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allQuizzes: ImportedQuiz[] = stored ? JSON.parse(stored) : [];

      // Update quiz score
      const updatedQuizzes = allQuizzes.map((quiz) => {
        if (quiz.id === quizId) {
          return {
            ...quiz,
            lastPlayedAt: new Date().toISOString(),
            bestScore: Math.max(quiz.bestScore || 0, score),
          };
        }
        return quiz;
      });

      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQuizzes));

      // Update state
      set((state) => ({
        importedQuizzes: state.importedQuizzes.map((quiz) => {
          if (quiz.id === quizId) {
            return {
              ...quiz,
              lastPlayedAt: new Date().toISOString(),
              bestScore: Math.max(quiz.bestScore || 0, score),
            };
          }
          return quiz;
        }),
      }));
    } catch (error) {
      console.error("Error updating quiz score:", error);
      throw error;
    }
  },

  clearImportedQuizzes: () => {
    set({
      importedQuizzes: [],
      currentImportedQuiz: null,
      isLoading: false,
    });
  },

  updateImportedQuizTitle: async (quizId, newTitle) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const allQuizzes: ImportedQuiz[] = stored ? JSON.parse(stored) : [];

      const updatedQuizzes = allQuizzes.map((quiz) => {
        if (quiz.id === quizId) {
          return { ...quiz, title: newTitle };
        }
        return quiz;
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQuizzes));

      set((state) => ({
        importedQuizzes: state.importedQuizzes.map((q) =>
          q.id === quizId ? { ...q, title: newTitle } : q
        ),
        currentImportedQuiz:
          state.currentImportedQuiz?.id === quizId
            ? { ...state.currentImportedQuiz, title: newTitle }
            : state.currentImportedQuiz,
      }));
    } catch (error) {
      console.error("Error updating imported quiz title:", error);
    }
  },
}));
