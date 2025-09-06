/**
 * Web Database Service - SQLite-compatible API for IndexedDB
 *
 * This service provides a SQLite-like interface that works with IndexedDB
 * for web compatibility while maintaining the same API as the mobile stores expect.
 */

interface WebDatabaseResult {
  lastInsertRowId?: number;
  changes?: number;
}

interface WebDatabaseQuery {
  sql: string;
  args?: unknown[];
}

class WebDatabase {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private version: number = 1;

  constructor(dbName: string = "hivedemia_web") {
    this.dbName = dbName;
  }

  /**
   * Initialize the database connection
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains("suggested_topics")) {
          db.createObjectStore("suggested_topics", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("snap_solutions")) {
          db.createObjectStore("snap_solutions", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("quizzes")) {
          db.createObjectStore("quizzes", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("smart_hive")) {
          db.createObjectStore("smart_hive", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
    });
  }

  /**
   * SQLite-compatible runAsync method
   */
  async runAsync(
    sql: string,
    params: unknown[] = []
  ): Promise<WebDatabaseResult> {
    const db = await this.initDB();

    // Parse SQL to determine operation
    const sqlUpper = sql.trim().toUpperCase();

    if (sqlUpper.startsWith("INSERT")) {
      return this.handleInsert(db, sql, params);
    } else if (sqlUpper.startsWith("UPDATE")) {
      return this.handleUpdate(db, sql, params);
    } else if (sqlUpper.startsWith("DELETE")) {
      return this.handleDelete(db, sql, params);
    }

    return { changes: 0 };
  }

  /**
   * SQLite-compatible execAsync method
   */
  async execAsync(queries: WebDatabaseQuery[] | string): Promise<void> {
    if (typeof queries === "string") {
      // Handle single SQL string
      await this.runAsync(queries);
      return;
    }

    // Handle array of queries
    for (const query of queries) {
      await this.runAsync(query.sql, query.args);
    }
  }

  /**
   * SQLite-compatible getAllAsync method
   */
  async getAllAsync(sql: string, params: unknown[] = []): Promise<unknown[]> {
    const db = await this.initDB();
    const tableName = this.extractTableName(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], "readonly");
      const store = transaction.objectStore(tableName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // Apply basic WHERE filtering if needed
        if (sql.toUpperCase().includes("WHERE") && params.length > 0) {
          results = this.applyBasicFiltering(results, sql, params);
        }

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * SQLite-compatible getFirstAsync method
   */
  async getFirstAsync(
    sql: string,
    params: unknown[] = []
  ): Promise<unknown | null> {
    const results = await this.getAllAsync(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  private async handleInsert(
    db: IDBDatabase,
    sql: string,
    params: unknown[]
  ): Promise<WebDatabaseResult> {
    const tableName = this.extractTableName(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], "readwrite");
      const store = transaction.objectStore(tableName);

      // Build data object from params (simplified)
      const data = this.buildDataFromParams(sql, params);
      const request = store.add(data);

      request.onsuccess = () => {
        resolve({ lastInsertRowId: request.result as number, changes: 1 });
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async handleUpdate(
    db: IDBDatabase,
    sql: string,
    params: unknown[]
  ): Promise<WebDatabaseResult> {
    const tableName = this.extractTableName(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], "readwrite");
      const store = transaction.objectStore(tableName);

      // For updates, we need to get the record first, then update it
      const data = this.buildDataFromParams(sql, params);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve({ changes: 1 });
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async handleDelete(
    db: IDBDatabase,
    sql: string,
    params: unknown[]
  ): Promise<WebDatabaseResult> {
    const tableName = this.extractTableName(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([tableName], "readwrite");
      const store = transaction.objectStore(tableName);

      // Assume first param is the ID to delete
      const id = params[0] as IDBValidKey;
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve({ changes: 1 });
      };

      request.onerror = () => reject(request.error);
    });
  }

  private extractTableName(sql: string): string {
    // Extract table name from SQL
    const patterns = [/FROM\s+(\w+)/i, /INTO\s+(\w+)/i, /UPDATE\s+(\w+)/i];

    for (const pattern of patterns) {
      const match = sql.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Default fallback
    return "default";
  }

  private buildDataFromParams(
    sql: string,
    params: unknown[]
  ): Record<string, unknown> {
    // This is a simplified approach - in practice you'd parse the SQL more carefully
    const data: Record<string, unknown> = {};

    // If it's an insert with VALUES, try to map params to common field names
    if (sql.toUpperCase().includes("INSERT")) {
      // Common patterns for the stores
      if (params.length >= 2) {
        data.content = params[0];
        data.timestamp = params[1];
      }
      if (params.length >= 3) {
        data.additionalData = params[2];
      }
    }

    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }

    return data;
  }

  private applyBasicFiltering(
    results: unknown[],
    _sql: string,
    _params: unknown[]
  ): unknown[] {
    // Basic filtering - this would need to be more sophisticated for production
    // For now, just return all results
    return results;
  }
}

// Create and export a singleton instance
export const webDB = new WebDatabase();

// Export the class for testing
export { WebDatabase };
