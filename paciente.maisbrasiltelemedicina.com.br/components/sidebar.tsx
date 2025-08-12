"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  FileText,
  Users,
  Gift,
  User,
  History,
  LogOut,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Nova Consulta",
    href: "/consulta",
    icon: Calendar,
  },
  {
    title: "Histórico",
    href: "/historico-consultas",
    icon: History,
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FileText,
  },
  {
    title: "Dependentes",
    href: "/dependentes",
    icon: Users,
  },
  {
    title: "Cashback",
    href: "/cashback",
    icon: Gift,
  },
  {
    title: "Clube",
    href: "/clube",
    icon: Gift,
  },
  {
    title: "Perfil",
    href: "/perfil",
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center justify-center border-b px-4 bg-gray-50">
        <Link href="/dashboard" className="flex items-center">
          <div className="relative h-12 w-36">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MaisBrasil-yy7n1soG44eoDE13iDtGslZRRiOTtI.png"
              alt="Mais Brasil Telemedicina"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        <nav className="grid items-start px-2 text-sm font-medium py-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )
}