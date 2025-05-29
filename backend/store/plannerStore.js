import { create } from "zustand";
import { plannerDb  } from "@/data/localDb";
import { useUserStore } from "./useUserStore";


export const usePlannerStore = create((set, get) => ({
  schedules: { exams: [], tasks: [], weeklyPlans: [] },
  loading: false,

  initPlannerTables: async () => {
    try {
      await plannerDb.execAsync(`
        CREATE TABLE IF NOT EXISTS exams (
          id TEXT PRIMARY KEY, user_id TEXT, course TEXT, code TEXT, title TEXT,
          date TEXT, time TEXT, location TEXT, priority TEXT
        );
        CREATE TABLE IF NOT EXISTS tasks (
          plan_id TEXT, user_id TEXT, date TEXT, created_at TEXT, focus TEXT
        );
        CREATE TABLE IF NOT EXISTS task_items (
          task_id TEXT PRIMARY KEY, plan_id TEXT, title TEXT, duration TEXT, completed INTEGER , important INTEGER
        );
        CREATE TABLE IF NOT EXISTS weekly_plans (
          id TEXT PRIMARY KEY, user_id TEXT, title TEXT, description TEXT, priority TEXT, recurring INTEGER
        );
        CREATE TABLE IF NOT EXISTS weekly_entries (
          id TEXT PRIMARY KEY, plan_id TEXT, course TEXT, task TEXT, duration TEXT
        );
      `);
    } catch (err) {
      console.error("Failed to initialize planner database:", err);
    }
  },

  loadPlannerFromDB: async () => {
    try {
      const { profile } = useUserStore.getState();
      const user_id = profile?.user_id;
      if (!user_id) return;

      const exams = await plannerDb.getAllAsync(
        `SELECT * FROM exams WHERE user_id = ?`,
        user_id
      );
      const tasksRaw = await plannerDb.getAllAsync(
        `SELECT * FROM tasks WHERE user_id = ?`,
        user_id
      );

      const tasks = await Promise.all(
        tasksRaw.map(async (plan) => {
          const taskItems = await plannerDb.getAllAsync(
            `SELECT * FROM task_items WHERE plan_id = ?`,
            plan.plan_id
          );
          return {
            ...plan,
            tasks: taskItems.map((t) => ({ ...t, completed: !!t.completed })),
          };
        })
      );

      const plansRaw = await plannerDb.getAllAsync(
        `SELECT * FROM weekly_plans WHERE user_id = ?`,
        user_id
      );
      const weeklyPlans = await Promise.all(
        plansRaw.map(async (plan) => {
          const entries = await plannerDb.getAllAsync(
            `SELECT * FROM weekly_entries WHERE plan_id = ?`,
            plan.id
          );
          return { ...plan, data: entries };
        })
      );

      set({ schedules: { exams, tasks, weeklyPlans } });
    } catch (err) {
      console.error("Failed to fetch planner data:", err);
    }
  },

  addExam: async (exam) => {
    const { profile } = useUserStore.getState();
    const user_id = profile?.user_id;
    const id = String(Math.random());
    await plannerDb.runAsync(
      `INSERT INTO exams (id, user_id, course, code, title, date, time, location, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user_id,
        exam.course,
        exam.code,
        exam.title,
        exam.date,
        exam.time,
        exam.location,
        exam.priority,
      ]
    );
    get().loadPlannerFromDB();
  },

  addTaskPlan: async (plan) => {
    const user_id = useUserStore.getState().profile?.user_id;

    const plan_id = String(Math.random());

    await plannerDb.runAsync(
      `INSERT INTO tasks (plan_id, user_id, date, created_at, focus) VALUES (?, ?, ?, ?, ?)`,
      [plan_id, user_id, plan.date, plan.created_at, plan.focus]
    );

    for (const task of plan.tasks) {
      await plannerDb.runAsync(
        `INSERT INTO task_items (task_id, plan_id, title, duration, completed , important ) VALUES (?, ?, ?, ?, ? , ?)`,
        [
          String(Math.random()),
          plan_id,
          task.title,
          task.duration,
          task.completed ? 1 : 0,
          task.important ? 1 : 0,
        ]
      );
    }

    get().loadPlannerFromDB();
  },

  deleteTask: async (taskId, planId) => {
    try {
      // Step 1: Delete only the task item
      await plannerDb.runAsync(`DELETE FROM task_items WHERE task_id = ?`, taskId);

      // Step 2: Check if any tasks remain in the plan
      const remainingTasks = await plannerDb.getAllAsync(
        `SELECT * FROM task_items WHERE plan_id = ?`,
        planId
      );

      // Step 3: If no tasks remain, delete the parent plan
      if (remainingTasks.length === 0) {
        await plannerDb.runAsync(`DELETE FROM tasks WHERE plan_id = ?`, planId);
      }

      // Step 4: Refresh UI
      await get().loadPlannerFromDB();
      console.log("Task deleted successfully.");
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  },
  deleteExam: async (examId) => {
    try {
      await plannerDb.runAsync(`DELETE FROM exams WHERE id = ?`, examId);
      await get().loadPlannerFromDB();
      console.log("Exam deleted successfully.");
    } catch (err) {
      console.error("Error deleting exam:", err);
    }
  },

 
  updateTaskItem: async (updatedTask) => {
    try {
      await plannerDb.runAsync(
        `UPDATE task_items SET title = ?, duration = ?, completed = ?, important = ? WHERE task_id = ?`,
        [
          updatedTask.title,
          updatedTask.duration,
          updatedTask.completed ? 1 : 0,
          updatedTask.important ? 1 : 0,
          updatedTask.task_id,
        ]
      );

      await get().loadPlannerFromDB();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  },
  toggleTaskImportance: async (taskId, currentValue) => {
    try {
      await plannerDb.runAsync(
        `UPDATE task_items SET important = ? WHERE task_id = ?`,
        [currentValue ? 0 : 1, taskId]
      );
      await get().loadPlannerFromDB();
    } catch (err) {
      console.error("Failed to toggle importance:", err);
    }
  },

  addWeeklyPlan: async (plan) => {
    const user_id = useUserStore.getState().profile?.user_id;
    const plan_id = String(Math.random());

    await plannerDb.runAsync(
      `INSERT INTO weekly_plans (id, user_id, title, description, priority, recurring) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        plan_id,
        user_id,
        plan.title,
        plan.description,
        plan.priority,
        plan.recurring ? 1 : 0,
      ]
    );

    for (const entry of plan.data) {
      await plannerDb.runAsync(
        `INSERT INTO weekly_entries (id, plan_id, course, task, duration) VALUES (?, ?, ?, ?, ?)`,
        [
          String(Math.random()),
          plan_id,
          entry.course,
          entry.task,
          entry.duration,
        ]
      );
    }

    get().loadPlannerFromDB();
  },
  deleteWeeklyPlan: async (planId) => {
    try {
      // Delete entries first
      await plannerDb.runAsync(`DELETE FROM weekly_entries WHERE plan_id = ?`, planId);
      // Then delete the plan
      await plannerDb.runAsync(`DELETE FROM weekly_plans WHERE id = ?`, planId);
      
      await get().loadPlannerFromDB();
      console.log("Weekly plan deleted successfully.");
    } catch (err) {
      console.error("Error deleting weekly plan:", err);
    }
  },

}));
