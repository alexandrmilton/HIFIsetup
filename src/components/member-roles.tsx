"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminListBody, AdminSearch, useAdminList } from "@/components/admin-list";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type Member = { id: string; display_name: string | null; is_admin: boolean; is_moderator: boolean; setup_count: number };

const haystack = (member: Member) => member.display_name ?? "";

export function MemberRoles({ members, t }: { members: Member[]; t: Dictionary }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const list = useAdminList(members, haystack);

  async function toggle(userId: string, isModerator: boolean) {
    setBusy(userId);
    await fetch("/api/admin/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isModerator }) });
    setBusy(null);
    router.refresh();
  }

  if (members.length === 0) return <p className="empty-collection">{t.admin.noMembers}</p>;

  return (
    <>
      <AdminSearch value={list.query} onChange={list.search} label={t.admin.searchMembers} />
      {list.matched.length === 0
        ? <p className="empty-collection">{t.admin.noMatches}</p>
        : (
          <AdminListBody shown={list.visible.length} total={list.matched.length} onShowMore={list.showMore} t={t}>
            <ul className="member-list">
              {list.visible.map((member) => (
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
          </AdminListBody>
        )}
    </>
  );
}
