import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupWizard } from "@/components/setup-wizard";
import { getCategories } from "@/lib/setups";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getCurrentProfile } from "@/lib/auth";

export default async function CreatePage() {
  const profile = hasSupabaseEnv() ? await getCurrentProfile() : null;
  if (hasSupabaseEnv() && !profile) redirect("/login?next=/create");
  const categories = await getCategories();
  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">Новий сетап</p>
          <h1>Ваш простір. Ваш звук.</h1>
          <p>Пройдіть три кроки: інформація, компоненти, публікація. Кожен компонент шукається в каталозі автоматично — вручну додавайте лише те, чого там немає.</p>
        </div>
        <SetupWizard categories={categories} isSupabaseReady={hasSupabaseEnv()} ownerId={profile?.id ?? null} />
      </main>
    </>
  );
}
