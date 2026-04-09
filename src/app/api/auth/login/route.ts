import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API_URL ?? "http://localhost:8000/api";

function rewriteCookieForFrontend(cookie: string) {
  // 1) eliminar Domain=... (si existe) para que aplique a localhost:3000
  cookie = cookie.replace(/;\s*Domain=[^;]+/i, "");

  // 2) asegurar Path=/ (muchos backends lo dejan en /api/)
  cookie = cookie.replace(/;\s*Path=[^;]+/i, "; Path=/");

  // 3) en dev (http) evitamos que quede Secure (si Django lo manda)
  //    porque un cookie Secure no se guarda en http://localhost
  cookie = cookie.replace(/;\s*Secure/gi, "");

  return cookie;
}

export async function POST(req: Request) {
  const body = await req.json();

  const djangoRes = await fetch(`${DJANGO_API}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await djangoRes.json().catch(() => ({}));

  if (!djangoRes.ok) {
    return NextResponse.json(
      { error: data?.detail ?? "Credenciales inválidas", data },
      { status: 401 }
    );
  }

  // ✅ Tomar los Set-Cookie que manda Django
  // En Next/Node, esto suele existir:
  const setCookies =
    // @ts-ignore
    typeof djangoRes.headers.getSetCookie === "function"
      // @ts-ignore
      ? djangoRes.headers.getSetCookie()
      : (djangoRes.headers.get("set-cookie")
          ? [djangoRes.headers.get("set-cookie") as string]
          : []);

  const res = NextResponse.json(data);

  // ✅ Reenviar cookies al browser, pero adaptadas al dominio/path del frontend
  for (const c of setCookies) {
    res.headers.append("set-cookie", rewriteCookieForFrontend(c));
  }

  return res;
}
