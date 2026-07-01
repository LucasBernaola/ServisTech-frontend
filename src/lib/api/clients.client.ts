import { apiRequest } from "@/lib/api/http";

export type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  celular: string;
  created_at?: string;
  updated_at?: string;
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
