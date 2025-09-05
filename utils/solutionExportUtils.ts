import { EnhancedSolutionType } from "@/types/snapSolveTypes";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export class SolutionExporter {
  /**
   * Copy solution to clipboard as plain text
   */
  static async copyToClipboard(
    solution: EnhancedSolutionType
  ): Promise<boolean> {
    try {
      const textContent = this.formatSolutionAsText(solution);
      await Clipboard.setStringAsync(textContent);
      Alert.alert("Success", "Solution copied to clipboard!");
      return true;
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      Alert.alert("Error", "Failed to copy solution to clipboard");
      return false;
    }
  }

  /**
   * Export solution as PDF with proper cancellation handling
   */
  static async exportAsPDF(
    solution: EnhancedSolutionType
  ): Promise<{ success: boolean; cancelled?: boolean }> {
    try {
      const htmlContent = this.formatSolutionAsHTML(solution);

      // Create PDF file with timeout
      const printResult = (await Promise.race([
        Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PDF generation timeout")), 30000)
        ),
      ])) as any;

      if (!printResult?.uri) {
        // Print was cancelled or failed
        return { success: false, cancelled: true };
      }

      // Share the PDF with timeout
      if (await Sharing.isAvailableAsync()) {
        try {
          // Add timeout for sharing operation
          await Promise.race([
            Sharing.shareAsync(printResult.uri, {
              mimeType: "application/pdf",
              dialogTitle: "Save or Share Solution PDF",
              UTI: "com.adobe.pdf",
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Sharing timeout")), 60000)
            ),
          ]);

          return { success: true };
        } catch (shareError: any) {
          // Check if it's a timeout or cancellation
          if (shareError.message?.includes("timeout")) {
            return { success: false, cancelled: true };
          }
          // Sharing was cancelled or failed

          return { success: false, cancelled: true };
        }
      } else {
        Alert.alert("Success", "PDF created successfully!");
        return { success: true };
      }
    } catch (error: any) {
      // Check if it's a timeout
      if (error.message?.includes("timeout")) {
        return { success: false, cancelled: true };
      }

      console.error("Error exporting to PDF:", error);
      Alert.alert("Error", "Failed to export solution as PDF");
      return { success: false, cancelled: false };
    }
  }

  /**
   * Format solution as plain text
   */
  private static formatSolutionAsText(solution: EnhancedSolutionType): string {
    let text = `SOLUTION\n========\n\n`;

    // Add question type and subject
    if (solution.questionType) {
      text += `Question Type: ${solution.questionType}\n`;
    }
    if (solution.subject) {
      text += `Subject: ${solution.subject}\n`;
    }
    text += "\n";

    // Format based on solution type
    switch (solution.solutionFormat) {
      case "step-by-step":
        text += this.formatStepByStepText(solution);
        break;
      case "multiple-choice":
        text += this.formatMultipleChoiceText(solution);
        break;
      case "tabular":
        text += this.formatTabularText(solution);
        break;
      case "code":
        text += this.formatCodeText(solution);
        break;
      case "comparison":
        text += this.formatComparisonText(solution);
        break;
      case "multi-question":
        text += this.formatMultiQuestionText(solution);
        break;
      case "accounting":
        text += this.formatAccountingText(solution);
        break;
      default:
        text += this.formatDirectAnswerText(solution);
    }

    return text;
  }

  /**
   * Format solution as HTML for PDF
   */
  private static formatSolutionAsHTML(solution: EnhancedSolutionType): string {
    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.7;
          color: #1a202c;
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          padding: 40px;
          font-size: 16px;
          letter-spacing: -0.01em;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #00DF82 0%, #03624C 100%);
          color: white;
          padding: 60px 50px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          opacity: 0.3;
        }
        
        .header h1 {
          font-size: 42px;
          font-weight: 700;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header .subtitle {
          font-size: 18px;
          font-weight: 400;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 50px;
        }
        
        .metadata {
          background: linear-gradient(135deg, #f8fbff 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }
        
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .metadata-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00DF82 0%, #2CC295 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .metadata-content {
          flex: 1;
        }
        
        .metadata-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        
        .metadata-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }
        
        h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 60px 0 32px 0;
          position: relative;
          padding-left: 24px;
        }
        
        h2::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
          background: linear-gradient(135deg, #00DF82 0%, #2CC295 100%);
          border-radius: 3px;
        }
        
        h3 {
          font-size: 24px;
          font-weight: 600;
          color: #334155;
          margin: 40px 0 20px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        h3::before {
          content: '';
          width: 8px;
          height: 8px;
          background: #00DF82;
          border-radius: 50%;
        }
        
        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin: 24px 0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }
        
        .step-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin: 20px 0;
          position: relative;
          border-left: 6px solid #00DF82;
        }
        
        .step-number {
          position: absolute;
          top: -12px;
          left: 32px;
          background: linear-gradient(135deg, #00DF82 0%, #2CC295 100%);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0, 223, 130, 0.3);
        }
        
        .step-content {
          margin-top: 20px;
          font-size: 16px;
          line-height: 1.7;
          color: #374151;
        }
        
        .final-answer {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #00DF82;
          border-radius: 20px;
          padding: 40px;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
        }
        
        .final-answer::before {
          content: '✓';
          position: absolute;
          top: 20px;
          right: 20px;
          background: #00DF82;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
        }
        
        .final-answer h3 {
          color: #065f46;
          font-size: 20px;
          margin-bottom: 16px;
        }
        
        .final-answer-content {
          font-size: 18px;
          font-weight: 500;
          color: #064e3b;
          line-height: 1.6;
        }
        
        .explanation {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3b82f6;
          border-radius: 20px;
          padding: 40px;
          margin: 40px 0;
          position: relative;
        }
        
        .explanation::before {
          content: '💡';
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 24px;
        }
        
        .explanation h3 {
          color: #1e40af;
          margin-bottom: 16px;
        }
        
        .explanation-content {
          color: #1e3a8a;
          font-size: 16px;
          line-height: 1.7;
        }
        
        .option {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          margin: 16px 0;
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .option-letter {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .correct-option {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #00DF82;
          box-shadow: 0 4px 12px rgba(0, 223, 130, 0.15);
        }
        
        .correct-option .option-letter {
          background: #00DF82;
          color: white;
        }
        
        .correct-option::after {
          content: '✓';
          position: absolute;
          top: 16px;
          right: 16px;
          color: #00DF82;
          font-weight: bold;
          font-size: 20px;
        }
        
        .wrong-option .option-letter {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .option-text {
          flex: 1;
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
        }
        
        .correct-option .option-text {
          color: #065f46;
          font-weight: 500;
        }
        
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          margin: 32px 0;
        }
        
        th {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 20px;
          font-weight: 600;
          font-size: 16px;
          text-align: left;
          position: relative;
        }
        
        td {
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 15px;
          color: #374151;
          vertical-align: top;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        
        .code-block {
          background: #1e293b;
          color: #e2e8f0;
          padding: 32px;
          border-radius: 16px;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 14px;
          line-height: 1.6;
          overflow-x: auto;
          margin: 24px 0;
          position: relative;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .code-block::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #00DF82, #2CC295, #3b82f6);
        }
        
        .code-header {
          background: #334155;
          color: #94a3b8;
          padding: 16px 24px;
          border-radius: 12px 12px 0 0;
          font-size: 14px;
          font-weight: 500;
          margin: -32px -32px 24px -32px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .code-dots {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        
        .code-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .code-dot:nth-child(1) { background: #ef4444; }
        .code-dot:nth-child(2) { background: #f59e0b; }
        .code-dot:nth-child(3) { background: #10b981; }
        
        pre {
          margin: 0;
          overflow-x: auto;
        }
        
        code {
          font-family: inherit;
          font-size: inherit;
        }
        
        .question-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          margin: 32px 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          position: relative;
        }
        
        .question-number {
          position: absolute;
          top: -12px;
          left: 32px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .question-text {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 16px 0 24px 0;
          line-height: 1.6;
        }
        
        .comparison-table {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 2px;
          background: #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          margin: 24px 0;
        }
        
        .comparison-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 20px;
          font-weight: 600;
          text-align: center;
        }
        
        .comparison-cell {
          background: white;
          padding: 20px;
          font-size: 15px;
          line-height: 1.6;
        }
        
        .comparison-category {
          background: #f8fafc;
          font-weight: 600;
          color: #1e293b;
        }
        
        .markdown-list {
          margin: 16px 0;
          padding-left: 24px;
        }
        
        .markdown-list li {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        .inline-code {
          background: #f1f5f9;
          color: #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 14px;
        }
        
        .inline-code-block {
          background: #1e293b;
          color: #e2e8f0;
          padding: 16px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 14px;
          margin: 16px 0;
          overflow-x: auto;
        }
        
        .explanation-content p {
          margin: 12px 0;
        }
        
        .explanation-content p:first-child {
          margin-top: 0;
        }
        
        .explanation-content p:last-child {
          margin-bottom: 0;
        }
        
        .final-answer-content p {
          margin: 12px 0;
        }
        
        .final-answer-content p:first-child {
          margin-top: 0;
        }
        
        .final-answer-content p:last-child {
          margin-bottom: 0;
        }
        
        @media print {
          body {
            background: white;
            padding: 20px;
          }
          
          .container {
            box-shadow: none;
            border: 1px solid #e2e8f0;
          }
          
          .card, .step-card, .question-card {
            break-inside: avoid;
          }
          
          h2 {
            break-after: avoid;
          }
        }
        
        @media (max-width: 768px) {
          .content {
            padding: 30px;
          }
          
          .header {
            padding: 40px 30px;
          }
          
          .header h1 {
            font-size: 32px;
          }
          
          .metadata {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
      </style>
    `;

    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hivedemia AI Solution Export</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hivedemia AI Solution</h1>
            <div class="subtitle">Your Academic Brain</div>
          </div>
          <div class="content">
    `;

    // Add metadata
    html += '<div class="metadata">';
    if (solution.questionType) {
      html += `
        <div class="metadata-item">
          <div class="metadata-icon">Q</div>
          <div class="metadata-content">
            <div class="metadata-label">Question Type</div>
            <div class="metadata-value">${solution.questionType}</div>
          </div>
        </div>
      `;
    }
    if (solution.subject) {
      html += `
        <div class="metadata-item">
          <div class="metadata-icon">📚</div>
          <div class="metadata-content">
            <div class="metadata-label">Subject</div>
            <div class="metadata-value">${solution.subject}</div>
          </div>
        </div>
      `;
    }
    html += `
      <div class="metadata-item">
        <div class="metadata-icon">📅</div>
        <div class="metadata-content">
          <div class="metadata-label">Generated</div>
          <div class="metadata-value">${new Date().toLocaleString()}</div>
        </div>
      </div>
    `;
    html += "</div>";

    // Format based on solution type
    switch (solution.solutionFormat) {
      case "step-by-step":
        html += this.formatStepByStepHTML(solution);
        break;
      case "multiple-choice":
        html += this.formatMultipleChoiceHTML(solution);
        break;
      case "tabular":
        html += this.formatTabularHTML(solution);
        break;
      case "code":
        html += this.formatCodeHTML(solution);
        break;
      case "comparison":
        html += this.formatComparisonHTML(solution);
        break;
      case "multi-question":
        html += this.formatMultiQuestionHTML(solution);
        break;
      case "accounting":
        html += this.formatAccountingHTML(solution);
        break;
      default:
        html += this.formatDirectAnswerHTML(solution);
    }

    html += `
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  // Text formatting methods
  private static formatStepByStepText(solution: EnhancedSolutionType): string {
    let text = "SOLUTION STEPS:\n";
    if (solution.steps && solution.steps.length > 0) {
      solution.steps.forEach((step, index) => {
        text += `${index + 1}. ${step}\n\n`;
      });
    }

    text += `FINAL ANSWER:\n${solution.finalAnswer}\n\n`;
    text += `EXPLANATION:\n${solution.explanation}\n`;
    return text;
  }

  private static formatMultipleChoiceText(
    solution: EnhancedSolutionType
  ): string {
    let text = "MULTIPLE CHOICE QUESTIONS:\n\n";

    if (solution.multipleChoiceQuestions) {
      solution.multipleChoiceQuestions.forEach((q, index) => {
        text += `${q.questionNumber}: ${q.questionText}\n\n`;
        Object.entries(q.options).forEach(([key, value]) => {
          const marker = key === q.correctAnswer ? "✓" : " ";
          text += `${marker} ${key}. ${value}\n`;
        });
        text += `\nCorrect Answer: ${q.correctAnswer}\n`;
        text += `Explanation: ${q.explanation}\n\n`;
        text += "---\n\n";
      });
    }

    text += `SUMMARY:\n${solution.finalAnswer}\n\n`;
    if (solution.explanation) {
      text += `OVERALL EXPLANATION:\n${solution.explanation}\n`;
    }
    return text;
  }

  private static formatTabularText(solution: EnhancedSolutionType): string {
    let text = "TABULAR DATA:\n\n";

    if (solution.tables) {
      solution.tables.forEach((table, index) => {
        if (table.caption) {
          text += `Table ${index + 1}: ${table.caption}\n`;
        }

        // Headers
        text += table.headers.join(" | ") + "\n";
        text += table.headers.map(() => "---").join(" | ") + "\n";

        // Rows
        table.rows.forEach((row) => {
          text += row.join(" | ") + "\n";
        });

        if (table.footNote) {
          text += `Note: ${table.footNote}\n`;
        }
        text += "\n";
      });
    }

    text += `FINAL ANSWER:\n${solution.finalAnswer}\n\n`;
    text += `EXPLANATION:\n${solution.explanation}\n`;
    return text;
  }

  private static formatCodeText(solution: EnhancedSolutionType): string {
    let text = "CODE SOLUTION:\n\n";

    if (solution.codeBlocks) {
      solution.codeBlocks.forEach((block, index) => {
        text += `Code Block ${index + 1} (${block.language}):\n`;
        text += "```\n";
        text += block.code + "\n";
        text += "```\n";
        if (block.explanation) {
          text += `Explanation: ${block.explanation}\n`;
        }
        text += "\n";
      });
    }

    text += `FINAL ANSWER:\n${solution.finalAnswer}\n\n`;
    text += `EXPLANATION:\n${solution.explanation}\n`;
    return text;
  }

  private static formatComparisonText(solution: EnhancedSolutionType): string {
    let text = "COMPARISON ANALYSIS:\n\n";

    if (solution.comparisons) {
      solution.comparisons.forEach((comp, index) => {
        text += `Comparison ${index + 1}: ${comp.leftTitle} vs ${
          comp.rightTitle
        }\n\n`;
        comp.items.forEach((item) => {
          text += `${item.category}:\n`;
          text += `  ${comp.leftTitle}: ${item.left}\n`;
          text += `  ${comp.rightTitle}: ${item.right}\n\n`;
        });
      });
    }

    text += `FINAL ANSWER:\n${solution.finalAnswer}\n\n`;
    text += `EXPLANATION:\n${solution.explanation}\n`;
    return text;
  }

  private static formatMultiQuestionText(
    solution: EnhancedSolutionType
  ): string {
    let text = "MULTIPLE QUESTIONS:\n\n";

    if (solution.multiQuestions) {
      solution.multiQuestions.forEach((q, index) => {
        text += `${q.questionNumber}: ${q.questionText}\n`;
        text += `Answer: ${q.answer}\n`;
        text += `Explanation: ${q.explanation}\n\n`;
        text += "---\n\n";
      });
    }

    text += `SUMMARY:\n${solution.finalAnswer}\n\n`;
    if (solution.explanation) {
      text += `OVERALL EXPLANATION:\n${solution.explanation}\n`;
    }
    return text;
  }

  private static formatDirectAnswerText(
    solution: EnhancedSolutionType
  ): string {
    let text = `ANSWER:\n${solution.finalAnswer}\n\n`;
    text += `EXPLANATION:\n${solution.explanation}\n`;
    return text;
  }

  private static formatAccountingText(solution: EnhancedSolutionType): string {
    let text = "ACCOUNTING SOLUTION:\n\n";

    // Add question
    if (solution.question) {
      text += `QUESTION:\n${solution.question}\n\n`;
    }

    // Add accounting type
    if (solution.accountingType) {
      text += `TYPE: ${solution.accountingType
        .replace("-", " ")
        .toUpperCase()}\n\n`;
    }

    // Add solution approach
    if (solution.solution?.approach) {
      text += `APPROACH:\n${solution.solution.approach}\n\n`;
    }

    // Add workings
    if (solution.solution?.workings && solution.solution.workings.length > 0) {
      text += "WORKINGS:\n";
      solution.solution.workings.forEach((working, index) => {
        text += `${index + 1}. ${working.title}\n`;
        text += `${working.content}\n\n`;
      });
    }

    // Format Financial Statements
    if (
      solution.financialStatements &&
      solution.financialStatements.length > 0
    ) {
      solution.financialStatements.forEach((statement, index) => {
        text += `FINANCIAL STATEMENT:\n`;
        text += `${statement.title}\n`;
        if (statement.period) {
          text += `For the period: ${statement.period}\n`;
        }
        text += `Format: ${statement.format}\n`;
        text += "---\n";

        // Headers
        if (statement.content.headers) {
          text += statement.content.headers.join(" | ") + "\n";
          text += statement.content.headers.map(() => "---").join(" | ") + "\n";
        }

        // Sections
        statement.content.sections.forEach((section) => {
          text += `\n${section.sectionTitle}:\n`;
          section.items.forEach((item) => {
            text += `  ${item.description}: ${item.amount}\n`;
          });

          if (section.sectionTotal) {
            text += `  ${section.sectionTotal.description}: ${section.sectionTotal.amount}\n`;
          }
        });

        if (statement.content.finalTotal) {
          text += `\n${statement.content.finalTotal.description}: ${statement.content.finalTotal.amount}\n`;
        }
        text += "\n";
      });
    }

    // Format Journal Entries
    if (solution.journalEntries && solution.journalEntries.length > 0) {
      text += "JOURNAL ENTRIES:\n";
      text += "---\n";
      solution.journalEntries.forEach((entry, index) => {
        text += `Entry ${index + 1}: ${entry.date}\n`;
        text += `Narration: ${entry.narration}\n\n`;

        text += `  Dr. ${entry.debit.account}  ${entry.debit.amount}\n`;
        text += `      Cr. ${entry.credit.account}  ${entry.credit.amount}\n`;
        text += "\n";
      });
    }

    // Format Ledger Accounts
    if (solution.ledgerAccounts && solution.ledgerAccounts.length > 0) {
      text += "LEDGER ACCOUNTS:\n";
      text += "---\n";
      solution.ledgerAccounts.forEach((account) => {
        text += `${account.accountName} Account\n`;
        text += "---\n";
        text += "Debit Side          | Credit Side\n";
        text += "---\n";

        const maxEntries = Math.max(
          account.entries.debit.length,
          account.entries.credit.length
        );
        for (let i = 0; i < maxEntries; i++) {
          const debit = account.entries.debit[i];
          const credit = account.entries.credit[i];

          const debitText = debit
            ? `${debit.description}: ${debit.amount}`
            : "";

          const creditText = credit
            ? `${credit.description}: ${credit.amount}`
            : "";

          text += `${debitText.padEnd(20)} | ${creditText}\n`;
        }

        text += `Balance: ${account.balance.side} ${account.balance.amount}\n`;
        text += "\n";
      });
    }

    // Add final answer and explanation
    if (solution.finalAnswer) {
      text += `FINAL ANSWER:\n${solution.finalAnswer}\n\n`;
    }

    if (solution.explanation) {
      text += `EXPLANATION:\n${solution.explanation}\n`;
    }

    return text;
  }

  // HTML formatting methods
  private static formatStepByStepHTML(solution: EnhancedSolutionType): string {
    let html = "<h2>Solution Steps</h2>";

    if (solution.steps && solution.steps.length > 0) {
      solution.steps.forEach((step, index) => {
        html += `
          <div class="step-card">
            <div class="step-number">${index + 1}</div>
            <div class="step-content">${this.markdownToHtml(step)}</div>
          </div>
        `;
      });
    }

    html += `
      <div class="final-answer">
        <h3>Final Answer</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
      <div class="explanation">
        <h3>Explanation</h3>
        <div class="explanation-content">${this.markdownToHtml(
          solution.explanation
        )}</div>
      </div>
    `;
    return html;
  }

  private static formatMultipleChoiceHTML(
    solution: EnhancedSolutionType
  ): string {
    let html = "<h2>Multiple Choice Questions</h2>";

    if (solution.multipleChoiceQuestions) {
      solution.multipleChoiceQuestions.forEach((q, index) => {
        html += `
          <div class="question-card">
            <div class="question-number">${q.questionNumber}</div>
            <div class="question-text">${q.questionText}</div>
        `;

        Object.entries(q.options).forEach(([key, value]) => {
          const isCorrect = key === q.correctAnswer;
          html += `
            <div class="${
              isCorrect ? "correct-option" : "wrong-option"
            } option">
              <div class="option-letter">${key}</div>
              <div class="option-text">${value}</div>
            </div>
          `;
        });

        html += `
            <div class="explanation">
              <h3>Explanation</h3>
              <div class="explanation-content">${this.markdownToHtml(
                q.explanation
              )}</div>
            </div>
          </div>
        `;
      });
    }

    html += `
      <div class="final-answer">
        <h3>Summary</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
    `;

    if (solution.explanation) {
      html += `
        <div class="explanation">
          <h3>Overall Explanation</h3>
          <div class="explanation-content">${this.markdownToHtml(
            solution.explanation
          )}</div>
        </div>
      `;
    }
    return html;
  }

  private static formatTabularHTML(solution: EnhancedSolutionType): string {
    let html = "<h2>Tabular Data</h2>";

    if (solution.tables) {
      solution.tables.forEach((table, index) => {
        html += '<div class="card">';

        if (table.caption) {
          html += `<h3>Table ${index + 1}: ${table.caption}</h3>`;
        }

        html += "<table>";
        html += "<thead><tr>";
        table.headers.forEach((header) => {
          html += `<th>${header}</th>`;
        });
        html += "</tr></thead>";

        html += "<tbody>";
        table.rows.forEach((row) => {
          html += "<tr>";
          row.forEach((cell) => {
            html += `<td>${cell}</td>`;
          });
          html += "</tr>";
        });
        html += "</tbody></table>";

        if (table.footNote) {
          html += `<p style="font-style: italic; color: #64748b; margin-top: 16px;"><strong>Note:</strong> ${table.footNote}</p>`;
        }

        html += "</div>";
      });
    }

    html += `
      <div class="final-answer">
        <h3>Final Answer</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
      <div class="explanation">
        <h3>Explanation</h3>
        <div class="explanation-content">${this.markdownToHtml(
          solution.explanation
        )}</div>
      </div>
    `;
    return html;
  }

  private static formatCodeHTML(solution: EnhancedSolutionType): string {
    let html = "<h2>Code Solution</h2>";

    if (solution.codeBlocks) {
      solution.codeBlocks.forEach((block, index) => {
        html += '<div class="card">';
        html += `<h3>Code Block ${index + 1}</h3>`;
        html += `
          <div class="code-block">
            <div class="code-header">
              <span>${block.language}</span>
              <div class="code-dots">
                <div class="code-dot"></div>
                <div class="code-dot"></div>
                <div class="code-dot"></div>
              </div>
            </div>
            <pre><code>${this.escapeHtml(block.code)}</code></pre>
          </div>
        `;
        if (block.explanation) {
          html += `
            <div class="explanation">
              <h3>Code Explanation</h3>
              <div class="explanation-content">${this.markdownToHtml(
                block.explanation
              )}</div>
            </div>
          `;
        }
        html += "</div>";
      });
    }

    html += `
      <div class="final-answer">
        <h3>Final Answer</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
      <div class="explanation">
        <h3>Explanation</h3>
        <div class="explanation-content">${this.markdownToHtml(
          solution.explanation
        )}</div>
      </div>
    `;
    return html;
  }

  private static formatComparisonHTML(solution: EnhancedSolutionType): string {
    let html = "<h2>Comparison Analysis</h2>";

    if (solution.comparisons) {
      solution.comparisons.forEach((comp, index) => {
        html += '<div class="card">';
        html += `<h3>Comparison ${index + 1}: ${comp.leftTitle} vs ${
          comp.rightTitle
        }</h3>`;

        html += '<div class="comparison-table">';
        html += `<div class="comparison-header">Category</div>`;
        html += `<div class="comparison-header">${comp.leftTitle}</div>`;
        html += `<div class="comparison-header">${comp.rightTitle}</div>`;

        comp.items.forEach((item) => {
          html += `<div class="comparison-cell comparison-category">${item.category}</div>`;
          html += `<div class="comparison-cell">${item.left}</div>`;
          html += `<div class="comparison-cell">${item.right}</div>`;
        });

        html += "</div>";
        html += "</div>";
      });
    }

    html += `
      <div class="final-answer">
        <h3>Final Answer</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
      <div class="explanation">
        <h3>Explanation</h3>
        <div class="explanation-content">${this.markdownToHtml(
          solution.explanation
        )}</div>
      </div>
    `;
    return html;
  }

  private static formatMultiQuestionHTML(
    solution: EnhancedSolutionType
  ): string {
    let html = "<h2>Multiple Questions</h2>";

    if (solution.multiQuestions) {
      solution.multiQuestions.forEach((q, index) => {
        html += `
          <div class="question-card">
            <div class="question-number">${q.questionNumber}</div>
            <div class="question-text">${q.questionText}</div>
            <div class="final-answer" style="margin: 20px 0;">
              <h3>Answer</h3>
              <div class="final-answer-content">${this.markdownToHtml(
                q.answer
              )}</div>
            </div>
            <div class="explanation">
              <h3>Explanation</h3>
              <div class="explanation-content">${this.markdownToHtml(
                q.explanation
              )}</div>
            </div>
          </div>
        `;
      });
    }

    html += `
      <div class="final-answer">
        <h3>Summary</h3>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
    `;

    if (solution.explanation) {
      html += `
        <div class="explanation">
          <h3>Overall Explanation</h3>
          <div class="explanation-content">${this.markdownToHtml(
            solution.explanation
          )}</div>
        </div>
      `;
    }
    return html;
  }

  private static formatDirectAnswerHTML(
    solution: EnhancedSolutionType
  ): string {
    return `
      <div class="final-answer">
        <h2>Answer</h2>
        <div class="final-answer-content">${this.markdownToHtml(
          solution.finalAnswer
        )}</div>
      </div>
      <div class="explanation">
        <h2>Explanation</h2>
        <div class="explanation-content">${this.markdownToHtml(
          solution.explanation
        )}</div>
      </div>
    `;
  }

  private static formatAccountingHTML(solution: EnhancedSolutionType): string {
    let html = "<h2>Accounting Solution</h2>";

    // Add question
    if (solution.question) {
      html += `
        <div class="accounting-question">
          <h3>Question</h3>
          <div class="question-content">${this.markdownToHtml(
            solution.question
          )}</div>
        </div>
      `;
    }

    // Add accounting type badge
    if (solution.accountingType) {
      const displayType = solution.accountingType
        .replace("-", " ")
        .toUpperCase();
      html += `
        <div class="accounting-type-badge">
          <span class="badge">${displayType}</span>
        </div>
      `;
    }

    // Add solution approach
    if (solution.solution?.approach) {
      html += `
        <div class="card">
          <h3>💡 Approach</h3>
          <div class="approach-content">${this.markdownToHtml(
            solution.solution.approach
          )}</div>
        </div>
      `;
    }

    // Add workings
    if (solution.solution?.workings && solution.solution.workings.length > 0) {
      html += "<h3>📊 Workings</h3>";
      solution.solution.workings.forEach((working, index) => {
        html += `
          <div class="card">
            <h4>${working.title}</h4>
            <div class="working-content">${this.markdownToHtml(
              working.content
            )}</div>
          </div>
        `;
      });
    }

    // Format Financial Statements
    if (
      solution.financialStatements &&
      solution.financialStatements.length > 0
    ) {
      html += "<h3>Financial Statements</h3>";
      solution.financialStatements.forEach((statement, index) => {
        html += `
          <div class="financial-statement">
            <h4>${statement.title}</h4>
            <p><strong>Period:</strong> ${statement.period}</p>
            <p><strong>Format:</strong> ${statement.format}</p>
            
            <table class="financial-table">
              <thead>
                <tr>
                  ${statement.content.headers
                    .map((header) => `<th>${header}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
        `;

        statement.content.sections.forEach((section) => {
          html += `
            <tr class="section-header">
              <td colspan="${statement.content.headers.length}"><strong>${section.sectionTitle}</strong></td>
            </tr>
          `;

          section.items.forEach((item) => {
            html += `
              <tr>
                <td>${item.description}</td>
                <td class="amount">${item.amount}</td>
              </tr>
            `;
          });

          if (section.sectionTotal) {
            html += `
              <tr class="section-total">
                <td><strong>${section.sectionTotal.description}</strong></td>
                <td class="amount"><strong>${section.sectionTotal.amount}</strong></td>
              </tr>
            `;
          }
        });

        if (statement.content.finalTotal) {
          html += `
            <tr class="final-total">
              <td><strong>${statement.content.finalTotal.description}</strong></td>
              <td class="amount"><strong>${statement.content.finalTotal.amount}</strong></td>
            </tr>
          `;
        }

        html += `
              </tbody>
            </table>
          </div>
        `;
      });
    }

    // Format Journal Entries
    if (solution.journalEntries && solution.journalEntries.length > 0) {
      html += "<h3>Journal Entries</h3>";
      solution.journalEntries.forEach((entry, index) => {
        html += `
          <div class="journal-entry">
            <div class="entry-header">
              <span class="entry-number">Entry ${index + 1}</span>
              <span class="entry-date">${entry.date}</span>
            </div>
            <div class="entry-narration">${entry.narration}</div>
            <table class="journal-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${entry.debit.account}</td>
                  <td class="debit-amount">${entry.debit.amount}</td>
                  <td></td>
                </tr>
                <tr>
                  <td class="credit-indent">${entry.credit.account}</td>
                  <td></td>
                  <td class="credit-amount">${entry.credit.amount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      });
    }

    // Format Ledger Accounts
    if (solution.ledgerAccounts && solution.ledgerAccounts.length > 0) {
      html += "<h3>Ledger Accounts</h3>";
      solution.ledgerAccounts.forEach((account) => {
        html += `
          <div class="ledger-account">
            <h4>${account.accountName} Account</h4>
            <div class="t-account">
              <div class="t-account-sides">
                <div class="debit-side">
                  <h5>Debit</h5>
                  ${account.entries.debit
                    .map(
                      (debit) => `
                    <div class="ledger-entry">
                      <span class="description">${debit.description}</span>
                      <span class="amount">${debit.amount}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                <div class="credit-side">
                  <h5>Credit</h5>
                  ${account.entries.credit
                    .map(
                      (credit) => `
                    <div class="ledger-entry">
                      <span class="description">${credit.description}</span>
                      <span class="amount">${credit.amount}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
              <div class="account-balance">
                <strong>Balance: ${account.balance.side} ${
          account.balance.amount
        }</strong>
              </div>
            </div>
          </div>
        `;
      });
    }

    // Add final answer and explanation
    if (solution.finalAnswer) {
      html += `
        <div class="final-answer">
          <h3>Final Answer</h3>
          <div class="final-answer-content">${this.markdownToHtml(
            solution.finalAnswer
          )}</div>
        </div>
      `;
    }

    if (solution.explanation) {
      html += `
        <div class="explanation">
          <h3>Explanation</h3>
          <div class="explanation-content">${this.markdownToHtml(
            solution.explanation
          )}</div>
        </div>
      `;
    }

    return html;
  }

  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Convert markdown text to HTML for PDF export
   */
  private static markdownToHtml(text: string): string {
    if (!text) return text;

    let html = text;

    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic text
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert code blocks
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<div class="inline-code-block">$1</div>'
    );

    // Convert inline code
    html = html.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');

    // Convert numbered lists
    html = html.replace(/(\d+\.\s.*?)(?=\n\d+\.\s|\n\n|$)/gs, (match) => {
      const items = match
        .split(/\n(?=\d+\.\s)/)
        .map((item) => {
          const content = item.replace(/^\d+\.\s/, "");
          return `<li>${content}</li>`;
        })
        .join("");
      return `<ol class="markdown-list">${items}</ol>`;
    });

    // Convert bullet lists
    html = html.replace(/(-\s.*?)(?=\n-\s|\n\n|$)/gs, (match) => {
      const items = match
        .split(/\n(?=-\s)/)
        .map((item) => {
          const content = item.replace(/^-\s/, "");
          return `<li>${content}</li>`;
        })
        .join("");
      return `<ul class="markdown-list">${items}</ul>`;
    });

    // Convert line breaks
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    // Wrap in paragraph if not already wrapped
    if (
      !html.startsWith("<") ||
      (!html.includes("<p>") &&
        !html.includes("<ol>") &&
        !html.includes("<ul>"))
    ) {
      html = `<p>${html}</p>`;
    }

    return html;
  }
}
