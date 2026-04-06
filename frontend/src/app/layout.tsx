import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShadowOS — Autonomous Business Agent",
  description: "Multi-agent outreach system for solo operators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}>
      <body className="min-h-full flex bg-zinc-950 text-zinc-50">
        <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-6 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">ShadowOS</h1>
            <p className="text-xs text-zinc-500 mt-1">Autonomous Business Agent</p>
          </div>
          <nav className="flex flex-col gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/pipeline">Run Pipeline</NavLink>
            <NavLink href="/prospects">Prospects</NavLink>
            <NavLink href="/analytics">Analytics</NavLink>
          </nav>
          <div className="mt-auto text-xs text-zinc-600">
            <p>AI Agent Olympics 2026</p>
            <p>Milan AI Week</p>
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors"
    >
      {children}
    </a>
  );
}
