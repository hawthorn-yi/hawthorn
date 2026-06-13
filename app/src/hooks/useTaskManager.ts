import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Task, ProgressEntry, Attachment, CustomCategory, ProjectMember } from "@/types";
import { DEFAULT_CATEGORIES } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { parseMentions, resolveMentions } from "@/lib/mentions";
import * as XLSX from "xlsx";

function generateId(): string {
  // Use crypto.randomUUID for tables that require UUID format
  return crypto.randomUUID();
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getStatus(task: Task): Task["status"] {
  if (task.status === "terminated") return "terminated";
  if (task.progress === 100) return "completed";
  const today = new Date(getToday());
  const deadline = new Date(task.deadline);
  if (deadline < today) return "overdue";
  return "active";
}


export function useTaskManager() {
  const { user, isAdmin } = useAuth();
  const authUserRef = useRef(user);
  authUserRef.current = user;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allCategories, setAllCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  const userMapRef = useRef<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUserId = useCallback(() => authUserRef.current?.id ?? null, []);
  const getCurrentUsername = useCallback(() => authUserRef.current?.username, []);

  const currentUserId = user?.id;

  // ─── Fetch all data from Supabase ───
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch categories
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

      // Fetch project members
      const { data: members } = await supabase
        .from("project_members")
        .select("*");

      // Get the list of task IDs the current user is a member of
      const userId = getCurrentUserId();
      const memberTaskIds = userId
        ? (members || []).filter((m) => m.user_id === userId).map((m) => m.task_id)
        : [];

      // Fetch tasks - all tasks for now, filtering done client-side for visibility
      const { data: rawTasks } = await supabase
        .from("tasks")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: true });

      // Fetch progress entries
      const { data: entries } = await supabase
        .from("progress_entries")
        .select("*")
        .order("timestamp", { ascending: true });

      // Fetch attachments
      const { data: atts } = await supabase
        .from("attachments")
        .select("*");

      // Fetch user_roles for member name resolution
      const { data: appUsers } = await supabase
        .from("user_roles")
        .select("user_id, display_name");

      const userMap = new Map<string, string>();
      // Also build normalized display_name → display_name map for legacy data compatibility
      const usernameMap = new Map<string, string>();
      (appUsers || []).forEach((u) => {
        userMap.set(u.user_id, u.display_name);
        usernameMap.set(u.display_name.toLowerCase(), u.display_name);
      });

      // Also try fetching app_users table as fallback (some systems use this for legacy accounts)
      let fallbackUserMap: Map<string, string> | null = null;
      try {
        const { data: appUsersLegacy } = await supabase
          .from("app_users")
          .select("id, display_name");
        if (appUsersLegacy && appUsersLegacy.length > 0) {
          fallbackUserMap = new Map();
          appUsersLegacy.forEach((u) => {
            // Try both "id" field and common user_id patterns
            const uid = (u as Record<string, unknown>).id as string || (u as Record<string, unknown>).user_id as string;
            const dn = (u as Record<string, unknown>).display_name as string || (u as Record<string, unknown>).username as string;
            if (uid && dn && fallbackUserMap) {
              fallbackUserMap.set(uid, dn);
              fallbackUserMap.set(dn.toLowerCase(), dn);
            }
          });
        }
      } catch (e) {
        // app_users table may not exist or be inaccessible - ignore
      }

      // Also build a username->id map for @mention resolution
      const usernameToIdMap = new Map<string, string>();
      (appUsers || []).forEach((u) => {
        usernameToIdMap.set(u.display_name, u.user_id);
        usernameToIdMap.set(u.display_name.toLowerCase(), u.user_id);
      });
      setUserMap(usernameToIdMap);
      userMapRef.current = usernameToIdMap;

      // Enrich project members with usernames
      const enrichedMembers: ProjectMember[] = (members || []).map((m) => {
        let username = userMap.get(m.user_id); // Try UUID lookup first
        if (!username) {
          // user_id might be a username itself (legacy data: "kevin", "肖伍秋", "001")
          username = usernameMap.get(m.user_id.toLowerCase());
        }
        // Try fallback app_users table
        if (!username && fallbackUserMap) {
          username = fallbackUserMap.get(m.user_id) || fallbackUserMap.get(m.user_id.toLowerCase());
        }
        if (!username) {
          // user_id might be a partial/abbreviated username match
          for (const [key, val] of usernameMap) {
            if (key.includes(m.user_id.toLowerCase()) || m.user_id.toLowerCase().includes(key)) {
              username = val;
              break;
            }
          }
          // Also check fallbackUserMap for partial match
          if (!username && fallbackUserMap) {
            for (const [key, val] of fallbackUserMap) {
              if (key.includes(m.user_id.toLowerCase()) || m.user_id.toLowerCase().includes(key)) {
                username = val;
                break;
              }
            }
          }
        }
        if (!username) {
          // Last resort: short IDs show as-is, unknown UUIDs show "未知用户"
          if (m.user_id.length > 30) {
            username = "未知用户";
          } else {
            username = m.user_id;
          }
        }
        return {
          id: m.id,
          task_id: m.task_id,
          user_id: m.user_id,
          role: m.role,
          username,
          created_at: m.created_at,
        };
      });
      setProjectMembers(enrichedMembers);

      // Assemble tasks with nested history and attachments
      const assembledTasks: Task[] = (rawTasks || []).map((t, i) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        createdDate: t.created_date,
        deadline: t.deadline,
        progress: t.progress,
        status: t.status,
        sort_order: t.sort_order ?? i,
        owner_id: t.owner_id,
        assignee_id: t.assignee_id,
        assignee_username: t.assignee_username || userMap.get(t.assignee_id || "") || usernameMap.get((t.assignee_id || "").toLowerCase()) || (fallbackUserMap?.get(t.assignee_id || "")) || (fallbackUserMap?.get((t.assignee_id || "").toLowerCase())) || undefined,
        history: (entries || [])
          .filter((e) => e.task_id === t.id)
          .map((e) => ({
            id: e.id,
            taskId: e.task_id,
            timestamp: e.timestamp,
            progress: e.progress,
            note: e.note,
            username: e.username,
          })),
        attachments: (atts || [])
          .filter((a) => a.task_id === t.id)
          .map((a) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            dataUrl: a.data_url,
          })),
      }));

      // Recalculate statuses
      const updatedTasks = assembledTasks.map((t) => ({
        ...t,
        status: getStatus(t),
      }));

      // Filter tasks: if user is admin, show all tasks
      // Otherwise, if user is logged in, only show tasks they're a member of
      // If no user or no project_members exist (legacy), show all tasks
      const token = authUserRef.current;
      const isAdmin = token?.role === "admin";
      const filteredTasks = isAdmin
        ? updatedTasks
        : userId && (members || []).length > 0
          ? updatedTasks.filter((t) => memberTaskIds.includes(t.id))
          : updatedTasks;

      setTasks(filteredTasks);

      if (cats && cats.length > 0) {
        setAllCategories(cats.map((c) => ({ id: c.id, name: c.name, color: c.color })));
      } else {
        setAllCategories(DEFAULT_CATEGORIES);
      }

      setError(null);
    } catch (e) {
      console.error("Failed to fetch data from Supabase:", e);
      setError("无法连接数据库，请检查网络连接");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

    // ─── Realtime subscription for multi-client sync ───
  // Consolidated: single channel with debounce to reduce connections and re-fetches
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchAllData(), 300);
    };

    try {
      channel = supabase
        .channel("project-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, handleChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, handleChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "progress_entries" }, handleChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "attachments" }, handleChange)
        .on("postgres_changes", { event: "*", schema: "public", table: "project_members" }, handleChange)
        .subscribe();
    } catch {
      // Realtime not available -- app still works without live sync
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // ─── Project Member helpers ───
  const getTaskMembers = useCallback((taskId: string): ProjectMember[] => {
    return projectMembers.filter((m) => m.task_id === taskId);
  }, [projectMembers]);

  const addProjectMember = useCallback(async (taskId: string, userId: string, role: "owner" | "member" = "member", username?: string) => {
    const pmId = generateId();
    const newMember: ProjectMember = {
      id: pmId,
      task_id: taskId,
      user_id: userId,
      role,
      username,
    };

    setProjectMembers((prev) => [...prev, newMember]);

    await supabase.from("project_members").insert({
      id: pmId,
      task_id: taskId,
      user_id: userId,
      role,
    });

    return newMember;
  }, []);

  const removeProjectMember = useCallback(async (memberId: string) => {
    // Save previous state for rollback
    let previousMembers: ProjectMember[] = [];
    setProjectMembers((prev) => {
      previousMembers = prev;
      return prev.filter((m) => m.id !== memberId);
    });
    try {
      const { error: deleteError } = await supabase.from("project_members").delete().eq("id", memberId);
      if (deleteError) {
        // Rollback on failure
        setProjectMembers(previousMembers);
        toast.error(`删除成员失败: ${deleteError.message}`);
      }
    } catch {
      // Rollback on network error
      setProjectMembers(previousMembers);
      toast.error("删除成员失败: 网络错误，请检查连接后重试");
    }
  }, []);

  const updateProjectMemberRole = useCallback(async (memberId: string, role: "owner" | "member") => {
    setProjectMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
    await supabase.from("project_members").update({ role }).eq("id", memberId);
  }, []);

  // ─── CRUD Operations ───

  const addTask = useCallback(async (data: {
    name: string;
    category: string;
    createdDate: string;
    deadline: string;
    progress: number;
    note?: string;
    memberIds?: string[];
    assigneeId?: string;
    assigneeUsername?: string;
  }): Promise<Task> => {
    const taskId = generateId();
    const entryId = generateId();
    const now = new Date().toISOString();
    const userId = getCurrentUserId();

    // Assign sort_order: highest existing + 1
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.sort_order), -1);

    const task: Task = {
      id: taskId,
      name: data.name,
      category: data.category,
      createdDate: data.createdDate,
      deadline: data.deadline,
      progress: data.progress,
      status: "active",
      history: [{
        id: entryId,
        taskId,
        timestamp: now,
        progress: data.progress,
        note: data.note || "创建任务",
        username: getCurrentUsername(),
      }],
      attachments: [],
      sort_order: maxOrder + 1,
      owner_id: userId || undefined,
      assignee_id: data.assigneeId,
      assignee_username: data.assigneeUsername,
    };
    task.status = getStatus(task);

    // Optimistic update
    setTasks((prev) => [task, ...prev]);

    // Write to Supabase
    await supabase.from("tasks").insert({
      id: taskId,
      name: data.name,
      category: data.category,
      created_date: data.createdDate,
      deadline: data.deadline,
      progress: data.progress,
      status: task.status,
      sort_order: task.sort_order,
      owner_id: userId || undefined,
      assignee_id: data.assigneeId || null,
      assignee_username: data.assigneeUsername || null,
    });

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: now,
      progress: data.progress,
      note: data.note || "创建任务",
      username: getCurrentUsername(),
    });

    // Create @mention notifications for the initial note
    if (data.note && data.note.trim() !== "") {
      const mentions = parseMentions(data.note);
      if (mentions.length > 0) {
        const fromUserId = userId;
        const resolved = resolveMentions(mentions, userMapRef.current);
        for (const mention of resolved) {
          // Don't notify yourself
          if (mention.userId !== fromUserId) {
            await supabase.from("notifications").insert({
              id: generateId(),
              from_user_id: fromUserId,
              to_user_id: mention.userId,
              task_id: taskId,
              progress_entry_id: entryId,
              note: data.note.trim(),
              mentioned_username: mention.username,
            });
          }
        }
      }
    }

    // Add project members
    if (userId) {
      await supabase.from("project_members").insert({
        id: generateId(),
        task_id: taskId,
        user_id: userId,
        role: "owner",
      });
    }

    if (data.memberIds && data.memberIds.length > 0) {
      for (const memberId of data.memberIds) {
        if (memberId !== userId) {
          await supabase.from("project_members").insert({
            id: generateId(),
            task_id: taskId,
            user_id: memberId,
            role: "member",
          });
        }
      }
    }

    // Refresh to get proper member list
    await fetchAllData();

    return task;
  }, [fetchAllData]);

  const updateTask = useCallback(async (taskId: string, data: {
    name?: string;
    category?: string;
    createdDate?: string;
    deadline?: string;
    progress?: number;
    note?: string;
    assigneeId?: string | null;
    assigneeUsername?: string | null;
  }): Promise<Task | null> => {
    let result: Task | null = null;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updated = { ...task };
        if (data.name !== undefined) updated.name = data.name;
        if (data.category !== undefined) updated.category = data.category;
        if (data.createdDate !== undefined) updated.createdDate = data.createdDate;
        if (data.deadline !== undefined) updated.deadline = data.deadline;
        if (data.assigneeId !== undefined) updated.assignee_id = data.assigneeId ?? undefined;
        if (data.assigneeUsername !== undefined) updated.assignee_username = data.assigneeUsername ?? undefined;

        if (data.progress !== undefined) {
          updated.progress = Math.max(0, Math.min(100, data.progress));
        }
        updated.status = getStatus(updated);
        result = updated;
        return updated;
      })
    );

    // Build update payload
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.createdDate !== undefined) updatePayload.created_date = data.createdDate;
    if (data.deadline !== undefined) updatePayload.deadline = data.deadline;
    if (data.progress !== undefined) updatePayload.progress = Math.max(0, Math.min(100, data.progress));
    if (data.assigneeId !== undefined) updatePayload.assignee_id = data.assigneeId ?? null;
    if (data.assigneeUsername !== undefined) updatePayload.assignee_username = data.assigneeUsername ?? null;
    if (result) updatePayload.status = (result as Task).status;
    updatePayload.updated_at = new Date().toISOString();

    await supabase.from("tasks").update(updatePayload).eq("id", taskId);

    // Add progress entry if progress, note, deadline, or assignee changed
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return result;

    const hasNote = data.note !== undefined && data.note.trim() !== "";
    const progressChanged = data.progress !== undefined && data.progress !== task.progress;
    const deadlineChanged = data.deadline !== undefined && data.deadline !== task.deadline;
    const assigneeChanged = data.assigneeId !== undefined && data.assigneeId !== (task.assignee_id || null);

    if (progressChanged || hasNote || deadlineChanged || assigneeChanged) {
      const newProgress = data.progress !== undefined ? Math.max(0, Math.min(100, data.progress)) : task.progress;
      const entryId = generateId();

      // Build note: priority is manual note > assignee change > deadline change > progress change
      let noteText: string;
      if (hasNote) {
        noteText = data.note!.trim();
      } else if (assigneeChanged) {
        if (data.assigneeId) {
          const assigneeName = data.assigneeUsername || data.assigneeId;
          noteText = `指派给了 ${assigneeName}`;
        } else {
          noteText = "取消了指派";
        }
      } else if (deadlineChanged) {
        const oldDeadline = task.deadline || "未设置";
        const newDeadline = data.deadline!;
        noteText = `截止日期从 ${oldDeadline} 调整为 ${newDeadline}`;
      } else {
        noteText = `进度更新至 ${newProgress}%`;
      }

      const entry: ProgressEntry = {
        id: entryId,
        taskId,
        timestamp: new Date().toISOString(),
        progress: newProgress,
        note: noteText,
        username: getCurrentUsername(),
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, history: [...t.history, entry] };
        })
      );

      await supabase.from("progress_entries").insert({
        id: entryId,
        task_id: taskId,
        timestamp: entry.timestamp,
        progress: entry.progress,
        note: entry.note,
        username: getCurrentUsername(),
      });

      // Create @mention notifications
      if (hasNote) {
        const mentions = parseMentions(data.note!);
        if (mentions.length > 0) {
          const fromUserId = getCurrentUserId();
          const resolved = resolveMentions(mentions, userMapRef.current);
          for (const mention of resolved) {
            // Don't notify yourself
            if (mention.userId !== fromUserId) {
              await supabase.from("notifications").insert({
                id: generateId(),
                from_user_id: fromUserId,
                to_user_id: mention.userId,
                task_id: taskId,
                progress_entry_id: entryId,
                note: data.note!.trim(),
                mentioned_username: mention.username,
              });
            }
          }
        }
      }
    }

    return result;
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const token = authUserRef.current;
    const isAdmin = token?.role === "admin";
    const isOwner = token?.id && task.owner_id === token.id;

    // Only admin or owner can delete
    if (!isAdmin && !isOwner) {
      toast.error("只有任务创建者和管理员才能删除任务");
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  }, [tasks]);

  const toggleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const completed = task.progress === 100;
    const newProgress = completed ? 0 : 100;
    const entryId = generateId();
    const now = new Date().toISOString();

    const updated = {
      ...task,
      progress: newProgress,
      history: [...task.history, {
        id: entryId,
        taskId,
        timestamp: now,
        progress: newProgress,
        note: completed ? "重新打开" : "标记完成",
        username: getCurrentUsername(),
      }],
    };
    updated.status = getStatus(updated);

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));

    await supabase.from("tasks").update({
      progress: newProgress,
      status: updated.status,
      updated_at: now,
    }).eq("id", taskId);

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: now,
      progress: newProgress,
      note: completed ? "重新打开" : "标记完成",
      username: getCurrentUsername(),
    });
  }, [tasks]);

  const terminateTask = useCallback(async (taskId: string): Promise<Task | null> => {
    let result: Task | null = null;
    const entryId = generateId();
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updated = {
          ...task,
          status: "terminated" as const,
          history: [...task.history, {
            id: entryId,
            taskId,
            timestamp: now,
            progress: task.progress,
            note: "项目已终止",
            username: getCurrentUsername(),
          }],
        };
        result = updated;
        return updated;
      })
    );

    await supabase.from("tasks").update({
      status: "terminated",
      updated_at: now,
    }).eq("id", taskId);

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: now,
      progress: (result as unknown as Task | undefined)?.progress ?? 0,
      note: "项目已终止",
      username: getCurrentUsername(),
    });

    return result;
  }, []);

  const restoreTask = useCallback(async (taskId: string): Promise<Task | null> => {
    let result: Task | null = null;
    const entryId = generateId();
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const restored: Task = {
          ...task,
          status: "active",
          history: [...task.history, {
            id: entryId,
            taskId,
            timestamp: now,
            progress: task.progress,
            note: "项目已恢复",
            username: getCurrentUsername(),
          }],
        };
        restored.status = getStatus(restored);
        result = restored;
        return restored;
      })
    );

    const task = tasks.find((t) => t.id === taskId);
    const restoredStatus = getStatus({ ...task!, status: "active" });

    await supabase.from("tasks").update({
      status: restoredStatus,
      updated_at: now,
    }).eq("id", taskId);

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: now,
      progress: task?.progress ?? 0,
      note: "项目已恢复",
      username: getCurrentUsername(),
    });

    return result;
  }, [tasks]);

  const deleteHistoryEntry = useCallback(async (taskId: string, entryId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, history: t.history.filter((h) => h.id !== entryId) };
      })
    );
    await supabase.from("progress_entries").delete().eq("id", entryId).eq("task_id", taskId);
  }, []);

  const addCustomCategory = useCallback(async (name: string, color: string): Promise<CustomCategory> => {
    const newCat: CustomCategory = {
      id: "custom-" + generateId(),
      name,
      color,
    };
    setAllCategories((prev) => [...prev, newCat]);
    await supabase.from("categories").insert({
      id: newCat.id,
      name,
      color,
    });
    return newCat;
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: { name?: string; color?: string }) => {
    setAllCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return { ...cat, ...data };
      })
    );
    await supabase.from("categories").update(data).eq("id", categoryId);
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const cat = allCategories.find((c) => c.id === categoryId);
    if (!cat) return;

    const tasksUsing = tasks.filter((t) => t.category === categoryId);
    if (tasksUsing.length > 0) {
      const fallbackId = allCategories.find((c) => c.id !== categoryId)?.id;
      if (fallbackId) {
        setTasks((prev) =>
          prev.map((t) => (t.category === categoryId ? { ...t, category: fallbackId } : t))
        );
        for (const t of tasksUsing) {
          await supabase.from("tasks").update({ category: fallbackId }).eq("id", t.id);
        }
      }
    }
    setAllCategories((prev) => prev.filter((c) => c.id !== categoryId));
    await supabase.from("categories").delete().eq("id", categoryId);
  }, [tasks, allCategories]);

  const addAttachment = useCallback(async (taskId: string, file: File) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      size: file.size,
      dataUrl,
    };

    // Build history entry for attachment upload
    const entryId = generateId();
    const entry: ProgressEntry = {
      id: entryId,
      taskId,
      timestamp: new Date().toISOString(),
      progress: 0, // no progress change
      note: `上传了附件 ${file.name}`,
      username: getCurrentUsername(),
    };

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          attachments: [...(task.attachments || []), attachment],
          history: [...task.history, entry],
        };
      })
    );

    await supabase.from("attachments").insert({
      id: attachment.id,
      task_id: taskId,
      name: file.name,
      size: file.size,
      data_url: dataUrl,
    });

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: entry.timestamp,
      progress: entry.progress,
      note: entry.note,
      username: getCurrentUsername(),
    });
  }, []);

  const removeAttachment = useCallback(async (taskId: string, attachmentId: string) => {
    // Find attachment name before removing
    const task = tasks.find((t) => t.id === taskId);
    const att = task?.attachments?.find((a) => a.id === attachmentId);
    const attName = att?.name || "未知文件";

    // Build history entry for attachment deletion
    const entryId = generateId();
    const entry: ProgressEntry = {
      id: entryId,
      taskId,
      timestamp: new Date().toISOString(),
      progress: 0, // no progress change
      note: `删除了附件 ${attName}`,
      username: getCurrentUsername(),
    };

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          attachments: (task.attachments || []).filter((a) => a.id !== attachmentId),
          history: [...task.history, entry],
        };
      })
    );
    await supabase.from("attachments").delete().eq("id", attachmentId);

    await supabase.from("progress_entries").insert({
      id: entryId,
      task_id: taskId,
      timestamp: entry.timestamp,
      progress: entry.progress,
      note: entry.note,
      username: getCurrentUsername(),
    });
  }, [tasks]);

  const updateAttachment = useCallback(async (taskId: string, attachmentId: string, file: File) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          attachments: (task.attachments || []).map((a) =>
            a.id === attachmentId
              ? { ...a, name: file.name, size: file.size, dataUrl }
              : a
          ),
        };
      })
    );

    await supabase.from("attachments").update({
      name: file.name,
      size: file.size,
      data_url: dataUrl,
    }).eq("id", attachmentId);
  }, []);

  const exportData = useCallback((): string => {
    const data = {
      tasks,
      categories: allCategories,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [tasks, allCategories]);

  const exportExcel = useCallback((): void => {
    const rows: Record<string, unknown>[] = [];
    tasks.forEach((task) => {
      const categoryInfo = allCategories.find((c) => c.id === task.category);
      const statusLabels: Record<string, string> = {
        active: "进行中", completed: "已完成", overdue: "已逾期", terminated: "已终止",
      };
      rows.push({
        "任务名称": task.name,
        "分类": categoryInfo?.name || task.category,
        "状态": statusLabels[task.status] || task.status,
        "进度(%)": task.progress,
        "创建日期": task.createdDate,
        "截止日期": task.deadline,
        "指派人": task.assignee_username || "-",
        "更新记录数": task.history.length,
        "附件数": task.attachments?.length || 0,
        "最后更新": task.history.length > 0
          ? [...task.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].note
          : "",
      });
    });

    const historyRows: Record<string, unknown>[] = [];
    tasks.forEach((task) => {
      task.history.forEach((entry) => {
        historyRows.push({
          "任务名称": task.name,
          "时间": new Date(entry.timestamp).toLocaleString("zh-CN"),
          "进度(%)": entry.progress,
          "备注": entry.note,
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const taskSheet = XLSX.utils.json_to_sheet(rows);
    const historySheet = XLSX.utils.json_to_sheet(historyRows);
    XLSX.utils.book_append_sheet(wb, taskSheet, "任务列表");
    XLSX.utils.book_append_sheet(wb, historySheet, "更新历史");
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `项目进度数据_${today}.xlsx`);
  }, [tasks, allCategories]);

  const importData = useCallback(async (json: string): Promise<boolean> => {
    try {
      const data = JSON.parse(json);
      if (!data.tasks || !Array.isArray(data.tasks)) return false;
      if (data.categories && Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          await supabase.from("categories").upsert({ id: cat.id, name: cat.name, color: cat.color }, { onConflict: "id" });
        }
      }
      for (const t of data.tasks) {
        await supabase.from("tasks").upsert({
          id: t.id, name: t.name, category: t.category,
          created_date: t.createdDate, deadline: t.deadline,
          progress: t.progress, status: getStatus(t),
        }, { onConflict: "id" });
        if (t.history && Array.isArray(t.history)) {
          for (const h of t.history) {
            await supabase.from("progress_entries").upsert({
              id: h.id, task_id: h.taskId || t.id,
              timestamp: h.timestamp, progress: h.progress, note: h.note,
            }, { onConflict: "id" });
          }
        }
        if (t.attachments && Array.isArray(t.attachments)) {
          for (const a of t.attachments) {
            await supabase.from("attachments").upsert({
              id: a.id, task_id: t.id, name: a.name, size: a.size, data_url: a.dataUrl,
            }, { onConflict: "id" });
          }
        }
      }
      await fetchAllData();
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  }, [fetchAllData]);

  const clearAllData = useCallback(async () => {
    await supabase.from("attachments").delete().neq("id", "__none__");
    await supabase.from("progress_entries").delete().neq("id", "__none__");
    await supabase.from("project_members").delete().neq("id", "__none__");
    await supabase.from("tasks").delete().neq("id", "__none__");
    await supabase.from("categories").delete().neq("id", "__none__");
    for (const cat of DEFAULT_CATEGORIES) {
      await supabase.from("categories").insert({ id: cat.id, name: cat.name, color: cat.color });
    }
    await fetchAllData();
  }, [fetchAllData]);

  const reorderTasks = useCallback(async (reorderedIds: string[]) => {
    setTasks((prev) => {
      const taskMap = new Map(prev.map((t) => [t.id, t]));
      return reorderedIds.map((id, index) => {
        const task = taskMap.get(id);
        return task ? { ...task, sort_order: index } : null;
      }).filter(Boolean) as Task[];
    });
    for (let i = 0; i < reorderedIds.length; i++) {
      await supabase.from("tasks").update({ sort_order: i }).eq("id", reorderedIds[i]);
    }
  }, []);

  // ─── Follow-up tasks (assigned to current user, not completed) ───
  const followUpTasks = useCallback((): Task[] => {
    const userId = getCurrentUserId();
    if (!userId) return [];
    return tasks.filter(
      (t) => t.assignee_id === userId && t.status !== "completed" && t.status !== "terminated"
    );
  }, [tasks]);

  return {
    tasks,
    allCategories,
    projectMembers,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    terminateTask,
    restoreTask,
    addCustomCategory,
    updateCategory,
    deleteCategory,
    addAttachment,
    removeAttachment,
    updateAttachment,
    exportData,
    exportExcel,
    importData,
    clearAllData,
    reorderTasks,
    deleteHistoryEntry,
    refreshData: fetchAllData,
    getTaskMembers,
    addProjectMember,
    removeProjectMember,
    updateProjectMemberRole,
    followUpTasks,
    currentUserId,
    isAdmin: isAdmin,
    userMap,
  };
}
