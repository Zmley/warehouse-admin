// hooks/useAdminTasks.ts
import { useEffect, useState, useCallback } from "react";
import {
  fetchAllTasksAsAdmin,
  cancelTask as cancelTaskApi,
} from "../api/taskApi";

export default function useAdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllTasksAsAdmin();
      setTasks(res.tasks);
    } catch (err) {
      console.error("❌ Error fetching admin tasks:", err);
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const cancelTask = async (taskID: string) => {
    try {
      await cancelTaskApi(taskID);
      alert("✅ Task canceled successfully.");
      refetch();
    } catch (error) {
      console.error("❌ Failed to cancel task:", error);
      alert("Failed to cancel task.");
    }
  };

  return { tasks, loading, error, cancelTask, refetch };
}
