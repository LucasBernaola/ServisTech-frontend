import { OrdersTable } from "@/components/OrdersTable";
import DashboardClientsTable from "@/components/DashboardClientsTable";
import { getClientesRecent } from "@/lib/api/clients";
import { getOrdenesRecent } from "@/lib/api/orders";
import { getApiBaseUrl } from "@/lib/config";
import { ClipboardList, Users, Wrench } from "lucide-react";

const API_BASE_URL = getApiBaseUrl();

export default async function DashboardPage() {
  const [ordenes, clientes] = await Promise.all([
    getOrdenesRecent(),
    getClientesRecent(),
  ]);

  const ordenesRows = ordenes.results || [];
  const clientesRows = clientes.results || [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
              Ordenes
            </span>
            <ClipboardList className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {ordenes.count ?? ordenesRows.length}
          </div>
          <p className="mt-1 text-sm text-white/45">Registradas en el sistema</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
              Clientes
            </span>
            <Users className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {clientes.count ?? clientesRows.length}
          </div>
          <p className="mt-1 text-sm text-white/45">Contactos cargados</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/42">
              Actividad
            </span>
            <Wrench className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">
            {ordenesRows.length}
          </div>
          <p className="mt-1 text-sm text-white/45">Ordenes recientes visibles</p>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Ordenes recientes</h2>
          <p className="mt-0.5 text-xs text-white/45">
            Ultimos equipos ingresados o actualizados.
          </p>
        </div>
        <div className="overflow-x-auto">
          <OrdersTable apiBaseUrl={API_BASE_URL} rows={ordenesRows} />
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Clientes recientes</h2>
          <p className="mt-0.5 text-xs text-white/45">
            Ultimos contactos registrados para futuras ordenes.
          </p>
        </div>
        <div className="overflow-x-auto">
          <DashboardClientsTable rows={clientesRows} />
        </div>
      </section>
    </div>
  );
}
