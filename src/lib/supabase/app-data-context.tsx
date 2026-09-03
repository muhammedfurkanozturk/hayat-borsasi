"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { IconKey } from "@/components/icons";
import { createClient } from "./client";
import {
  deleteAllCategoriesForUser,
  deleteCategoryById,
  fetchCategories,
  insertCategoriesFromTemplates,
  insertCategory,
  toIconKey,
  updateCategoryIcon,
  updateCategoryName,
} from "./categories";
import {
  deleteTaskById,
  fetchTasks,
  insertTask,
  swapTaskSortOrder,
  updateHabitCost,
  updateTaskFrequency,
  updateTaskWeight,
  type TaskFrequency,
} from "./tasks";
import {
  daysAgoIso,
  fetchTaskLogs,
  fetchYesterdayTaskLogs,
  getOrCreateTodayEntry,
  toggleTaskLog,
  updateDailyNote,
} from "./daily";
import { fetchDailyHistory } from "./history";
import {
  deleteSubtaskById,
  fetchSubtaskLogs,
  fetchSubtasks,
  fetchYesterdaySubtaskLogs,
  insertSubtask,
  toggleSubtaskLog,
} from "./subtasks";
import { calculateScore } from "@/lib/scoring";
import {
  ONBOARDING_TEMPLATES,
  slugifyCategoryName,
  type CategoryModuleType,
  type DailyScorePoint,
  type HabitCostPeriod,
} from "@hayat-borsasi/shared";

export type { TaskFrequency } from "./tasks";
export type { HabitCostPeriod } from "@hayat-borsasi/shared";
export type { CategoryModuleType, DailyScorePoint } from "@hayat-borsasi/shared";

