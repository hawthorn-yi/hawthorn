import { supabase } from "@/lib/supabase";

export interface AppUser {
  id: string;
  username: string;
  role: "admin" | "user";
  is_approved: boolean;
  created_at: string;
  last_login?: string;
}

const AUTH_DOMAIN = "project-progress.local";
// For ASCII usernames, use as-is. For Chinese usernames, email is stored in user_roles.auth_email
function makeEmail(username: string): string {
  // Only ASCII alphanumeric + dots/hyphens/underscores are valid in email local-parts
  if (/^[a-zA-Z0-9._-]+$/.test(username)) {
    return `${username}@${AUTH_DOMAIN}`;
  }
  // Non-ASCII usernames (Chinese etc.) can't be email local-parts
  // For these, we need to look up auth_email from user_roles
  // This function returns a fallback; the actual lookup is done in loginUser
  return null as unknown as string;
}

export async function getCurrentUserSession(): Promise<{ user: AppUser | null }> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user) return { user: null };
  const username = (session.user.user_metadata?.display_name as string) ||
    (session.user.email?.split("@")[0] ?? "User");
  let role: "admin" | "user" = "user";
  let displayName = username;
  let createdAt = session.user.created_at;
  try {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    if (roleData) {
      role = roleData.role as "admin" | "user";
      displayName = roleData.display_name || username;
      createdAt = roleData.created_at || createdAt;
    }
  } catch { /* user_roles table may not exist yet */ }
  return { user: { id: session.user.id, username: displayName, role, is_approved: true, created_at: createdAt } };
}

export async function loginUser(username: string, password: string): Promise<AppUser> {
  // 1. Try direct email (for ASCII usernames like "kevin")
  let email = makeEmail(username);
  
  // 2. If direct fails, look up email from user_roles by display_name
  if (!email) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("auth_email")
      .eq("display_name", username)
      .single();
    if (roleRow?.auth_email) {
      email = roleRow.auth_email;
    }
  }
  
  if (!email) throw new Error("用户名或密码错误");
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("用户名或密码错误");
  const { user } = await getCurrentUserSession();
  if (!user) throw new Error("登录失败");
  // 更新 user_roles.updated_at 以记录最后登录时间
  try {
    await supabase
      .from("user_roles")
      .update({ updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  } catch { /* ignore */ }
  return user;
}

export async function registerUser(username: string, password: string): Promise<AppUser> {
  if (username.length < 3) throw new Error("用户名至少需要3个字符");
  if (password.length < 4) throw new Error("密码至少需要4个字符");
  const { error } = await supabase.auth.signUp({ email: makeEmail(username), password, options: { data: { display_name: username } } });
  if (error) {
    if (error.message?.toLowerCase().includes("already")) throw new Error("该用户名已被注册");
  if (error.message?.includes("Database error")) throw new Error("系统初始化中，请管理员先在 Supabase Dashboard 的 SQL Editor 中执行 sql/migration_fix_rls.sql，然后重试。");
    throw new Error("注册失败: " + error.message);
  }
  await new Promise((r) => setTimeout(r, 1500));
  const { user } = await getCurrentUserSession();
  if (!user) {
    const { error: siErr } = await supabase.auth.signInWithPassword({ email: makeEmail(username), password });
    if (siErr) throw new Error("注册成功，但登录失败: " + siErr.message);
    const retry = await getCurrentUserSession();
    return retry.user ?? { id: crypto.randomUUID(), username, role: "user" as const, is_approved: true, created_at: new Date().toISOString() };
  }
  return user;
}

export async function logoutUser(): Promise<void> { await supabase.auth.signOut(); }

export async function getAllUsers(): Promise<AppUser[]> {
  const { data: roles, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("获取用户列表失败: " + error.message);

  // 尝试通过 RPC 获取真实的最后登录时间（auth.users.last_sign_in_at）
  // 如果 RPC 函数不存在则降级使用 user_roles.updated_at
  let lastLoginMap = new Map<string, string>();
  try {
    const { data: loginData, error: rpcError } = await supabase.rpc("get_user_last_logins_secure");
    if (rpcError) {
      console.warn("[Analytics] RPC get_user_last_logins_secure failed:", rpcError.message);
    }
    if (loginData && Array.isArray(loginData)) {
      loginData.forEach((item: { user_id: string; last_sign_in_at: string }) => {
        if (item.last_sign_in_at) lastLoginMap.set(item.user_id, item.last_sign_in_at);
      });
    }
  } catch (e) {
    console.warn("[Analytics] RPC call error:", e);
  }

  return (roles || []).map((r) => ({
    id: r.user_id,
    username: r.display_name || r.user_id.substring(0, 8),
    role: r.role as "admin" | "user",
    is_approved: true,
    created_at: r.created_at,
    last_login: lastLoginMap.get(r.user_id) || r.updated_at,
  }));
}

export async function updateUserRole(userId: string, role: "admin" | "user"): Promise<void> {
  const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
  if (error) throw new Error("更新用户权限失败: " + error.message);
}

export async function updateUserApproval(userId: string, isApproved: boolean): Promise<void> {
  if (isApproved) {
    const { error: ie } = await supabase.from("user_roles").upsert({ user_id: userId, role: "user", display_name: "" }).eq("user_id", userId);
    if (ie) throw new Error("启用用户失败: " + ie.message);
  } else {
    const { error: de } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (de) throw new Error("禁用用户失败: " + de.message);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (error) throw new Error("删除用户失败: " + error.message);
}

export async function resetUserPassword(_userId: string, _newPassword: string): Promise<void> {
  throw new Error("密码重置需要在 Supabase Dashboard 中操作，或让用户自助重置");
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 4) throw new Error("密码至少需要4个字符");
  const { data: sd } = await supabase.auth.getSession();
  const email = sd.session?.user?.email;
  if (!email) throw new Error("请先登录");
  const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
  if (siErr) throw new Error("原密码不正确");
  const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
  if (upErr) throw new Error("修改密码失败: " + upErr.message);
}
