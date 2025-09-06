// api/gemini.ts

import OpenAI from "openai";

// Web-compatible file system utilities
const webFileSystem = {
  async getInfoAsync(uri: string) {
    // For web, we'll work with File objects or blob URLs
    if (uri.startsWith("blob:")) {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return {
          exists: true,
          size: blob.size,
        };
      } catch {
        return { exists: false };
      }
    }

    // For data URLs, we can estimate size
    if (uri.startsWith("data:")) {
      const base64Data = uri.split(",")[1];
      const size = base64Data ? base64Data.length * 0.75 : 0; // Rough estimate
      return {
        exists: true,
        size,
      };
    }

    return { exists: true, size: undefined };
  },

  async readAsStringAsync(uri: string, options: { encoding: string }) {
    try {
      if (uri.startsWith("blob:")) {
        const response = await fetch(uri);
        if (options.encoding === "base64") {
          const blob = await response.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:image/jpeg;base64, prefix if present
              const base64 = result.includes(",")
                ? result.split(",")[1]
                : result;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          return await response.text();
        }
      }

      if (uri.startsWith("data:") && options.encoding === "base64") {
        // Extract base64 data from data URL
        const base64Data = uri.split(",")[1];
        return base64Data || "";
      }

      throw new Error("Unsupported URI format for web");
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  },

  EncodingType: {
    Base64: "base64" as const,
  },
};

const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.PUBLIC_GEMINI_API_KEY,
});

// Model selection strategy
const lastRequestTime = { timestamp: 0 };
const minRequestInterval = 3000; // 3 seconds between requests
const modelPreferences = {
  accounting: "gemini-2.5-pro",
  fallback: "gemini-2.0-flash-exp",
};

export interface ChatMessage {
  role: "user" | "system" | "assistant";
  content:
    | string
    | {
        type: "text" | "image_url";
        text?: string;
        image_url?: {
          url: string;
        };
      }[];
}

/**
 * Process Markdown-style formatting in text to prepare for React Native rendering
 */
const processFormattedText = (text: string) => {
  if (!text) return { text: "", formatting: null };

  let cleanedText = text.trim();

  const formatting = {
    hasBold: false,
    hasItalic: false,
    hasBulletPoints: false,
    hasCodeBlocks: false,
  };

  formatting.hasBold = /\*\*[^*]+\*\*/g.test(cleanedText);
  formatting.hasItalic = /\*[^*]+\*/g.test(cleanedText);
  formatting.hasBulletPoints = /(\n|^)\s*[-*]\s+/m.test(cleanedText);
  formatting.hasCodeBlocks = /```[\s\S]*?```/g.test(cleanedText);

  return {
    text: cleanedText,
    formatting,
  };
};

/**
 * Encode image to base64 for Gemini API
 */
export const encodeImage = async (uri: string): Promise<string | null> => {
  try {
    const fileInfo = await webFileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Add size check (Gemini has a 20MB limit)
    if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
      throw new Error("Image size too large. Maximum size is 20MB.");
    }

    const base64 = await webFileSystem.readAsStringAsync(uri, {
      encoding: webFileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.length === 0) {
      throw new Error("Failed to encode image to base64");
    }

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error encoding image:", error);
    throw error; // Re-throw to let calling code handle it
  }
};

/**
 * Enforce minimum time between API requests to prevent rate limiting
 */
