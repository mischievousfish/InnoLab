const AUTH_STORAGE_KEY = "innolab.auth";
const POCKETBASE_URL = (import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090").replace(/\/$/, "");
const AUTH_COLLECTION = import.meta.env.VITE_POCKETBASE_AUTH_COLLECTION || "users";

function endpoint(path) {
  return `${POCKETBASE_URL}/api/collections/${encodeURIComponent(AUTH_COLLECTION)}/${path}`;
}

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    return session?.token && session?.model ? session : null;
  } catch {
    return null;
  }
}

function storeSession(authResponse) {
  const session = { token: authResponse.token, model: authResponse.record ?? authResponse.model };
  if (!session.token || !session.model) throw new Error("Phản hồi xác thực không hợp lệ.");
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

async function request(path, { method = "POST", body, token } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(endpoint(path), {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `PocketBase trả về lỗi ${response.status}.`);
  return result;
}

export async function signIn(identity, password) {
  const response = await request("auth-with-password", { body: { identity, password } });
  return storeSession(response);
}

export async function signUp({ name, email, password, passwordConfirm }) {
  await request("records", {
    body: { name, email, password, passwordConfirm, emailVisibility: false }
  });
  return signIn(email, password);
}

export async function getAuthenticatedUser() {
  const session = readSession();
  if (!session) return null;

  try {
    const refreshed = await request("auth-refresh", { token: session.token });
    return storeSession(refreshed).model;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredSession() {
  return readSession();
}

export function getAuthEndpoint() {
  return POCKETBASE_URL;
}
