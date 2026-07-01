import { cookies } from "next/headers";
import { apiUrl } from "@/lib/config";

export async function serverFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.headers || {}),
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });
}
