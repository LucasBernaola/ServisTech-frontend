// lib/api/serverFetch.ts
import { cookies } from "next/headers";

export async function serverFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString(); // reenvía todas las cookies

  const base = process.env.NEXT_PUBLIC_API_URL!;
  const url = path.startsWith("http") ? path : `${base}${path}`;

  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}
