"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Eye, EyeOff, LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function LoginModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTimeout(() => userRef.current?.focus(), 50);
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          typeof data?.error === "string"
            ? data.error
            : res.status === 503
              ? "No se pudo conectar con el backend."
              : "Usuario o contraseña incorrectos.";
        setError(message);
        return;
      }

      onOpenChange(false);

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 100);
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />

        <Dialog.Content
          aria-describedby="login-desc"
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[430px] -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101722] shadow-[0_26px_90px_rgba(0,0,0,0.62)]">
            <div className="border-b border-white/8 bg-white/[0.025] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/10 text-amber-200">
                    <LockKeyhole className="h-4 w-4" />
                  </div>
                  <div>
                    <Dialog.Title className="text-base font-semibold text-white">
                      Acceso interno
                    </Dialog.Title>
                    <Dialog.Description
                      id="login-desc"
                      className="mt-1 text-sm text-white/48"
                    >
                      Ingresá con tu usuario del taller.
                    </Dialog.Description>
                  </div>
                </div>

                <Dialog.Close className="rounded-lg border border-white/10 bg-white/[0.035] p-2 text-white/65 transition hover:bg-white/[0.07] hover:text-white">
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div>
                <label className="text-xs font-medium text-white/58">
                  Usuario / Email
                </label>
                <input
                  ref={userRef}
                  name="username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="mt-1.5 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:bg-black/25 disabled:opacity-50"
                  placeholder="usuario@servistech.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/58">
                  Contraseña
                </label>

                <div className="relative mt-1.5">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 pr-11 text-sm text-white/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:bg-black/25 disabled:opacity-50"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 text-sm font-semibold text-[#15100a] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#15100a]/30 border-t-[#15100a]" />
                ) : null}
                {loading ? "Ingresando..." : "Entrar al panel"}
              </button>

              <p className="text-center text-xs leading-5 text-white/38">
                No hay registro público. El acceso se gestiona desde el backend.
              </p>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
