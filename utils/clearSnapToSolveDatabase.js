import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

/**
 * Delete all SQLite DBs, drop all tables, and clear DB files for Hivedemia
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const clearAllLocalDatabases = async () => {
  try {
    // List of known DBs to drop tables from
    const dbNames = [
      "smartHiveSnapToSolve.db",
      "ai_document_responses.db",
      "smartHiveChat.db",
      // Add other DB names here if needed
    ];
    for (const dbName of dbNames) {
      try {
        const db = await SQLite.openDatabaseAsync(dbName);
        // Drop all tables in each DB (add more if needed)
        await db.execAsync("DROP TABLE IF EXISTS snap_solutions");
        await db.execAsync("DROP TABLE IF EXISTS extracted_topics");
        await db.execAsync("DROP TABLE IF EXISTS chat_messages");
        await db.execAsync("DROP TABLE IF EXISTS chat_sessions");
        // Add more DROP TABLE statements if you have more tables
        await db.closeAsync();
      } catch (err) {
        // Ignore errors for missing DBs
      }
    }

    // Delete all DB files in SQLite directory
    const sqliteDir = FileSystem.documentDirectory + "SQLite";
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(sqliteDir);
      await Promise.all(
        files.map((file) =>
          FileSystem.deleteAsync(`${sqliteDir}/${file}`, { idempotent: true })
        )
      );
    }
    return {
      success: true,
      message: "All local databases and tables cleared successfully",
    };
  } catch (error) {
    console.error("Error clearing local databases:", error);
    return {
      success: false,
      message: `Failed to clear local data: ${error.message}`,
    };
  }
};
