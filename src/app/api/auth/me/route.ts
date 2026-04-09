import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/api/profile/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
