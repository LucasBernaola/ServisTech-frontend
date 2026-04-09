"use client";

import { CircleUserRound, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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

  /* ============================= */
  /* FETCH USER                    */
  /* ============================= */

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, []);

  /* ============================= */
  /* LOGOUT                        */
  /* ============================= */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.push("/");
      router.refresh();
    } catch {
      // opcional: toast
    } finally {
      setLoggingOut(false);
    }
  }

  /* ============================= */
  /* PAGE TITLE                    */
  /* ============================= */

  function getTitle() {
    if (pathname.startsWith("/orders")) return "Órdenes";
    if (pathname.startsWith("/clients")) return "Clientes";
    if (pathname.startsWith("/settings")) return "Configuración";
    return "Dashboard";
  }

  return (
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-6">
      
      {/* TITLE */}
      <div className="text-sm font-medium text-white/70">
        {getTitle()}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        
        {/* USER */}
        {loadingUser ? (
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        ) : user ? (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CircleUserRound className="h-4 w-4" />
            <span>{user.username || user.email}</span>
          </div>
        ) : null}

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8 disabled:opacity-50"
        >
          {loggingOut && (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}

          <LogOut className="h-3.5 w-3.5" />
          {loggingOut ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}