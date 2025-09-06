/**
 * SQLite Compatibility Layer for Web
 *
 * This layer provides SQLite-like methods that wrap IndexedDB operations
 * to maintain compatibility with existing store code that expects SQLite API.
 */

import { dbManager } from "./DatabaseManager";

export interface SQLiteCompatibleDatabase {
  runAsync(
    sql: string,
    params?: any[]
  ): Promise<{ lastInsertRowId?: number; changes?: number }>;
  execAsync(queries: { sql: string; args?: any[] }[]): Promise<void>;
  getAllAsync(sql: string, params?: any[]): Promise<any[]>;
  getFirstAsync(sql: string, params?: any[]): Promise<any | null>;
}

class SQLiteCompatibilityLayer implements SQLiteCompatibleDatabase {
  private databaseName: string;

  constructor(databaseName: string = "default") {
    this.databaseName = databaseName;
  }

  /**
   * Execute a SQL-like operation (maps to IndexedDB operations)
   */
  async runAsync(
    sql: string,
    params: any[] = []
  ): Promise<{ lastInsertRowId?: number; changes?: number }> {
    const db = await dbManager.getDatabase(this.databaseName);

    // Parse the SQL to determine operation type
    const operation = this.parseSQL(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([operation.table], "readwrite");
      const store = transaction.objectStore(operation.table);

      switch (operation.type) {
        case "INSERT":
          const insertData = this.buildInsertData(operation, params);
          const addRequest = store.add(insertData);
          addRequest.onsuccess = () => {
            resolve({
              lastInsertRowId: addRequest.result as number,
              changes: 1,
            });
          };
          addRequest.onerror = () => reject(addRequest.error);
          break;

        case "UPDATE":
          const updateData = this.buildUpdateData(operation, params);
          const putRequest = store.put(updateData);
          putRequest.onsuccess = () => {
            resolve({ changes: 1 });
          };
          putRequest.onerror = () => reject(putRequest.error);
          break;

        case "DELETE":
          const deleteKey = this.extractDeleteKey(operation, params);
          const deleteRequest = store.delete(deleteKey);
          deleteRequest.onsuccess = () => {
            resolve({ changes: 1 });
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
          break;

        default:
          reject(new Error(`Unsupported operation: ${operation.type}`));
      }
    });
  }

  /**
   * Execute multiple SQL operations in a transaction
   */
  async execAsync(queries: { sql: string; args?: any[] }[]): Promise<void> {
    for (const query of queries) {
      await this.runAsync(query.sql, query.args);
    }
  }

  /**
   * Get all rows matching a query
   */
  async getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
    const db = await dbManager.getDatabase(this.databaseName);
    const operation = this.parseSQL(sql);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([operation.table], "readonly");
      const store = transaction.objectStore(operation.table);

      if (operation.type === "SELECT") {
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          let results = getAllRequest.result;

          // Apply WHERE clause filtering if present
          if (operation.where) {
            results = this.applyWhereClause(results, operation.where, params);
          }

          resolve(results);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      } else {
        reject(new Error("getAllAsync only supports SELECT operations"));
      }
    });
  }

  /**
   * Get first row matching a query
   */
  async getFirstAsync(sql: string, params: any[] = []): Promise<any | null> {
    const results = await this.getAllAsync(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Parse SQL to extract operation details
   * This is a simplified parser for basic SQL operations
   */
  private parseSQL(sql: string): {
    type: string;
    table: string;
    columns?: string[];
    where?: string;
    values?: string[];
  } {
    const normalizedSQL = sql.trim().toUpperCase();

    if (normalizedSQL.startsWith("INSERT")) {
      const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : "default";
      return { type: "INSERT", table };
    }

    if (normalizedSQL.startsWith("UPDATE")) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : "default";
      return { type: "UPDATE", table };
    }

    if (normalizedSQL.startsWith("DELETE")) {
      const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : "default";
      const whereMatch = sql.match(/WHERE\s+(.+)/i);
      const where = whereMatch ? whereMatch[1] : undefined;
      return { type: "DELETE", table, where };
    }

    if (normalizedSQL.startsWith("SELECT")) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      const table = tableMatch ? tableMatch[1] : "default";
      const whereMatch = sql.match(/WHERE\s+(.+)/i);
      const where = whereMatch ? whereMatch[1] : undefined;
      return { type: "SELECT", table, where };
    }

    throw new Error(`Unsupported SQL operation: ${sql}`);
  }

  /**
   * Build insert data object from SQL and parameters
   */
  private buildInsertData(operation: any, params: any[]): any {
    // This is a simplified implementation
    // In a real scenario, you'd parse the INSERT statement more thoroughly
    return params.reduce(
      (obj, value, index) => {
        obj[`field_${index}`] = value;
        return obj;
      },
      { id: Date.now() }
    ); // Simple ID generation
  }

  /**
   * Build update data object from SQL and parameters
   */
  private buildUpdateData(operation: any, params: any[]): any {
    // Simplified implementation
    return params.reduce((obj, value, index) => {
      obj[`field_${index}`] = value;
      return obj;
    }, {});
  }

  /**
   * Extract delete key from operation and parameters
   */
  private extractDeleteKey(operation: any, params: any[]): any {
    // Simplified - assumes first parameter is the key
    return params[0];
  }

  /**
   * Apply WHERE clause filtering to results
   */
  private applyWhereClause(
    results: any[],
    whereClause: string,
    params: any[]
  ): any[] {
    // Simplified WHERE clause implementation
    // In practice, you'd need a more sophisticated SQL parser
    return results; // For now, return all results
  }
}

// Create a default instance that mimics the SQLite database object
export const createSQLiteCompatibleDB = (
  databaseName: string = "default"
): SQLiteCompatibleDatabase => {
  return new SQLiteCompatibilityLayer(databaseName);
};

// Default database instance
export const sqliteDB = createSQLiteCompatibleDB();
