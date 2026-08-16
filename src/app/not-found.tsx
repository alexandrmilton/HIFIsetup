import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <p className="eyebrow">404</p>
        <h1>{t.notFound.title}</h1>
        <Link className="button button-dark" href="/">{t.notFound.back}</Link>
      </main>
      <SiteFooter />
    </>
  );
}
