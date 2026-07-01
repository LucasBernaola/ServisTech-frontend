"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const tabs = [
  { key: "todas", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "finalizado", label: "Finalizadas" },
];

export function OrdersClient({
  initialTab,
  initialSearch,
  page,
  count,
  pageSize,
}: {
  initialTab: string;
  initialSearch: string;
  page: number;
  count: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [tab, setTab] = React.useState(initialTab || "todas");
  const [search, setSearch] = React.useState(initialSearch || "");
  const debounced = useDebouncedValue(search, 350);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const pushParams = React.useCallback((next: {
    tab?: string;
    search?: string;
    page?: string;
  }) => {
    const p = new URLSearchParams(sp.toString());

    if (next.tab !== undefined) {
      if (!next.tab || next.tab === "todas") p.delete("tab");
      else p.set("tab", next.tab);
    }

    if (next.search !== undefined) {
      if (!next.search) p.delete("search");
      else p.set("search", next.search);
    }

    if (next.page !== undefined) {
      if (!next.page || next.page === "1") p.delete("page");
      else p.set("page", next.page);
    }

    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, sp]);

  React.useEffect(() => {
    pushParams({ search: debounced, page: "1" });
  }, [debounced, pushParams]);

  const onTab = (k: string) => {
    setTab(k);
    pushParams({ tab: k, page: "1" });
  };

  const goPage = (p: number) => pushParams({ page: String(p) });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-full overflow-x-auto no-scrollbar">
        <div className="flex w-full items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 sm:w-fit">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                className={[
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition sm:text-sm",
                  active
                    ? "bg-amber-300 text-black"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID, cliente, marca, modelo o IMEI..."
          className="input w-full sm:max-w-[380px]"
        />

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
            className="btn btn-secondary w-full px-3 py-2 text-xs sm:w-auto"
          >
            Anterior
          </button>

          <div className="min-w-[90px] text-center text-[11px] text-white/60 sm:text-xs">
            <span className="text-white/85">{page}</span>
            <span className="text-white/35"> / {totalPages}</span>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
            className="btn btn-secondary w-full px-3 py-2 text-xs sm:w-auto"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
