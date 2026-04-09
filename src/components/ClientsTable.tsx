"use client";

import { useState } from "react";
import EditClientModal from "./EditClientModal";

type Props = {
  apiBaseUrl: string;
  rows: any[];
  count: number;
  page: number;
  totalPages: number;
  ordering: string;
  onToggleOrdering: (field: string) => void;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
};

function sortArrow(ordering: string, field: string) {
  if (ordering === field) return "▲";
  if (ordering === `-${field}`) return "▼";
  return "";
}

function SortButton({
  field,
  ordering,
  onToggle,
  children,
}: {
  field: string;
  ordering: string;
  onToggle: (f: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition"
    >
      {children}
      <span className="text-xs text-white/40">{sortArrow(ordering, field)}</span>
    </button>
  );
}

export default function ClientsTable({
  apiBaseUrl,
  rows,
  count,
  page,
  totalPages,
  ordering,
  onToggleOrdering,
  onPageChange,
  onRefresh,
}: Props) {
  const [edit, setEdit] = useState<any | null>(null);

  return (
    <div>
      {/* ══════════════════════════════════════
          MOBILE: lista de cards (< sm)
          ══════════════════════════════════════ */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/60">
            No hay clientes para mostrar.
          </div>
        ) : (
          rows.map((c) => {
            const apellido = (c.apellido || "").trim();
            const nombre = (c.nombre || "").trim();
            const nombreCompleto =
              apellido || nombre
                ? `${apellido || "—"}${nombre ? `, ${nombre}` : ""}`
                : "—";

            return (
              <div
                key={c.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                {/* Fila superior: nombre + botón */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white/90">
                      {nombreCompleto}
                    </div>
                    {c.email ? (
                      <div className="truncate text-xs text-white/50">
                        {c.email}
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={() => setEdit(c)}
                    className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors"
                  >
                    Editar
                  </button>
                </div>

                {/* Fila inferior: metadatos */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                  <span>
                    <span className="text-white/35">ID </span>#{c.id}
                  </span>
                  <span>
                    <span className="text-white/35">DNI </span>
                    {c.dni || "—"}
                  </span>
                  <span>
                    <span className="text-white/35">Tel </span>
                    {c.celular || "—"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ══════════════════════════════════════
          DESKTOP: tabla (sm+)
          ══════════════════════════════════════ */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-white/70">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">
                <SortButton field="id" ordering={ordering} onToggle={onToggleOrdering}>
                  ID
                </SortButton>
              </th>
              <th className="px-4 py-3 font-medium">
                <SortButton field="apellido" ordering={ordering} onToggle={onToggleOrdering}>
                  Cliente
                </SortButton>
              </th>
              <th className="px-4 py-3 font-medium">
                <SortButton field="dni" ordering={ordering} onToggle={onToggleOrdering}>
                  DNI
                </SortButton>
              </th>
              <th className="px-4 py-3 font-medium">
                <SortButton field="celular" ordering={ordering} onToggle={onToggleOrdering}>
                  Celular
                </SortButton>
              </th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.08]">
            {rows.map((c) => {
              const apellido = (c.apellido || "").trim();
              const nombre = (c.nombre || "").trim();
              return (
                <tr key={c.id} className="hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3 text-white/85">#{c.id}</td>

                  <td className="px-4 py-3">
                    <div className="text-white/85">
                      {apellido || nombre ? (
                        <>
                          <span className="font-medium">{apellido || "—"}</span>
                          {nombre ? `, ${nombre}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    {c.email ? (
                      <div className="text-xs text-white/50">{c.email}</div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 text-white/70">{c.dni || "—"}</td>
                  <td className="px-4 py-3 text-white/70">{c.celular || "—"}</td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEdit(c); }}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] transition"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-white/60" colSpan={5}>
                  No hay clientes para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* ── Paginación (compartida) ── */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-xs text-white/50">{count} clientes</div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] active:bg-white/10 transition disabled:opacity-50"
          >
            ←
          </button>

          <div className="text-xs text-white/70">
            <span className="text-white/85">{page}</span>
            <span className="text-white/40"> / {totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] active:bg-white/10 transition disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>

      {edit ? (
        <EditClientModal
          apiBaseUrl={apiBaseUrl}
          client={edit}
          onClose={() => setEdit(null)}
          onUpdated={() => { setEdit(null); onRefresh(); }}
        />
      ) : null}
    </div>
  );
}