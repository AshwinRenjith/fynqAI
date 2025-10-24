export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

interface ApiFetchOptions extends RequestInit {
  parseAs?: "json" | "text" | "raw";
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { parseAs = "json", headers, ...rest } = options;
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const init: RequestInit = {
    ...rest,
    headers: rest.body instanceof FormData
      ? headers
      : {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
  };

  const response = await fetch(url, init);

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      payload = await response.text();
    }
    throw new ApiError(`Request to ${url} failed with status ${response.status}`, response.status, payload);
  }

  if (parseAs === "raw") {
    return response as unknown as T;
  }

  if (parseAs === "text") {
    return (await response.text()) as unknown as T;
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
