"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { printFichaUrl, seguimientoPublicUrl } from "@/lib/api/orders.client";
import { getOrderStatusPillClasses } from "@/lib/orders/status";
import type { Orden, OrdenEstado } from "@/types/orders";
import { OrderStatusWizardModal } from "./orders/OrderStatusWizardModal";
import { ViewOrderModal } from "./orders/ViewOrderModal";

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
        getOrderStatusPillClasses(value),
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
      {!apiBaseUrl ? (
        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Nota: faltó <b>apiBaseUrl</b> en esta vista. Se deshabilita el cambio
          de estado.
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
        apiBaseUrl={apiBaseUrl || ""}
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

                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={printFichaUrl(o.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8"
                      >
                        Ficha
                      </a>

                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={seguimientoPublicUrl(o.public_token)}
                        target="_blank"
                        rel="noreferrer"
                        className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/8"
                      >
                        Seguimiento
                      </a>
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

                  <a
                    onClick={(e) => e.stopPropagation()}
                    href={printFichaUrl(o.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/8"
                  >
                    Ficha
                  </a>
                  <a
                    onClick={(e) => e.stopPropagation()}
                    href={seguimientoPublicUrl(o.public_token)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/8"
                  >
                    Seguimiento
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
