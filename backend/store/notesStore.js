import { dbManager } from "@/backend/services/DatabaseManager";
import { create } from "zustand";

// Web-compatible file picker utility
const webDocumentPicker = {
  async getDocumentAsync(options = {}) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      if (options.type) {
        input.accept = options.type.includes("*")
          ? "*/*"
          : options.type.join(",");
      }
      input.multiple = options.multiple || false;

      input.onchange = async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
          resolve({ type: "cancel" });
          return;
        }

        try {
          const results = await Promise.all(
            files.map(async (file) => ({
              type: "success",
              name: file.name,
              size: file.size,
              uri: URL.createObjectURL(file),
              mimeType: file.type,
              file: file, // Keep reference to original file for reading
            }))
          );

          resolve(
            options.multiple ? { type: "success", assets: results } : results[0]
          );
        } catch (error) {
          console.error("File selection error:", error);
          resolve({ type: "cancel" });
        }
      };

      input.oncancel = () => resolve({ type: "cancel" });
      input.click();
    });
  },
};

// Web-compatible file system utility
const webFileSystem = {
  async readAsStringAsync(uri) {
    try {
      if (uri.startsWith("blob:")) {
        const response = await fetch(uri);
        return await response.text();
      }
      // For regular URLs, fetch content
      const response = await fetch(uri);
      return await response.text();
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  },

  async writeAsStringAsync(uri, content) {
    // In web environment, we can't write directly to file system
    // Instead, trigger download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = uri.split("/").pop() || "file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  documentDirectory: "/", // Not applicable in web
  downloadAsync: async (url, fileUri) => {
    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = fileUri.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { uri: url };
  },
};

// Web-compatible sharing utility
const webSharing = {
  async shareAsync(uri, options = {}) {
    if (navigator.share && options.mimeType !== "application/pdf") {
      try {
        await navigator.share({
          title: options.dialogTitle || "Share",
          url: uri,
        });
        return;
      } catch {
        // Fall back to download if sharing fails
      }
    }

    // Fallback: trigger download
    const a = document.createElement("a");
    a.href = uri;
    a.download = options.UTI || "shared-file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  async isAvailableAsync() {
    return "share" in navigator;
  },
};

// Web-compatible alert utility
const webAlert = {
  alert: (title, message, buttons = [{ text: "OK" }]) => {
    if (buttons.length === 1) {
      window.alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) buttons[0].onPress();
    } else {
      const result = window.confirm(`${title}\n\n${message}`);
      const button = result
        ? buttons.find((b) => b.style !== "cancel") || buttons[0]
        : buttons.find((b) => b.style === "cancel") ||
          buttons[buttons.length - 1];
      if (button.onPress) button.onPress();
    }
  },
};

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
      const result = await webDocumentPicker.getDocumentAsync({
        multiple: false,
      });
      if (result?.type === "success") {
        const { uri, name: fileName, mimeType, size } = result;

        // Check file size limit (10MB)
        if (size) {
          const fileSizeInMB = size / (1024 * 1024);
          if (fileSizeInMB > 10) {
            webAlert.alert(
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
          webAlert.alert(
            "File Already Attached",
            "This file is already attached to this note."
          );
          return;
        }

        // Limit number of attachments to prevent memory issues
        if (currentAttachments.length >= 5) {
          webAlert.alert(
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

    // Create and download the file in web environment
    await webFileSystem.writeAsStringAsync(fileName, json);

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
      window.alert("Failed to generate share link");
      return;
    }

    await webSharing.shareAsync(data.signedUrl, {
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
