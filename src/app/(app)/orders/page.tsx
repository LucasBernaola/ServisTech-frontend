import { OrdersTable } from "@/components/OrdersTable";
import { getApiBaseUrl } from "@/lib/config";
import { getOrdenes } from "@/lib/api/orders";
import { OrdersClient } from "./OrdersClient";
import { OrdersToolbar } from "./OrdersToolbar";

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-200/70">
            Mesa de trabajo
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Ordenes</h2>
          <p className="mt-1 text-sm text-white/50">
            Busca equipos, filtra por estado y actualiza el avance de cada reparacion.
          </p>
        </div>

        <OrdersToolbar apiBaseUrl={API_BASE_URL} />
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <OrdersClient
            initialTab={tab}
            initialSearch={search}
            page={Number(page)}
            count={data.count}
            pageSize={7}
          />
        </div>

        <div className="overflow-x-auto">
          <OrdersTable rows={data.results} apiBaseUrl={API_BASE_URL} />
        </div>
      </section>
    </div>
  );
}
