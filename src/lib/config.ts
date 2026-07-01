function cleanUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  const url = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_API_URL apuntando al backend Django");
  }

  return cleanUrl(url);
}

export function getDjangoApiUrl() {
  const url = process.env.DJANGO_API_URL || `${getApiBaseUrl()}/api`;
  return cleanUrl(url);
}

export function getSiteBaseUrl() {
  return cleanUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
}

export function apiUrl(path: string, baseUrl = getApiBaseUrl()) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const cleanBase = cleanUrl(baseUrl);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}
