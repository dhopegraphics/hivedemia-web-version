/**
 * User-friendly error handling and guidance utilities for AI API issues
 */

export interface AIErrorGuidance {
  title: string;
  message: string;
  suggestions: string[];
  shouldRetry: boolean;
  retryDelay?: number;
}

/**
 * Provides user-friendly guidance for AI API errors
 */
export const getAIErrorGuidance = (error: any): AIErrorGuidance => {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  const errorCode = error?.status || error?.code;

  // Rate limit errors
  if (
    errorCode === 429 ||
    errorMessage.includes("rate_limit_error") ||
    errorMessage.includes("429")
  ) {
    return {
      title: "AI Service Temporarily Busy",
      message:
        "The AI service is currently handling many requests. This is normal during peak usage.",
      suggestions: [
        "Wait 1-2 minutes and try again",
        "For large PDFs, try breaking them into smaller sections",
        "Consider using text-based prompts instead of file uploads",
        "Try during off-peak hours for faster processing",
      ],
      shouldRetry: true,
      retryDelay: 60000, // 1 minute
    };
  }

  // File processing errors
  if (
    errorMessage.includes("Failed to prepare file") ||
    errorMessage.includes("file")
  ) {
    return {
      title: "File Processing Error",
      message: "There was an issue processing your uploaded file.",
      suggestions: [
        "Check that your file is a valid PDF",
        "Try reducing the file size (under 10MB works best)",
        "Ensure the file contains readable text (not just images)",
        "Try re-uploading the file",
      ],
      shouldRetry: true,
      retryDelay: 5000, // 5 seconds
    };
  }

  // Network errors
  if (
    errorCode >= 500 ||
    errorMessage.includes("network") ||
    errorMessage.includes("timeout")
  ) {
    return {
      title: "Connection Issue",
      message: "There was a temporary connection problem with the AI service.",
      suggestions: [
        "Check your internet connection",
        "Try again in a few moments",
        "If the problem persists, try switching networks",
      ],
      shouldRetry: true,
      retryDelay: 10000, // 10 seconds
    };
  }

  // Authentication errors
  if (errorCode === 401 || errorCode === 403) {
    return {
      title: "Access Issue",
      message: "There was an authentication problem with the AI service.",
      suggestions: [
        "Try logging out and logging back in",
        "Check your subscription status",
        "Contact support if the issue continues",
      ],
      shouldRetry: false,
    };
  }

  // Generic errors
  return {
    title: "AI Generation Error",
    message: "An unexpected error occurred during quiz generation.",
    suggestions: [
      "Try simplifying your request",
      "Check your internet connection",
      "Try again in a few minutes",
      "Contact support if the problem persists",
    ],
    shouldRetry: true,
    retryDelay: 5000, // 5 seconds
  };
};

/**
 * Formats error guidance into a user-friendly message
 */
export const formatErrorGuidance = (guidance: AIErrorGuidance): string => {
  let message = `${guidance.title}\n\n${guidance.message}\n\n`;

  if (guidance.suggestions.length > 0) {
    message += "Here's what you can try:\n";
    guidance.suggestions.forEach((suggestion, index) => {
      message += `${index + 1}. ${suggestion}\n`;
    });
  }

  if (guidance.shouldRetry && guidance.retryDelay) {
    const delaySeconds = Math.ceil(guidance.retryDelay / 1000);
    message += `\nThis usually resolves itself in about ${delaySeconds} seconds.`;
  }

  return message.trim();
};

/**
 * Creates a progress message that explains what's happening during delays
 */
export const createRateLimitProgressMessage = (
  attempt: number,
  maxAttempts: number
): string => {
  if (attempt === 1) {
    return "AI service is busy, waiting for optimal processing time...";
  } else if (attempt === 2) {
    return "Still waiting for AI service - this helps ensure better quality responses...";
  } else if (attempt === maxAttempts) {
    return "Making final attempt with backup AI service...";
  } else {
    return `Retrying with AI service (attempt ${attempt}/${maxAttempts})...`;
  }
};

/**
 * Estimates processing time based on content
 */
export const estimateProcessingTime = (
  fileCount: number,
  hasLargeFiles: boolean,
  questionCount: number
): { min: number; max: number; message: string } => {
  let baseTime = 5; // Base 5 seconds for simple text

  // Add time for files
  if (fileCount > 0) {
    baseTime += fileCount * (hasLargeFiles ? 15 : 8);
  }

  // Add time for more questions
  if (questionCount > 10) {
    baseTime += Math.ceil((questionCount - 10) / 5) * 3;
  }

  const minTime = Math.max(baseTime - 5, 3);
  const maxTime = baseTime + 10;

  let message = `Estimated processing time: ${minTime}-${maxTime} seconds`;

  if (fileCount > 0) {
    message += "\n• File processing may take longer during peak hours";
  }

  if (questionCount > 15) {
    message += "\n• Larger quizzes require more processing time";
  }

  return { min: minTime, max: maxTime, message };
};
