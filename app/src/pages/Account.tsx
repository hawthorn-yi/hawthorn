import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, User, Key, Shield, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

import { toast, Toaster } from "sonner";
import { Input } from "@/components/ui/input";

export default function Account() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 4) {
      toast.error("新密码至少需要4个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    setSaving(true);
    try {
      const { data: sd } = await supabase.auth.getSession();
      const email = sd.session?.user?.email;
      if (!email) { toast.error("请先登录"); return; }
      const { error: siErr } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
      if (siErr) { toast.error("原密码不正确"); return; }
      const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
      if (upErr) { toast.error("修改密码失败: " + upErr.message); return; }
      toast.success("密码修改成功");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "密码修改失败");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC]">
      {/* Header */}
      <header className="h-14 md:h-16 sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-[#E2E8F0] flex items-center px-3 sm:px-4 md:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#334155] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回项目</span>
        </button>
        <div className="flex-1" />
        <h1 className="text-lg font-bold text-[#1E293B]">账户管理</h1>
        <div className="flex-1" />
      </header>

      <div className="max-w-[560px] mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
              user.role === "admin" ? "bg-[#EFF6FF] text-[#3B82F6]" : "bg-[#F1F5F9] text-[#64748B]"
            }`}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1E293B]">{user.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === "admin" ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F1F5F9] text-[#64748B]"
                }`}>
                  {user.role === "admin" ? "管理员" : "普通用户"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <User className="w-4 h-4 text-[#94A3B8]" />
              <span>用户名: <strong className="text-[#334155]">{user.username}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <Shield className="w-4 h-4 text-[#94A3B8]" />
              <span>账户ID: <strong className="text-[#334155] font-mono text-xs">{user.id}</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-[#64748B]" />
            <h3 className="text-lg font-semibold text-[#1E293B]">修改密码</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.8125rem] font-medium text-[#64748B] mb-1">原密码</label>
              <div className="relative">
                <Input
                  type={showOld ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入原密码"
                  className="h-11 rounded-lg px-4 pr-10 text-sm bg-[#F1F5F9] border-0 focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
                />
                <button
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-medium text-[#64748B] mb-1">新密码</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码 (至少4个字符)"
                  className="h-11 rounded-lg px-4 pr-10 text-sm bg-[#F1F5F9] border-0 focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
                />
                <button
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-medium text-[#64748B] mb-1">确认新密码</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="h-11 rounded-lg px-4 text-sm bg-[#F1F5F9] border-0 focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleChangePassword}
              disabled={saving || !oldPassword || !newPassword || !confirmPassword}
              className={`flex items-center justify-center gap-2 mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold h-11 transition-all cursor-pointer ${
                saving || !oldPassword || !newPassword || !confirmPassword
                  ? "bg-[#F1F5F9] text-[#CBD5E1] cursor-not-allowed"
                  : "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "修改密码"}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
}
