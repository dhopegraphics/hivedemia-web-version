import { usePlannerStore } from "@/backend/store/plannerStore";
import { useUserStore } from "@/backend/store/useUserStore";
import * as SQLite from "expo-sqlite";
import { SQLiteBindParams } from "expo-sqlite";
import { PlanType } from "../types/PlannerTypes";

/**
 * Replan a schedule by creating a new plan with the same tasks but reset completion
 */
export const replanSchedule = async (plan: PlanType): Promise<void> => {
  try {
    const plannerDb = await SQLite.openDatabaseAsync("planner.db");
    const { profile } = useUserStore.getState();
    const user_id = profile?.user_id;

    if (!user_id) return;

    // Get the old plan
    const oldPlan = await plannerDb.getAllAsync(
      `SELECT * FROM tasks WHERE plan_id = ?`,
      plan.plan_id
    );
    if (!oldPlan) return;

    const taskItems = await plannerDb.getAllAsync(
      `SELECT * FROM task_items WHERE plan_id = ?`,
      plan.plan_id
    );

    // Generate new plan ID and use today's date
    const newPlanId = String(Math.random());
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const created_at = new Date().toISOString();

    // Insert new plan
    await plannerDb.runAsync(
      `INSERT INTO tasks (plan_id, user_id, date, created_at, focus) VALUES (?, ?, ?, ?, ?)`,
      [newPlanId, user_id, today, created_at, plan.focus]
    );

    // Insert copied task items with new task IDs
    for (const task of taskItems as {
      title: string;
      duration: any;
      important?: any;
    }[]) {
      await plannerDb.runAsync(
        `INSERT INTO task_items (task_id, plan_id, title, duration, completed, important) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(Math.random()),
          newPlanId,
          task.title,
          task.duration,
          0, // reset completion
          task.important ? 1 : 0,
        ]
      );
    }

    // Delete the old task items and plan
    await plannerDb.runAsync(
      `DELETE FROM task_items WHERE plan_id = ?`,
      plan.plan_id
    );
    await plannerDb.runAsync(
      `DELETE FROM tasks WHERE plan_id = ?`,
      plan.plan_id
    );

    // Refresh
    await usePlannerStore.getState().loadPlannerFromDB();
  } catch (err) {
    console.error("Error replanning schedule:", err);
  }
};

/**
 * Delete a plan and all its associated tasks
 */
export const deletePlan = async (plan: PlanType): Promise<void> => {
  try {
    const plannerDb = await SQLite.openDatabaseAsync("planner.db");
    await plannerDb.runAsync(
      `DELETE FROM task_items WHERE plan_id = ?`,
      plan.plan_id
    );
    await plannerDb.runAsync(
      `DELETE FROM tasks WHERE plan_id = ?`,
      plan.plan_id
    );
    await usePlannerStore.getState().loadPlannerFromDB();
  } catch (err) {
    console.error("Failed to delete plan:", err);
    throw err;
  }
};

/**
 * Delete a weekly plan entry
 */
export const deleteWeeklyPlanEntry = async (
  entryId: SQLiteBindParams
): Promise<void> => {
  try {
    const plannerDb = await SQLite.openDatabaseAsync("planner.db");
    await plannerDb.runAsync(
      `DELETE FROM weekly_entries WHERE id = ?`,
      entryId
    );
    await usePlannerStore.getState().loadPlannerFromDB();
  } catch (error) {
    console.error("Failed to delete weekly plan entry:", error);
    throw error;
  }
};

/**
 * Get error message from error object or string
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "message" in error) {
    return (error as { message: string }).message;
  }
  return String(error);
};

/**
 * Format today's date for display
 */
export const formatTodayDate = (): string => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
