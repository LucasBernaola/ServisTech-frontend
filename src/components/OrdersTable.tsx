"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { Orden, OrdenEstado } from "@/types/orders";
import { ViewOrderModal } from "./orders/ViewOrderModal";

const ESTADOS: { value: OrdenEstado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "reparado", label: "Reparado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "retirado", label: "Retirado" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

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

function formatArsInput(n: number) {
  const isInt = Math.abs(n % 1) < 1e-9;
  if (isInt) return n.toLocaleString("es-AR", { maximumFractionDigits: 0 });
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function moneyFmt(n: number) {
  return formatArsDisplay(n);
}

function estadoIndex(estado: OrdenEstado) {
  const idx = ESTADOS.findIndex((s) => s.value === estado);
  return idx >= 0 ? idx : 0;
}

function estadoPillClasses(estado: OrdenEstado) {
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

async function patchOrdenEstado(opts: {
  apiBaseUrl?: string;
  id: number;
  estado: OrdenEstado;
  payload?: Record<string, any>;
}) {
  if (!opts.apiBaseUrl)
    throw new Error("Falta apiBaseUrl para actualizar el estado.");

  const r = await fetch(`${opts.apiBaseUrl}/api/ordenes/${opts.id}/estado/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: opts.estado, ...(opts.payload || {}) }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  return r.json();
}

function EstadoPillButton({
  value,
  label,
  disabled,
  onOpenWizard,
}: {
  value: OrdenEstado;
  label: string;
  disabled?: boolean;
  onOpenWizard: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onOpenWizard();
      }}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition",
        "focus:outline-none focus:ring-2 focus:ring-white/10",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        estadoPillClasses(value),
      ].join(" ")}
      title="Cambiar estado"
    >
      <span className="whitespace-nowrap">{label}</span>
      <svg
        className="h-3 w-3 opacity-80"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

function Stepper({
  currentIndex,
  activeIndex,
}: {
  currentIndex: number;
  activeIndex: number;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
      {ESTADOS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === activeIndex;

        return (
          <React.Fragment key={s.value}>
            <div
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full text-xs flex-shrink-0",
                done
                  ? "bg-yellow-400 text-black"
                  : active
                    ? "border border-yellow-400 bg-black/20 text-yellow-200"
                    : "bg-black/30 text-white/60",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </div>

            {i < ESTADOS.length - 1 ? (
              <div
                className={[
                  "h-[2px] w-6 sm:w-8 rounded flex-shrink-0",
                  done ? "bg-yellow-400" : "bg-white/10",
                ].join(" ")}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1 text-xs text-white/60">{label}</div>
      {children}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        const n = parseArsToNumberOrNull(value);
        if (n != null) onChange(formatArsInput(n));
      }}
      placeholder={placeholder}
      inputMode="decimal"
      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
    />
  );
}

function OrderStatusWizardModal({
  open,
  onClose,
  orden,
  apiBaseUrl,
  busy,
  onApplied,
}: {
  open: boolean;
  onClose: () => void;
  orden: Orden;
  apiBaseUrl?: string;
  busy?: boolean;
  onApplied: () => void;
}) {
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [step, setStep] = React.useState<number>(0);

  const [rollbackMode, setRollbackMode] = React.useState(false);
  const [confirmRollback, setConfirmRollback] = React.useState(false);

  const [presupuesto, setPresupuesto] = React.useState<string>("");
  const [senia, setSenia] = React.useState<string>("");
  const [costoFinal, setCostoFinal] = React.useState<string>("");

  const [garantiaDescuento, setGarantiaDescuento] = React.useState<string>("0");
  const [garantiaTipo, setGarantiaTipo] = React.useState<
    "monto" | "porcentaje"
  >("monto");
  const [garantiaPorcentaje, setGarantiaPorcentaje] =
    React.useState<string>("0");

  const [garantiaDias, setGarantiaDias] = React.useState<string>("0");
  const [obsFinales, setObsFinales] = React.useState<string>("");

  const [retiradoPorNombre, setRetiradoPorNombre] = React.useState<string>("");
  const [retiradoPorDni, setRetiradoPorDni] = React.useState<string>("");
  const [observacionesRetiro, setObservacionesRetiro] =
    React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;

    setError(null);
    setRollbackMode(false);
    setConfirmRollback(false);

    const idx = estadoIndex(orden.estado);
    setCurrentIndex(idx);
    setStep(idx);

    const p0 = coerceMoneyToNumber((orden as any).presupuesto);
    const s0 = coerceMoneyToNumber((orden as any).senia);
    const c0 = coerceMoneyToNumber((orden as any).costo_final);
    const gd0 = coerceMoneyToNumber((orden as any).garantia_descuento);

    setPresupuesto(p0 != null ? formatArsInput(p0) : "");
    setSenia(s0 != null ? formatArsInput(s0) : "");
    setCostoFinal(c0 != null ? formatArsInput(c0) : "");

    setGarantiaDescuento(gd0 != null ? formatArsInput(gd0) : "0");
    setGarantiaDias(String((orden as any).garantia_dias ?? 0));
    setObsFinales(String((orden as any).observaciones_finales ?? ""));

    setRetiradoPorNombre(String((orden as any).retirado_por_nombre ?? ""));
    setRetiradoPorDni(String((orden as any).retirado_por_dni ?? ""));
    setObservacionesRetiro(String((orden as any).observaciones_retiro ?? ""));

    setGarantiaTipo("monto");
    setGarantiaPorcentaje("0");
  }, [open, orden]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeEstado = ESTADOS[step]?.value ?? "pendiente";
  const activeLabel = ESTADOS[step]?.label ?? "Pendiente";

  const canBack = step > 0;
  const canContinue = step < ESTADOS.length - 1;

  const isNextStepToApply = !rollbackMode && step === currentIndex + 1;
  const rollbackTargetIndex = Math.max(0, currentIndex - 1);

  const restante = (() => {
    const p = parseArsToNumberOrNull(presupuesto) ?? 0;
    const s = parseArsToNumberOrNull(senia) ?? 0;
    return Math.max(0, p - s);
  })();

  const garantiaDescuentoReal = (() => {
    const c = parseArsToNumberOrNull(costoFinal);
    if (c === null) return null;

    if (garantiaTipo === "porcentaje") {
      const pct = parseArsToNumberOrNull(garantiaPorcentaje) ?? 0;
      const raw = (c * pct) / 100;
      return Math.max(0, Math.min(c, raw));
    }

    const gd = parseArsToNumberOrNull(garantiaDescuento) ?? 0;
    return Math.max(0, Math.min(c, gd));
  })();

  const cobroFinalPreview = (() => {
    const c = parseArsToNumberOrNull(costoFinal);
    if (c === null) return null;

    const desc = garantiaDescuentoReal ?? 0;
    const s = parseArsToNumberOrNull(senia) ?? 0;

    return c - desc - s;
  })();

  const cobroLabel = (() => {
    if (cobroFinalPreview === null) return null;
    if (cobroFinalPreview > 0) return "A cobrar";
    if (cobroFinalPreview < 0) return "A devolver";
    return "Saldo 0";
  })();

  const cobroDisplay = (() => {
    if (cobroFinalPreview === null) return "—";
    if (cobroFinalPreview >= 0) return moneyFmt(cobroFinalPreview);
    return `-${moneyFmt(Math.abs(cobroFinalPreview))}`;
  })();

  const validatePayloadFor = (estado: OrdenEstado) => {
    setError(null);

    if (estado === "diagnosticado") {
      const p = parseArsToNumberOrNull(presupuesto);
      if (p === null || p <= 0) {
        return {
          ok: false,
          msg: "Para 'diagnosticado' se requiere presupuesto.",
        };
      }

      const s = parseArsToNumberOrNull(senia);
      if (s !== null && s < 0)
        return { ok: false, msg: "La seña no puede ser negativa." };
      if (s !== null && s > p)
        return { ok: false, msg: "La seña no puede ser mayor al presupuesto." };

      return { ok: true, payload: { presupuesto: p, senia: s } };
    }

    if (estado === "finalizado") {
      const c = parseArsToNumberOrNull(costoFinal);
      if (c === null)
        return { ok: false, msg: "Para 'finalizado' se requiere Costo final." };
      if (c < 0)
        return { ok: false, msg: "El Costo final no puede ser negativo." };

      const desc = garantiaDescuentoReal ?? 0;
      if (desc < 0)
        return {
          ok: false,
          msg: "El Descuento garantía no puede ser negativo.",
        };
      if (desc > c)
        return {
          ok: false,
          msg: "El Descuento garantía no puede ser mayor que el Costo final.",
        };

      const dias = Number(String(garantiaDias ?? "0").trim());
      if (!Number.isFinite(dias) || dias < 0) {
        return {
          ok: false,
          msg: "Los días de garantía no pueden ser negativos.",
        };
      }

      return {
        ok: true,
        payload: {
          costo_final: c,
          garantia_descuento: desc,
          garantia_dias: Math.floor(dias),
          observaciones_finales: obsFinales || "",
        },
      };
    }

    if (estado === "retirado") {
      const nombre = retiradoPorNombre.trim();
      const dni = retiradoPorDni.trim();
      const obs = observacionesRetiro.trim();

      if (!nombre) {
        return {
          ok: false,
          msg: "Para 'retirado' se requiere el nombre de quien retira.",
        };
      }

      return {
        ok: true,
        payload: {
          retirado_por_nombre: nombre,
          retirado_por_dni: dni,
          observaciones_retiro: obs,
        },
      };
    }

    return { ok: true, payload: {} };
  };

  const applyStep = async () => {
    if (!apiBaseUrl) {
      setError(
        "Falta apiBaseUrl: no se puede actualizar el estado desde esta vista.",
      );
      return;
    }

    if (!rollbackMode) {
      if (step !== currentIndex + 1) {
        setError("Solo podés confirmar el siguiente estado en el flujo.");
        return;
      }

      const v = validatePayloadFor(activeEstado);
      if (!v.ok) {
        setError(v.msg || "Validación inválida.");
        return;
      }

      try {
        setError(null);
        await patchOrdenEstado({
          apiBaseUrl,
          id: orden.id,
          estado: activeEstado,
          payload: v.payload,
        });
        setCurrentIndex(step);
        router.refresh();
        onApplied();
      } catch (e: any) {
        setError(e?.message || "No se pudo actualizar el estado.");
      }
      return;
    }

    if (step !== rollbackTargetIndex) {
      setError("Solo podés revertir al estado inmediatamente anterior.");
      return;
    }

    if (!confirmRollback) {
      setConfirmRollback(true);
      return;
    }

    try {
      setError(null);
      await patchOrdenEstado({
        apiBaseUrl,
        id: orden.id,
        estado: activeEstado,
      });
      setCurrentIndex(step);
      setRollbackMode(false);
      setConfirmRollback(false);
      router.refresh();
      onApplied();
    } catch (e: any) {
      setError(e?.message || "No se pudo revertir el estado.");
    }
  };

  const contentByState: Record<OrdenEstado, React.ReactNode> = {
    pendiente: (
      <div className="text-sm text-white/80">
        En este punto acabas de recibir un dispositivo.
      </div>
    ),

    diagnosticado: (
      <div className="space-y-3">
        <div className="text-sm text-white/80">
          En este punto ya se ha diagnosticado el problema del dispositivo.
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Presupuesto *">
            <MoneyInput
              value={presupuesto}
              onChange={setPresupuesto}
              placeholder="Ej: 80.000 o 10.100,50"
            />
          </Field>

          <Field label="Seña">
            <MoneyInput
              value={senia}
              onChange={setSenia}
              placeholder="Ej: 10.000 o 5.000,50"
            />
          </Field>

          <Field label="Restante">
            <div className="text-sm text-white/85">{moneyFmt(restante)}</div>
          </Field>
        </div>
      </div>
    ),

    en_progreso: (
      <div className="text-sm text-white/80">
        En este punto el dispositivo está en proceso de reparación.
      </div>
    ),

    reparado: (
      <div className="text-sm text-white/80">
        En este punto el dispositivo ha sido reparado exitosamente.
      </div>
    ),

    finalizado: (
      <div className="space-y-3">
        <div className="text-sm text-white/80">
          En este punto la orden está lista para entregarse.
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-2xl font-semibold text-white/90">
            Finalizar orden #{orden.id}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Presupuesto">
              <div className="text-sm text-white/85">
                {moneyFmt(parseArsToNumberOrNull(presupuesto) ?? 0)}
              </div>
            </Field>

            <Field label="Seña">
              <div className="text-sm text-white/85">
                {moneyFmt(parseArsToNumberOrNull(senia) ?? 0)}
              </div>
            </Field>

            <Field label="Restante (Presupuesto - Seña)">
              <div className="text-sm text-white/85">{moneyFmt(restante)}</div>
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Descuento garantía">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={garantiaTipo}
                  onChange={(e) => setGarantiaTipo(e.target.value as any)}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                  style={{ colorScheme: "dark" as any }}
                >
                  <option className="bg-[#0f172a] text-white" value="monto">
                    $ Monto
                  </option>
                  <option
                    className="bg-[#0f172a] text-white"
                    value="porcentaje"
                  >
                    % Porcentaje
                  </option>
                </select>

                {garantiaTipo === "monto" ? (
                  <MoneyInput
                    value={garantiaDescuento}
                    onChange={setGarantiaDescuento}
                    placeholder="0"
                  />
                ) : (
                  <input
                    type="text"
                    value={garantiaPorcentaje}
                    onChange={(e) => setGarantiaPorcentaje(e.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
                  />
                )}
              </div>

              <div className="mt-1 text-xs text-white/40">
                Descuento aplicado: {moneyFmt(garantiaDescuentoReal ?? 0)}
              </div>
            </Field>

            <Field label="Días de garantía">
              <input
                type="text"
                value={garantiaDias}
                onChange={(e) => setGarantiaDias(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
              />
            </Field>

            <Field label="Costo final *">
              <MoneyInput
                value={costoFinal}
                onChange={setCostoFinal}
                placeholder="Ej: 35.000 o 35.000,50"
              />
            </Field>

            <div className="md:col-span-2">
              <div
                className={[
                  "rounded-2xl border p-4",
                  "bg-black/25",
                  cobroFinalPreview !== null && cobroFinalPreview < 0
                    ? "border-amber-500/30"
                    : "border-white/10",
                ].join(" ")}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-white/60">Cobro final</div>
                    <div className="mt-1 text-2xl md:text-3xl font-semibold text-white">
                      {cobroDisplay}
                    </div>

                    <div className="mt-1 text-sm text-white/70">
                      {cobroLabel ? (
                        <span
                          className={[
                            "inline-flex rounded-full border px-2 py-0.5 text-xs",
                            cobroFinalPreview !== null && cobroFinalPreview < 0
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
                          ].join(" ")}
                        >
                          {cobroLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right text-xs text-white/55 leading-5 sm:text-left">
                    <div>
                      Costo final:{" "}
                      <span className="text-white/80">
                        {moneyFmt(parseArsToNumberOrNull(costoFinal) ?? 0)}
                      </span>
                    </div>
                    <div>
                      Descuento garantía:{" "}
                      <span className="text-white/80">
                        {moneyFmt(garantiaDescuentoReal ?? 0)}
                      </span>
                    </div>
                    <div>
                      Seña:{" "}
                      <span className="text-white/80">
                        {moneyFmt(parseArsToNumberOrNull(senia) ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                  <b className="text-white/75">Cobro final</b> ={" "}
                  <b className="text-white/75">Costo final</b> −{" "}
                  <b className="text-white/75">Descuento garantía</b> −{" "}
                  <b className="text-white/75">Seña</b>
                </div>

                {cobroFinalPreview !== null && cobroFinalPreview < 0 ? (
                  <div className="mt-2 text-xs text-amber-200/90">
                    La seña supera el total final. Queda saldo a favor del
                    cliente.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Observaciones finales">
                <textarea
                  value={obsFinales}
                  onChange={(e) => setObsFinales(e.target.value)}
                  placeholder="Escribí observaciones..."
                  className="min-h-[90px] w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
    ),

    retirado: (
      <div className="space-y-3">
        <div className="text-sm text-white/80">
          Registrá quién retiró el equipo, cuándo se retiró y cualquier
          observación adicional.
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Nombre de quien retira *">
            <input
              type="text"
              value={retiradoPorNombre}
              onChange={(e) => setRetiradoPorNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
            />
          </Field>

          <Field label="DNI de quien retira">
            <input
              type="text"
              value={retiradoPorDni}
              onChange={(e) => setRetiradoPorDni(e.target.value)}
              placeholder="Ej: 30111222"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Observaciones de retiro">
              <textarea
                value={observacionesRetiro}
                onChange={(e) => setObservacionesRetiro(e.target.value)}
                placeholder="Ej: Retira familiar autorizado, se entrega con cargador, etc."
                className="min-h-[90px] w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/20"
              />
            </Field>
          </div>
        </div>
      </div>
    ),
  };

  const isLoading = !!busy;

  const primaryLabel = rollbackMode
    ? confirmRollback
      ? "Confirmar rollback"
      : "Revertir estado"
    : isNextStepToApply
      ? "Confirmar"
      : "Continue";

  const primaryDisabled =
    isLoading || (!rollbackMode && !isNextStepToApply && !canContinue);

  const primaryAction = rollbackMode
    ? applyStep
    : isNextStepToApply
      ? applyStep
      : () => {
          if (canContinue) setStep((s) => Math.min(ESTADOS.length - 1, s + 1));
        };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[94vh] sm:max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f16]/95 shadow-2xl backdrop-blur flex flex-col">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Stepper currentIndex={currentIndex} activeIndex={step} />
              <div className="text-sm text-white/60">
                Estado{" "}
                <span
                  className={[
                    "ml-2 inline-flex rounded-full border px-2 py-0.5 text-xs",
                    estadoPillClasses(activeEstado),
                  ].join(" ")}
                >
                  {activeLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8 whitespace-nowrap"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {rollbackMode && confirmRollback ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Vas a revertir el estado a <b>{activeLabel}</b>. ¿Confirmás?
            </div>
          ) : null}

          <div>{contentByState[activeEstado]}</div>
        </div>

        <div className="border-t border-white/10 p-4 sm:p-5 space-y-3">
          <button
            type="button"
            disabled={primaryDisabled}
            onClick={primaryAction}
            className={[
              "flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium transition",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              "bg-yellow-400 text-black hover:bg-yellow-300",
            ].join(" ")}
          >
            {isLoading ? "Guardando..." : `✓ ${primaryLabel}`}
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={isLoading || !canBack}
              onClick={() => {
                setError(null);
                setConfirmRollback(false);
                setStep((s) => Math.max(0, s - 1));
              }}
              className="cursor-pointer text-sm text-white/60 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
              {currentIndex > 0 ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setError(null);
                    setRollbackMode(true);
                    setConfirmRollback(false);
                    setStep(Math.max(0, currentIndex - 1));
                  }}
                  className="cursor-pointer text-sm text-white/60 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Volver al estado anterior"
                >
                  ↩ Revertir
                </button>
              ) : null}

              {rollbackMode ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setRollbackMode(false);
                    setConfirmRollback(false);
                    setError(null);
                    setStep(currentIndex);
                  }}
                  className="cursor-pointer text-sm text-white/60 transition hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancelar rollback
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersTable({
  rows,
  apiBaseUrl,
  onView,
}: {
  rows: Orden[];
  apiBaseUrl?: string;
  onView?: (ordenId: number) => void;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [wizardOrden, setWizardOrden] = React.useState<Orden | null>(null);

  const [openView, setOpenView] = React.useState(false);
  const [viewOrdenId, setViewOrdenId] = React.useState<number | null>(null);

  const onVer = (id: number) => {
    setViewOrdenId(id);
    setOpenView(true);
  };

  const openWizard = (orden: Orden) => {
    setWizardOrden(orden);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardOrden(null);
  };

  if (!rows?.length) {
    return (
      <div className="p-4 md:p-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/70">
          No hay órdenes para mostrar.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-5">
      {error ? (
        <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {!apiBaseUrl ? (
        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Nota: faltó <b>apiBaseUrl</b> en esta vista. Se deshabilita el cambio
          de estado y los links de impresión.
        </div>
      ) : null}

      {wizardOrden ? (
        <OrderStatusWizardModal
          open={wizardOpen}
          onClose={closeWizard}
          orden={wizardOrden}
          apiBaseUrl={apiBaseUrl}
          busy={false}
          onApplied={() => router.refresh()}
        />
      ) : null}

      <ViewOrderModal
        open={openView}
        onClose={() => setOpenView(false)}
        ordenId={viewOrdenId}
      />

      {/* Tabla Desktop + Cards Mobile */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        {/* Versión Desktop */}
        <table className="w-full text-sm hidden md:table">
          <thead className="bg-white/3 text-white/70">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Equipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/8">
            {rows.map((o) => {
              const cliente = o.cliente
                ? `${o.cliente.nombre} ${o.cliente.apellido}`.trim()
                : "—";
              const equipo = `${o.marca || "—"} ${o.modelo || ""}`.trim();
              const fecha =
                o.fecha_retirado ?? o.fecha_finalizado ?? o.created_at;

              return (
                <tr key={o.id} className="transition hover:bg-white/3">
                  <td className="px-4 py-3 text-white/85">#{o.id}</td>

                  <td className="px-4 py-3">
                    <div className="text-white/85">{cliente || "—"}</div>
                    {o.cliente?.dni ? (
                      <div className="text-xs text-white/50">
                        DNI: {o.cliente.dni}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-white/85">{equipo}</div>
                    {o.imei_serial ? (
                      <div className="text-xs text-white/50">
                        {o.imei_serial}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    <EstadoPillButton
                      value={o.estado}
                      label={o.estado_display}
                      disabled={!apiBaseUrl}
                      onOpenWizard={() => openWizard(o)}
                    />
                  </td>

                  <td className="px-4 py-3 text-white/70">
                    {formatDate(fecha)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onView) return onView(o.id);
                          onVer(o.id);
                        }}
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8"
                      >
                        Ver
                      </button>

                      {apiBaseUrl ? (
                        <>
                          <a
                            onClick={(e) => e.stopPropagation()}
                            href={`${apiBaseUrl}/api/ordenes/${o.id}/print/ficha-tecnica/`}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8"
                          >
                            Ficha
                          </a>

                          <a
                            onClick={(e) => e.stopPropagation()}
                            href={`/seguimiento/${o.public_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8"
                          >
                            Seguimiento
                          </a>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Versión Mobile (Cards) */}
        <div className="md:hidden space-y-3 p-2">
          {rows.map((o) => {
            const cliente = o.cliente
              ? `${o.cliente.nombre} ${o.cliente.apellido}`.trim()
              : "—";
            const equipo = `${o.marca || "—"} ${o.modelo || ""}`.trim();
            const fecha =
              o.fecha_retirado ?? o.fecha_finalizado ?? o.created_at;

            return (
              <div
                key={o.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      #{o.id}
                    </div>
                    <div className="text-white/70 text-sm">
                      {formatDate(fecha)}
                    </div>
                  </div>
                  <EstadoPillButton
                    value={o.estado}
                    label={o.estado_display}
                    disabled={!apiBaseUrl}
                    onOpenWizard={() => openWizard(o)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-white/85 font-medium">{cliente}</div>
                  {o.cliente?.dni && (
                    <div className="text-xs text-white/50">DNI: {o.cliente.dni}</div>
                  )}
                </div>

                <div>
                  <div className="text-white/85">{equipo}</div>
                  {o.imei_serial && (
                    <div className="text-xs text-white/50">{o.imei_serial}</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onView) return onView(o.id);
                      onVer(o.id);
                    }}
                    className="flex-1 cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/8"
                  >
                    Ver detalles
                  </button>

                  {apiBaseUrl && (
                    <>
                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={`${apiBaseUrl}/api/ordenes/${o.id}/print/ficha-tecnica/`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/8"
                      >
                        Ficha
                      </a>
                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={`/seguimiento/${o.public_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/8"
                      >
                        Seguimiento
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}