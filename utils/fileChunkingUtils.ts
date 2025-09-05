/**
 * File content chunking and optimization utilities for AI processing
 */

export interface ContentChunk {
  content: string;
  tokenCount: number;
  priority: number;
  summary: string;
  section: string;
}

export interface ChunkingOptions {
  maxTokens: number;
  targetQuestionCount: number;
  preserveStructure: boolean;
  focusAreas?: string[];
}

/**
 * Estimates token count for text (rough approximation)
 */
export const estimateTextTokens = (text: string): number => {
  return Math.ceil(text.length / 4); // Rough estimation: 1 token ≈ 4 characters
};

/**
 * Identifies key sections and content areas in text
 */
export const identifyKeyContent = (text: string): ContentChunk[] => {
  const chunks: ContentChunk[] = [];

  // Split by common section markers
  const sectionPatterns = [
    /(?:^|\n)\s*(?:chapter|section|part|unit)\s+\d+/gi,
    /(?:^|\n)\s*(?:\d+\.|\d+\))\s+[A-Z]/gm,
    /(?:^|\n)\s*[A-Z][^.\n]{20,100}(?:\n|$)/gm,
    /(?:^|\n)\s*(?:introduction|conclusion|summary|overview|key\s+points)/gi,
  ];

  let remainingText = text;
  let chunkIndex = 0;

  // First, try to identify clear sections
  for (const pattern of sectionPatterns) {
    const matches = Array.from(remainingText.matchAll(pattern));

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];

      const startIndex = match.index || 0;
      const endIndex = nextMatch
        ? nextMatch.index || remainingText.length
        : remainingText.length;

      const sectionContent = remainingText.slice(startIndex, endIndex).trim();
      const tokenCount = estimateTextTokens(sectionContent);

      if (sectionContent.length > 100 && tokenCount > 50) {
        // Minimum viable content
        chunks.push({
          content: sectionContent,
          tokenCount,
          priority: calculateContentPriority(sectionContent),
          summary: extractSummary(sectionContent),
          section: `Section ${chunkIndex + 1}`,
        });
        chunkIndex++;
      }
    }

    if (chunks.length > 0) break; // Use first successful pattern
  }

  // If no clear sections found, create logical chunks
  if (chunks.length === 0) {
    const paragraphs = remainingText
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 50);

    let currentChunk = "";
    let currentTokens = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = estimateTextTokens(paragraph);

      if (currentTokens + paragraphTokens > 2000 && currentChunk) {
        // 2k token chunks
        chunks.push({
          content: currentChunk.trim(),
          tokenCount: currentTokens,
          priority: calculateContentPriority(currentChunk),
          summary: extractSummary(currentChunk),
          section: `Chunk ${chunks.length + 1}`,
        });

        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        currentChunk += "\n\n" + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: currentTokens,
        priority: calculateContentPriority(currentChunk),
        summary: extractSummary(currentChunk),
        section: `Chunk ${chunks.length + 1}`,
      });
    }
  }

  return chunks.sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
};

/**
 * Calculates content priority based on educational value indicators
 */
const calculateContentPriority = (content: string): number => {
  let priority = 0;
  const lowerContent = content.toLowerCase();

  // High-value educational keywords
  const highValueKeywords = [
    "definition",
    "concept",
    "principle",
    "theory",
    "formula",
    "equation",
    "example",
    "case study",
    "problem",
    "solution",
    "method",
    "process",
    "important",
    "key",
    "essential",
    "fundamental",
    "critical",
    "significant",
    "note:",
    "remember:",
    "important:",
    "key point:",
    "summary:",
  ];

  // Medium-value keywords
  const mediumValueKeywords = [
    "explain",
    "describe",
    "analyze",
    "compare",
    "contrast",
    "evaluate",
    "application",
    "use",
    "function",
    "purpose",
    "reason",
    "cause",
    "effect",
  ];

  // Count high-value keywords (weight: 10)
  highValueKeywords.forEach((keyword) => {
    const matches = (lowerContent.match(new RegExp(keyword, "g")) || []).length;
    priority += matches * 10;
  });

  // Count medium-value keywords (weight: 5)
  mediumValueKeywords.forEach((keyword) => {
    const matches = (lowerContent.match(new RegExp(keyword, "g")) || []).length;
    priority += matches * 5;
  });

  // Bonus for numbered lists and bullet points
  const listMatches = (content.match(/(?:^|\n)\s*(?:\d+\.|\•|\*|-)\s+/gm) || [])
    .length;
  priority += listMatches * 3;

  // Bonus for questions and answers
  const questionMatches = (content.match(/\?/g) || []).length;
  priority += questionMatches * 8;

  // Penalty for very short or very long content
  if (content.length < 200) priority *= 0.5;
  if (content.length > 5000) priority *= 0.8;

  return priority;
};

