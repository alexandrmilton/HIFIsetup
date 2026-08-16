import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "HiFiSetups — Hi‑Fi сетапи", description: "Натхнення для вашого ідеального звуку. Досліджуйте реальні аудіо-сетапи, діліться своїм та знаходьте нові ідеї." };

export default function RootLayout({ children }: LayoutProps<"/">) { return <html lang="uk"><body>{children}</body></html>; }
