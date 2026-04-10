"use client"

import Link from "next/link"
import { Hotel } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-linear-to-r from-amber-700 to-amber-600 text-white shadow-md">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Hotel className="h-6 w-6" />
          <span className="font-bold text-lg">Hotel Assistant</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-white/80 px-3 py-2 rounded hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/chat"
            className="transition-colors hover:text-white/80 px-3 py-2 rounded hover:bg-white/10"
          >
            Chat
          </Link>
          <Link
            href="/bookings"
            className="transition-colors hover:text-white/80 px-3 py-2 rounded hover:bg-white/10"
          >
            Bookings
          </Link>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  )
}
