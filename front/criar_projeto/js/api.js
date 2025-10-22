// js/api.js
const API_BASE = "http://localhost:8000"; // ajuste se necessário

async function http(path, init) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { const data = await res.json(); if (data?.detail) msg = data.detail; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Endpoints
export const api = {
  // Tags
  listTags: (q) => http(`/tags/${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createTag: (body) => http(`/tags/`, { method: "POST", body: JSON.stringify(body) }),

  // Projects
  createProject: (body) => http(`/projects/`, { method: "POST", body: JSON.stringify(body) }),
  listProjects: (params) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.tag) sp.set("tag", params.tag);
    return http(`/projects${sp.toString() ? `?${sp}` : ""}`);
  },
};
