import { serverFetch } from "@/lib/api/serverFetch";
import type { Orden, OrdenEstado } from "@/types/orders";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getOrdenes(params: { page?: string; tab?: string; search?: string }) {
  const usp = new URLSearchParams();
  if (params.page) usp.set("page", params.page);
  if (params.tab && params.tab !== "todas") usp.set("tab", params.tab);
  if (params.search) usp.set("search", params.search);

  const r = await serverFetch(`/api/ordenes/?${usp.toString()}`);
  if (!r.ok) throw new Error(`Error cargando órdenes (${r.status})`);
  return (await r.json()) as Paginated<Orden>;
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
  // estado no lo mandamos: backend default pendiente
};

export async function createOrden(data: CreateOrdenInput) {
  const r = await serverFetch(`/api/ordenes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }
  return (await r.json()) as Orden;
}
