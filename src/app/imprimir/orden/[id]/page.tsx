"use client";

import React from "react";
import { useParams } from "next/navigation";

type OrdenEstado =
  | "pendiente"
  | "diagnosticado"
  | "en_progreso"
  | "reparado"
  | "finalizado";

const ESTADOS: { value: OrdenEstado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "reparado", label: "Reparado" },
  { value: "finalizado", label: "Finalizado" },
];

function estadoLabel(estado: string) {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

function estadoPillClasses(estado: string) {
  switch (estado) {
    case "pendiente":
      return "border-sky-500/25 bg-sky-500/10 text-sky-100";
    case "diagnosticado":
      return "border-indigo-500/25 bg-indigo-500/10 text-indigo-100";
    case "en_progreso":
      return "border-amber-500/25 bg-amber-500/10 text-amber-100";
    case "reparado":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
    case "finalizado":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
    default:
      return "border-white/10 bg-white/5 text-white/80";
  }
}

function qrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <div className="mb-1 text-xs font-medium text-white/60 print-muted">
        {label}
      </div>
      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:p-3 text-sm text-white/85 print-field">
        {children}
      </div>
    </div>
  );
}

export default function PrintOrdenPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const apiBase = process.env.NEXT_PUBLIC_API_URL!;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!id) return;
    setError(null);
    setLoading(true);
    setData(null);

    fetch(`${apiBase}/api/ordenes/${id}/`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          throw new Error(txt || `Error ${r.status}`);
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e?.message || "No se pudo cargar la orden."))
      .finally(() => setLoading(false));
  }, [id, apiBase]);

  const trackingUrl = data?.public_token
    ? `${siteBase}/seguimiento/${data.public_token}`
    : "";

  const qr = trackingUrl ? qrUrl(trackingUrl) : "";

  return (
    <div className="min-h-screen bg-[#0b0f16] text-white print-bg">
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-bg { background: #ffffff !important; color: #000000 !important; }
          .print-muted { color: #333 !important; }
          .print-card { border: 1px solid #ddd !important; background: #fff !important; }
          .print-field { border: 1px solid #eee !important; background: #fff !important; color: #000 !important; }
          .print-pill { border-color: #bbb !important; background: #f5f5f5 !important; color: #111 !important; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
          .print-onepage { padding: 0 !important; }
          .print-header { margin-bottom: 10px !important; }
          .print-grid { gap: 10px !important; }
          .print-card-pad { padding: 12px !important; }
          .print-qr { width: 190px !important; height: 190px !important; }
          .print-title { font-size: 18px !important; }
          .print-sub { font-size: 11px !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-6 md:py-10 print-onepage">

        {/* ── Header ── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print-header no-break">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-white/60 print-muted print-sub">
              Impresión de orden
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-white/90 print-muted print-title">
                {loading ? "Cargando..." : `Orden #${data?.id ?? id}`}
              </h1>

              {!loading && data?.estado ? (
                <span
                  className={[
                    "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                    "print-pill",
                    estadoPillClasses(data.estado),
                  ].join(" ")}
                >
                  {estadoLabel(data.estado)}
                </span>
              ) : null}
            </div>

            {!loading ? (
              <div className="mt-1 text-xs text-white/50 print-muted print-sub">
                Última actualización: {formatDateTime(data?.updated_at)}
              </div>
            ) : null}
          </div>

          {/* Botones: en mobile van debajo del título, en sm+ a la derecha */}
          <div className="no-print flex gap-2 sm:flex-shrink-0">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 sm:px-4 text-sm text-white hover:bg-white/15 active:bg-white/20 transition-colors disabled:opacity-40"
              disabled={loading || !!error}
            >
              Imprimir
            </button>
            <button
              onClick={() => window.close()}
              className="flex-1 sm:flex-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:px-4 text-sm text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error ? (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 no-print">
            {error}
          </div>
        ) : null}

        {/* ── Loading skeleton ── */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1fr_280px] print-grid">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 print-card print-card-pad no-break">
              <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-10 w-64 animate-pulse rounded bg-white/10" />
              <div className="mt-6 space-y-3">
                <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                <div className="h-16 animate-pulse rounded-xl bg-white/10" />
                <div className="h-28 animate-pulse rounded-xl bg-white/10" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 print-card print-card-pad no-break">
              <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-48 sm:h-60 animate-pulse rounded-xl bg-white/10" />
            </div>
          </div>
        ) : null}

        {/* ── Contenido ── */}
        {!loading && data ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-[1fr_280px] print-grid">

            {/* Card izquierda: datos */}
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-4 sm:p-5 print-card print-card-pad no-break">
              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
                <Field label="Cliente">
                  <span className="whitespace-pre-wrap">
                    {(data.cliente?.nombre || "").trim()}{" "}
                    {(data.cliente?.apellido || "").trim() || ""}
                  </span>
                </Field>

                <Field label="Teléfono">
                  <span>{data.cliente?.celular || "—"}</span>
                </Field>

                <Field label="Equipo" className="sm:col-span-2">
                  <span>
                    {data.dispositivo_tipo || "Equipo"} — {data.marca || "—"}{" "}
                    {data.modelo || ""}
                  </span>
                </Field>

                <Field label="IMEI / Serial" className="sm:col-span-2">
                  <span className="break-all">{data.imei_serial || "—"}</span>
                </Field>

                <Field label="Observaciones" className="sm:col-span-2">
                  <div className="whitespace-pre-wrap">
                    {data.observaciones || "—"}
                  </div>
                </Field>
              </div>
            </div>

            {/* Card derecha: QR */}
            <div className="rounded-2xl border border-white/10 bg-[#101827] p-4 sm:p-5 print-card print-card-pad no-break">
              <div className="text-sm font-semibold text-white/85 print-muted">
                Seguimiento
              </div>
              <div className="mt-0.5 text-xs text-white/60 print-muted print-sub">
                Escaneá este QR
              </div>

              {/* En mobile el QR se centra y es un poco más chico */}
              <div className="mt-3 flex justify-center">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-2.5 sm:p-3 print-field">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="print-qr block w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[240px] md:h-[240px]"
                    src={qr}
                    alt="QR Seguimiento"
                    width={240}
                    height={240}
                  />
                </div>
              </div>

              {/* URL truncada en mobile para no romper layout */}
              <div className="mt-3 text-center text-xs text-white/60 print-muted print-sub break-all px-1">
                {trackingUrl}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}