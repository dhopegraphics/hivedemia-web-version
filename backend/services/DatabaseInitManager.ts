/**
 * Database Initialization Manager
 *
 * Ensures proper sequencing of database initialization to prevent
 * Android SQLite connection conflicts and race conditions.
 */

import { useNotesStore } from "../store/notesStore";
import { usePlannerStore } from "../store/plannerStore";
import { useCourseStore } from "../store/useCourseStore";

class DatabaseInitManager {
  private static instance: DatabaseInitManager;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DatabaseInitManager {
    if (!DatabaseInitManager.instance) {
      DatabaseInitManager.instance = new DatabaseInitManager();
    }
    return DatabaseInitManager.instance;
  }

  /**
   * Initialize all databases in the correct sequence
   * This should be called once at app startup
   */
  async initializeAllDatabases(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  private async performInitialization(): Promise<void> {
    try {
      await useCourseStore.getState().initCourseTable();
      await useNotesStore.getState().initNotesTable();
      await usePlannerStore.getState().initPlannerTables();
    } catch (error) {
      console.error("Database initialization failed:", error);
      // Reset state to allow retry
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Reset initialization state (for testing or error recovery)
   */
  reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Check if databases are initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const dbInitManager = DatabaseInitManager.getInstance();
