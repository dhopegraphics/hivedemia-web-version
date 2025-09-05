// utils/dynamicSystemMessage.ts

import { useAIDocumentLocalStore } from "@/backend/store/useAIDocumentLocalStore";

interface CourseContext {
  id: string;
  title?: string;
  code?: string;
  professor?: string;
  description?: string;
}

interface DocumentSummary {
  fileName: string;
  fileId: string;
  topics: string[];
  summary?: string;
  analysis?: any;
  keyPoints?: string[];
  type: string;
  hasQuizzes?: boolean;
  topicsCount?: number;
  summaryLength?: number;
  analysisData?: any;
}

/**
 * Generate a dynamic system message based on course context and documents
 */
export const generateDynamicSystemMessage = async (
  courseContext?: CourseContext,
  currentFiles?: any[]
): Promise<string> => {
  const baseSystemMessage = `
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

You may also answer general study, productivity, and planning questions using this context.`.trim();

  // If no course context provided, return base message
  if (!courseContext?.id) {
    return baseSystemMessage;
  }

  try {
    // Get course-specific document data
    const courseDocuments = await getCourseDocumentSummary(
      courseContext.id,
      currentFiles
    );

    // Build course-specific context
    let courseSpecificContext = `

CURRENT COURSE CONTEXT:
Course: ${courseContext.title || "Unknown Course"}`;

    if (courseContext.code) {
      courseSpecificContext += `
Course Code: ${courseContext.code}`;
    }

    if (courseContext.professor) {
      courseSpecificContext += `
Professor: ${courseContext.professor}`;
    }

    if (courseContext.description) {
      courseSpecificContext += `
Description: ${courseContext.description}`;
    }

    // Add document context if available
    if (courseDocuments.length > 0) {
      courseSpecificContext += `

AVAILABLE COURSE DOCUMENTS AND CONTENT:`;

      courseDocuments.forEach((doc, index) => {
        courseSpecificContext += `

${index + 1}. 📄 ${doc.fileName} (${doc.type.toUpperCase()})`;

        // Add topics with more detail
        if (doc.topics.length > 0) {
          courseSpecificContext += `
   🏷️  TOPICS COVERED (${doc.topicsCount || doc.topics.length}):
   ${doc.topics.map((topic) => `• ${topic}`).join("\n   ")}`;
        }

        // Add detailed summary
        if (doc.summary) {
          courseSpecificContext += `
   📋 SUMMARY:
   ${doc.summary}`;
        }

        // Add analysis key points
        if (doc.keyPoints && doc.keyPoints.length > 0) {
          courseSpecificContext += `
   🔍 KEY POINTS:
   ${doc.keyPoints.map((point) => `• ${point}`).join("\n   ")}`;
        }

        // Add analysis data if available
        if (doc.analysisData) {
          if (doc.analysisData.concepts) {
            courseSpecificContext += `
   💡 MAIN CONCEPTS:
   ${doc.analysisData.concepts
     .slice(0, 5)
     .map((concept: any) => `• ${concept}`)
     .join("\n   ")}`;
          }

          if (doc.analysisData.learningObjectives) {
            courseSpecificContext += `
   🎯 LEARNING OBJECTIVES:
   ${doc.analysisData.learningObjectives
     .slice(0, 3)
     .map((obj: any) => `• ${obj}`)
     .join("\n   ")}`;
          }

          if (doc.analysisData.difficulty) {
            courseSpecificContext += `
   📊 DIFFICULTY LEVEL: ${doc.analysisData.difficulty}`;
          }
        }

        // Indicate if quizzes are available
        if (doc.hasQuizzes) {
          courseSpecificContext += `
   ✅ PRACTICE QUIZZES: Available for this document`;
        }

        courseSpecificContext += `
   ────────────────────────────────────────`;
      });

      // Add comprehensive course overview
      const allTopics = courseDocuments.flatMap((doc) => doc.topics);
      const uniqueTopics = [...new Set(allTopics)];

      courseSpecificContext += `

📚 COURSE KNOWLEDGE BASE OVERVIEW:
📊 Total Documents: ${courseDocuments.length}
🏷️  Total Unique Topics: ${uniqueTopics.length}
📋 Documents with Summaries: ${
        courseDocuments.filter((doc) => doc.summary).length
      }
🔍 Documents with Analysis: ${
        courseDocuments.filter((doc) => doc.analysisData).length
      }
✅ Documents with Quizzes: ${
        courseDocuments.filter((doc) => doc.hasQuizzes).length
      }

🎯 MOST COVERED TOPICS:
${uniqueTopics
  .slice(0, 10)
  .map((topic) => `• ${topic}`)
  .join("\n")}

INSTRUCTIONS FOR AI RESPONSES:
- When answering questions, reference specific documents by name
- Cite topics and concepts from the uploaded materials
- Use the summaries and analysis data to provide detailed explanations
- Suggest related documents when topics overlap
- Generate examples based on the course content
- Offer to create quizzes or explain concepts from specific documents
- Always maintain context of the course: ${courseContext.title} (${
        courseContext.code
      })`;
    }

    courseSpecificContext += `

Focus your responses on helping the student with this specific course content while maintaining your friendly, educational personality.`;

    return baseSystemMessage + courseSpecificContext;
  } catch (error) {
    console.error("Error generating dynamic system message:", error);
    // Return base message if there's an error
    return baseSystemMessage;
  }
};

