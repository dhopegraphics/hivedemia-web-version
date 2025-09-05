import { dbManager } from "@/backend/services/DatabaseManager";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { create } from "zustand";

export const useNotesStore = create((set, get) => ({
  noteContent: "",
  references: [],
  revisionQuestions: [],
  attachments: [],
  savedNotes: [],
  currentFileId: null,
  currentCourseId: null,
  currentNoteId: null,
  setCurrentNoteId: (id) => set({ currentNoteId: id }),
  setCurrentFileAndCourse: (fileId, courseId) =>
    set({
      currentFileId: fileId,
      currentCourseId: courseId,
    }),

  setNoteContent: (content) => set({ noteContent: content }),
  setReferences: (refs) => set({ references: refs }),
  setRevisionQuestions: (questions) => set({ revisionQuestions: questions }),
  setAttachments: (attachments) => set({ attachments }),

  initNotesTable: async () => {
    try {
      await dbManager.executeWithRetry("notes.db", async (db) => {
        await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fileId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    content TEXT,
    attachments TEXT,
    referenceList TEXT, 
    revisionQuestions TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );


CREATE TABLE IF NOT EXISTS voice_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  noteId INTEGER NOT NULL,
  fileUri TEXT NOT NULL,
  duration INTEGER,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE
);


`);
      });
    } catch (err) {
      console.error("Failed to initialize notes table:", err);
    }
  },

  addReference: (ref) => {
    if (!ref.trim()) return;

    // Prevent duplicate references
    const currentRefs = get().references;
    const exists = currentRefs.some((existing) => existing.text === ref.trim());
    if (exists) return;

    set((state) => ({
      references: [...state.references, { id: Date.now(), text: ref.trim() }],
    }));
  },

  addRevisionQuestion: (question) => {
    if (!question.trim()) return;

    // Prevent duplicate questions
    const currentQuestions = get().revisionQuestions;
    const exists = currentQuestions.some(
      (existing) => existing.text === question.trim()
    );
    if (exists) return;

    set((state) => ({
      revisionQuestions: [
        ...state.revisionQuestions,
        { id: Date.now(), text: question.trim() },
      ],
    }));
  },

  attachFile: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (result?.assets?.length) {
        const { uri, name: fileName, mimeType, size } = result.assets[0];

        // Check file size limit (10MB)
        if (size) {
          const fileSizeInMB = size / (1024 * 1024);
          if (fileSizeInMB > 10) {
            Alert.alert(
              "File Too Large",
              `File size is ${fileSizeInMB.toFixed(
                1
              )}MB. Please select a file smaller than 10MB.`,
              [{ text: "OK" }]
            );
            return;
          }
        }

        // Prevent duplicate attachments
        const currentAttachments = get().attachments;
        const exists = currentAttachments.some(
          (existing) => existing.uri === uri
        );
        if (exists) {
          Alert.alert(
            "File Already Attached",
            "This file is already attached to this note."
          );
          return;
        }

        // Limit number of attachments to prevent memory issues
        if (currentAttachments.length >= 5) {
          Alert.alert(
            "Too Many Attachments",
            "You can only attach up to 5 files per note."
          );
          return;
        }

        set((state) => ({
          attachments: [
            ...state.attachments,
            { uri, fileName, mimeType, size },
          ],
        }));
      }
    } catch (err) {
      console.error("Failed to attach file:", err);
    }
  },
  saveNote: async (fileId, courseId) => {
    const {
      noteContent,
      attachments,
      references,
      revisionQuestions,
      currentNoteId,
    } = get();

    try {
      const result = await dbManager.executeWithRetry(
        "notes.db",
        async (db) => {
          if (currentNoteId) {
            // UPDATE existing note
            await db.runAsync(
              `UPDATE notes SET content = ?, attachments = ?, referenceList = ?, revisionQuestions = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [
                noteContent,
                JSON.stringify(attachments),
                JSON.stringify(references),
                JSON.stringify(revisionQuestions),
                currentNoteId,
              ]
            );
          } else {
            // INSERT new note
            const result = await db.runAsync(
              `INSERT INTO notes (fileId, courseId, content, attachments, referenceList, revisionQuestions)
           VALUES (?, ?, ?, ?, ?, ?)`,
              [
                fileId,
                courseId,
                noteContent,
                JSON.stringify(attachments),
                JSON.stringify(references),
                JSON.stringify(revisionQuestions),
              ]
            );
            console.log("✅ Note saved with ID:", result.lastInsertRowId);
          }
          return true;
        }
      );

      if (result) {
        get().clearNoteState();
        set({ currentNoteId: null }); // 🧼 Reset after save

        const updatedNotes = await get().loadNotes(fileId, courseId);
        return updatedNotes;
      }
    } catch (err) {
      console.error("❌ Failed to save/update note:", err);
      return [];
    }
  },

  saveVoiceNote: async (noteId, fileUri, duration) => {
    try {
      await dbManager.executeWithRetry("notes.db", async (db) => {
        await db.runAsync(
          `INSERT INTO voice_notes (noteId, fileUri, duration) VALUES (?, ?, ?)`,
          [noteId, fileUri, duration]
        );
      });
    } catch (err) {
      console.error("Failed to save voice note:", err);
    }
  },
  saveNoteAttachment: async (noteId, newAttachment) => {
    const { attachments } = get();
    const updated = [...attachments, newAttachment];
    set({ attachments: updated });
    await dbManager.executeWithRetry("notes.db", async (db) => {
      await db.runAsync(`UPDATE notes SET attachments = ? WHERE id = ?`, [
        JSON.stringify(updated),
        noteId,
      ]);
    });
  },
  shareCurrentNote: async () => {
    const {
      noteContent,
      attachments,
      references,
      revisionQuestions,
      currentNoteId,
    } = get();

    const fileData = {
      content: noteContent,
      attachments,
      references,
      revisionQuestions,
    };

    const json = JSON.stringify(fileData, null, 2);

    const fileName = `note-${currentNoteId || Date.now()}.json`;
    const path = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(path, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Upload to Supabase
    const { supabase } = await import("@/backend/supabase"); // assumes you have this
    const uploadRes = await supabase.storage
      .from("notes")
      .upload(fileName, json, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadRes.error) {
      console.error("Upload error:", uploadRes.error);
      return;
    }

    const { data } = await supabase.storage
      .from("notes")
      .createSignedUrl(fileName, 3600);
    if (!data?.signedUrl) {
      alert("Failed to generate share link");
      return;
    }

    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Share your note",
      UTI: "public.json",
    });
  },
  saveToBook: async (noteId) => {
    const inputLink = prompt("Paste the link here"); // you can use a Modal UI
    if (!inputLink) return;

    const { references } = get();
    const updated = [...references, { id: Date.now(), text: inputLink }];
    set({ references: updated });
    await dbManager.executeWithRetry("notes.db", async (db) => {
      await db.runAsync(`UPDATE notes SET referenceList = ? WHERE id = ?`, [
        JSON.stringify(updated),
        noteId,
      ]);
    });
  },

  loadNotes: async (fileId, courseId) => {
    try {
      const result = await dbManager.executeWithRetry(
        "notes.db",
        async (db) => {
          const rows = await db.getAllAsync(
            `SELECT * FROM notes WHERE fileId = ? AND courseId = ? ORDER BY created_at DESC LIMIT 50`,
            [fileId, courseId]
          );
          return rows.map((row) => ({
            ...row,
            attachments: JSON.parse(row.attachments || "[]"),
            referenceList: JSON.parse(row.referenceList || "[]"),
            revisionQuestions: JSON.parse(row.revisionQuestions || "[]"),
          }));
        }
      );

      // Only update store state if the result is different from current state
      const currentNotes = get().savedNotes;
      if (JSON.stringify(currentNotes) !== JSON.stringify(result || [])) {
        set((state) => ({
          ...state,
          savedNotes: result || [],
        }));
      }

      return result || [];
    } catch (err) {
      console.error("❌ Failed to load notes:", err);

      // Only update if state is different
      const currentNotes = get().savedNotes;
      if (currentNotes.length > 0) {
        set((state) => ({
          ...state,
          savedNotes: [],
        }));
      }

      return [];
    }
  },
  deleteNote: async (noteId, fileId, courseId) => {
    try {
      const result = await dbManager.executeWithRetry(
        "notes.db",
        async (db) => {
          await db.runAsync(`DELETE FROM notes WHERE id = ?`, [noteId]);
          return true;
        }
      );

      if (result) {
        // Refresh notes list after deletion
        const updatedNotes = await get().loadNotes(fileId, courseId);
        return updatedNotes;
      }
      return [];
    } catch (err) {
      console.error("Failed to delete note:", err);
      return [];
    }
  },
  deleteReference: (id) =>
    set((state) => ({
      references: state.references.filter((ref) => ref.id !== id),
    })),

  deleteRevisionQuestion: (id) =>
    set((state) => ({
      revisionQuestions: state.revisionQuestions.filter((q) => q.id !== id),
    })),

  deleteAttachFile: async (uriToDelete, noteId) => {
    if (!noteId) {
      console.warn("Missing noteId for deleteAttachFile");
      return;
    }

    const state = get();
    const updatedAttachments = state.attachments.filter(
      (att) => att.uri !== uriToDelete
    );
    set({ attachments: updatedAttachments });
    await dbManager.executeWithRetry("notes.db", async (db) => {
      await db.runAsync(`UPDATE notes SET attachments = ? WHERE id = ?`, [
        JSON.stringify(updatedAttachments),
        noteId,
      ]);
    });
  },

  clearNoteState: () => {
    // Clear state with proper garbage collection hints
    set({
      noteContent: "",
      references: [],
      revisionQuestions: [],
      attachments: [],
      currentNoteId: null,
    });

    // Suggest garbage collection for large objects
    if (global.gc) {
      global.gc();
    }
  },
}));
