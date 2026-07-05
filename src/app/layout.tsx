import "./globals.css";
import HealthBadge from "@/components/HealthBadge";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Sentinel",
  description: "AI-driven end-to-end testing — write flows in plain English.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight text-neutral-900 hover:text-neutral-700">
            <Logo className="h-6 w-6" />
            Sentinel
          </a>
          <HealthBadge />
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
