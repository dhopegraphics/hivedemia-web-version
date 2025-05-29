// api/gemini.ts
import * as FileSystem from "expo-file-system";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
});

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
export const encodeImage = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Add size check
    if (fileInfo.size > 20 * 1024 * 1024) {
      // 20MB limit
      throw new Error("Image size too large. Maximum size is 20MB.");
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error encoding image:", error);
    return null;
  }
};

export const sendMessageToGemini = async (messages: ChatMessage[]) => {
  try {
    // Transform messages to OpenAI format
    const geminiMessages = messages.map((msg) => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        };
      } else {
        // Concatenate text content from array items
        const textContent = msg.content
          .map((item) =>
            item.type === "text"
              ? { type: "text", text: item.text }
              : { type: "image_url", image_url: { url: item.image_url?.url } }
          )

          .filter(Boolean)
          .join(" ");
        return {
          role: msg.role,
          content: msg.content, // preserve full array
        };
      }
    });

    if (!geminiMessages.some((msg) => msg.role === "system")) {
      geminiMessages.unshift({
        role: "system",
        content: [
          {
            type: "text",
            text: `
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
Mission: To empower students worldwide with intelligent tools for personalized, efficient learning.
Note: Mensah Isaac Nana Sam and Dhope Graphics are the same person, just that Dhope Graphics is the brand name of Mensah Isaac Nana Sam 
If someone asks who created you, who owns the app, what company made you, or what your features are — respond clearly and helpfully using this information.

You may also answer general study, productivity, and planning questions using this context.
        `.trim(),
          },
        ],
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-preview-05-20",
      messages: geminiMessages,
      max_tokens: 1024,
    });

    const responseText =
      completion.choices[0]?.message?.content || "No response from AI";
    const processedResponse = processFormattedText(responseText);

    return processedResponse.text;
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
};
