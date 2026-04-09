"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Eye, EyeOff } from "lucide-react";
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

  // 🔥 autofocus cuando abre
  useEffect(() => {
    if (open) {
      setTimeout(() => userRef.current?.focus(), 50);
    }
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
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      onOpenChange(false);

      // 🔥 micro-delay para evitar corte visual del modal
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
        <Dialog.Overlay
          className="
            fixed inset-0 bg-black/60 backdrop-blur-sm
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
            duration-200
          "
        />

        <Dialog.Content
          aria-describedby="login-desc"
          className="
            fixed left-1/2 top-1/2 w-[92vw] max-w-md
            -translate-x-1/2 -translate-y-1/2
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
            duration-200
            focus:outline-none
          "
        >
          <div className="card p-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">
                Ingresar
              </Dialog.Title>

              <Dialog.Close className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/8 transition">
                <X className="h-4 w-4 text-white/80" />
              </Dialog.Close>
            </div>

            <Dialog.Description
              id="login-desc"
              className="mt-2 text-sm text-white/65"
            >
              Acceso interno. No hay registro público.
            </Dialog.Description>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div>
                <label className="text-xs text-white/70">
                  Usuario / Email
                </label>
                <input
                  ref={userRef}
                  name="username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/20 disabled:opacity-50"
                  placeholder="usuario@necotec.com"
                />
              </div>

              <div>
                <label className="text-xs text-white/70">Contraseña</label>

                <div className="relative mt-1">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm outline-none focus:border-white/20 disabled:opacity-50"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/60 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/8 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {loading ? "Ingresando..." : "Entrar"}
              </button>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}