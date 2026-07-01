import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ApiError, parseApiResponse } from "@/lib/api/http";
import { apiUrl } from "@/lib/config";

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(apiUrl("/api/profile/"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el backend" },
      { status: 503 },
    );
  }

  try {
    const data = await parseApiResponse<unknown>(res);
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 401;
    const message =
      status === 401 || status === 403
        ? "Token invalido"
        : "No se pudo validar la sesion";
    return NextResponse.json({ error: message }, { status });
  }
}
