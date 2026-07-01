import { serverFetch } from "@/lib/api/serverFetch";
import type { Paginated } from "@/lib/api/clients";
import type { Orden } from "@/types/orders";

export async function getOrdenes(params: {
  page?: string;
  tab?: string;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", params.page);
  if (params.tab && params.tab !== "todas") qs.set("tab", params.tab);
  if (params.search) qs.set("search", params.search);

  const res = await serverFetch(`/api/ordenes/?${qs.toString()}`);

  if (!res.ok) throw new Error(`Error cargando ordenes (${res.status})`);
  return (await res.json()) as Paginated<Orden>;
}

export async function getOrdenesRecent(limit = 5) {
  const res = await serverFetch("/api/ordenes/");

  if (!res.ok) throw new Error("Error cargando ordenes");

  const data = (await res.json()) as Paginated<Orden> | Orden[];
  const results = Array.isArray(data) ? data : data.results || [];

  return { count: results.length, results: results.slice(0, limit) };
}

export type CreateOrdenInput = {
  cliente_id?: number | null;
  dispositivo_tipo?: string;
  marca?: string;
  modelo?: string;
  imei_serial?: string;
  falla_reportada?: string;
  condicion_equipo?: string;
  accesorios_entregados?: string;
  observaciones?: string;
  bloqueo_tipo?: "none" | "pin" | "texto" | "patron";
  bloqueo_valor?: string;
};

export async function createOrden(data: CreateOrdenInput) {
  const res = await serverFetch("/api/ordenes/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status}`);
  }

  return (await res.json()) as Orden;
}
