import { dbManager } from "@/backend/services/DatabaseManager";
import { supabase } from "@/backend/supabase";
import { create } from "zustand";
import { useUserStore } from "./useUserStore";

const DB_NAME = "leaderboard.db";

type LeaderboardUser = {
  id: string;
  name: string;
  score: number;
  avatar: string;
  streak: number;
  isCurrentUser?: boolean;
};

type Badge = {
  id: number;
  name: string;
  icon: string;
  earned: boolean;
};

type LeaderboardState = {
  leaderboard: LeaderboardUser[];
  badges: Badge[];
  streak: number;
  loading: boolean;
  error: string | null;
  refreshAll: () => Promise<void>;
  syncAll: () => Promise<void>;
  loadLocal: () => Promise<void>;
};

async function getDb() {
  return await dbManager.executeWithRetry(DB_NAME, async (db) => {
    // Create tables if not exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id TEXT PRIMARY KEY,
        name TEXT,
        score INTEGER,
        avatar TEXT,
        streak INTEGER,
        isCurrentUser INTEGER
      );
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY,
        name TEXT,
        icon TEXT,
        earned INTEGER
      );
      CREATE TABLE IF NOT EXISTS streak (
        id INTEGER PRIMARY KEY,
        value INTEGER
      );
    `);
    return db;
  });
}

async function getLocalLeaderboard() {
  const db = await getDb();
  const rows = await db.getAllAsync<LeaderboardUser>(
    "SELECT * FROM leaderboard"
  );
  return rows.map((row) => ({
    ...row,
    isCurrentUser: !!row.isCurrentUser,
  }));
}

async function setLocalLeaderboard(data: LeaderboardUser[]) {
  const db = await getDb();
  await db.runAsync("DELETE FROM leaderboard");
  for (const item of data) {
    await db.runAsync(
      `INSERT INTO leaderboard (id, name, score, avatar, streak, isCurrentUser) VALUES (?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.score,
      item.avatar,
      item.streak,
      item.isCurrentUser ? 1 : 0
    );
  }
}

async function getLocalBadges() {
  const db = await getDb();
  const rows = await db.getAllAsync<Badge>("SELECT * FROM badges");
  return rows.map((row) => ({
    ...row,
    earned: !!row.earned,
  }));
}

async function setLocalBadges(data: Badge[]) {
  const db = await getDb();
  await db.runAsync("DELETE FROM badges");
  for (const item of data) {
    await db.runAsync(
      `INSERT INTO badges (id, name, icon, earned) VALUES (?, ?, ?, ?)`,
      item.id,
      item.name,
      item.icon,
      item.earned ? 1 : 0
    );
  }
}

async function getLocalStreak() {
  const db = await getDb();
  const rows = await db.getAllAsync<{ value: number }>(
    "SELECT value FROM streak WHERE id = 1"
  );
  return rows[0]?.value || 0;
}

async function setLocalStreak(value: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM streak");
  await db.runAsync("INSERT INTO streak (id, value) VALUES (1, ?)", value);
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  leaderboard: [],
  badges: [],
  streak: 0,
  loading: true,
  error: null,

  // Load from local DB
  loadLocal: async () => {
    set({ loading: true, error: null });
    try {
      const leaderboard = await getLocalLeaderboard();
      const badges = await getLocalBadges();
      const streak = await getLocalStreak();
      set({
        leaderboard,
        badges,
        streak,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e.message || "Failed to load local data", loading: false });
    }
  },

  // Sync with Supabase in background
  syncAll: async () => {
    try {
      const { profile } = useUserStore.getState();
      if (!profile) throw new Error("User not logged in");

      // --- LEADERBOARD ---
      const { data: myComps, error: compErr } = await supabase
        .from("competition_participants")
        .select("competition_id")
        .eq("user_id", profile.user_id);

      if (compErr) throw compErr;
      const compIds = (myComps || []).map((c) => c.competition_id);

      const { data: participants, error: partErr } = await supabase
        .from("competition_participants")
        .select(
          "user_id, score, completed, joined_at, completed_at, profiles(full_name, username, avatar_url)"
        )
        .in("competition_id", compIds.length ? compIds : [-1]);

      if (partErr) throw partErr;

      const userMap: Record<string, LeaderboardUser> = {};
      for (const p of participants || []) {
        const uid = p.user_id;
        const profileObj = Array.isArray(p.profiles)
          ? p.profiles[0]
          : p.profiles;
        const name = profileObj?.full_name || profileObj?.username || "User";
        const avatar = profileObj?.avatar_url ? name[0]?.toUpperCase() : "U";
        if (!userMap[uid]) {
          userMap[uid] = {
            id: uid,
            name,
            score: 0,
            avatar,
            streak: 0,
            isCurrentUser: uid === profile.user_id,
          };
        }
        userMap[uid].score += p.score || 0;
        if (p.completed) userMap[uid].streak += 1;
      }
      let leaderboard = Object.values(userMap);
      leaderboard.sort((a, b) =>
        b.score !== a.score ? b.score - a.score : b.streak - a.streak
      );
      await setLocalLeaderboard(leaderboard);
      set({ leaderboard });

      // --- STREAK ---
      let streak = 0;
      try {
        const db = await getDb();
        const rows = await db.getAllAsync<{ date: string }>(
          `SELECT date FROM activity_log WHERE user_id = ? ORDER BY date DESC LIMIT 30`,
          [profile.user_id]
        );
        let today = new Date();
        for (const row of rows) {
          const logDate = new Date(row.date);
          if (logDate.toDateString() === today.toDateString()) {
            streak += 1;
            today.setDate(today.getDate() - 1);
          } else {
            break;
          }
        }
      } catch {
        const { data, error } = await supabase
          .from("competition_participants")
          .select("completed_at")
          .eq("user_id", profile.user_id)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(30);

        if (error) throw error;

        let today = new Date();
        for (const row of data || []) {
          if (!row.completed_at) continue;
          const compDate = new Date(row.completed_at);
          if (compDate.toDateString() === today.toDateString()) {
            streak += 1;
            today.setDate(today.getDate() - 1);
          } else {
            break;
          }
        }
      }
      await setLocalStreak(streak);
      set({ streak });

      // --- BADGES ---
      const { data: quizComps, error: quizErr } = await supabase
        .from("competition_participants")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("completed", true);

      if (quizErr) throw quizErr;

      const { data: notes, error: notesErr } = await supabase
        .from("shared_notes")
        .select("id")
        .eq("uploaded_by", profile.user_id);

      if (notesErr) throw notesErr;

      const badges: Badge[] = [
        {
          id: 1,
          name: "Quiz Master",
          icon: "trophy",
          earned: (quizComps?.length || 0) >= 5,
        },
        {
          id: 2,
          name: "Note Contributor",
          icon: "book",
          earned: (notes?.length || 0) >= 3,
        },
        {
          id: 3,
          name: "Streak Builder",
          icon: "fire",
          earned: streak >= 3,
        },
        {
          id: 4,
          name: "Group Leader",
          icon: "account-arrow-up",
          earned: false,
        },
      ];
      await setLocalBadges(badges);
      set({ badges });
    } catch (e: any) {
      set({ error: e.message || "Failed to sync data" });
    }
  },

  // Called on mount: load local, then sync in background
  refreshAll: async () => {
    await get().loadLocal();
    get().syncAll(); // Don't await, run in background
  },
}));