/**
 * Get summary of all documents for a specific course
 * Enhanced version that can use both stored data and current files array
 */
const getCourseDocumentSummary = async (
  courseId: string,
  currentFiles?: any[]
): Promise<DocumentSummary[]> => {
  const store = useAIDocumentLocalStore.getState();

  try {
    const documentSummaries: DocumentSummary[] = [];

    // If currentFiles array is provided, use it as the source of truth for files
    if (currentFiles && currentFiles.length > 0) {
      for (const file of currentFiles) {
        try {
          const fileId = String(file.id);

          // Get all data for the file in parallel
          const [extractedTopics, summaries, analyses, quizzes] =
            await Promise.all([
              store.getExtractedTopicsByFile(fileId),
              store.getSummariesByFile(fileId),
              store.getAnalysesByFile(fileId),
              store.getQuizzesByFile(fileId),
            ]);

          // Parse summary data
          let summaryText = undefined;
          if (summaries.length > 0) {
            try {
              const summaryData = JSON.parse(summaries[0].response_json);
              summaryText =
                summaryData.summary || summaryData.text || summaryData.content;
            } catch (parseError) {
              console.error(
                `Error parsing summary for file ${fileId}:`,
                parseError
              );
            }
          }

          // Parse analysis data
          let analysisData = undefined;
          let keyPoints: string[] = [];
          if (analyses.length > 0) {
            try {
              analysisData = JSON.parse(analyses[0].response_json);

              // Extract key points from various possible structures
              if (analysisData.keyPoints) {
                keyPoints = Array.isArray(analysisData.keyPoints)
                  ? analysisData.keyPoints
                  : [analysisData.keyPoints];
              } else if (analysisData.key_points) {
                keyPoints = Array.isArray(analysisData.key_points)
                  ? analysisData.key_points
                  : [analysisData.key_points];
              } else if (analysisData.mainPoints) {
                keyPoints = Array.isArray(analysisData.mainPoints)
                  ? analysisData.mainPoints
                  : [analysisData.mainPoints];
              }
            } catch (parseError) {
              console.error(
                `Error parsing analysis for file ${fileId}:`,
                parseError
              );
            }
          }

          const summary: DocumentSummary = {
            fileName: file.name || `File ${fileId}`,
            fileId: fileId,
            topics: extractedTopics?.topics || [],
            type: file.type || "unknown",
            summary: summaryText,
            analysis: analyses.length > 0 ? analyses[0] : undefined,
            keyPoints: keyPoints,
            hasQuizzes: quizzes.length > 0,
            topicsCount: extractedTopics?.topics?.length || 0,
            summaryLength: summaryText?.length || 0,
            analysisData: analysisData,
          };

          documentSummaries.push(summary);
        } catch (fileError) {
          console.error(`Error processing file ${file.id}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    } else {
      // Fallback to the original method using processed files from local storage
      const processedFiles = await store.getProcessedFilesFromLocal();
      const courseFiles = processedFiles.filter(
        (file) =>
          file.course_id === courseId || file.coursefile_id?.includes(courseId)
      );

      for (const file of courseFiles) {
        try {
          // Get all data for the file in parallel
          const [extractedTopics, summaries, analyses, quizzes] =
            await Promise.all([
              store.getExtractedTopicsByFile(file.coursefile_id),
              store.getSummariesByFile(file.coursefile_id),
              store.getAnalysesByFile(file.coursefile_id),
              store.getQuizzesByFile(file.coursefile_id),
            ]);

          // Parse summary data
          let summaryText = undefined;
          if (summaries.length > 0) {
            try {
              const summaryData = JSON.parse(summaries[0].response_json);
              summaryText =
                summaryData.summary || summaryData.text || summaryData.content;
            } catch (parseError) {
              console.error(
                `Error parsing summary for file ${file.coursefile_id}:`,
                parseError
              );
            }
          }

          // Parse analysis data
          let analysisData = undefined;
          let keyPoints: string[] = [];
          if (analyses.length > 0) {
            try {
              analysisData = JSON.parse(analyses[0].response_json);

              // Extract key points from various possible structures
              if (analysisData.keyPoints) {
                keyPoints = Array.isArray(analysisData.keyPoints)
                  ? analysisData.keyPoints
                  : [analysisData.keyPoints];
              } else if (analysisData.key_points) {
                keyPoints = Array.isArray(analysisData.key_points)
                  ? analysisData.key_points
                  : [analysisData.key_points];
              } else if (analysisData.mainPoints) {
                keyPoints = Array.isArray(analysisData.mainPoints)
                  ? analysisData.mainPoints
                  : [analysisData.mainPoints];
              }
            } catch (parseError) {
              console.error(
                `Error parsing analysis for file ${file.coursefile_id}:`,
                parseError
              );
            }
          }

          const summary: DocumentSummary = {
            fileName: file.fileName || `File ${file.coursefile_id}`,
            fileId: file.coursefile_id,
            topics: extractedTopics?.topics || [],
            type: file.fileType || "unknown",
            summary: summaryText,
            analysis: analyses.length > 0 ? analyses[0] : undefined,
            keyPoints: keyPoints,
            hasQuizzes: quizzes.length > 0,
            topicsCount: extractedTopics?.topics?.length || 0,
            summaryLength: summaryText?.length || 0,
            analysisData: analysisData,
          };

          documentSummaries.push(summary);
        } catch (fileError) {
          console.error(
            `Error processing file ${file.coursefile_id}:`,
            fileError
          );
          // Continue with other files even if one fails
        }
      }
    }

    return documentSummaries;
  } catch (error) {
    console.error("Error getting course document summary:", error);
    return [];
  }
};

/**
 * Generate system message for a specific document
 */
export const generateDocumentSpecificSystemMessage = async (
  documentId: string,
  documentName?: string
): Promise<string> => {
  const baseMessage = await generateDynamicSystemMessage();

  try {
    const store = useAIDocumentLocalStore.getState();

    // Get comprehensive document-specific data
    const [extractedTopics, summaries, analyses, quizzes] = await Promise.all([
      store.getExtractedTopicsByFile(documentId),
      store.getSummariesByFile(documentId),
      store.getAnalysesByFile(documentId),
      store.getQuizzesByFile(documentId),
    ]);

    let documentContext = `

🎯 CURRENT DOCUMENT FOCUS:
📄 Document: ${documentName || `Document ${documentId}`}
📊 Status: ${summaries.length > 0 ? "✅ Processed" : "⏳ Processing"}`;

    // Add comprehensive topics information
    if (extractedTopics?.topics?.length > 0) {
      documentContext += `

🏷️  EXTRACTED TOPICS (${extractedTopics.topics.length}):
${extractedTopics.topics.map((topic: any) => `• ${topic}`).join("\n")}`;
    }

    // Add detailed summary
    if (summaries.length > 0) {
      try {
        const summaryData = JSON.parse(summaries[0].response_json);
        const summaryText =
          summaryData.summary || summaryData.text || summaryData.content;
        if (summaryText) {
          documentContext += `

📋 DOCUMENT SUMMARY:
${summaryText}`;
        }
      } catch (parseError) {
        console.error("Error parsing summary data:", parseError);
      }
    }

    // Add comprehensive analysis data
    if (analyses.length > 0) {
      try {
        const analysisData = JSON.parse(analyses[0].response_json);

        documentContext += `

🔍 DETAILED ANALYSIS:`;

        // Key points
        if (
          analysisData.keyPoints ||
          analysisData.key_points ||
          analysisData.mainPoints
        ) {
          const keyPoints =
            analysisData.keyPoints ||
            analysisData.key_points ||
            analysisData.mainPoints;
          const pointsArray = Array.isArray(keyPoints)
            ? keyPoints
            : [keyPoints];
          documentContext += `
💡 KEY POINTS:
${pointsArray.map((point: any) => `• ${point}`).join("\n")}`;
        }

        // Main concepts
        if (analysisData.concepts || analysisData.mainConcepts) {
          const concepts = analysisData.concepts || analysisData.mainConcepts;
          const conceptsArray = Array.isArray(concepts) ? concepts : [concepts];
          documentContext += `
🧠 MAIN CONCEPTS:
${conceptsArray.map((concept: any) => `• ${concept}`).join("\n")}`;
        }

        // Learning objectives
        if (analysisData.learningObjectives || analysisData.objectives) {
          const objectives =
            analysisData.learningObjectives || analysisData.objectives;
          const objectivesArray = Array.isArray(objectives)
            ? objectives
            : [objectives];
          documentContext += `
🎯 LEARNING OBJECTIVES:
${objectivesArray.map((obj: any) => `• ${obj}`).join("\n")}`;
        }

        // Difficulty level
        if (analysisData.difficulty || analysisData.difficultyLevel) {
          documentContext += `
📊 DIFFICULTY LEVEL: ${
            analysisData.difficulty || analysisData.difficultyLevel
          }`;
        }

        // Prerequisites
        if (analysisData.prerequisites) {
          const prereqs = Array.isArray(analysisData.prerequisites)
            ? analysisData.prerequisites
            : [analysisData.prerequisites];
          documentContext += `
📚 PREREQUISITES:
${prereqs.map((prereq: any) => `• ${prereq}`).join("\n")}`;
        }

        // Important formulas or definitions
        if (analysisData.formulas) {
          const formulas = Array.isArray(analysisData.formulas)
            ? analysisData.formulas
            : [analysisData.formulas];
          documentContext += `
📐 KEY FORMULAS:
${formulas.map((formula: any) => `• ${formula}`).join("\n")}`;
        }

        if (analysisData.definitions) {
          const definitions = Array.isArray(analysisData.definitions)
            ? analysisData.definitions
            : [analysisData.definitions];
          documentContext += `
📖 KEY DEFINITIONS:
${definitions.map((def: any) => `• ${def}`).join("\n")}`;
        }
      } catch (parseError) {
        console.error("Error parsing analysis data:", parseError);
      }
    }

    // Add quiz information
    if (quizzes.length > 0) {
      documentContext += `

✅ AVAILABLE PRACTICE MATERIALS:
📝 Generated Quizzes: ${quizzes.length}
💡 Quiz Topics: Based on the extracted topics and key concepts above`;
    }

    documentContext += `

🤖 AI ASSISTANCE INSTRUCTIONS:
- Provide detailed explanations focused on this specific document
- Reference the topics, concepts, and key points listed above
- Use the summary and analysis data to answer questions comprehensively
- Offer to explain any of the extracted topics in more detail
- Suggest connections between concepts within this document
- Help with practice questions based on the document content
- Always maintain focus on "${documentName || `Document ${documentId}`}"`;

    return baseMessage + documentContext;
  } catch (error) {
    console.error("Error generating document-specific system message:", error);
    return baseMessage;
  }
};
