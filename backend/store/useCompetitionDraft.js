// store/useCompetitionDraft.js
import { create } from "zustand";
export const useCompetitionDraft = create((set) => ({
  selectedTopics: [],
  setSelectedTopics: (topics) => set({ selectedTopics: topics }),
}));
