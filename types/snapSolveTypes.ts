export type SolutionFormat =
  | "step-by-step" // Math, Physics, Chemistry with detailed steps
  | "direct-answer" // Theory, History, Literature - just answer + explanation
  | "tabular" // General data analysis with tables
  | "accounting" // Specialized accounting format with proper financial statement structures
  | "code" // Programming questions with code blocks
  | "formula" // Mathematical formulas with LaTeX
  | "visual" // Diagrams, charts, visual explanations
  | "comparison" // Side-by-side comparisons
  | "multiple-choice" // Multiple choice questions from papers/worksheets
  | "multi-question" // Multiple questions of any type in single image
  | "multi-math"; // Multiple math questions with enhanced step-by-step solutions

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
  footNote?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  explanation?: string;
}

export interface ComparisonData {
  leftTitle: string;
  rightTitle: string;
  items: {
    category: string;
    left: string;
    right: string;
  }[];
}

export interface MultipleChoiceQuestion {
  questionNumber: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string; // Optional 5th option
  };
  correctAnswer: string; // 'A', 'B', 'C', 'D', or 'E'
  explanation: string;
}

export interface MultiQuestion {
  questionNumber: string;
  questionText: string;
  answer: string;
  explanation: string;
  questionType?: string; // For mixed question types
}

// Accounting-specific interfaces
export interface AccountingEntry {
  account: string;
  amount: string;
  side: "Dr" | "Cr";
}

export interface JournalEntry {
  date: string;
  debit: { account: string; amount: string };
  credit: { account: string; amount: string };
  narration: string;
}

export interface LedgerAccount {
  accountName: string;
  entries: {
    debit: { description: string; amount: string; date?: string }[];
    credit: { description: string; amount: string; date?: string }[];
  };
  balance: { side: "Dr" | "Cr"; amount: string };
}

export interface FinancialStatement {
  title: string;
  period: string;
  format: "T-account" | "Vertical" | "Horizontal";
  content: {
    headers: string[];
    sections: {
      sectionTitle: string;
      items: { description: string; amount: string }[];
      sectionTotal?: { description: string; amount: string };
    }[];
    finalTotal?: { description: string; amount: string };
  };
}

export interface EnhancedSolutionType {
  id: string;
  solutionFormat: SolutionFormat;

  // Step-by-step solutions
  steps?: string[];

  // Tabular data
  tables?: TableData[];

  // Code solutions
  codeBlocks?: CodeBlock[];

  // Comparison data
  comparisons?: ComparisonData[];

  // Multiple choice questions
  multipleChoiceQuestions?: MultipleChoiceQuestion[];

  // Multi-question solutions (for theory papers, etc.)
  multiQuestions?: MultiQuestion[];

  // Accounting-specific data
  financialStatements?: FinancialStatement[];
  ledgerAccounts?: LedgerAccount[];
  journalEntries?: JournalEntry[];
  accountingType?: string; // e.g., "financial-statements", "journal-entries", etc.
  question?: string; // The question text for accounting problems
  solution?: {
    approach?: string;
    workings?: {
      title: string;
      content: string;
    }[];
  };

  // Visual elements
  diagrams?: string[]; // Base64 encoded images or descriptions

  // Core solution data
  finalAnswer: string;
  explanation: string;
  is_bookmarked: number;

  // Additional metadata
  questionType: string;
  subject?: string;
  difficulty?: "easy" | "medium" | "hard";
  keywords?: string[];
}

// Legacy support
export interface SolutionType {
  id: string;
  steps: string[];
  finalAnswer: string;
  is_bookmarked: number;
  explanation: string;
}

// Props for all display components
export interface SolutionDisplayProps {
  solution: EnhancedSolutionType;
  isDark: boolean;
  onAskFollowUp: () => void;
  onTrySimilar: () => void;
  onBookmark: (solutionId: string, isBookmarked: boolean) => Promise<any>;
  onSolveAnother: () => void;
  isBookmarked?: boolean;
}
