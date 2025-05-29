// stores/mediaPreviewStore.js
import { create } from 'zustand';

export const useMediaPreviewStore = create((set) => ({
  visible: false,
  media: null, // { type: 'image' | 'video', uri: '...' }
  show: (media) => set({ visible: true, media }),
  hide: () => set({ visible: false, media: null }),
}));