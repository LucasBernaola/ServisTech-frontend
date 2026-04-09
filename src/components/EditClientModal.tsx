"use client"

import { useEffect, useState, useRef } from "react"
import { Portal } from "./Portal"

type Props = {
  apiBaseUrl: string
  client: any
  onClose: () => void
  onUpdated: () => void
}

export default function EditClientModal({ apiBaseUrl, client, onClose, onUpdated }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const firstInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre: client?.nombre || "",
    apellido: client?.apellido || "",
    dni: client?.dni || "",
    celular: client?.celular || "",
    email: client?.email || "",
    direccion: client?.direccion || "",
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  // 🔥 autofocus + ESC + bloquear scroll
  useEffect(() => {
    firstInputRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose()
    }

    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [busy, onClose])

  async function submit() {
    setBusy(true)
    setError(null)

    try {
      const res = await fetch(`${apiBaseUrl}/api/clientes/${client.id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        let msg = "Error actualizando cliente"
        try {
          const data = await res.json()
          msg = data?.detail || JSON.stringify(data)
        } catch {}
        throw new Error(msg)
      }

      onUpdated()
      onClose() // 🔥 UX clave: cerrar automáticamente
    } catch (e: any) {
      setError(e?.message || "Error actualizando cliente")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        {/* overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => !busy && onClose()}
        />

        {/* modal */}
        <div
          className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2
          rounded-2xl border border-white/15 bg-[#101827]
          shadow-[0_20px_80px_rgba(0,0,0,0.65)]
          max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />

          {/* header */}
          <div className="relative p-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Editar cliente
                </h2>
                <p className="text-sm text-white/60">
                  Cliente #{client.id}
                </p>
              </div>

              <button
                onClick={() => !busy && onClose()}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
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

          {/* body */}
          <div className="relative p-5 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                ref={firstInputRef}
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                className="input"
              />

              <input
                placeholder="Apellido"
                value={form.apellido}
                onChange={(e) => set("apellido", e.target.value)}
                className="input"
              />

              <input
                placeholder="DNI"
                value={form.dni}
                onChange={(e) => set("dni", e.target.value)}
                className="input"
              />

              <input
                placeholder="Celular"
                value={form.celular}
                onChange={(e) => set("celular", e.target.value)}
                className="input"
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="input md:col-span-2"
              />

              <input
                placeholder="Dirección"
                value={form.direccion}
                onChange={(e) => set("direccion", e.target.value)}
                className="input md:col-span-2"
              />
            </div>
          </div>

          {/* footer */}
          <div className="relative p-4 md:p-5 border-t border-white/10 flex flex-col-reverse md:flex-row gap-2 md:justify-end">
            <button
              onClick={() => !busy && onClose()}
              className="w-full md:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-40"
              disabled={busy}
            >
              Cancelar
            </button>

            <button
              onClick={submit}
              className="w-full md:w-auto rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40 flex items-center justify-center gap-2"
              disabled={busy}
            >
              {busy && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {busy ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}