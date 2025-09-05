// store/useLocalCompetitionStore.ts
import { dbManager } from "@/backend/services/DatabaseManager";
import { RealtimeChannel } from "@supabase/supabase-js";
import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import { supabase } from "../supabase";
import { useCompetitionStore } from "./useCompetitionStore";

// Add new sync helper methods
const syncWithRetry = async (
  operation: () => Promise<void>,
  maxAttempts = 3
) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await operation();
      return;
    } catch (error) {
      attempt++;
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

interface ParticipantAnswer {
  id: number;
  participant_id: number;
  question_id: number;
  answer_id: number | null;
  is_correct: boolean;
  time_taken: number;
  created_at: string;
  sync_status: "pending" | "synced" | "failed";
}

interface SyncStatusCount {
  sync_status: string;
  count: number;
}

interface LocalCompetitionState {
  // Local DB instance
  db: SQLite.SQLiteDatabase | null;
  competitionQuestions: any[]; // Add this
  participantAnswers: ParticipantAnswer[]; // Add this
  subscription: RealtimeChannel | null;
  initializeDB: () => Promise<SQLite.SQLiteDatabase>;

  // Data operations
  preloadCompetitionData: (competitionId: number) => Promise<void>;
  getLocalQuestions: (competitionId: number) => Promise<any[]>;
  getLocalAnswers: (questionId: number) => Promise<any[]>;
  submitLocalAnswer: (answer: {
    participantId: number;
    questionId: number;
    answerId: number | null;
    isCorrect: boolean;
    timeTaken: number;
  }) => Promise<void>;

  // Sync operations
  syncPendingAnswers: () => Promise<void>;
  getSyncStatus: () => Promise<{
    pending: number;
    synced: number;
    failed: number;
  }>;
  startBackgroundSync: () => () => void;
  // New methods for realtime features
  checkAllParticipantsAnswered: (questionId: number) => Promise<boolean>;
  broadcastQuestionComplete: (
    competitionId: number,
    questionId: number
  ) => Promise<void>;
  handleTimeExpired: (
    competitionId: number,
    questionId: number
  ) => Promise<void>;
  cleanupSubscriptions: () => void;
  subscribeToCompetitionUpdates: (
    competitionId: number,
    onStatusChange?: (newStatus: string) => void
  ) => void;
  synchronizeTimer: (
    competitionId: number,
    questionId: number,
    duration: number
  ) => Promise<() => void>;
  resolveConflicts: () => Promise<void>;
}

export const useLocalCompetitionStore = create<LocalCompetitionState>(
  (set, get) => ({
    db: null,
    competitionQuestions: [],
    participantAnswers: [],
    subscription: null,

    checkAllParticipantsAnswered: async (questionId: number) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        const result = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM participant_answers 
         WHERE question_id = ? AND sync_status != 'failed'`,
          [questionId]
        );

        const activeParticipantsCount =
          (
            await db.getFirstAsync<{ count: number }>(
              `SELECT COUNT(DISTINCT participant_id) as count 
         FROM participant_answers`
            )
          )?.count || 0;

        return (result?.count || 0) >= activeParticipantsCount;
      } catch (error) {
        console.error("Error checking participants answered:", error);
        return false;
      }
    },
    broadcastQuestionComplete: async (
      competitionId: number,
      questionId: number
    ) => {
      try {
        await supabase.channel(`competition:${competitionId}`).send({
          type: "broadcast",
          event: "question_complete",
          payload: { questionId },
        });
      } catch (error) {
        console.error("Error broadcasting question complete:", error);
      }
    },
    cleanupSubscriptions: () => {
      const { subscription } = get();
      if (subscription) {
        supabase.removeChannel(subscription);
        set({ subscription: null });
      }
    },

    handleTimeExpired: async (competitionId: number, questionId: number) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Mark any pending answers as timed out
        await db.runAsync(
          `UPDATE participant_answers 
         SET sync_status = 'timed_out' 
         WHERE question_id = ? AND sync_status = 'pending'`,
          [questionId]
        );

        // Broadcast timeout to other participants
        await supabase.channel(`competition:${competitionId}`).send({
          type: "broadcast",
          event: "question_timeout",
          payload: { questionId },
        });
      } catch (error) {
        console.error("Error handling time expired:", error);
      }
    },

    initializeDB: async () => {
      try {
        return await dbManager.executeWithRetry(
          "local_competition.db",
          async (db) => {
            // Initialize tables if they don't exist
            const dbExists = await checkDatabaseExists("competition.db");
            if (!dbExists) {
              // Only create tables if this is a fresh database
              await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          last_sync TEXT,
          sync_status TEXT
        );
        
        CREATE TABLE IF NOT EXISTS competition_questions (
          id INTEGER PRIMARY KEY,
          competition_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          topic_id INTEGER,
          created_at TEXT NOT NULL,
          sync_version INTEGER DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS question_answers (
          id INTEGER PRIMARY KEY,
          question_id INTEGER NOT NULL,
          answer_text TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL,
          created_at TEXT NOT NULL,
          sync_version INTEGER DEFAULT 1,
          FOREIGN KEY (question_id) REFERENCES competition_questions (id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS participant_answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          participant_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          answer_id INTEGER,
          is_correct BOOLEAN NOT NULL,
          time_taken INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          sync_status TEXT DEFAULT 'pending',
          sync_attempts INTEGER DEFAULT 0,
          sync_error TEXT,
          UNIQUE (participant_id, question_id)
        );

        CREATE INDEX idx_pa_sync_status ON participant_answers(sync_status);
        CREATE INDEX idx_pa_question ON participant_answers(question_id);
      `);
            }
            return db;
          }
        );
      } catch (error) {
        console.error("Failed to initialize database:", error);
        throw error;
      }
    },

    preloadCompetitionData: async (
      competitionId,
      onProgress?: (progress: number) => void
    ) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Step 1: Check if data is already loaded
        const result = await db.getFirstAsync<{ count: number }>(
          "SELECT COUNT(*) as count FROM competition_questions WHERE competition_id = ?",
          [competitionId]
        );
        if (result?.count && result.count > 0) {
          onProgress?.(1);
          return;
        }
        onProgress?.(0.1);

        // Step 2: Fetch from online store
        const onlineStore = useCompetitionStore.getState();
        await Promise.all([
          onlineStore.getCompetitionDetails(competitionId),
          onlineStore.fetchAllQuestionAnswers(competitionId),
        ]);
        onProgress?.(0.3);

        // Step 3: Insert questions in a transaction
        await db.runAsync("BEGIN TRANSACTION");
        try {
          // Insert questions
          const questions = onlineStore.competitionQuestions;
          const totalQuestions = questions.length;
          let insertedQuestions = 0;
          for (const question of questions) {
            await db.runAsync(
              "INSERT OR REPLACE INTO competition_questions (id, competition_id, question_text, topic_id, created_at) VALUES (?, ?, ?, ?, ?)",
              [
                question.id,
                competitionId,
                question.question_text,
                question.topic_id,
                question.created_at,
              ]
            );
            insertedQuestions++;
            // Progress: 0.3 -> 0.6 for questions
            if (totalQuestions > 0) {
              onProgress?.(0.3 + (insertedQuestions / totalQuestions) * 0.3);
            }
          }

          // Insert answers
          const questionAnswers = onlineStore.questionAnswersByQuestionId;
          const allAnswers = Object.values(questionAnswers).flat();
          const totalAnswers = allAnswers.length;
          let insertedAnswers = 0;
          for (const [, answers] of Object.entries(questionAnswers)) {
            for (const answer of answers) {
              await db.runAsync(
                "INSERT OR REPLACE INTO question_answers (id, question_id, answer_text, is_correct, created_at) VALUES (?, ?, ?, ?, ?)",
                [
                  answer.id,
                  answer.question_id,
                  answer.answer_text,
                  answer.is_correct,
                  answer.created_at,
                ]
              );
              insertedAnswers++;
              // Progress: 0.6 -> 0.9 for answers
              if (totalAnswers > 0) {
                onProgress?.(0.6 + (insertedAnswers / totalAnswers) * 0.3);
              }
            }
          }

          await db.runAsync("COMMIT");
          onProgress?.(1);
        } catch (error) {
          await db.runAsync("ROLLBACK");
          throw error;
        }
      } catch (error) {
        console.error("Failed to preload competition data:", error);
        onProgress?.(0);
        throw error;
      }
    },

    getLocalQuestions: async (competitionId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        return await db.getAllAsync(
          "SELECT * FROM competition_questions WHERE competition_id = ? ORDER BY id",
          [competitionId]
        );
      } catch (error) {
        console.error("Failed to get local questions:", error);
        throw error;
      }
    },

    getLocalAnswers: async (questionId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        return await db.getAllAsync(
          "SELECT * FROM question_answers WHERE question_id = ? ORDER BY id",
          [questionId]
        );
      } catch (error) {
        console.error("Failed to get local answers:", error);
        throw error;
      }
    },

    submitLocalAnswer: async (answer) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        await db.runAsync(
          `INSERT OR REPLACE INTO participant_answers 
        (participant_id, question_id, answer_id, is_correct, time_taken, sync_status) 
        VALUES (?, ?, ?, ?, ?, 'pending')`,
          [
            answer.participantId,
            answer.questionId,
            answer.answerId,
            answer.isCorrect,
            answer.timeTaken,
          ]
        );

        // Try to sync immediately if online
        await get().syncPendingAnswers();
      } catch (error) {
        console.error("Failed to submit local answer:", error);
        throw error;
      }
    },

    syncPendingAnswers: async () => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Get pending answers with retry count < 3
        const pendingAnswers = await db.getAllAsync<ParticipantAnswer>(
          `SELECT * FROM participant_answers 
       WHERE sync_status = 'pending' 
       AND sync_attempts < 3 
       ORDER BY created_at`
        );

        if (pendingAnswers.length === 0) return;

        const onlineStore = useCompetitionStore.getState();

        // Process in smaller batches for better reliability
        for (let i = 0; i < pendingAnswers.length; i += 5) {
          const batch = pendingAnswers.slice(i, i + 5);

          await Promise.all(
            batch.map(async (answer) => {
              try {
                await syncWithRetry(async () => {
                  await onlineStore.submitAnswer({
                    participantId: answer.participant_id,
                    questionId: answer.question_id,
                    answerId: answer.answer_id ?? 0,
                    timeTaken: answer.time_taken,
                  });
                });

                // Update sync status on success
                await db.runAsync(
                  `UPDATE participant_answers 
               SET sync_status = 'synced', sync_attempts = sync_attempts + 1 
               WHERE id = ?`,
                  [answer.id]
                );
              } catch (error) {
                // Update failure status
                await db.runAsync(
                  `UPDATE participant_answers 
               SET sync_status = 'failed', 
                   sync_attempts = sync_attempts + 1,
                   sync_error = ? 
               WHERE id = ?`,
                  [
                    error instanceof Error ? error.message : String(error),
                    answer.id,
                  ]
                );
              }
            })
          );
        }
      } catch (error) {
        console.error("Failed to sync pending answers:", error);
        throw error;
      }
    },
    resolveConflicts: async () => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Get answers that were marked as synced but might have conflicts
        const potentiallyConflicted = await db.getAllAsync<ParticipantAnswer>(
          `SELECT pa.* FROM participant_answers pa
       JOIN (
         SELECT participant_id, question_id, MAX(created_at) as latest
         FROM participant_answers
         GROUP BY participant_id, question_id
       ) latest ON pa.participant_id = latest.participant_id 
                AND pa.question_id = latest.question_id
                AND pa.created_at = latest.latest
       WHERE pa.sync_status = 'synced'`
        );

        // const onlineStore = useCompetitionStore.getState();

        for (const localAnswer of potentiallyConflicted) {
          try {
            // Get the server version
            const { data: serverAnswer } = await supabase
              .from("participant_answers")
              .select("*")
              .eq("participant_id", localAnswer.participant_id)
              .eq("question_id", localAnswer.question_id)
              .single();

            // If server version exists and is different
            if (
              serverAnswer &&
              (serverAnswer.answer_id !== localAnswer.answer_id ||
                serverAnswer.time_taken !== localAnswer.time_taken)
            ) {
              // Use the server version (or implement your preferred resolution strategy)
              await db.runAsync(
                `UPDATE participant_answers SET
             answer_id = ?,
             is_correct = ?,
             time_taken = ?,
             sync_status = 'synced'
             WHERE participant_id = ? AND question_id = ?`,
                [
                  serverAnswer.answer_id,
                  serverAnswer.is_correct,
                  serverAnswer.time_taken,
                  localAnswer.participant_id,
                  localAnswer.question_id,
                ]
              );
            }
          } catch (error) {
            console.error(
              "Conflict resolution failed for answer:",
              localAnswer.id,
              error
            );
          }
        }
      } catch (error) {
        console.error("Failed to resolve conflicts:", error);
      }
    },

    getSyncStatus: async () => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        const rows = await db.getAllAsync<SyncStatusCount>(
          "SELECT sync_status, COUNT(*) as count FROM participant_answers GROUP BY sync_status"
        );

        const status = { pending: 0, synced: 0, failed: 0 };
        rows.forEach((row) => {
          status[row.sync_status as keyof typeof status] = row.count;
        });

        return status;
      } catch (error) {
        console.error("Failed to get sync status:", error);
        throw error;
      }
    },

    startBackgroundSync: () => {
      const { syncPendingAnswers } = get();
      const SYNC_INTERVAL = 30000; // 30 seconds

      const interval = setInterval(async () => {
        try {
          await syncPendingAnswers();
        } catch (error) {
          console.error("Background sync failed:", error);
        }
      }, SYNC_INTERVAL);

      // Return cleanup function
      return () => clearInterval(interval);
    },
    subscribeToCompetitionUpdates: (
      competitionId: number,
      onStatusChange?: (newStatus: string) => void
    ) => {
      // Clean up existing subscription
      get().cleanupSubscriptions();

      const subscription = supabase
        .channel(`competition:${competitionId}`)
        // Listen for participant answer changes
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "participant_answers",
            filter: `question_id=in.(${get()
              .competitionQuestions.map((q) => q.id)
              .join(",")})`,
          },
          async (payload) => {
            const newAnswer = payload.new as ParticipantAnswer;

            // Update local state immediately
            set((state) => ({
              participantAnswers: [
                ...state.participantAnswers.filter(
                  (a) =>
                    !(
                      a.participant_id === newAnswer.participant_id &&
                      a.question_id === newAnswer.question_id
                    )
                ),
                newAnswer,
              ],
            }));

            // Notify status change if callback provided
            onStatusChange?.("answer_updated");

            // Check if all participants have answered
            const allAnswered = await get().checkAllParticipantsAnswered(
              newAnswer.question_id
            );

            if (allAnswered) {
              // Notify subscribers that everyone has answered
              await get().broadcastQuestionComplete(
                competitionId,
                newAnswer.question_id
              );
              onStatusChange?.("all_answered");
            }
          }
        )
        // Listen for competition status changes
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "competitions",
            filter: `id=eq.${competitionId}`,
          },
          (payload) => {
            const newStatus = (payload.new as { status?: string })?.status;
            if (newStatus && onStatusChange) {
              onStatusChange(newStatus);
            }
          }
        )
        // Listen for question timeout events
        .on("broadcast", { event: "question_timeout" }, (payload) => {
          onStatusChange?.("question_timeout");
        })
        .subscribe();

      set({ subscription });
    },
    synchronizeTimer: async (
      competitionId: any,
      questionId: any,
      duration: any
    ) => {
      const channel = supabase.channel(`timer:${competitionId}-${questionId}`);

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;

      // Broadcast timer start
      await channel.send({
        type: "broadcast",
        event: "timer",
        payload: { startTime, endTime },
      });

      // Set up auto-transition when timer expires
      setTimeout(async () => {
        await get().handleTimeExpired(competitionId, questionId);
      }, duration * 1000);

      return () => {
        channel.unsubscribe();
      };
    },
  })
);
// Helper function to check if the SQLite database file exists and has the required table
async function checkDatabaseExists(dbName: string): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(dbName);
    const result = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_metadata'"
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error("Error checking database existence:", error);
    return false;
  }
}
