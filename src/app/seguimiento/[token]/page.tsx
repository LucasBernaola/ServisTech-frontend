import React from "react";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api/serverFetch";

type PublicOrden = {
  orden_id: number;
  estado:
    | "pendiente"
    | "diagnosticado"
    | "en_progreso"
    | "reparado"
    | "finalizado"
    | "retirado";
  cliente: { nombre: string; apellido: string; celular?: string };
  equipo: { dispositivo_tipo: string; marca: string; modelo: string };
  falla_reportada?: string;
  updated_at: string;
  retirado_por_nombre?: string;
  retirado_por_dni?: string;
  observaciones_retiro?: string;
  fecha_retirado?: string | null;
};

const ESTADOS: { value: PublicOrden["estado"]; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "reparado", label: "Reparado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "retirado", label: "Retirado" },
];

function estadoLabel(estado: PublicOrden["estado"]) {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

function estadoIndex(estado: PublicOrden["estado"]) {
  const idx = ESTADOS.findIndex((s) => s.value === estado);
  return idx >= 0 ? idx : 0;
}

function estadoPillClasses(estado: PublicOrden["estado"]) {
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
      return "border-cyan-500/25 bg-cyan-500/10 text-cyan-100";
    case "retirado":
      return "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-100";
    default:
      return "border-white/10 bg-white/5 text-white/80";
  }
}

function formatDateTime(iso?: string | null) {
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

async function fetchOrden(token: string): Promise<PublicOrden> {
  const res = await serverFetch(`/api/public/orden/${token}/`);

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Error ${res.status}`);

  return res.json();
}

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchOrden(token);
  const idx = estadoIndex(data.estado);

  const nombreCliente = `${(data.cliente?.nombre || "").trim()} ${(data.cliente?.apellido || "").trim()}`.trim();
  const celular = (data.cliente?.celular || "").trim();
  const falla = (data.falla_reportada || "").trim();

  const retiradoPorNombre = (data.retirado_por_nombre || "").trim();
  const retiradoPorDni = (data.retirado_por_dni || "").trim();
  const observacionesRetiro = (data.observaciones_retiro || "").trim();
  const fechaRetirado = data.fecha_retirado || null;

  return (
    <div className="min-h-screen necotec-bg text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:py-8">
        <div className="panel overflow-hidden p-4 sm:p-5">

          {/* ── Header ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs sm:text-sm text-white/60">
                Seguimiento de reparación
              </div>
              <h1 className="mt-0.5 text-lg sm:text-xl font-semibold">
                Orden #{data.orden_id}
              </h1>
              <div className="mt-2">
                <span
                  className={[
                    "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    estadoPillClasses(data.estado),
                  ].join(" ")}
                >
                  {estadoLabel(data.estado)}
                </span>
              </div>
            </div>

            <div className="text-xs text-white/60 sm:text-right">
              Última actualización
              <div className="mt-0.5 text-sm text-white/85">
                {formatDateTime(data.updated_at)}
              </div>
            </div>
          </div>

          {/* ── Campos ── */}
          <div className="mt-4 sm:mt-5 grid gap-2.5 sm:gap-3">

            <div className="rounded-lg border border-white/10 bg-black/25 p-3 sm:p-4">
              <div className="text-xs text-white/60">Cliente</div>
              <div className="mt-1 text-sm text-white/90">
                {nombreCliente || "—"}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-3 sm:p-4">
              <div className="text-xs text-white/60">Teléfono</div>
              <div className="mt-1 text-sm text-white/90">{celular || "—"}</div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-3 sm:p-4">
              <div className="text-xs text-white/60">Equipo</div>
              <div className="mt-1 text-sm text-white/90">
                {data.equipo?.dispositivo_tipo || "Equipo"}:{" "}
                {data.equipo?.marca || "—"} {data.equipo?.modelo || ""}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/25 p-3 sm:p-4">
              <div className="text-xs text-white/60">Falla reportada</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-white/90">
                {falla || "—"}
              </div>
            </div>

            {/* ── Bloque retiro ── */}
            {data.estado === "retirado" ? (
              <div className="rounded-lg border border-amber-300/25 bg-amber-300/8 p-3 sm:p-4">
                <div className="text-xs text-white/60">Retiro del equipo</div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-white/50">Retirado por</div>
                    <div className="mt-1 text-sm text-white/90">
                      {retiradoPorNombre || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-white/50">Fecha de retiro</div>
                    <div className="mt-1 text-sm text-white/90">
                      {formatDateTime(fechaRetirado)}
                    </div>
                  </div>

                  {retiradoPorDni ? (
                    <div>
                      <div className="text-xs text-white/50">DNI</div>
                      <div className="mt-1 text-sm text-white/90">
                        {retiradoPorDni}
                      </div>
                    </div>
                  ) : null}

                  {observacionesRetiro ? (
                    <div className="sm:col-span-2">
                      <div className="text-xs text-white/50">Observaciones</div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-white/90">
                        {observacionesRetiro}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* ── Progreso ── */}
            <div className="rounded-lg border border-white/10 bg-black/25 p-3 sm:p-4">
              <div className="text-xs text-white/60">Progreso</div>


              {/* Horizontal (sm+) */}
              <div className="mt-3 hidden sm:flex items-center gap-2 flex-wrap">
                {ESTADOS.map((s, i) => {
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <React.Fragment key={s.value}>
                      <div
                        className={[
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                          done
                            ? "bg-amber-300 text-black"
                            : active
                              ? "border border-amber-300 bg-black/20 text-amber-100"
                              : "bg-black/30 text-white/60",
                        ].join(" ")}
                        title={s.label}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      {i < ESTADOS.length - 1 ? (
                        <div
                          className={[
                            "h-[2px] w-8 rounded",
                            done ? "bg-amber-300" : "bg-white/10",
                          ].join(" ")}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Vertical (mobile) */}
              <div className="mt-3 flex flex-col gap-2 sm:hidden">
                {ESTADOS.map((s, i) => {
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <div key={s.value} className="flex items-center gap-3">
                      {/* Círculo */}
                      <div
                        className={[
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          done
                            ? "bg-amber-300 text-black"
                            : active
                              ? "border border-amber-300 bg-black/20 text-amber-100"
                              : "bg-black/30 text-white/60",
                        ].join(" ")}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      {/* Label */}
                      <span
                        className={[
                          "text-sm",
                          active
                            ? "font-semibold text-white"
                            : done
                              ? "text-white/70"
                              : "text-white/40",
                        ].join(" ")}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-white/70">
                Estado actual:{" "}
                <b className="text-white/90">{estadoLabel(data.estado)}</b>
              </div>
            </div>

            <div className="text-xs text-white/40 leading-relaxed">
              ServisTech · Este seguimiento se actualiza automáticamente cuando el
              taller cambia el estado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
