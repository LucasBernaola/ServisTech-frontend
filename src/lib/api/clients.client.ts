import { apiRequest } from "@/lib/api/http";
import type { Cliente } from "@/types/orders";

export type { Cliente };

export type ClienteInput = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  celular: string;
  direccion?: string;
};

type Paginated<T> =
  | {
      count: number;
      next: string | null;
      previous: string | null;
      results: T[];
    }
  | T[];

export async function searchClientesClient(opts: {
  apiBaseUrl: string;
  q: string;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  params.set("search", opts.q);
  if (opts.pageSize) params.set("page_size", String(opts.pageSize));

  const data = await apiRequest<Paginated<Cliente>>(
    `/api/clientes/?${params.toString()}`,
    {
      apiBaseUrl: opts.apiBaseUrl,
    },
  );

  return Array.isArray(data) ? data : data.results;
}

export async function createClienteClient(
  apiBaseUrl: string,
  data: ClienteInput,
) {
  return apiRequest<Cliente>("/api/clientes/", {
    apiBaseUrl,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateClienteClient(
  apiBaseUrl: string,
  clienteId: number,
  data: ClienteInput,
) {
  return apiRequest<Cliente>(`/api/clientes/${clienteId}/`, {
    apiBaseUrl,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
