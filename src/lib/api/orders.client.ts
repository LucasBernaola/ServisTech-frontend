// src/lib/api/orders.client.ts
import type { Orden } from "@/types/orders";
import type { CreateOrdenInput } from "@/lib/api/orders";

export async function createOrdenClient(
  apiBaseUrl: string,
  data: CreateOrdenInput
) {
  const r = await fetch(`${apiBaseUrl}/api/ordenes/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  return (await r.json()) as Orden;
}

export async function uploadOrdenFotosClient(opts: {
  apiBaseUrl: string;
  ordenId: number;
  files: File[];
  descripcion?: string;
}) {
  const fd = new FormData();
  for (const f of opts.files) fd.append("imagen", f);
  if (opts.descripcion) fd.append("descripcion", opts.descripcion);

  const r = await fetch(
    `${opts.apiBaseUrl}/api/ordenes/${opts.ordenId}/fotos/`,
    {
      method: "POST",
      credentials: "include",
      body: fd,
    }
  );

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  return r.json();
}

export async function getOrdenClient(apiBaseUrl: string, ordenId: number) {
  const r = await fetch(`${apiBaseUrl}/api/ordenes/${ordenId}/`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  return (await r.json()) as Orden;
}

export async function patchOrdenClient(
  apiBaseUrl: string,
  ordenId: number,
  data: Partial<CreateOrdenInput>
) {
  const r = await fetch(`${apiBaseUrl}/api/ordenes/${ordenId}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(txt || `Error ${r.status}`);
  }

  return (await r.json()) as Orden;
}

/**
 * ✅ IMPRESIONES (FRONTEND)
 * OJO: NO deben usar apiBaseUrl.
 * Son rutas de Next, porque la impresión es 100% en frontend.
 */

// Orden imprimible para el cliente (QR + seguimiento)
export function printSeguimientoUrl(_apiBaseUrl: string, ordenId: number) {
  return `/imprimir/orden/${ordenId}`;
}

// Ficha técnica interna imprimible (etiqueta)
export function printFichaUrl(_apiBaseUrl: string, ordenId: number) {
  return `/imprimir/ficha/${ordenId}`;
}