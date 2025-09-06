import { dbManager } from "@/backend/services/DatabaseManager";
import { sendMessageToCohere } from "@/AiModelHooks/cohereApi";
import { create } from "zustand";

// Types
export interface ExtractedTopic {
  id: string;
  title: string;
  fileId: string;
  fileName: string;
  selected: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  topic: string;
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  topics: string[];
  questions: QuizQuestion[];
  fileIds: string[];
  created_at: string;
  total_questions: number;
}

export interface QuizGenerationProgress {
  currentStep: string;
  progress: number;
  isGenerating: boolean;
  error: string | null;
}

interface QuizGenerationState {
  // Topics management
  extractedTopics: ExtractedTopic[];
  selectedTopics: ExtractedTopic[];

  // Quiz generation
  generationProgress: QuizGenerationProgress;
  generatedQuizzes: GeneratedQuiz[];
  currentQuiz: GeneratedQuiz | null;

  // Actions
  loadExtractedTopics: (fileIds: string[]) => Promise<void>;
  toggleTopicSelection: (topicId: string) => void;
  selectAllTopics: () => void;
  deselectAllTopics: () => void;
  generateQuizFromTopics: (
    selectedTopics: ExtractedTopic[],
    questionsPerTopic?: number
  ) => Promise<GeneratedQuiz | null>;
  saveQuizToLocal: (quiz: GeneratedQuiz) => Promise<void>;
  loadLocalQuizzes: () => Promise<void>;
  getQuizById: (quizId: string) => GeneratedQuiz | null;
  clearGenerationState: () => void;

  // Database management
  initializeDatabase: () => Promise<void>;
  syncTopicsFromSupabase: () => Promise<void>;
}

// Database helper functions
const initDB = async () => {
  return await dbManager.executeWithRetry(
    "hivedemia_quizzes.db",
    async (db) => {
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS generated_quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topics TEXT NOT NULL,
        questions TEXT NOT NULL,
        file_ids TEXT NOT NULL,
        created_at TEXT NOT NULL,
        total_questions INTEGER NOT NULL
      );
    `);
      return db;
    }
  );
};

const saveQuizToDB = async (quiz: GeneratedQuiz) => {
  await dbManager.executeWithRetry("hivedemia_quizzes.db", async (db) => {
    await db.runAsync(
      `INSERT OR REPLACE INTO generated_quizzes 
       (id, title, topics, questions, file_ids, created_at, total_questions) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        quiz.id,
        quiz.title,
        JSON.stringify(quiz.topics),
        JSON.stringify(quiz.questions),
        JSON.stringify(quiz.fileIds),
        quiz.created_at,
        quiz.total_questions,
      ]
    );
  });
};

const loadQuizzesFromDB = async (): Promise<GeneratedQuiz[]> => {
  return await dbManager.executeWithRetry(
    "hivedemia_quizzes.db",
    async (db) => {
      const result = await db.getAllAsync(`
      SELECT * FROM generated_quizzes 
      ORDER BY created_at DESC
    `);
      return result.map((row: any) => ({
        id: row.id,
        title: row.title,
        topics: JSON.parse(row.topics),
        questions: JSON.parse(row.questions),
        fileIds: JSON.parse(row.file_ids),
        created_at: row.created_at,
        total_questions: row.total_questions,
      }));
    }
  );
};

