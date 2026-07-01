import { getOrdenes } from "@/lib/api/orders";
import { OrdersClient } from "./OrdersClient";
import { OrdersTable } from "@/components/OrdersTable";
import { OrdersToolbar } from "./OrdersToolbar";
import { getApiBaseUrl } from "@/lib/config";

const API_BASE_URL = getApiBaseUrl();

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    tab?: string;
    search?: string;
  }>;
}) {
  const sp = await searchParams;

  const page = sp.page ?? "1";
  const tab = sp.tab ?? "todas";
  const search = sp.search ?? "";

  const data = await getOrdenes({ page, tab, search });

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-white">
          Órdenes
        </h1>
        <p className="text-xs sm:text-sm text-white/60">
          Gestioná y controlá todas las órdenes del sistema.
        </p>
      </div>

      {/* Toolbar */}
      <OrdersToolbar apiBaseUrl={API_BASE_URL} />

      {/* Filters */}
      <OrdersClient
        initialTab={tab}
        initialSearch={search}
        page={Number(page)}
        count={data.count}
        pageSize={7}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <OrdersTable rows={data.results} apiBaseUrl={API_BASE_URL} />
      </div>
    </div>
  );
}
