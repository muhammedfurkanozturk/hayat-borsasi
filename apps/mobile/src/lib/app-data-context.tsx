import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  calculateScore,
  daysAgoIso,
  deleteAllCategoriesForUser,
  deleteCategoryById,
  deleteSubtaskById,
  deleteTaskById,
  fetchCategories,
  fetchDailyHistory,
  fetchSubtaskLogs,
  fetchSubtasks,
  fetchTaskLogs,
  fetchTasks,
  fetchYesterdaySubtaskLogs,
  fetchYesterdayTaskLogs,
  getOrCreateTodayEntry,
  insertCategory,
  insertSubtask,
  insertTask,
  toIconKey,
  toggleSubtaskLog,
  toggleTaskLog,
  updateCategoryIcon,
  updateCategoryName,
  updateDailyNote,
  updateTaskFrequency,
  type DailyScorePoint,
  type IconKey,
  type TaskFrequency,
} from "@hayat-borsasi/shared";
import { supabase } from "./supabase/client";

export interface Category {
  id: string;
  name: string;
  icon: IconKey;
}

export interface Task {
  id: string;
  categoryId: string;
  title: string;
  weight: number;
  frequency: TaskFrequency;
  completed: boolean;
  completedAt: string | null;
  subtaskTotal: number;
  subtaskCompleted: number;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

interface AppDataContextValue {
  loading: boolean;
  categories: Category[];
  tasks: Task[];
  subtasks: Subtask[];
  dailyNote: string;
  previousDailyScore: number;
  dailyHistory: DailyScorePoint[];
  addCategory: (name: string, icon: IconKey) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  renameCategory: (categoryId: string, name: string) => Promise<void>;
  changeCategoryIcon: (categoryId: string, icon: IconKey) => Promise<void>;
  addTask: (categoryId: string, title: string, weight: number, frequency: TaskFrequency) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  changeTaskFrequency: (taskId: string, frequency: TaskFrequency) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  removeSubtask: (subtaskId: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  setDailyNote: (note: string) => Promise<void>;
  refresh: () => Promise<void>;
  resetAllCategories: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dailyEntryId, setDailyEntryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [dailyNote, setDailyNoteState] = useState("");
  const [previousDailyScore, setPreviousDailyScore] = useState(0);
  const [dailyHistory, setDailyHistory] = useState<DailyScorePoint[]>([]);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const [dbCategories, dbTasks, dbSubtasks, entry] = await Promise.all([
      fetchCategories(supabase),
      fetchTasks(supabase),
      fetchSubtasks(supabase),
      getOrCreateTodayEntry(supabase, user.id),
    ]);

    const [logs, subtaskLogs, yesterdayLogs, yesterdaySubtaskLogs, historyEntries] = await Promise.all([
      fetchTaskLogs(supabase, entry.id),
      fetchSubtaskLogs(supabase, entry.id),
      fetchYesterdayTaskLogs(supabase, user.id),
      fetchYesterdaySubtaskLogs(supabase, user.id),
      fetchDailyHistory(supabase, user.id, daysAgoIso(365)),
    ]);
    const logByTaskId = new Map(logs.map((log) => [log.task_id, log]));
    const subtaskLogById = new Map(subtaskLogs.map((log) => [log.subtask_id, log]));
    const yesterdayLogByTaskId = new Map(yesterdayLogs.map((log) => [log.task_id, log]));
    const yesterdaySubtaskLogById = new Map(yesterdaySubtaskLogs.map((log) => [log.subtask_id, log]));

    const subtasksByTaskId = new Map<string, typeof dbSubtasks>();
    for (const s of dbSubtasks) {
      const arr = subtasksByTaskId.get(s.task_id) ?? [];
      arr.push(s);
      subtasksByTaskId.set(s.task_id, arr);
    }

    const nextSubtasks: Subtask[] = dbSubtasks.map((s) => ({
      id: s.id,
      taskId: s.task_id,
      title: s.title,
      completed: subtaskLogById.get(s.id)?.completed ?? false,
    }));

    const nextTasks = dbTasks.map((t) => {
      const log = logByTaskId.get(t.id);
      const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
      const subtaskCompleted = taskSubtasks.filter((s) => subtaskLogById.get(s.id)?.completed).length;
      return {
        id: t.id,
        categoryId: t.category_id,
        title: t.title,
        weight: t.weight,
        frequency: t.frequency,
        completed: log?.completed ?? false,
        completedAt: log?.completed_at ?? null,
        subtaskTotal: taskSubtasks.length,
        subtaskCompleted,
      };
    });

    const yesterdayWeighted = dbTasks.map((t) => {
      const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
      const subtaskCompleted = taskSubtasks.filter((s) => yesterdaySubtaskLogById.get(s.id)?.completed).length;
      return {
        weight: t.weight,
        completed: yesterdayLogByTaskId.get(t.id)?.completed ?? false,
        categoryId: t.category_id,
        subtaskTotal: taskSubtasks.length,
        subtaskCompleted,
      };
    });

    const nextDailyHistory: DailyScorePoint[] = historyEntries.map((day) => {
      const dayTaskLogById = new Map(day.daily_task_logs.map((l) => [l.task_id, l.completed]));
      const dayCompletedSubtaskIds = new Set(
        day.daily_subtask_logs.filter((l) => l.completed).map((l) => l.subtask_id)
      );

      const dayWeighted = dbTasks.map((t) => {
        const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
        return {
          weight: t.weight,
          completed: dayTaskLogById.get(t.id) ?? false,
          categoryId: t.category_id,
          subtaskTotal: taskSubtasks.length,
          subtaskCompleted: taskSubtasks.filter((s) => dayCompletedSubtaskIds.has(s.id)).length,
        };
      });

      const categoryScores: Record<string, number> = {};
      for (const category of dbCategories) {
        categoryScores[category.id] = calculateScore(dayWeighted.filter((t) => t.categoryId === category.id));
      }

      return { date: day.date, overallScore: calculateScore(dayWeighted), categoryScores };
    });

    setUserId(user.id);
    setCategories(dbCategories.map((c) => ({ id: c.id, name: c.name, icon: toIconKey(c.icon) })));
    setTasks(nextTasks);
    setSubtasks(nextSubtasks);
    setPreviousDailyScore(calculateScore(yesterdayWeighted));
    setDailyHistory(nextDailyHistory);
    setDailyEntryId(entry.id);
    setDailyNoteState(entry.note_text);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => subscription.unsubscribe();
  }, [load]);

