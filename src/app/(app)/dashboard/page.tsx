import { cookies } from "next/headers"
import { OrdersTable } from "@/components/OrdersTable"
import DashboardClientsTable from "@/components/DashboardClientsTable"
import type { Orden } from "@/types/orders"

const API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ""

if (!API_BASE_URL) {
  throw new Error(
    "Falta API_BASE_URL / NEXT_PUBLIC_API_URL apuntando al backend Django"
  )
}

type ListResponse<T> = {
  count: number
  results: T[]
  next?: string | null
  previous?: string | null
}

type Cliente = {
  id: number
  nombre?: string
  apellido?: string
  dni?: string
  celular?: string
  email?: string
  created_at?: string
}

async function fetchJSON(cookieHeader: string, url: string) {
  const res = await fetch(url, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`URL: ${url} | status: ${res.status} | body: ${txt}`)
  }

  return res.json()
}

async function getOrdenesRecent(
  cookieHeader: string
): Promise<ListResponse<Orden>> {
  const data = await fetchJSON(cookieHeader, `${API_BASE_URL}/api/ordenes/`)
  const results = Array.isArray(data) ? data : data.results || []

  return { count: results.length, results: results.slice(0, 5) }
}

async function getClientesRecent(
  cookieHeader: string
): Promise<ListResponse<Cliente>> {
  const data = await fetchJSON(cookieHeader, `${API_BASE_URL}/api/clientes/`)
  const results = Array.isArray(data) ? data : data.results || []

  return { count: results.length, results: results.slice(0, 5) }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const [ordenes, clientes] = await Promise.all([
    getOrdenesRecent(cookieHeader),
    getClientesRecent(cookieHeader),
  ])

  return (
    <div className="p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Últimas órdenes y últimos clientes ingresados.
        </p>
      </div>

      {/* Órdenes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-white">
            Órdenes recientes
          </div>
        </div>

        {/* 👇 clave para mobile */}
        <div className="overflow-x-auto">
          <OrdersTable
            apiBaseUrl={API_BASE_URL}
            rows={ordenes.results || []}
          />
        </div>
      </div>

      {/* Clientes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-white">
            Clientes recientes
          </div>
        </div>

        {/* 👇 clave para mobile */}
        <div className="overflow-x-auto">
          <DashboardClientsTable rows={clientes.results || []} />
        </div>
      </div>
    </div>
  )
}