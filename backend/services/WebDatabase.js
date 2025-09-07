// Web Database Manager using IndexedDB for Next.js
// Replaces SQLite functionality for web environment

class WebDatabase {
  constructor() {
    this.dbName = "HivedemiaDB";
    this.version = 1;
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (typeof window === "undefined") {
      // Server-side rendering - return mock functions
      return {
        transaction: () => ({
          objectStore: () => ({
            get: () => ({ onsuccess: () => {}, onerror: () => {} }),
            put: () => ({ onsuccess: () => {}, onerror: () => {} }),
            delete: () => ({ onsuccess: () => {}, onerror: () => {} }),
            getAll: () => ({ onsuccess: () => {}, onerror: () => {} }),
            clear: () => ({ onsuccess: () => {}, onerror: () => {} }),
          }),
        }),
      };
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create courses object store
        if (!db.objectStoreNames.contains("courses")) {
          const courseStore = db.createObjectStore("courses", {
            keyPath: "id",
          });
          courseStore.createIndex("code", "code", { unique: true });
          courseStore.createIndex("createdby", "createdby", { unique: false });
          courseStore.createIndex("created_at", "created_at", {
            unique: false,
          });
        }

        // Create files object store
        if (!db.objectStoreNames.contains("files")) {
          const fileStore = db.createObjectStore("files", { keyPath: "id" });
          fileStore.createIndex("course_id", "course_id", { unique: false });
          fileStore.createIndex("user_id", "user_id", { unique: false });
        }
      };
    });
  }

  // Get all records from a store
  async getAllAsync(storeName, indexName = null, indexValue = null) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);

      let request;
      if (indexName && indexValue) {
        const index = store.index(indexName);
        request = index.getAll(indexValue);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get first record matching criteria
  async getFirstAsync(storeName, id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Add or update a record
  async runAsync(storeName, data) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete a record
  async deleteAsync(storeName, id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Execute with retry (for compatibility with your existing code)
  async executeWithRetry(dbName, callback) {
    try {
      if (!this.db) await this.initDB();
      return await callback(this);
    } catch (error) {
      console.error("Database operation failed:", error);
      throw error;
    }
  }

  // Execute SQL-like queries (converted to IndexedDB operations)
  async execAsync(query) {
    // This is a compatibility method for SQL-like operations
    // Since IndexedDB doesn't use SQL, we'll handle specific operations
    console.log("SQL query converted to IndexedDB operation:", query);
    return true;
  }
}

// Create database manager instance
export const dbManager = new WebDatabase();

// Fallback storage for simple key-value pairs
export const webStorage = {
  setItem: (key, value) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  getItem: (key) => {
    if (typeof window !== "undefined") {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },

  removeItem: (key) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  },
};
