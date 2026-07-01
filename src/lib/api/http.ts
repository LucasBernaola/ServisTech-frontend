import { apiUrl } from "@/lib/config";

type ApiRequestInit = RequestInit & {
  apiBaseUrl?: string;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function readResponseBody(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, fallback: string) {
  if (!body) return fallback;
  if (typeof body === "string") return body;

  if (typeof body === "object") {
    const data = body as Record<string, unknown>;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;

    const entries = Object.entries(data);
    if (entries.length) {
      return entries
        .map(([key, value]) =>
          Array.isArray(value)
            ? `${key}: ${value.join(" ")}`
            : `${key}: ${String(value)}`,
        )
        .join("\n");
    }
  }

  return fallback;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const body = await readResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      messageFromBody(body, `Error ${res.status}`),
      res.status,
      body,
    );
  }

  return body as T;
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}) {
  const { apiBaseUrl, headers, ...rest } = init;
  const hasFormData = rest.body instanceof FormData;

  const res = await fetch(apiUrl(path, apiBaseUrl), {
    ...rest,
    credentials: rest.credentials ?? "include",
    headers: {
      ...(hasFormData || !rest.body
        ? {}
        : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
  });

  return parseApiResponse<T>(res);
}
