"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { LoginModal } from "@/components/LoginModal";

type SessionUser = {
  username?: string;
  email?: string;
};

const modules = [
  {
    title: "Órdenes técnicas",
    description: "Registro, diagnóstico, estados y cierre de reparaciones.",
    icon: ClipboardList,
  },
  {
    title: "Clientes",
    description: "Búsqueda, alta y edición de datos de contacto.",
    icon: Users,
  },
  {
    title: "Seguimiento público",
    description: "Consulta externa por token para ver el avance del equipo.",
    icon: ShieldCheck,
  },
  {
    title: "Ficha e impresión",
    description: "Documentación imprimible para recepción y trabajo técnico.",
    icon: FileText,
  },
];

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

  const adminUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/admin/`
    : "/admin";

  return (
    <div className="min-h-screen overflow-hidden bg-[#080a0e] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(242,189,75,0.16),transparent_32%),radial-gradient(circle_at_18%_78%,rgba(95,111,138,0.16),transparent_34%),linear-gradient(135deg,#080a0e_0%,#111722_48%,#090b10_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 sm:px-6 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-7">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-left"
            aria-label="ServisTech"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300 text-sm font-black text-[#15100a] shadow-[0_0_34px_rgba(242,189,75,0.24)]">
              ST
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide text-white">
                ServisTech
              </span>
              <span className="block text-xs text-white/45">
                Gestión para taller técnico
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 transition hover:border-white/20 hover:text-white sm:inline-flex"
            >
              Administración
            </a>

            {user ? (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300 px-4 py-2 text-xs font-semibold text-[#15100a] transition hover:bg-amber-200"
              >
                Ir al panel
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300 px-4 py-2 text-xs font-semibold text-[#15100a] transition hover:bg-amber-200"
              >
                Ingresar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <section className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
              <Smartphone className="h-3.5 w-3.5 text-amber-200" />
              Sistema de gestión para reparaciones técnicas
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Controlá tu taller sin perder el ritmo del banco de trabajo.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
              ServisTech organiza órdenes, clientes, estados de reparación,
              fichas imprimibles y seguimiento público en una interfaz pensada
              para el día a día de un servicio técnico.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => (user ? router.push("/dashboard") : setOpen(true))}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 text-sm font-semibold text-[#15100a] transition hover:bg-amber-200"
              >
                {user ? "Abrir panel" : "Acceder al sistema"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/12 bg-white/[0.035] px-5 text-sm font-medium text-white/75 transition hover:border-white/22 hover:bg-white/[0.06] hover:text-white"
              >
                Admin Django
              </a>
            </div>

            {user ? (
              <div className="mt-5 text-sm text-white/50">
                Sesión activa como{" "}
                <span className="font-medium text-white/80">
                  {user.username || user.email}
                </span>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111722]/85 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.46)] backdrop-blur">
            <div className="rounded-xl border border-white/8 bg-[#0d1119]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Operación del taller
                  </div>
                  <div className="text-xs text-white/42">
                    Flujo real del sistema
                  </div>
                </div>
                <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  Activo
                </div>
              </div>

              <div className="grid gap-3 p-3 sm:grid-cols-2">
                {modules.map((module) => (
                  <div
                    key={module.title}
                    className="rounded-lg border border-white/8 bg-white/[0.035] p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-amber-200">
                      <module.icon className="h-4 w-4" />
                    </div>
                    <div className="mt-4 text-sm font-semibold text-white">
                      {module.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/52">
                      {module.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/8 p-3">
                <div className="rounded-lg border border-white/8 bg-black/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Flujo principal
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        Recibir equipo → diagnosticar → reparar → finalizar → retirar
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 sm:w-32">
                      <div className="h-full w-3/4 rounded-full bg-amber-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/8 py-5 text-xs text-white/42 sm:flex-row">
          <span>© ServisTech - 2026</span>
          <span>Órdenes, clientes y seguimiento técnico en un solo panel.</span>
        </footer>

        <LoginModal open={open} onOpenChange={setOpen} />
      </div>
    </div>
  );
}
