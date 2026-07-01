"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientsTable from "@/components/ClientsTable";
import CreateClientModal from "@/components/CreateClientModal";
import { searchClientesClient } from "@/lib/api/clients.client";
import type { Cliente } from "@/types/orders";

function isDigitsOnly(s: string) {
  const t = s.trim();
  return t.length > 0 && /^[0-9]+$/.test(t);
}

export default function ClientsClient({
  apiBaseUrl,
  initialData,
  initialSearch,
  initialPage,
  initialOrdering,
}: {
  apiBaseUrl: string;
  initialData: { count: number; results: Cliente[] };
  initialSearch: string;
  initialPage: number;
  initialOrdering: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [ordering, setOrdering] = useState(initialOrdering || "apellido");

  const [searchInput, setSearchInput] = useState(initialSearch || "");
  const [searchValue, setSearchValue] = useState(initialSearch || "");

  const searchValueRef = useRef(searchValue);
  useEffect(() => {
    searchValueRef.current = searchValue;
  }, [searchValue]);

  const skipNextDebounceRef = useRef(false);
  const firstRenderRef = useRef(true);

  const [openCreate, setOpenCreate] = useState(false);

  // Autocomplete
  const [openSug, setOpenSug] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Cliente[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOrdering(initialOrdering || "apellido");

    const v = initialSearch || "";
    setSearchValue(v);

    if (v && v === searchValueRef.current) return;
    setSearchInput(v);
  }, [initialSearch, initialOrdering]);

  const totalPages = useMemo(() => {
    const pageSize = 7;
    return Math.max(1, Math.ceil((initialData?.count || 0) / pageSize));
  }, [initialData?.count]);

  const replaceParams = useCallback((
    next: Record<string, string | number | null | undefined>,
  ) => {
    const nextParams = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") nextParams.delete(k);
      else nextParams.set(k, String(v));
    });
    router.replace(`/clients?${nextParams.toString()}`);
  }, [router, sp]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
        return;
      }

      if (skipNextDebounceRef.current) {
        skipNextDebounceRef.current = false;
        return;
      }

      replaceParams({
        search: searchValue.trim() || null,
        page: 1,
        ordering,
      });
    }, 300);

    return () => clearTimeout(t);
  }, [searchValue, ordering, replaceParams]);

  // Autocomplete
  useEffect(() => {
    const q = searchInput.trim();
    setHighlight(-1);

    if (!q) {
      setSuggestions([]);
      setOpenSug(false);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSugLoading(true);
        const items = await searchClientesClient({
          apiBaseUrl,
          q,
          pageSize: 7,
        });
        setSuggestions(items);
        setOpenSug(true);
      } catch {
        setSuggestions([]);
        setOpenSug(false);
      } finally {
        setSugLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [searchInput, apiBaseUrl]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpenSug(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function labelCliente(c: Cliente) {
    const nombre = `${c.nombre || ""} ${c.apellido || ""}`.trim() || "—";
    const extra = [c.dni ? `DNI ${c.dni}` : null, c.celular]
      .filter(Boolean)
      .join(" • ");
    return { nombre, extra };
  }

  function pickSuggestion(c: Cliente) {
    const nombreApellido =
      `${c.nombre || ""} ${c.apellido || ""}`.trim() || "—";

    const safeValue = (
      c.dni?.toString().trim() ||
      c.celular?.toString().trim() ||
      nombreApellido
    ).trim();

    const nextDisplay = isDigitsOnly(searchInput)
      ? safeValue
      : nombreApellido;

    setSearchInput(nextDisplay);
    setSearchValue(safeValue);
    setOpenSug(false);

    skipNextDebounceRef.current = true;
    replaceParams({ search: safeValue, page: 1, ordering });

    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!openSug || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(-1, h - 1));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && suggestions[highlight]) {
        e.preventDefault();
        pickSuggestion(suggestions[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpenSug(false);
    }
  }

  function toggleOrdering(field: string) {
    const next =
      ordering === field
        ? `-${field}`
        : ordering === `-${field}`
        ? field
        : field;

    setOrdering(next);
    skipNextDebounceRef.current = true;
    replaceParams({ ordering: next, page: 1 });
  }

  return (
    <div className="p-3 sm:p-4 md:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-white">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Autocompletado + filtro en vivo.
          </p>
        </div>

        <button
          onClick={() => setOpenCreate(true)}
          className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="mb-4" ref={wrapRef}>
        <div className="relative">
          <input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => {
              const v = e.target.value;
              setSearchInput(v);
              setSearchValue(v);
              setOpenSug(true);
            }}
            onFocus={() => suggestions.length && setOpenSug(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar por nombre, DNI o celular..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/85 outline-none focus:border-white/20"
          />

          {sugLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">
              Buscando…
            </div>
          )}

          {openSug && (suggestions.length > 0 || sugLoading) && (
            <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/15 bg-[#101827] shadow-xl">
              <div className="max-h-64 overflow-y-auto p-1">
                {suggestions.map((c, idx) => {
                  const { nombre, extra } = labelCliente(c);
                  const active = idx === highlight;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setHighlight(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickSuggestion(c);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left ${
                        active ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="text-sm text-white/85">{nombre}</div>
                      {extra && (
                        <div className="text-xs text-white/50">{extra}</div>
                      )}
                    </button>
                  );
                })}

                <div className="px-3 py-2 text-xs text-white/40">
                  Tip: Enter selecciona
                </div>
              </div>
            </div>
          )}
        </div>

        {searchInput && (
          <div className="mt-2">
            <button
              onClick={() => {
                setSearchInput("");
                setSearchValue("");
                setSuggestions([]);
                setOpenSug(false);

                skipNextDebounceRef.current = true;
                replaceParams({ search: null, page: 1, ordering });

                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <ClientsTable
          apiBaseUrl={apiBaseUrl}
          rows={initialData?.results || []
}
          count={initialData?.count || 0}
          page={initialPage}
          totalPages={totalPages}
          ordering={ordering}
          onToggleOrdering={toggleOrdering}
          onPageChange={(p: number) =>
            replaceParams({ page: p, ordering })
          }
          onRefresh={() => router.refresh()}
        />
      </div>

      {/* Modal */}
      {openCreate && (
        <CreateClientModal
          apiBaseUrl={apiBaseUrl}
          onClose={() => setOpenCreate(false)}
          onCreated={() => {
            setOpenCreate(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
