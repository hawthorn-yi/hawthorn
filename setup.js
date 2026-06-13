// Hawthorn 项目初始化脚本
// 运行: node setup.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://todyqybjiwgnxfevqisl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHlxeWJqaXdnbnhmZXZxaXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDEzNjMsImV4cCI6MjA5NjE3NzM2M30.tyAK2ZovQwcEGI8i6euGQ6qprGhqvlIRZt4B0wUKeOg";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setup() {
  console.log("=== Hawthorn 初始化 ===\n");

  // 1. 检查数据库表
  console.log("检查数据库表...");
  const tables = ["user_roles", "tasks", "categories", "progress_entries", "attachments", "project_members", "notifications"];
  let allExist = true;
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      console.log("  [缺失] " + t);
      allExist = false;
    } else {
      const count = data?.length || 0;
      console.log("  [正常] " + t + " (" + count + " 条记录)");
    }
  }

  if (!allExist) {
    console.log("\n⚠ 部分数据库表缺失！请在 Supabase Dashboard SQL Editor 中执行迁移脚本。");
    console.log("   迁移文件: sql/migration_fix_rls.sql");
    console.log("   Dashboard: https://supabase.com/dashboard/project/todyqybjiwgnxfevqisl/sql/new");
    return;
  }

  // 2. 注册 admin 用户
  console.log("\n尝试注册 admin 用户...");
  const { error: re } = await supabase.auth.signUp({
    email: "admin@project-progress.local",
    password: "admin123",
    options: { data: { display_name: "admin" } }
  });
  
  if (re) {
    if (re.message?.includes("already")) {
      console.log("  admin 用户已存在，尝试登录...");
      const { data: si, error: sie } = await supabase.auth.signInWithPassword({
        email: "admin@project-progress.local",
        password: "admin123"
      });
      if (sie) console.log("  登录失败:", sie.message);
      else console.log("  ✓ 登录成功，用户ID:", si.user?.id);
    } else if (re.message?.includes("Database error")) {
      console.log("  ✗ 注册失败: 数据库触发器问题");
      console.log("  请执行: sql/migration_fix_rls.sql");
    } else {
      console.log("  ✗ 注册失败:", re.message);
    }
  } else {
    console.log("  ✓ 注册成功！第一个注册的用户自动成为管理员。");
  }

  // 3. 检查默认分类
  console.log("\n检查默认分类...");
  const { data: cats } = await supabase.from("categories").select("*");
  if (!cats || cats.length === 0) {
    const defaultCats = [
      { id: "new-product", name: "新产品开发", color: "#14B8A6" },
      { id: "daily-order", name: "日常订单跟进", color: "#3B82F6" },
      { id: "temporary", name: "临时项目", color: "#F59E0B" }
    ];
    for (const cat of defaultCats) {
      await supabase.from("categories").insert(cat);
      console.log("  创建分类:", cat.name);
    }
  } else {
    console.log("  分类已就绪:", cats.length, "个");
  }

  console.log("\n=== 初始化完成 ===");
}

setup();
