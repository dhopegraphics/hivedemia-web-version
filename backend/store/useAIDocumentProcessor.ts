// hooks/useAIDocumentProcessor.ts
import { supabase } from "@/backend/supabase";
import { create } from "zustand";
import { useAIDocumentLocalStore } from "./useAIDocumentLocalStore";
// Types
export type SupportedFileType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "png"
  | "jpg"
  | "jpeg"
  | "gif";
export type AIAction =
  | "extract_topics"
  | "analyze_document"
  | "generate_quiz"
  | "summarize";
export type ProcessingStatus = "idle" | "processing" | "success" | "error";

export interface DocumentItem {
  id: number | string;
  url: string;
  unprocessedUrl: string;
  name: string;
  type: SupportedFileType;
  courseId: string;
  size?: string;
  date?: string;
  is_private?: boolean;
}

export interface ProcessDocumentRequest {
  fileId: string | number;
  fileUrl: string;
  fileName: string;
  fileType: SupportedFileType;
  courseId: string;
  action: AIAction;
  customMessage?: string;
}

export interface AIResponse {
  success: boolean;
  data?: {
    topics?: string[];
    summary?: string;
    topicsCount?: number;
    content?: string;
    action?: string;
  };
  error?: string;
  message?: string;
}

export interface TopicExtractionResult {
  topics: string[];
  summary?: string;
  topicsCount: number;
}

interface DocumentProcessingState {
  // Status tracking
  statusByFile: Record<string, ProcessingStatus>;
  errorByFile: Record<string, string | null>;
  resultsByFile: Record<string, any>;

  // Specific results
  extractedTopicsByFile: Record<string, TopicExtractionResult>;

  // Actions
  processDocument: (
    item: DocumentItem,
    action: AIAction,
    customMessage?: string
  ) => Promise<AIResponse>;
  extractTopics: (item: DocumentItem) => Promise<AIResponse>;
  analyzeDocument: (
    item: DocumentItem,
    customMessage?: string
  ) => Promise<AIResponse>;
  generateQuiz: (item: DocumentItem) => Promise<AIResponse>;
  summarizeDocument: (item: DocumentItem) => Promise<AIResponse>;

  // Utility actions
  clearFileStatus: (fileId: string | number) => void;
  clearAllStatuses: () => void;
  getFileStatus: (fileId: string | number) => ProcessingStatus;
  getFileError: (fileId: string | number) => string | null;
  getFileResult: (fileId: string | number) => any;
}

export async function hasExtractedTopics(coursefile_id: string | number) {
  const { data, error } = await supabase
    .from("extracted_topics")
    .select("topics")
    .eq("coursefile_id", coursefile_id)
    .maybeSingle();
  return !!(data && data.topics && data.topics.length > 0);
}

export async function getFilesNeedingTopicExtraction(
  files: DocumentItem[],
  getFileStatus: (id: string | number) => ProcessingStatus,
  processedFiles: Set<string>
): Promise<DocumentItem[]> {
  const unprocessedFiles: DocumentItem[] = [];
  for (const file of files) {
    const fileKey = String(file.id);
    const status = getFileStatus(file.id);
    if (!processedFiles.has(fileKey) && status === "idle") {
      const alreadyExtracted = await hasExtractedTopics(file.id);
      if (!alreadyExtracted) {
        unprocessedFiles.push(file);
      }
    }
  }
  return unprocessedFiles;
}

