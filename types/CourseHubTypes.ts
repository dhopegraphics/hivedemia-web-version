// types/CourseHubTypes.ts

import { Colors } from "@/constants/Colors";

// Base processed file interface matching the data structure from useAIDocumentLocalStore
export interface ProcessedFile {
  id: string | number;
  coursefile_id: string;
  fileName: string;
  fileType?: string;
  fileSize?: string | number;
  date: string;
  hasAnalysis: boolean;
  hasQuiz: boolean;
  hasSummary: boolean;
  created_at: string;
  isLocalQuiz?: boolean;
  quizId?: string;
}

// Props for InHistoryPreview component
export interface InHistoryPreviewProps {
  courseId?: string | string[] | null;
  isDark?: boolean;
  colors?: Colors;
}

// Props for file detail view navigation
export interface FileDetailsParams {
  fileId: string | number;
  fileName: string;
  courseId?: string | string[] | null;
  hasAnalysis?: boolean;
  hasQuiz?: boolean;
  hasSummary?: boolean;
}

// File type with extended properties for CourseHub usage
export interface CourseHubFile {
  id: string | number;
  name: string;
  type?: string;
  size?: string | number;
  url?: string;
  filePath?: string;
  unprocessedUrl?: string;
  courseId?: string | string[];
  [key: string]: any; // Allow additional properties
}

// Color type validation for components
export interface ComponentColors extends Colors {
  // Add any additional color properties that might be used
  muted?: string;
}

// Error type for proper error handling
export interface ComponentError {
  message: string;
  code?: string | number;
}

// Subscription-related types for CourseHub
export interface SubscriptionFeatures {
  hasUnlimitedAccess: boolean;
  hasActiveSubscription: boolean;
  fileUploadLimit?: number;
}

// Quiz-related types for InCourseTopicQuizzes
export interface TopicQuizFile extends ProcessedFile {
  isLocalQuiz: boolean;
  quizId?: string;
}

// Course parameters from router
export interface CourseParams {
  id: string | string[];
  courseTitle: string | string[];
  courseCode: string | string[];
  courseProfessor: string | string[];
  courseDescription: string | string[];
  courseColor: string | string[];
  courseIcon: string | string[];
}

// Helper type for handling router params that can be string or string[]
export type RouterParam<T = string> = T | T[];

// Utility type to extract single value from router param
export type SingleParam<T extends RouterParam> = T extends (infer U)[] ? U : T;
