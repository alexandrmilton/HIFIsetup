"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return <button type="button" className="text-link profile-signout" onClick={signOut}>Вийти з акаунта</button>;
}