  async function addCategory(name: string, icon: IconKey) {
    if (!userId) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const created = await insertCategory(supabase, userId, trimmed, icon, categories.length);
    setCategories((prev) => [...prev, { id: created.id, name: created.name, icon: toIconKey(created.icon) }]);
  }

  async function removeCategory(categoryId: string) {
    await deleteCategoryById(supabase, categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    const removedTaskIds = new Set(tasks.filter((t) => t.categoryId === categoryId).map((t) => t.id));
    setTasks((prev) => prev.filter((t) => t.categoryId !== categoryId));
    setSubtasks((prev) => prev.filter((s) => !removedTaskIds.has(s.taskId)));
  }

  async function renameCategory(categoryId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    await updateCategoryName(supabase, categoryId, trimmed);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name: trimmed } : c)));
  }

  async function changeCategoryIcon(categoryId: string, icon: IconKey) {
    await updateCategoryIcon(supabase, categoryId, icon);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, icon } : c)));
  }

  async function addTask(categoryId: string, title: string, weight: number, frequency: TaskFrequency) {
    if (!userId) return;
    const trimmed = title.trim();
    if (!trimmed) return;

    const created = await insertTask(
      supabase,
      userId,
      categoryId,
      trimmed,
      Math.min(10, Math.max(1, weight)),
      frequency
    );
    setTasks((prev) => [
      ...prev,
      {
        id: created.id,
        categoryId: created.category_id,
        title: created.title,
        weight: created.weight,
        frequency: created.frequency,
        completed: false,
        completedAt: null,
        subtaskTotal: 0,
        subtaskCompleted: 0,
      },
    ]);
  }

  async function removeTask(taskId: string) {
    await deleteTaskById(supabase, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setSubtasks((prev) => prev.filter((s) => s.taskId !== taskId));
  }

  async function toggleTask(taskId: string) {
    if (!dailyEntryId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const previousCompleted = task.completed;
    const previousCompletedAt = task.completedAt;
    const nextCompleted = !previousCompleted;
    const nextCompletedAt = nextCompleted ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted, completedAt: nextCompletedAt } : t))
    );

    try {
      const log = await toggleTaskLog(supabase, dailyEntryId, taskId, previousCompleted);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: log.completed, completedAt: log.completed_at } : t))
      );
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: previousCompleted, completedAt: previousCompletedAt } : t
        )
      );
      throw error;
    }
  }

  async function changeTaskFrequency(taskId: string, frequency: TaskFrequency) {
    await updateTaskFrequency(supabase, taskId, frequency);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, frequency } : t)));
  }

  async function addSubtask(taskId: string, title: string) {
    if (!userId) return;
    const trimmed = title.trim();
    if (!trimmed) return;

    const sortOrder = subtasks.filter((s) => s.taskId === taskId).length;
    const created = await insertSubtask(supabase, userId, taskId, trimmed, sortOrder);
    setSubtasks((prev) => [...prev, { id: created.id, taskId: created.task_id, title: created.title, completed: false }]);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtaskTotal: t.subtaskTotal + 1 } : t)));
  }

  async function removeSubtask(subtaskId: string) {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    await deleteSubtaskById(supabase, subtaskId);
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    setTasks((prev) =>
      prev.map((t) =>
        t.id === subtask.taskId
          ? {
              ...t,
              subtaskTotal: t.subtaskTotal - 1,
              subtaskCompleted: subtask.completed ? t.subtaskCompleted - 1 : t.subtaskCompleted,
            }
          : t
      )
    );
  }

  async function toggleSubtaskFn(subtaskId: string) {
    if (!dailyEntryId) return;
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    const previousCompleted = subtask.completed;
    const nextCompleted = !previousCompleted;
    const delta = nextCompleted ? 1 : -1;

    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, completed: nextCompleted } : s)));
    setTasks((prev) =>
      prev.map((t) => (t.id === subtask.taskId ? { ...t, subtaskCompleted: t.subtaskCompleted + delta } : t))
    );

    try {
      await toggleSubtaskLog(supabase, dailyEntryId, subtaskId, previousCompleted);
    } catch (error) {
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, completed: previousCompleted } : s)));
      setTasks((prev) =>
        prev.map((t) => (t.id === subtask.taskId ? { ...t, subtaskCompleted: t.subtaskCompleted - delta } : t))
      );
      throw error;
    }
  }

  async function setDailyNote(note: string) {
    setDailyNoteState(note);
    if (!dailyEntryId) return;
    await updateDailyNote(supabase, dailyEntryId, note);
  }

  async function resetAllCategories() {
    if (!userId) return;
    await deleteAllCategoriesForUser(supabase, userId);
    setCategories([]);
    setTasks([]);
    setSubtasks([]);
  }

  return (
    <AppDataContext.Provider
      value={{
        loading,
        categories,
        tasks,
        subtasks,
        dailyNote,
        previousDailyScore,
        dailyHistory,
        addCategory,
        removeCategory,
        renameCategory,
        changeCategoryIcon,
        addTask,
        removeTask,
        toggleTask,
        changeTaskFrequency,
        addSubtask,
        removeSubtask,
        toggleSubtask: toggleSubtaskFn,
        setDailyNote,
        refresh: load,
        resetAllCategories,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData, AppDataProvider içinde kullanılmalı");
  return ctx;
}