// Main hook for document processing
export const useAIDocumentProcessor = create<DocumentProcessingState>(
  (set, get) => ({
    statusByFile: {},
    errorByFile: {},
    resultsByFile: {},
    extractedTopicsByFile: {},

    processDocument: async (
      item,
      action,
      customMessage
    ): Promise<AIResponse> => {
      const fileKey = String(item.id);

      // Set processing status
      set((state) => ({
        statusByFile: { ...state.statusByFile, [fileKey]: "processing" },
        errorByFile: { ...state.errorByFile, [fileKey]: null },
      }));

      let retries = 3;
      let lastError: any;

      while (retries > 0) {
        try {
          const requestBody: ProcessDocumentRequest = {
            fileId: item.id,
            fileUrl: item.unprocessedUrl,
            fileName: item.name,
            fileType: item.type,
            courseId: item.courseId,
            action,
            customMessage,
          };

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("Authentication required");
          }

          const { data, error } = await supabase.functions.invoke(
            "ai-document-processor",
            {
              body: requestBody,
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (error) throw error;

          const response: AIResponse = data;
          console.log("Response from AI function:", response);

          if (response.success) {
            // Update state with success
            set((state) => ({
              statusByFile: { ...state.statusByFile, [fileKey]: "success" },
              resultsByFile: {
                ...state.resultsByFile,
                [fileKey]: response.data,
              },
              ...(action === "extract_topics" &&
                response.data?.topics && {
                  extractedTopicsByFile: {
                    ...state.extractedTopicsByFile,
                    [fileKey]: {
                      topics: response.data.topics,
                      summary: response.data.summary,
                      topicsCount:
                        response.data.topicsCount ||
                        response.data.topics.length,
                    },
                  },
                }),
            }));

            const localStore = useAIDocumentLocalStore.getState();
            if (action === "analyze_document") {
              await localStore.saveAnalysis(
                item.id.toString(),
                item.courseId,
                response.data
              );
            } else if (action === "generate_quiz") {
              await localStore.saveQuiz(
                item.id.toString(),
                item.courseId,
                response.data
              );
            } else if (action === "summarize") {
              await localStore.saveSummary(
                item.id.toString(),
                item.courseId,
                response.data
              );
            }

            return response;
          } else {
            throw new Error(response.error || "Processing failed");
          }
        } catch (error: any) {
          lastError = error;
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          const errorMessage = error?.message || "Unknown error occurred";
          set((state) => ({
            statusByFile: { ...state.statusByFile, [fileKey]: "error" },
            errorByFile: { ...state.errorByFile, [fileKey]: errorMessage },
          }));
          return { success: false, error: errorMessage };
        }
      }
      // If for some reason the loop exits without returning, always return a valid AIResponse
      return {
        success: false,
        error: lastError?.message || "Unknown error occurred",
      };
    },

    extractTopics: async (item) => {
      return get().processDocument(item, "extract_topics");
    },

    analyzeDocument: async (item, customMessage) => {
      return get().processDocument(item, "analyze_document", customMessage);
    },

    generateQuiz: async (item) => {
      return get().processDocument(item, "generate_quiz");
    },

    summarizeDocument: async (item) => {
      return get().processDocument(item, "summarize");
    },

    // Utility functions
    clearFileStatus: (fileId) => {
      const fileKey = String(fileId);
      set((state) => {
        const newStatusByFile = { ...state.statusByFile };
        const newErrorByFile = { ...state.errorByFile };
        const newResultsByFile = { ...state.resultsByFile };
        const newExtractedTopicsByFile = { ...state.extractedTopicsByFile };

        delete newStatusByFile[fileKey];
        delete newErrorByFile[fileKey];
        delete newResultsByFile[fileKey];
        delete newExtractedTopicsByFile[fileKey];

        return {
          statusByFile: newStatusByFile,
          errorByFile: newErrorByFile,
          resultsByFile: newResultsByFile,
          extractedTopicsByFile: newExtractedTopicsByFile,
        };
      });
    },

    clearAllStatuses: () => {
      set({
        statusByFile: {},
        errorByFile: {},
        resultsByFile: {},
        extractedTopicsByFile: {},
      });
    },

    getFileStatus: (fileId) => {
      return get().statusByFile[String(fileId)] || "idle";
    },

    getFileError: (fileId) => {
      return get().errorByFile[String(fileId)] || null;
    },

    getFileResult: (fileId) => {
      return get().resultsByFile[String(fileId)] || null;
    },
  })
);

// Hook for topic extraction specifically (backward compatible)
export const useTopicExtraction = () => {
  const { statusByFile, errorByFile, extractedTopicsByFile, extractTopics } =
    useAIDocumentProcessor();

  return {
    statusByFile,
    errorByFile,
    extractedTopicsByFile,
    extractTopics,
  };
};

// Utility hook for batch processing
export const useBatchDocumentProcessor = () => {
  const { processDocument } = useAIDocumentProcessor();

  const processBatch = async (
    items: DocumentItem[],
    action: AIAction,
    customMessage?: string,
    onProgress?: (
      completed: number,
      total: number,
      currentItem: DocumentItem
    ) => void
  ): Promise<{
    successful: AIResponse[];
    failed: { item: DocumentItem; error: string }[];
  }> => {
    const successful: AIResponse[] = [];
    const failed: { item: DocumentItem; error: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        onProgress?.(i, items.length, item);

        const result = await processDocument(item, action, customMessage);

        if (result.success) {
          successful.push(result);
        } else {
          failed.push({ item, error: result.error || "Unknown error" });
        }
      } catch (error: any) {
        failed.push({ item, error: error.message || "Processing failed" });
      }

      // Add small delay between requests to avoid overwhelming the API
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    onProgress?.(items.length, items.length, items[items.length - 1]);

    return { successful, failed };
  };

  return { processBatch };
};
