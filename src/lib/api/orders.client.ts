import { apiRequest } from "@/lib/api/http";
import type { CreateOrdenInput } from "@/lib/api/orders";
import type { Orden, OrdenEstado } from "@/types/orders";

export async function createOrdenClient(
  apiBaseUrl: string,
  data: CreateOrdenInput,
) {
  return apiRequest<Orden>("/api/ordenes/", {
    apiBaseUrl,
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadOrdenFotosClient(opts: {
  apiBaseUrl: string;
  ordenId: number;
  files: File[];
  descripcion?: string;
}) {
  const fd = new FormData();
  for (const file of opts.files) fd.append("imagen", file);
  if (opts.descripcion) fd.append("descripcion", opts.descripcion);

  return apiRequest<unknown>(`/api/ordenes/${opts.ordenId}/fotos/`, {
    apiBaseUrl: opts.apiBaseUrl,
    method: "POST",
    body: fd,
  });
}

export async function getOrdenClient(apiBaseUrl: string, ordenId: number) {
  return apiRequest<Orden>(`/api/ordenes/${ordenId}/`, {
    apiBaseUrl,
    cache: "no-store",
  });
}

export async function patchOrdenClient(
  apiBaseUrl: string,
  ordenId: number,
  data: Partial<CreateOrdenInput>,
) {
  return apiRequest<Orden>(`/api/ordenes/${ordenId}/`, {
    apiBaseUrl,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function patchOrdenEstadoClient(opts: {
  apiBaseUrl: string;
  id: number;
  estado: OrdenEstado;
  payload?: Record<string, unknown>;
}) {
  return apiRequest<unknown>(`/api/ordenes/${opts.id}/estado/`, {
    apiBaseUrl: opts.apiBaseUrl,
    method: "PATCH",
    body: JSON.stringify({ estado: opts.estado, ...(opts.payload || {}) }),
  });
}

export function printOrdenUrl(ordenId: number) {
  return `/imprimir/orden/${ordenId}`;
}

export function printFichaUrl(ordenId: number) {
  return `/imprimir/ficha/${ordenId}`;
}

export function seguimientoPublicUrl(publicToken: string) {
  return `/seguimiento/${publicToken}`;
}
