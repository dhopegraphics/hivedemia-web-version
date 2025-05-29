// supabase/functions/ai-document-processor/index.ts
// eslint-disable-next-line import/no-unresolved
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts";
// eslint-disable-next-line import/no-unresolved
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// System message for Smart Hive AI
const SYSTEM_MESSAGE = `You are Smart Hive AI, an intelligent assistant built into the Hivedemia app, created to help students succeed academically.

App Name: Hivedemia
Purpose: An AI-powered study platform offering tutoring, quiz generation, personalized planning, document-based Q&A, photo-based problem solving, and performance tracking.

AI Role: 
- Assist users with studying, scheduling, and understanding academic topics.
- Explain documents and images with detailed analysis.
- Generate personalized quizzes and study plans.
- Provide contextual, friendly, accurate support.
- Help users track their academic performance and suggest improvements.
- Extract key topics, chapters, and sections from educational materials.
- Answer questions about the app's features and capabilities.

Creator: Dhope Graphics
Owner: Mensah Isaac Nana Sam 
Company: Smart Hive Labs
Mission: To empower students worldwide with intelligent tools for personalized, efficient learning.

Note: Mensah Isaac Nana Sam and Dhope Graphics are the same person, just that Dhope Graphics is the brand name of Mensah Isaac Nana Sam.

If someone asks who created you, who owns the app, what company made you, or what your features are — respond clearly and helpfully using this information.

You may also answer general study, productivity, and planning questions using this context.

When analyzing documents:
- Focus on educational content and academic value
- Identify key concepts, topics, and learning objectives
- Provide structured, helpful responses
- Maintain student-friendly language while being comprehensive`;

function extractBucketAndPath(url: any) {
  const path = new URL(url).pathname;
  const parts = path.split("/");
  // ['', 'storage', 'v1', 'object', 'sign', 'bucket', ...filePath]
  const bucket = parts[5]; // e.g., "coursefiles"
  const filePath = parts.slice(6).join("/"); // e.g., "userId/filename.pdf"
  return {
    bucket,
    filePath,
  };
}

async function downloadFileFromSupabase(supabaseClient: any, fileUrl: string) {
  try {
    const { bucket, filePath } = extractBucketAndPath(fileUrl);
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .download(filePath);

    if (error) throw error;

    const arrayBuffer = await data.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      mimeType:
        data.type ||
        getMimeType(filePath.split(".").pop() || "application/octet-stream"),
    };
  } catch (error) {
    console.error("Error downloading file:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download file: ${errorMessage}`);
  }
}

