import { dbManager } from "@/backend/services/DatabaseManager";
import * as SQLite from "expo-sqlite";
import { create } from "zustand";

export const useSnapToSolveStore = create((set, get) => ({
  solutions: [],
  loading: false,
  error: null,

  initSnapToSolveTables: async () => {
    try {
      await dbManager.executeWithRetry(
        "smartHiveSnapToSolve.db",
        async (db) => {
          // First create the table with all columns if it doesn't exist
          await db.execAsync(`
          CREATE TABLE IF NOT EXISTS snap_solutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_uri TEXT,
            question_type TEXT,
            subject TEXT,
            user_prompt TEXT,
            steps TEXT,
            final_answer TEXT,
            explanation TEXT,
            created_at TEXT,
            is_bookmarked INTEGER DEFAULT 0,
            is_pinned INTEGER DEFAULT 0,
            solution_format TEXT DEFAULT 'step-by-step',
            tables_data TEXT,
            code_blocks TEXT,
            comparisons TEXT,
            multiple_choice_questions TEXT,
            multi_questions TEXT,
            financial_statements TEXT,
            ledger_accounts TEXT,
            journal_entries TEXT,
            accounting_type TEXT,
            question TEXT
          );
        `);

          // Check if we need to add any missing columns (for existing tables)
          try {
            const tableInfo = await db.getAllAsync(
              "PRAGMA table_info(snap_solutions);"
            );

            const existingColumns = tableInfo.map((col) => col.name);
            const enhancedColumns = [
              "solution_format",
              "tables_data",
              "code_blocks",
              "comparisons",
              "multiple_choice_questions",
              "multi_questions",
              "financial_statements",
              "ledger_accounts",
              "journal_entries",
              "accounting_type",
              "question",
            ];

            // Only add columns that don't exist
            for (const column of enhancedColumns) {
              if (!existingColumns.includes(column)) {
                try {
                  let defaultValue =
                    column === "solution_format"
                      ? " DEFAULT 'step-by-step'"
                      : "";
                  await db.execAsync(
                    `ALTER TABLE snap_solutions ADD COLUMN ${column} TEXT${defaultValue};`
                  );
                  console.log(`Successfully added column: ${column}`);
                } catch (alterErr) {
                  // Only log if it's not a duplicate column error
                  if (!alterErr.message.includes("duplicate column")) {
                    console.log(
                      `Error adding column ${column}:`,
                      alterErr.message
                    );
                  }
                }
              }
            }
          } catch (pragmaErr) {
            console.log("Could not check table structure:", pragmaErr.message);
          }
        }
      );
    } catch (err) {
      console.log("Database initialization error:", err.message);
      set({ error: "Failed to initialize SnapToSolve DB" });
    }
  },

  saveSolution: async (solutionObj) => {
    try {
      const result = await dbManager.executeWithRetry(
        "smartHiveSnapToSolve.db",
        async (db) => {
          return await db.runAsync(
            `INSERT INTO snap_solutions 
          (image_uri, question_type, subject, user_prompt, steps, final_answer, explanation, created_at, solution_format, tables_data, code_blocks, comparisons, multiple_choice_questions, multi_questions, financial_statements, ledger_accounts, journal_entries, accounting_type, question)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              solutionObj.image,
              solutionObj.questionType,
              solutionObj.subject || "",
              solutionObj.userPrompt || "",
              JSON.stringify(solutionObj.steps || []),
              solutionObj.finalAnswer,
              solutionObj.explanation,
              new Date().toISOString(),
              solutionObj.solutionFormat || "step-by-step",
              solutionObj.tables ? JSON.stringify(solutionObj.tables) : null,
              solutionObj.codeBlocks
                ? JSON.stringify(solutionObj.codeBlocks)
                : null,
              solutionObj.comparisons
                ? JSON.stringify(solutionObj.comparisons)
                : null,
              solutionObj.multipleChoiceQuestions
                ? JSON.stringify(solutionObj.multipleChoiceQuestions)
                : null,
              solutionObj.multiQuestions
                ? JSON.stringify(solutionObj.multiQuestions)
                : null,
              solutionObj.financialStatements
                ? JSON.stringify(solutionObj.financialStatements)
                : null,
              solutionObj.ledgerAccounts
                ? JSON.stringify(solutionObj.ledgerAccounts)
                : null,
              solutionObj.journalEntries
                ? JSON.stringify(solutionObj.journalEntries)
                : null,
              solutionObj.accountingType || null,
              solutionObj.question || null,
            ]
          );
        }
      );

      const newSolution = {
        id: result.lastInsertRowId,
        image_uri: solutionObj.image,
        question_type: solutionObj.questionType,
        subject: solutionObj.subject || "",
        user_prompt: solutionObj.userPrompt || "",
        steps: solutionObj.steps || [],
        final_answer: solutionObj.finalAnswer,
        explanation: solutionObj.explanation,
        created_at: new Date().toISOString(),
        solution_format: solutionObj.solutionFormat || "step-by-step",
        tables_data: solutionObj.tables || null,
        code_blocks: solutionObj.codeBlocks || null,
        comparisons: solutionObj.comparisons || null,
        multiple_choice_questions: solutionObj.multipleChoiceQuestions || null,
        multi_questions: solutionObj.multiQuestions || null,
        financial_statements: solutionObj.financialStatements || null,
        ledger_accounts: solutionObj.ledgerAccounts || null,
        journal_entries: solutionObj.journalEntries || null,
        accounting_type: solutionObj.accountingType || null,
        question: solutionObj.question || null,
        is_bookmarked: 0,
        is_pinned: 0,
      };

      set((state) => ({
        solutions: [newSolution, ...state.solutions],
      }));

      return { success: true, solution: newSolution };
    } catch (_err) {
      set({ error: "Failed to save solution" });
      return { success: false, error: "Failed to save solution" };
    }
  },

  getAllSolutions: async () => {
    try {
      const rows = await dbManager.executeWithRetry(
        "smartHiveSnapToSolve.db",
        async (db) => {
          return await db.getAllAsync(
            `SELECT * FROM snap_solutions ORDER BY created_at DESC`
          );
        }
      );
      set({
        solutions: rows.map((row) => ({
          ...row,
          steps: JSON.parse(row.steps || "[]"),
          // Parse enhanced fields if they exist
          tables_data: row.tables_data ? JSON.parse(row.tables_data) : null,
          code_blocks: row.code_blocks ? JSON.parse(row.code_blocks) : null,
          comparisons: row.comparisons ? JSON.parse(row.comparisons) : null,
          multiple_choice_questions: row.multiple_choice_questions
            ? JSON.parse(row.multiple_choice_questions)
            : null,
          multi_questions: row.multi_questions
            ? JSON.parse(row.multi_questions)
            : null,
          // Parse accounting fields
          financial_statements: row.financial_statements
            ? JSON.parse(row.financial_statements)
            : null,
          ledger_accounts: row.ledger_accounts
            ? JSON.parse(row.ledger_accounts)
            : null,
          journal_entries: row.journal_entries
            ? JSON.parse(row.journal_entries)
            : null,
        })),
      });
    } catch (_err) {
      set({ error: "Failed to fetch solutions" });
    }
  },

  clearError: () => set({ error: null }),

  deleteSolution: async (solutionId) => {
    try {
      const smartHiveSnapToSolveDb = await SQLite.openDatabaseAsync(
        "smartHiveSnapToSolve.db"
      );
      await smartHiveSnapToSolveDb.runAsync(
        `DELETE FROM snap_solutions WHERE id = ?`,
        [solutionId]
      );
      set((state) => ({
        solutions: state.solutions.filter(
          (solution) => solution.id !== solutionId
        ),
      }));
      return { success: true };
    } catch (_err) {
      set({ error: "Failed to delete solution" });
      return { success: false, error: "Failed to delete solution" };
    }
  },

  toggleBookmark: async (solutionId, isBookmarked) => {
    try {
      const smartHiveSnapToSolveDb = await SQLite.openDatabaseAsync(
        "smartHiveSnapToSolve.db"
      );
      await smartHiveSnapToSolveDb.runAsync(
        `UPDATE snap_solutions SET is_bookmarked = ? WHERE id = ?`,
        [isBookmarked ? 1 : 0, solutionId]
      );
      set((state) => ({
        solutions: state.solutions.map((solution) =>
          solution.id === solutionId
            ? { ...solution, is_bookmarked: isBookmarked ? 1 : 0 }
            : solution
        ),
      }));
      return { success: true };
    } catch (_err) {
      set({ error: "Failed to update bookmark" });
      return { success: false, error: "Failed to update bookmark" };
    }
  },

  togglePin: async (solutionId, isPinned) => {
    try {
      const smartHiveSnapToSolveDb = await SQLite.openDatabaseAsync(
        "smartHiveSnapToSolve.db"
      );
      await smartHiveSnapToSolveDb.runAsync(
        `UPDATE snap_solutions SET is_pinned = ? WHERE id = ?`,
        [isPinned ? 1 : 0, solutionId]
      );
      set((state) => ({
        solutions: state.solutions.map((solution) =>
          solution.id === solutionId
            ? { ...solution, is_pinned: isPinned ? 1 : 0 }
            : solution
        ),
      }));
      return { success: true };
    } catch (_err) {
      set({ error: "Failed to update pin status" });
      return { success: false, error: "Failed to update pin status" };
    }
  },

  getBookmarkedSolutions: () => {
    const { solutions } = get();
    return solutions.filter((solution) => solution.is_bookmarked === 1);
  },

  getSortedSolutions: () => {
    const { solutions } = get();
    return [...solutions].sort((a, b) => {
      // First sort by pinned status
      if (a.is_pinned !== b.is_pinned) {
        return b.is_pinned - a.is_pinned;
      }
      // Then by creation date
      return new Date(b.created_at) - new Date(a.created_at);
    });
  },
}));
