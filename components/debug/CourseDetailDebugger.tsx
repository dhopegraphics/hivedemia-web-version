// Debug component to help identify CourseDetail freezing issues
import { useState, useEffect } from "react";

interface CourseDetailDebuggerProps {
  courseId: string;
  isOpen: boolean;
}

export const CourseDetailDebugger = ({
  courseId,
  isOpen,
}: CourseDetailDebuggerProps) => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      setIsDebugging(true);
      setDebugLogs([]);

      const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs((prev) => [...prev, `${timestamp}: ${message}`]);
      };

      addLog("Course detail opened");
      addLog(`Course ID: ${courseId}`);

      // Test localStorage access
      try {
        const cacheKey = `course-files-${courseId}`;
        const cached = localStorage.getItem(cacheKey);
        addLog(
          `Cache check: ${cached ? "Found cached data" : "No cache found"}`
        );
      } catch (error) {
        addLog(
          `Cache error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      // Test Supabase auth
      import("@/backend/supabase").then(({ supabase }) => {
        addLog("Testing Supabase auth...");
        supabase.auth
          .getUser()
          .then(({ data, error }) => {
            if (error) {
              addLog(`Auth error: ${error.message}`);
            } else {
              addLog(`Auth success: ${data?.user?.email || "No email"}`);
            }
          })
          .catch((err) => {
            addLog(
              `Auth exception: ${
                err instanceof Error ? err.message : "Unknown error"
              }`
            );
          });
      });

      // Test Google Drive API
      setTimeout(() => {
        addLog("Debug check completed");
        setIsDebugging(false);
      }, 3000);
    }
  }, [isOpen, courseId]);

  if (!isOpen || !isDebugging) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "2px solid #ccc",
        padding: "10px",
        borderRadius: "8px",
        maxWidth: "300px",
        zIndex: 10000,
        fontSize: "12px",
        maxHeight: "200px",
        overflow: "auto",
      }}
    >
      <h4>Debug Log</h4>
      {debugLogs.map((log, index) => (
        <div key={index} style={{ marginBottom: "4px" }}>
          {log}
        </div>
      ))}
      {isDebugging && <div>🔄 Checking...</div>}
    </div>
  );
};

export default CourseDetailDebugger;
