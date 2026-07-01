"use client";

import React from "react";
import { useParams } from "next/navigation";
import { apiRequest, getErrorMessage } from "@/lib/api/http";

type OrdenFoto = {
  id: number;
  imagen: string;
  descripcion?: string | null;
  created_at?: string;
};

type BloqueoTipo = "none" | "pin" | "texto" | "patron";

type Orden = {
  id: number;
  numero_orden?: string | number;
  marca?: string | null;
  modelo?: string | null;
  imei_serial?: string | null;
  falla_reportada?: string | null;
  observaciones?: string | null;
  bloqueo_tipo?: BloqueoTipo | null;
  bloqueo_valor?: string | null;
  fotos?: OrdenFoto[];
};

function safeText(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function joinNonEmpty(parts: string[], sep = " — ") {
  return parts.map((p) => safeText(p)).filter(Boolean).join(sep);
}

function parsePattern(value?: string | null): number[] {
  const v = safeText(value);
  if (!v) return [];
  return v
    .split(/[-,→\s]+/g)
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 9);
}

function patternToArrows(seq: number[]) {
  return seq.length ? seq.join("→") : "";
}

function PatternPreview({
  value,
  size = 140,
  theme = "dark",
}: {
  value: string;
  size?: number;
  theme?: "dark" | "light";
}) {
  const seq = React.useMemo(() => parsePattern(value), [value]);

  const pad = 14;
  const inner = size - pad * 2;

  const dotRadius = theme === "dark" ? 7 : 6;
  const dotBorder =
    theme === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)";
  const dotFill =
    theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const activeFill =
    theme === "dark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
  const lineColor =
    theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)";
  const gridBorder =
    theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const gridBg =
    theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  const pts = React.useMemo(() => {
    const step = inner / 2;
    const map: Record<number, { x: number; y: number }> = {};
    for (let i = 1; i <= 9; i++) {
      const idx = i - 1;
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      map[i] = { x: pad + col * step, y: pad + row * step };
    }
    return map;
  }, [inner, pad]);

  const segments = React.useMemo(() => {
    if (seq.length < 2) return [];
    const segs: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < seq.length - 1; i++) {
      const a = pts[seq[i]];
      const b = pts[seq[i + 1]];
      if (a && b) segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return segs;
  }, [seq, pts]);

  const active = React.useMemo(() => new Set(seq), [seq]);

  return (
    <div
      className="relative overflow-hidden rounded-xl flex-shrink-0"
      style={{
        width: size,
        height: size,
        border: `1px solid ${gridBorder}`,
        background: gridBg,
      }}
      aria-label="Patrón de bloqueo"
      title={patternToArrows(seq)}
    >
      <svg width={size} height={size} className="absolute inset-0">
        {segments.map((s, idx) => (
          <line
            key={idx}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={lineColor}
            strokeWidth={theme === "dark" ? 6 : 5}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
        const p = pts[n];
        const isActive = active.has(n);
        return (
          <div
            key={n}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: p.x,
              top: p.y,
              width: dotRadius * 2,
              height: dotRadius * 2,
              borderRadius: 999,
              border: `2px solid ${dotBorder}`,
              background: isActive ? activeFill : dotFill,
              boxShadow: isActive
                ? theme === "dark"
                  ? "0 0 0 6px rgba(255,255,255,0.12)"
                  : "0 0 0 6px rgba(0,0,0,0.06)"
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function formatBloqueoText(tipo?: BloqueoTipo | null, valor?: string | null) {
  const t = (tipo ?? "none") as BloqueoTipo;
  const v = safeText(valor);
  if (t === "none") return "Sin contraseña";
  if (t === "pin") return v ? `PIN: ${v}` : "PIN";
  if (t === "texto") return v ? `Texto: ${v}` : "Texto";
  if (t === "patron") {
    const seq = parsePattern(v);
    return seq.length ? `Patrón: ${patternToArrows(seq)}` : "Patrón";
  }
  return "Sin contraseña";
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Orden | null>(null);

  React.useEffect(() => {
    if (!id) return;
    setError(null);
    setLoading(true);
    setData(null);

    apiRequest<Orden>(`/api/ordenes/${id}/`, {
      cache: "no-store",
    })
      .then(setData)
      .catch((e: unknown) =>
        setError(getErrorMessage(e, "No se pudo cargar la orden.")),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const numeroFicha = React.useMemo(() => {
    if (!data) return "";
    return safeText(data.numero_orden ?? data.id);
  }, [data]);

  const marca = React.useMemo(() => safeText(data?.marca ?? ""), [data]);
  const modelo = React.useMemo(() => safeText(data?.modelo ?? ""), [data]);
  const imei = React.useMemo(() => safeText(data?.imei_serial ?? ""), [data]);

  const bloqueoTipo = (data?.bloqueo_tipo ?? "none") as BloqueoTipo;
  const bloqueoValor = safeText(data?.bloqueo_valor ?? "");

  const bloqueoTexto = React.useMemo(() => {
    return formatBloqueoText(bloqueoTipo, bloqueoValor);
  }, [bloqueoTipo, bloqueoValor]);

  const patronSeq = React.useMemo(
    () => parsePattern(bloqueoValor),
    [bloqueoValor]
  );
  const patronArrows = React.useMemo(
    () => patternToArrows(patronSeq),
    [patronSeq]
  );

  const fallaObs = React.useMemo(() => {
    const falla = safeText(data?.falla_reportada ?? "");
    const obs = safeText(data?.observaciones ?? "");
    return joinNonEmpty([falla, obs], " — ");
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0b0f16] text-slate-100">
      <style jsx global>{`
        @page {
          margin: 6mm;
        }

        .card-screen {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #101827;
          box-shadow: 0 20px 80px rgba(0, 0, 0, 0.55);
        }

        .label-print {
          width: 58mm;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          background: white;
          color: #0b0f16;
        }

        .print-colors * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .only-screen {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        @media screen {
          .only-print {
            display: none;
          }
        }
      `}</style>

      {/* ── Navbar ── */}
      <div className="no-print sticky top-0 z-10 border-b border-white/10 bg-[#0b0f16]/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="text-xs sm:text-sm text-slate-300">Ficha técnica</div>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              Imprimir
            </button>
            <button
              onClick={() => window.close()}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs sm:px-3 sm:text-sm hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="mx-auto flex max-w-4xl justify-center px-3 py-5 sm:px-4 sm:py-10">
        {loading ? (
          <div className="w-full rounded-xl border border-white/10 bg-[#101827] p-4 text-sm text-slate-300">
            Cargando ficha...
          </div>
        ) : error ? (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : !data ? (
          <div className="w-full rounded-xl border border-white/10 bg-[#101827] p-4 text-sm text-slate-300">
            No se encontró la orden.
          </div>
        ) : (
          <>
            {/* ── SCREEN ── */}
            <div className="only-screen card-screen print-colors avoid-break p-4 sm:p-6 md:p-8">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-300">
                    SERVISTECH • FICHA TÉCNICA
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                    #{numeroFicha}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white/80">
                  TALLER
                </div>
              </div>

              <div className="my-4 sm:my-6 border-t border-white/10" />

              {/* Grid de campos */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">

                {/* Marca */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                    Marca
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-semibold text-white truncate">
                    {marca || "—"}
                  </div>
                </div>

                {/* Modelo */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                    Modelo
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-semibold text-white truncate">
                    {modelo || "—"}
                  </div>
                </div>

                {/* IMEI */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 sm:col-span-2">
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                    IMEI
                  </div>
                  <div className="mt-1 break-all text-base sm:text-lg font-semibold text-white">
                    {imei || "—"}
                  </div>
                </div>

                {/* Bloqueo */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 sm:col-span-2">
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                    Bloqueo
                  </div>

                  {bloqueoTipo === "patron" ? (
                    <div className="mt-3 flex flex-col items-start gap-3 xs:flex-row xs:items-center">
                      <PatternPreview
                        value={bloqueoValor}
                        size={120}
                        theme="dark"
                      />
                      <div>
                        <div className="text-base sm:text-lg font-semibold text-white">
                          Patrón
                        </div>
                        <div className="mt-1 text-sm text-white/70 break-words">
                          {patronArrows || "—"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 break-words text-base sm:text-lg font-semibold text-white">
                      {bloqueoTexto || "Sin contraseña"}
                    </div>
                  )}
                </div>

                {/* Falla / Observaciones */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 sm:col-span-2">
                  <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                    Falla / Observaciones
                  </div>
                  <div className="mt-2 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed text-white/90">
                    {fallaObs || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* ── PRINT (etiqueta) ── */}
            <div className="only-print print-colors avoid-break label-print mx-auto p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-black/70">
                    NECOTEC • FICHA TÉCNICA
                  </div>
                  <div className="mt-0.5 text-[18px] font-extrabold leading-none">
                    #{numeroFicha}
                  </div>
                </div>
                <div className="rounded-md border border-black/10 bg-black/[0.04] px-2 py-1 text-[10px] font-semibold">
                  TALLER
                </div>
              </div>

              <div className="my-2 border-t border-black/15" />

              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    Marca
                  </div>
                  <div className="text-[12px] font-semibold">{marca || "—"}</div>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    Modelo
                  </div>
                  <div className="text-right text-[12px] font-semibold">
                    {modelo || "—"}
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    IMEI
                  </div>
                  <div className="text-right text-[12px] font-semibold">
                    {imei || "—"}
                  </div>
                </div>
              </div>

              <div className="my-2 border-t border-black/15" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                  Bloqueo
                </div>
                {bloqueoTipo === "patron" ? (
                  <div className="mt-2 flex items-center gap-2">
                    <PatternPreview value={bloqueoValor} size={82} theme="light" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold">Patrón</div>
                      <div className="mt-0.5 text-[11px] text-black/70 break-words">
                        {patronArrows || "—"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[12px] font-semibold">
                    {bloqueoTexto || "Sin contraseña"}
                  </div>
                )}
              </div>

              <div className="my-2 border-t border-black/15" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                  Falla / Obs.
                </div>
                <div
                  className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-snug"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 8,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                  title={fallaObs || ""}
                >
                  {fallaObs || "—"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
