const DEFAULT_DEV_URL = "http://localhost:3000";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return stripTrailingSlash(trimmed);
  }

  return stripTrailingSlash(`https://${trimmed}`);
}

export function getAppBaseUrl(): string {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(process.env.VERCEL_URL);
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_URL;
  }

  throw new Error(
    "Missing APP_URL in production. Set APP_URL to your custom domain (e.g. https://app.example.com)."
  );
}

export function buildAppUrl(path: string): string {
  const baseUrl = getAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
