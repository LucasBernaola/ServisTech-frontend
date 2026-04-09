"use client";

import React from "react";
import { searchClientesClient, type Cliente } from "@/lib/api/clients.client";

function useDebounce<T>(v: T, ms = 250) {
  const [d, setD] = React.useState(v);
  React.useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function ClienteSearch({
  apiBaseUrl,
  value,
  onSelect,
  onClear,
}: {
  apiBaseUrl: string;
  value: Cliente | null;
  onSelect: (c: Cliente) => void;
  onClear: () => void;
}) {
  const [q, setQ] = React.useState("");
  const debounced = useDebounce(q, 250);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Cliente[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!debounced || debounced.trim().length < 2) {
      setItems([]);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await searchClientesClient({
          apiBaseUrl,
          q: debounced.trim(),
          pageSize: 7,
        });
        if (!cancelled) setItems(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error buscando clientes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [debounced, apiBaseUrl]);

  // ── Cliente ya seleccionado ──
  if (value) {
    const full = `${value.apellido} ${value.nombre}`.trim();
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white/85">
              {full || "Cliente"}
            </div>
            <div className="mt-0.5 truncate text-xs text-white/55">
              {value.dni ? `DNI: ${value.dni}` : null}
              {value.celular ? ` · ${value.celular}` : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15 active:bg-white/20 transition-colors"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  // ── Buscador ──
  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar por DNI, apellido, nombre o celular..."
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 sm:py-2 text-sm text-white/85 outline-none focus:border-white/20 placeholder:text-white/35"
      />

      {open ? (
        <div
          className="
            absolute z-20 mt-2 w-full overflow-hidden
            rounded-2xl border border-white/10
            bg-[#0f172a]
            shadow-[0_20px_80px_rgba(0,0,0,0.55)]
          "
        >
          {/* Lista: más alta en mobile para aprovechar el espacio táctil */}
          <div className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain">
            {q.trim().length < 2 ? (
              <div className="px-3 py-3 text-xs text-white/50">
                Escribí al menos 2 caracteres…
              </div>
            ) : loading ? (
              <div className="px-3 py-3 text-xs text-white/50">
                Buscando…
              </div>
            ) : error ? (
              <div className="px-3 py-3 text-xs text-rose-200/90">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-white/50">
                Sin resultados
              </div>
            ) : (
              items.map((c) => {
                const full = `${c.apellido} ${c.nombre}`.trim();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                      setQ("");
                    }}
                    // py-3 en mobile para área táctil más generosa
                    className="w-full text-left px-3 py-3 sm:py-2 hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <div className="text-sm text-white/85">
                      {full || `Cliente #${c.id}`}
                    </div>
                    <div className="text-xs text-white/50">
                      {c.dni ? `DNI: ${c.dni}` : "Sin DNI"}
                      {c.celular ? ` · ${c.celular}` : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer del dropdown */}
          <div className="border-t border-white/10 px-3 py-2.5 sm:py-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-white/45 hidden sm:block">
              Tip: DNI suele ser más preciso
            </div>
            {/* En mobile el tip ocupa todo el ancho disponible */}
            <div className="text-[11px] text-white/45 sm:hidden">
              DNI suele ser más preciso
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-shrink-0 text-[11px] text-white/60 hover:text-white active:text-white/40 transition-colors py-1 px-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}