async function enforceRequestThrottling() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime.timestamp;

  if (timeSinceLastRequest < minRequestInterval) {
    const waitTime = minRequestInterval - timeSinceLastRequest;
    console.log(`Throttling request, waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime.timestamp = Date.now();
}

/**
 * Fallback function to use alternative model when primary model fails
 */
async function sendMessageWithFallbackModel(
  messages: ChatMessage[]
): Promise<string> {
  try {
    // Transform messages to proper format
    const geminiMessages: any[] = messages.map((msg) => {
      if (typeof msg.content === "string") {
        return { role: msg.role, content: msg.content };
      } else {
        return { role: msg.role, content: msg.content };
      }
    });

    // Add system message if not present
    if (!geminiMessages.some((msg) => msg.role === "system")) {
      geminiMessages.unshift({
        role: "system",
        content: `
You are Smart Hive AI, an intelligent assistant built into the Hivedemia app, created to help students succeed academically.

App Name: Hivedemia
Purpose: An AI-powered study platform offering tutoring, quiz generation, personalized planning, document-based Q&A, photo-based problem solving, and performance tracking.

AI Role: 
- Assist users with studying, scheduling, and understanding academic topics.
- Explain documents and images.
- Generate personalized quizzes and plans.
- Provide contextual, friendly, accurate support.
- Help users track their academic performance and suggest improvements.
- Answer questions about the app's features and capabilities.

Creator: Dhope Graphics
Owner: Mensah Isaac Nana Sam 
Company: Smart Hive Labs
Mission: To empower the worldwide with intelligent tools for personalized, efficient learning and maximize productivity.

Note: Mensah Isaac Nana Sam and Dhope Graphics are the same person, just that Dhope Graphics is the brand name of Mensah Isaac Nana Sam 
If someone asks who created you, who owns the app, what company made you, or what your features are — respond clearly and helpfully using this information.

Smart Hive Labs is a Ghana-based innovation studio founded by Mensah Isaac Nana Sam (Dhope Graphics). We specialize in web and mobile development, graphics and motion design, video editing, and AI-powered solutions. With a mission to craft digital excellence through innovation, our standout projects include Hivedemia (an AI study companion) and CivicLink (a civic tech voting prototype for Ghana). At Smart Hive Labs, creativity meets technology to build smarter digital futures.

You may also answer general study, productivity, and planning questions using this context.
        `.trim(),
      });
    }

    console.log(`Using fallback model: ${modelPreferences.fallback}`);
    const completion = await openai.chat.completions.create({
      model: modelPreferences.fallback,
      messages: geminiMessages,
      max_tokens: 4096, // Adjusted for fallback model
      temperature: 0.7,
    });

    const responseText =
      completion.choices[0]?.message?.content || "No response from AI";

    console.log("Fallback model response stats:", {
      model: modelPreferences.fallback,
      length: responseText.length,
      finishReason: completion.choices[0]?.finish_reason,
      tokensUsed: completion.usage?.total_tokens || "unknown",
    });

    const processedResponse = processFormattedText(responseText);
    return processedResponse.text;
  } catch (err) {
    console.error("Fallback model error:", err);
    throw new Error(
      "Failed to get response from both primary and fallback models"
    );
  }
}

export const sendMessageToGemini = async (
  messages: ChatMessage[],
  retryCount = 0,
  questionType?: string // Add this parameter to determine if it's accounting
): Promise<string> => {
  const maxRetries = 5; // Increased from 3
  const baseDelay = 2000; // Increased from 1000ms

  // Choose model based on question type
  const model =
    questionType === "accounting"
      ? modelPreferences.accounting
      : modelPreferences.fallback;

  try {
    // Enforce minimum time between requests
    await enforceRequestThrottling();

    // Transform messages to proper OpenAI/Gemini format
    const geminiMessages: any[] = messages.map((msg) => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        };
      } else {
        // Handle mixed content (text + images)
        return {
          role: msg.role,
          content: msg.content,
        };
      }
    });

    // Add system message if not present
    if (!geminiMessages.some((msg) => msg.role === "system")) {
      geminiMessages.unshift({
        role: "system",
        content: `
You are Smart Hive AI, an intelligent assistant built into the Hivedemia app, created to help students succeed academically.

App Name: Hivedemia
Purpose: An AI-powered study platform offering tutoring, quiz generation, personalized planning, document-based Q&A, photo-based problem solving, and performance tracking.

AI Role: 
- Assist users with studying, scheduling, and understanding academic topics.
- Explain documents and images.
- Generate personalized quizzes and plans.
- Provide contextual, friendly, accurate support.
- Help users track their academic performance and suggest improvements.
- Answer questions about the app's features and capabilities.

Creator: Dhope Graphics
Owner: Mensah Isaac Nana Sam 
Company: Smart Hive Labs
Mission: To empower the worldwide with intelligent tools for personalized, efficient learning and maximize productivity.

Note: Mensah Isaac Nana Sam and Dhope Graphics are the same person, just that Dhope Graphics is the brand name of Mensah Isaac Nana Sam 
If someone asks who created you, who owns the app, what company made you, or what your features are — respond clearly and helpfully using this information.

Smart Hive Labs is a Ghana-based innovation studio founded by Mensah Isaac Nana Sam (Dhope Graphics). We specialize in web and mobile development, graphics and motion design, video editing, and AI-powered solutions. With a mission to craft digital excellence through innovation, our standout projects include Hivedemia (an AI study companion) and CivicLink (a civic tech voting prototype for Ghana). At Smart Hive Labs, creativity meets technology to build smarter digital futures.

You may also answer general study, productivity, and planning questions using this context.
        `.trim(),
      });
    }

    console.log(`Using model: ${model} for request`);
    const completion = await openai.chat.completions.create({
      model,
      messages: geminiMessages,
      max_tokens: model === modelPreferences.accounting ? 8096 : 4096, // Different tokens based on model
      temperature: 0.7,
    });

    const responseText =
      completion.choices[0]?.message?.content || "No response from AI";

    // Log response statistics for debugging
    console.log("Gemini response stats:", {
      model,
      length: responseText.length,
      maxTokens: model === modelPreferences.accounting ? 8096 : 4096,
      finishReason: completion.choices[0]?.finish_reason,
      tokensUsed: completion.usage?.total_tokens || "unknown",
    });

    // Check if response was truncated
    if (completion.choices[0]?.finish_reason === "length") {
      console.warn(
        `⚠️ ${model} response was truncated due to max_tokens limit`
      );
    }

    const processedResponse = processFormattedText(responseText);

    return processedResponse.text;
  } catch (err: any) {
    // More detailed error logging
    console.error(
      `Gemini API error (${model}):`,
      JSON.stringify(
        {
          status: err.status,
          message: err.message,
          type: err.type,
        },
        null,
        2
      )
    );

    // Enhanced retry logic with jitter
    if ((err.status === 429 || err.status === 503) && retryCount < maxRetries) {
      const jitter = Math.random() * 1000;
      const delay = baseDelay * Math.pow(2, retryCount) + jitter;

      console.log(
        `API Error (${err.status}). Retrying in ${Math.round(
          delay
        )}ms (attempt ${retryCount + 1}/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendMessageToGemini(messages, retryCount + 1, questionType);
    }

    // Model fallback after exhausting retries with pro model
    if (
      retryCount >= maxRetries &&
      (err.status === 429 || err.status === 503) &&
      model === modelPreferences.accounting
    ) {
      console.log("Falling back to alternative model after max retries");
      return sendMessageWithFallbackModel(messages);
    }

    throw err;
  }
};
