import "./globals.css";
import HealthBadge from "@/components/HealthBadge";
import Logo from "@/components/Logo";
import Sidebar from "@/components/Sidebar";
import { getProjectsWithFlows } from "@/db/queries";

export const metadata = {
  title: "Sentinel",
  description: "AI-driven end-to-end testing — write flows in plain English.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const projects = getProjectsWithFlows();

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight text-neutral-900 hover:text-neutral-700">
            <Logo className="h-6 w-6" />
            Sentinel
          </a>
          <HealthBadge />
        </header>
        <div className="flex">
          <Sidebar projects={projects} />
          <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
