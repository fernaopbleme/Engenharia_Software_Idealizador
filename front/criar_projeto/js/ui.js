// js/ui.js
import { createProjectFromUI } from "./projects.service.js";

// estado local das skills
const skills = []; // [{ name, level: 'BEGINNER'|'INTERMEDIATE'|'ADVANCED' }]

// refs DOM
const $ = (id) => document.getElementById(id);
const skillsList = $("skillsList");
const skillsEmpty = $("skillsEmpty");
const addSkillBtn = $("addSkillBtn");
const skillName = $("skillName");
const skillLevel = $("skillLevel");
const form = $("projectForm");
const alertBox = $("formAlert");
const cancelBtn = $("cancelBtn");

function showAlert(type, msg) {
  alertBox.className = "alert " + type; // 'error' | 'success'
  alertBox.textContent = msg;
}
function clearAlert() {
  alertBox.className = "alert";
  alertBox.textContent = "";
}

function renderSkills() {
  skillsList.innerHTML = "";
  if (skills.length === 0) {
    skillsEmpty.style.display = "grid";
    return;
  }
  skillsEmpty.style.display = "none";
  skills.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "skill-item";

    const meta = document.createElement("div");
    meta.className = "meta";

    const name = document.createElement("strong");
    name.textContent = s.name;

    const level = document.createElement("span");
    level.className = "chip";
    level.textContent =
      s.level === "BEGINNER" ? "Iniciante" : s.level === "ADVANCED" ? "Avançado" : "Intermediário";

    meta.appendChild(name);
    meta.appendChild(level);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-danger";
    remove.textContent = "Remover";
    remove.addEventListener("click", () => {
      skills.splice(idx, 1);
      renderSkills();
    });

    row.appendChild(meta);
    row.appendChild(remove);
    skillsList.appendChild(row);
  });
}

export function initUI() {
  addSkillBtn.addEventListener("click", () => {
    clearAlert();
    const nm = (skillName.value || "").trim();
    if (!nm) return showAlert("error", "Informe o nome da habilidade antes de adicionar.");
    if (skills.some((s) => s.name.toLowerCase() === nm.toLowerCase())) {
      return showAlert("error", "Essa habilidade já foi adicionada.");
    }
    const lvl = skillLevel.value || "INTERMEDIATE";
    skills.push({ name: nm, level: lvl });
    skillName.value = "";
    renderSkills();
  });

  cancelBtn.addEventListener("click", () => {
    if (document.referrer) history.back();
    else window.location.href = "/";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert();
    const title = $("title").value.trim();
    const description = $("description").value.trim();
    if (!title) return showAlert("error", "O título do projeto é obrigatório.");
    if (!description) return showAlert("error", "A descrição do projeto é obrigatória.");

    try {
      await createProjectFromUI({ title, description, uiSkills: skills });
      showAlert("success", "Projeto criado com sucesso!");
      $("title").value = "";
      $("description").value = "";
      skills.length = 0;
      renderSkills();
    } catch (err) {
      showAlert("error", "Falha ao criar o projeto. " + (err?.message || ""));
    }
  });

  renderSkills(); // inicial
}
