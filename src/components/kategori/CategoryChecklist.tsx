"use client";

import { motion } from "motion/react";
import { TaskRow } from "@/components/TaskRow";
import { AddTaskForm } from "@/components/kategori/AddTaskForm";
import type { Task } from "@/lib/supabase/app-data-context";

export function CategoryChecklist({
  categoryId,
  tasks,
  onDeleteTask,
}: {
  categoryId: string;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Görevler</h2>

      <ul className="flex flex-col gap-1">
        {tasks.length === 0 && (
          <li className="px-2 py-3 text-sm text-muted">Bu kategoride henüz görev yok.</li>
        )}
        {tasks.map((task, index) => (
          <motion.li key={task.id} layout transition={{ type: "spring", stiffness: 500, damping: 34, mass: 0.9 }}>
            <TaskRow
              task={task}
              onDelete={() => onDeleteTask(task.id)}
              allowManageSubtasks
              canMoveUp={index > 0}
              canMoveDown={index < tasks.length - 1}
            />
          </motion.li>
        ))}
      </ul>

      <AddTaskForm categoryId={categoryId} />
    </div>
  );
}
