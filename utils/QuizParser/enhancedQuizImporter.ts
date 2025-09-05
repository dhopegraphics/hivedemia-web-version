/**
 * Enhanced Quiz Import Handler
 * Integrates the robust parser improvements into your existing app flow
 */

import { ParsedQuiz } from "../../types/quizParserTypes";

import {
  AIQuizParser,
  convertToQuizFormatEnhanced,
  parseQuizTextEnhanced,
} from "./aiQuizParser";
import {
  RobustQuizParser,
  convertToQuizFormatRobust,
} from "./robustQuizParser";

/**
 * Multi-strategy quiz parser that automatically selects the best parsing approach
 */
export class EnhancedQuizImporter {
  /**
   * Parse quiz text using multiple strategies for maximum success rate
   */
  static async parseQuizText(
    text: string,
    options: {
      preferredStrategy?: "auto" | "robust" | "ai" | "advanced";
      enableFallback?: boolean;
      enableAnalysis?: boolean;
    } = {}
  ): Promise<{
    result: ParsedQuiz;
    strategy: string;
    analysis?: any;
    recommendations?: string[];
  }> {
    const {
      preferredStrategy = "auto",
      enableFallback = true,
      enableAnalysis = true,
    } = options;

    let result: ParsedQuiz | null = null;
    let strategy = "";
    let analysis: any = null;
    let recommendations: string[] = [];

    // Strategy 1: Try RobustQuizParser (best for case studies)
    if (preferredStrategy === "auto" || preferredStrategy === "robust") {
      try {
        result = RobustQuizParser.parseQuizText(text);
        strategy = "robust";

        // Check if results are good enough
        if (result.questions.length > 0 && !this.hasLowQuality(result)) {
          if (enableAnalysis) {
            analysis = RobustQuizParser.analyzeResults(result);
            recommendations = analysis.recommendations;
          }
          return { result, strategy, analysis, recommendations };
        }
      } catch (error) {
        console.warn("RobustQuizParser failed:", error);
      }
    }

    // Strategy 2: Try Enhanced AI Parser
    if (
      enableFallback &&
      (preferredStrategy === "auto" || preferredStrategy === "ai")
    ) {
      try {
        result = parseQuizTextEnhanced(text, "auto");
        strategy = "ai-enhanced";

        if (result.questions.length > 0 && !this.hasLowQuality(result)) {
          if (enableAnalysis) {
            analysis = AIQuizParser.analyzeParsingResults(result);
            recommendations = analysis.recommendations;
          }
          return { result, strategy, analysis, recommendations };
        }
      } catch (error) {
        console.warn("Enhanced AI Parser failed:", error);
      }
    }

    // Strategy 3: Try original AI Parser as final fallback
    if (enableFallback) {
      try {
        result = AIQuizParser.parseQuizText(text);
        strategy = "ai-original";

        if (enableAnalysis) {
          analysis = AIQuizParser.analyzeParsingResults(result);
          recommendations = analysis.recommendations;
        }
      } catch (error) {
        console.error("All parsers failed:", error);
        throw new Error("Unable to parse quiz text with any available parser");
      }
    }

    if (!result) {
      throw new Error("No parser succeeded in parsing the text");
    }

    return { result, strategy, analysis, recommendations };
  }

  /**
   * Check if parsing result has low quality indicators
   */
  private static hasLowQuality(result: ParsedQuiz): boolean {
    if (result.questions.length === 0) return true;

    const errorRate =
      result.metadata.errorMessages?.length || 0 / result.questions.length;
    if (errorRate > 0.5) return true; // More than 50% errors

    const shortAnswerRate =
      result.questions.filter((q) => q.type === "shortAnswer").length /
      result.questions.length;
    if (shortAnswerRate > 0.8) return true; // More than 80% short answer (likely MCQs were misclassified)

    return false;
  }

