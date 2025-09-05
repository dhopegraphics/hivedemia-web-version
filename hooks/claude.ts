import { Anthropic } from "@anthropic-ai/sdk";

// Configuration types
export interface ClaudeConfig {
  apiKey: string;
  defaultModel?: ClaudeModel;
  defaultMaxTokens?: number;
}

// Supported models
export type ClaudeModel =
  | "claude-3-opus-20240229"
  | "claude-opus-4-20250514"
  | "claude-3-haiku-20240307"
  | "claude-2.1"
  | "claude-2.0"
  | "claude-sonnet-4-20250514"
  | "claude-3-5-sonnet-20240620"
  | "claude-haiku-4-20250514"
  | "claude-instant-1.2";

// File source types
export type FileSourceType = "file" | "url" | "base64";

export interface BaseFileSource {
  type: FileSourceType;
  title?: string;
  context?: string;
  citations?: {
    enabled: boolean;
  };
}

export interface FileIdSource extends BaseFileSource {
  type: "file";
  file_id: string;
}

export interface UrlSource extends BaseFileSource {
  type: "url";
  url: string;
}

export interface Base64Source extends BaseFileSource {
  type: "base64";
  media_type: string;
  data: string;
}

export type FileSource = FileIdSource | UrlSource | Base64Source;

// Content block types
export type ContentBlock = TextContent | DocumentContent | ImageContent;

export interface TextContent {
  type: "text";
  text: string;
}

export interface DocumentContent {
  type: "document";
  source: FileSource;
  title?: string;
  context?: string;
}

export interface ImageContent {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
}

// Message types
export interface ClaudeMessage {
  role: "user" | "assistant";
  content: ContentBlock[];
}

// Response types
export interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ClaudeMessageContent[];
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export type ClaudeMessageContent = {
  type: "text";
  text: string;
};

// File upload types
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  created_at: string;
}

// Error types
export interface ClaudeAPIError extends Error {
  status?: number;
  error?: {
    type: string;
    message: string;
  };
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
});

/**
 * Generates exam questions based on student material and lecturer samples
 * @param studentSource - The student's study material source
 * @param lecturerSamples - The lecturer's sample questions source
 * @param additionalPrompt - Additional instructions for question generation
 * @param options - Optional configuration including model and max tokens
 * @returns Generated questions as a string
 * @throws {ClaudeError} When API call fails
 */
export async function generateQuestionsFromSamples(
  studentSource: FileSource,
  lecturerSamples: FileSource,
  additionalPrompt: string = "",
  options: {
    model?: ClaudeModel;
    maxTokens?: number;
  } = {}
): Promise<string> {
  if (!process.env.EXPO_PUBLIC_CLAUDE_API_KEY) {
    throw new ClaudeError(
      "API key for Claude is not set. Please check your environment variables.",
      401
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: options.model || "claude-3-sonnet-20240229",
      max_tokens: options.maxTokens || 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `I'm a student preparing for exams. Here's my study material and some sample questions from my lecturer. 
              Please generate similar questions based on these samples that test the same concepts and difficulty level.
              ${additionalPrompt}`,
            },
            {
              type: "document",
              source: lecturerSamples,
              title: "Lecturer Sample Questions",
              context: "These are example questions provided by the lecturer",
            },
            {
              type: "document",
              source: studentSource,
              title: "Study Material",
              context: "This is the material I need to be tested on",
            },
          ],
        },
      ],
    });

    const textBlock = response.content?.find(
      (block) =>
        block.type === "text" && typeof (block as any).text === "string"
    ) as ClaudeMessageContent | undefined;

    if (!textBlock?.text) {
      throw new ClaudeError("No response content received from Claude", 500);
    }

    return textBlock.text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new ClaudeError(
        `Failed to generate questions: ${error.message}`,
        (error as any).status,
        error
      );
    }
    throw new ClaudeError(
      "Failed to generate questions due to unknown error",
      500
    );
  }
}

/**
 * Uploads a file to Claude's API
 * @param fileData - The file data as Buffer
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @returns The uploaded file details
 * @throws {ClaudeError} When upload fails
 */
export async function uploadFile(
  fileData: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadedFile> {
  try {
    // Create a File-like object that the Anthropic SDK expects
    const file = new File([fileData], fileName, { type: mimeType });

    const uploadedFile = await anthropic.beta.files.upload({
      file: file,
      purpose: "assistant", // Required field for file uploads
    });

    return uploadedFile;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new ClaudeError(
        `Failed to upload file: ${error.message}`,
        (error as any).status,
        error
      );
    }
    throw new ClaudeError("Failed to upload file due to unknown error", 500);
  }
}

/**
 * Analyzes a document with a custom prompt
 * @param fileSource - The document source to analyze
 * @param prompt - The analysis prompt
 * @param options - Optional configuration including model and max tokens
 * @returns The analysis result as string
 * @throws {ClaudeError} When analysis fails
 */
export async function analyzeDocument(
  fileSource: FileSource,
  prompt: string,
  options: {
    model?: ClaudeModel;
    maxTokens?: number;
  } = {}
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: options.model || "claude-3-sonnet-20240229",
      max_tokens: options.maxTokens || 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: fileSource,
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    if (!response.content?.[0]?.text) {
      throw new ClaudeError("No response content received from Claude", 500);
    }

    return response.content[0].text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new ClaudeError(
        `Failed to analyze document: ${error.message}`,
        (error as any).status,
        error
      );
    }
    throw new ClaudeError(
      "Failed to analyze document due to unknown error",
      500
    );
  }
}

/**
 * Utility function to prepare file sources from different input types
 * @param file - Can be a Buffer, base64 string, or URL
 * @param options - Configuration including file metadata
 * @returns Prepared FileSource
 * @throws {ClaudeError} When preparation fails
 */
export async function prepareFileSource(
  file: Buffer | string,
  options: {
    fileName: string;
    mimeType: string;
    title?: string;
    context?: string;
  }
): Promise<FileSource> {
  try {
    if (typeof file === "string") {
      if (file.startsWith("http")) {
        return {
          type: "url",
          url: file,
          // REMOVE title/context here!
        };
      }

      // Handle base64 strings - remove data URL prefix if present
      let base64Data = file;
      if (file.startsWith("data:")) {
        const commaIndex = file.indexOf(",");
        if (commaIndex !== -1) {
          base64Data = file.substring(commaIndex + 1);
        }
      }

      return {
        type: "base64",
        media_type: options.mimeType,
        data: base64Data,
        // REMOVE title/context here!
      };
    }

    // For Buffer objects, upload to Claude first
    const uploadedFile = await uploadFile(
      file,
      options.fileName,
      options.mimeType
    );

    return {
      type: "file",
      file_id: uploadedFile.id,
      title: options.title,
      context: options.context,
    };
  } catch (error: unknown) {
    if (error instanceof ClaudeError) {
      throw error;
    }
    throw new ClaudeError("Failed to prepare file source", 500, error);
  }
}
