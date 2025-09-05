import { supabase } from "../supabase";

export interface ReportData {
  user_id: string;
  message_id: string;
  content: string;
  reason: string;
}

export interface Report extends ReportData {
  id: string;
  created_at: string;
}

class ReportingService {
  /**
   * Submit a report for AI-generated content
   * @param reportData - The report data to submit
   * @returns Promise<Report | null>
   */
  async submitReport(reportData: ReportData): Promise<Report | null> {
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            user_id: reportData.user_id,
            message_id: reportData.message_id,
            content: reportData.content,
            reason: reportData.reason,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error submitting report:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to submit report:", error);
      throw error;
    }
  }

  /**
   * Check if a message has already been reported by the user
   * @param userId - The user ID
   * @param messageId - The message ID
   * @returns Promise<boolean>
   */
  async hasUserReportedMessage(
    userId: string,
    messageId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("id")
        .eq("user_id", userId)
        .eq("message_id", messageId)
        .limit(1);

      if (error) {
        console.error("Error checking existing report:", error);
        return false; // If we can't check, allow reporting
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Failed to check existing report:", error);
      return false; // If we can't check, allow reporting
    }
  }

  /**
   * Get reports submitted by a user
   * @param userId - The user ID
   * @returns Promise<Report[]>
   */
  async getUserReports(userId: string): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user reports:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      throw error;
    }
  }
}

export const reportingService = new ReportingService();
