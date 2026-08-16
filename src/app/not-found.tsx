import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() { return <><SiteHeader /><main className="page-main shell"><p className="eyebrow">404</p><h1>Цей сетап ще не звучить.</h1><Link className="button button-dark" href="/">Повернутися до сетапів</Link></main></>; }
