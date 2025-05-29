import { create } from "zustand";
import { supabase } from "@/backend/supabase";
import { groupsDb } from "@/data/localDb";
import uuid from "react-native-uuid";
import { useUserStore } from "./useUserStore";

const useGroupsStore = create((set, get) => ({
  groups: [], // flat groups loaded from SQLite
  organizedGroups: {
    createdByUser: [],
    publicGroups: [],
    joinedGroups: [],
  },
  group: null,
  groupMembers: [],
  loading: false,
  error: null,

  // Initialize the local SQLite database
  initDb: async () => {
    try {
      await groupsDb.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      -- Local groups table
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        isPrivate INTEGER DEFAULT 0,
        avatar_url TEXT,
        created_by TEXT,
        join_code TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        groupicon TEXT,
        subject TEXT,
        password TEXT,
        isSynced INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0
      );

      -- Local mirror of group_members table
      CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY NOT NULL,
        group_id TEXT,
        user_id TEXT,
        role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_muted INTEGER DEFAULT 0,
        isSynced INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0,

        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        -- Optionally reference user_id if you have a local 'profiles' table
        -- FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
        -- Uncomment above line if you have a local profiles table.
        
        UNIQUE (group_id, user_id) -- Optional: prevent duplicates
      );

    `);
    } catch (error) {
      console.error("Error initializing local DB:", error);
    }
  },
  // inside createGroupsStore

initialization: {
  status: "idle", // idle | initializing | syncing | saving | done
  message: "",
  showBootScreen: false,
},
setInitialization: (status, message, showBootScreen = false) =>
  set(() => ({
    initialization: {
      status,
      message,
      showBootScreen,
    },
  })),
  loadOrganizedGroups: async (userId) => {
    const { groups, groupMembers } = get();

    const joinedGroupIds = groupMembers
      .filter((m) => m.user_id === userId)
      .map((m) => m.group_id);

    const joinedGroups = groups.filter((g) => joinedGroupIds.includes(g.id));
    const createdByUser = groups.filter((g) => g.created_by === userId);
    const publicGroups = groups.filter(
      (g) => g.created_by !== userId && !g.isPrivate
    );

    set({
      organizedGroups: {
        joinedGroups,
        createdByUser,
        publicGroups,
      },
    });
  },

  // Fetch groups from the local SQLite database
  fetchFromLocalDb: async () => {
    try {
      const rows = await groupsDb.getAllAsync(
        "SELECT * FROM groups ORDER BY created_at DESC"
      );
      set({ groups: rows });

      // ✅ FIX: Access user data safely using getState
      const user = useUserStore.getState().profile;
      const userId = user?.user_id;

      if (userId) {
        await get().fetchMembersFromLocalDb(); // Load members
        await get().loadOrganizedGroups(userId); // Organize groups
      }
    } catch (error) {
      console.error("Error fetching from local DB:", error);
    }
  },

  // Sync unsynced local groups to Supabase
  syncToSupabase: async () => {
    try {
      const unsyncedGroups = await groupsDb.getAllAsync(
        "SELECT * FROM groups WHERE isSynced = 0"
      );
      const deletedGroups = await groupsDb.getAllAsync(
        "SELECT * FROM groups WHERE isDeleted = 1 AND isSynced = 0"
      );

      for (const group of deletedGroups) {
        const { error } = await supabase
          .from("groups")
          .delete()
          .eq("id", group.id);
        if (!error) {
          await groupsDb.runAsync("DELETE FROM groups WHERE id = ?", [
            group.id,
          ]); // optional: permanent delete
        }
      }
      for (const group of unsyncedGroups) {
        const {
          id,
          name,
          description,
          isPrivate,
          avatar_url,
          created_by,
          join_code,
          created_at,
          groupicon,
          subject,
          password,
        } = group;

        await supabase.from("groups").upsert([ { ...group } ]);

        const { error } = await supabase.from("groups").insert([
          {
            id,
            name,
            description,
            isPrivate: Boolean(isPrivate),
            avatar_url,
            created_by,
            join_code,
            created_at,
            groupicon,
            subject,
            password,
          },
        ]);

        if (!error) {
          await groupsDb.runAsync(
            "UPDATE groups SET isSynced = 1 WHERE id = ?",
            [id]
          );
        } else {
          console.error("Error syncing group to Supabase:", error);
        }
      }
      get().fetchFromLocalDb();
    } catch (error) {
      console.error("Error syncing to Supabase:", error);
    }
  },

  // Fetch groups from Supabase and insert into local DB if missing
  fetchFromSupabaseSyncToLocal: async () => {
    try {
      const { data: groups, error } = await supabase.from("groups").select("*");
      if (error) {
        console.error("Error fetching from Supabase:", error);
        return;
      }

      const { data: onlineGroups } = await supabase.from("groups").select("id");
      const onlineIds = new Set(onlineGroups.map((g) => g.id));

      

      const localGroups = await groupsDb.getAllAsync(
        "SELECT id FROM groups WHERE isDeleted = 0"
      );
      for (const local of localGroups) {
        if (!onlineIds.has(local.id)) {
          await groupsDb.runAsync(
            "UPDATE groups SET isDeleted = 1 WHERE id = ?",
            [local.id]
          );
        }
      }

     for (const group of groups) {
  const local = await groupsDb.getFirstAsync("SELECT * FROM groups WHERE id = ?", [group.id]);

  if (!local) {
    // INSERT new group
    await groupsDb.runAsync(
      `
      INSERT INTO groups 
        (id, name, description, isPrivate, avatar_url, created_by, join_code, created_at, groupicon, subject, password, isSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      [
        group.id,
        group.name,
        group.description,
        group.isPrivate ? 1 : 0,
        group.avatar_url,
        group.created_by,
        group.join_code,
        group.created_at,
        group.groupicon,
        group.subject,
        group.password,
      ]
    );
  } else {
    // UPDATE only if something changed
    const fieldsChanged =
      group.name !== local.name ||
      group.description !== local.description ||
      (group.isPrivate ? 1 : 0) !== local.isPrivate ||
      group.avatar_url !== local.avatar_url ||
      group.created_by !== local.created_by ||
      group.join_code !== local.join_code ||
      group.created_at !== local.created_at ||
      group.groupicon !== local.groupicon ||
      group.subject !== local.subject ||
      group.password !== local.password;

    if (fieldsChanged) {
      await groupsDb.runAsync(
        `
        UPDATE groups SET 
          name = ?, 
          description = ?, 
          isPrivate = ?, 
          avatar_url = ?, 
          created_by = ?, 
          join_code = ?, 
          created_at = ?, 
          groupicon = ?, 
          subject = ?, 
          password = ?, 
          isSynced = 1 
        WHERE id = ?
      `,
        [
          group.name,
          group.description,
          group.isPrivate ? 1 : 0,
          group.avatar_url,
          group.created_by,
          group.join_code,
          group.created_at,
          group.groupicon,
          group.subject,
          group.password,
          group.id,
        ]
      );
    }
  }
}
      get().fetchFromLocalDb();
    } catch (error) {
      console.error("Error syncing from Supabase:", error);
    }
  },

  // Create group locally and trigger sync
  createGroup: async (data) => {
    try {
      const id = uuid.v4();
      const created_at = new Date().toISOString();

      await groupsDb.runAsync(
        `
        INSERT INTO groups 
          (id, name, subject, description, isPrivate, groupicon, password, join_code, created_by, isSynced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `,
        [
          id,
          data.name,
          data.subject,
          data.description,
          data.isPrivate ? 1 : 0,
          data.groupicon,
          data.password,
          data.join_code,
          data.created_by,
          created_at,
        ]
      );

      get().fetchFromLocalDb();
      get().syncToSupabase();
    } catch (error) {
      console.error("Error creating group locally:", error);
    }
  },

  fetchMembersFromLocalDb: async () => {
  try {
    const members = await groupsDb.getAllAsync("SELECT * FROM group_members");
    set({ groupMembers: members });
  } catch (error) {
    console.error("Error fetching group members locally:", error);
  }
},

  syncMembersToSupabase: async () => {
    try {
      const unsyncedMembers = await groupsDb.getAllAsync(
        "SELECT * FROM group_members WHERE isSynced = 0"
      );
      for (const member of unsyncedMembers) {
        const { id, group_id, user_id, role, joined_at, is_muted } = member;

        const { error } = await supabase.from("group_members").insert([
          {
            id,
            group_id,
            user_id,
            role,
            joined_at,
            is_muted: Boolean(is_muted),
          },
        ]);

        if (!error) {
          await groupsDb.runAsync(
            "UPDATE group_members SET isSynced = 1 WHERE id = ?",
            [id]
          );
        } else {
          console.error("Failed to sync member:", error);
        }
      }
    } catch (error) {
      console.error("Error syncing members to Supabase:", error);
    }
  },

  fetchMembersFromSupabaseSyncToLocal: async () => {
    try {
      const { data: members, error } = await supabase
        .from("group_members")
        .select("*");
      if (error) {
        console.error("Error fetching group members from Supabase:", error);
        return;
      }

      for (const member of members) {
        const groupExists = await groupsDb.getFirstAsync(
          "SELECT id FROM groups WHERE id = ?",
          [member.group_id]
        );

        if (!groupExists) {
          continue; // 🛑 Skip this member
        }

        const exists = await groupsDb.getFirstAsync(
          "SELECT id FROM group_members WHERE id = ?",
          [member.id]
        );

        if (!exists) {
          await groupsDb.runAsync(
            `
      INSERT INTO group_members
        (id, group_id, user_id, role, joined_at, is_muted, isSynced)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
            [
              member.id,
              member.group_id,
              member.user_id,
              member.role,
              member.joined_at,
              member.is_muted ? 1 : 0,
            ]
          );
        }
      }
    } catch (error) {
      console.error("Error syncing members from Supabase:", error);
    }
  },

  addMemberLocallyAndSync: async ({ group_id, user_id, role = "member" }) => {
    try {
      const id = uuid.v4();
      const joined_at = new Date().toISOString();

      await groupsDb.runAsync(
        `
      INSERT INTO group_members
        (id, group_id, user_id, role, joined_at, is_muted, isSynced)
      VALUES (?, ?, ?, ?, ?, 0, 0)
    `,
        [id, group_id, user_id, role, joined_at]
      );

      get().syncMembersToSupabase();
    } catch (error) {
      console.error("Error adding member locally:", error);
    }
  },
  getJoinedGroupIds: (userId) => {
    const { groupMembers } = get();
    return groupMembers
      .filter((m) => m.user_id === userId)
      .map((m) => m.group_id);
  },
  updateGroupLocallyAndSync: async (id, changes) => {
  const keys = Object.keys(changes);
  const values = Object.values(changes);
  const setClause = keys.map((key) => `${key} = ?`).join(", ");

  await groupsDb.runAsync(
    `UPDATE groups SET ${setClause}, isSynced = 0 WHERE id = ?`,
    [...values, id]
  );
  get().syncToSupabase();
} ,
leaveGroup: async (group_id, user_id) => {
  await groupsDb.runAsync(
    "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
    [group_id, user_id]
  );
  await supabase
    .from("group_members")
    .delete()
    .eq("group_id", group_id)
    .eq("user_id", user_id);
},
deleteGroupLocally: async (id) => {
  await groupsDb.runAsync("UPDATE groups SET isDeleted = 1, isSynced = 0 WHERE id = ?", [id]);
  get().syncToSupabase();
}
}));

export default useGroupsStore;
