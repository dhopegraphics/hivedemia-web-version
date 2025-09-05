// store/useLocalTurnoutStore.ts
import { dbManager } from "@/backend/services/DatabaseManager";
import * as SQLite from "expo-sqlite";
import { create } from "zustand";

interface TurnoutResult {
  id: number;
  competition_id: number;
  participant_id: number;
  score: number;
  total_time: number;
  accuracy: number;
  position: number;
  created_at: string;
  sync_status: "pending" | "synced" | "failed";
}

interface LocalTurnoutState {
  db: SQLite.SQLiteDatabase | null;

  // Initialization
  initializeDB: () => Promise<void>;

  // Data operations
  saveTurnoutResults: (competitionId: number, results: any[]) => Promise<void>;
  getLocalTurnoutResults: (competitionId: number) => Promise<any[]>;
  saveQuestionResults: (
    competitionId: number,
    questions: any[]
  ) => Promise<void>;
  getLocalQuestionResults: (competitionId: number) => Promise<any[]>;

  // Sync operations
  syncPendingResults: () => Promise<void>;
  startBackgroundSync: () => () => void;
}

export const useLocalTurnoutStore = create<LocalTurnoutState>((set, get) => ({
  db: null,

  initializeDB: async () => {
    try {
      await dbManager.executeWithRetry("turnout_results.db", async (db) => {
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          
          CREATE TABLE IF NOT EXISTS turnout_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competition_id INTEGER NOT NULL,
            participant_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            total_time INTEGER NOT NULL,
            accuracy REAL NOT NULL,
            position INTEGER NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            sync_status TEXT DEFAULT 'pending',
            UNIQUE (competition_id, participant_id)
          );
          
          CREATE TABLE IF NOT EXISTS question_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            competition_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            correct_answer_id INTEGER NOT NULL,
            correct_percentage REAL NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE (competition_id, question_id)
          );
        `);
        set({ db });
      });
    } catch (error) {
      console.error("Failed to initialize turnout database:", error);
      throw error;
    }
  },

  saveTurnoutResults: async (competitionId, results) => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");
    let hasActiveTransaction = false;

    try {
      await dbManager.executeWithRetry("turnout_results.db", async (db) => {
        // Start transaction
        await db.runAsync("BEGIN TRANSACTION");
        hasActiveTransaction = true;

        // Delete existing results for this competition
        await db.runAsync(
          "DELETE FROM turnout_results WHERE competition_id = ?",
          [competitionId]
        );

        // Insert new results
        for (const result of results) {
          await db.runAsync(
            `INSERT INTO turnout_results 
             (competition_id, participant_id, score, total_time, accuracy, position) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              competitionId,
              result.participant_id,
              result.score,
              result.total_time,
              result.accuracy,
              result.position,
            ]
          );
        }

        await db.runAsync("COMMIT");
        hasActiveTransaction = false;
      });
    } catch (error) {
      if (hasActiveTransaction) {
        try {
          await db.runAsync("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      console.error("Failed to save turnout results:", error);
      throw error;
    }
  },

  getLocalTurnoutResults: async (competitionId) => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");

    try {
      return await dbManager.executeWithRetry(
        "turnout_results.db",
        async (db) => {
          return await db.getAllAsync(
            `SELECT * FROM turnout_results 
           WHERE competition_id = ? 
           ORDER BY position ASC`,
            [competitionId]
          );
        }
      );
    } catch (error) {
      console.error("Failed to get local turnout results:", error);
      throw error;
    }
  },

  saveQuestionResults: async (competitionId, questions) => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");
    let hasActiveTransaction = false;

    try {
      // Start transaction
      await db.runAsync("BEGIN TRANSACTION");
      hasActiveTransaction = true;

      // Delete existing question results for this competition
      await db.runAsync(
        "DELETE FROM question_results WHERE competition_id = ?",
        [competitionId]
      );

      // Insert new question results
      for (const question of questions) {
        await db.runAsync(
          `INSERT INTO question_results 
           (competition_id, question_id, correct_answer_id, correct_percentage) 
           VALUES (?, ?, ?, ?)`,
          [
            competitionId,
            question.question_id,
            question.correct_answer_id,
            question.correct_percentage,
          ]
        );
      }

      await db.runAsync("COMMIT");
      hasActiveTransaction = false;
    } catch (error) {
      if (hasActiveTransaction) {
        try {
          await db.runAsync("ROLLBACK");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
      }
      console.error("Failed to save question results:", error);
      throw error;
    }
  },

  getLocalQuestionResults: async (competitionId) => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");

    try {
      return await dbManager.executeWithRetry(
        "turnout_results.db",
        async (db) => {
          return await db.getAllAsync(
            `SELECT * FROM question_results 
           WHERE competition_id = ? 
           ORDER BY question_id ASC`,
            [competitionId]
          );
        }
      );
    } catch (error) {
      console.error("Failed to get local question results:", error);
      throw error;
    }
  },

  syncPendingResults: async () => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");

    try {
      const pendingResults = await db.getAllAsync<TurnoutResult>(
        "SELECT * FROM turnout_results WHERE sync_status = ?",
        ["pending"]
      );

      if (pendingResults.length === 0) return;

      // Process in batches of 10
      for (let i = 0; i < pendingResults.length; i += 10) {
        const batch = pendingResults.slice(i, i + 10);

        try {
          // Here you would implement your actual sync logic with Supabase
          // For example:
          // await supabase.from('turnout_results').upsert(batch);

          // Mark as synced
          await db.runAsync(
            `UPDATE turnout_results SET sync_status = 'synced' 
             WHERE id IN (${batch.map((r) => r.id).join(",")})`
          );
        } catch (error) {
          console.error("Failed to sync batch:", error);
          // Mark as failed (will retry later)
          await db.runAsync(
            `UPDATE turnout_results SET sync_status = 'failed' 
             WHERE id IN (${batch.map((r) => r.id).join(",")})`
          );
        }
      }
    } catch (error) {
      console.error("Failed to sync pending results:", error);
      throw error;
    }
  },

  startBackgroundSync: () => {
    const { syncPendingResults } = get();
    const SYNC_INTERVAL = 30000; // 30 seconds

    const interval = setInterval(async () => {
      try {
        await syncPendingResults();
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    }, SYNC_INTERVAL);

    // Return cleanup function
    return () => clearInterval(interval);
  },
}));
