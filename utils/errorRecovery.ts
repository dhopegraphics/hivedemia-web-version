// Error Recovery Utilities for Snap-and-Solve System
import { router } from "expo-router";

export const ErrorRecovery = {
  // Safely parse JSON strings
  safeJsonParse: (jsonString: string, fallback: any = null) => {
    if (!jsonString || typeof jsonString !== "string") return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn("JSON parsing failed:", error);
      return fallback;
    }
  },

  // Validate solution object structure
  validateSolution: (solution: any) => {
    if (!solution || typeof solution !== "object") {
      return false;
    }

    // For accounting solutions, the structure is different
    if (solution.solutionFormat === "accounting") {
      // Required fields for accounting solutions
      const requiredAccountingFields = ["accountingType", "question"];
      const hasRequiredFields = requiredAccountingFields.some(
        (field) => solution[field] && typeof solution[field] === "string"
      );

      // Must have either finalAnswer/explanation OR accounting-specific content
      const hasAccountingContent =
        solution.financialStatements ||
        solution.ledgerAccounts ||
        solution.journalEntries ||
        solution.solution;

      const hasBasicFields =
        (solution.finalAnswer && typeof solution.finalAnswer === "string") ||
        (solution.explanation && typeof solution.explanation === "string");

      return hasRequiredFields && (hasAccountingContent || hasBasicFields);
    }

    // For other solution types, check basic required fields
    const requiredFields = ["finalAnswer", "explanation"];
    return requiredFields.every(
      (field) => solution[field] && typeof solution[field] === "string"
    );
  },

  // Create fallback solution when parsing fails
  createFallbackSolution: (
    rawResponse: string,
    questionType: string = "general"
  ) => {
    // Check if this might be an accounting question
    const isAccountingQuestion =
      questionType.toLowerCase().includes("accounting") ||
      questionType.toLowerCase().includes("finance") ||
      questionType.toLowerCase().includes("business") ||
      rawResponse.toLowerCase().includes("balance sheet") ||
      rawResponse.toLowerCase().includes("income statement") ||
      rawResponse.toLowerCase().includes("journal") ||
      rawResponse.toLowerCase().includes("partnership") ||
      rawResponse.toLowerCase().includes("depreciation") ||
      rawResponse.toLowerCase().includes("financial statements");

    // Try to extract useful information from the raw response
    let extractedQuestion = "";
    let extractedAccountingType = "general-accounting";
    let extractedFinalAnswer = "Unable to parse AI response properly";
    let extractedExplanation = `Raw AI Response:\n\n${rawResponse.substring(
      0,
      1000
    )}${rawResponse.length > 1000 ? "..." : ""}`;

    // Attempt to extract specific parts if JSON structure is partially visible
    try {
      // Look for question text
      const questionMatch = rawResponse.match(/"question":\s*"([^"]+)"/);
      if (questionMatch) {
        extractedQuestion = questionMatch[1];
      }

      // Look for accounting type
      const accountingTypeMatch = rawResponse.match(
        /"accountingType":\s*"([^"]+)"/
      );
      if (accountingTypeMatch) {
        extractedAccountingType = accountingTypeMatch[1];
      }

      // Look for final answer
      const finalAnswerMatch = rawResponse.match(/"finalAnswer":\s*"([^"]+)"/);
      if (finalAnswerMatch) {
        extractedFinalAnswer = finalAnswerMatch[1];
      }

      // Look for explanation
      const explanationMatch = rawResponse.match(/"explanation":\s*"([^"]+)"/);
      if (explanationMatch) {
        extractedExplanation = explanationMatch[1];
      }

      // Try to extract financial statements structure
      const financialStatementsMatch = rawResponse.match(
        /"financialStatements":\s*\[([\s\S]*?)\]/
      );
      if (financialStatementsMatch && isAccountingQuestion) {
        extractedFinalAnswer =
          "Financial statements and accounting solution prepared";
        extractedExplanation =
          "The AI provided a detailed accounting solution with financial statements, but the response was truncated. Please try asking for a more focused solution or break down the question into smaller parts.";
      }

      // Try to extract journal entries
      const journalEntriesMatch = rawResponse.match(
        /"journalEntries":\s*\[([\s\S]*?)\]/
      );
      if (journalEntriesMatch && isAccountingQuestion) {
        extractedFinalAnswer =
          "Journal entries prepared for the accounting transactions";
        extractedExplanation =
          "The AI prepared journal entries for the accounting problem, but the response was truncated. The partial solution shows proper accounting treatment.";
      }
    } catch (extractError) {
      console.warn(
        "Failed to extract information from raw response:",
        extractError
      );
    }

    return {
      id: Date.now().toString(),
      solutionFormat: isAccountingQuestion ? "accounting" : "direct-answer",
      questionType,
      subject: "",
      steps: [],
      finalAnswer: extractedFinalAnswer,
      explanation: extractedExplanation,
      is_bookmarked: 0,
      // Add accounting-specific fields if it's an accounting question
      ...(isAccountingQuestion && {
        accountingType: extractedAccountingType,
        question:
          extractedQuestion ||
          "Accounting question - could not be parsed properly",
        financialStatements: [],
        ledgerAccounts: [],
        journalEntries: [],
      }),
    };
  },

  // Migrate legacy solutions to enhanced format
  migrateLegacySolution: (legacySolution: any) => {
    return {
      ...legacySolution,
      solutionFormat: legacySolution.solutionFormat || "step-by-step",
      questionType: legacySolution.questionType || "general",
      subject: legacySolution.subject || "",
      tables: undefined,
      codeBlocks: undefined,
      comparisons: undefined,
    };
  },

  // Database error recovery
  handleDatabaseError: async (
    operation: () => Promise<any>,
    retries: number = 3
  ) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(
          `Database operation failed (attempt ${attempt}/${retries}):`,
          error
        );

        if (attempt === retries) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          throw new Error(
            `Database operation failed after ${retries} attempts: ${errorMessage}`
          );
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100)
        );
      }
    }
  },

  // Network/AI request error recovery
  handleAIRequestError: (error: any, questionType: string) => {
    let fallbackMessage =
      "AI service temporarily unavailable. Please try again later.";

    if (error.message?.includes("timeout")) {
      fallbackMessage =
        "Request timed out. The AI is taking longer than expected to respond.";
    } else if (error.message?.includes("network")) {
      fallbackMessage =
        "Network connection issue. Please check your internet connection.";
    } else if (
      error.message?.includes("quota") ||
      error.message?.includes("limit")
    ) {
      fallbackMessage = "AI service quota exceeded. Please try again later.";
    }

    return {
      id: Date.now().toString(),
      solutionFormat: "direct-answer",
      questionType,
      subject: "",
      steps: [],
      finalAnswer: "Service Error",
      explanation: fallbackMessage,
      is_bookmarked: 0,
    };
  },

  // Image processing error recovery
  handleImageError: (error: any) => {
    console.error("Image processing error:", error);

    if (error.message?.includes("permission")) {
      return "Camera or gallery permission denied. Please enable permissions in settings.";
    } else if (error.message?.includes("cancelled")) {
      return "Image selection was cancelled.";
    } else if (
      error.message?.includes("size") ||
      error.message?.includes("large")
    ) {
      return "Image file is too large. Please select a smaller image.";
    }

    return "Failed to process image. Please try again with a different image.";
  },

  // Handle authentication errors and redirect to sign-in
  handleAuthError: (error: any) => {
    const errorMessage = error?.message || "";

    // Check for various authentication error patterns
    const isAuthError =
      errorMessage.includes("Auth session missing") ||
      errorMessage.includes("No user found") ||
      errorMessage.includes("JWT expired") ||
      errorMessage.includes("Invalid JWT") ||
      errorMessage.includes("Authentication required") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("Invalid token") ||
      errorMessage.includes("Session expired");

    if (isAuthError) {
      try {
        router.replace("/(auth)");
      } catch (routerError) {
        console.error("Router error during auth redirect:", routerError);
      }
      return true; // Indicates auth error was handled
    }

    return false; // Not an auth error
  },

  // Check if an error is authentication-related
  isAuthenticationError: (error: any) => {
    const errorMessage = error?.message || "";
    return (
      errorMessage.includes("Auth session missing") ||
      errorMessage.includes("No user found") ||
      errorMessage.includes("JWT expired") ||
      errorMessage.includes("Invalid JWT") ||
      errorMessage.includes("Authentication required") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("Invalid token") ||
      errorMessage.includes("Session expired")
    );
  },
};
