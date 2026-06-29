import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API_URL ?? "http://localhost:8000/api";

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
      { error: data?.detail ?? "Credenciales invalidas", data },
      { status: 401 },
    );
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
