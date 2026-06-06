import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { AppUser } from "@/lib/auth";
import type { ProjectMember } from "@/types";

interface MemberSelectorProps {
  taskId?: string;
  existingMembers?: ProjectMember[];
  onMembersChange?: (memberIds: string[]) => void;
  onAddMember?: (userId: string, username: string) => void;
  onRemoveMember?: (memberId: string) => void;
  readOnly?: boolean;
}

export default function MemberSelector({
  taskId,
  existingMembers = [],
  onMembersChange,
  onAddMember,
  onRemoveMember,
  readOnly = false,
}: MemberSelectorProps) {
  const { user, isAdmin } = useAuth();
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(existingMembers.map((m) => m.user_id))
  );

  useEffect(() => {
    setSelectedIds(new Set(existingMembers.map((m) => m.user_id)));
  }, [existingMembers]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("app_users")
        .select("id, username, role, is_approved")
        .order("username");

      if (data) {
        setAllUsers(
          data.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            username: u.username as string,
            role: u.role as "admin" | "user",
            is_approved: u.is_approved as boolean,
            created_at: "",
          }))
        );
      }
    };
    fetchUsers();
  }, []);

  // Build a user map for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, AppUser>();
    allUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [allUsers]);

  // Merge existing members with newly selected (not yet saved) members
  const displayMembers = useMemo(() => {
    const result: Array<{ id: string; user_id: string; role: string; username: string }> = [];
    const seen = new Set<string>();

    // Existing members first
    for (const m of existingMembers) {
      result.push({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        username: m.username || userMap.get(m.user_id)?.username || m.user_id,
      });
      seen.add(m.user_id);
    }

    // Newly selected (not yet in existingMembers)
    for (const uid of selectedIds) {
      if (!seen.has(uid)) {
        const u = userMap.get(uid);
        result.push({
          id: `new-${uid}`,
          user_id: uid,
          role: "member",
          username: u?.username || uid,
        });
        seen.add(uid);
      }
    }

    return result;
  }, [existingMembers, selectedIds, userMap]);

  const handleToggle = (userId: string, _username: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedIds(newSet);
    onMembersChange?.(Array.from(newSet));
  };

  const handleRemove = (member: { id: string; user_id: string }) => {
    // If it's a new (not-yet-saved) member, just remove from selection
    if (member.id.startsWith("new-")) {
      const newSet = new Set(selectedIds);
      newSet.delete(member.user_id);
      setSelectedIds(newSet);
      onMembersChange?.(Array.from(newSet));
    } else {
      // Existing member - remove via callback
      onRemoveMember?.(member.id);
    }
  };

  const canRemove = (member: { role: string; user_id: string }): boolean => {
    if (member.role === "owner") return false;
    if (isAdmin) return true;
    if (user && member.user_id === user.id) return true;
    return false;
  };

  // Users available to add (not already selected, not current user, approved)
  const availableUsers = useMemo(() => {
    return allUsers.filter(
      (u) => u.is_approved && !selectedIds.has(u.id) && u.id !== user?.id
    );
  }, [allUsers, selectedIds, user]);

  return (
    <div className="space-y-3">
      {/* Members Display */}
      {displayMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayMembers.map((member) => (
            <span
              key={member.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                member.role === "owner"
                  ? "bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]"
                  : "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
              }`}
              title={`${member.username}${member.role === "owner" ? " (创建者)" : ""}`}
            >
              {member.role === "owner" && <Crown className="w-3 h-3" />}
              {member.username}
              {!readOnly && canRemove(member) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(member); }}
                  className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Add Members (only in edit/create mode) */}
      {!readOnly && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            添加参与人员
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(0,0,0,0.1)] py-1 min-w-[220px] max-h-[240px] overflow-y-auto"
              >
                {availableUsers.map((u) => {
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleToggle(u.id, u.username)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors cursor-pointer text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      <div className="w-5 h-5 rounded border-2 flex items-center justify-center border-[#CBD5E1]" />
                      <div className="flex-1 text-left">
                        <span>{u.username}</span>
                        {u.role === "admin" && (
                          <span className="ml-1.5 text-[0.625rem] px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">管理</span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {availableUsers.length === 0 && (
                  <div className="px-4 py-3 text-xs text-[#94A3B8] text-center">
                    没有其他可用用户
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