/**
 * Extracts a summary of the content chunk
 */
const extractSummary = (content: string): string => {
  // Try to find a clear topic sentence or heading
  const lines = content.split("\n").filter((line) => line.trim());

  for (const line of lines.slice(0, 5)) {
    // Check first 5 lines
    if (line.length > 20 && line.length < 100) {
      // Look for headings or topic sentences
      if (/^[A-Z]/.test(line.trim()) && !line.endsWith(".")) {
        return line.trim();
      }
    }
  }

  // Fallback: use first sentence
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const firstSentence = sentences[0]?.trim();

  if (firstSentence && firstSentence.length < 150) {
    return firstSentence;
  }

  // Last resort: truncate first line
  return lines[0]?.slice(0, 100) + "..." || "Content section";
};

/**
 * Selects the best chunks to fit within token limit
 */
export const selectOptimalChunks = (
  chunks: ContentChunk[],
  options: ChunkingOptions
): ContentChunk[] => {
  const { maxTokens, targetQuestionCount } = options;

  // Calculate tokens per question to estimate content needs
  const tokensPerQuestion = Math.max(
    200,
    maxTokens / (targetQuestionCount * 2)
  ); // Conservative estimate
  const targetTokens = Math.min(
    maxTokens * 0.8,
    tokensPerQuestion * targetQuestionCount
  ); // Leave buffer

  const selectedChunks: ContentChunk[] = [];
  let totalTokens = 0;

  // First pass: select highest priority chunks that fit
  for (const chunk of chunks) {
    if (totalTokens + chunk.tokenCount <= targetTokens) {
      selectedChunks.push(chunk);
      totalTokens += chunk.tokenCount;
    }
  }

  // If we have room and few chunks, try to add more content
  if (selectedChunks.length < 2 && chunks.length > selectedChunks.length) {
    const remainingChunks = chunks.filter((c) => !selectedChunks.includes(c));

    for (const chunk of remainingChunks) {
      // Try truncating large chunks to fit
      if (totalTokens + chunk.tokenCount * 0.6 <= targetTokens) {
        const truncatedContent = truncateContent(
          chunk.content,
          Math.floor((targetTokens - totalTokens) / 0.6)
        );
        selectedChunks.push({
          ...chunk,
          content: truncatedContent,
          tokenCount: estimateTextTokens(truncatedContent),
          summary: chunk.summary + " (truncated)",
        });
        break;
      }
    }
  }

  return selectedChunks;
};

/**
 * Truncates content intelligently, preserving structure
 */
const truncateContent = (content: string, maxTokens: number): string => {
  const maxChars = maxTokens * 4; // Rough conversion

  if (content.length <= maxChars) return content;

  // Try to truncate at paragraph boundaries
  const paragraphs = content.split("\n\n");
  let truncated = "";

  for (const paragraph of paragraphs) {
    if ((truncated + paragraph).length <= maxChars) {
      truncated += (truncated ? "\n\n" : "") + paragraph;
    } else {
      break;
    }
  }

  // If truncated is too short, add partial paragraph
  if (truncated.length < maxChars * 0.5 && paragraphs.length > 0) {
    const remainingChars = maxChars - truncated.length - 4; // Account for \n\n and ...
    const lastParagraph = paragraphs.find((p) => !truncated.includes(p));

    if (lastParagraph && remainingChars > 100) {
      truncated += "\n\n" + lastParagraph.slice(0, remainingChars) + "...";
    }
  }

  return truncated || content.slice(0, maxChars) + "...";
};

/**
 * Combines selected chunks into optimized content for AI processing
 */
export const combineChunksForAI = (
  chunks: ContentChunk[],
  prompt: string
): string => {
  if (chunks.length === 0) return "";

  let combinedContent = "";

  // Add context about the content selection
  if (chunks.length > 1) {
    combinedContent += `Content Summary:\n`;
    chunks.forEach((chunk, index) => {
      combinedContent += `${index + 1}. ${chunk.summary} (${
        chunk.tokenCount
      } tokens)\n`;
    });
    combinedContent += "\n---\n\n";
  }

  // Add the actual content
  chunks.forEach((chunk, index) => {
    if (chunks.length > 1) {
      combinedContent += `[${chunk.section}]\n`;
    }
    combinedContent += chunk.content;
    if (index < chunks.length - 1) {
      combinedContent += "\n\n---\n\n";
    }
  });

  return combinedContent;
};
