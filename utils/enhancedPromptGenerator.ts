import { SolutionFormat } from "@/types/snapSolveTypes";

interface PromptConfig {
  questionType: string;
  subject?: string;
  userPrompt?: string;
}

// Identify specific accounting question type
const identifyAccountingQuestionType = (
  questionText: string,
  subject?: string
): string => {
  const lowerQuestion = questionText.toLowerCase();
  const lowerSubject = subject?.toLowerCase() || "";
  const combinedText = `${lowerQuestion} ${lowerSubject}`;

  // Financial statements detection
  if (
    combinedText.includes("income statement") ||
    combinedText.includes("profit and loss") ||
    combinedText.includes("balance sheet") ||
    combinedText.includes("statement of financial position") ||
    combinedText.match(/prepare\s+.*(statement|p&l|financial statement)/)
  ) {
    return "financial-statements";
  }

  // Journal entries detection
  if (
    combinedText.includes("journal entries") ||
    combinedText.includes("journalize") ||
    combinedText.includes("correction of errors") ||
    combinedText.match(/pass\s+.*journal/)
  ) {
    return "journal-entries";
  }

  // Control accounts detection
  if (
    combinedText.includes("control account") ||
    combinedText.includes("sales ledger") ||
    combinedText.includes("purchases ledger") ||
    combinedText.includes("debtors control") ||
    combinedText.includes("creditors control")
  ) {
    return "control-accounts";
  }

  // Partnership accounting
  if (
    combinedText.includes("partnership") ||
    combinedText.includes("profit sharing") ||
    combinedText.includes("appropriation account") ||
    combinedText.includes("partner") ||
    combinedText.includes("capital account")
  ) {
    return "partnership-accounting";
  }

  // Depreciation accounting
  if (
    combinedText.includes("depreciation") ||
    combinedText.includes("straight-line") ||
    combinedText.includes("reducing balance") ||
    combinedText.includes("fixed asset") ||
    combinedText.includes("non-current asset")
  ) {
    return "depreciation";
  }

  // Incomplete records
  if (
    combinedText.includes("incomplete records") ||
    combinedText.includes("single entry") ||
    combinedText.includes("statement of affairs") ||
    combinedText.includes("missing information")
  ) {
    return "incomplete-records";
  }

  // Manufacturing accounts
  if (
    combinedText.includes("manufacturing account") ||
    combinedText.includes("production cost") ||
    combinedText.includes("cost of production") ||
    combinedText.includes("factory overhead") ||
    combinedText.includes("prime cost")
  ) {
    return "manufacturing-accounts";
  }

  // Bank reconciliation
  if (
    combinedText.includes("bank reconciliation") ||
    combinedText.includes("reconcile") ||
    combinedText.includes("cash book") ||
    combinedText.includes("bank statement")
  ) {
    return "bank-reconciliation";
  }

  // Accounting ratios
  if (
    combinedText.includes("ratio") ||
    combinedText.includes("liquidity") ||
    combinedText.includes("profitability") ||
    combinedText.includes("roce") ||
    combinedText.includes("current ratio") ||
    combinedText.includes("gearing")
  ) {
    return "accounting-ratios";
  }

  // Club/society accounting
  if (
    combinedText.includes("club") ||
    combinedText.includes("society") ||
    combinedText.includes("non-profit") ||
    combinedText.includes("income and expenditure") ||
    combinedText.includes("accumulated fund")
  ) {
    return "club-accounting";
  }

  // Default accounting type if specific type cannot be determined
  return "general-accounting";
};

