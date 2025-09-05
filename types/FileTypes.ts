// types/FileTypes.ts
import {
  DocumentItem,
  AIAction as ImportedAIAction,
  ProcessingStatus,
} from "@/backend/store/useAIDocumentProcessor";

export interface FilesUploadPlusPreviewProps {
  colors: any;
  isDark: boolean;
  files: DocumentItem[];
  onDelete?: (fileId: string | number, filePath: string) => void;
  courseId: string;
  enableAutoTopicExtraction?: boolean;
  showAIActions?: boolean;
}

export interface AIActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: ImportedAIAction, customMessage?: string) => void;
  fileName: string;
  aiActionsStatus?: Record<string, ProcessingStatus>;
  isDark: boolean;
  colors: any;
  hasUnlimitedAccess?: boolean;
}

export interface FileItemProps {
  item: DocumentItem;
  colors: any;
  isDark: boolean;
  onPress: (item: DocumentItem) => void;
  onDelete: (item: DocumentItem) => void;
  onAIAction: (item: DocumentItem) => void;
  showAIActions: boolean;
  getFileStatus: (id: string | number) => ProcessingStatus;
  getFileError: (id: string | number) => string | null;
  extractedTopicsByFile: Record<string, any>;
  clearFileStatus: (id: string | number) => void;
  hasUnlimitedAccess: boolean;
  hasActiveSubscription?: boolean; // Optional prop to check if user has an active subscription
}

export interface LocalAIAction {
  key: ImportedAIAction;
  label: string;
  description: string;
  icon: string;
}

export {
  AIAction as AIActionType,
  DocumentItem,
  ProcessingStatus,
} from "@/backend/store/useAIDocumentProcessor";
