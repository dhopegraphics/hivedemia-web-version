import * as SQLite from "expo-sqlite";
import { create } from "zustand";

const DB_NAME = "ai_document_responses.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    // Initialize tables if not exist
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS analyzed_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coursefile_id TEXT NOT NULL,
        course_id TEXT,
        response_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS generated_quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coursefile_id TEXT NOT NULL,
        course_id TEXT,
        response_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coursefile_id TEXT NOT NULL,
        course_id TEXT,
        response_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS extracted_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coursefile_id TEXT NOT NULL,
        course_id TEXT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(coursefile_id, name) ON CONFLICT REPLACE
      );
    `);
  }
  return db;
}

type LocalAIResponse = {
  id?: number;
  coursefile_id: string;
  course_id?: string;
  response_json: string;
  created_at?: string;
};

interface AIDocumentLocalStore {
  saveAnalysis: (
    coursefile_id: string,
    course_id: string,
    response: any
  ) => Promise<void>;
  saveQuiz: (
    coursefile_id: string,
    course_id: string,
    response: any
  ) => Promise<void>;
  saveSummary: (
    coursefile_id: string,
    course_id: string,
    response: any
  ) => Promise<void>;
  saveExtractedTopics: (
    coursefile_id: string,
    course_id: string,
    topics: string[],
    summary?: string
  ) => Promise<void>;
  getAnalysesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getQuizzesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getSummariesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getExtractedTopicsByFile: (coursefile_id: string) => Promise<any>;
  getAllAnalyses: () => Promise<LocalAIResponse[]>;
  getAllQuizzes: () => Promise<LocalAIResponse[]>;
  getAllSummaries: () => Promise<LocalAIResponse[]>;
  getAllExtractedTopics: () => Promise<any[]>;
  deleteAnalysis: (id: number) => Promise<void>;
  deleteQuiz: (id: number) => Promise<void>;
  deleteSummary: (id: number) => Promise<void>;
  deleteExtractedTopics: (coursefile_id: string) => Promise<void>;
  syncExtractedTopicsFromSupabase: () => Promise<void>;
  saveTopicsToSupabase: (
    coursefile_id: string,
    course_id: string,
    topics: string[]
  ) => Promise<void>;
  getProcessedFilesFromLocal: () => Promise<any[]>;
}

export const useAIDocumentLocalStore = create<AIDocumentLocalStore>(() => ({
  saveAnalysis: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO analyzed_documents (coursefile_id, course_id, response_json) VALUES (?, ?, ?)",
      coursefile_id,
      course_id,
      JSON.stringify(response)
    );
  },
  saveQuiz: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO generated_quizzes (coursefile_id, course_id, response_json) VALUES (?, ?, ?)",
      coursefile_id,
      course_id,
      JSON.stringify(response)
    );
  },
  saveSummary: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      "INSERT INTO summaries (coursefile_id, course_id, response_json) VALUES (?, ?, ?)",
      coursefile_id,
      course_id,
      JSON.stringify(response)
    );
  },
  saveExtractedTopics: async (coursefile_id, course_id, topics, summary) => {
    const db = await getDb();

    // First, delete existing topics for this file to avoid duplicates
    await db.runAsync(
      "DELETE FROM extracted_topics WHERE coursefile_id = ?",
      coursefile_id
    );

    // Insert each topic as a separate row
    for (const topicName of topics) {
      await db.runAsync(
        "INSERT INTO extracted_topics (coursefile_id, course_id, name) VALUES (?, ?, ?)",
        coursefile_id,
        course_id,
        topicName.trim()
      );
    }
  },
  getAnalysesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync(
      "SELECT * FROM analyzed_documents WHERE coursefile_id = ?",
      coursefile_id
    );
  },
  getQuizzesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync(
      "SELECT * FROM generated_quizzes WHERE coursefile_id = ?",
      coursefile_id
    );
  },
  getSummariesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync(
      "SELECT * FROM summaries WHERE coursefile_id = ?",
      coursefile_id
    );
  },
  getExtractedTopicsByFile: async (coursefile_id) => {
    const db = await getDb();
    const results = (await db.getAllAsync(
      "SELECT * FROM extracted_topics WHERE coursefile_id = ? ORDER BY created_at",
      coursefile_id
    )) as any[];

    if (results && results.length > 0) {
      const topics = results.map((row) => row.name);
      return {
        topics: topics,
        summary: null, // Summary not stored in this schema
        topicsCount: topics.length,
        created_at: results[0].created_at,
      };
    }
    return null;
  },
  getAllAnalyses: async () => {
    const db = await getDb();
    return await db.getAllAsync("SELECT * FROM analyzed_documents");
  },
  getAllQuizzes: async () => {
    const db = await getDb();
    return await db.getAllAsync("SELECT * FROM generated_quizzes");
  },
  getAllSummaries: async () => {
    const db = await getDb();
    return await db.getAllAsync("SELECT * FROM summaries");
  },
  getAllExtractedTopics: async () => {
    const db = await getDb();
    const results = (await db.getAllAsync(
      "SELECT * FROM extracted_topics ORDER BY coursefile_id, created_at"
    )) as any[];

    // Group topics by coursefile_id
    const groupedTopics = results.reduce((acc, row) => {
      const fileId = row.coursefile_id;
      if (!acc[fileId]) {
        acc[fileId] = {
          coursefile_id: fileId,
          course_id: row.course_id,
          topics: [],
          topicsCount: 0,
          created_at: row.created_at,
        };
      }
      acc[fileId].topics.push(row.name);
      acc[fileId].topicsCount = acc[fileId].topics.length;
      return acc;
    }, {});

    return Object.values(groupedTopics);
  },
  deleteAnalysis: async (id) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM analyzed_documents WHERE id = ?", id);
  },
  deleteQuiz: async (id) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM generated_quizzes WHERE id = ?", id);
  },
  deleteSummary: async (id) => {
    const db = await getDb();
    await db.runAsync("DELETE FROM summaries WHERE id = ?", id);
  },
  deleteExtractedTopics: async (coursefile_id) => {
    const db = await getDb();
    await db.runAsync(
      "DELETE FROM extracted_topics WHERE coursefile_id = ?",
      coursefile_id
    );
  },
  syncExtractedTopicsFromSupabase: async () => {
    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import("../supabase");

      const { data: supabaseTopics, error } = await supabase
        .from("extracted_topics")
        .select("*");

      if (error) {
        console.error("Error fetching topics from Supabase:", error);
        return;
      }

      if (supabaseTopics && supabaseTopics.length > 0) {
        const db = await getDb();

        // Clear existing local topics first
        await db.runAsync("DELETE FROM extracted_topics");

        for (const topic of supabaseTopics) {
          try {
            // Insert each topic as individual row matching Supabase schema
            await db.runAsync(
              "INSERT OR REPLACE INTO extracted_topics (coursefile_id, course_id, name, created_at) VALUES (?, ?, ?, ?)",
              topic.coursefile_id.toString(),
              topic.course_id || null,
              topic.name,
              topic.created_at
            );
          } catch (dbError) {
            console.error(
              `Error syncing topic for file ${topic.coursefile_id}:`,
              dbError
            );
          }
        }

        console.log(
          `Synced ${supabaseTopics.length} extracted topics from Supabase to local DB`
        );
      }
    } catch (error) {
      console.error("Error syncing extracted topics from Supabase:", error);
    }
  },
  saveTopicsToSupabase: async (coursefile_id, course_id, topics) => {
    try {
      const { supabase } = await import("../supabase");

      // First, delete existing topics for this file in Supabase
      await supabase
        .from("extracted_topics")
        .delete()
        .eq("coursefile_id", parseInt(coursefile_id));

      // Insert each topic as a separate row
      const topicInserts = topics.map((topicName) => ({
        coursefile_id: parseInt(coursefile_id),
        course_id: course_id || null,
        name: topicName.trim(),
      }));

      const { error } = await supabase
        .from("extracted_topics")
        .insert(topicInserts);

      if (error) {
        throw error;
      }

      console.log(
        `Saved ${topics.length} topics to Supabase for file ${coursefile_id}`
      );
    } catch (error) {
      console.error("Error saving topics to Supabase:", error);
      throw error;
    }
  },
  getProcessedFilesFromLocal: async () => {
    try {
      const db = await getDb();

      // Get all data from all tables
      const [analyses, quizzes, summaries] = await Promise.all([
        db.getAllAsync("SELECT * FROM analyzed_documents") as Promise<
          LocalAIResponse[]
        >,
        db.getAllAsync("SELECT * FROM generated_quizzes") as Promise<
          LocalAIResponse[]
        >,
        db.getAllAsync("SELECT * FROM summaries") as Promise<LocalAIResponse[]>,
      ]);

      // Create a map to efficiently track file processing status
      const processedMap = new Map();

      // Process and merge data
      [...analyses, ...quizzes, ...summaries].forEach((item) => {
        const fileId = item.coursefile_id;
        if (!processedMap.has(fileId)) {
          processedMap.set(fileId, {
            id: fileId,
            coursefile_id: fileId,
            hasAnalysis: false,
            hasQuiz: false,
            hasSummary: false,
            created_at: item.created_at,
          });
        }

        const record = processedMap.get(fileId);

        // Update the processing flags based on which array contains this file
        if (analyses.some((a) => a.coursefile_id === fileId))
          record.hasAnalysis = true;
        if (quizzes.some((q) => q.coursefile_id === fileId))
          record.hasQuiz = true;
        if (summaries.some((s) => s.coursefile_id === fileId))
          record.hasSummary = true;
      });

      // Try to get file names from Supabase coursefiles table
      let fileNamesMap = new Map();
      try {
        const { supabase } = await import("../supabase");
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user?.id) {
          const fileIds = Array.from(processedMap.keys());
          const { data: coursefiles } = await supabase
            .from("coursefiles")
            .select("id, name, type, size")
            .eq("user_id", userData.user.id)
            .in("id", fileIds);

          if (coursefiles) {
            coursefiles.forEach((file) => {
              fileNamesMap.set(file.id.toString(), {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
              });
            });
          }
        }
      } catch (error) {
        console.warn("Could not fetch file names from Supabase:", error);
      }

      // Convert map to array and add formatted date and file names
      const processedFilesArray = Array.from(processedMap.values()).map(
        (item) => {
          const fileInfo = fileNamesMap.get(item.coursefile_id);
          return {
            ...item,
            fileName: fileInfo?.fileName || `File ${item.coursefile_id}`,
            fileType: fileInfo?.fileType || "unknown",
            fileSize: fileInfo?.fileSize || "unknown",
            date: new Date(item.created_at).toLocaleDateString(),
          };
        }
      );

      return processedFilesArray;
    } catch (error) {
      console.error("Error getting processed files from local DB:", error);
      throw error;
    }
  },
}));
