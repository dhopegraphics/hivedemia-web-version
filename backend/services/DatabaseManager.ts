/**
 * Database Connection Manager for Web (IndexedDB replacement for SQLite)
 *
 * This provides a web-compatible alternative to the SQLite manager by:
 * 1. Using IndexedDB for data persistence
 * 2. Providing similar API patterns
 * 3. Handling connection management
 */

class DatabaseManager {
  private static instance: DatabaseManager;
  private databases: Map<string, IDBDatabase> = new Map();
  private initializationPromises: Map<string, Promise<IDBDatabase>> = new Map();

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get or create an IndexedDB database connection
   * Ensures only one connection per database
   */
  async getDatabase(
    databaseName: string,
    version: number = 1
  ): Promise<IDBDatabase> {
    // Return existing connection if available
    if (this.databases.has(databaseName)) {
      return this.databases.get(databaseName)!;
    }

    // If already initializing, wait for that promise
    if (this.initializationPromises.has(databaseName)) {
      return this.initializationPromises.get(databaseName)!;
    }

    // Create new connection
    const initPromise = this.createConnection(databaseName, version);
    this.initializationPromises.set(databaseName, initPromise);

    try {
      const db = await initPromise;
      this.databases.set(databaseName, db);
      this.initializationPromises.delete(databaseName);
      return db;
    } catch (error) {
      this.initializationPromises.delete(databaseName);
      throw error;
    }
  }

  private async createConnection(
    databaseName: string,
    version: number
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }

      console.log(`Creating IndexedDB connection for: ${databaseName}`);

      const request = indexedDB.open(databaseName, version);

      request.onerror = () => {
        reject(
          new Error(`Failed to open database ${databaseName}: ${request.error}`)
        );
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create a default object store if it doesn't exist
        if (!db.objectStoreNames.contains("data")) {
          db.createObjectStore("data", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  /**
   * Execute a database operation with proper error handling
   */
  async executeWithRetry<T>(
    databaseName: string,
    operation: (db: IDBDatabase) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const db = await this.getDatabase(databaseName);
        return await operation(db);
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Database operation attempt ${attempt} failed for ${databaseName}:`,
          error
        );

        // If it's a connection-related error, reset the connection
        if (this.isConnectionError(error)) {
          console.log(
            `Resetting connection for ${databaseName} on attempt ${attempt}`
          );
          this.resetConnection(databaseName);

          // Wait a bit before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, attempt * 100));
        } else {
          // Non-connection error, don't retry
          throw error;
        }
      }
    }

    throw lastError!;
  }

  private isConnectionError(error: unknown): boolean {
    const errorMessage = (error as Error)?.message?.toLowerCase() || "";
    return (
      errorMessage.includes("database") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("indexeddb") ||
      errorMessage.includes("blocked")
    );
  }

  private resetConnection(databaseName: string): void {
    const db = this.databases.get(databaseName);
    if (db) {
      db.close();
    }
    this.databases.delete(databaseName);
    this.initializationPromises.delete(databaseName);
  }

  /**
   * Close all database connections (for app cleanup)
   */
  async closeAllConnections(): Promise<void> {
    const databases = Array.from(this.databases.values());

    databases.forEach((db) => {
      try {
        db.close();
      } catch (error) {
        console.warn("Error closing database connection:", error);
      }
    });

    this.databases.clear();
    this.initializationPromises.clear();
  }
}

export const dbManager = DatabaseManager.getInstance();
