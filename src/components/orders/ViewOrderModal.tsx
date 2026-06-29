// src/components/orders/ViewOrderModal.tsx
"use client";

import React from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/Portal";
import { ClienteSearch } from "@/components/orders/ClienteSearch";
import { PatternLock } from "@/components/orders/PatternLock";
import { PhotoPicker } from "@/components/orders/PhotoPicker";

import type { Cliente } from "@/lib/api/clients.client";
import type { Orden, OrdenBloqueoTipo, OrdenFoto } from "@/types/orders";
import type { CreateOrdenInput } from "@/lib/api/orders";

import {
  getOrdenClient,
  patchOrdenClient,
  printSeguimientoUrl,
  printFichaUrl,
  uploadOrdenFotosClient,
} from "@/lib/api/orders.client";

type OrdenFotoLike = string | OrdenFoto;

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

function coerceMoneyToNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const nDirect = Number(s);
    if (Number.isFinite(nDirect)) return nDirect;
    return parseArsToNumberOrNull(s);
  }
  return null;
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

function joinUrl(base: string, pathOrUrl: string) {
  const p = (pathOrUrl || "").trim();
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const b = (base || "").replace(/\/+$/, "");
  const rel = p.startsWith("/") ? p : `/${p}`;
  return `${b}${rel}`;
}

function resolveFotoSrc(apiBaseUrl: string, foto: OrdenFotoLike): string {
  if (!foto) return "";
  if (typeof foto === "string") return joinUrl(apiBaseUrl, foto);
  const direct =
    foto.imagen ??
    foto.imagen_url ??
    foto.image ??
    foto.image_url ??
    foto.url ??
    foto.public_url ??
    foto.file_url ??
    foto.src;
  if (typeof direct === "string" && direct.trim())
    return joinUrl(apiBaseUrl, direct);
  const path = foto.path ?? foto.ruta ?? foto.file_path ?? foto.filePath;
  if (typeof path === "string" && path.trim()) return joinUrl(apiBaseUrl, path);
  return "";
}

function resolveFotoDesc(foto: OrdenFotoLike): string {
  if (!foto) return "";
  if (typeof foto === "string") return "";
  return (foto.descripcion ?? foto.description ?? foto.desc ?? "").trim();
}

// Clases compartidas
const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-sm text-white/85 outline-none focus:border-white/20 disabled:opacity-50 placeholder:text-white/35";
const darkSelectStyle: CSSProperties = { colorScheme: "dark" };

