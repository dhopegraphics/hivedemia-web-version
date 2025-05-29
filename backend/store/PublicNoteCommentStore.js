import { create } from "zustand";
import { supabase } from "@/backend/supabase";
import { useUserStore } from "@/backend/store/useUserStore";

export const useCommentsStore = create((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,

  
 
  
  // Cache mapping of note IDs to their comments
  noteCommentsCache: {},
  
  // Track if we've fully loaded all comments for a particular note
  fullyCachedNotes: new Set(),
  
  // Fetch comments for a specific shared note
  fetchComments: async (noteId) => {
    // Return cached comments if available
    if (get().fullyCachedNotes.has(noteId)) {
      return get().noteCommentsCache[noteId] || [];
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from("shared_notes_comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("note_id", noteId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Enrich with user profile data where available
      const enrichedComments = await Promise.all(
        data.map(async (comment) => {
          if (!comment.user_id) {
            return {
              ...comment,
              profile: null,
              isOwnComment: false
            };
          }
          
          const currentUser = useUserStore.getState().profile;
          const isOwnComment = currentUser && comment.user_id === currentUser.user_id;
          
          // Fetch user profile if not the current user
          let profile = null;
          if (comment.user_id) {
            profile = await useUserStore.getState().getUserProfile(comment.user_id);
          }
          
          return {
            ...comment,
            profile,
            isOwnComment
          };
        })
      );
      
      // Update cache
      set((state) => ({
        comments: enrichedComments,
        noteCommentsCache: {
          ...state.noteCommentsCache,
          [noteId]: enrichedComments
        },
        fullyCachedNotes: new Set([...state.fullyCachedNotes, noteId]),
        isLoading: false
      }));
      
      return enrichedComments;
    } catch (err) {
      console.error("Error fetching comments:", err);
      set({ error: err.message || "Failed to fetch comments", isLoading: false });
      return [];
    }
  },
  
  // Add a new comment
  addComment: async (noteId, content , currentUser ) => {
    set({ isLoading: true, error: null });
    try {
    
      const userId = currentUser?.user_id || null;

      const { data, error } = await supabase
        .from("shared_notes_comments")
        .insert({
          note_id: noteId,
          user_id: userId,
          content
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Prepare the comment with user profile
      const newComment = {
        ...data,
        profile: userId ? currentUser : null,
        isOwnComment: !!userId
      };
      
      // Update the local state and cache
      set((state) => {
        const updatedComments = [newComment, ...(state.noteCommentsCache[noteId] || [])];
        
        return {
          comments: updatedComments,
          noteCommentsCache: {
            ...state.noteCommentsCache,
            [noteId]: updatedComments
          },
          isLoading: false
        };
      });
      
      return newComment;
    } catch (err) {
      console.error("Error adding comment:", err);
      set({ error: err.message || "Failed to add comment", isLoading: false });
      return null;
    }
  },
  
  // Delete a comment (only allow users to delete their own comments)
  deleteComment: async (commentId, noteId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from("shared_notes_comments")
        .delete()
        .eq("id", commentId);
      
      if (error) throw error;
      
      // Update the local state and cache
      set((state) => {
        const updatedComments = (state.noteCommentsCache[noteId] || [])
          .filter(comment => comment.id !== commentId);
        
        return {
          comments: updatedComments,
          noteCommentsCache: {
            ...state.noteCommentsCache,
            [noteId]: updatedComments
          },
          isLoading: false
        };
      });
      
      return true;
    } catch (err) {
      console.error("Error deleting comment:", err);
      set({ error: err.message || "Failed to delete comment", isLoading: false });
      return false;
    }
  },
  
  // Listen for real-time comment updates for a specific note
  subscribeToComments: (noteId) => {
    const channel = supabase
      .channel(`public:shared_note_comments:note_id=eq.${noteId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_note_comments', filter: `note_id=eq.${noteId}` },
        (payload) => {
          // Ideally, refetch or directly mutate Zustand state
          if (payload.eventType === 'INSERT') {
            set((state) => ({
              comments: [...state.comments, payload.new],
            }));
          } else if (payload.eventType === 'DELETE') {
            set((state) => ({
              comments: state.comments.filter((c) => c.id !== payload.old.id),
            }));
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  // Handle new comment from real-time subscription
  handleNewComment: async (comment, noteId) => {
    // Don't add if it's already in our list (to prevent doubles when we add our own comments)
    const existingComments = get().noteCommentsCache[noteId] || [];
    if (existingComments.some(c => c.id === comment.id)) {
      return;
    }
    
    const currentUser = useUserStore.getState().profile;
    const isOwnComment = currentUser && comment.user_id === currentUser.user_id;
    
    // Fetch user profile
    let profile = null;
    if (comment.user_id) {
      profile = await useUserStore.getState().getUserProfile(comment.user_id);
    }
    
    const enrichedComment = {
      ...comment,
      profile,
      isOwnComment
    };
    
    // Add to state
    set((state) => {
      const updatedComments = [enrichedComment, ...(state.noteCommentsCache[noteId] || [])];
      
      return {
        comments: noteId === get().currentNoteId ? updatedComments : state.comments,
        noteCommentsCache: {
          ...state.noteCommentsCache,
          [noteId]: updatedComments
        }
      };
    });
  },
  
  // Handle deleted comment from real-time subscription
  handleDeletedComment: (commentId, noteId) => {
    set((state) => {
      const updatedComments = (state.noteCommentsCache[noteId] || [])
        .filter(comment => comment.id !== commentId);
      
      return {
        comments: noteId === get().currentNoteId ? updatedComments : state.comments,
        noteCommentsCache: {
          ...state.noteCommentsCache,
          [noteId]: updatedComments
        }
      };
    });
  },
  
  // Track currently viewed note
  currentNoteId: null,
  setCurrentNoteId: (noteId) => set({ currentNoteId: noteId }),
  
  // Clear cache for testing or memory management
  clearCache: () => set({
    noteCommentsCache: {},
    fullyCachedNotes: new Set()
  })
}));