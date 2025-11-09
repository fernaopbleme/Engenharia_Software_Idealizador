const API_PROJETOS_BASE = "https://bdprojetos.azurewebsites.net";
const API_COLABORADORES_BASE = "http://localhost:8002"; // API de colaboradores
const AUTH_KEY = "auth.user";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const projectsContainer = document.getElementById("projectsContainer");
const colaboradoresContainer = document.getElementById("colaboradoresContainer");
const addMemberBtn = document.getElementById("addMemberBtn");

const levelNames = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

function obterSessao() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

function mostrarMensagem(container, mensagem) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <p class="text-gray-500 text-center">${mensagem}</p>
    </div>
  `;
}

function construirCabecalhosProjetos() {
  const sessao = obterSessao();
  const headers = { "Content-Type": "application/json" };

  if (sessao?.email) {
    headers["X-User-Email"] = sessao.email;
  }
  if (sessao?.token) {
    headers["Authorization"] = `Bearer ${sessao.token}`;
  }

  return headers;
}

async function carregarProjetos() {
  const sessao = obterSessao();
  if (!sessao || !sessao.email) {
    mostrarMensagem(projectsContainer, "Faça login para ver seus projetos.");
    return;
  }

  try {
    const resposta = await fetch(`${API_PROJETOS_BASE}/projects?mine=1`, {
      headers: construirCabecalhosProjetos(),
    });

    if (!resposta.ok) {
      let mensagem = `Erro ${resposta.status}`;
      try {
        const detalhe = await resposta.json();
        if (detalhe?.detail) mensagem = detalhe.detail;
      } catch {
        // ignorar parsing
      }
      throw new Error(mensagem);
    }

    const projetos = await resposta.json();
    renderizarProjetos(projetos);
  } catch (error) {
    console.error(error);
    mostrarMensagem(projectsContainer, "Erro ao carregar projetos.");
  }
}

function renderizarProjetos(projects) {
  projectsContainer.innerHTML = "";

  if (!projects?.length) {
    mostrarMensagem(
      projectsContainer,
      `Nenhum projeto encontrado. <a href="criar_projeto.html" class="text-violet-700 hover:underline">Criar primeiro projeto</a>`
    );
    return;
  }

  projects.forEach(async (project) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl shadow-sm border border-gray-200 p-8";

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
      <button type="button" class="botao-colaboradores bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-800 transition">
        Ver colaboradores
      </button>
      <div class="colaboradores mt-4"></div>
    `;

    projectsContainer.appendChild(card);

    const botao = card.querySelector(".botao-colaboradores");
    const containerColaboradores = card.querySelector(".colaboradores");

    botao.addEventListener("click", async () => {
      botao.disabled = true;
      const textoOriginal = botao.textContent;
      botao.textContent = "Carregando...";

      await carregarColaboradoresDoProjeto(project.id, containerColaboradores);

      botao.textContent = textoOriginal;
      botao.disabled = false;
    });
  });
}

async function carregarColaboradoresDoProjeto(projectId, container) {
  try {
    const res = await fetch(`${API_COLABORADORES_BASE}/colaboradores/inscritos/${projectId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const colaboradores = data.colaboradores || [];

    if (!colaboradores.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = `
      <div class="mt-4 flex flex-wrap gap-4">
        ${colaboradores
          .map((colab) => {
            const skill =
              colab.skills && colab.skills.length
                ? `${colab.skills[0].nome} - ${levelNames[colab.skills[0].nivel] || colab.skills[0].nivel}`
                : "Sem habilidades cadastradas";
            return `
              <div class="bg-gray-50 rounded-xl px-4 py-3 shadow-sm">
                <p class="font-semibold text-gray-900 text-sm">${colab.nome}</p>
                <p class="text-xs text-gray-600">${skill}</p>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="text-sm text-gray-500 mt-4">Não foi possível carregar os colaboradores.</p>`;
  }
}

async function listarColaboradores() {
  try {
    const res = await fetch(`${API_COLABORADORES_BASE}/colaboradores`);
    if (!res.ok) throw new Error();
    const colaboradores = await res.json();
    renderizarColaboradores(colaboradores);
  } catch (error) {
    console.error(error);
    mostrarMensagem(colaboradoresContainer, "Erro ao carregar colaboradores.");
  }
}

async function buscarColaboradores(termoBusca) {
  const termo = termoBusca.trim().toLowerCase();
  if (!termo) {
    colaboradoresContainer.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(`${API_COLABORADORES_BASE}/colaboradores`);
    if (!res.ok) throw new Error();
    const colaboradores = await res.json();

    const filtrados = colaboradores.filter((colab) => {
      const base = `${colab.nome} ${colab.email} ${colab.cargo}`.toLowerCase();
      const skills = (colab.skills || []).map((s) => s.nome.toLowerCase());
      return base.includes(termo) || skills.some((skill) => skill.includes(termo));
    });

    renderizarColaboradores(filtrados, termoBusca);
  } catch (error) {
    console.error(error);
    mostrarMensagem(colaboradoresContainer, "Erro ao buscar colaboradores.");
  }
}

function renderizarColaboradores(colaboradores, termoBusca) {
  colaboradoresContainer.classList.remove("hidden");

  if (!colaboradores.length) {
    mostrarMensagem(
      colaboradoresContainer,
      termoBusca
        ? `Nenhum colaborador encontrado para "${termoBusca}".`
        : "Nenhum colaborador cadastrado."
    );
    return;
  }

  colaboradoresContainer.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h3 class="text-xl font-bold text-gray-900 mb-6">
        ${
          termoBusca
            ? `Resultados para "${termoBusca}"`
            : `Todos os colaboradores (${colaboradores.length})`
        }
      </h3>
      <div class="space-y-4">
        ${colaboradores
          .map(
            (colab) => `
              <div class="border border-gray-200 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-gray-900">${colab.nome}</h4>
                <p class="text-sm text-gray-600">${colab.cargo}</p>
                <p class="text-xs text-gray-500 mb-2">${colab.email}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  ${
                    colab.skills?.length
                      ? colab.skills
                          .map(
                            (skill) => `
                              <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                ${skill.nome} - ${levelNames[skill.nivel] || skill.nivel}
                              </span>
                            `
                          )
                          .join("")
                      : '<span class="text-gray-400 text-xs">Nenhuma habilidade registrada.</span>'
                  }
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function lidarComBusca() {
  const value = searchInput.value;
  if (!value.trim()) {
    colaboradoresContainer.classList.add("hidden");
    return;
  }
  buscarColaboradores(value);
}

document.addEventListener("DOMContentLoaded", () => {
  carregarProjetos();
  searchBtn.addEventListener("click", lidarComBusca);
  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") lidarComBusca();
  });
  addMemberBtn.addEventListener("click", () => {
    listarColaboradores();
    colaboradoresContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

