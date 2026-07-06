import ClientsClient from "./ClientsClient";
import { getClientes } from "@/lib/api/clients";
import { getApiBaseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; ordering?: string }>;
}) {
  const sp = await searchParams;
  const data = await getClientes(sp);
  const apiBaseUrl = getApiBaseUrl();

  return (
    <ClientsClient
      apiBaseUrl={apiBaseUrl}
      initialData={data}
      initialSearch={sp.search || ""}
      initialPage={Number(sp.page || 1)}
      initialOrdering={sp.ordering || "apellido"}
    />
  );
}
