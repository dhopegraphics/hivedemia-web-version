export interface ParsedQuestion {
  id: string;
  question: string;
  type: "mcq" | "trueFalse" | "shortAnswer";
  options: string[];
  correctAnswer: string;
  correctAnswers?: string[]; // For multiple correct answers
  explanation?: string;
}

export interface ParsedQuiz {
  questions: ParsedQuestion[];
  metadata: {
    totalQuestions: number;
    hasErrors: boolean;
    errorMessages: string[];
  };
}

export interface ValidationError {
  questionNumber: number;
  error: string;
  line?: number;
}