async function processWithOpenAI(
  fileData: Uint8Array,
  fileType: string,
  action: string,
  customMessage: string,
  fileName: string,
  mimeType: string
) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  console.log("Uploading file to OpenAI:", {
    size: fileData.length,
    type: mimeType,
    name: fileName,
  });

  const openai = new OpenAI({
    apiKey,
  });

  try {
    const messages: any[] = [
      {
        role: "system",
        content: SYSTEM_MESSAGE,
      },
    ];

    // Handle images (keep existing approach)
    const isImage = ["png", "jpg", "jpeg", "gif"].includes(
      fileType.toLowerCase()
    );
    if (isImage) {
      const base64Data = btoa(String.fromCharCode(...fileData));
      const imageUrl = `data:image/${fileType};base64,${base64Data}`;
      messages.push({
        role: "user",
        content: [
           {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
          {
            type: "text",
            text: getActionPrompt(action, customMessage),
          },
         
        ],
      });
    }
    // Handle documents using Files API
    else if (["pdf", "docx", "xlsx"].includes(fileType.toLowerCase())) {
      // Convert Uint8Array to Blob with proper MIME type
      const blob = new Blob([fileData], { type: mimeType });
      const fileForUpload = new File([fileData], fileName, { type: mimeType });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("purpose", "assistants");

      // Upload file to OpenAI using the correct endpoint
      const file = await openai.files.create({
        file: fileForUpload,
        purpose: "assistants",
      });

      // Wait for file to be processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a file link in the message
      messages.push({
        role: "user",
        content: [
          {
            type: "file",
            file: { file_id: file.id },
          },
          {
            type: "text",
            text: getActionPrompt(action, customMessage),
          },
        ],
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      // Schedule cleanup
      setTimeout(async () => {
        try {
          await openai.files.del(file.id);
          console.log("Cleaned up uploaded file:", file.id);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }, 5000);

      return completion.choices[0].message.content;
    }
    // Fallback for unsupported types
    else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // For images, complete the request normally
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI processing failed: ${errorMessage}`);
  }
}

function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    doc: "application/msword",
    xls: "application/vnd.ms-excel",
  };
  return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
}

function getActionPrompt(action: any, customMessage: any) {
  const basePrompts = {
    extract_topics: `Extract and list all 5 topics, chapters, main sections, and key concepts found in this document/image. 
    Focus on educational content and learning objectives. 
    Respond with a JSON object containing:
    {
      "topics": ["topic1", "topic2", ...],
      "summary": "Brief overview of the document's educational content"
    }`,
    analyze_document: `Provide a comprehensive analysis of this document/image focusing on:
    - Main topics and themes
    - Key learning objectives
    - Important concepts and definitions
    - Suggested study approaches
    Format your response as structured text with clear sections.`,
    generate_quiz: `Based on this document/image, generate 5-10 educational quiz questions with multiple choice answers. 
    Focus on key concepts and learning objectives.
    Respond with a JSON array of questions in this format:
    [
      {
        "question": "Question text",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correct_answer": "A",
        "explanation": "Why this is correct"
      }
    ]`,
    summarize: `Create a comprehensive summary of this document/image focusing on:
    - Main topics and key points
    - Learning objectives
    - Important formulas, concepts, or procedures
    - Study recommendations
    Present the summary in a student-friendly format.`,
  };

  let prompt = basePrompts[action] || basePrompts.analyze_document;
  if (customMessage) {
    prompt += `\n\nAdditional instructions: ${customMessage}`;
  }
  return prompt;
}

async function saveTopicsToDatabase(
  supabaseClient: any,
  topics: string[],
  fileId: string | number,
  courseId: string
) {
  try {
    const insertData = topics.map((topic) => ({
      coursefile_id: fileId,
      name: topic.trim(),
      course_id: courseId,
    }));

    // Use upsert to handle duplicates
    const { error } = await supabaseClient
      .from("extracted_topics")
      .upsert(insertData, {
        onConflict: "coursefile_id,name",
        ignoreDuplicates: true,
      });

    if (error) {
      console.error("Database insert error:", error);
      throw new Error(`Failed to save topics: ${error.message}`);
    }
  } catch (error) {
    console.error("Error saving topics:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    // Parse request body
    const requestBody = await req.json();

    // Validate required fields
    if (!requestBody.fileId || !requestBody.fileUrl || !requestBody.courseId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: fileId, fileUrl, or courseId",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Processing document:", {
      fileId: requestBody.fileId,
      fileName: requestBody.fileName,
      fileType: requestBody.fileType,
      action: requestBody.action,
    });

    // Download file from Supabase storage
    const { data: fileBytes, mimeType } = await downloadFileFromSupabase(
      supabaseClient,
      requestBody.fileUrl
    );

    // Process with OpenAI (now passing fileName)
    const aiResponse = await processWithOpenAI(
      fileBytes,
      requestBody.fileType,
      requestBody.action,
      requestBody.customMessage,
      requestBody.fileName,
      mimeType
    );
    console.log("AI response:", aiResponse);
    let result: {
      success: boolean;
      message: string;
      data?: any;
      error?: string;
    } = {
      success: true,
      message: "Document processed successfully",
    };

    // Handle different action types
    if (requestBody.action === "extract_topics") {
      try {
        // Try to parse JSON response
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(aiResponse);
        } catch {
          // Fallback: extract topics from text
          const topicLines = aiResponse
            .split("\n")
            .filter((line: string) => line.trim().length > 0)
            .map((line: string) => line.replace(/^[-*•]\s*/, "").trim())
            .filter((line: string) => line.length > 0);
          parsedResponse = {
            topics: topicLines.slice(0, 20),
            summary: "Topics extracted from document analysis",
          };
        }

        const topics = parsedResponse.topics || [];
        if (topics.length > 0) {
          // Save topics to database
          await saveTopicsToDatabase(
            supabaseClient,
            topics,
            requestBody.fileId,
            requestBody.courseId
          );
          result.data = {
            topics,
            summary: parsedResponse.summary,
            topicsCount: topics.length,
          };
        } else {
          result.success = false;
          result.error = "No topics found in document";
        }
      } catch (error) {
        console.error("Topic extraction error:", error);
        result.success = false;
        result.error = `Topic extraction failed: ${
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error)
        }`;
      }
    } else {
      result.data = {
        content: aiResponse,
        action: requestBody.action,
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    const errorResponse = {
      success: false,
      error: errorMessage,
      message: "Document processing failed",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
