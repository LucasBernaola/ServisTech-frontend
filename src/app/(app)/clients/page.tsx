import ClientsClient from "./ClientsClient";
import { getClientes } from "@/lib/api/clients";
import { getApiBaseUrl } from "@/lib/config";

const API_BASE_URL = getApiBaseUrl();

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; ordering?: string }>;
}) {
  const sp = await searchParams;
  const data = await getClientes(sp);

  return (
    <ClientsClient
      apiBaseUrl={API_BASE_URL}
      initialData={data}
      initialSearch={sp.search || ""}
      initialPage={Number(sp.page || 1)}
      initialOrdering={sp.ordering || "apellido"}
    />
  );
}
