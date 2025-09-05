import {
  ParsedQuestion,
  ParsedQuiz,
  ValidationError,
} from "../../types/quizParserTypes";

/**
 * Advanced parser designed to handle a wider variety of quiz text formats
 * with improved contextual understanding and error recovery.
 */
export class AdvancedQuizParser {
  // New patterns and logic will go here
  // This will be more stateful and less line-by-line regex dependent
  // It will try to build a question object incrementally

  private static readonly QUESTION_STARTERS = [
    /^Q(\d+)[:\.\)]?\s*(.+)/i, // Q1) Question, Q1: Question, Q1. Question
    /^Question\s*(\d+)[:\.\)]?\s*(.+)/i, // Question 1) Question, Question 1: Question
    /^(\d+)[:\.\)]?\s*(.+)/i, // 1) Question, 1: Question, 1. Question
    /^What\s+(.+)/i, // What is...
    /^How\s+(.+)/i, // How does...
    /^Why\s+(.+)/i, // Why is...
    /^When\s+(.+)/i, // When did...
    /^Where\s+(.+)/i, // Where is...
    /^Which\s+(.+)/i, // Which of the following...
    /^Who\s+(.+)/i, // Who is...
    /^True\s+or\s+False[:\.]?\s*(.+)/i, // True or False: statement
  ];

  private static readonly OPTION_STARTERS = [
    /^([A-Ha-h])\)\s*(.+)/i, // A) Option or a) Option
    /^([A-Ha-h])\.\s*(.+)/i, // A. Option or a. Option
    /^\(([A-Ha-h])\)\s*(.+)/i, // (A) Option or (a) Option
    /^([A-Ha-h])\s*[-–—]\s*(.+)/i, // A - Option or a - Option
    /^([A-Ha-h]):\s*(.+)/i, // A: Option or a: Option
  ];

  private static readonly ANSWER_STARTERS = [
    /^Answer[:\s=]*(.+)/i, // Answer: [full answer text]
    /^Ans[:\s=]*(.+)/i, // Ans: [full answer text]
    /^Correct[:\s=]*(.+)/i, // Correct: [full answer text]
    /^Weight[:\s=]*(.+)/i, // NEW: For "Weight: " prefix
  ];

  private static readonly EXPLANATION_STARTERS = [
    /^Explanation[:\.]?\s*(.+)/i,
    /^Explain[:\.]?\s*(.+)/i,
  ];

  /**
   * Main parsing function for the AdvancedQuizParser.
   * It processes the text line by line, building questions incrementally.
   */
  static parse(text: string): ParsedQuiz {
    const lines = this.preprocessText(text);
    const questions: ParsedQuestion[] = [];
    const errors: ValidationError[] = [];

    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let currentQuestionNumber = 0;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        continue;
      }

      // 1. Try to match a new question
      const questionMatch = this.matchQuestionStarter(trimmedLine);
      if (questionMatch) {
        // If there's a current question, finalize it
        if (currentQuestion) {
          this.finalizeQuestion(
            currentQuestion,
            questions,
            errors,
            currentQuestionNumber,
            lineNumber - 1
          );
        }

        currentQuestionNumber = questionMatch.number;
        currentQuestion = {
          id: `adv_imported_${currentQuestionNumber}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          question: questionMatch.text,
          options: [],
          type: "mcq", // Default, will be refined later
        };
        continue;
      }

      // If we have a current question, try to parse its components
      if (currentQuestion) {
        // 2. Try to match options
        const optionMatch = this.matchOptionStarter(trimmedLine);
        if (optionMatch) {
          currentQuestion.options!.push(optionMatch.text);
          continue;
        }

        // 3. Try to match answer
        const answerMatch = this.matchAnswerStarter(trimmedLine);
        if (answerMatch) {
          currentQuestion.correctAnswer = answerMatch.text;
          continue;
        }

        // 4. Try to match explanation
        const explanationMatch = this.matchExplanationStarter(trimmedLine);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch.text;
          continue;
        }

        // 5. Handle multi-line questions/options/answers/explanations
        // Helper to check if a line is a likely continuation
        const isContinuation = (prevLine: string) => {
          const prevLastChar = prevLine.slice(-1);
          const prevEndsWithPunctuation = /[.?!]$/.test(prevLastChar);
          const currentStartsWithLowercase = /^[a-z]/.test(trimmedLine);
          // A line is a continuation if the previous line doesn't end with punctuation
          // AND the current line starts with a lowercase letter (or is very short and not a new element)
          return (
            (!prevEndsWithPunctuation && currentStartsWithLowercase) ||
            (!prevEndsWithPunctuation &&
              trimmedLine.length < 50 &&
              !this.matchQuestionStarter(trimmedLine) &&
              !this.matchOptionStarter(trimmedLine) &&
              !this.matchAnswerStarter(trimmedLine) &&
              !this.matchExplanationStarter(trimmedLine))
          );
        };

        // If we are currently parsing a question and the line looks like a continuation
        if (
          currentQuestion.question &&
          isContinuation(currentQuestion.question) &&
          !this.matchOptionStarter(trimmedLine) &&
          !this.matchAnswerStarter(trimmedLine) &&
          !this.matchExplanationStarter(trimmedLine)
        ) {
          currentQuestion.question += " " + trimmedLine;
        }
        // If we are currently parsing options and the line looks like a continuation of the last option
        else if (
          currentQuestion.options!.length > 0 &&
          isContinuation(
            currentQuestion.options![currentQuestion.options!.length - 1]
          ) &&
          !this.matchAnswerStarter(trimmedLine) &&
          !this.matchExplanationStarter(trimmedLine)
        ) {
          currentQuestion.options![currentQuestion.options!.length - 1] +=
            " " + trimmedLine;
        }
        // If we are currently parsing an answer and the line looks like a continuation
        else if (
          currentQuestion.correctAnswer &&
          isContinuation(currentQuestion.correctAnswer) &&
          !this.matchExplanationStarter(trimmedLine)
        ) {
          currentQuestion.correctAnswer += " " + trimmedLine;
        }
        // If we are currently parsing an explanation and the line looks like a continuation
        else if (
          currentQuestion.explanation &&
          isContinuation(currentQuestion.explanation)
        ) {
          currentQuestion.explanation += " " + trimmedLine;
        }
        // Fallback to original logic if no specific continuation rule applies but no new element is found
        else if (
          !this.matchQuestionStarter(trimmedLine) &&
          !this.matchOptionStarter(trimmedLine) &&
          !this.matchAnswerStarter(trimmedLine) &&
          !this.matchExplanationStarter(trimmedLine)
        ) {
          // This is the original "append if nothing else matches" logic, but now it's a last resort
          // It might indicate a new, unrecognized element or a very malformed continuation
          // For now, we'll keep it as a general append to the question if no other element is active
          if (
            currentQuestion.question &&
            !currentQuestion.options?.length &&
            !currentQuestion.correctAnswer &&
            !currentQuestion.explanation
          ) {
            currentQuestion.question += " " + trimmedLine;
          }
        }
      }
    }

    // Finalize the last question
    if (currentQuestion) {
      this.finalizeQuestion(
        currentQuestion,
        questions,
        errors,
        currentQuestionNumber,
        lineNumber
      );
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

  private static preprocessText(text: string): string[] {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private static matchQuestionStarter(
    line: string
  ): { number: number; text: string } | null {
    for (const pattern of this.QUESTION_STARTERS) {
      const match = line.match(pattern);
      if (match) {
        const number =
          parseInt(match[1]) ||
          (match[0].toLowerCase().includes("true or false") ? 0 : 0); // Handle unnumbered or True/False
        const text = match[2] || match[0];
        return { number, text: text.trim() };
      }
    }
    return null;
  }

  private static matchOptionStarter(
    line: string
  ): { letter: string; text: string } | null {
    for (const pattern of this.OPTION_STARTERS) {
      const match = line.match(pattern);
      if (match) {
        return { letter: match[1].toUpperCase(), text: match[2].trim() };
      }
    }
    return null;
  }

  private static matchAnswerStarter(line: string): { text: string } | null {
    for (const pattern of this.ANSWER_STARTERS) {
      const match = line.match(pattern);
      if (match) {
        return { text: match[1].trim() };
      }
    }
    return null;
  }

  private static matchExplanationStarter(
    line: string
  ): { text: string } | null {
    for (const pattern of this.EXPLANATION_STARTERS) {
      const match = line.match(pattern);
      if (match) {
        return { text: match[1].trim() };
      }
    }
    return null;
  }

  private static finalizeQuestion(
    question: Partial<ParsedQuestion>,
    questions: ParsedQuestion[],
    errors: ValidationError[],
    questionNumber: number,
    lineNumber: number
  ) {
    // Refine question type
    if (question.question && /true\s+or\s+false/i.test(question.question)) {
      question.type = "trueFalse";
      if (!question.options || question.options.length === 0) {
        question.options = ["True", "False"];
      }
    } else if (question.options && question.options.length > 0) {
      question.type = "mcq";
    } else {
      question.type = "shortAnswer";
    }

    // Validate and push
    if (!question.question) {
      errors.push({
        questionNumber,
        error: "Missing question text",
        line: lineNumber,
      });
      return;
    }
    if (!question.correctAnswer) {
      errors.push({
        questionNumber,
        error: "Missing answer",
        line: lineNumber,
      });
      return;
    }
    if (question.type === "mcq" && question.options!.length < 2) {
      errors.push({
        questionNumber,
        error: "MCQ questions need at least 2 options",
        line: lineNumber,
      });
      return;
    }

    // Ensure correct answer is one of the options for MCQ
    if (question.type === "mcq" && question.options && question.correctAnswer) {
      let rawCorrectAnswer = question.correctAnswer.trim();
      let answerFound = false;

      // Function to normalize text for comparison
      const normalizeText = (text: string) =>
        text
          .replace(/^[A-Ha-h][\)\.]\s*/i, "")
          .trim()
          .toLowerCase();

      // 1. Try to match the raw answer directly with options (case-insensitive, trimmed)
      const exactMatch = question.options.find(
        (opt) => opt.trim().toLowerCase() === rawCorrectAnswer.toLowerCase()
      );
      if (exactMatch) {
        question.correctAnswer = exactMatch;
        answerFound = true;
      }

      // 2. If not found, try to normalize the raw answer and match with normalized options
      if (!answerFound) {
        const normalizedRawAnswer = normalizeText(rawCorrectAnswer);
        const normalizedOptionMatch = question.options.find(
          (opt) => normalizeText(opt) === normalizedRawAnswer
        );
        if (normalizedOptionMatch) {
          question.correctAnswer = normalizedOptionMatch;
          answerFound = true;
        }
      }

      // 3. If still not found, and raw answer is a single letter, try to match by letter index
      if (!answerFound && rawCorrectAnswer.match(/^[A-Ha-h]$/i)) {
        const letter = rawCorrectAnswer.toUpperCase();
        const letterIndex = letter.charCodeAt(0) - "A".charCodeAt(0);
        if (letterIndex >= 0 && letterIndex < question.options.length) {
          question.correctAnswer = question.options[letterIndex];
          answerFound = true;
        }
      }

      // 4. If still not found, and raw answer starts with a letter and text (e.g., "b) text"), try to match the text part
      if (!answerFound) {
        const letterPrefixMatch = rawCorrectAnswer.match(
          /^([A-Ha-h])[\)\.]\s*(.*)/i
        );
        if (letterPrefixMatch) {
          const textPart = letterPrefixMatch[2].trim();
          const normalizedTextPart = normalizeText(textPart);
          const normalizedOptionMatch = question.options.find(
            (opt) => normalizeText(opt) === normalizedTextPart
          );
          if (normalizedOptionMatch) {
            question.correctAnswer = normalizedOptionMatch;
            answerFound = true;
          }
        }
      }

      if (!answerFound) {
        errors.push({
          questionNumber,
          error: `Answer '${question.correctAnswer}' does not match any option`,
          line: lineNumber,
        });
      }
    }

    // For True/False, normalize answer
    if (question.type === "trueFalse" && question.correctAnswer) {
      if (/true/i.test(question.correctAnswer)) {
        question.correctAnswer = "True";
      } else if (/false/i.test(question.correctAnswer)) {
        question.correctAnswer = "False";
      } else {
        errors.push({
          questionNumber,
          error: `True/False answer must be 'True' or 'False', got: '${question.correctAnswer}'`,
          line: lineNumber,
        });
      }
    }

    questions.push(question as ParsedQuestion);
  }
}
