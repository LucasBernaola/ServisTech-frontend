"use client";

import React from "react";
import { Printer, X } from "lucide-react";
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

function safeText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function joinNonEmpty(parts: string[], sep = " - ") {
  return parts.map((part) => safeText(part)).filter(Boolean).join(sep);
}

function parsePattern(value?: string | null): number[] {
  const clean = safeText(value);
  if (!clean) return [];
  return clean
    .split(/[-,>\s]+/g)
    .map((item) => Number(item))
    .filter((number) => Number.isFinite(number) && number >= 1 && number <= 9);
}

function patternToArrows(seq: number[]) {
  return seq.length ? seq.join(" > ") : "";
}

function PatternPreview({
  value,
  size = 132,
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

  const colors =
    theme === "dark"
      ? {
          dotBorder: "rgba(255,255,255,0.25)",
          dotFill: "rgba(255,255,255,0.08)",
          activeFill: "#fcd34d",
          line: "rgba(252,211,77,0.78)",
          border: "rgba(255,255,255,0.12)",
          bg: "rgba(255,255,255,0.04)",
        }
      : {
          dotBorder: "rgba(0,0,0,0.18)",
          dotFill: "rgba(0,0,0,0.04)",
          activeFill: "#111827",
          line: "rgba(17,24,39,0.70)",
          border: "rgba(0,0,0,0.14)",
          bg: "rgba(0,0,0,0.03)",
        };

  const points = React.useMemo(() => {
    const step = inner / 2;
    const map: Record<number, { x: number; y: number }> = {};

    for (let i = 1; i <= 9; i++) {
      const idx = i - 1;
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      map[i] = { x: pad + col * step, y: pad + row * step };
    }

    return map;
  }, [inner]);

  const segments = React.useMemo(() => {
    if (seq.length < 2) return [];

    return seq.slice(0, -1).flatMap((item, index) => {
      const from = points[item];
      const to = points[seq[index + 1]];
      return from && to ? [{ from, to }] : [];
    });
  }, [points, seq]);

  const active = React.useMemo(() => new Set(seq), [seq]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg"
      style={{
        width: size,
        height: size,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
      }}
      aria-label="Patron de bloqueo"
      title={patternToArrows(seq)}
    >
      <svg width={size} height={size} className="absolute inset-0">
        {segments.map((segment, index) => (
          <line
            key={index}
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            stroke={colors.line}
            strokeWidth={theme === "dark" ? 6 : 5}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {Array.from({ length: 9 }, (_, index) => index + 1).map((number) => {
        const point = points[number];
        const isActive = active.has(number);

        return (
          <div
            key={number}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: point.x,
              top: point.y,
              width: dotRadius * 2,
              height: dotRadius * 2,
              borderRadius: 999,
              border: `2px solid ${colors.dotBorder}`,
              background: isActive ? colors.activeFill : colors.dotFill,
            }}
          />
        );
      })}
    </div>
  );
}

function formatBloqueoText(tipo?: BloqueoTipo | null, valor?: string | null) {
  const current = (tipo ?? "none") as BloqueoTipo;
  const text = safeText(valor);

  if (current === "none") return "Sin contrasena";
  if (current === "pin") return text ? `PIN: ${text}` : "PIN";
  if (current === "texto") return text ? `Texto: ${text}` : "Texto";

  if (current === "patron") {
    const seq = parsePattern(text);
    return seq.length ? `Patron: ${patternToArrows(seq)}` : "Patron";
  }

  return "Sin contrasena";
}

function InfoBlock({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.035] p-4 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
        {label}
      </div>
      <div className="mt-2 min-h-6 break-words text-base font-semibold text-white">
        {value}
      </div>
    </div>
  );
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

  const marca = safeText(data?.marca ?? "");
  const modelo = safeText(data?.modelo ?? "");
  const imei = safeText(data?.imei_serial ?? "");
  const bloqueoTipo = (data?.bloqueo_tipo ?? "none") as BloqueoTipo;
  const bloqueoValor = safeText(data?.bloqueo_valor ?? "");
  const bloqueoTexto = formatBloqueoText(bloqueoTipo, bloqueoValor);
  const patronSeq = parsePattern(bloqueoValor);
  const patronArrows = patternToArrows(patronSeq);
  const fallaObs = joinNonEmpty(
    [safeText(data?.falla_reportada ?? ""), safeText(data?.observaciones ?? "")],
    " - ",
  );

  return (
    <div className="min-h-screen necotec-bg text-white">
      <style jsx global>{`
        @page {
          margin: 6mm;
        }

        .print-colors * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .label-print {
          width: 58mm;
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.18);
          background: white;
          color: #111827;
        }

        @media screen {
          .only-print {
            display: none !important;
          }
        }

        @media print {
          body {
            background: white !important;
          }

          .no-print,
          .only-screen {
            display: none !important;
          }

          .only-print {
            display: block !important;
          }

          .print-wrap {
            padding: 0 !important;
          }

          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 border-b border-white/10 bg-[#0f1012]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200/70">
              ServisTech
            </div>
            <div className="truncate text-sm text-white/70">Ficha tecnica</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn btn-primary gap-2 px-3 py-2 text-xs sm:text-sm"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={() => window.close()}
              className="btn btn-secondary gap-2 px-3 py-2 text-xs sm:text-sm"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <main className="print-wrap mx-auto flex max-w-5xl justify-center px-4 py-6 sm:py-10">
        {loading ? (
          <div className="panel w-full p-5 text-sm text-white/65">
            Cargando ficha...
          </div>
        ) : error ? (
          <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : !data ? (
          <div className="panel w-full p-5 text-sm text-white/65">
            No se encontro la orden.
          </div>
        ) : (
          <>
            <section className="only-screen panel print-colors avoid-break w-full overflow-hidden">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200/70">
                      Ficha tecnica
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                      #{numeroFicha}
                    </h1>
                    <p className="mt-2 text-sm text-white/48">
                      Etiqueta tecnica para identificar equipo, bloqueo y falla reportada.
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
                    TALLER
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <InfoBlock label="Marca" value={marca || "-"} />
                <InfoBlock label="Modelo" value={modelo || "-"} />
                <InfoBlock label="IMEI / Serial" value={imei || "-"} className="sm:col-span-2" />

                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:col-span-2">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
                    Bloqueo
                  </div>

                  {bloqueoTipo === "patron" ? (
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <PatternPreview value={bloqueoValor} size={132} theme="dark" />
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-white">Patron</div>
                        <div className="mt-1 break-words text-sm text-white/60">
                          {patronArrows || "-"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 break-words text-base font-semibold text-white">
                      {bloqueoTexto || "Sin contrasena"}
                    </div>
                  )}
                </div>

                <InfoBlock
                  label="Falla / Observaciones"
                  value={
                    <span className="whitespace-pre-wrap text-sm font-normal leading-relaxed text-white/82">
                      {fallaObs || "-"}
                    </span>
                  }
                  className="sm:col-span-2"
                />
              </div>
            </section>

            <section className="only-print print-colors avoid-break label-print mx-auto p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-black/60">
                    SERVISTECH - FICHA TECNICA
                  </div>
                  <div className="mt-1 text-[20px] font-extrabold leading-none">
                    #{numeroFicha}
                  </div>
                </div>
                <div className="rounded border border-black/10 bg-black/[0.04] px-2 py-1 text-[10px] font-semibold">
                  TALLER
                </div>
              </div>

              <div className="my-2 border-t border-black/15" />

              <div className="space-y-1.5">
                <PrintRow label="Marca" value={marca || "-"} />
                <PrintRow label="Modelo" value={modelo || "-"} />
                <PrintRow label="IMEI" value={imei || "-"} />
              </div>

              <div className="my-2 border-t border-black/15" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-black/55">
                  Bloqueo
                </div>
                {bloqueoTipo === "patron" ? (
                  <div className="mt-2 flex items-center gap-2">
                    <PatternPreview value={bloqueoValor} size={82} theme="light" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold">Patron</div>
                      <div className="mt-0.5 break-words text-[11px] text-black/65">
                        {patronArrows || "-"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-[12px] font-semibold">
                    {bloqueoTexto || "Sin contrasena"}
                  </div>
                )}
              </div>

              <div className="my-2 border-t border-black/15" />

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-black/55">
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
                  {fallaObs || "-"}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-black/55">
        {label}
      </div>
      <div className="break-all text-right text-[12px] font-semibold">{value}</div>
    </div>
  );
}
