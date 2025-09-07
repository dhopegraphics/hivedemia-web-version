// DatabaseManager.ts - Web-compatible database manager for Next.js
import { dbManager as webDB } from "./WebDatabase.js";

interface DatabaseInterface {
  getAllAsync: (query: string, ...params: unknown[]) => Promise<unknown[]>;
  getFirstAsync: (query: string, ...params: unknown[]) => Promise<unknown>;
  runAsync: (query: string, ...params: unknown[]) => Promise<unknown>;
  execAsync: (query: string) => Promise<void>;
}

// Export the web database manager with the same interface as your React Native version
export const dbManager = {
  // Execute operations with retry logic
  executeWithRetry: async (
    dbName: string,
    callback: (db: DatabaseInterface) => Promise<unknown>
  ) => {
    return await webDB.executeWithRetry(dbName, callback);
  },

  // Initialize database (compatibility method)
  initDB: async () => {
    return await webDB.initDB();
  },
};

// Web-compatible UUID generator
export const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
