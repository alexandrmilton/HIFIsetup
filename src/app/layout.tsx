import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "roomtone — Hi‑Fi сетапи", description: "Світлий простір для улюблених Hi‑Fi аудіо-сетапів." };

export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="uk"><body>{children}</body></html>; }
