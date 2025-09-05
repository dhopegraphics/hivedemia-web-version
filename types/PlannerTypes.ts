import { SQLiteBindParams } from "expo-sqlite";

// Define a type for the task object
export type TaskType = {
  task_id: string | number | boolean | Uint8Array<ArrayBufferLike> | null;
  plan_id?: string | number | boolean | Uint8Array<ArrayBufferLike> | null;
  important?: boolean;
  title: string;
  duration: any;
  [key: string]: any;
};

export type PlanType = {
  plan_id: SQLiteBindParams;
  focus: string | number | boolean | Uint8Array<ArrayBufferLike> | null;
};

export type ExamType = {
  id: string | number;
  course: string;
  code: string;
  date: string;
  time: string;
  location: string;
  priority: "high" | "medium" | "low";
};

export type WeeklyPlanEntryType = {
  task: any;
  course: any;
  id: SQLiteBindParams;
};

export type MenuPosition = {
  x: number;
  y: number;
};

export type ScheduleType = {
  type: "exam" | "task" | "weekly";
  [key: string]: any;
};

export type TabType = "today" | "schedule" | "tasks" | "calendar";