export interface Category {
  id: string;
  name: string;
  icon: IconKey;
  moduleType: CategoryModuleType;
  // "eksikler" envanteri madde 9 — okunur kategori URL'leri. Migration
  // henüz uygulanmamışsa null, linkler bu durumda id'ye düşer.
  slug: string | null;
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
  isHabitBreak: boolean;
  habitCostAmount: number | null;
  habitCostPeriod: HabitCostPeriod | null;
  createdAt: string;
  // 2026-08-28: sort_order migration'ı henüz uygulanmamışsa null kalır —
  // moveTaskUp/moveTaskDown bu durumda no-op olup konsola uyarı yazar.
  sortOrder: number | null;
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
  addCategoriesFromTemplates: (
    templates: { name: string; icon: IconKey; moduleType: CategoryModuleType }[]
  ) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  renameCategory: (categoryId: string, name: string) => Promise<void>;
  changeCategoryIcon: (categoryId: string, icon: IconKey) => Promise<void>;
  addTask: (categoryId: string, title: string, weight: number, frequency: TaskFrequency, isHabitBreak?: boolean) => Promise<string>;
  removeTask: (taskId: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  changeTaskFrequency: (taskId: string, frequency: TaskFrequency) => Promise<void>;
  changeTaskWeight: (taskId: string, weight: number) => Promise<void>;
  moveTaskUp: (taskId: string) => Promise<void>;
  moveTaskDown: (taskId: string) => Promise<void>;
  changeHabitCost: (taskId: string, costAmount: number | null, costPeriod: HabitCostPeriod | null) => Promise<void>;
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
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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
          isHabitBreak: t.is_habit_break,
          habitCostAmount: t.habit_cost_amount,
          habitCostPeriod: t.habit_cost_period,
          createdAt: t.created_at,
          sortOrder: t.sort_order ?? null,
        };
      });

      // Aynı görev ağırlıklarını, dünkü işaretlenme durumuyla eşleştirip
      // "önceki güne göre değişim" (delta) için bir kıyas noktası çıkarıyoruz.
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

      // Geçmişteki her gün için, o günün işaretlenme kayıtlarını güncel görev/
      // kategori tanımlarıyla eşleştirip o günün skorunu çıkarıyoruz (bugünkü
      // satır da dahil, ama bugünkü canlı değeri kullanan bileşenler bunu
      // kendi anlık hesaplamalarıyla ezip günceller — bkz. Dashboard/ScoreChart).
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
      setCategories(
        dbCategories.map((c) => ({ id: c.id, name: c.name, icon: toIconKey(c.icon), moduleType: c.module_type, slug: c.slug }))
      );
      setTasks(nextTasks);
      setSubtasks(nextSubtasks);
      setPreviousDailyScore(calculateScore(yesterdayWeighted));
      setDailyHistory(nextDailyHistory);
      setDailyEntryId(entry.id);
      setDailyNoteState(entry.note_text);
    } catch (error) {
      // Supabase oturum/ağ hataları (örn. saat kaymasından kaynaklanan
      // "JWT issued at future") burada sessizce loglanıyor — yakalanmazsa
      // unhandled rejection olarak Next.js dev overlay'ine düşüyordu.
      console.error("AppDataProvider.load() başarısız:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount'ta kullanıcının verisini çekiyoruz — effect'in React tarafından
    // önerilen meşru kullanımlarından biri (dış sistemden veri çekme).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function addCategory(name: string, icon: IconKey) {
    if (!userId) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const created = await insertCategory(supabase, userId, trimmed, icon, categories.length);
    setCategories((prev) => [
      ...prev,
      { id: created.id, name: created.name, icon: toIconKey(created.icon), moduleType: created.module_type, slug: created.slug },
    ]);
  }

  async function addCategoriesFromTemplates(
    templates: { name: string; icon: IconKey; moduleType: CategoryModuleType }[]
  ) {
    if (!userId || templates.length === 0) return;

    const supabase = createClient();
    const created = await insertCategoriesFromTemplates(supabase, userId, templates, categories.length);
    setCategories((prev) => [
      ...prev,
      ...created.map((c) => ({ id: c.id, name: c.name, icon: toIconKey(c.icon), moduleType: c.module_type, slug: c.slug })),
    ]);
  }

  async function removeCategory(categoryId: string) {
    const supabase = createClient();
    await deleteCategoryById(supabase, categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    const removedTaskIds = new Set(tasks.filter((t) => t.categoryId === categoryId).map((t) => t.id));
    setTasks((prev) => prev.filter((t) => t.categoryId !== categoryId));
    setSubtasks((prev) => prev.filter((s) => !removedTaskIds.has(s.taskId)));
  }

  async function renameCategory(categoryId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const supabase = createClient();
    await updateCategoryName(supabase, categoryId, trimmed);
    // Optimistik slug güncellemesi — updateCategoryName'in DB'de yaptığı
    // AYNI slugify kuralı, migration henüz uygulanmadıysa (slug hep null
    // kalıyor) da zararsız.
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: trimmed, slug: slugifyCategoryName(trimmed) } : c))
    );
  }

  async function changeCategoryIcon(categoryId: string, icon: IconKey) {
    const supabase = createClient();
    await updateCategoryIcon(supabase, categoryId, icon);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, icon } : c)));
  }

  async function addTask(categoryId: string, title: string, weight: number, frequency: TaskFrequency, isHabitBreak = false) {
    if (!userId) return "";
    const trimmed = title.trim();
    if (!trimmed) return "";

    const supabase = createClient();
    // Yeni görev, o kategorideki mevcut görev sayısı kadar sort_order ile
    // (yani her zaman en sona) ekleniyor — kullanıcının "hangi sırayla
    // oluşturdum o sırada kalsın" beklentisiyle tutarlı.
    const nextSortOrder = tasks.filter((t) => t.categoryId === categoryId).length;
    const created = await insertTask(
      supabase,
      userId,
      categoryId,
      trimmed,
      Math.min(10, Math.max(1, weight)),
      frequency,
      isHabitBreak,
      nextSortOrder
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
        isHabitBreak: created.is_habit_break,
        habitCostAmount: created.habit_cost_amount,
        habitCostPeriod: created.habit_cost_period,
        createdAt: created.created_at,
        sortOrder: created.sort_order ?? null,
      },
    ]);
    return created.id;
  }

  // Kategori sayfasındaki "Görevler" listesinde yukarı/aşağı butonlarıyla
  // elle sıralama (2026-08-28, kullanıcı bulgusu — ağırlığa göre otomatik
  // sıralama istenmiyordu). Aynı kategorideki komşu görevle sort_order'ı
  // takas eder — optimistic güncelleme, sunucu hatası durumunda geri alınır.
  async function moveTask(taskId: string, direction: "up" | "down") {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const siblings = tasks
      .filter((t) => t.categoryId === task.categoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const index = siblings.findIndex((t) => t.id === taskId);
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= siblings.length) return;
    const neighbor = siblings[neighborIndex];
    if (task.sortOrder == null || neighbor.sortOrder == null) {
      console.error("Görev sırası değiştirilemedi (migration uygulanmamış olabilir).");
      return;
    }
    const taskOrder = task.sortOrder;
    const neighborOrder = neighbor.sortOrder;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) return { ...t, sortOrder: neighborOrder };
        if (t.id === neighbor.id) return { ...t, sortOrder: taskOrder };
        return t;
      })
    );
    const supabase = createClient();
    try {
      await swapTaskSortOrder(supabase, task.id, taskOrder, neighbor.id, neighborOrder);
    } catch (err) {
      console.error("Görev sırası kaydedilemedi:", err);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) return { ...t, sortOrder: taskOrder };
          if (t.id === neighbor.id) return { ...t, sortOrder: neighborOrder };
          return t;
        })
      );
    }
  }

  async function moveTaskUp(taskId: string) {
    await moveTask(taskId, "up");
  }

  async function moveTaskDown(taskId: string) {
    await moveTask(taskId, "down");
  }

  async function changeHabitCost(taskId: string, costAmount: number | null, costPeriod: HabitCostPeriod | null) {
    const supabase = createClient();
    await updateHabitCost(supabase, taskId, costAmount, costPeriod);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, habitCostAmount: costAmount, habitCostPeriod: costPeriod } : t))
    );
  }

  async function removeTask(taskId: string) {
    const supabase = createClient();
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

    // Optimistic update — ağ isteği dönene kadar beklemeden checkbox'ı
    // anında değiştiriyoruz, bu yüzden tıklama gecikmesiz hissettiriyor.
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted, completedAt: nextCompletedAt } : t))
    );

    const supabase = createClient();
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
    const supabase = createClient();
    await updateTaskFrequency(supabase, taskId, frequency);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, frequency } : t)));
  }

  async function changeTaskWeight(taskId: string, weight: number) {
    const supabase = createClient();
    await updateTaskWeight(supabase, taskId, weight);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, weight } : t)));
  }

  async function addSubtask(taskId: string, title: string) {
    if (!userId) return;
    const trimmed = title.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const sortOrder = subtasks.filter((s) => s.taskId === taskId).length;
    const created = await insertSubtask(supabase, userId, taskId, trimmed, sortOrder);
    setSubtasks((prev) => [...prev, { id: created.id, taskId: created.task_id, title: created.title, completed: false }]);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtaskTotal: t.subtaskTotal + 1 } : t))
    );
  }

  async function removeSubtask(subtaskId: string) {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (!subtask) return;

    const supabase = createClient();
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

    // Optimistic update — bkz. toggleTask üstündeki not.
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, completed: nextCompleted } : s)));
    setTasks((prev) =>
      prev.map((t) => (t.id === subtask.taskId ? { ...t, subtaskCompleted: t.subtaskCompleted + delta } : t))
    );

    const supabase = createClient();
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
    const supabase = createClient();
    await updateDailyNote(supabase, dailyEntryId, note);
  }

  async function resetAllCategories() {
    if (!userId) return;
    const supabase = createClient();
    await deleteAllCategoriesForUser(supabase, userId);
    setTasks([]);
    setSubtasks([]);

    const recreated = await insertCategoriesFromTemplates(supabase, userId, ONBOARDING_TEMPLATES, 0);
    setCategories(
      recreated.map((c) => ({ id: c.id, name: c.name, icon: toIconKey(c.icon), moduleType: c.module_type, slug: c.slug }))
    );
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
        addCategoriesFromTemplates,
        removeCategory,
        renameCategory,
        changeCategoryIcon,
        addTask,
        removeTask,
        toggleTask,
        changeTaskFrequency,
        changeTaskWeight,
        moveTaskUp,
        moveTaskDown,
        changeHabitCost,
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
