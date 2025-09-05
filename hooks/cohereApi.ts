import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.cohere.ai/compatibility/v1",
  apiKey: process.env.PUBLIC_COHERE_TRIAL_KEY, // Ensure this is securely stored
});

export interface ChatMessage {
  role: "user" | "system";
  content: string;
}

/**
 * Process Markdown-style formatting in text to prepare for React Native rendering
 * @param text The text with markdown formatting
 * @returns Object with cleaned text and formatting information
 */
const processFormattedText = (text: string) => {
  if (!text) return { text: "", formatting: null };

  // Clean up any extra whitespace or line breaks
  let cleanedText = text.trim();

  // Create an object to track formatting information
  const formatting = {
    hasBold: false,
    hasItalic: false,
    hasBulletPoints: false,
    hasCodeBlocks: false,
  };

  // Check for various formatting markers
  formatting.hasBold = /\*\*[^*]+\*\*/g.test(cleanedText);
  formatting.hasItalic = /\*[^*]+\*/g.test(cleanedText);
  formatting.hasBulletPoints = /(\n|^)\s*[-*]\s+/m.test(cleanedText);
  formatting.hasCodeBlocks = /```[\s\S]*?```/g.test(cleanedText);

  return {
    text: cleanedText,
    formatting,
  };
};

export const sendMessageToCohere = async (messages: ChatMessage[]) => {
  try {
    // Create a chat completion request using the OpenAI SDK, pointing to Cohere's model
    const completion = await openai.chat.completions.create({
      model: "command-a-03-2025",
      messages: [
        {
          role: "system",
          content: `
You are Smart Hive AI, an intelligent assistant built into the Hivedemia app, created to help  students  succeed academically.

App Name: Hivedemia
Purpose: An AI-powered study platform offering tutoring, quiz generation, personalized planning, document-based Q&A, photo-based problem solving, and performance tracking.

AI Role: 
- Assist users with studying, scheduling, and understanding academic topics.
- Explain documents and images.
- Generate personalized quizzes and plans.
- Provide contextual, friendly, accurate support.

Creator: Dhope Graphics
Owner: Mensah Isaac Nana Sam 
Company: Smart Hive Labs
Mission: To empower students worldwide with intelligent tools for personalized, efficient learning.
Note: Mensah Isaac Nana Sam and  Dhope Graphics are the same person , just that Dhope Graphics is the brand name of  Mensah Isaac Nana Sam 
If someone asks who created you, who owns the app, what company made you, or what your features are — respond clearly and helpfully using this information.

You may also answer general study, productivity, and planning questions using this context.
        `.trim(),
        },
        ...messages,
      ],
    });

    // Get the raw response text
    const responseText =
      completion.choices[0]?.message?.content || "No response from AI";

    // Process the text for formatting
    const processedResponse = processFormattedText(responseText);

    // Now you can use processedResponse.text as the cleaned text
    // and processedResponse.formatting to know what kind of formatting to apply

    return processedResponse.text;
  } catch (err) {
    console.error("Cohere API error:", err);
    throw err;
  }
};
