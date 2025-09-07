/**
 * Browser-compatible storage utility for replacing React Native AsyncStorage
 * Uses localStorage with fallback for SSR compatibility
 */

export class BrowserStorage {
  private static isClient = typeof window !== "undefined";

  static async getItem(key: string): Promise<string | null> {
    if (!this.isClient) return null;

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Failed to get item from localStorage:", error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    if (!this.isClient) return;

    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Failed to set item in localStorage:", error);
      throw error;
    }
  }

  static async removeItem(key: string): Promise<void> {
    if (!this.isClient) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove item from localStorage:", error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    if (!this.isClient) return;

    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      throw error;
    }
  }

  static async getAllKeys(): Promise<string[]> {
    if (!this.isClient) return [];

    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error("Failed to get all keys from localStorage:", error);
      return [];
    }
  }
}

// Create AsyncStorage-like interface for easier migration
export const AsyncStorage = {
  getItem: BrowserStorage.getItem,
  setItem: BrowserStorage.setItem,
  removeItem: BrowserStorage.removeItem,
  clear: BrowserStorage.clear,
  getAllKeys: BrowserStorage.getAllKeys,
};
