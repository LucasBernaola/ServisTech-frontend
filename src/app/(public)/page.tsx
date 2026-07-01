"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/LoginModal";

type SessionUser = {
  username?: string;
  email?: string;
};

export default function PublicHome() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const services = [
    "Cambio de módulo",
    "Pin / centro de carga",
    "Diagnóstico y reparación",
    "Limpieza y mantenimiento",
  ];

  const adminUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/admin/`
    : "/admin";

  return (
    <div className="min-h-screen necotec-bg">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 min-h-screen flex flex-col">
        <div className="pt-6 sm:pt-8 flex justify-end">
          {user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm text-white/85 hover:bg-white/8 transition"
            >
              Ir al panel
            </button>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm text-white/85 hover:bg-white/8 transition"
            >
              Ingresar
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full flex flex-col items-center justify-center text-center">
            <div className="leading-none select-none flex flex-col w-fit text-center">
              <div
                className="text-4xl sm:text-6xl md:text-7xl lg:text-[8rem] xl:text-[9.5rem] font-extrabold tracking-tight text-transparent"
                style={{
                  WebkitTextStroke: "2px rgba(255,255,255,0.75)",
                  textShadow:
                    "0 0 18px rgba(255,255,255,0.12), 0 0 40px rgba(255,255,255,0.06)",
                }}
              >
                SERVIS
              </div>

              <div
                className="mt-3 sm:mt-4 md:mt-6 text-4xl sm:text-6xl md:text-7xl lg:text-[8rem] xl:text-[9.5rem] font-extrabold tracking-tight text-transparent"
                style={{
                  WebkitTextStroke: "2px rgba(255,255,255,0.65)",
                  textShadow:
                    "0 0 18px rgba(255,255,255,0.10), 0 0 40px rgba(255,255,255,0.05)",
                }}
              >
                TECH
              </div>

              <div className="mt-4 sm:mt-6 text-[10px] sm:text-xs text-white/45 tracking-[0.25em] sm:tracking-[0.35em] uppercase">
                SERVICIO TÉCNICO
              </div>
            </div>

            <div className="mt-6 sm:mt-8 w-full flex justify-center">
              <div className="max-w-5xl text-[11px] sm:text-sm md:text-base text-white/70">
                <ul className="flex flex-wrap items-center justify-center gap-y-1 sm:gap-y-2">
                  {services.map((service, index) => (
                    <li key={service} className="flex items-center">
                      <span>{service}</span>
                      {index !== services.length - 1 ? (
                        <span className="mx-2 sm:mx-3 text-white/30">-</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {user ? (
              <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/60">
                Hola,{" "}
                <span className="text-white/85">
                  {user.username || user.email}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-center sm:text-left">
          <a
            href={adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white/80 transition"
          >
            Administración
          </a>

          <div className="text-xs text-white/50">© ServisTech - 2026</div>
        </div>

        <LoginModal open={open} onOpenChange={setOpen} />
      </div>
    </div>
  );
}
