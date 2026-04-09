"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { type CreateOrdenInput } from "@/lib/api/orders";
import {
  createOrdenClient,
  uploadOrdenFotosClient,
} from "@/lib/api/orders.client";
import { Portal } from "@/components/Portal";
import { PatternLock } from "@/components/orders/PatternLock";
import { PhotoPicker } from "@/components/orders/PhotoPicker";
import { ClienteSearch } from "@/components/orders/ClienteSearch";
import type { Cliente } from "@/lib/api/clients.client";

type CreateOrdenInputMoney = CreateOrdenInput & {
  presupuesto?: number | null;
  senia?: number | null;
};

function parseArsToNumberOrNull(v: string) {
  const raw = (v ?? "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/\.?-$/, "")
    .replace(/\.-$/, "");
  if (!cleaned) return null;
  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatArsDisplay(n: number) {
  const isInt = Math.abs(n % 1) < 1e-9;
  if (isInt) {
    return `$${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}.-`;
  }
  return `$${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatArsInput(n: number) {
  const isInt = Math.abs(n % 1) < 1e-9;
  if (isInt) {
    return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  }
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Clases compartidas para inputs y textareas
const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-sm text-white/85 outline-none focus:border-white/20 placeholder:text-white/35";

export function CreateOrderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL!;

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [files, setFiles] = React.useState<File[]>([]);
  const [fotosDesc, setFotosDesc] = React.useState<string>("");

  const [clienteSel, setClienteSel] = React.useState<Cliente | null>(null);

  const [form, setForm] = React.useState<CreateOrdenInputMoney>({
    dispositivo_tipo: "Celular",
    marca: "",
    modelo: "",
    imei_serial: "",
    falla_reportada: "",
    condicion_equipo: "",
    accesorios_entregados: "",
    observaciones: "",
    bloqueo_tipo: "none",
    bloqueo_valor: "",
    cliente_id: null,
    presupuesto: null,
    senia: null,
  });

  const [presupuestoTxt, setPresupuestoTxt] = React.useState("");
  const [seniaTxt, setSeniaTxt] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setFiles([]);
    setFotosDesc("");
    setClienteSel(null);
    setForm((prev) => ({
      ...prev,
      cliente_id: null,
      presupuesto: null,
      senia: null,
    }));
    setPresupuestoTxt("");
    setSeniaTxt("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const set = (k: keyof CreateOrdenInputMoney, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    try {
      setBusy(true);
      setError(null);

      const presupuesto = parseArsToNumberOrNull(presupuestoTxt);
      const senia = parseArsToNumberOrNull(seniaTxt);

      const payload: CreateOrdenInputMoney = {
        ...form,
        bloqueo_valor:
          form.bloqueo_tipo === "none" ? "" : (form.bloqueo_valor || "").trim(),
        marca: (form.marca || "").trim(),
        modelo: (form.modelo || "").trim(),
        imei_serial: (form.imei_serial || "").trim(),
        presupuesto,
        senia,
      };

      if (payload.bloqueo_tipo === "patron") {
        const n = (payload.bloqueo_valor || "")
          .split("-")
          .filter(Boolean).length;
        if (n < 3) throw new Error("El patrón debe tener al menos 3 puntos.");
      }

      const p = (payload as any).presupuesto as number | null | undefined;
      const s = (payload as any).senia as number | null | undefined;

      if (p != null && p < 0)
        throw new Error("El presupuesto no puede ser negativo.");
      if (s != null && s < 0) throw new Error("La seña no puede ser negativa.");
      if (p != null && s != null && s > p)
        throw new Error("La seña no puede ser mayor al presupuesto.");

      const orden = await createOrdenClient(apiBaseUrl, payload);

      if (files.length) {
        await uploadOrdenFotosClient({
          apiBaseUrl,
          ordenId: orden.id,
          files,
          descripcion: fotosDesc.trim() || undefined,
        });
      }

      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la orden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => !busy && onClose()}
        />

        {/*
          Panel:
          - Mobile: ocupa toda la pantalla menos un margen arriba,
            anclado al fondo para evitar que el teclado virtual lo tape.
          - sm+: centrado con translate como antes.
        */}
        <div
          className="
            absolute
            inset-x-0 bottom-0 sm:inset-auto
            sm:left-1/2 sm:top-1/2
            sm:-translate-x-1/2 sm:-translate-y-1/2
            w-full sm:w-[92vw] sm:max-w-2xl
            rounded-t-3xl sm:rounded-2xl
            border-t border-white/15 sm:border
            bg-[#101827]
            shadow-[0_-10px_60px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_80px_rgba(0,0,0,0.65)]
            max-h-[92dvh] sm:max-h-[85vh]
            flex flex-col overflow-hidden
          "
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl sm:rounded-2xl" />

          {/* Pill de arrastre (solo mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 relative">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="relative px-4 py-3 sm:p-5 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Nueva orden
                </h2>
                <p className="text-xs sm:text-sm text-white/60">
                  Cargá los datos básicos. El estado inicia en{" "}
                  <b>pendiente</b>.
                </p>
              </div>

              <button
                onClick={() => !busy && onClose()}
                className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors"
              >
                Cerrar
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          {/* Body scrolleable */}
          <div className="relative px-4 py-4 sm:p-5 overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <Field label="Tipo de dispositivo">
                <input
                  value={form.dispositivo_tipo || ""}
                  onChange={(e) => set("dispositivo_tipo", e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Cliente (opcional)" className="sm:col-span-2">
                <ClienteSearch
                  apiBaseUrl={apiBaseUrl}
                  value={clienteSel}
                  onSelect={(c) => {
                    setClienteSel(c);
                    set("cliente_id", c.id);
                  }}
                  onClear={() => {
                    setClienteSel(null);
                    set("cliente_id", null);
                  }}
                />
              </Field>

              <Field label="Marca">
                <input
                  value={form.marca || ""}
                  onChange={(e) => set("marca", e.target.value)}
                  className={inputCls}
                  placeholder="Samsung"
                />
              </Field>

              <Field label="Modelo">
                <input
                  value={form.modelo || ""}
                  onChange={(e) => set("modelo", e.target.value)}
                  className={inputCls}
                  placeholder="A54"
                />
              </Field>

              <Field label="IMEI / Serial" className="sm:col-span-2">
                <input
                  value={form.imei_serial || ""}
                  onChange={(e) => set("imei_serial", e.target.value)}
                  className={inputCls}
                  inputMode="numeric"
                />
              </Field>

              <Field label="Falla reportada" className="sm:col-span-2">
                <textarea
                  value={form.falla_reportada || ""}
                  onChange={(e) => set("falla_reportada", e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="No enciende / pantalla rota / etc."
                />
              </Field>

              <Field label="Condición del equipo" className="sm:col-span-2">
                <input
                  value={form.condicion_equipo || ""}
                  onChange={(e) => set("condicion_equipo", e.target.value)}
                  className={inputCls}
                  placeholder="Golpes, rayones, mojado, etc."
                />
              </Field>

              <Field label="Accesorios entregados" className="sm:col-span-2">
                <input
                  value={form.accesorios_entregados || ""}
                  onChange={(e) => set("accesorios_entregados", e.target.value)}
                  className={inputCls}
                  placeholder="Cargador, funda, etc."
                />
              </Field>

              {/* Presupuesto / Seña */}
              <Field label="Presupuesto (opcional)">
                <input
                  value={presupuestoTxt}
                  onChange={(e) => setPresupuestoTxt(e.target.value)}
                  onBlur={() => {
                    const n = parseArsToNumberOrNull(presupuestoTxt);
                    if (n != null) setPresupuestoTxt(formatArsInput(n));
                  }}
                  className={inputCls}
                  placeholder="Ej: 80.000"
                  inputMode="decimal"
                />
                {parseArsToNumberOrNull(presupuestoTxt) != null ? (
                  <div className="mt-1 text-xs text-white/40">
                    {formatArsDisplay(parseArsToNumberOrNull(presupuestoTxt)!)}
                  </div>
                ) : null}
              </Field>

              <Field label="Seña (opcional)">
                <input
                  value={seniaTxt}
                  onChange={(e) => setSeniaTxt(e.target.value)}
                  onBlur={() => {
                    const n = parseArsToNumberOrNull(seniaTxt);
                    if (n != null) setSeniaTxt(formatArsInput(n));
                  }}
                  className={inputCls}
                  placeholder="Ej: 10.000"
                  inputMode="decimal"
                />
                {parseArsToNumberOrNull(seniaTxt) != null ? (
                  <div className="mt-1 text-xs text-white/40">
                    {formatArsDisplay(parseArsToNumberOrNull(seniaTxt)!)}
                  </div>
                ) : null}
              </Field>

              {/* Fotos */}
              <Field label="Fotos" className="sm:col-span-2">
                <PhotoPicker
                  files={files}
                  setFiles={setFiles}
                  maxFiles={8}
                  maxMB={5}
                />
                <div className="mt-2">
                  <div className="mb-1 text-xs font-medium text-white/60">
                    Descripción (opcional)
                  </div>
                  <input
                    value={fotosDesc}
                    onChange={(e) => setFotosDesc(e.target.value)}
                    className={inputCls}
                    placeholder="Ej: Rayón en pantalla / tapa trasera rota"
                  />
                </div>
              </Field>

              {/* Bloqueo */}
              <Field label="Bloqueo" className="sm:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={form.bloqueo_tipo || "none"}
                    onChange={(e) => {
                      const next = e.target.value;
                      set("bloqueo_tipo", next);
                      if (next === "none") set("bloqueo_valor", "");
                    }}
                    className="w-full sm:w-auto rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 sm:py-2 text-sm text-white/85 outline-none focus:border-white/20"
                    style={{ colorScheme: "dark" as any }}
                  >
                    <option className="bg-[#0f172a] text-white" value="none">
                      Sin contraseña
                    </option>
                    <option className="bg-[#0f172a] text-white" value="pin">
                      PIN (4 o 6)
                    </option>
                    <option className="bg-[#0f172a] text-white" value="texto">
                      Texto
                    </option>
                    <option className="bg-[#0f172a] text-white" value="patron">
                      Patrón
                    </option>
                  </select>

                  {(form.bloqueo_tipo || "none") !== "patron" ? (
                    <input
                      value={form.bloqueo_valor || ""}
                      onChange={(e) => set("bloqueo_valor", e.target.value)}
                      disabled={(form.bloqueo_tipo || "none") === "none"}
                      className={`${inputCls} flex-1 disabled:opacity-40`}
                      placeholder="Valor del bloqueo"
                    />
                  ) : null}
                </div>

                {(form.bloqueo_tipo || "none") === "patron" ? (
                  <div className="mt-3 flex justify-center">
                    <PatternLock
                      value={form.bloqueo_valor || ""}
                      onChange={(v) => set("bloqueo_valor", v)}
                      size={220}
                      disabled={busy}
                    />
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-white/50">
                    PIN: 4 o 6 dígitos. Patrón: se dibuja en la grilla.
                  </p>
                )}
              </Field>

              <Field label="Observaciones" className="sm:col-span-2">
                <textarea
                  value={form.observaciones || ""}
                  onChange={(e) => set("observaciones", e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="relative px-4 py-3 sm:p-5 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              onClick={() => !busy && onClose()}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 sm:py-2 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 transition-colors"
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 sm:py-2 text-sm text-white hover:bg-white/15 active:bg-white/20 disabled:opacity-40 transition-colors"
              disabled={busy}
            >
              {busy ? "Creando..." : "Crear orden"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-xs font-medium text-white/60">{label}</div>
      {children}
    </div>
  );
}