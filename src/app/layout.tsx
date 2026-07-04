import "./globals.css";
import HealthBadge from "@/components/HealthBadge";

export const metadata = { title: "E2E Tester" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <a href="/" className="font-semibold tracking-tight text-neutral-900 hover:text-neutral-700">
            E2E Tester
          </a>
          <HealthBadge />
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
