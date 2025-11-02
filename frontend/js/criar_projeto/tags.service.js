// js/tags.service.js
import { api } from "./api.js";

// cache leve na memória da página
const knownTags = []; // { id, name, description? }

export async function ensureTagIdByName(name) {
  const nm = (name || "").trim();
  if (!nm) throw new Error("Nome da habilidade vazio.");
  const lower = nm.toLowerCase();

  let t = knownTags.find((x) => x.name.toLowerCase() === lower);
  if (!t) {
    const found = await api.listTags(nm);
    t = found.find((x) => x.name.toLowerCase() === lower);
  }
  if (!t) {
    t = await api.createTag({ name: nm });
    knownTags.push(t);
  }
  return t.id;
}