import {
  ParsedQuestion,
  ParsedQuiz,
  ValidationError,
} from "../../types/quizParserTypes";

// Re-export types for external consumption
export type { ParsedQuestion, ParsedQuiz, ValidationError };

/**
 * Enhanced robust quiz parser that handles multiple formats including:
 * - Traditional separated format (question on one line, options on separate lines)
 * - Case study format (question with inline options and answers)
 * - Mixed formats
 * - Various answer and explanation patterns
 */
export class RobustQuizParser {
  // Question detection patterns (numbered and unnumbered)
  private static readonly QUESTION_PATTERNS = [
    /^(\d+)\.\s*(.+)/i, // 1. Question text
    /^Q(\d+)[:\.\)]?\s*(.+)/i, // Q1) Question, Q1: Question, Q1. Question
    /^Question\s*(\d+)[:\.\)]?\s*(.+)/i, // Question 1) Question
    /^(\d+)[:\)]?\s*(.+)/i, // 1) Question, 1: Question
    // Unnumbered question patterns
    /^(What|How|Why|When|Where|Which|Who)\s+(.+)/i, // Wh- questions
    /^True\s+or\s+False[:\.]?\s*(.+)/i, // True or False questions
    /^(.+\?)\s*$/i, // Any line ending with question mark
  ];

  // Option patterns for separate-line options
  private static readonly OPTION_PATTERNS = [
    /^([A-Ha-h])\)\s*(.+)/i, // A) Option
    /^([A-Ha-h])\.\s*(.+)/i, // A. Option
    /^\(([A-Ha-h])\)\s*(.+)/i, // (A) Option
    /^([A-Ha-h])\s*[-–—]\s*(.+)/i, // A - Option
    /^([A-Ha-h]):\s*(.+)/i, // A: Option
  ];

  // Answer patterns
  private static readonly ANSWER_PATTERNS = [
    /^(?:Correct\s*)?Answer[:\s]*([A-H])\.\s*(.+)/i, // Answer: A. Option text
    /^(?:Correct\s*)?Answer[:\s]*([A-H])\s*$/i, // Answer: A
    /^(?:Correct\s*)?Answer[:\s]*(.+)/i, // Answer: full text
    /^Ans[:\s]*([A-H])\.\s*(.+)/i, // Ans: A. Option text
    /^Ans[:\s]*([A-H])\s*$/i, // Ans: A
    /^Ans[:\s]*(.+)/i, // Ans: full text
    /^([A-H])\s*$/i, // Just letter (when context suggests it's an answer)
    /^(True|False)$/i, // True/False answers
  ];

  // Explanation patterns
  private static readonly EXPLANATION_PATTERNS = [
    /^Explanation[:\.]?\s*(.+)/i,
    /^Explain[:\.]?\s*(.+)/i,
    /^Correction[:\.]?\s*(.+)/i,
    /^Note[:\.]?\s*(.+)/i,
  ];

  // Enhanced case study patterns (everything on one or few lines)
  private static readonly CASE_STUDY_PATTERNS = [
    // NEW: Universal working pattern for all case study formats (PRIORITY #1)
    // Handles: "1. Question:I. item1...A) opt1B) opt2...Answer: XExplanation: text"
    // And: "1. Question?A. long option...B. long option...Answer: XExplanation: text"
    /^(\d+)\.\s*(.+?)Answer:\s*(.+?)(?:Explanation:\s*(.+))?$/i,

    // NEW: Simplified Roman numeral pattern that actually works!
    // "1. Question:I. item1II. item2III. item3IV. item4A) opt1B) opt2C) opt3D) opt4Answer: XExplanation: text"
    /^(\d+)\.\s*(.+?)A\)\s*(.+?)B\)\s*(.+?)C\)\s*(.+?)D\)\s*(.+?)Answer:\s*([A-D]\))\s*([^E]*?)(?:Explanation:\s*(.+))?$/i,

    // Alternative pattern for Roman numerals with more flexible spacing (fallback)
    /^(\d+)\.\s*(.+?(?:I\.\s*[^I]*?II\.\s*[^I]*?(?:III\.\s*[^I]*?)?(?:IV\.\s*[^A-H]*?)?)[^A-H]*?)\s*((?:[A-H]\)\s*[^A-H]*?){2,})\s+Answer:\s*([A-H])\)\s*([^E]*?)(?:Explanation:\s*(.+))?$/i,

    // Complete case study: "Question? A) opt B) opt C) opt D) opt Answer: X Explanation: text"
    /^(.+?\?)\s+((?:[A-H]\)\s*[^A-H]*?)+)\s+(?:Correct\s*)?Answer:\s*([A-H])\s*(?:Explanation:\s*(.+))?$/i,
    // Case study without question mark
    /^(.+?)\s+((?:[A-H]\)\s*[^A-H]*?)+)\s+(?:Correct\s*)?Answer:\s*([A-H])\s*(?:Explanation:\s*(.+))?$/i,
    // With answer containing option text: "Question A) opt B) opt C) opt D) opt Answer: A. Option text"
    /^(.+?)\s+((?:[A-H]\)\s*[^A-H]*?)+)\s+(?:Correct\s*)?Answer:\s*([A-H])\.\s*(.+?)(?:\s+Explanation:\s*(.+))?$/i,
    // True/False case study format
    /^(.+?)\s+A\)\s*(True)\s+B\)\s*(False)\s+(?:Correct\s*)?Answer:\s*(True|False|A|B)\s*(?:Explanation:\s*(.+))?$/i,
    // Enhanced patterns for case study format like your examples
    // "Which type of queuing system... A. Single waiting line... B. Multiple waiting lines... Correct Answer: A. Single waiting line..."
    /^(.+?)\s+A\.\s*([^B]+?)\s+B\.\s*([^C]+?)\s+C\.\s*([^D]+?)\s+D\.\s*([^C]+?)\s+(?:Correct\s*)?Answer:\s*([A-D])\.\s*(.+?)(?:\s*Explanation:\s*(.+))?$/i,
    // Pattern without periods: "Question A) opt1 B) opt2 C) opt3 D) opt4 Correct Answer: X"
    /^(.+?)\s+A\)\s*([^B]+?)\s+B\)\s*([^C]+?)\s+C\)\s*([^D]+?)\s+D\)\s*([^C]+?)\s+(?:Correct\s*)?Answer:\s*([A-D])\s*(.+?)?\s*(?:Explanation:\s*(.+))?$/i,
    // Flexible pattern for various formats with options and answers
    /^(.+?)\s+((?:[A-D][\.\)]\s*[^A-D]*?){2,})\s+(?:Correct\s*)?Answer:\s*([A-D])(?:\.\s*(.+?))?\s*(?:Explanation:\s*(.+))?$/i,
  ];

  // Inline option extraction patterns - Enhanced for better detection
  private static readonly INLINE_OPTION_PATTERNS = [
    /([A-H])\)\s*([^A-H]*?)(?=\s*[A-H]\)|$)/gi, // A) text before next B) or end
    /([A-H])\.\s*([^A-H]*?)(?=\s*[A-H]\.|$)/gi, // A. text before next B. or end
    /([A-H])\s*[-–—]\s*([^A-H]*?)(?=\s*[A-H]\s*[-–—]|$)/gi, // A - text before next B - or end
  ];

  /**
   * NEW: Multi-line case study parser specifically for separated format
   * Handles format like:
   * "1. Question text
   *  I. Roman numeral item
   *  II. Another item
   *  A) Option 1
   *  B) Option 2
   *  Answer: B) Option 2
   *  Explanation: text"
   */
  private static parseMultiLineCaseStudy(text: string): ParsedQuiz {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const questions: ParsedQuestion[] = [];
    const errors: ValidationError[] = [];

    interface TempQuestion {
      number: number;
      question: string;
      options: { letter: string; text: string }[];
      correctAnswer: string;
      explanation: string;
      type: "mcq" | "trueFalse" | "shortAnswer";
    }

    let currentQuestion: Partial<TempQuestion> | null = null;
    let currentSection:
      | "question"
      | "romans"
      | "options"
      | "answer"
      | "explanation" = "question";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for question start
      const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (questionMatch) {
        // Save previous question
        if (currentQuestion && this.isValidMultiLineQuestion(currentQuestion)) {
          const validated = this.validateMultiLineQuestion(
            currentQuestion,
            questions.length + 1
          );
          if (validated.isValid && validated.question) {
            questions.push(validated.question);
          } else {
            errors.push({
              questionNumber: questions.length + 1,
              error: validated.errors.join("; ") || "Unknown validation error",
            });
          }
        }

        // Start new question
        currentQuestion = {
          number: parseInt(questionMatch[1]),
          question: questionMatch[2],
          options: [],
          correctAnswer: "",
          explanation: "",
          type: "mcq",
        };
        currentSection = "question";
        continue;
      }

      if (!currentQuestion) continue;

      // Check for Roman numerals (case study items)
      const romanMatch = line.match(/^([IVX]+)\.\s+(.+)$/);
      if (romanMatch) {
        // Add Roman numeral items to question text
        if (!currentQuestion.question!.includes("I.")) {
          currentQuestion.question += "\n" + line;
        } else {
          currentQuestion.question += " " + line;
        }
        currentSection = "romans";
        continue;
      }

      // Check for options
      const optionMatch = line.match(/^([A-H])\)\s+(.+)$/);
      if (optionMatch) {
        if (!currentQuestion.options) currentQuestion.options = [];
        currentQuestion.options.push({
          letter: optionMatch[1],
          text: optionMatch[2].trim(),
        });
        currentSection = "options";
        continue;
      }

      // Check for answer
      const answerMatch = line.match(/^Answer:\s*(.+)$/);
      if (answerMatch) {
        currentQuestion.correctAnswer = answerMatch[1].trim();
        currentSection = "answer";
        continue;
      }

      // Check for explanation
      const explanationMatch = line.match(/^Explanation:\s*(.+)$/);
      if (explanationMatch) {
        currentQuestion.explanation = explanationMatch[1].trim();
        currentSection = "explanation";
        continue;
      }

      // Handle continuation lines
      if (
        currentSection === "explanation" &&
        line.length > 0 &&
        !line.match(/^\d+\./)
      ) {
        if (!currentQuestion.explanation) currentQuestion.explanation = "";
        currentQuestion.explanation += " " + line;
      }
    }

    // Add the last question
    if (currentQuestion && this.isValidMultiLineQuestion(currentQuestion)) {
      const validated = this.validateMultiLineQuestion(
        currentQuestion,
        questions.length + 1
      );
      if (validated.isValid && validated.question) {
        questions.push(validated.question);
      } else {
        errors.push({
          questionNumber: questions.length + 1,
          error: validated.errors.join("; ") || "Unknown validation error",
        });
      }
    }

    return {
      questions,
      metadata: {
        totalQuestions: questions.length,
        hasErrors: errors.length > 0,
        errorMessages: errors.map((e) => `Q${e.questionNumber}: ${e.error}`),
      },
    };
  }

  /**
   * Check if a multi-line question has minimum required fields
   */
  private static isValidMultiLineQuestion(question: Partial<any>): boolean {
    return !!(
      question.question &&
      question.options &&
      question.options.length >= 2 &&
      question.correctAnswer
    );
  }

  /**
   * Detect if text is in multi-line case study format
   */
  private static isMultiLineCaseStudyFormat(text: string): boolean {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    // Check for key indicators of multi-line format:
    // 1. Questions on separate lines starting with numbers
    // 2. Roman numerals on separate lines
    // 3. Options on separate lines starting with letters
    // 4. Answer lines starting with "Answer:"

    let hasNumberedQuestions = 0;
    let hasRomanNumerals = 0;
    let hasSeparateOptions = 0;
    let hasAnswerLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Count numbered questions
      if (/^\d+\.\s+/.test(trimmed)) {
        hasNumberedQuestions++;
      }

      // Count Roman numerals
      if (/^[IVX]+\.\s+/.test(trimmed)) {
        hasRomanNumerals++;
      }

      // Count separate options
      if (/^[A-H]\)\s+/.test(trimmed)) {
        hasSeparateOptions++;
      }

      // Count answer lines
      if (/^Answer:\s+/.test(trimmed)) {
        hasAnswerLines++;
      }
    }

    // Format is multi-line case study if we have:
    // - At least 1 numbered question
    // - Some Roman numerals OR separate options
    // - Some answer lines
    const isMultiLineFormat =
      hasNumberedQuestions >= 1 &&
      (hasRomanNumerals > 0 ||
        hasSeparateOptions >= hasNumberedQuestions * 2) &&
      hasAnswerLines >= 1;

    if (isMultiLineFormat) {
      console.log(
        `DEBUG: Multi-line format detected - Questions: ${hasNumberedQuestions}, Romans: ${hasRomanNumerals}, Options: ${hasSeparateOptions}, Answers: ${hasAnswerLines}`
      );
    }

    return isMultiLineFormat;
  }

  /**
   * Validate and clean up a multi-line question
   */
  private static validateMultiLineQuestion(
    question: Partial<any>,
    questionNumber: number
  ): { isValid: boolean; question?: ParsedQuestion; errors: string[] } {
    const errors: string[] = [];

    if (!question.question) {
      errors.push("Missing question text");
    }

    if (!question.options || question.options.length < 2) {
      errors.push("Need at least 2 options");
    }

    if (!question.correctAnswer) {
      errors.push("Missing answer");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Clean up and parse the correct answer
    let correctAnswer = question.correctAnswer!;
    const answerLetterMatch =
      correctAnswer.match(/^([A-H])\)/) || correctAnswer.match(/^([A-H])$/);

    if (answerLetterMatch) {
      const matchingOption = question.options!.find(
        (opt: any) => opt.letter === answerLetterMatch[1]
      );
      if (matchingOption) {
        correctAnswer = matchingOption.text;
      }
    }

    const validatedQuestion: ParsedQuestion = {
      id: `q_${questionNumber}`,
      question: question.question!.trim(),
      options: question.options!.map((opt: any) => opt.text.trim()),
      correctAnswer: correctAnswer.trim(),
      explanation: question.explanation?.trim() || "",
      type: "mcq",
    };

    return { isValid: true, question: validatedQuestion, errors: [] };
  }

  /**
   * Main parsing function with multi-strategy approach
   */
  static parseQuizText(text: string): ParsedQuiz {
    // Strategy 0: NEW - Try multi-line case study parsing first (for separated format)
    // This handles the exact format in your case study file
    if (this.isMultiLineCaseStudyFormat(text)) {
      console.log("DEBUG: Using multi-line case study parser");
      const result = this.parseMultiLineCaseStudy(text);
      if (result.questions.length > 0) {
        return result;
      }
    }

    const lines = this.preprocessText(text);
    const questions: ParsedQuestion[] = [];
    const errors: ValidationError[] = [];

    // Strategy 1: Try case study parsing (single-line questions with inline options)
    const caseStudyResult = this.parseCaseStudyFormat(lines);
    if (caseStudyResult.questions.length > 0) {
      questions.push(...caseStudyResult.questions);
      errors.push(...caseStudyResult.errors);
    }

    // Strategy 2: Parse remaining lines using traditional line-by-line approach
    const remainingLines = this.getRemainingLines(
      lines,
      caseStudyResult.processedLines
    );
    if (remainingLines.length > 0) {
      const traditionalResult = this.parseTraditionalFormat(remainingLines);
      questions.push(...traditionalResult.questions);
      errors.push(...traditionalResult.errors);
    }

    // Post-processing: validate and fix question types
    this.postProcessQuestions(questions, errors);

    return {
      questions,
      metadata: {
        totalQuestions: questions.length,
        hasErrors: errors.length > 0,
        errorMessages: errors.map((e) => `Q${e.questionNumber}: ${e.error}`),
      },
    };
  }

  /**
   * Parse case study format (inline options) - Enhanced
   */
  private static parseCaseStudyFormat(lines: string[]): {
    questions: ParsedQuestion[];
    errors: ValidationError[];
    processedLines: Set<number>;
  } {
    const questions: ParsedQuestion[] = [];
    const errors: ValidationError[] = [];
    const processedLines = new Set<number>();
    let questionNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip if already processed
      if (processedLines.has(i)) {
        continue;
      }

      // Try standard case study patterns first
      for (const pattern of this.CASE_STUDY_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          try {
            const question = this.extractCaseStudyQuestion(
              match,
              questionNumber
            );
            if (question) {
              questions.push(question);
              processedLines.add(i);
              questionNumber++;

              // Check if explanation is on next line
              if (i + 1 < lines.length && !question.explanation) {
                const nextLine = lines[i + 1];
                const explanationMatch = nextLine.match(
                  this.EXPLANATION_PATTERNS[0]
                );
                if (explanationMatch) {
                  question.explanation = explanationMatch[1];
                  processedLines.add(i + 1);
                }
              }
            }
          } catch (error) {
            errors.push({
              questionNumber,
              error: `Failed to parse case study question: ${error}`,
              line: i + 1,
            });
          }
          break;
        }
      }

      // Enhanced: Try to detect separated case study format (question on one line, options spread across multiple lines)
      if (!processedLines.has(i)) {
        const separatedFormatResult = this.tryParseSeparatedCaseStudy(lines, i);
        if (separatedFormatResult) {
          try {
            const question = this.createQuestionFromSeparatedFormat(
              separatedFormatResult,
              questionNumber
            );
            if (question) {
              questions.push(question);
              // Mark all processed lines
              for (
                let j = separatedFormatResult.startIndex;
                j <= separatedFormatResult.endIndex;
                j++
              ) {
                processedLines.add(j);
              }
              questionNumber++;
            }
          } catch (error) {
            errors.push({
              questionNumber,
              error: `Failed to parse separated case study question: ${error}`,
              line: i + 1,
            });
          }
        }
      }
    }

    return { questions, errors, processedLines };
  }

  /**
   * Try to parse separated case study format where question and options are on different lines
   * Format like:
   * "Which type of queuing system are you likely to encounter at an ATM?"
   * "A. Single waiting line, single service station"
   * "B. Multiple waiting lines, single service station"
   * "C. Single waiting line, multiple service stations"
   * "D. Multiple waiting lines, multiple service stations"
   * "Correct Answer: A. Single waiting line, single service station"
   */
  private static tryParseSeparatedCaseStudy(
    lines: string[],
    startIndex: number
  ): {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    startIndex: number;
    endIndex: number;
  } | null {
    if (startIndex >= lines.length) return null;

    const line = lines[startIndex];

    // Check if this line could be a question (doesn't start with option letter)
    if (
      this.matchOptionPattern(line) ||
      this.matchAnswerPattern(line) ||
      this.matchExplanationPattern(line)
    ) {
      return null;
    }

    // Look for a question-like line
    const isQuestionLike =
      line.includes("?") ||
      line.length > 20 ||
      /^(What|How|Why|When|Where|Which|Who)/i.test(line) ||
      /^[A-Z][^A-H\.\)]*[a-z]/.test(line); // Starts with capital, contains lowercase, not an option

    if (!isQuestionLike) return null;

    const questionText = line.trim();
    const options: string[] = [];
    let correctAnswer = "";
    let explanation = "";
    let currentIndex = startIndex + 1;

    // Look for options in subsequent lines
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex];

      // Check for option
      const optionMatch = this.matchOptionPattern(currentLine);
      if (optionMatch) {
        options.push(optionMatch.text);
        currentIndex++;
        continue;
      }

      // Check for answer
      const answerMatch = this.matchAnswerPattern(currentLine);
      if (answerMatch) {
        correctAnswer = answerMatch.text;
        currentIndex++;
        break;
      }

      // If we haven't found any options yet, this might be a continuation of the question
      if (
        options.length === 0 &&
        this.isContinuationLine(currentLine, questionText)
      ) {
        // This could be part of the question, but let's be conservative
        currentIndex++;
        continue;
      }

      // If we have options but this doesn't look like an answer or explanation, stop
      if (options.length > 0) {
        break;
      }

      currentIndex++;
    }

    // Look for explanation on the next line after answer
    if (currentIndex < lines.length) {
      const explanationMatch = this.matchExplanationPattern(
        lines[currentIndex]
      );
      if (explanationMatch) {
        explanation = explanationMatch.text;
        currentIndex++;
      }
    }

    // Must have at least 2 options to be considered MCQ
    if (options.length < 2) {
      return null;
    }

    return {
      questionText,
      options,
      correctAnswer,
      explanation: explanation || undefined,
      startIndex,
      endIndex: currentIndex - 1,
    };
  }

  /**
   * Check if a line is likely a continuation of previous content
   */
  private static isContinuationLine(
    line: string,
    previousContent: string
  ): boolean {
    // Don't consider as continuation if it looks like a structured element
    if (
      this.matchOptionPattern(line) ||
      this.matchAnswerPattern(line) ||
      this.matchExplanationPattern(line) ||
      this.matchQuestionPattern(line)
    ) {
      return false;
    }

    // Check if previous content doesn't end with punctuation and current starts with lowercase
    const prevEndsWithPunctuation = /[.!?:;]\s*$/.test(previousContent);
    const currentStartsLower = /^[a-z]/.test(line);

    return !prevEndsWithPunctuation && currentStartsLower;
  }

  /**
   * Create question from separated format parsing result
   */
  private static createQuestionFromSeparatedFormat(
    result: {
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      startIndex: number;
      endIndex: number;
    },
    questionNumber: number
  ): ParsedQuestion | null {
    if (!result.questionText || result.options.length === 0) {
      return null;
    }

    // Determine question type
    let type: "mcq" | "trueFalse" | "shortAnswer" = "mcq";

    if (
      result.options.length === 2 &&
      result.options.some((opt) => /^true$/i.test(opt.trim())) &&
      result.options.some((opt) => /^false$/i.test(opt.trim()))
    ) {
      type = "trueFalse";
      result.options = ["True", "False"];
    }

    // Normalize correct answer
    const normalizedAnswer = this.normalizeCorrectAnswer(
      result.correctAnswer,
      result.options,
      type
    );

    return {
      id: `robust_separated_${questionNumber}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      question: result.questionText,
      type,
      options: result.options,
      correctAnswer: normalizedAnswer,
      explanation: result.explanation,
    };
  }
  /**
   * Extract question from case study match - Enhanced for multiple formats
   */
  private static extractCaseStudyQuestion(
    match: RegExpMatchArray,
    questionNumber: number
  ): ParsedQuestion | null {
    let questionText = "";
    let options: string[] = [];
    let correctAnswer = "";
    let explanation = "";

    // Check if this is our new working pattern (first pattern) - Roman numeral case studies
    if (match.length >= 4 && match[1] && match[2] && match[3]) {
      // Working pattern: "1. [content]Answer: [answer]Explanation: [explanation]"
      const content = match[2]; // Contains question + Roman numerals + options
      const answer = match[3];
      explanation = match[4] || "";

      // Parse the content to extract question text, Roman numerals, and options
      const romanStart = content.search(/I\.\s*/);
      const optionsStartA = content.search(/A\)\s*/); // A) format
      const optionsStartB = content.search(/A\.\s*/); // A. format

      // Use whichever comes first (A) or A.)
      const optionsStart =
        optionsStartA > 0 && optionsStartB > 0
          ? Math.min(optionsStartA, optionsStartB)
          : Math.max(optionsStartA, optionsStartB);

      if (romanStart > 0 && optionsStart > romanStart) {
        // Extract question text (everything before Roman numerals)
        questionText = content.substring(0, romanStart).trim();

        // Extract Roman numerals section
        const romanSection = content.substring(romanStart, optionsStart).trim();

        // Extract options section
        const optionsSection = content.substring(optionsStart);

        // Parse individual options using both A) and A. formats
        const optionPatternA = /([A-E])\)\s*([^A-E]*?)(?=[A-E]\)|$)/g; // A) format
        const optionPatternB = /([A-E])\.\s*([^A-E]*?)(?=[A-E]\.|$)/g; // A. format

        let extractedOptions: string[] = [];
        let optionMatch;

        // Try A) format first
        while ((optionMatch = optionPatternA.exec(optionsSection)) !== null) {
          extractedOptions.push(optionMatch[2].trim());
        }

        // If A) format didn't work, try A. format
        if (extractedOptions.length < 2) {
          extractedOptions = [];
          optionPatternB.lastIndex = 0; // Reset regex
          while ((optionMatch = optionPatternB.exec(optionsSection)) !== null) {
            extractedOptions.push(optionMatch[2].trim());
          }
        }

        if (extractedOptions.length >= 2) {
          options = extractedOptions;

          // Add Roman numerals to question text for context
          questionText = `${questionText}\n${romanSection}`;

          // Parse the answer
          correctAnswer = answer.trim();

          // Extract answer letter if it's in "B) text" or "B" format
          const answerLetterMatch =
            correctAnswer.match(/^([A-E])\)/) ||
            correctAnswer.match(/^([A-E])$/);
          if (answerLetterMatch) {
            const letterIndex = answerLetterMatch[1].charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4
            if (letterIndex >= 0 && letterIndex < options.length) {
              correctAnswer = options[letterIndex];
            }
          }

          // Return the parsed question
          return {
            id: `robust_${questionNumber}_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            question: questionText,
            type: "mcq",
            options,
            correctAnswer,
            explanation: explanation.trim(),
          };
        }
      }

      // If Roman numeral parsing failed, try to handle as simple case study
      // Check if it has A) B) C) D) or A. B. C. D. pattern without Roman numerals
      const simpleOptionsStartA = content.search(/A\)\s*/);
      const simpleOptionsStartB = content.search(/A\.\s*/);
      const simpleOptionsStart =
        simpleOptionsStartA > 0 && simpleOptionsStartB > 0
          ? Math.min(simpleOptionsStartA, simpleOptionsStartB)
          : Math.max(simpleOptionsStartA, simpleOptionsStartB);

      if (simpleOptionsStart > 0) {
        questionText = content.substring(0, simpleOptionsStart).trim();
        const optionsSection = content.substring(simpleOptionsStart);

        // Parse options using both formats
        const optionPatternA = /([A-E])\)\s*([^A-E]*?)(?=[A-E]\)|$)/g; // A) format
        const optionPatternB = /([A-E])\.\s*([^A-E]*?)(?=[A-E]\.|$)/g; // A. format

        let extractedOptions: string[] = [];
        let optionMatch;

        // Try A) format first
        while ((optionMatch = optionPatternA.exec(optionsSection)) !== null) {
          extractedOptions.push(optionMatch[2].trim());
        }

        // If A) format didn't work, try A. format
        if (extractedOptions.length < 2) {
          extractedOptions = [];
          optionPatternB.lastIndex = 0; // Reset regex
          while ((optionMatch = optionPatternB.exec(optionsSection)) !== null) {
            extractedOptions.push(optionMatch[2].trim());
          }
        }

        if (extractedOptions.length >= 2) {
          options = extractedOptions;
          correctAnswer = answer.trim();

          // Extract answer letter if it's in "B) text" or "B" format
          const answerLetterMatch =
            correctAnswer.match(/^([A-E])\)/) ||
            correctAnswer.match(/^([A-E])$/);
          if (answerLetterMatch) {
            const letterIndex = answerLetterMatch[1].charCodeAt(0) - 65;
            if (letterIndex >= 0 && letterIndex < options.length) {
              correctAnswer = options[letterIndex];
            }
          }

          return {
            id: `robust_${questionNumber}_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            question: questionText,
            type: "mcq",
            options,
            correctAnswer,
            explanation: explanation.trim(),
          };
        }
      }
    }

    // Check if this is our new simplified Roman numeral pattern (second pattern)
    if (
      match.length >= 9 &&
      match[1] &&
      match[2] &&
      match[3] &&
      match[4] &&
      match[5] &&
      match[6]
    ) {
      // New simplified pattern: "1. Question A) opt1 B) opt2 C) opt3 D) opt4 Answer: X) text Explanation: text"
      questionText = match[2].trim(); // Question text (includes Roman numerals)
      options = [
        match[3].trim(), // Option A text
        match[4].trim(), // Option B text
        match[5].trim(), // Option C text
        match[6].trim(), // Option D text
      ];
      correctAnswer = match[7]; // Answer letter (e.g., "B)")
      const answerText = match[8]?.trim(); // Answer text
      explanation = match[9]?.trim(); // Explanation

      // Use the answer text if available, otherwise find matching option
      if (answerText && answerText.length > 1) {
        correctAnswer = answerText;
      } else {
        // Extract letter from "B)" format and find matching option
        const letterMatch = correctAnswer.match(/([A-D])/);
        if (letterMatch) {
          const letterIndex = letterMatch[1].charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          if (letterIndex >= 0 && letterIndex < options.length) {
            correctAnswer = options[letterIndex];
          }
        }
      }
    } else if (
      match.length >= 9 &&
      match[2] &&
      match[3] &&
      match[4] &&
      match[5]
    ) {
      // Enhanced pattern: A. opt1 B. opt2 C. opt3 D. opt4 format
      questionText = match[1].trim();
      options = [
        match[2].trim(),
        match[3].trim(),
        match[4].trim(),
        match[5].trim(),
      ];
      correctAnswer = match[6]; // Letter
      explanation = match[7] || match[8]; // Option text or explanation
    } else if (match.length >= 6 && match[2]) {
      // Standard inline pattern: A) opt B) opt C) opt D) opt
      questionText = match[1].trim();
      const optionsText = match[2];
      correctAnswer = match[3];
      explanation = match[4] || match[5];

      // Extract options from inline text
      options = this.extractInlineOptions(optionsText);
    } else {
      // Fallback for simpler patterns
      questionText = match[1]?.trim() || "";
      correctAnswer = match[2] || match[3] || "";
      explanation = match[4] || match[5] || "";

      // If no options extracted yet, try to find them in the match
      if (match[2] && match[2].includes(")")) {
        options = this.extractInlineOptions(match[2]);
      }
    }

    if (!questionText || options.length === 0) {
      return null;
    }

    // Determine question type
    let type: "mcq" | "trueFalse" | "shortAnswer" = "mcq";
    if (
      options.length === 2 &&
      options.some((opt) => /^true$/i.test(opt.trim())) &&
      options.some((opt) => /^false$/i.test(opt.trim()))
    ) {
      type = "trueFalse";
      options[0] = "True";
      options[1] = "False";
    }

    // Normalize correct answer
    correctAnswer = this.normalizeCorrectAnswer(correctAnswer, options, type);

    return {
      id: `robust_${questionNumber}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      question: questionText,
      type,
      options,
      correctAnswer,
      explanation: explanation?.trim(),
    };
  }

  /**
   * Extract options from inline text like "A) option1 B) option2 C) option3 D) option4"
   * Enhanced to handle different formats including "A. option1 B. option2"
   */
  private static extractInlineOptions(optionsText: string): string[] {
    const options: string[] = [];

    // Try each pattern to extract options
    for (const pattern of this.INLINE_OPTION_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      const matches: RegExpExecArray[] = [];
      let match;

      while ((match = pattern.exec(optionsText)) !== null) {
        matches.push(match);
        if (!pattern.global) break; // Prevent infinite loop for non-global regex
      }

      if (matches.length >= 2) {
        // Need at least 2 options
        options.length = 0; // Clear previous attempts

        for (const match of matches) {
          const optionText = match[2].trim();
          if (optionText) {
            options.push(optionText);
          }
        }

        if (options.length >= 2) {
          break; // Found a good match, stop trying other patterns
        }
      }
    }

    // Special handling for the "A. text B. text C. text D. text" format from case studies
    if (options.length === 0) {
      // Try to split by letter patterns manually for edge cases
      const manualPattern = /([A-D])\.\s*([^A-D]+?)(?=\s*[A-D]\.|$)/gi;
      manualPattern.lastIndex = 0;
      const manualMatches: RegExpExecArray[] = [];
      let manualMatch;

      while ((manualMatch = manualPattern.exec(optionsText)) !== null) {
        manualMatches.push(manualMatch);
      }

      if (manualMatches.length >= 2) {
        for (const match of manualMatches) {
          const optionText = match[2].trim();
          if (optionText) {
            options.push(optionText);
          }
        }
      }
    }

    return options;
  }

  /**
   * Parse traditional format (separate lines for question, options, answer)
   */
  private static parseTraditionalFormat(lines: string[]): {
    questions: ParsedQuestion[];
    errors: ValidationError[];
  } {
    const questions: ParsedQuestion[] = [];
    const errors: ValidationError[] = [];

    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let questionNumber = 1;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      if (!trimmedLine) continue;

      // Try to match question
      const questionMatch = this.matchQuestionPattern(trimmedLine);
      if (questionMatch) {
        // Finalize previous question
        if (currentQuestion) {
          this.finalizeQuestion(
            currentQuestion,
            questions,
            errors,
            questionNumber - 1,
            lineNumber - 1
          );
        }

        // Start new question
        questionNumber = questionMatch.number || questionNumber;
        currentQuestion = {
          id: `robust_${questionNumber}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          question: questionMatch.text,
          options: [],
          type: "mcq",
        };
        questionNumber++;
        continue;
      }

      if (currentQuestion) {
        // Try to match option
        const optionMatch = this.matchOptionPattern(trimmedLine);
        if (optionMatch) {
          currentQuestion.options!.push(optionMatch.text);
          continue;
        }

        // Try to match answer
        const answerMatch = this.matchAnswerPattern(trimmedLine);
        if (answerMatch) {
          currentQuestion.correctAnswer = answerMatch.text;
          continue;
        }

        // Try to match explanation
        const explanationMatch = this.matchExplanationPattern(trimmedLine);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch.text;
          continue;
        }

        // Handle multi-line continuations
        if (this.isLineContinuation(trimmedLine, currentQuestion)) {
          this.appendToContinuation(trimmedLine, currentQuestion);
        }
      }
    }

    // Finalize last question
    if (currentQuestion) {
      this.finalizeQuestion(
        currentQuestion,
        questions,
        errors,
        questionNumber - 1,
        lineNumber
      );
    }

    return { questions, errors };
  }

  /**
   * Get lines that weren't processed by case study parser
   */
  private static getRemainingLines(
    lines: string[],
    processedLines: Set<number>
  ): string[] {
    return lines.filter((_, index) => !processedLines.has(index));
  }

  /**
   * Match question patterns
   */
  private static matchQuestionPattern(
    line: string
  ): { number?: number; text: string } | null {
    for (const pattern of this.QUESTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        if (match[1] && /^\d+$/.test(match[1])) {
          return { number: parseInt(match[1]), text: match[2].trim() };
        } else {
          return { text: (match[2] || match[1]).trim() };
        }
      }
    }
    return null;
  }

  /**
   * Match option patterns
   */
  private static matchOptionPattern(
    line: string
  ): { letter: string; text: string } | null {
    for (const pattern of this.OPTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        return { letter: match[1].toUpperCase(), text: match[2].trim() };
      }
    }
    return null;
  }

  /**
   * Match answer patterns with enhanced logic
   */
  private static matchAnswerPattern(line: string): { text: string } | null {
    for (const pattern of this.ANSWER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        // For patterns that capture both letter and text, prefer the full text
        if (match[2]) {
          return { text: match[2].trim() };
        } else {
          return { text: match[1].trim() };
        }
      }
    }
    return null;
  }

  /**
   * Match explanation patterns
   */
  private static matchExplanationPattern(
    line: string
  ): { text: string } | null {
    for (const pattern of this.EXPLANATION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        return { text: match[1].trim() };
      }
    }
    return null;
  }

  /**
   * Check if line is a continuation of previous content
   */
  private static isLineContinuation(
    line: string,
    question: Partial<ParsedQuestion>
  ): boolean {
    // Don't treat as continuation if it looks like a new element
    if (
      this.matchQuestionPattern(line) ||
      this.matchOptionPattern(line) ||
      this.matchAnswerPattern(line) ||
      this.matchExplanationPattern(line)
    ) {
      return false;
    }

    // Check if it's a reasonable continuation (starts with lowercase, doesn't end with punctuation in previous line, etc.)
    if (
      question.question &&
      !/[.!?]$/.test(question.question) &&
      /^[a-z]/.test(line)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Append line to appropriate continuation
   */
  private static appendToContinuation(
    line: string,
    question: Partial<ParsedQuestion>
  ): void {
    if (question.explanation && !/[.!?]$/.test(question.explanation)) {
      question.explanation += " " + line;
    } else if (
      question.correctAnswer &&
      !/[.!?]$/.test(question.correctAnswer)
    ) {
      question.correctAnswer += " " + line;
    } else if (question.options && question.options.length > 0) {
      const lastOption = question.options[question.options.length - 1];
      if (!/[.!?]$/.test(lastOption)) {
        question.options[question.options.length - 1] = lastOption + " " + line;
      }
    } else if (question.question && !/[.!?]$/.test(question.question)) {
      question.question += " " + line;
    }
  }

  /**
   * Normalize correct answer to match options
   */
  private static normalizeCorrectAnswer(
    answer: string,
    options: string[],
    type: "mcq" | "trueFalse" | "shortAnswer"
  ): string {
    if (!answer) return "";

    answer = answer.trim();

    // For True/False questions
    if (type === "trueFalse") {
      if (/^(true|a)$/i.test(answer)) return "True";
      if (/^(false|b)$/i.test(answer)) return "False";
      return answer;
    }

    // For MCQ questions
    if (type === "mcq" && options.length > 0) {
      // Try exact match first
      const exactMatch = options.find(
        (opt) => opt.toLowerCase().trim() === answer.toLowerCase().trim()
      );
      if (exactMatch) return exactMatch;

      // Try letter-based matching (A, B, C, D)
      if (/^[A-H]$/i.test(answer)) {
        const letterIndex =
          answer.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        if (letterIndex >= 0 && letterIndex < options.length) {
          return options[letterIndex];
        }
      }

      // Try to match by removing letter prefix from answer
      const letterPrefixMatch = answer.match(/^[A-H][\.\)]\s*(.+)/i);
      if (letterPrefixMatch) {
        const textPart = letterPrefixMatch[1].trim();
        const textMatch = options.find(
          (opt) => opt.toLowerCase().trim() === textPart.toLowerCase().trim()
        );
        if (textMatch) return textMatch;
      }
    }

    return answer;
  }

  /**
   * Post-process questions to fix types and validate
   */
  private static postProcessQuestions(
    questions: ParsedQuestion[],
    errors: ValidationError[]
  ): void {
    questions.forEach((question, index) => {
      // Fix question type based on options
      if (
        question.options.length === 2 &&
        question.options.some((opt) => /^true$/i.test(opt.trim())) &&
        question.options.some((opt) => /^false$/i.test(opt.trim()))
      ) {
        question.type = "trueFalse";
        question.options = ["True", "False"];
      } else if (question.options.length >= 2) {
        question.type = "mcq";
      } else if (question.options.length === 0) {
        // Only classify as shortAnswer if there are truly no options detected
        question.type = "shortAnswer";
        question.options = [];
      }

      // Validate question
      if (!question.question?.trim()) {
        errors.push({
          questionNumber: index + 1,
          error: "Missing question text",
        });
      }

      if (!question.correctAnswer?.trim()) {
        errors.push({
          questionNumber: index + 1,
          error: "Missing correct answer",
        });
      }

      if (question.type === "mcq" && question.options.length < 2) {
        errors.push({
          questionNumber: index + 1,
          error: "MCQ questions must have at least 2 options",
        });
      }

      // Ensure correct answer matches one of the options for MCQ
      if (
        question.type === "mcq" &&
        question.options.length > 0 &&
        question.correctAnswer
      ) {
        const answerExists = question.options.some(
          (opt) =>
            opt.toLowerCase().trim() ===
            question.correctAnswer.toLowerCase().trim()
        );

        if (!answerExists) {
          // Try to fix by re-normalizing
          const normalized = this.normalizeCorrectAnswer(
            question.correctAnswer,
            question.options,
            question.type
          );
          if (normalized !== question.correctAnswer) {
            question.correctAnswer = normalized;
          } else {
            errors.push({
              questionNumber: index + 1,
              error: `Correct answer "${question.correctAnswer}" does not match any option`,
            });
          }
        }
      }
    });
  }

  /**
   * Finalize and validate a question
   */
  private static finalizeQuestion(
    question: Partial<ParsedQuestion>,
    questions: ParsedQuestion[],
    errors: ValidationError[],
    questionNumber: number,
    lineNumber: number
  ): void {
    if (!question.question || !question.correctAnswer) {
      errors.push({
        questionNumber,
        error: "Incomplete question data",
        line: lineNumber,
      });
      return;
    }

    // Determine final type
    let type: "mcq" | "trueFalse" | "shortAnswer" = "shortAnswer";

    if (question.options && question.options.length >= 2) {
      if (
        question.options.length === 2 &&
        question.options.some((opt) => /^true$/i.test(opt.trim())) &&
        question.options.some((opt) => /^false$/i.test(opt.trim()))
      ) {
        type = "trueFalse";
      } else {
        type = "mcq";
      }
    }

    const finalQuestion: ParsedQuestion = {
      id: question.id!,
      question: question.question,
      type,
      options: question.options || [],
      correctAnswer: this.normalizeCorrectAnswer(
        question.correctAnswer,
        question.options || [],
        type
      ),
      explanation: question.explanation,
    };

    questions.push(finalQuestion);
  }

  /**
   * Preprocess text to normalize formatting
   */
  private static preprocessText(text: string): string[] {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  /**
   * Analyze parsing results
   */
  static analyzeResults(result: ParsedQuiz): {
    summary: {
      totalQuestions: number;
      successfullyParsed: number;
      errorRate: number;
      byType: { [key: string]: number };
    };
    recommendations: string[];
  } {
    const byType = result.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const recommendations: string[] = [];

    if (result.metadata.hasErrors) {
      recommendations.push(
        "Consider reviewing the original text formatting for better parsing results."
      );
    }

    if (byType.shortAnswer && byType.shortAnswer > (byType.mcq || 0)) {
      recommendations.push(
        "Many questions were classified as short answer. Ensure options are clearly formatted (A) Option, B) Option, etc.)."
      );
    }

    if (!byType.mcq && !byType.trueFalse) {
      recommendations.push(
        "No multiple choice questions detected. Check that options follow patterns like 'A) Option text'."
      );
    }

    return {
      summary: {
        totalQuestions: result.questions.length,
        successfullyParsed:
          result.questions.length - result.metadata.errorMessages.length,
        errorRate:
          result.metadata.errorMessages.length /
          Math.max(result.questions.length, 1),
        byType,
      },
      recommendations,
    };
  }
}

// Export function for compatibility with existing code
export const parseQuizTextRobust = (text: string): ParsedQuiz => {
  return RobustQuizParser.parseQuizText(text);
};

// Convert to app format (compatible with existing code)
export const convertToQuizFormatRobust = (
  parsedQuiz: ParsedQuiz,
  metadata: {
    title: string;
    difficulty: string;
    feedbackMode: string;
    userId: string;
  }
) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 9);

  return {
    id: `robust_imported_${timestamp}_${randomSuffix}`,
    userId: metadata.userId,
    prompt: metadata.title,
    difficulty: metadata.difficulty,
    feedbackMode: metadata.feedbackMode,
    questionCount: parsedQuiz.questions.length,
    createdAt: new Date().toISOString(),
    fromAIImport: true,
    questions: parsedQuiz.questions.map((q, index) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
      difficulty: metadata.difficulty,
      index: index,
    })),
  };
};
