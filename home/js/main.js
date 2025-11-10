import { ensureSessionFromLegacy, getSession, clearSession } from "./session.js";
import {
  carregarProjetos,
  renderizarProjetos,
  filtrarProjetosPorTermo,
} from "./projetos.js";
import { mostrarMensagem } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const projectsContainer = document.getElementById("projectsContainer");
  const colaboradoresContainer = document.getElementById("colaboradoresContainer");
  const projectSuggestions = document.getElementById("projectSuggestions");
  const whoamiEl = document.getElementById("whoami");
  const logoutBtn = document.getElementById("logoutBtn");

  let projetosCache = [];

  ensureSessionFromLegacy();
  atualizarCabecalho();
  carregarProjetosSeAutenticado();
  inicializarEventos();

  function atualizarCabecalho() {
    const session = getSession();
    if (session?.email) {
      if (whoamiEl) {
        whoamiEl.textContent = `Olá, ${session.email}`;
        whoamiEl.classList.remove("hidden");
      }
      if (logoutBtn) logoutBtn.classList.remove("hidden");
    } else {
      if (whoamiEl) whoamiEl.classList.add("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
    }
  }

  async function carregarProjetosSeAutenticado() {
    const session = getSession();
    if (!session?.email || !session?.token) {
      mostrarMensagem(
        projectsContainer,
        `Faça login para ver seus projetos. <a href="../login/login.html" class="text-violet-700 hover:underline">Entrar</a>`
      );
      return;
    }

    try {
      projetosCache = await carregarProjetos(projectsContainer);
    } catch (error) {
      console.error(error);
      mostrarMensagem(projectsContainer, "Erro ao carregar projetos.");
    }
  }

  function inicializarEventos() {
    if (searchBtn) {
      searchBtn.addEventListener("click", lidarComBusca);
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const termo = searchInput.value;
        atualizarSugestoes(termo);
        aplicarFiltro(termo);
      });

      searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          esconderSugestoes();
          lidarComBusca();
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        clearSession();
        window.location.href = "../login/login.html";
      });
    }

    if (projectSuggestions) {
      projectSuggestions.addEventListener("click", (event) => {
        const alvo = event.target.closest("button[data-id]");
        if (!alvo) return;
        const projetoId = alvo.dataset.id;
        const projetoTitulo = alvo.dataset.title || "";
        if (searchInput) {
          searchInput.value = projetoTitulo;
        }
        esconderSugestoes();
        aplicarFiltro(projetoTitulo, projetoId);
      });
    }

    document.addEventListener("click", (event) => {
      if (
        projectSuggestions &&
        !projectSuggestions.classList.contains("hidden") &&
        !projectSuggestions.contains(event.target) &&
        event.target !== searchInput
      ) {
        esconderSugestoes();
      }
    });
  }

  function lidarComBusca() {
    if (!searchInput) return;
    esconderSugestoes();
    const termo = searchInput.value;
    if (!termo.trim()) {
      colaboradoresContainer.classList.add("hidden");
      colaboradoresContainer.innerHTML = "";
      renderizarProjetos(projetosCache, projectsContainer);
      return;
    }
    colaboradoresContainer.classList.add("hidden");
    colaboradoresContainer.innerHTML = "";
    const filtrados = filtrarProjetosPorTermo(projetosCache, termo);
    renderizarProjetos(filtrados, projectsContainer);
  }

  function aplicarFiltro(termo, projetoIdForcado) {
    colaboradoresContainer.classList.add("hidden");
    colaboradoresContainer.innerHTML = "";

    let lista = projetosCache;
    if (projetoIdForcado) {
      lista = projetosCache.filter(
        (projeto) => String(projeto.id) === String(projetoIdForcado)
      );
    } else if (termo && termo.trim()) {
      lista = filtrarProjetosPorTermo(projetosCache, termo);
    }

    renderizarProjetos(lista, projectsContainer);
  }

  function atualizarSugestoes(termo) {
    if (!projectSuggestions) return;
    const termoNormalizado = termo.trim();
    if (!termoNormalizado) {
      esconderSugestoes();
      return;
    }

    const resultados = filtrarProjetosPorTermo(projetosCache, termoNormalizado).slice(0, 6);

    if (!resultados.length) {
      esconderSugestoes();
      return;
    }

    projectSuggestions.innerHTML = resultados
      .map(
        (projeto) => `
          <button
            type="button"
            data-id="${projeto.id}"
            data-title="${(projeto.title || "Sem título").replace(/"/g, "&quot;")}"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
          >
            <span class="block font-medium text-gray-900">${projeto.title || "Sem título"}</span>
            <span class="block text-xs text-gray-500 truncate">${projeto.description || "Sem descrição"}</span>
          </button>
        `
      )
      .join("");

    projectSuggestions.classList.remove("hidden");
  }

  function esconderSugestoes() {
    if (!projectSuggestions) return;
    projectSuggestions.classList.add("hidden");
    projectSuggestions.innerHTML = "";
  }
});

