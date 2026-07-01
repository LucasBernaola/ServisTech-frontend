import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseApiResponse } from "@/lib/api/http";
import { apiUrl } from "@/lib/config";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(apiUrl("/api/profile/"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  try {
    const data = await parseApiResponse<unknown>(res);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }
}
