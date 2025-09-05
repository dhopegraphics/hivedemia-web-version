// store/useCompetitionHistoryStore.ts
import { dbManager } from "@/backend/services/DatabaseManager";
import * as SQLite from "expo-sqlite";
import { create } from "zustand";
import { useCompetitionStore } from "./useCompetitionStore";
import { useUserStore } from "./useUserStore";

interface CompetitionHistory {
  id: number;
  title: string;
  subject: string;
  created_at: string;
  status: string;
  is_host: boolean;
  host_name: string;
  participants_count: number;
  questions_count: number;
  user_score?: number;
  user_position?: number;
  total_score?: number;
  top_participants?: {
    name: string;
    score: number;
    position: number;
  }[];
}

interface LocalCompetitionHistoryState {
  db: SQLite.SQLiteDatabase | null;
  competitions: CompetitionHistory[];
  lastSyncedAt: Date | null;

  // Initialization
  initializeDB: () => Promise<void>;

  // Data operations
  syncCompetitionHistory: (userId: string) => Promise<void>;
  getLocalCompetitionHistory: (userId: string) => Promise<CompetitionHistory[]>;

  // Internal methods
  _fetchRemoteCompetitions: (userId: string) => Promise<any[]>;
  _transformCompetitionData: (
    competition: any,
    userId: string
  ) => Promise<CompetitionHistory>;
  _saveCompetitionsToLocal: (
    competitions: CompetitionHistory[]
  ) => Promise<void>;
}

