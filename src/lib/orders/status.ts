import type { OrdenEstado } from "@/types/orders";

export const ORDER_STATUSES: { value: OrdenEstado; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "diagnosticado", label: "Diagnosticado" },
  { value: "en_progreso", label: "En progreso" },
  { value: "reparado", label: "Reparado" },
  { value: "finalizado", label: "Finalizado" },
  { value: "retirado", label: "Retirado" },
];

export function getOrderStatusLabel(status: OrdenEstado) {
  return ORDER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function getOrderStatusIndex(status: OrdenEstado) {
  const index = ORDER_STATUSES.findIndex((item) => item.value === status);
  return index >= 0 ? index : 0;
}

export function getOrderStatusPillClasses(status: OrdenEstado) {
  switch (status) {
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

