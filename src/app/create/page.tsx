import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SetupBuilder } from "@/components/setup-builder";
import { demoComponents } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getCurrentProfile } from "@/lib/auth";

export default async function CreatePage() {
  if (hasSupabaseEnv() && !(await getCurrentProfile())) redirect("/login?next=/create");
  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">Новий сетап</p>
          <h1>Ваш простір. Ваш звук.</h1>
          <p>Додайте готові компоненти з каталогу або красиво позначте те, що зібрали власноруч чи замовили у майстра.</p>
        </div>
        <SetupBuilder initialComponents={demoComponents} isSupabaseReady={hasSupabaseEnv()} />
      </main>
    </>
  );
}