// AI Quiz Generation Helper
const generateQuestionsWithCohere = async (
  topics: string[],
  questionsPerTopic: number = 3,
  onProgress?: (step: string, progress: number) => void
): Promise<QuizQuestion[]> => {
  const allQuestions: QuizQuestion[] = [];

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    onProgress?.(
      `Generating questions for topic: ${topic}`,
      (i / topics.length) * 100
    );

    const prompt = `
Generate ${questionsPerTopic} multiple choice questions about "${topic}".

Format your response as a JSON array where each question has this exact structure:
[
  {
    "question": "Your question here?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct",
    "topic": "${topic}"
  }
]

Rules:
- Questions should be academic and test understanding of the topic
- Options must start with A), B), C), D)
- correct_answer must be just the letter (A, B, C, or D)
- Include a brief explanation for each correct answer
- Make questions challenging but fair

Return ONLY the JSON array, no other text.
    `;

    try {
      const response = await sendMessageToCohere([
        { role: "user", content: prompt },
      ]);

      // Parse the JSON response
      let parsedQuestions: any[] = [];
      try {
        // Clean the response to extract JSON
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedQuestions = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No valid JSON found in response");
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        continue;
      }

      // Validate and add questions
      parsedQuestions.forEach((q, index) => {
        if (q.question && q.options && q.correct_answer) {
          allQuestions.push({
            id: `${topic
              .replace(/\s+/g, "_")
              .toLowerCase()}_${Date.now()}_${index}`,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation || "",
            topic: topic,
          });
        }
      });
    } catch (error) {
      console.error(`Error generating questions for topic ${topic}:`, error);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  onProgress?.("Finalizing quiz generation", 100);
  return allQuestions;
};

export const useQuizGenerationStore = create<QuizGenerationState>(
  (set, get) => ({
    // Initial state
    extractedTopics: [],
    selectedTopics: [],
    generationProgress: {
      currentStep: "",
      progress: 0,
      isGenerating: false,
      error: null,
    },
    generatedQuizzes: [],
    currentQuiz: null,

    // Initialize database
    initializeDatabase: async () => {
      try {
        await initDB();
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    },

    // Sync topics from Supabase to local DB
    syncTopicsFromSupabase: async () => {
      try {
        const { useAIDocumentLocalStore } = await import(
          "./useAIDocumentLocalStore"
        );
        const localStore = useAIDocumentLocalStore.getState();
        await localStore.syncExtractedTopicsFromSupabase();
      } catch (error) {
        console.error("Error syncing topics from Supabase:", error);
      }
    },

    // Load extracted topics from local DB first, then from memory
    loadExtractedTopics: async (fileIds: string[]) => {
      try {
        const { useAIDocumentProcessor } = await import(
          "./useAIDocumentProcessor"
        );

        // 1. First, try to load from local database (offline-first)
        const dbTopicsData = await useAIDocumentProcessor
          .getState()
          .loadExtractedTopicsFromLocalDB(fileIds);

        // 2. Then, get any additional data from memory state
        const { extractedTopicsByFile: memoryTopicsData } =
          useAIDocumentProcessor.getState();

        // 3. Merge data (prioritize DB data, fallback to memory)
        const allTopicsData = { ...memoryTopicsData, ...dbTopicsData };

        const topics: ExtractedTopic[] = [];

        fileIds.forEach((fileId) => {
          const fileTopics = allTopicsData[fileId];
          if (fileTopics && fileTopics.topics) {
            fileTopics.topics.forEach((topic: string, index: number) => {
              topics.push({
                id: `${fileId}_${index}`,
                title: topic,
                fileId: fileId,
                fileName: `File ${fileId}`, // You might want to get actual file name
                selected: false,
              });
            });
          }
        });

        set({ extractedTopics: topics });
      } catch (error) {
        console.error("Error loading extracted topics:", error);
      }
    },

    // Toggle topic selection
    toggleTopicSelection: (topicId: string) => {
      set((state) => {
        const updatedTopics = state.extractedTopics.map((topic) =>
          topic.id === topicId ? { ...topic, selected: !topic.selected } : topic
        );

        const selectedTopics = updatedTopics.filter((topic) => topic.selected);

        return {
          extractedTopics: updatedTopics,
          selectedTopics,
        };
      });
    },

    // Select all topics
    selectAllTopics: () => {
      set((state) => {
        const updatedTopics = state.extractedTopics.map((topic) => ({
          ...topic,
          selected: true,
        }));

        return {
          extractedTopics: updatedTopics,
          selectedTopics: updatedTopics,
        };
      });
    },

    // Deselect all topics
    deselectAllTopics: () => {
      set((state) => ({
        extractedTopics: state.extractedTopics.map((topic) => ({
          ...topic,
          selected: false,
        })),
        selectedTopics: [],
      }));
    },

    // Generate quiz from selected topics
    generateQuizFromTopics: async (
      selectedTopics: ExtractedTopic[],
      questionsPerTopic: number = 3
    ) => {
      if (selectedTopics.length === 0) {
        throw new Error("No topics selected");
      }

      // Set generation state
      set({
        generationProgress: {
          currentStep: "Initializing quiz generation...",
          progress: 0,
          isGenerating: true,
          error: null,
        },
      });

      try {
        const topics = selectedTopics.map((t) => t.title);
        const fileIds = [...new Set(selectedTopics.map((t) => t.fileId))];

        // Generate questions using Cohere API
        const questions = await generateQuestionsWithCohere(
          topics,
          questionsPerTopic,
          (step, progress) => {
            set((prevState) => ({
              generationProgress: {
                ...prevState.generationProgress,
                currentStep: step,
                progress,
              },
            }));
          }
        );

        if (questions.length === 0) {
          throw new Error("No questions were generated");
        }

        // Create quiz object
        const quiz: GeneratedQuiz = {
          id: `quiz_${Date.now()}`,
          title: `Quiz: ${topics.slice(0, 2).join(", ")}${
            topics.length > 2 ? "..." : ""
          }`,
          topics,
          questions,
          fileIds,
          created_at: new Date().toISOString(),
          total_questions: questions.length,
        };

        // Save to local database
        await get().saveQuizToLocal(quiz);

        // Update state
        set((prevState) => ({
          generationProgress: {
            currentStep: "Quiz generated successfully!",
            progress: 100,
            isGenerating: false,
            error: null,
          },
          currentQuiz: quiz,
          generatedQuizzes: [quiz, ...prevState.generatedQuizzes],
        }));

        return quiz;
      } catch (error: any) {
        set({
          generationProgress: {
            currentStep: "Error generating quiz",
            progress: 0,
            isGenerating: false,
            error: error.message,
          },
        });
        return null;
      }
    },

    // Save quiz to local database
    saveQuizToLocal: async (quiz: GeneratedQuiz) => {
      try {
        await saveQuizToDB(quiz);
      } catch (error) {
        console.error("Error saving quiz to local database:", error);
        throw error;
      }
    },

    // Load local quizzes
    loadLocalQuizzes: async () => {
      try {
        const quizzes = await loadQuizzesFromDB();
        set({ generatedQuizzes: quizzes });
      } catch (error) {
        console.error("Error loading local quizzes:", error);
      }
    },

    // Get quiz by ID
    getQuizById: (quizId: string) => {
      const state = get();
      return state.generatedQuizzes.find((quiz) => quiz.id === quizId) || null;
    },

    // Clear generation state
    clearGenerationState: () => {
      set({
        selectedTopics: [],
        generationProgress: {
          currentStep: "",
          progress: 0,
          isGenerating: false,
          error: null,
        },
        currentQuiz: null,
      });
    },
  })
);
