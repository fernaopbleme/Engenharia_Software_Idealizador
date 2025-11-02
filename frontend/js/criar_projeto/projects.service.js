// js/projects.service.js
import { api } from "./api.js";
import { ensureTagIdByName } from "./tags.service.js";

// UI usa UPPERCASE → API usa minúsculas
const LEVEL_UI_TO_API = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

/** Monta o payload com tag_id + skill_level e chama a API */
export async function createProjectFromUI({ title, description, uiSkills }) {
  const links = []; // [{tag_id, skill_level}]
  for (const s of uiSkills) {
    const tag_id = await ensureTagIdByName(s.name);
    const skill_level = LEVEL_UI_TO_API[s.level] || "intermediate";
    const i = links.findIndex((l) => l.tag_id === tag_id);
    if (i >= 0) links[i].skill_level = skill_level;
    else links.push({ tag_id, skill_level });
  }
  return api.createProject({ title, description, tags: links });}