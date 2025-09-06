import {
  ClaudeError,
  analyzeDocument,
  generateQuestionsFromSamples,
  prepareFileSource,
} from "@/AiModelHooks/claude";
import { sendMessageToCohere } from "@/AiModelHooks/cohereApi";
import * as FileSystem from "expo-file-system";
import {
  ChunkingOptions,
  combineChunksForAI,
  estimateTextTokens,
  identifyKeyContent,
  selectOptimalChunks,
} from "./fileChunkingUtils";
import {
  globalRateLimiter,
  isRateLimitError,
  withRetry,
} from "./rateLimitUtils";

export interface FileSource {
  name: string;
  data?: string;
  content?: string;
  uri?: string;
  type?: string;
}

export interface QuizGenerationSettings {
  selectedFiles: FileSource[];
  selectedLecturerFiles: FileSource[];
  questionCount: number;
  questionTypes: { mcq: boolean; trueFalse: boolean; shortAnswer: boolean };
  difficulty: string;
  feedbackMode: string;
  customPrompt: string;
}

export interface ParsedQuizQuestion {
  type: string;
  question: string;
  options: string[]; // Made required instead of optional
  correctAnswer: string;
  explanation: string;
}

/**
 * Extracts JSON content from AI response text
 */
export function extractJsonFromResponse(text: string): string {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return "";
  let jsonStr = match[1].trim();
  jsonStr = jsonStr.replace(/\\(?![\\/"bfnrtu])/g, "\\\\");
  return jsonStr;
}

/**
 * Prepares file sources for Claude API processing with intelligent chunking
 */
export const prepareFileSourcesForAI = async (
  files: FileSource[],
  context: string,
  questionCount: number = 10,
  maxTokens: number = 12000
): Promise<any[]> => {
  return Promise.all(
    files.map(async (file) => {
      try {
        // More robust file data handling
        let fileData = file.data || file.content || file.uri;

        // If it's a URI, we might need to fetch the content
        if (typeof fileData === "string" && fileData.startsWith("file://")) {
          fileData = await FileSystem.readAsStringAsync(fileData, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        // Ensure we have valid data
        if (!fileData) {
          throw new Error(`No valid data found for file: ${file.name}`);
        }

        // Prepare the initial file source
        const preparedSource = await prepareFileSource(fileData, {
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          title: `${context}: ${file.name}`,
          context: context,
        });

        // Extract text content if available for chunking analysis
        // Note: The actual structure depends on the prepareFileSource return type
        const textContent =
          (preparedSource as any).content || (preparedSource as any).text || "";

        // Check if content is large enough to warrant chunking
        const estimatedTokens = estimateTextTokens(textContent);

        if (estimatedTokens > maxTokens && textContent) {
          // Apply intelligent chunking
          const chunks = identifyKeyContent(textContent);
          const chunkingOptions: ChunkingOptions = {
            maxTokens: maxTokens,
            targetQuestionCount: questionCount,
            preserveStructure: true,
          };

          const selectedChunks = selectOptimalChunks(chunks, chunkingOptions);
          const optimizedContent = combineChunksForAI(selectedChunks, context);

          // Return the prepared source with optimized content
          return {
            ...preparedSource,
            content: optimizedContent,
            originalTokenCount: estimatedTokens,
            optimizedTokenCount: estimateTextTokens(optimizedContent),
            chunksUsed: selectedChunks.length,
          };
        }

        return preparedSource;
      } catch (fileError) {
        console.error(`Error preparing file ${file.name}:`, fileError);
        throw new ClaudeError(`Failed to prepare file: ${file.name}`);
      }
    })
  );
};

/**
 * Generates the prompt for file-based quiz generation
 */
export const createFileBasedPrompt = (
  settings: QuizGenerationSettings
): string => {
  const {
    questionCount,
    questionTypes,
    difficulty,
    feedbackMode,
    customPrompt,
  } = settings;

  return `Generate a quiz with these specifications:
- Number of questions: ${questionCount}
- Question types: ${Object.entries(questionTypes)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(", ")}
- Difficulty: ${difficulty}
- Feedback mode: ${feedbackMode}

${customPrompt ? `Additional context: ${customPrompt}\n` : ""}

Please analyze the provided documents and generate questions that:
1. Test understanding of the key concepts from the student materials and let it be most natural way possible of generating questions
dont let the questions be obvious that they are from the student material act like a human and a teacher or lecturer

2. Match the style and difficulty of the lecturer samples (if provided)
3. Include appropriate explanations for each answer
4. Avoid LaTeX or markdown math formatting - use plain text (e.g., "x squared" instead of "x^2")

Format the response as JSON with this structure:
{
  "questions": [
    {
      "type": "mcq" | "trueFalse" | "shortAnswer",
      "question": "question_text",
      "options": ["option1", "option2", "option3", "option4"], // REQUIRED for MCQ - always include 4 options
      "correctAnswer": "correct_answer",
      "explanation": "detailed_explanation"
    }
  ]
}

CRITICAL REQUIREMENTS FOR MCQ OPTIONS:
- EVERY MCQ question MUST have exactly 4 unique, contextually relevant options
- Each question MUST have different options - NO REUSING the same distractors across questions
- Options should be plausible but incorrect alternatives specific to that question's topic
- The correct answer should be randomly positioned among the 4 options (not always first)
- make sure to randomize the correct answer position 
- Make sure it soo hard and challenging that it will test the real understanding of the student
- Make distractors realistic and challenging - they should test real understanding
- Avoid generic options like "None of the above" or "All of the above"

EXAMPLES OF GOOD vs BAD OPTIONS:
BAD (generic, reused): ["Correct answer", "This is not correct", "Opposite effect", "Not applicable"]
GOOD (specific, unique): ["Breadth-first search", "Depth-first search", "Binary search", "Linear search"]`;
};

/**
 * Generates the prompt for text-based quiz generation
 */
export const createTextBasedPrompt = (
  settings: QuizGenerationSettings
): string => {
  const {
    questionCount,
    questionTypes,
    difficulty,
    feedbackMode,
    customPrompt,
  } = settings;

  return `Generate a quiz with these specifications:
- Number of questions: ${questionCount}
- Question types: ${Object.entries(questionTypes)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(", ")}
- Difficulty: ${difficulty}
- Feedback mode: ${feedbackMode}
- Topic: ${customPrompt}

Avoid LaTeX or markdown math formatting. Use plain text where possible (e.g., "x squared" instead of "x^2").

Format the response as JSON with this structure:
{
  "questions": [
    {
      "type": "question_type",
      "question": "question_text",
       "options": ["option1", "option2", "option3", "option4"], // REQUIRED for MCQ - always include 4 options
      "correctAnswer": "correct_answer",
      "explanation": "explanation_text"
    }
  ]
}

CRITICAL REQUIREMENTS FOR MCQ OPTIONS:
- EVERY MCQ question MUST have exactly 4 unique, contextually relevant options
- Each question MUST have different options - NO REUSING the same distractors across questions
- Options should be plausible but incorrect alternatives specific to that question's topic
- The correct answer should be randomly positioned among the 4 options (not always first) 
- Dont ever use the same correct option position consecutively 
- make sure to randomize the correct answer position 
- Make sure it soo hard and challenging that it will test the real understanding of the student
- Make distractors realistic and challenging - they should test real understanding
- Avoid generic options like "None of the above" or "All of the above"

EXAMPLES OF GOOD vs BAD OPTIONS:
BAD (generic, reused): ["Correct answer", "This is not correct", "Opposite effect", "Not applicable"]
GOOD (specific, unique): ["Breadth-first search", "Depth-first search", "Binary search", "Linear search"]`;
};

/**
 * Estimates token count for prepared file sources (more accurate with chunking info)
 */
const estimateTokenCount = (fileSources: any[], prompt: string): number => {
  // Rough estimation: 1 token ≈ 4 characters for text
  const promptTokens = Math.ceil(prompt.length / 4);

  // For files, use optimized token count if available, otherwise use conservative estimate
  const fileTokens = fileSources.reduce((total, source) => {
    if (source.optimizedTokenCount) {
      return total + source.optimizedTokenCount;
    }
    return total + 15000; // Conservative fallback estimate
  }, 0);

  const totalEstimate = promptTokens + fileTokens;

  return totalEstimate;
};

/**
 * Processes files using Claude AI APIs with rate limiting and retry logic
 */
export const processFilesWithClaude = async (
  studentFileSources: any[],
  lecturerFileSources: any[],
  prompt: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  const claudeOptions = {
    model: "claude-sonnet-4-20250514" as const,
    maxTokens: 4026,
  };

  // Estimate token usage for rate limiting
  const allSources = [...studentFileSources, ...lecturerFileSources];
  const estimatedTokens = estimateTokenCount(allSources, prompt);

  onProgress?.(`Preparing request To Generate Quiz...`);

  // Apply rate limiting before making the request
  await globalRateLimiter.waitIfNeeded(estimatedTokens);

  const makeClaudeRequest = async (): Promise<string> => {
    if (studentFileSources.length > 0 && lecturerFileSources.length > 0) {
      onProgress?.("Processing files with lecturer samples...");
      // Use generateQuestionsFromSamples when both student and lecturer files are available
      return await generateQuestionsFromSamples(
        studentFileSources[0], // Primary student file
        lecturerFileSources[0], // Primary lecturer sample
        prompt,
        claudeOptions
      );
    } else if (studentFileSources.length > 0) {
      onProgress?.("Analyzing student materials...");
      // Use analyzeDocument for student files only
      return await analyzeDocument(
        studentFileSources[0],
        prompt,
        claudeOptions
      );
    } else {
      onProgress?.("Processing lecturer samples...");
      // Use analyzeDocument for lecturer files only
      return await analyzeDocument(
        lecturerFileSources[0],
        `Based on these sample questions, create similar questions with the following specifications:
${prompt}`,
        claudeOptions
      );
    }
  };

  // Use retry wrapper with custom error handling
  return await withRetry(makeClaudeRequest, {
    maxRetries: 3,
    baseDelay: 3000, // 3 seconds base delay for file processing
    maxDelay: 60000, // 1 minute max delay
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      onProgress?.(
        `Retrying request (attempt ${attempt + 1}) after rate limit...`
      );
      console.warn(
        `Smart Hive Ai retry attempt ${attempt + 1}:`,
        error.message
      );
    },
    shouldRetry: (error) => {
      // Retry on rate limit errors and other recoverable errors
      return (
        isRateLimitError(error) ||
        (error as any).status >= 500 ||
        (error as any).code === "NETWORK_ERROR"
      );
    },
  });
};

/**
 * Processes text-based prompts using Cohere API with rate limiting
 */
export const processTextWithCohere = async (
  prompt: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  onProgress?.("Generating quiz with Only Custom Prompt...");

  // Cohere generally has less strict rate limits, but still apply some throttling
  await globalRateLimiter.waitIfNeeded(Math.ceil(prompt.length / 4));

  const makeCohereRequest = async (): Promise<string> => {
    return await sendMessageToCohere([{ role: "user", content: prompt }]);
  };

  // Use retry wrapper for Cohere as well
  return await withRetry(makeCohereRequest, {
    maxRetries: 2,
    baseDelay: 1000, // 1 second base delay for text processing
    maxDelay: 10000, // 10 seconds max delay
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      onProgress?.(
        `Retrying Smart Hive Ai request (attempt ${attempt + 1})...`
      );
      console.warn(
        `Smart Hive AI retry attempt ${attempt + 1}:`,
        error.message
      );
    },
  });
};

/**
 * Parses AI response and extracts quiz questions
 */
export const parseAIResponse = (aiResponse: string): ParsedQuizQuestion[] => {
  let quizQuestions: ParsedQuizQuestion[] = [];

  try {
    const jsonString = extractJsonFromResponse(aiResponse);

    if (!jsonString) {
      // Try parsing the response directly if no code blocks found
      const parsed = JSON.parse(aiResponse.trim());
      quizQuestions = parsed.questions || [];
    } else {
      const parsed = JSON.parse(jsonString);
      quizQuestions = parsed.questions || [];
    }
  } catch (e) {
    console.error("Failed to parse Smart Hive AI response", e);
    throw new Error("Invalid quiz format from AI");
  }

  // Validate that we have questions
  if (!quizQuestions.length) {
    throw new Error("No questions generated by AI");
  }

  const validatedQuestions = quizQuestions.map((question, index) => {
    if (question.type === "mcq") {
      if (!question.options || question.options.length === 0) {
        throw new Error(
          `MCQ question "${question.question}" is missing options. Please regenerate the quiz.`
        );
      }
      if (question.options.length < 4) {
        throw new Error(
          `MCQ question "${question.question}" has only ${question.options.length} options. Expected 4 options.`
        );
      }
    }

    // Ensure all questions have options array (empty for non-MCQ)
    return {
      ...question,
      options: question.options || [],
    };
  });

  return validatedQuestions;
};

/**
 * Enhanced quiz generation with Claude fallback to Cohere
 */
export const generateQuizWithAIAndFallback = async (
  settings: QuizGenerationSettings,
  onProgress?: (message: string) => void
): Promise<ParsedQuizQuestion[]> => {
  const { selectedFiles, selectedLecturerFiles } = settings;

  // First, try the standard approach
  try {
    return await generateQuizWithAI(settings, onProgress);
  } catch (error) {
    console.warn("Primary AI generation failed, attempting fallback:", error);

    // If Claude fails with rate limiting and we have files, provide better guidance
    if (
      isRateLimitError(error) &&
      (selectedFiles.length > 0 || selectedLecturerFiles.length > 0)
    ) {
      console.warn(
        "Smart Hive rate limit hit, analyzing file sizes for guidance..."
      );

      // Check if files might be too large
      const allFiles = [...selectedFiles, ...selectedLecturerFiles];
      const hasLargeFiles = allFiles.some((file) => {
        const content = file.data || file.content || "";
        return estimateTextTokens(content) > 15000;
      });

      if (hasLargeFiles) {
        onProgress?.(
          "Large files detected. The system has automatically optimized content, but Smart Hive Ai is still overloaded. Trying backup service..."
        );
      } else {
        onProgress?.(
          "Smart Hive Ai overloaded, switching to text-based generation..."
        );
      }

      try {
        // Create a descriptive prompt based on file names and custom prompt
        let fallbackPrompt = `Generate a quiz based on the following materials:\n`;

        if (selectedFiles.length > 0) {
          fallbackPrompt += `\nStudent materials: ${selectedFiles
            .map((f) => f.name)
            .join(", ")}\n`;
        }

        if (selectedLecturerFiles.length > 0) {
          fallbackPrompt += `\nLecturer samples: ${selectedLecturerFiles
            .map((f) => f.name)
            .join(", ")}\n`;
        }

        if (settings.customPrompt) {
          fallbackPrompt += `\nAdditional context: ${settings.customPrompt}\n`;
        }

        fallbackPrompt += `\nPlease generate a comprehensive quiz with ${settings.questionCount} questions covering the topics likely found in these materials.`;

        // Add the standard quiz specifications
        fallbackPrompt += `\n\nQuiz specifications:
- Number of questions: ${settings.questionCount}
- Question types: ${Object.entries(settings.questionTypes)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(", ")}
- Difficulty: ${settings.difficulty}
- Feedback mode: ${settings.feedbackMode}

Format the response as JSON with this structure:
{
  "questions": [
    {
      "type": "question_type",
      "question": "question_text",
      "options": ["option1", "option2", ...], // for MCQ
      "correctAnswer": "correct_answer",
      "explanation": "explanation_text"
    }
  ]
}`;

        const fallbackSettings = {
          ...settings,
          selectedFiles: [],
          selectedLecturerFiles: [],
          customPrompt: fallbackPrompt,
        };

        onProgress?.("Generating quiz with backup AI service...");
        return await generateQuizWithAI(fallbackSettings, onProgress);
      } catch (fallbackError) {
        console.error("Fallback generation also failed:", fallbackError);
        throw new Error(
          "Both primary and backup AI services are currently unavailable. " +
            "Please try again in a few minutes, or try with a shorter prompt."
        );
      }
    }

    // Re-throw original error if it's not a rate limit issue or if fallback is not applicable
    throw error;
  }
};

/**
 * Main function to generate quiz using AI services with progress tracking
 */
export const generateQuizWithAI = async (
  settings: QuizGenerationSettings,
  onProgress?: (message: string) => void
): Promise<ParsedQuizQuestion[]> => {
  const { selectedFiles, selectedLecturerFiles } = settings;

  let aiResponse = "";

  // Check if files are selected - use Claude API
  if (selectedFiles.length > 0 || selectedLecturerFiles.length > 0) {
    try {
      onProgress?.("Preparing files for AI processing...");

      // Prepare file sources for Claude with better error handling
      const studentFileSources =
        selectedFiles.length > 0
          ? await prepareFileSourcesForAI(
              selectedFiles,
              "Student Material",
              settings.questionCount,
              12000 // Max tokens for single file
            )
          : [];

      const lecturerFileSources =
        selectedLecturerFiles.length > 0
          ? await prepareFileSourcesForAI(
              selectedLecturerFiles,
              "Lecturer Sample",
              settings.questionCount,
              8000 // Smaller limit for lecturer samples
            )
          : [];

      // Create enhanced prompt for file-based generation
      const fileBasedPrompt = createFileBasedPrompt(settings);

      // Process files with Claude
      aiResponse = await processFilesWithClaude(
        studentFileSources,
        lecturerFileSources,
        fileBasedPrompt,
        onProgress
      );
    } catch (claudeError) {
      console.error("Smart Hive Ai error:", claudeError);

      // Enhanced error message for rate limit errors
      if (isRateLimitError(claudeError)) {
        throw new Error(
          "Smart Hive Ai rate limit exceeded. The system automatically optimizes large files by focusing on key content sections, " +
            "but the service is currently overloaded. Please wait a moment and try again. " +
            "Your files have been intelligently processed to stay within limits."
        );
      }

      throw claudeError;
    }
  } else {
    // No files selected - use Cohere for text-based generation
    const textPrompt = createTextBasedPrompt(settings);
    aiResponse = await processTextWithCohere(textPrompt, onProgress);
  }

  onProgress?.("Parsing AI response...");
  // Parse and return questions
  return parseAIResponse(aiResponse);
};
