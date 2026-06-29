import { cookies } from "next/headers"
import ClientsClient from "./ClientsClient"
import type { Cliente } from "@/types/orders"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

type ClientesResponse = {
  count: number
  results: Cliente[]
  next?: string | null
  previous?: string | null
}

async function getClientes(params: {
  page?: string
  search?: string
  ordering?: string
}) {
  const cookieStore = await cookies()

  const qs = new URLSearchParams()
  if (params.page) qs.set("page", params.page)
  if (params.search) qs.set("search", params.search)
  if (params.ordering) qs.set("ordering", params.ordering)

  const res = await fetch(`${API_BASE_URL}/api/clientes/?${qs.toString()}`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  })

  if (!res.ok) throw new Error("Error cargando clientes")
  return (await res.json()) as ClientesResponse
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; ordering?: string }>
}) {
  const sp = await searchParams

  const data = await getClientes(sp)

  return (
    <ClientsClient
      apiBaseUrl={API_BASE_URL}
      initialData={data}
      initialSearch={sp.search || ""}
      initialPage={Number(sp.page || 1)}
      initialOrdering={sp.ordering || "apellido"}
    />
  )
}
