"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut, Truck, BarChart3, PanelsTopLeft, Warehouse } from "lucide-react"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("dispatcher_session")
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="border-b bg-card">
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="E Song Transportation" width={36} height={36} className="h-9 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/board"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive("/board") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PanelsTopLeft className="h-4 w-4" />
              Transit Board
            </Link>
            <Link
              href="/drivers"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive("/drivers") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Truck className="h-4 w-4" />
              Drivers
            </Link>
            <Link
              href="/chassis"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive("/chassis") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Truck className="h-4 w-4" />
              Chassis
            </Link>
            <Link
              href="/yards"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive("/yards") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Warehouse className="h-4 w-4" />
              Yards
            </Link>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </nav>
  )
}
