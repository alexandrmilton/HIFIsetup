import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SetupWizard } from "@/components/setup-wizard";
import { getCategories } from "@/lib/setups";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

export default async function CreatePage() {
  const profile = hasSupabaseEnv() ? await getCurrentProfile() : null;
  if (hasSupabaseEnv() && !profile) redirect("/login?next=/create");
  const [categories, t] = await Promise.all([getCategories(), getDictionary()]);

  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">{t.wizard.eyebrow}</p>
          <h1>{t.wizard.pageTitle}</h1>
          <p>{t.wizard.pageLede}</p>
        </div>
        <SetupWizard categories={categories} isSupabaseReady={hasSupabaseEnv()} ownerId={profile?.id ?? null} t={t} />
      </main>
      <SiteFooter />
    </>
  );
}
