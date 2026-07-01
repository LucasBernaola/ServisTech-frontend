import { parseArsToNumberOrNull } from "@/lib/orders/money";
import type { OrdenEstado } from "@/types/orders";

export type WarrantyDiscountType = "monto" | "porcentaje";

type ValidationResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; msg: string };

type ValidateOrderStatusPayloadInput = {
  estado: OrdenEstado;
  presupuesto: string;
  senia: string;
  costoFinal: string;
  garantiaDescuento: string;
  garantiaTipo: WarrantyDiscountType;
  garantiaPorcentaje: string;
  garantiaDias: string;
  obsFinales: string;
  retiradoPorNombre: string;
  retiradoPorDni: string;
  observacionesRetiro: string;
};

export function calculateWarrantyDiscount(input: {
  costoFinal: string;
  garantiaTipo: WarrantyDiscountType;
  garantiaDescuento: string;
  garantiaPorcentaje: string;
}) {
  const costo = parseArsToNumberOrNull(input.costoFinal);
  if (costo === null) return null;

  if (input.garantiaTipo === "porcentaje") {
    const porcentaje = parseArsToNumberOrNull(input.garantiaPorcentaje) ?? 0;
    const descuento = (costo * porcentaje) / 100;
    return Math.max(0, Math.min(costo, descuento));
  }

  const descuento = parseArsToNumberOrNull(input.garantiaDescuento) ?? 0;
  return Math.max(0, Math.min(costo, descuento));
}

export function validateOrderStatusPayload(
  input: ValidateOrderStatusPayloadInput,
): ValidationResult {
  if (input.estado === "diagnosticado") {
    const presupuesto = parseArsToNumberOrNull(input.presupuesto);
    if (presupuesto === null || presupuesto <= 0) {
      return {
        ok: false,
        msg: "Para 'diagnosticado' se requiere presupuesto.",
      };
    }

    const senia = parseArsToNumberOrNull(input.senia);
    if (senia !== null && senia < 0) {
      return { ok: false, msg: "La sena no puede ser negativa." };
    }
    if (senia !== null && senia > presupuesto) {
      return { ok: false, msg: "La sena no puede ser mayor al presupuesto." };
    }

    return { ok: true, payload: { presupuesto, senia } };
  }

  if (input.estado === "finalizado") {
    const costoFinal = parseArsToNumberOrNull(input.costoFinal);
    if (costoFinal === null) {
      return { ok: false, msg: "Para 'finalizado' se requiere Costo final." };
    }
    if (costoFinal < 0) {
      return { ok: false, msg: "El Costo final no puede ser negativo." };
    }

    const garantiaDescuento = calculateWarrantyDiscount(input) ?? 0;
    if (garantiaDescuento < 0) {
      return {
        ok: false,
        msg: "El Descuento garantia no puede ser negativo.",
      };
    }
    if (garantiaDescuento > costoFinal) {
      return {
        ok: false,
        msg: "El Descuento garantia no puede ser mayor que el Costo final.",
      };
    }

    const garantiaDias = Number(String(input.garantiaDias ?? "0").trim());
    if (!Number.isFinite(garantiaDias) || garantiaDias < 0) {
      return {
        ok: false,
        msg: "Los dias de garantia no pueden ser negativos.",
      };
    }

    return {
      ok: true,
      payload: {
        costo_final: costoFinal,
        garantia_descuento: garantiaDescuento,
        garantia_dias: Math.floor(garantiaDias),
        observaciones_finales: input.obsFinales || "",
      },
    };
  }

  if (input.estado === "retirado") {
    const nombre = input.retiradoPorNombre.trim();
    const dni = input.retiradoPorDni.trim();
    const observaciones = input.observacionesRetiro.trim();

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
        observaciones_retiro: observaciones,
      },
    };
  }

  return { ok: true, payload: {} };
}

