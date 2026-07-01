"use client";

import { CircleUserRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  username?: string;
  email?: string;
};

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

  function getTitle() {
    if (pathname.startsWith("/orders")) return "Órdenes";
    if (pathname.startsWith("/clients")) return "Clientes";
    if (pathname.startsWith("/settings")) return "Configuración";
    return "Dashboard";
  }

  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
      <div className="text-sm font-medium text-white/70">{getTitle()}</div>

      <div className="flex items-center gap-3">
        {loadingUser ? (
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        ) : user ? (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CircleUserRound className="h-4 w-4" />
            <span>{user.username || user.email}</span>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8 disabled:opacity-50"
        >
          {loggingOut ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}

          <LogOut className="h-3.5 w-3.5" />
          {loggingOut ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
