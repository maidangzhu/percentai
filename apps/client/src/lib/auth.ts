const AUTH_TOKEN_KEY = "percent.auth.token";

export function getAuthToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null | undefined) {
  if (typeof localStorage === "undefined") return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function authHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: init.credentials ?? "include",
    headers: authHeaders(init.headers),
  });
}

export function rememberAuthTokenFromResponse(resp: Response, body?: unknown) {
  const headerToken = resp.headers.get("set-auth-token");
  if (headerToken) {
    setAuthToken(headerToken);
    return;
  }

  if (body && typeof body === "object" && "token" in body && typeof body.token === "string") {
    setAuthToken(body.token);
  }
}
