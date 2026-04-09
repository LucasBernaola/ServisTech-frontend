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

  const pushParams = (next: {
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
  };

  React.useEffect(() => {
    pushParams({ search: debounced, page: "1" });
  }, [debounced]);

  const onTab = (k: string) => {
    setTab(k);
    pushParams({ tab: k, page: "1" });
  };

  const goPage = (p: number) => pushParams({ page: String(p) });

  return (
    <div className="mb-4 flex flex-col gap-3">
      
      {/* Tabs */}
      <div className="flex w-full overflow-x-auto no-scrollbar">
        <div className="flex w-full sm:w-fit items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTab(t.key)}
                className={[
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs sm:text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID, cliente, marca, modelo o IMEI..."
          className="w-full sm:max-w-[320px] md:max-w-[380px] rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/85 placeholder:text-white/40 outline-none focus:border-white/20"
        />

        {/* Pagination */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          
          <button
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
            className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/8 disabled:opacity-40"
          >
            Anterior
          </button>

          <div className="text-[11px] sm:text-xs text-white/60 text-center min-w-[90px]">
            <span className="block sm:inline">
              {page} / {totalPages}
            </span>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
            className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/8 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}