// Question type to solution format mapping
const getOptimalSolutionFormat = (
  questionType: string,
  subject?: string
): SolutionFormat => {
  const lowerType = questionType.toLowerCase();
  const lowerSubject = subject?.toLowerCase() || "";

  // Multiple choice questions
  if (
    lowerType.includes("multiple choice") ||
    lowerType.includes("mcq") ||
    lowerType.includes("multiple-choice") ||
    lowerSubject.includes("mcq") ||
    lowerSubject.includes("multiple choice")
  ) {
    return "multiple-choice";
  }

  // Multi-math questions - specific case for multiple math problems
  if (
    (lowerType.includes("math") ||
      lowerType.includes("calculus") ||
      lowerType.includes("algebra") ||
      lowerType.includes("geometry") ||
      lowerType.includes("physics") ||
      lowerType.includes("chemistry")) &&
    (lowerSubject.includes("multiple") ||
      lowerSubject.includes("questions") ||
      lowerSubject.includes("problems") ||
      lowerSubject.includes("worksheet") ||
      lowerSubject.includes("paper") ||
      lowerType.includes("questions") ||
      lowerType.includes("problems"))
  ) {
    return "multi-math";
  }

  // Math-related subjects that need step-by-step
  if (
    lowerType.includes("math") ||
    lowerType.includes("calculus") ||
    lowerType.includes("algebra") ||
    lowerType.includes("geometry") ||
    lowerType.includes("physics") ||
    lowerType.includes("chemistry") ||
    lowerSubject.includes("equation")
  ) {
    return "step-by-step";
  }

  // Programming/Coding questions
  if (
    lowerType.includes("coding") ||
    lowerType.includes("programming") ||
    lowerType.includes("code") ||
    lowerSubject.includes("javascript") ||
    lowerSubject.includes("python") ||
    lowerSubject.includes("java") ||
    lowerSubject.includes("c++")
  ) {
    return "code";
  }

  // Accounting, Finance, Business questions that need specialized accounting format
  if (
    lowerType.includes("accounting") ||
    lowerType.includes("finance") ||
    lowerType.includes("business") ||
    lowerSubject.includes("balance sheet") ||
    lowerSubject.includes("income statement") ||
    lowerSubject.includes("budget") ||
    lowerSubject.includes("financial") ||
    lowerSubject.includes("accounting") ||
    lowerSubject.includes("bookkeeping") ||
    lowerSubject.includes("journal") ||
    lowerSubject.includes("ledger") ||
    lowerSubject.includes("depreciation") ||
    lowerSubject.includes("partnership") ||
    lowerSubject.includes("manufacturing account")
  ) {
    return "accounting";
  }

  // Comparison questions
  if (
    lowerType.includes("compare") ||
    lowerType.includes("versus") ||
    lowerType.includes("difference") ||
    lowerSubject.includes("compare")
  ) {
    return "comparison";
  }

  // Theory, History, Literature - check if multiple questions
  if (
    lowerType.includes("theory") ||
    lowerType.includes("history") ||
    lowerType.includes("literature") ||
    lowerType.includes("definition") ||
    lowerType.includes("explain") ||
    lowerSubject.includes("essay")
  ) {
    // If likely to be multiple questions, use multi-question format
    if (
      lowerSubject.includes("paper") ||
      lowerSubject.includes("worksheet") ||
      lowerSubject.includes("questions") ||
      lowerType.includes("questions")
    ) {
      return "multi-question";
    }
    return "direct-answer";
  }

  // Default to step-by-step for complex problems
  return "step-by-step";
};

