import { useQuizStore } from "@/backend/store/useQuizStore";
import { ParsedQuizQuestion } from "./aiResponseUtils";

export interface QuizCreationData {
  userId: string;
  prompt: string;
  feedbackMode: string;
  questionCount: number;
  difficulty: string;
  questionTypes: string;
}

export interface QuizCreationResult {
  quizId: string;
  success: boolean;
  error?: string;
}

/**
 * Creates a quiz and saves questions to the database
 */
export const createQuizInDatabase = async (
  quizData: QuizCreationData,
  questions: ParsedQuizQuestion[]
): Promise<QuizCreationResult> => {
  try {
    const quizStore = useQuizStore.getState();

    // Create quiz in database
    const quizId = await quizStore.createQuiz(quizData);

    // Transform questions to match database format
    const transformedQuestions = questions.map((q) => ({
      type: q.type,
      question: q.question,
      options: JSON.stringify(q.options || []), // Convert array to JSON string
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));

    // Save questions
    await quizStore.saveQuizQuestions(quizId, transformedQuestions);

    return {
      quizId,
      success: true,
    };
  } catch (error) {
    console.error("Error creating quiz in database:", error);
    return {
      quizId: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Generates quiz prompt based on selected files and custom text
 */
export const generateQuizPrompt = (
  selectedFiles: any[],
  selectedLecturerFiles: any[],
  customPrompt: string
): string => {
  if (selectedFiles.length > 0 || selectedLecturerFiles.length > 0) {
    return `File-based quiz: ${selectedFiles
      .concat(selectedLecturerFiles)
      .map((f) => f.name)
      .join(", ")}`;
  }
  return customPrompt;
};

/**
 * Generates missing options for MCQ questions that don't have them
 */
export const generateMissingOptions = (
  question: ParsedQuizQuestion
): string[] => {
  if (question.type !== "mcq") return [];

  // Create plausible distractors based on the correct answer and question content
  const correctAnswer = question.correctAnswer;
  const questionText = question.question.toLowerCase();

  // Generic distractors for different types of questions
  const distractors: string[] = [];

  // Add the correct answer first
  distractors.push(correctAnswer);

  // Generate contextual distractors based on question type
  if (questionText.includes("algorithm") || questionText.includes("method")) {
    distractors.push(
      "This approach is never used in practice",
      "It is only applicable to 2D problems",
      "The method requires exponential time complexity"
    );
  } else if (
    questionText.includes("transformation") ||
    questionText.includes("matrix")
  ) {
    distractors.push(
      "It only works for uniform scaling",
      "The operation is not reversible",
      "It requires homogeneous coordinates for all operations"
    );
  } else if (
    questionText.includes("clipping") ||
    questionText.includes("window")
  ) {
    distractors.push(
      "The line is partially inside the window",
      "Both endpoints need to be recalculated",
      "The algorithm only works for rectangular windows"
    );
  } else if (
    questionText.includes("buffer") ||
    questionText.includes("depth")
  ) {
    distractors.push(
      "The pixel is drawn with transparency",
      "Both buffers are updated with interpolated values",
      "A new depth comparison is triggered"
    );
  } else if (
    questionText.includes("polygon") ||
    questionText.includes("fill")
  ) {
    distractors.push(
      "Boundary fill with flood fill algorithm",
      "Simple edge-based filling only",
      "Texture mapping with polygon subdivision"
    );
  } else {
    // Generic distractors
    distractors.push(
      "This is not the correct approach",
      "The opposite effect occurs",
      "This method is deprecated"
    );
  }

  // Ensure we have exactly 4 unique options
  const uniqueDistractors = [...new Set(distractors)];
  while (uniqueDistractors.length < 4) {
    uniqueDistractors.push(`Alternative option ${uniqueDistractors.length}`);
  }

  // Shuffle the options so correct answer isn't always first
  return uniqueDistractors.slice(0, 4).sort(() => Math.random() - 0.5);
};

/**
 * Fixes MCQ questions that have missing or empty options arrays
 */
export const fixMissingQuestionOptions = (
  questions: ParsedQuizQuestion[]
): ParsedQuizQuestion[] => {
  return questions.map((question) => {
    if (
      question.type === "mcq" &&
      (!question.options || question.options.length === 0)
    ) {
      return {
        ...question,
        options: generateMissingOptions(question),
      };
    }
    return question;
  });
};

/**
 * Validates quiz input parameters
 */
export const validateQuizInput = (
  selectedFiles: any[],
  selectedLecturerFiles: any[],
  customPrompt: string
): { isValid: boolean; error?: string } => {
  if (
    !selectedFiles.length &&
    !selectedLecturerFiles.length &&
    !customPrompt.trim()
  ) {
    return {
      isValid: false,
      error: "Please select files or enter a custom topic to generate a quiz",
    };
  }

  return { isValid: true };
};
