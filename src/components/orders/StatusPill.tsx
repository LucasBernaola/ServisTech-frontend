// components/orders/StatusPill.tsx
import React from "react";
import type { OrdenEstado } from "@/types/orders";

const stylesByEstado: Record<OrdenEstado, string> = {
  pendiente: "bg-sky-500/15 text-sky-200 border-sky-500/25",
  diagnosticado: "bg-indigo-500/15 text-indigo-200 border-indigo-500/25",
  en_progreso: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  reparado: "bg-purple-500/15 text-purple-200 border-purple-500/25",
  finalizado: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  retirado: "bg-gray-500/15 text-gray-200 border-gray-500/25",
};

export function StatusPill({
  estado,
  label,
}: {
  estado: OrdenEstado;
  label?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        stylesByEstado[estado] ?? "bg-white/5 text-white/70 border-white/10",
      ].join(" ")}
    >
      {label ?? estado}
    </span>
  );
}