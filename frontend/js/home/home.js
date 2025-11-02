const API_BASE = "http://localhost:8000";
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const projectsContainer = document.getElementById("projectsContainer");
const colaboradoresContainer = document.getElementById("colaboradoresContainer");
const addMemberBtn = document.getElementById("addMemberBtn");

// Mapeamento de níveis para português
const levelNames = {
  "beginner": "Iniciante",
  "intermediate": "Intermediário",
  "intermediative": "Intermediário",
  "advanced": "Avançado"
};

async function listProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const projects = await res.json();
    await renderProjects(projects);
  } catch (e) {
    console.error("Erro ao carregar projetos:", e);
    projectsContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p class="text-gray-500 text-center">Erro ao carregar projetos. Verifique se a API mock está rodando.</p>
      </div>
    `;
  }
}

async function renderProjects(projects) {
  projectsContainer.innerHTML = "";
  if (!projects || projects.length === 0) {
    projectsContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p class="text-gray-500 text-center">Nenhum projeto encontrado. <a href="criar_projeto.html" class="text-violet-700 hover:underline">Criar primeiro projeto</a></p>
      </div>
    `;
    return;
  }
  
  for (const project of projects) {
    await renderProjectCard(project);
  }
}

async function renderProjectCard(project) {
  const card = document.createElement("div");
  card.className = "bg-white rounded-2xl shadow-sm border border-gray-200 p-8";

  // Buscar colaboradores inscritos no projeto
  let colaboradores = [];
  try {
    const res = await fetch(`${API_BASE}/colaboradores/inscritos/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      colaboradores = data.colaboradores || [];
    }
  } catch (e) {
    console.error(`Erro ao buscar colaboradores ${project.id}:`, e);
  }

  // Renderizar colaboradores inscritos
  const colaboradoresHtml = colaboradores.length > 0 ? `
    <div class="mt-4 flex flex-wrap gap-4">
      ${colaboradores.map(colab => {
        const habilidadePrincipal = colab.skills && colab.skills.length > 0 
          ? colab.skills[0] 
          : null;
        return `
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg shadow-md hover:scale-110 transition-transform cursor-pointer">
            ${colab.nome.charAt(0).toUpperCase()}
          </div>
          <div class="mt-2 text-center">
            <p class="font-semibold text-gray-900 text-xs truncate max-w-[80px]">${colab.nome}</p>
            ${habilidadePrincipal ? `
              <p class="text-xs text-gray-600 mt-0.5 truncate max-w-[80px]">
                ${habilidadePrincipal.nome}
              </p>
            ` : ''}
          </div>
        </div>
      `;
      }).join("")}
    </div>
  ` : '';

  card.innerHTML = `
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1">
        <h3 class="text-xl font-bold text-gray-900 mb-2">${project.title || "Sem título"}</h3>
        <p class="text-gray-600 text-sm">${project.description || "Sem descrição"}</p>
      </div>
      <a href="pagina_projeto.html?id=${project.id}" class="text-violet-700 hover:text-violet-900 font-medium text-sm ml-4">
        Ver detalhes →
      </a>
    </div>
    ${colaboradoresHtml}
  `;

  projectsContainer.appendChild(card);
}

async function listColaboradores() {
  try {
    const res = await fetch(`${API_BASE}/colaboradores`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const colaboradores = await res.json();
    renderColaboradores(colaboradores);
  } catch (e) {
    console.error("Erro ao carregar colaboradores:", e);
    colaboradoresContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p class="text-gray-500 text-center">Erro ao carregar colaboradores. Verifique se a API mock está rodando.</p>
      </div>
    `;
  }
}

async function searchColaboradores(query) {
  try {
    const res = await fetch(`${API_BASE}/colaboradores`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const colaboradores = await res.json();
    
    // Filtrar colaboradores por habilidades que correspondem à busca
    const queryLower = query.toLowerCase();
    const filtered = colaboradores.filter(colab => {
      // Buscar por nome, email, cargo ou habilidades
      const nomeMatch = colab.nome.toLowerCase().includes(queryLower);
      const emailMatch = colab.email.toLowerCase().includes(queryLower);
      const cargoMatch = colab.cargo.toLowerCase().includes(queryLower);
      const habilidadesMatch = colab.skills.some(habilidade => 
        habilidade.nome.toLowerCase().includes(queryLower)
      );
      
      return nomeMatch || emailMatch || cargoMatch || habilidadesMatch;
    });
    
    renderColaboradores(filtered, query);
  } catch (e) {
    console.error("Erro ao buscar colaboradores:", e);
    colaboradoresContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p class="text-gray-500 text-center">Erro ao buscar colaboradores. Verifique se a API mock está rodando.</p>
      </div>
    `;
  }
}

function renderColaboradores(colaboradores, searchQuery = null) {
  colaboradoresContainer.classList.remove("hidden");
  colaboradoresContainer.innerHTML = "";
  
  if (!colaboradores || colaboradores.length === 0) {
    colaboradoresContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p class="text-gray-500 text-center">
          ${searchQuery ? `Nenhum colaborador encontrado para "${searchQuery}".` : "Nenhum colaborador encontrado."}
        </p>
      </div>
    `;
    return;
  }

  const title = searchQuery 
    ? `<h3 class="text-xl font-bold text-gray-900 mb-6">Resultados para "${searchQuery}" (${colaboradores.length})</h3>`
    : `<h3 class="text-xl font-bold text-gray-900 mb-6">Todos os Colaboradores (${colaboradores.length})</h3>`;

  colaboradoresContainer.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      ${title}
      <div class="space-y-4">
        ${colaboradores.map(colab => `
          <div class="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-gray-900 mb-1">${colab.nome}</h4>
                <p class="text-sm text-gray-600 mb-1">${colab.cargo}</p>
                <p class="text-xs text-gray-500 mb-2">${colab.email}</p>
                ${colab.level ? `
                  <span class="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                    Nível: ${levelNames[colab.level] || colab.level}
                  </span>
                ` : ""}
              </div>
            </div>
            <div class="mt-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Habilidades:</p>
              <div class="flex flex-wrap gap-2">
                ${colab.skills && colab.skills.length > 0 ? colab.skills.map(habilidade => `
                  <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    ${habilidade.nome} - ${levelNames[habilidade.nivel] || habilidade.nivel}
                  </span>
                `).join("") : '<span class="text-gray-400 text-xs">Nenhuma habilidade cadastrada</span>'}
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function doSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    colaboradoresContainer.classList.add("hidden");
    listProjects();
    return;
  }
  
  // Buscar colaboradores
  searchColaboradores(q);
}

// Event Listeners
searchBtn.addEventListener("click", doSearch);
searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") doSearch(); });

addMemberBtn.addEventListener("click", () => {
  // Mostrar todos os colaboradores ao clicar em adicionar
  listColaboradores();
  // Rolar até a seção de colaboradores
  colaboradoresContainer.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Carregar projetos ao carregar a página
listProjects();

