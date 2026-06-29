"use client"

import { useState } from "react"
import { Portal } from "./Portal"

type Props = {
  apiBaseUrl: string
  onClose: () => void
  onCreated: () => void
}

export default function CreateClientModal({ apiBaseUrl, onClose, onCreated }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    celular: "",
    email: "",
    direccion: "",
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`${apiBaseUrl}/api/clientes/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        let msg = "Error creando cliente"
        try {
          const data = await res.json()
          msg = data?.detail || JSON.stringify(data)
        } catch {}
        throw new Error(msg)
      }

      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error creando cliente")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        {/* overlay */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => !busy && onClose()}
        />

        {/* modal */}
        <div
          className="
          absolute left-1/2 top-1/2 w-[95vw] sm:w-[92vw] max-w-2xl
          -translate-x-1/2 -translate-y-1/2
          rounded-2xl border border-white/15 bg-[#101827]
          shadow-[0_20px_80px_rgba(0,0,0,0.65)]
          max-h-[90vh] flex flex-col overflow-hidden
        "
        >
          {/* HEADER */}
          <div className="p-4 sm:p-5 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Nuevo cliente
                </h2>
                <p className="text-xs sm:text-sm text-white/60">
                  Completá los datos básicos del cliente.
                </p>
              </div>

              <button
                onClick={() => !busy && onClose()}
                className="self-end sm:self-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            )}
          </div>

          {/* BODY */}
          <div className="p-4 sm:p-5 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nombre" value={form.nombre} onChange={(v) => set("nombre", v)} />
              <Input label="Apellido" value={form.apellido} onChange={(v) => set("apellido", v)} />
              <Input label="DNI" value={form.dni} onChange={(v) => set("dni", v)} />
              <Input label="Celular" value={form.celular} onChange={(v) => set("celular", v)} />

              <Input
                label="Email (opcional)"
                value={form.email}
                onChange={(v) => set("email", v)}
                full
              />

              <Input
                label="Dirección (opcional)"
                value={form.direccion}
                onChange={(v) => set("direccion", v)}
                full
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => !busy && onClose()}
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
              disabled={busy}
            >
              Cancelar
            </button>

            <button
              onClick={submit}
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40"
              disabled={busy}
            >
              {busy ? "Creando..." : "Crear cliente"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

/* 🔹 Input reutilizable */
function Input({
  label,
  value,
  onChange,
  full = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  full?: boolean
}) {
  return (
    <div className={`space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <div className="text-xs font-medium text-white/60">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-xl border border-white/10 bg-white/5
          px-3 py-2.5 text-sm text-white/85 outline-none
          focus:border-white/20
        "
      />
    </div>
  )
}
