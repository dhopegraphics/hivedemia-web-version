/**
 * Database Connection Manager for Android SQLite Fix
 *
 * This addresses the Android-specific NullPointerException issues by:
 * 1. Creating a single connection per database
 * 2. Reusing connections across operations
 * 3. Proper connection lifecycle management
 * 4. Initialization sequencing
 */

import * as SQLite from "expo-sqlite";

class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, SQLite.SQLiteDatabase> = new Map();
  private initializationPromises: Map<string, Promise<SQLite.SQLiteDatabase>> =
    new Map();
  private isInitializing: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Get or create a database connection
   * Ensures only one connection per database file
   */
  async getDatabase(databaseName: string): Promise<SQLite.SQLiteDatabase> {
    // Return existing connection if available
    if (this.connections.has(databaseName)) {
      return this.connections.get(databaseName)!;
    }

    // If already initializing, wait for that promise
    if (this.initializationPromises.has(databaseName)) {
      return this.initializationPromises.get(databaseName)!;
    }

    // Create new connection
    const initPromise = this.createConnection(databaseName);
    this.initializationPromises.set(databaseName, initPromise);

    try {
      const db = await initPromise;
      this.connections.set(databaseName, db);
      this.initializationPromises.delete(databaseName);
      return db;
    } catch (error) {
      this.initializationPromises.delete(databaseName);
      throw error;
    }
  }

  private async createConnection(
    databaseName: string
  ): Promise<SQLite.SQLiteDatabase> {
    try {
      console.log(`Creating database connection for: ${databaseName}`);

      const db = await SQLite.openDatabaseAsync(databaseName, {
        // Note: NOT using useNewConnection: true
        // This would create more connections, worsening the problem
      });

      // Enable WAL mode for better concurrency (Android-safe)
      await db.execAsync("PRAGMA journal_mode = WAL;");

      return db;
    } catch (error) {
      console.error(
        `Failed to create database connection for ${databaseName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Execute a database operation with proper error handling
   */
  async executeWithRetry<T>(
    databaseName: string,
    operation: (db: SQLite.SQLiteDatabase) => Promise<T>,
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

  private isConnectionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || "";
    return (
      errorMessage.includes("nullpointerexception") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("database is locked") ||
      errorMessage.includes("native")
    );
  }

  private resetConnection(databaseName: string): void {
    this.connections.delete(databaseName);
    this.initializationPromises.delete(databaseName);
    this.isInitializing.delete(databaseName);
  }

  /**
   * Close all database connections (for app cleanup)
   */
  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(
      async (db) => {
        try {
          await db.closeAsync();
        } catch (error) {
          console.warn("Error closing database connection:", error);
        }
      }
    );

    await Promise.all(closePromises);

    this.connections.clear();
    this.initializationPromises.clear();
    this.isInitializing.clear();
  }
}

export const dbManager = DatabaseManager.getInstance();