// Generate comprehensive AI prompt based on question type
export const generateEnhancedPrompt = (config: PromptConfig): string => {
  const { questionType, subject, userPrompt } = config;
  const optimalFormat = getOptimalSolutionFormat(questionType, subject);

  // Add special warning for accounting questions to prevent truncation
  const accountingWarning =
    optimalFormat === "accounting"
      ? `

⚠️ RESPONSE LENGTH WARNING: Keep your response concise and focused. Accounting solutions tend to be lengthy - prioritize the most important elements:
1. Essential financial statements only (don't include every possible statement)
2. Key journal entries (not every minor adjustment)
3. Main calculations (avoid excessive detail in workings)
4. Focus on what the question specifically asks for

`
      : "";

  const basePrompt = `
You are Smart Hive AI, an advanced educational assistant. Analyze the attached image and provide a comprehensive solution.

Context:
- Question Type: ${questionType}
- Subject: ${subject || "Not specified"}
- Additional Context: ${userPrompt || "None"}
- Optimal Solution Format: ${optimalFormat}${accountingWarning}

CRITICAL: Return your response as a valid JSON object with the following structure based on the solution format:
`;

  const formatInstructions = {
    "step-by-step": `
{
  "solutionFormat": "step-by-step",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "steps": [
    "Step 1: Identify what is being asked...",
    "Step 2: Set up the problem...",
    "Step 3: Apply relevant formulas/concepts...",
    "Step 4: Calculate/solve...",
    "Step 5: Verify the answer..."
  ],
  "finalAnswer": "Clear, concise final answer",
  "explanation": "Why this approach works and key concepts involved",
  "keywords": ["concept1", "concept2", "formula_name"]
}`,

    "direct-answer": `
{
  "solutionFormat": "direct-answer",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "finalAnswer": "Direct, comprehensive answer to the question",
  "explanation": "Detailed explanation covering background, context, and reasoning",
  "keywords": ["key_term1", "key_term2", "important_concept"]
}`,

    tabular: `
{
  "solutionFormat": "tabular",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "tables": [
    {
      "caption": "Description of what the table shows",
      "headers": ["Column 1", "Column 2", "Column 3"],
      "rows": [
        ["Data 1A", "Data 1B", "Data 1C"],
        ["Data 2A", "Data 2B", "Data 2C"]
      ],
      "footNote": "Additional notes about the table (optional)"
    }
  ],
  "finalAnswer": "Summary conclusion based on the tabular data",
  "explanation": "Analysis and interpretation of the tabular results"
}`,

    accounting: `
{
  "solutionFormat": "accounting",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "accountingType": "${identifyAccountingQuestionType(
    questionType + " " + (subject || ""),
    subject
  )}",
  "question": "Extract the full question text from the image",
  "solution": {
    "approach": "Briefly describe the accounting approach",
    "workings": [
      {
        "title": "Main calculation or working",
        "content": "Show key calculations systematically"
      }
    ]
  },
  "finalAnswer": "Concise final answer addressing what the question asks",
  "explanation": "Brief explanation of key accounting principles used"
}

CONDITIONAL FIELDS (Include ONLY if relevant to the specific question):

IF the question asks for financial statements OR involves preparing statements:
"financialStatements": [
  {
    "title": "Income Statement" or "Balance Sheet" or "Trading Account" etc.,
    "period": "For the year ended 31 December 2024" or "As at 31 December 2024",
    "format": "Vertical",
    "content": {
      "headers": ["Description", "Amount (£)"],
      "sections": [
        {
          "sectionTitle": "Revenue",
          "items": [
            { "description": "Sales", "amount": "50,000" },
            { "description": "Less: Returns Inwards", "amount": "(2,000)" }
          ],
          "sectionTotal": { "description": "Net Sales", "amount": "48,000" }
        },
        {
          "sectionTitle": "Cost of Sales",
          "items": [
            { "description": "Opening Inventory", "amount": "5,000" },
            { "description": "Add: Purchases", "amount": "25,000" },
            { "description": "Add: Carriage Inwards", "amount": "500" },
            { "description": "Less: Returns Outwards", "amount": "(1,000)" },
            { "description": "Add: Wages", "amount": "3,000" },
            { "description": "Less: Closing Inventory", "amount": "(7,500)" }
          ],
          "sectionTotal": { "description": "Total Cost of Sales", "amount": "25,000" }
        },
        {
          "sectionTitle": "Gross Profit",
          "items": [
            { "description": "Net Sales", "amount": "48,000" },
            { "description": "Less: Cost of Sales", "amount": "(25,000)" }
          ],
          "sectionTotal": { "description": "Gross Profit", "amount": "23,000" }
        },
        {
          "sectionTitle": "Other Incomes",
          "items": [
            { "description": "Rent Received", "amount": "2,000" },
            { "description": "Interest Received", "amount": "500" },
            { "description": "Commission Received", "amount": "300" }
          ],
          "sectionTotal": { "description": "Total Other Incomes", "amount": "2,800" }
        },
        {
          "sectionTitle": "Total Gross Profit and Other Incomes",
          "items": [
            { "description": "Gross Profit", "amount": "23,000" },
            { "description": "Add: Other Incomes", "amount": "2,800" }
          ],
          "sectionTotal": { "description": "Total Gross Profit and Other Incomes", "amount": "25,800" }
        },
        {
          "sectionTitle": "Expenses",
          "items": [
            { "description": "Rent, Rates, and Insurance", "amount": "5,000" },
            { "description": "Salaries and Wages", "amount": "8,000" },
            { "description": "Motor Expenses", "amount": "1,500" },
            { "description": "Sundry Expenses", "amount": "800" },
            { "description": "Depreciation of Equipment", "amount": "2,000" },
            { "description": "Bad Debts", "amount": "500" }
          ],
          "sectionTotal": { "description": "Total Expenses", "amount": "17,800" }
        }
      ],
      "finalTotal": { "description": "Net Profit for the Year", "amount": "8,000" }
    }
  }
]

FOR SPECIFIC STATEMENT TYPES:
- Income Statement (Profit and Loss Account): EXACTLY follow this structure:
  * REVENUE SECTION: Sales → Less: Returns Inwards → Net Sales
  * COST OF SALES SECTION: Opening Inventory → Add: Purchases → Add: Carriage Inwards → Less: Returns Outwards → Add: Wages → Less: Closing Inventory
  * GROSS PROFIT: Net Sales - Cost of Sales
  * OTHER INCOMES: Add: Rent Received, Investment Income, Interest Received, Commission Received, Discounts Received
  * TOTAL GROSS PROFIT AND OTHER INCOMES
  * EXPENSES: Less: Rent/Rates/Insurance, Salaries/Wages, Motor Expenses, Sundry Expenses, Depreciation, Bad Debts, etc.
  * NET PROFIT: Total Gross Profit - Total Expenses
- Balance Sheet: Non-Current Assets → Current Assets → Less Current Liabilities → Net Assets = Capital + Retained Profits
- Trading Account: Sales → Less COGS (Op.Stock + Purchases - Cl.Stock) → Gross Profit

IF the question asks for journal entries OR involves recording transactions:
"journalEntries": [
  {
    "date": "1 Jan 2024",
    "debit": { "account": "Cash Account", "amount": "5,000" },
    "credit": { "account": "Sales Account", "amount": "5,000" },
    "narration": "Being cash sales for the day"
  }
]

JOURNAL ENTRY RULES:
- Always use Dr/Cr format: "Dr [Account], Cr [Account]"
- Include proper narration: "Being [description of transaction]"
- For corrections: "Being correction of error in [original entry]"
- Amounts must be equal for debits and credits

IF the question asks for ledger accounts OR T-accounts OR control accounts:
"ledgerAccounts": [
  {
    "accountName": "Cash Account" or "Sales Ledger Control Account" etc.,
    "accountType": "Asset" or "Liability" or "Income" or "Expense",
    "entries": {
      "debit": [
        { "date": "1 Jan", "description": "Balance b/d", "amount": "1,000" },
        { "date": "5 Jan", "description": "Cash Sales", "amount": "500" }
      ],
      "credit": [
        { "date": "10 Jan", "description": "Rent Paid", "amount": "200" },
        { "date": "31 Jan", "description": "Balance c/d", "amount": "1,300" }
      ]
    },
    "balance": { "side": "Dr", "amount": "1,300" },
    "balanceCarriedDown": "Yes"
  }
]

LEDGER ACCOUNT RULES:
- Show opening balance as "Balance b/d"
- Show closing balance as "Balance c/d"  
- Include dates for each entry
- Ensure debits = credits (accounts must balance)
- For control accounts: Show all debtor/creditor movements

IMPORTANT INSTRUCTIONS:
1. ONLY include the conditional fields that the question specifically asks for
2. If question asks for "Income Statement and Balance Sheet" → include financialStatements
3. If question asks for "Journal entries" → include journalEntries  
4. If question asks for "Ledger accounts" or "T-accounts" → include ledgerAccounts
5. For analysis questions (ratios, interpretation) → use only solution, finalAnswer, explanation
6. Keep responses focused and concise to avoid truncation
7. Don't include empty arrays for unused fields

SPECIFIC QUESTION TYPE GUIDANCE:
- "Prepare Income Statement": Use EXACT Income Statement structure from Frank Wood methodology:
  1. REVENUE: Sales → Less: Returns Inwards → Net Sales
  2. COST OF SALES: Opening Inventory + Purchases + Carriage Inwards - Returns Outwards - Closing Inventory + Wages
  3. GROSS PROFIT: Net Sales - Cost of Sales  
  4. OTHER INCOMES: Rent Received, Investment Income, Interest Received, Commission Received, Discounts Received
  5. TOTAL GROSS PROFIT AND OTHER INCOMES
  6. EXPENSES: Rent/Rates/Insurance, Salaries/Wages, Motor Expenses, Sundry Expenses, Depreciation, Bad Debts, etc.
  7. NET PROFIT: Total Gross Profit and Other Incomes - Total Expenses
- "Prepare Balance Sheet": Use Balance Sheet structure (Assets → Liabilities → Capital equation)
- "Pass journal entries": Use journal entry format with Dr/Cr and narrations
- "Prepare Control Account": Use ledger account format showing both sides
- "Partnership Appropriation": Show Net Profit → +Interest on Drawings → -Salaries → -Interest on Capital → Residual shared in ratio
- "Calculate depreciation": Show depreciation workings and ledger accounts
- "Bank reconciliation": Start with one balance, adjust for timing differences
- "Manufacturing account": Show Prime Cost → Factory Overheads → Cost of Production
- "Incomplete records": Use Statement of Affairs approach (Opening + Profit - Drawings = Closing)

ALWAYS FOLLOW FRANK WOOD METHODOLOGY:
- Use vertical format for financial statements
- Include proper headings with dates and periods
- Show intermediate totals and subtotals clearly
- Present figures with currency symbols (£, $, etc.)
- Use standard accounting terminology
- Include "Balance b/d" and "Balance c/d" in ledger accounts
- Show systematic step-by-step workings`,

    code: `
{
  "solutionFormat": "code",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "codeBlocks": [
    {
      "language": "python", // or javascript, java, etc.
      "code": "def solution():\\n    # Your code here\\n    return result",
      "explanation": "What this code block does"
    }
  ],
  "finalAnswer": "Expected output or result",
  "explanation": "How the code works, complexity analysis, and best practices"
}`,

    comparison: `
{
  "solutionFormat": "comparison",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "comparisons": [
    {
      "leftTitle": "Option A / Concept A",
      "rightTitle": "Option B / Concept B",
      "items": [
        {
          "category": "Feature 1",
          "left": "Description for A",
          "right": "Description for B"
        },
        {
          "category": "Feature 2",
          "left": "Description for A",
          "right": "Description for B"
        }
      ]
    }
  ],
  "finalAnswer": "Which option is better and why, or key differences",
  "explanation": "Detailed analysis of the comparison and recommendations"
}`,

    formula: `
{
  "solutionFormat": "formula",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "steps": ["Step-by-step derivation or application"],
  "finalAnswer": "Final formula or calculated result",
  "explanation": "When and how to use this formula",
  "keywords": ["formula_name", "variables", "applications"]
}`,

    visual: `
{
  "solutionFormat": "visual",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "diagrams": ["Description of visual elements needed"],
  "finalAnswer": "Main conclusion or result",
  "explanation": "How visual elements support the solution"
}`,

    "multiple-choice": `
{
  "solutionFormat": "multiple-choice",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "multipleChoiceQuestions": [
    {
      "questionNumber": "Q1",
      "questionText": "Full text of the question",
      "options": {
        "A": "Option A text",
        "B": "Option B text", 
        "C": "Option C text",
        "D": "Option D text",
        "E": "Option E text (if present)"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why this is correct"
    }
  ],
  "finalAnswer": "Summary: X questions answered with explanations",
  "explanation": "Overall analysis and any patterns in the questions"
}`,

    "multi-question": `
{
  "solutionFormat": "multi-question",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "multiQuestions": [
    {
      "questionNumber": "Q1",
      "questionText": "Full text of question 1",
      "answer": "Complete answer for question 1",
      "explanation": "Explanation for question 1",
      "questionType": "theory"
    },
    {
      "questionNumber": "Q2", 
      "questionText": "Full text of question 2",
      "answer": "Complete answer for question 2",
      "explanation": "Explanation for question 2",
      "questionType": "theory"
    }
  ],
  "finalAnswer": "Summary: X questions answered comprehensively",
  "explanation": "Overall summary and key concepts covered"
}`,

    "multi-math": `
{
  "solutionFormat": "multi-math",
  "questionType": "${questionType}",
  "subject": "${subject || ""}",
  "multiQuestions": [
    {
      "questionNumber": "Q1",
      "questionText": "Full text of the first math problem",
      "answer": "Step 1: Identify what is given and what needs to be found\\nStep 2: Set up the mathematical equation or approach\\nStep 3: Apply relevant formulas and mathematical operations\\nStep 4: Perform calculations systematically\\nStep 5: Verify the answer and state the final result\\nFinal Answer: [Complete numerical/algebraic result]",
      "explanation": "Detailed mathematical reasoning explaining why this approach works, what concepts are applied, and how each step follows logically",
      "questionType": "math"
    },
    {
      "questionNumber": "Q2",
      "questionText": "Full text of the second math problem", 
      "answer": "Step 1: Analyze the problem structure\\nStep 2: Choose appropriate mathematical method\\nStep 3: Execute step-by-step calculations\\nStep 4: Check work and simplify if needed\\nStep 5: Present final answer clearly\\nFinal Answer: [Complete numerical/algebraic result]",
      "explanation": "Mathematical explanation covering the problem-solving strategy, formulas used, and verification of the solution",
      "questionType": "math"
    }
  ],
  "finalAnswer": "Summary: X math problems solved with complete step-by-step solutions",
  "explanation": "Overview of mathematical concepts covered and problem-solving strategies employed"
}`,
  };

  const specificInstructions = formatInstructions[optimalFormat];

  return (
    basePrompt +
    specificInstructions +
    `

Additional Guidelines:
- Be accurate and educational
- Use clear, student-friendly language
- Include relevant examples when helpful
- Ensure all mathematical notation is clear
- For complex problems, break down concepts step by step
- Always double-check calculations and logic

FOR MULTIPLE CHOICE QUESTIONS:
- Extract each question individually with its options
- Identify the correct answer letter (A, B, C, D, E)
- Provide clear explanations for why the correct answer is right
- Number questions as Q1, Q2, Q3, etc.

FOR MULTIPLE QUESTIONS (Theory/Other):
- Identify each separate question in the image
- Number them sequentially (Q1, Q2, Q3, etc.)
- Provide complete answers for each question
- Include explanations when helpful

FOR ACCOUNTING QUESTIONS:
- You are a professional accounting tutor with expertise in all areas of financial accounting
- First identify which specific accounting topic this question falls under (Financial Statements, Journal Entries, Control Accounts, Partnership, Depreciation, Incomplete Records, Manufacturing, Bank Reconciliation, Ratios, or Club Accounting)
- Follow the precise structure for the specific accounting question type as demonstrated in Frank Wood's Solutions Manual
- For Financial Statements: Use proper vertical format with clear sections for Income Statement and Balance Sheet
- For Journal Entries: Show clear Dr/Cr format with proper narrations (e.g., "Dr Cash A/c, Cr Sales A/c - Being cash sales for the day")
- For Control Accounts: Show both sides of the account with proper balances (Debit side: Opening balance, Credit sales; Credit side: Cash received, Returns, Bad debts)
- For Partnership Accounting: Show clear appropriation of profit (Net Profit + Interest on Drawings - Salaries - Interest on Capital = Residual Profit to be shared in agreed ratio)
- For Depreciation: Show both asset account and accumulated depreciation account with proper calculations
- For Incomplete Records: Show Statement of Affairs at start and end with clear workings
- For Manufacturing Accounts: Clearly separate manufacturing costs from trading operations (Prime Cost + Factory Overheads ± WIP = Cost of Production)
- For Bank Reconciliations: Start with one balance and show clear path to the other
- For Accounting Ratios: Show formula, calculation, and interpretation
- All monetary amounts must be properly formatted with currency symbols and thousand separators where appropriate
- Follow standard accounting conventions for presenting positive and negative figures
- Always include proper dates in statement headings (e.g., "Income Statement for the year ended 31 December 2024", "Balance Sheet as at 31 December 2024")
- Use proper accounting terminology throughout
- Present calculations systematically with clear workings and intermediate steps
- The final presentation should be exactly as would appear in a professional accounting solution manual

IMPORTANT: Return ONLY the JSON object, no additional text before or after.`
  );
};

