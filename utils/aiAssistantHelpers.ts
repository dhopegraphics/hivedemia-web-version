// utils/aiAssistantHelpers.ts

import { useAIAssistantStore } from "@/backend/store/aiAssistantStore";

export interface CourseContext {
  id: string;
  title?: string;
  code?: string;
  professor?: string;
  description?: string;
}

export interface DocumentContext {
  id: string;
  name?: string;
}

/**
 * Show AI Assistant with course context
 */
export const showAIAssistantWithCourse = (
  courseContext: CourseContext,
  initialMessage?: string,
  currentFiles?: any[]
) => {
  const store = useAIAssistantStore.getState();

  store.showAssistant({
    context:
      initialMessage ||
      `Hi! I'm here to help you with ${
        courseContext.title || "your course"
      }. What would you like to know?`,
    courseContext,
    documentContext: null,
    currentFiles,
  });
};

/**
 * Show AI Assistant with document context
 */
export const showAIAssistantWithDocument = (
  documentContext: DocumentContext,
  courseContext?: CourseContext,
  initialMessage?: string,
  currentFiles?: any[]
) => {
  const store = useAIAssistantStore.getState();

  store.showAssistant({
    context:
      initialMessage ||
      `Hi! I can help you understand ${
        documentContext.name || "this document"
      }. What questions do you have?`,
    courseContext,
    documentContext,
    currentFiles,
  });
};

/**
 * Show AI Assistant with general context
 */
export const showAIAssistantGeneral = (
  initialMessage?: string,
  currentFiles?: any[]
) => {
  const store = useAIAssistantStore.getState();

  store.showAssistant({
    context:
      initialMessage ||
      "Hi! I'm Smart Hive AI. How can I help you with your studies today?",
    courseContext: null,
    documentContext: null,
    currentFiles,
  });
};

/**
 * Get current course topics for AI context
 */
export const getCourseTopicsForAI = async (
  courseId: string
): Promise<string[]> => {
  try {
    const { useAIDocumentLocalStore } = await import(
      "@/backend/store/useAIDocumentLocalStore"
    );
    const store = useAIDocumentLocalStore.getState();

    // Get all processed files for the course
    const processedFiles = await store.getProcessedFilesFromLocal();
    const courseFiles = processedFiles.filter(
      (file) => file.course_id === courseId
    );

    const allTopics: string[] = [];

    // Collect all topics from course files
    for (const file of courseFiles) {
      try {
        const extractedTopics = await store.getExtractedTopicsByFile(
          file.coursefile_id
        );
        if (extractedTopics?.topics) {
          allTopics.push(...extractedTopics.topics);
        }
      } catch (error) {
        console.error(
          `Error getting topics for file ${file.coursefile_id}:`,
          error
        );
      }
    }

    // Remove duplicates and return
    return [...new Set(allTopics)];
  } catch (error) {
    console.error("Error getting course topics:", error);
    return [];
  }
};
