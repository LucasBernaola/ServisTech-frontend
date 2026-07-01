"use client";

import { CircleUserRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  username?: string;
  email?: string;
};

const titles = [
  {
    match: "/orders",
    title: "Ordenes",
    description: "Ingreso, diagnostico, reparacion y entrega.",
  },
  {
    match: "/clients",
    title: "Clientes",
    description: "Datos de contacto e historial operativo.",
  },
  {
    match: "/settings",
    title: "Ajustes",
    description: "Perfil, acceso y datos de la cuenta.",
  },
];

export function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace("/");
          return;
        }

        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/");
      router.refresh();
      setLoggingOut(false);
    }
  }

  const current =
    titles.find((item) => pathname.startsWith(item.match)) ?? {
      title: "Dashboard",
      description: "Resumen rapido del taller.",
    };

  return (
    <header className="border-b border-white/10 bg-[#0f1012]/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-amber-200/70">
            ServisTech
          </div>
          <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
            {current.title}
          </h1>
          <p className="hidden text-sm text-white/45 sm:block">
            {current.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {loadingUser ? (
            <div className="h-9 w-28 animate-pulse rounded-lg bg-white/10" />
          ) : user ? (
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-white/75 sm:flex">
              <CircleUserRound className="h-4 w-4 text-amber-200/80" />
              <span className="max-w-36 truncate">{user.username || user.email}</span>
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-xs font-medium text-white/75 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {loggingOut ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {loggingOut ? "Saliendo..." : "Salir"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
