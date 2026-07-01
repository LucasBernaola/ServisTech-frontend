import { NextResponse } from "next/server";
import { ApiError, parseApiResponse } from "@/lib/api/http";
import { getDjangoApiUrl } from "@/lib/config";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function rewriteCookieForFrontend(cookie: string) {
  cookie = cookie.replace(/;\s*Domain=[^;]+/i, "");
  cookie = cookie.replace(/;\s*Path=[^;]+/i, "; Path=/");
  cookie = cookie.replace(/;\s*Secure/gi, "");

  return cookie;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud invalida" }, { status: 400 });
  }

  let djangoRes: Response;
  try {
    djangoRes = await fetch(`${getDjangoApiUrl()}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el backend" },
      { status: 503 },
    );
  }

  let data: unknown;
  try {
    data = await parseApiResponse<unknown>(djangoRes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Credenciales invalidas";
    const status = error instanceof ApiError ? error.status : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const headers = djangoRes.headers as HeadersWithSetCookie;
  const setCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];

  const res = NextResponse.json(data);

  for (const cookie of setCookies) {
    res.headers.append("set-cookie", rewriteCookieForFrontend(cookie));
  }

  return res;
}