// Helper function to detect if AI should choose the format automatically
export const shouldAutoDetectFormat = (questionType: string): boolean => {
  return (
    questionType.toLowerCase().includes("let ai decide") ||
    questionType.toLowerCase().includes("auto") ||
    questionType.toLowerCase().includes("decide")
  );
};

// Enhanced format detection from AI response content
export const detectFormatFromContent = (content: string): SolutionFormat => {
  const lowerContent = content.toLowerCase();

  if (
    lowerContent.includes("multiple choice") ||
    lowerContent.includes("mcq") ||
    lowerContent.includes("option a") ||
    lowerContent.includes("option b") ||
    lowerContent.includes("correct answer")
  ) {
    return "multiple-choice";
  }

  // Detect accounting content
  if (
    lowerContent.includes("income statement") ||
    lowerContent.includes("balance sheet") ||
    lowerContent.includes("journal entries") ||
    lowerContent.includes("dr ") ||
    lowerContent.includes("cr ") ||
    lowerContent.includes("ledger account") ||
    lowerContent.includes("depreciation") ||
    lowerContent.includes("appropriation") ||
    lowerContent.includes("financial statement") ||
    lowerContent.includes("control account") ||
    lowerContent.includes("partnership") ||
    lowerContent.includes("manufacturing account") ||
    lowerContent.includes("bank reconciliation")
  ) {
    return "accounting";
  }

  // Detect multi-math: multiple questions with mathematical content
  if (
    (lowerContent.includes("q1:") || lowerContent.includes("question 1")) &&
    (lowerContent.includes("q2:") || lowerContent.includes("question 2")) &&
    (lowerContent.includes("step 1") ||
      lowerContent.includes("calculate") ||
      lowerContent.includes("equation") ||
      lowerContent.includes("formula") ||
      lowerContent.includes("solve") ||
      lowerContent.includes("="))
  ) {
    return "multi-math";
  }

  if (
    lowerContent.includes("q1:") ||
    lowerContent.includes("question 1") ||
    lowerContent.includes("q2:") ||
    lowerContent.includes("question 2")
  ) {
    return "multi-question";
  }

  if (
    lowerContent.includes("table") ||
    lowerContent.includes("row") ||
    lowerContent.includes("column")
  ) {
    return "tabular";
  }

  if (
    lowerContent.includes("code") ||
    lowerContent.includes("function") ||
    lowerContent.includes("def ")
  ) {
    return "code";
  }

  if (
    lowerContent.includes("compare") ||
    lowerContent.includes("versus") ||
    lowerContent.includes("difference")
  ) {
    return "comparison";
  }

  if (
    lowerContent.includes("step 1") ||
    lowerContent.includes("step 2") ||
    lowerContent.includes("first,")
  ) {
    return "step-by-step";
  }

  return "direct-answer";
};