  /**
   * Convert parsed quiz to app format with enhanced metadata
   */
  static convertToAppFormat(
    parseResult: {
      result: ParsedQuiz;
      strategy: string;
      analysis?: any;
      recommendations?: string[];
    },
    metadata: {
      title: string;
      difficulty: string;
      feedbackMode: string;
      userId: string;
    }
  ) {
    const { result, strategy, analysis, recommendations } = parseResult;

    // Use appropriate converter based on strategy
    let convertedQuiz;
    if (strategy === "robust") {
      convertedQuiz = convertToQuizFormatRobust(result, metadata);
    } else {
      convertedQuiz = convertToQuizFormatEnhanced(result, metadata);
    }

    // Add enhanced metadata
    (convertedQuiz as any).parsingMetadata = {
      ...result.metadata,
      strategy,
      analysis,
      recommendations,
      confidence: this.calculateOverallConfidence(result, analysis),
    };

    return convertedQuiz;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateOverallConfidence(
    result: ParsedQuiz,
    analysis: any
  ): number {
    let confidence = 0.5; // Base confidence

    // Question count factor
    if (result.questions.length > 0) confidence += 0.1;
    if (result.questions.length >= 5) confidence += 0.1;

    // Error rate factor
    const errorRate =
      result.metadata.errorMessages?.length ||
      0 / Math.max(result.questions.length, 1);
    confidence -= errorRate * 0.3;

    // Type distribution factor (good mix indicates successful parsing)
    const typeDistribution = result.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mcqCount = typeDistribution.mcq || 0;
    const totalQuestions = result.questions.length;

    if (mcqCount / totalQuestions > 0.3) confidence += 0.1; // Good MCQ detection
    if (mcqCount / totalQuestions > 0.5) confidence += 0.1; // Great MCQ detection

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Generate user-friendly parsing report
   */
  static generateParsingReport(parseResult: {
    result: ParsedQuiz;
    strategy: string;
    analysis?: any;
    recommendations?: string[];
  }): {
    summary: string;
    details: string[];
    recommendations: string[];
    confidence: number;
  } {
    const { result, strategy, analysis, recommendations = [] } = parseResult;

    const confidence = this.calculateOverallConfidence(result, analysis);
    const typeDistribution = result.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = `Successfully parsed ${
      result.questions.length
    } questions using ${strategy} parser (${Math.round(
      confidence * 100
    )}% confidence)`;

    const details = [
      `Question Types: ${Object.entries(typeDistribution)
        .map(([type, count]) => `${count} ${type}`)
        .join(", ")}`,
      `Parser Strategy: ${strategy}`,
      `Error Count: ${result.metadata.errorMessages?.length || 0}`,
    ];

    if (result.metadata.hasErrors) {
      details.push(
        `Errors: ${
          result.metadata.errorMessages?.join("; ") || "Unknown errors"
        }`
      );
    }

    return {
      summary,
      details,
      recommendations,
      confidence,
    };
  }
}

/**
 * Convenience function for React components
 */
export const useEnhancedQuizImporter = () => {
  const parseQuiz = async (
    text: string,
    metadata: {
      title: string;
      difficulty: string;
      feedbackMode: string;
      userId: string;
    }
  ) => {
    try {
      const parseResult = await EnhancedQuizImporter.parseQuizText(text, {
        preferredStrategy: "auto",
        enableFallback: true,
        enableAnalysis: true,
      });

      const convertedQuiz = EnhancedQuizImporter.convertToAppFormat(
        parseResult,
        metadata
      );
      const report = EnhancedQuizImporter.generateParsingReport(parseResult);

      return {
        quiz: convertedQuiz,
        report,
        success: true,
      };
    } catch (error) {
      return {
        quiz: null,
        report: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  return { parseQuiz };
};

// Utility function to detect quiz format
export const detectQuizFormat = (
  text: string
): {
  format:
    | "case-study-separated"
    | "case-study-inline"
    | "traditional"
    | "mixed"
    | "unknown";
  confidence: number;
  recommendations: string[];
} => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  let caseStudySeparatedScore = 0;
  let caseStudyInlineScore = 0;
  let traditionalScore = 0;

  // Check for patterns
  lines.forEach((line) => {
    // Case study separated format indicators
    if (/^[A-D]\.\s/.test(line)) caseStudySeparatedScore += 2;
    if (/^Correct Answer:\s*[A-D]/.test(line)) caseStudySeparatedScore += 3;
    if (/^Explanation:/.test(line)) caseStudySeparatedScore += 1;

    // Case study inline format indicators
    if (/A\)\s*[^A-D]*B\)\s*[^A-D]*C\)\s*[^A-D]*D\)/.test(line))
      caseStudyInlineScore += 5;
    if (/Answer:\s*[A-D]\)/.test(line)) caseStudyInlineScore += 3;

    // Traditional format indicators
    if (/^\d+[\.\)]\s/.test(line)) traditionalScore += 2;
    if (/^Q\d+/.test(line)) traditionalScore += 2;
    if (/^[A-D]\)\s/.test(line)) traditionalScore += 1;
  });

  const totalScore =
    caseStudySeparatedScore + caseStudyInlineScore + traditionalScore;
  const recommendations: string[] = [];

  let format:
    | "case-study-separated"
    | "case-study-inline"
    | "traditional"
    | "mixed"
    | "unknown";
  let confidence: number;

  if (totalScore === 0) {
    format = "unknown";
    confidence = 0;
    recommendations.push(
      "Consider formatting questions with clear structure (numbered questions, lettered options)"
    );
  } else if (
    caseStudySeparatedScore > caseStudyInlineScore &&
    caseStudySeparatedScore > traditionalScore
  ) {
    format = "case-study-separated";
    confidence = Math.min(0.9, caseStudySeparatedScore / totalScore);
    recommendations.push(
      "Format detected as case study with separated options - optimal for robust parser"
    );
  } else if (caseStudyInlineScore > traditionalScore) {
    format = "case-study-inline";
    confidence = Math.min(0.9, caseStudyInlineScore / totalScore);
    recommendations.push(
      "Format detected as case study with inline options - good for enhanced AI parser"
    );
  } else if (traditionalScore > 0) {
    format = "traditional";
    confidence = Math.min(0.9, traditionalScore / totalScore);
    recommendations.push(
      "Format detected as traditional quiz format - compatible with all parsers"
    );
  } else {
    format = "mixed";
    confidence = 0.5;
    recommendations.push("Mixed format detected - auto-strategy recommended");
  }

  return { format, confidence, recommendations };
};
