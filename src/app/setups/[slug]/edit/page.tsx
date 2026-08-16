import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SetupWizard } from "@/components/setup-wizard";
import { getCategories, getSetup, getSetupsByOwner } from "@/lib/setups";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function EditSetupPage({ params }: PageProps<"/setups/[slug]/edit">) {
  const { slug } = await params;
  if (!hasSupabaseEnv()) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/setups/${slug}/edit`);

  const setup = await getSetup(slug);
  if (!setup) notFound();
  if (setup.ownerId !== profile.id) notFound();

  // get_setup_detail returns category names, not ids; read the ids from the
  // owner's own rows so the chips start out selected.
  const [owned, categories, t] = await Promise.all([getSetupsByOwner(profile.id), getCategories(), getDictionary()]);
  const withIds = owned.find((candidate) => candidate.slug === setup.slug);

  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">{t.wizard.editEyebrow}</p>
          <h1>{setup.title}</h1>
          <p>{t.wizard.editLede}</p>
        </div>
        <SetupWizard categories={categories} isSupabaseReady ownerId={profile.id} existing={{ ...setup, categoryIds: withIds?.categoryIds ?? [] }} t={t} />
      </main>
      <SiteFooter />
    </>
  );
}
