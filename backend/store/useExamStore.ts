import { create } from "zustand";

import { dbManager } from "@/backend/services/DatabaseManager";
import { sendMessageToCohere } from "@/AiModelHooks/cohereApi";

function extractJsonFromResponse(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return "";
  let jsonStr = match[1].trim();
  jsonStr = jsonStr.replace(/\\(?![\\/"bfnrtu])/g, "\\\\");
  return jsonStr;
}

export interface Exam {
  id: string;
  userId: string;
  title: string;
  subject: string;
  duration: number;
  questionCount: number;
  difficulty: string;
  includeTimer: boolean;
  shuffleQuestions: boolean;
  timePerQuestion: number;
  createdAt: number;
}

export interface ExamTopic {
  id: string;
  examId: string;
  topicId: number;
  topicName: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  type: string; // 'mcq' | 'trueFalse' | 'shortAnswer'
  question: string;
  options: string; // JSON stringified array
  correctAnswer: string;
  explanation: string;
}

interface ExamState {
  exams: Exam[];
  currentExam: Exam | null;
  examTopics: ExamTopic[];
  examQuestions: ExamQuestion[];
  isLoading: boolean;
  error: string | null;
  initializeDatabase: () => Promise<void>;
  createExam: (
    exam: Omit<Exam, "id" | "createdAt">,
    topics: { id: number; name: string }[]
  ) => Promise<string>;
  saveExamQuestions: (
    examId: string,
    questions: Omit<ExamQuestion, "id" | "examId">[]
  ) => Promise<void>;
  getExamsByUser: (userId: string) => Promise<void>;
  getExamWithDetails: (examId: string) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  generateExamQuestions: (examData: {
    title: string;
    subject: string;
    topics: string[];
    questionCount: number;
    difficulty: string;
  }) => Promise<Omit<ExamQuestion, "id" | "examId">[]>;
}

export const useExamStore = create<ExamState>((set) => ({
  exams: [],
  currentExam: null,
  examTopics: [],
  examQuestions: [],
  isLoading: false,
  error: null,

  initializeDatabase: async () => {
    try {
      await dbManager.executeWithRetry("examsHub.db", async (db) => {
        set({ isLoading: true });
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exams (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT,
          subject TEXT,
          duration INTEGER,
          questionCount INTEGER,
          difficulty TEXT,
          includeTimer BOOLEAN,
          shuffleQuestions BOOLEAN,
          timePerQuestion INTEGER,
          createdAt INTEGER
        );

        CREATE TABLE IF NOT EXISTS exam_topics (
          id TEXT PRIMARY KEY,
          examId TEXT,
          topicId INTEGER,
          topicName TEXT,
          FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS exam_questions (
          id TEXT PRIMARY KEY,
          examId TEXT,
          type TEXT,
          question TEXT,
          options TEXT,
          correctAnswer TEXT,
          explanation TEXT,
          FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
        );
      `);
      });
    } catch (err) {
      set({ error: "Failed to initialize database" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  createExam: async (exam, topics) => {
    try {
      set({ isLoading: true });
      const id = Math.random().toString(36).substring(2, 9);
      const createdAt = Date.now();
      await dbManager.executeWithRetry("examsHub.db", async (db) => {
        await db.runAsync(
          `INSERT INTO exams (id, userId, title, subject, duration, questionCount, difficulty, includeTimer, shuffleQuestions, timePerQuestion, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            exam.userId,
            exam.title,
            exam.subject,
            exam.duration,
            exam.questionCount,
            exam.difficulty,
            exam.includeTimer ? 1 : 0,
            exam.shuffleQuestions ? 1 : 0,
            exam.timePerQuestion,
            createdAt,
          ]
        );

        // Save topics
        for (const topic of topics) {
          const topicId = Math.random().toString(36).substring(2, 9);
          await db.runAsync(
            `INSERT INTO exam_topics (id, examId, topicId, topicName) 
           VALUES (?, ?, ?, ?)`,
            [topicId, id, topic.id, topic.name]
          );
        }
      });
      return id;
    } catch (err) {
      set({ error: "Failed to create exam" });
      console.error(err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  saveExamQuestions: async (examId, questions) => {
    try {
      set({ isLoading: true });

      for (const question of questions) {
        const id = Math.random().toString(36).substring(2, 9);
        await dbManager.executeWithRetry("examsHub.db", async (db) => {
          await db.runAsync(
            `INSERT INTO exam_questions (id, examId, type, question, options, correctAnswer, explanation) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              examId,
              question.type,
              question.question,
              JSON.stringify(question.options),
              question.correctAnswer,
              question.explanation || "",
            ]
          );
        });
      }
    } catch (err) {
      set({ error: "Failed to save questions" });
      console.error(err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  getExamsByUser: async (userId) => {
    try {
      set({ isLoading: true });
      const exams = await dbManager.executeWithRetry(
        "examsHub.db",
        async (db) => {
          return await db.getAllAsync(
            "SELECT * FROM exams WHERE userId = ? ORDER BY createdAt DESC",
            [userId]
          );
        }
      );
      set({ exams: exams as Exam[] });
    } catch (err) {
      set({ error: "Failed to fetch exams" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  getExamWithDetails: async (examId) => {
    try {
      set({ isLoading: true });
      const exam = await dbManager.executeWithRetry(
        "examsHub.db",
        async (db) => {
          return await db.getFirstAsync("SELECT * FROM exams WHERE id = ?", [
            examId,
          ]);
        }
      );

      const topics = await dbManager.executeWithRetry(
        "examsHub.db",
        async (db) => {
          return await db.getAllAsync(
            "SELECT * FROM exam_topics WHERE examId = ?",
            [examId]
          );
        }
      );

      const questions = await dbManager.executeWithRetry(
        "examsHub.db",
        async (db) => {
          return await db.getAllAsync(
            "SELECT * FROM exam_questions WHERE examId = ?",
            [examId]
          );
        }
      );

      set({
        currentExam: exam as Exam,
        examTopics: topics as ExamTopic[],
        examQuestions: questions as ExamQuestion[],
      });
    } catch (err) {
      set({ error: "Failed to fetch exam" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteExam: async (examId) => {
    try {
      set({ isLoading: true });
      await dbManager.executeWithRetry("examsHub.db", async (db) => {
        await db.runAsync("DELETE FROM exams WHERE id = ?", [examId]);
      });
      set((state) => ({
        exams: state.exams.filter((e) => e.id !== examId),
      }));
    } catch (err) {
      set({ error: "Failed to delete exam" });
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  generateExamQuestions: async (examData) => {
    try {
      set({ isLoading: true });

      // Construct the prompt for AI
      let prompt = `Generate an exam with these specifications:
- Title: ${examData.title}
- Subject: ${examData.subject}
- Topics: ${examData.topics.join(", ")}
- Number of questions: ${examData.questionCount}
- Difficulty: ${examData.difficulty}

Format the response as JSON with this structure:
{
  "questions": [
    {
      "type": "question_type", // "mcq", "trueFalse", or "shortAnswer"
      "question": "question_text",
      "options": ["option1", "option2", ...], // for MCQ and true/false
      "correctAnswer": "correct_answer",
      "explanation": "explanation_text" // optional
    },
    ...
  ]
}
`;

      // Send to AI
      const aiResponse = await sendMessageToCohere([
        { role: "user", content: prompt },
      ]);

      // Parse AI response
      let examQuestions = [];
      try {
        const jsonString = extractJsonFromResponse(aiResponse);
        if (!jsonString) throw new Error("Invalid exam format from AI");
        const parsed = JSON.parse(jsonString);
        examQuestions = parsed.questions || [];

        // Validate questions
        examQuestions = examQuestions.map((q: any) => ({
          ...q,
          options:
            q.type === "shortAnswer" ? "[]" : JSON.stringify(q.options || []),
        }));
      } catch (e) {
        console.error("Failed to parse AI response", e, aiResponse);
        throw new Error("Invalid exam format from AI");
      }

      return examQuestions;
    } catch (error) {
      set({ error: "Failed to generate exam questions" });
      console.error("Exam generation error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
