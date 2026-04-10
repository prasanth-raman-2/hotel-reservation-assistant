"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullHeightRoutes = ["/chat"];
  const lockScroll = fullHeightRoutes.some((r) => pathname.startsWith(r));

  return (
    <div className="relative flex h-dvh min-h-screen flex-col">
      <Header />
      <main className={lockScroll ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex min-h-0 flex-1 flex-col overflow-auto"}>
        {children}
      </main>
    </div>
  );
}
