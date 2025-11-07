// === CONFIG ===
const API_BASE = "https://bdprojetos.azurewebsites.net"; // seu micro
const AUTH_KEY = "auth.user"; // { email, token }

// sessão (mesmo padrão que você usa)
const auth = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); }
    catch { return null; }
  }
};
const getEmail = () => auth.get()?.email || "";
const getToken = () => auth.get()?.token || "";

// monta headers exigidos pelo seu micro
function buildHeaders(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const email = getEmail();
  const token = getToken();
  if (email) h["X-User-Email"] = email;        // OBRIGATÓRIO p/ ?mine=1
  if (token) h["Authorization"] = `Bearer ${token}`; // opcional (futuro)
  return h;
}

// === CHAMADA: pega projetos do usuário logado ===
export async function fetchMyProjects() {
  const res = await fetch(`${API_BASE}/projects?mine=1`, {
    headers: buildHeaders()
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const d = await res.json(); if (d?.detail) msg = d.detail; } catch {}
    throw new Error(msg);
  }
  return res.json(); // => Array<ProjectRead>
}

// USO (exemplo):
// const projects = await fetchMyProjects();
// render(projects);