export function ViewOrderModal({
  open,
  onClose,
  ordenId,
}: {
  open: boolean;
  onClose: () => void;
  ordenId: number | null;
}) {
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL!;

  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [orden, setOrden] = React.useState<Orden | null>(null);
  const [clienteSel, setClienteSel] = React.useState<Cliente | null>(null);

  const [files, setFiles] = React.useState<File[]>([]);
  const [fotosDesc, setFotosDesc] = React.useState<string>("");

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

  const set = <K extends keyof CreateOrdenInputMoney>(
    k: K,
    v: CreateOrdenInputMoney[K],
  ) =>
    setForm((p) => ({ ...p, [k]: v }));

  const loadOrden = React.useCallback(async () => {
    if (!ordenId) {
      setError("Falta ordenId.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const o = await getOrdenClient(apiBaseUrl, ordenId);
      setOrden(o);
      const c = o.cliente as Cliente | null | undefined;
      setClienteSel(c ?? null);
      const p0 = coerceMoneyToNumber(o.presupuesto);
      const s0 = coerceMoneyToNumber(o.senia);
      setForm({
        dispositivo_tipo: o.dispositivo_tipo ?? "Celular",
        marca: o.marca ?? "",
        modelo: o.modelo ?? "",
        imei_serial: o.imei_serial ?? "",
        falla_reportada: o.falla_reportada ?? "",
        condicion_equipo: o.condicion_equipo ?? "",
        accesorios_entregados: o.accesorios_entregados ?? "",
        observaciones: o.observaciones ?? "",
        bloqueo_tipo: o.bloqueo_tipo ?? "none",
        bloqueo_valor: o.bloqueo_valor ?? "",
        cliente_id: c?.id ?? null,
        presupuesto: p0,
        senia: s0,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la orden.");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, ordenId]);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setOrden(null);
    setClienteSel(null);
    setFiles([]);
    setFotosDesc("");
    loadOrden();
  }, [open, loadOrden]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fotosExistentes = React.useMemo(() => {
    const list = Array.isArray(orden?.fotos) ? orden.fotos : [];
    return list
      .map((f, idx) => {
        const src = resolveFotoSrc(apiBaseUrl, f);
        const desc = resolveFotoDesc(f);
        const key =
          typeof f !== "string" && (f.id ?? f.uuid) != null
            ? String(f.id ?? f.uuid)
            : `${src || "foto"}-${idx}`;
        return { key, src, desc };
      })
      .filter((x) => !!x.src);
  }, [orden, apiBaseUrl]);

  if (!open) return null;

  const onPrintCliente = () => {
    if (!ordenId) return;
    window.open(
      printSeguimientoUrl(apiBaseUrl, ordenId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const onPrintFicha = () => {
    if (!ordenId) return;
    window.open(
      printFichaUrl(apiBaseUrl, ordenId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const submit = async () => {
    if (!ordenId) return;
    try {
      setBusy(true);
      setError(null);
      const payload: CreateOrdenInput = {
        ...form,
        bloqueo_valor:
          form.bloqueo_tipo === "none" ? "" : (form.bloqueo_valor || "").trim(),
        marca: (form.marca || "").trim(),
        modelo: (form.modelo || "").trim(),
        imei_serial: (form.imei_serial || "").trim(),
      } as unknown as CreateOrdenInput;

      if (payload.bloqueo_tipo === "patron") {
        const n = (payload.bloqueo_valor || "")
          .split("-")
          .filter(Boolean).length;
        if (n < 3) throw new Error("El patrón debe tener al menos 3 puntos.");
      }

      await patchOrdenClient(apiBaseUrl, ordenId, payload);

      if (files.length) {
        await uploadOrdenFotosClient({
          apiBaseUrl,
          ordenId,
          files,
          descripcion: fotosDesc.trim() || undefined,
        });
        setFiles([]);
        setFotosDesc("");
      }

      await loadOrden();
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la orden.");
    } finally {
      setBusy(false);
    }
  };

  const presupuestoDisplay =
    form.presupuesto != null ? formatArsDisplay(form.presupuesto) : "—";
  const seniaDisplay = form.senia != null ? formatArsDisplay(form.senia) : "—";

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => !busy && onClose()}
        />

        {/* Panel: bottom sheet en mobile, centrado en sm+ */}
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

          {/* ── Header ── */}
          <div className="relative px-4 py-3 sm:p-5 border-b border-white/10">
            {/* Título + estado */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  {ordenId ? `Orden #${ordenId}` : "Orden"}
                </h2>
                <p className="text-xs sm:text-sm text-white/60">
                  {orden ? (
                    <>
                      Estado:{" "}
                      <b>
                        {orden.estado_display || orden.estado}
                      </b>
                    </>
                  ) : (
                    "Cargando datos..."
                  )}
                </p>
              </div>

              {/* Botón cerrar siempre visible arriba a la derecha */}
              <button
                onClick={() => !busy && onClose()}
                className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors"
              >
                Cerrar
              </button>
            </div>

            {/* Botones de impresión: en mobile van en fila debajo del título */}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={onPrintCliente}
                disabled={busy || loading || !ordenId}
                className="flex-1 sm:flex-none rounded-lg border border-white/10 bg-white/10 px-3 py-2 sm:py-1.5 text-xs text-white/90 hover:bg-white/15 active:bg-white/20 disabled:opacity-40 transition-colors"
              >
                Imprimir orden
              </button>
              <button
                onClick={onPrintFicha}
                disabled={busy || loading || !ordenId}
                className="flex-1 sm:flex-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 sm:py-1.5 text-xs text-white/90 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 transition-colors"
              >
                Ficha técnica
              </button>
            </div>

            {error ? (
              <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          {/* ── Body scrolleable ── */}
          <div className="relative px-4 py-4 sm:p-5 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="py-10 text-center text-sm text-white/60">
                Cargando orden...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tipo de dispositivo">
                  <input
                    value={form.dispositivo_tipo || ""}
                    onChange={(e) => set("dispositivo_tipo", e.target.value)}
                    className={inputCls}
                    disabled={busy}
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
                    disabled={busy}
                  />
                </Field>

                <Field label="Modelo">
                  <input
                    value={form.modelo || ""}
                    onChange={(e) => set("modelo", e.target.value)}
                    className={inputCls}
                    disabled={busy}
                  />
                </Field>

                <Field label="IMEI / Serial" className="sm:col-span-2">
                  <input
                    value={form.imei_serial || ""}
                    onChange={(e) => set("imei_serial", e.target.value)}
                    className={inputCls}
                    disabled={busy}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Falla reportada" className="sm:col-span-2">
                  <textarea
                    value={form.falla_reportada || ""}
                    onChange={(e) => set("falla_reportada", e.target.value)}
                    rows={3}
                    className={inputCls}
                    disabled={busy}
                  />
                </Field>

                <Field label="Condición del equipo" className="sm:col-span-2">
                  <input
                    value={form.condicion_equipo || ""}
                    onChange={(e) => set("condicion_equipo", e.target.value)}
                    className={inputCls}
                    disabled={busy}
                  />
                </Field>

                <Field label="Accesorios entregados" className="sm:col-span-2">
                  <input
                    value={form.accesorios_entregados || ""}
                    onChange={(e) =>
                      set("accesorios_entregados", e.target.value)
                    }
                    className={inputCls}
                    disabled={busy}
                  />
                </Field>

                {/* Presupuesto / Seña (solo lectura) */}
                <Field label="Presupuesto">
                  <div className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-sm text-white/85">
                    {presupuestoDisplay}
                  </div>
                </Field>

                <Field label="Seña">
                  <div className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-sm text-white/85">
                    {seniaDisplay}
                  </div>
                </Field>

                {/* Fotos existentes */}
                <Field label="Fotos cargadas" className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white/50">
                      {fotosExistentes.length
                        ? `${fotosExistentes.length} foto(s)`
                        : "Sin fotos aún."}
                    </p>
                    <button
                      type="button"
                      onClick={() => !busy && loadOrden()}
                      disabled={busy || loading}
                      className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 transition-colors"
                    >
                      Refrescar
                    </button>
                  </div>

                  {fotosExistentes.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {fotosExistentes.map((f) => (
                        <a
                          key={f.key}
                          href={f.src}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
                          title={f.desc ? `Abrir: ${f.desc}` : "Abrir imagen"}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.src}
                            alt={f.desc || "Foto"}
                            className="h-24 w-full object-cover transition group-hover:scale-[1.02]"
                          />
                          {f.desc ? (
                            <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] text-white/90 line-clamp-2">
                              {f.desc}
                            </div>
                          ) : null}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </Field>

                {/* Agregar fotos nuevas */}
                <Field label="Agregar fotos" className="sm:col-span-2">
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
                      disabled={busy}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    Las fotos se suben al guardar cambios.
                  </p>
                </Field>

                {/* Bloqueo */}
                <Field label="Bloqueo" className="sm:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={form.bloqueo_tipo || "none"}
                      onChange={(e) => {
                        const next = e.target.value as OrdenBloqueoTipo;
                        set("bloqueo_tipo", next);
                        if (next === "none") set("bloqueo_valor", "");
                      }}
                      className="w-full sm:w-auto rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 sm:py-2 text-sm text-white/85 outline-none focus:border-white/20"
                      style={darkSelectStyle}
                      disabled={busy}
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
                      <option
                        className="bg-[#0f172a] text-white"
                        value="patron"
                      >
                        Patrón
                      </option>
                    </select>

                    {(form.bloqueo_tipo || "none") !== "patron" ? (
                      <input
                        value={form.bloqueo_valor || ""}
                        onChange={(e) => set("bloqueo_valor", e.target.value)}
                        disabled={
                          busy || (form.bloqueo_tipo || "none") === "none"
                        }
                        className={`${inputCls} flex-1 bg-[#0f172a]`}
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
                    disabled={busy}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="relative px-4 py-3 sm:p-5 border-t border-white/10 flex items-center gap-2">
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
              disabled={busy || loading}
            >
              {busy ? "Guardando..." : "Guardar cambios"}
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
