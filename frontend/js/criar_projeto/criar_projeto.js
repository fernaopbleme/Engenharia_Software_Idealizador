// ========= CONFIG =========
const API_BASE = "http://localhost:8000";

// ========= MAPEAMENTO DE NÍVEIS (UI → API) =========
const LEVEL_UI_TO_API = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

// ========= ESTADO LOCAL =========
const skills = []; // [{ name: string, level: 'BEGINNER'|'INTERMEDIATE'|'ADVANCED' }]
const knownTags = []; // cache leve de tags já vistas [{id,name,...}]

// ========= HELPERS DE UI =========
const skillsList = document.getElementById('skillsList');
const skillsEmpty = document.getElementById('skillsEmpty');
const addSkillBtn = document.getElementById('addSkillBtn');
const skillName = document.getElementById('skillName');
const skillLevel = document.getElementById('skillLevel');
const form = document.getElementById('projectForm');
const alertBox = document.getElementById('formAlert');
const cancelBtn = document.getElementById('cancelBtn');

function showAlert(type, msg) {
  alertBox.className = 'alert ' + type; // 'error' | 'success'
  alertBox.textContent = msg;
}
function clearAlert() {
  alertBox.className = 'alert';
  alertBox.textContent = '';
}
function renderSkills() {
  skillsList.innerHTML = '';
  if (skills.length === 0) {
    skillsEmpty.style.display = 'grid';
    return;
  }
  skillsEmpty.style.display = 'none';
  skills.forEach((s, idx) => {
    const row = document.createElement('div'); row.className = 'skill-item';
    const meta = document.createElement('div'); meta.className = 'meta';
    const name = document.createElement('strong'); name.textContent = s.name;
    const level = document.createElement('span'); level.className = 'chip';
    level.textContent = s.level === 'BEGINNER' ? 'Iniciante' : s.level === 'ADVANCED' ? 'Avançado' : 'Intermediário';
    meta.appendChild(name); meta.appendChild(level);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-danger'; remove.textContent = 'Remover';
    remove.addEventListener('click', () => { skills.splice(idx, 1); renderSkills(); });
    row.appendChild(meta); row.appendChild(remove); skillsList.appendChild(row);
  });
}

// ========= CLIENTE HTTP =========
async function http(path, init) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let msg = res.status + " " + res.statusText;
    try { const data = await res.json(); if (data && data.detail) msg = data.detail; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
const api = {
  listTags: (q) => http('/tags/' + (q ? ('?q=' + encodeURIComponent(q)) : '')),
  createTag: (body) => http('/tags/', { method: 'POST', body: JSON.stringify(body) }),
  createProject: (body) => http('/projects/', { method: 'POST', body: JSON.stringify(body) }),
  listProjects: (params) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.tag) sp.set('tag', params.tag);
    return http('/projects' + (sp.toString() ? ('?' + sp.toString()) : ''));
  }
};

// ========= REGRAS =========
async function ensureTagIdByName(name) {
  const nm = (name || '').trim(); if (!nm) throw new Error('Nome da habilidade vazio');
  const lower = nm.toLowerCase();
  let t = knownTags.find(x => x.name.toLowerCase() === lower);
  if (!t) {
    const found = await api.listTags(nm);
    t = found.find(x => x.name.toLowerCase() === lower);
  }
  if (!t) {
    t = await api.createTag({ name: nm });
    knownTags.push(t);
  }
  return t.id;
}

async function createProjectFromUI({ title, description, category, uiSkills }) {
  const links = []; // [{tag_id, skill_level}]
  for (const s of uiSkills) {
    const tag_id = await ensureTagIdByName(s.name);
    const skill_level = LEVEL_UI_TO_API[s.level] || 'intermediate';
    const i = links.findIndex(l => l.tag_id === tag_id);
    if (i >= 0) links[i].skill_level = skill_level; else links.push({ tag_id, skill_level });
  }
  // >>> inclui category no payload <<<
  const payload = { title, description, category, tags: links };
  return api.createProject(payload);
}

// ========= EVENTOS =========
addSkillBtn.addEventListener('click', () => {
  clearAlert();
  const name = (skillName.value || '').trim();
  if (!name) return showAlert('error', 'Informe o nome da habilidade antes de adicionar.');
  if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    return showAlert('error', 'Essa habilidade já foi adicionada.');
  }
  skills.push({ name, level: skillLevel.value });
  skillName.value = '';
  renderSkills();
});

cancelBtn.addEventListener('click', () => {
  window.location.href = '../home.html';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value.trim(); // ← NOVO
  if (!title) return showAlert('error', 'O título do projeto é obrigatório.');
  if (!description) return showAlert('error', 'A descrição do projeto é obrigatória.');
  if (!category) return showAlert('error', 'A categoria do projeto é obrigatória.');

  try {
    const proj = await createProjectFromUI({ title, description, category, uiSkills: skills });
    showAlert('success', 'Projeto criado com sucesso!');
    // reset
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    skills.length = 0; renderSkills();
    setTimeout(() => {
      window.location.href = '../home.html';
    }, 1500);
  } catch (err) {
    showAlert('error', 'Falha ao criar o projeto. ' + (err.message || ''));
  }
});

renderSkills();

