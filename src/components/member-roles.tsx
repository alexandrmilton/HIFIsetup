"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type Member = { id: string; display_name: string | null; username: string | null; is_admin: boolean; is_moderator: boolean; setup_count: number };

export function MemberRoles({ members, t }: { members: Member[]; t: Dictionary }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function toggle(userId: string, isModerator: boolean) {
    setBusy(userId);
    await fetch("/api/admin/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isModerator }) });
    setBusy(null);
    router.refresh();
  }

  if (members.length === 0) return <p className="empty-collection">{t.admin.noMembers}</p>;

  return (
    <ul className="member-list">
      {members.map((member) => (
        <li className="member-item" key={member.id}>
          <span className="member-avatar" aria-hidden="true">{(member.display_name || "?").charAt(0).toUpperCase()}</span>
          <div className="member-body">
            <strong>{member.display_name ?? t.admin.noName}</strong>
            <p className="member-meta">
              {member.is_admin && <span className="role-pill role-admin">{t.admin.roleAdmin}</span>}
              {member.is_moderator && <span className="role-pill role-moderator">{t.admin.roleModerator}</span>}
              <span>{member.setup_count} {t.admin.setupCount}</span>
            </p>
          </div>
          {member.is_admin
            ? <span className="member-note">{t.admin.fullRights}</span>
            : (
              <button
                className={member.is_moderator ? "button button-outline button-small" : "button button-dark button-small"}
                disabled={busy === member.id}
                onClick={() => toggle(member.id, !member.is_moderator)}
              >
                {member.is_moderator ? t.admin.removeModerator : t.admin.makeModerator}
              </button>
            )}
        </li>
      ))}
    </ul>
  );
}
