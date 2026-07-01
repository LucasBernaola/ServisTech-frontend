"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutGrid, Settings, Users } from "lucide-react";
import { cn } from "@/lib/cs";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Ordenes", href: "/orders", icon: ClipboardList },
  { label: "Clientes", href: "/clients", icon: Users },
  { label: "Ajustes", href: "/settings", icon: Settings },
];

export function Sidebar({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-[#111214]/95 p-1 shadow-2xl shadow-black/50 backdrop-blur md:hidden">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");

          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] transition",
                active
                  ? "bg-amber-300 text-black"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <it.icon className="h-4 w-4" />
              <span className="max-w-full truncate px-1">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="hidden h-full w-68 shrink-0 border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur md:flex">
      <div className="flex h-full w-full flex-col">
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 transition hover:bg-white/[0.06]"
        >
          <div className="text-base font-semibold tracking-tight text-white">
            ServisTech
          </div>
          <div className="mt-0.5 text-xs text-white/45">Taller tecnico</div>
        </Link>

        <nav className="mt-6 space-y-1.5">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");

            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-amber-300/35 bg-amber-300/12 text-amber-100"
                    : "border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <it.icon
                  className={cn(
                    "h-4.5 w-4.5 transition",
                    active
                      ? "text-amber-300"
                      : "text-white/35 group-hover:text-white/80"
                  )}
                />
                <span>{it.label}</span>
                {active ? (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-300" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs text-white/55">
            <div className="font-medium text-white/80">Operacion diaria</div>
            <div className="mt-1 leading-relaxed">
              Ordenes, clientes y seguimiento en un mismo flujo.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
