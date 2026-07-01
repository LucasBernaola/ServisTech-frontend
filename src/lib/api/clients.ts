import { serverFetch } from "@/lib/api/serverFetch";
import type { Cliente } from "@/types/orders";

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getClientes(params: {
  page?: string;
  search?: string;
  ordering?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", params.page);
  if (params.search) qs.set("search", params.search);
  if (params.ordering) qs.set("ordering", params.ordering);

  const res = await serverFetch(`/api/clientes/?${qs.toString()}`);

  if (!res.ok) throw new Error("Error cargando clientes");
  return (await res.json()) as Paginated<Cliente>;
}

export async function getClientesRecent(limit = 5) {
  const res = await serverFetch("/api/clientes/");

  if (!res.ok) throw new Error("Error cargando clientes");

  const data = (await res.json()) as Paginated<Cliente> | Cliente[];
  const results = Array.isArray(data) ? data : data.results || [];

  return { count: results.length, results: results.slice(0, limit) };
}
