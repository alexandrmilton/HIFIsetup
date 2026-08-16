"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label }: { label: string }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return <button type="button" className="text-link profile-signout" onClick={signOut}>{label}</button>;
}