export const useCompetitionHistoryStore = create<LocalCompetitionHistoryState>(
  (set, get) => ({
    db: null,
    competitions: [],
    lastSyncedAt: null,

    initializeDB: async () => {
      try {
        return await dbManager.executeWithRetry(
          "competition_history.db",
          async (db) => {
            // Initialize tables if they don't exist
            await db.execAsync(`
          PRAGMA journal_mode = WAL;
          
          CREATE TABLE IF NOT EXISTS competition_history (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            is_host BOOLEAN NOT NULL,
            host_name TEXT NOT NULL,
            participants_count INTEGER NOT NULL,
            questions_count INTEGER NOT NULL,
            user_score INTEGER,
            user_position INTEGER,
            total_score INTEGER,
            top_participants TEXT, -- JSON string
            last_updated TEXT DEFAULT (datetime('now'))
          );
          
          CREATE TABLE IF NOT EXISTS sync_metadata (
            key TEXT PRIMARY KEY,
            value TEXT
          );
        `);

            set({ db });

            // Load last sync time
            const lastSync = await db.getFirstAsync<{ value: string }>(
              "SELECT value FROM sync_metadata WHERE key = 'last_synced'"
            );
            if (lastSync) {
              set({ lastSyncedAt: new Date(lastSync.value) });
            }
          }
        );
      } catch (error) {
        console.error(
          "Failed to initialize competition history database:",
          error
        );
        throw error;
      }
    },

    syncCompetitionHistory: async (userId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        // Fetch remote data
        const remoteCompetitions = await get()._fetchRemoteCompetitions(userId);

        // Transform data for local storage
        const transformed = await Promise.all(
          remoteCompetitions.map((comp) =>
            get()._transformCompetitionData(comp, userId)
          )
        );

        // Save to local DB in transaction
        await db.runAsync("BEGIN TRANSACTION");
        try {
          // Clear old data
          await db.runAsync("DELETE FROM competition_history");

          // Insert new data
          for (const comp of transformed) {
            await db.runAsync(
              `INSERT INTO competition_history 
             (id, title, subject, created_at, status, is_host, host_name, 
              participants_count, questions_count, user_score, user_position, 
              total_score, top_participants)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                comp.id ?? null,
                comp.title ?? null,
                comp.subject ?? null,
                comp.created_at ?? null,
                comp.status ?? null,
                comp.is_host ? 1 : 0,
                comp.host_name ?? null,
                comp.participants_count ?? null,
                comp.questions_count ?? null,
                comp.user_score ?? null,
                comp.user_position ?? null,
                comp.total_score ?? null,
                JSON.stringify(comp.top_participants || []),
              ]
            );
          }

          // Update sync timestamp
          await db.runAsync(
            `INSERT OR REPLACE INTO sync_metadata (key, value) 
           VALUES ('last_synced', datetime('now'))`
          );

          await db.runAsync("COMMIT");

          // Update local state
          set({
            competitions: transformed,
            lastSyncedAt: new Date(),
          });
        } catch (error) {
          await db.runAsync("ROLLBACK");
          throw error;
        }
      } catch (error) {
        console.error("Failed to sync competition history:", error);
        // Continue with local data even if sync fails
      }
    },

    getLocalCompetitionHistory: async (userId) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        const rows = await db.getAllAsync<any>(
          "SELECT * FROM competition_history ORDER BY created_at DESC"
        );

        // Parse the data
        const competitions = rows.map((row) => ({
          id: row.id,
          title: row.title,
          subject: row.subject,
          created_at: row.created_at,
          status: row.status,
          is_host: row.is_host === 1,
          host_name: row.host_name,
          participants_count: row.participants_count,
          questions_count: row.questions_count,
          user_score: row.user_score,
          user_position: row.user_position,
          total_score: row.total_score,
          top_participants: JSON.parse(row.top_participants || "[]"),
        }));

        set({ competitions });
        return competitions;
      } catch (error) {
        console.error("Failed to get local competition history:", error);
        throw error;
      }
    },

    _fetchRemoteCompetitions: async (userId) => {
      // Use the existing competition store to fetch data
      const competitionStore = useCompetitionStore.getState();
      await competitionStore.getMyCompetitions(userId);

      // Make sure we're returning the competitions with all needed relations
      return competitionStore.competitions.map((comp) => ({
        ...comp,
        competition_participants: comp.competition_participants || [],
        competition_questions: comp.competition_questions || [],
      }));
    },

    _transformCompetitionData: async (competition, userId) => {
      const isHost = competition.created_by === userId;
      const isNotHostId = competition.created_by;

      // Initialize hostName with the ID as fallback
      let hostName = isHost ? "You" : isNotHostId || "Unknown";

      // Only fetch profile if not the current user and we have an ID
      if (!isHost && isNotHostId) {
        try {
          const userStore = useUserStore.getState();
          const profile = await userStore.getUserProfile(isNotHostId);
          hostName = profile?.username || profile?.full_name || "Unknown";
        } catch (error) {
          console.error("Failed to fetch host profile:", error);
          // Keep the existing hostName (which is the ID)
        }
      }

      // Process participants
      const validParticipants = (competition.competition_participants || [])
        .filter((p: any) => p.score !== null && p.score !== undefined)
        .sort((a: any, b: any) => b.score - a.score);

      // Find user's result
      const userResult = validParticipants.find(
        (p: any) => p.user_id === userId
      );

      // Calculate user position
      let userPosition: number | undefined;
      if (userResult) {
        const userScore = userResult.score;
        userPosition =
          validParticipants.findIndex((p: any) => p.score === userScore) + 1;
      }

      // Get top 3 participants
      const topParticipants = validParticipants
        .slice(0, 3)
        .map((p: any, index: number) => ({
          name:
            p.user_id === userId ? "You" : p.profiles?.username || "Anonymous",
          score: p.score,
          position: index + 1,
        }));

      return {
        id: competition.id,
        title: competition.title,
        subject: competition.subject,
        created_at: competition.created_at,
        status: competition.status || "unknown",
        is_host: isHost,
        host_name: hostName,
        participants_count: validParticipants.length,
        questions_count: competition.competition_questions?.length || 0,
        user_score: userResult?.score,
        user_position: userPosition,
        total_score: competition.competition_questions?.length || 0,
        top_participants:
          topParticipants.length > 0 ? topParticipants : undefined,
      };
    },

    _saveCompetitionsToLocal: async (competitions) => {
      const { db } = get();
      if (!db) throw new Error("Database not initialized");

      try {
        await db.runAsync("BEGIN TRANSACTION");

        // Clear old data
        await db.runAsync("DELETE FROM competition_history");

        // Insert new data
        for (const comp of competitions) {
          await db.runAsync(
            `INSERT INTO competition_history 
           (id, title, subject, created_at, status, is_host, host_name, 
            participants_count, questions_count, user_score, user_position, 
            total_score, top_participants)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              comp.id ?? null,
              comp.title ?? null,
              comp.subject ?? null,
              comp.created_at ?? null,
              comp.status ?? null,
              comp.is_host ? 1 : 0,
              comp.host_name ?? null,
              comp.participants_count ?? null,
              comp.questions_count ?? null,
              comp.user_score ?? null,
              comp.user_position ?? null,
              comp.total_score ?? null,
              JSON.stringify(comp.top_participants || []),
            ]
          );
        }

        await db.runAsync("COMMIT");
      } catch (error) {
        await db.runAsync("ROLLBACK");
        throw error;
      }
    },
  })
);
