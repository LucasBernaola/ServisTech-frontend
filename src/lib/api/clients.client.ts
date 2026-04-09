// src/lib/api/clients.client.ts
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

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} | T[]; // por si en algún momento no paginás clientes

export async function searchClientesClient(opts: {
  apiBaseUrl: string;
  q: string;
  pageSize?: number; // opcional si tu backend lo respeta
}) {
  const usp = new URLSearchParams();
  usp.set("search", opts.q);
  if (opts.pageSize) usp.set("page_size", String(opts.pageSize));

  const r = await fetch(`${opts.apiBaseUrl}/api/clientes/?${usp.toString()}`, {
    credentials: "include",
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  const data: Paginated<Cliente> = await r.json();

  // normalizar: si viene paginado → results, si no → array
  const results = Array.isArray(data) ? data : data.results;
  return results;
}
