const AUTH_KEY = "auth.user";
const LEGACY_TOKEN_KEY = "access_token";

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function ensureSessionFromLegacy() {
  const session = getSession();
  if (session?.email && session?.token) return;

  const token = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!token) return;

  const payload = decodeJwtPayload(token);
  const email = payload?.email || payload?.sub;
  if (!email) return;

  saveSession({ email, token });
}

function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const part = token.split(".")[1];
    if (!part) return null;
    const payload = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export { AUTH_KEY, LEGACY_TOKEN_KEY };

