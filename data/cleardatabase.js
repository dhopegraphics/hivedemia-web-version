
import { coursesDb } from "@/data/localDb";
import * as FileSystem from 'expo-file-system';

export const deleteAllLocalTables = async () => {
  try {
    // First close the database connection
    await coursesDb.closeAsync();

    // Get the database file path
    const dbPath = `${FileSystem.documentDirectory}SQLite/competition.db`;
    
    // Delete the database file if it exists
    const dbExists = await FileSystem.getInfoAsync(dbPath);
    if (dbExists.exists) {
      await FileSystem.deleteAsync(dbPath);
      console.log("🗑️ Database file deleted from device");
    }

    // Also delete the journal file if it exists
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    
    const walExists = await FileSystem.getInfoAsync(walPath);
    if (walExists.exists) {
      await FileSystem.deleteAsync(walPath);
    }

    const shmExists = await FileSystem.getInfoAsync(shmPath);
    if (shmExists.exists) {
      await FileSystem.deleteAsync(shmPath);
    }

    console.log("✅ Database completely removed from device");
  } catch (err) {
    console.error("❌ Failed to delete database:", err.message);
  }
};