import * as SQLite from 'expo-sqlite';
import { create } from 'zustand';

const DB_NAME = 'ai_document_responses.db';

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
  saveAnalysis: (coursefile_id: string, course_id: string, response: any) => Promise<void>;
  saveQuiz: (coursefile_id: string, course_id: string, response: any) => Promise<void>;
  saveSummary: (coursefile_id: string, course_id: string, response: any) => Promise<void>;
  getAnalysesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getQuizzesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getSummariesByFile: (coursefile_id: string) => Promise<LocalAIResponse[]>;
  getAllAnalyses: () => Promise<LocalAIResponse[]>;
  getAllQuizzes: () => Promise<LocalAIResponse[]>;
  getAllSummaries: () => Promise<LocalAIResponse[]>;
  deleteAnalysis: (id: number) => Promise<void>;
  deleteQuiz: (id: number) => Promise<void>;
  deleteSummary: (id: number) => Promise<void>;
}

export const useAIDocumentLocalStore = create<AIDocumentLocalStore>(() => ({
  saveAnalysis: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO analyzed_documents (coursefile_id, course_id, response_json) VALUES (?, ?, ?)',
      coursefile_id, course_id, JSON.stringify(response)
    );
  },
  saveQuiz: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO generated_quizzes (coursefile_id, course_id, response_json) VALUES (?, ?, ?)',
      coursefile_id, course_id, JSON.stringify(response)
    );
  },
  saveSummary: async (coursefile_id, course_id, response) => {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO summaries (coursefile_id, course_id, response_json) VALUES (?, ?, ?)',
      coursefile_id, course_id, JSON.stringify(response)
    );
  },
  getAnalysesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM analyzed_documents WHERE coursefile_id = ?', coursefile_id);
  },
  getQuizzesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM generated_quizzes WHERE coursefile_id = ?', coursefile_id);
  },
  getSummariesByFile: async (coursefile_id) => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM summaries WHERE coursefile_id = ?', coursefile_id);
  },
  getAllAnalyses: async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM analyzed_documents');
  },
  getAllQuizzes: async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM generated_quizzes');
  },
  getAllSummaries: async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM summaries');
  },
  deleteAnalysis: async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM analyzed_documents WHERE id = ?', id);
  },
  deleteQuiz: async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM generated_quizzes WHERE id = ?', id);
  },
  deleteSummary: async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM summaries WHERE id = ?', id);
  },
}));