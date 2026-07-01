"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Portal } from "./Portal";
import { updateClienteClient } from "@/lib/api/clients.client";
import type { Cliente } from "@/types/orders";
import { getErrorMessage } from "@/lib/api/http";

type Props = {
  apiBaseUrl: string;
  client: Cliente;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditClientModal({
  apiBaseUrl,
  client,
  onClose,
  onUpdated,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: client?.nombre || "",
    apellido: client?.apellido || "",
    dni: client?.dni || "",
    celular: client?.celular || "",
    email: client?.email || "",
    direccion: client?.direccion || "",
  });

  useEffect(() => {
    firstInputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function submit() {
    setBusy(true);
    setError(null);

    try {
      await updateClienteClient(apiBaseUrl, client.id, form);
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Error actualizando cliente"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Portal>
      <div className="modal-root">
        <div className="modal-overlay" onClick={() => !busy && onClose()} />

        <div className="modal-panel">
          <div className="modal-drag" />

          <div className="modal-header">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200/70">
                  Cliente #{client.id}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Editar cliente
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Actualiza contacto y datos de identificacion.
                </p>
              </div>

              <button
                type="button"
                onClick={() => !busy && onClose()}
                className="modal-close"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="modal-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                ref={firstInputRef}
                label="Nombre"
                value={form.nombre}
                onChange={(v) => set("nombre", v)}
              />
              <Input label="Apellido" value={form.apellido} onChange={(v) => set("apellido", v)} />
              <Input label="DNI" value={form.dni} onChange={(v) => set("dni", v)} />
              <Input label="Celular" value={form.celular} onChange={(v) => set("celular", v)} />
              <Input label="Email" value={form.email} onChange={(v) => set("email", v)} full />
              <Input
                label="Direccion"
                value={form.direccion}
                onChange={(v) => set("direccion", v)}
                full
              />
            </div>
          </div>

          <div className="modal-footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => !busy && onClose()}
              className="btn btn-secondary w-full sm:w-auto"
              disabled={busy}
            >
              Cancelar
            </button>

            <button
              onClick={submit}
              className="btn btn-primary w-full gap-2 sm:w-auto"
              disabled={busy}
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : null}
              {busy ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const Input = forwardRef<HTMLInputElement, {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}>(function Input({
  label,
  value,
  onChange,
  full = false,
}, ref) {
  return (
    <label className={full ? "sm:col-span-2" : undefined}>
      <span className="field-label">{label}</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
});

Input.displayName = "Input";
