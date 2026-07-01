import { OrdersTable } from "@/components/OrdersTable";
import DashboardClientsTable from "@/components/DashboardClientsTable";
import { getClientesRecent } from "@/lib/api/clients";
import { getOrdenesRecent } from "@/lib/api/orders";
import { getApiBaseUrl } from "@/lib/config";

const API_BASE_URL = getApiBaseUrl();

export default async function DashboardPage() {
  const [ordenes, clientes] = await Promise.all([
    getOrdenesRecent(),
    getClientesRecent(),
  ]);

  return (
    <div className="p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-white">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Ultimas ordenes y ultimos clientes ingresados.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-white">
            Ordenes recientes
          </div>
        </div>

        <div className="overflow-x-auto">
          <OrdersTable apiBaseUrl={API_BASE_URL} rows={ordenes.results || []} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-3 sm:px-4 py-3 border-b border-white/10">
          <div className="text-sm font-semibold text-white">
            Clientes recientes
          </div>
        </div>

        <div className="overflow-x-auto">
          <DashboardClientsTable rows={clientes.results || []} />
        </div>
      </div>
    </div>
  );
}
