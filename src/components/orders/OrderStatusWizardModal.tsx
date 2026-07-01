"use client";

import React from "react";
import type { CSSProperties } from "react";
import { patchOrdenEstadoClient } from "@/lib/api/orders.client";
import {
  coerceMoneyToNumber,
  formatArsDisplay,
  formatArsInput,
  parseArsToNumberOrNull,
} from "@/lib/orders/money";
import {
  getOrderStatusIndex,
  getOrderStatusPillClasses,
  ORDER_STATUSES,
} from "@/lib/orders/status";
import {
  calculateWarrantyDiscount,
  validateOrderStatusPayload,
  type WarrantyDiscountType,
} from "@/lib/orders/statusValidation";
import type { Orden, OrdenEstado } from "@/types/orders";

const darkSelectStyle: CSSProperties = { colorScheme: "dark" };

function moneyFmt(n: number) {
  return formatArsDisplay(n);
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
      {ORDER_STATUSES.map((s, i) => {
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

            {i < ORDER_STATUSES.length - 1 ? (
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

export function OrderStatusWizardModal({
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

  const [error, setError] = React.useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [step, setStep] = React.useState<number>(0);

  const [rollbackMode, setRollbackMode] = React.useState(false);
  const [confirmRollback, setConfirmRollback] = React.useState(false);

  const [presupuesto, setPresupuesto] = React.useState<string>("");
  const [senia, setSenia] = React.useState<string>("");
  const [costoFinal, setCostoFinal] = React.useState<string>("");

  const [garantiaDescuento, setGarantiaDescuento] = React.useState<string>("0");
  const [garantiaTipo, setGarantiaTipo] =
    React.useState<WarrantyDiscountType>("monto");
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

    const idx = getOrderStatusIndex(orden.estado);
    setCurrentIndex(idx);
    setStep(idx);

    const p0 = coerceMoneyToNumber(orden.presupuesto);
    const s0 = coerceMoneyToNumber(orden.senia);
    const c0 = coerceMoneyToNumber(orden.costo_final);
    const gd0 = coerceMoneyToNumber(orden.garantia_descuento);

    setPresupuesto(p0 != null ? formatArsInput(p0) : "");
    setSenia(s0 != null ? formatArsInput(s0) : "");
    setCostoFinal(c0 != null ? formatArsInput(c0) : "");

    setGarantiaDescuento(gd0 != null ? formatArsInput(gd0) : "0");
    setGarantiaDias(String(orden.garantia_dias ?? 0));
    setObsFinales(String(orden.observaciones_finales ?? ""));

    setRetiradoPorNombre(String(orden.retirado_por_nombre ?? ""));
    setRetiradoPorDni(String(orden.retirado_por_dni ?? ""));
    setObservacionesRetiro(String(orden.observaciones_retiro ?? ""));

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

  const activeEstado = ORDER_STATUSES[step]?.value ?? "pendiente";
  const activeLabel = ORDER_STATUSES[step]?.label ?? "Pendiente";

  const canBack = step > 0;
  const canContinue = step < ORDER_STATUSES.length - 1;

  const isNextStepToApply = !rollbackMode && step === currentIndex + 1;
  const rollbackTargetIndex = Math.max(0, currentIndex - 1);

  const restante = (() => {
    const p = parseArsToNumberOrNull(presupuesto) ?? 0;
    const s = parseArsToNumberOrNull(senia) ?? 0;
    return Math.max(0, p - s);
  })();

  const garantiaDescuentoReal = calculateWarrantyDiscount({
    costoFinal,
    garantiaTipo,
    garantiaDescuento,
    garantiaPorcentaje,
  });

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

    return validateOrderStatusPayload({
      estado,
      presupuesto,
      senia,
      costoFinal,
      garantiaDescuento,
      garantiaTipo,
      garantiaPorcentaje,
      garantiaDias,
      obsFinales,
      retiradoPorNombre,
      retiradoPorDni,
      observacionesRetiro,
    });
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
        await patchOrdenEstadoClient({
          apiBaseUrl,
          id: orden.id,
          estado: activeEstado,
          payload: v.payload,
        });
        setCurrentIndex(step);
        onApplied();
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "No se pudo actualizar el estado.",
        );
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
      await patchOrdenEstadoClient({
        apiBaseUrl,
        id: orden.id,
        estado: activeEstado,
      });
      setCurrentIndex(step);
      setRollbackMode(false);
      setConfirmRollback(false);
      onApplied();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo revertir el estado.");
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
                  onChange={(e) =>
                    setGarantiaTipo(e.target.value as WarrantyDiscountType)
                  }
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-white/20"
                  style={darkSelectStyle}
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
          if (canContinue)
            setStep((s) => Math.min(ORDER_STATUSES.length - 1, s + 1));
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
                    getOrderStatusPillClasses(activeEstado),
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
