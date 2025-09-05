// utils/fileUtils.ts
import {
  AIAction as AIActionType,
  ProcessingStatus,
} from "@/backend/store/useAIDocumentProcessor";

export const getFileIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    pdf: "file-pdf-box",
    doc: "file-word",
    docx: "file-word",
    ppt: "file-powerpoint",
    pptx: "file-powerpoint",
    xlsx: "file-excel",
    xls: "file-excel",
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
  };
  return iconMap[type.toLowerCase()] || "file";
};

export const getStatusColor = (
  status: ProcessingStatus,
  colors: any,
  isDark: boolean
): string => {
  switch (status) {
    case "processing":
      return colors.primary;
    case "success":
      return "#10B981"; // Green
    case "error":
      return "#EF4444"; // Red
    default:
      return isDark ? `${colors.offwhite}40` : `${colors.dark}40`;
  }
};

export const getStatusIcon = (status: ProcessingStatus): string => {
  switch (status) {
    case "processing":
      return "sync";
    case "success":
      return "checkmark-circle";
    case "error":
      return "alert-circle";
    default:
      return "ellipse";
  }
};

export const AI_ACTIONS: {
  key: AIActionType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "extract_topics",
    label: "Extract Topics",
    description: "Extract key topics and concepts from the document",
    icon: "list-outline",
  },
  {
    key: "analyze_document",
    label: "Analyze Document",
    description: "Get comprehensive analysis and insights",
    icon: "analytics-outline",
  },
  {
    key: "generate_quiz",
    label: "Generate Quiz",
    description: "Create quiz questions based on content",
    icon: "help-circle-outline",
  },
  {
    key: "summarize",
    label: "Summarize",
    description: "Get a concise summary of the document",
    icon: "document-text-outline",
  },
];
