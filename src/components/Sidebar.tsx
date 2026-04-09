"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cs";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Órdenes", href: "/orders", icon: ClipboardList },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r border-white/10 px-4 py-6">
      <div className="flex flex-col w-full h-full">
        
        {/* LOGO */}
        <Link
          href="/dashboard"
          className="px-2 text-xl font-bold tracking-tight text-white/90 hover:text-white transition"
        >
          ServisTech
        </Link>

        {/* NAV */}
        <nav className="mt-8 space-y-1">
          {items.map((it) => {
            const active =
              pathname === it.href ||
              pathname.startsWith(it.href + "/");

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <it.icon
                  className={cn(
                    "h-5 w-5 transition",
                    active
                      ? "text-white"
                      : "text-white/40 group-hover:text-white"
                  )}
                />

                <span>{it.label}</span>

                {/* indicador activo */}
                {active && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white/70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
            <div className="font-medium text-white/80">ServisTech</div>
            <div>v1.0.0</div>
          </div>
        </div>
      </div>
    </aside>
  );
}