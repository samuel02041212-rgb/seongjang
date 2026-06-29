"use client";

import { useCallback, useEffect, useState } from "react";

import {
  notifyTodosUpdated,
  TODOS_UPDATED_EVENT,
  type UserTodoJson,
} from "@/lib/user-todo";

export function useUserTodos(userId: string) {
  const [todos, setTodos] = useState<UserTodoJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/todos?userId=${encodeURIComponent(userId)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setTodos([]);
        return;
      }
      setTodos((await res.json()) as UserTodoJson[]);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => void load();
    window.addEventListener(TODOS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(TODOS_UPDATED_EVENT, onUpdate);
  }, [load]);

  const addTodo = useCallback(
    async (text: string, date: string) => {
      setPending(true);
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, date }),
        });
        if (!res.ok) return false;
        notifyTodosUpdated();
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const toggleTodo = useCallback(async (id: string, done: boolean) => {
    setPending(true);
    try {
      const res = await fetch(`/api/todos/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });
      if (!res.ok) return false;
      notifyTodosUpdated();
      return true;
    } catch {
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  return { todos, loading, pending, addTodo, toggleTodo, reload: load };
}
