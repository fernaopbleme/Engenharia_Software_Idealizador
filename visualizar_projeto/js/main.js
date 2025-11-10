"use strict";

import { ensureSessionFromLegacy, getSession } from "../../home/js/session.js";
import {
  getProjetoId,
  showElement,
  hideElement,
  renderSuggestions,
  setSuggestionsLoading,
  renderSuggestionError,
  stringValida,
  capitalizarNome,
  formatSkillLevel,
  extrairNomeDoEmail,
} from "./utils.js";
import {
  fetchProjeto,
  fetchColaboradoresDoProjeto,
  enviarProjetoParaIa,
  fetchTodosColaboradores,
  adicionarColaboradorAoProjeto,
} from "./services.js";

let projetoAtual = null;
let colaboradoresAtuais = [];
let colaboradoresGlobaisRaw = [];
let colaboradoresGlobaisNormalizados = [];
let todosColaboradoresCarregados = false;
let carregandoColaboradoresGlobais = false;
let searchInputColaboradores = null;
let sugestoesDropdownColaboradores = null;
let colaboradorSelecionadoParaAdicionar = null;
let botaoAdicionarColaborador = null;
let sugestaoSelecionadaEl = null;

document.addEventListener("DOMContentLoaded", async () => {
  ensureSessionFromLegacy();
  atualizarCabecalho();

  const projetoId = getProjetoId();
  if (!projetoId) {
    exibirErro("ID do projeto não fornecido na URL.");
    return;
  }

  inicializarBuscaColaboradores();
  await carregarProjeto(projetoId);

  const btnSugestoes = document.getElementById("btnSugestoes");
  if (btnSugestoes) {
    btnSugestoes.addEventListener("click", handleGerarSugestoes);
  }
});

async function carregarProjeto(id) {
  try {
    projetoAtual = await fetchProjeto(id);
    if (!projetoAtual) throw new Error("Projeto não encontrado");

    renderProjeto(projetoAtual);

    colaboradoresAtuais = await fetchColaboradoresDoProjeto(id);
    renderColaboradores(colaboradoresAtuais);
    atualizarAreaIA(colaboradoresAtuais);

    botaoAdicionarColaborador = document.getElementById(
      "btnAdicionarColaborador"
    );
    if (botaoAdicionarColaborador) {
      botaoAdicionarColaborador.disabled = true;
      botaoAdicionarColaborador.addEventListener(
        "click",
        handleAdicionarColaborador
      );
    }

    hideElement("loading");
    showElement("project-content");
  } catch (error) {
    console.error(error);
    exibirErro(`Erro ao carregar: ${error.message}`);
  }
}

function renderProjeto(projeto) {
  const tituloEl = document.getElementById("titulo-projeto");
  const descricaoEl = document.getElementById("descricao-projeto");
  const categoriaEl = document.getElementById("categoria-projeto");

  if (tituloEl) tituloEl.textContent = projeto?.title || "Sem título";
  if (descricaoEl)
    descricaoEl.textContent = projeto?.description || "Sem descrição";
  if (categoriaEl) {
    categoriaEl.innerHTML = `<span class="font-medium">Categoria:</span> ${
      projeto?.category || "Sem categoria"
    }`;
  }

  renderTags(projeto);
}

function renderTags(projeto) {
  const tagsDiv = document.getElementById("tags-projeto");
  if (!tagsDiv) return;

  tagsDiv.innerHTML = "";
  const tags = projeto?.tags;

  if (!Array.isArray(tags) || !tags.length) {
    tagsDiv.innerHTML =
      '<span class="text-gray-500 text-sm">Nenhuma habilidade especificada.</span>';
    return;
  }

  tags.forEach((tag) => {
    const tagName =
      tag?.name || tag?.tag_name || tag?.tag_id || tag?.titulo || tag?.title;
    if (!tagName) return;

    const tagElement = document.createElement("span");
    tagElement.className =
      "bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium";
    tagElement.textContent = tagName;
    tagsDiv.appendChild(tagElement);
  });
}

function renderColaboradores(colaboradores, filtroTermo = "") {
  const lista = document.getElementById("colaboradores-lista");
  const emptyEl = document.getElementById("empty-colab");
  if (!lista) return;

  lista.innerHTML = "";

  if (!colaboradores.length) {
    if (filtroTermo) {
      emptyEl?.classList.add("hidden");
      lista.innerHTML = `
        <div class="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
          Nenhum colaborador encontrado para "<span class="font-semibold text-gray-700">${filtroTermo}</span>".
        </div>
      `;
      return;
    }
    emptyEl?.classList.remove("hidden");
    return;
  }

  emptyEl?.classList.add("hidden");

  colaboradores.forEach((colab) => {
    const cardData = {
      ...colab,
      estaNoProjeto:
        colab.estaNoProjeto !== undefined ? colab.estaNoProjeto : true,
    };
    lista.appendChild(renderizarColaboradorCard(cardData));
  });
}

function renderizarColaboradorCard(colab) {
  const card = document.createElement("div");
  card.className =
    "border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition";

  const skillLabel = formatSkillLevel(colab.skillLevel);

  card.innerHTML = `
    <h3 class="text-lg font-medium text-gray-900 mb-1">${colab.nome}</h3>
    <p class="text-sm text-gray-600 mb-2">${colab.email}</p>
    <p class="text-sm text-gray-500">
      Skill: ${capitalizarNome(colab.skillName)}${
    skillLabel ? ` (${skillLabel})` : ""
  }
    </p>
    ${
      colab.estaNoProjeto
        ? ""
        : '<p class="text-xs text-amber-600 mt-2">Não inscrito neste projeto</p>'
    }
  `;

  return card;
}

async function handleGerarSugestoes(event) {
  if (!projetoAtual) return;

  const button = event.currentTarget;
  const container = document.getElementById("sugestoes-container");
  setSuggestionsLoading(container);

  button.disabled = true;
  button.textContent = "Gerando...";

  try {
    const suggestions = await enviarProjetoParaIa(
      projetoAtual,
      colaboradoresAtuais
    );
    renderSuggestions(container, suggestions);
  } catch (error) {
    console.error("Erro ao gerar sugestões:", error);
    renderSuggestionError(container, error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Gerar Sugestões";
  }
}

function inicializarBuscaColaboradores() {
  searchInputColaboradores = document.getElementById("colaboradoresSearch");
  sugestoesDropdownColaboradores = document.getElementById(
    "colaboradoresSuggestions"
  );

  if (!searchInputColaboradores || !sugestoesDropdownColaboradores) return;

  searchInputColaboradores.addEventListener("input", async (event) => {
    await aplicarFiltroColaboradores(event.target.value || "");
  });

  searchInputColaboradores.addEventListener("focus", async (event) => {
    const termoAtual = event.target.value || "";
    if (termoAtual.trim()) {
      await aplicarFiltroColaboradores(termoAtual);
    }
  });

  sugestoesDropdownColaboradores.addEventListener("click", (event) => {
    const botao = event.target.closest("button[data-id]");
    if (!botao) return;

    const email = botao.dataset.email
      ? decodeURIComponent(botao.dataset.email)
      : "";
    const nome = botao.dataset.nome
      ? decodeURIComponent(botao.dataset.nome)
      : "";
    const idColab = botao.dataset.id
      ? decodeURIComponent(botao.dataset.id)
      : null;
    const estaNoProjeto = botao.dataset.inscrito === "1";

    marcarSugestaoSelecionada(botao);

    if (searchInputColaboradores) {
      searchInputColaboradores.value = nome;
    }

    if (estaNoProjeto) {
      colaboradorSelecionadoParaAdicionar = null;
      if (botaoAdicionarColaborador) botaoAdicionarColaborador.disabled = true;
      highlightColaboradorCard(email, idColab);
      renderMensagemColaboradorNoProjeto(nome);
      return;
    }

    colaboradorSelecionadoParaAdicionar =
      colaboradoresGlobaisNormalizados.find((colab) => {
        if (colab.id && idColab) {
          return String(colab.id) === String(idColab);
        }
        if (colab.email && email) {
          return colab.email.toLowerCase() === email.toLowerCase();
        }
        return false;
      }) || {
        id: idColab,
        email,
        nome,
        estaNoProjeto: false,
      };

    if (botaoAdicionarColaborador) botaoAdicionarColaborador.disabled = false;
    renderMensagemColaboradorForaProjeto(nome);
  });

  document.addEventListener("click", (event) => {
    if (!sugestoesDropdownColaboradores) return;
    if (
      event.target !== searchInputColaboradores &&
      !sugestoesDropdownColaboradores.contains(event.target)
    ) {
      esconderSugestoesColaboradores();
    }
  });
}

async function aplicarFiltroColaboradores(valor) {
  const termo = stringValida(valor)?.toLowerCase() || "";

  if (termo.trim() === "") {
    colaboradorSelecionadoParaAdicionar = null;
    limparSelecaoSugestoes();
    if (botaoAdicionarColaborador) botaoAdicionarColaborador.disabled = true;
    esconderSugestoesColaboradores();
    renderColaboradores(colaboradoresAtuais);
    return;
  }

  try {
    if (!todosColaboradoresCarregados && !carregandoColaboradoresGlobais) {
      carregandoColaboradoresGlobais = true;
      colaboradoresGlobaisRaw = await fetchTodosColaboradores();
      todosColaboradoresCarregados = true;
      carregandoColaboradoresGlobais = false;
    }
  } catch (error) {
    carregandoColaboradoresGlobais = false;
    console.error("Erro ao carregar colaboradores globais:", error);
    renderSugestoesDropdown([], termo);
    return;
  }

  if (!colaboradoresGlobaisRaw.length) {
    renderSugestoesDropdown([], termo);
    return;
  }

  colaboradoresGlobaisNormalizados = colaboradoresGlobaisRaw.map(
    normalizarColaboradorGlobal
  );

  const filtrados = colaboradoresGlobaisNormalizados.filter((colab) => {
    const nome = (colab.nome || "").toLowerCase();
    const email = (colab.email || "").toLowerCase();
    const skillsTexto = (colab.skills || [])
      .map((s) => `${s.nome} ${s.nivel}`.toLowerCase())
      .join(" ");
    return (
      nome.includes(termo) ||
      email.includes(termo) ||
      skillsTexto.includes(termo)
    );
  });

  renderSugestoesDropdown(filtrados.slice(0, 12), termo);
}

function normalizarColaboradorGlobal(colab) {
  const emailOriginal = stringValida(colab?.email) || "";
  const emailNormalizado = emailOriginal.trim().toLowerCase();
  const nome = capitalizarNome(
    stringValida(colab?.nome) ||
      stringValida(colab?.name) ||
      extrairNomeDoEmail(emailOriginal) ||
      "Colaborador"
  );

  const listaSkills = Array.isArray(colab?.skills) ? colab.skills : [];

  const skillsNormalizadas = listaSkills
    .map((skill) => {
      const nomeSkill =
        stringValida(skill?.nome) ||
        stringValida(skill?.name) ||
        stringValida(skill?.titulo) ||
        stringValida(skill?.title) ||
        "";
      const nivelSkill = formatSkillLevel(
        stringValida(skill?.nivel) || stringValida(skill?.level) || ""
      );
      if (!nomeSkill) return null;
      return { nome: nomeSkill, nivel: nivelSkill };
    })
    .filter(Boolean);

  const primeiraSkill = skillsNormalizadas.length
    ? skillsNormalizadas[0]
    : null;

  const skillName = primeiraSkill?.nome || "Habilidade";
  const skillLevel = primeiraSkill?.nivel || "";

  const skillsResumo = skillsNormalizadas.length
    ? skillsNormalizadas
        .map((skill) => (skill.nivel ? `${skill.nome} (${skill.nivel})` : skill.nome))
        .join(", ")
    : stringValida(colab?.skill) || "Sem habilidades cadastradas";

  const idNormalizado = String(
    colab?.id ??
      colab?.colaborador_id ??
      colab?.collaborator_id ??
      colab?.colaboradorId ??
      colab?.collaboratorId ??
      ""
  ).trim();

  const estaNoProjeto = colaboradoresAtuais.some((colProj) => {
    const projId = String(colProj.id ?? "").trim();
    const projEmail = (colProj.email || "").trim().toLowerCase();

    if (projId && idNormalizado && projId === idNormalizado) return true;
    if (projEmail && emailNormalizado && projEmail === emailNormalizado) return true;
    return false;
  });

  return {
    id: idNormalizado || null,
    nome,
    email: emailOriginal || "E-mail não informado",
    skillName,
    skillLevel,
    skillLevelLabel: formatSkillLevel(skillLevel),
    skillsResumo,
    skills: skillsNormalizadas,
    estaNoProjeto,
  };
}

function atualizarAreaIA(colaboradores) {
  const idsElement = document.getElementById("colaboradores-ids");
  if (!idsElement) return;

  const ids = colaboradores.map((colab) => colab.id).filter(Boolean);
  idsElement.textContent = ids.length
    ? ids.join(", ")
    : "Nenhum colaborador inscrito";
}

function atualizarCabecalho() {
  const session = getSession();
  const whoamiEl = document.getElementById("whoami");
  if (!whoamiEl) return;
  if (session?.email) {
    whoamiEl.textContent = `Olá, ${session.email}`;
    whoamiEl.classList.remove("hidden");
  } else {
    whoamiEl.textContent = "";
    whoamiEl.classList.add("hidden");
  }
}

function exibirErro(mensagem) {
  hideElement("loading");
  showElement("error");
  const errorMsg = document.getElementById("errorMsg");
  if (errorMsg) errorMsg.textContent = mensagem;
}

async function handleAdicionarColaborador() {
  if (!botaoAdicionarColaborador) return;
  if (!projetoAtual?.id) {
    renderSuggestionError(
      document.getElementById("colaboradoresSuggestions"),
      "Projeto inválido."
    );
    return;
  }

  if (!colaboradorSelecionadoParaAdicionar?.id) {
    renderSuggestionError(
      document.getElementById("colaboradoresSuggestions"),
      "Selecione um colaborador no campo de busca."
    );
    return;
  }

  botaoAdicionarColaborador.disabled = true;
  botaoAdicionarColaborador.textContent = "Adicionando...";

  let ocorreuErro = false;

  try {
    await adicionarColaboradorAoProjeto(
      colaboradorSelecionadoParaAdicionar.id,
      projetoAtual.id
    );

    colaboradoresAtuais = await fetchColaboradoresDoProjeto(projetoAtual.id);
    renderColaboradores(colaboradoresAtuais);
    atualizarAreaIA(colaboradoresAtuais);

    const emailLower = (colaboradorSelecionadoParaAdicionar.email || "")
      .trim()
      .toLowerCase();
    colaboradoresGlobaisRaw = colaboradoresGlobaisRaw.map((colab) => {
      const colabId = colab?.id ?? colab?.colaborador_id ?? colab?.collaborator_id;
      const idMatch =
        colabId != null &&
        String(colabId).trim() ===
          String(colaboradorSelecionadoParaAdicionar.id || "").trim();
      const emailMatch =
        colab?.email && colab.email.trim().toLowerCase() === emailLower;

      if (idMatch || emailMatch) {
        return {
          ...colab,
          id:
            colab?.id ??
            colab?.colaborador_id ??
            colab?.collaborator_id ??
            colaboradorSelecionadoParaAdicionar.id,
          email: colab?.email || colaboradorSelecionadoParaAdicionar.email,
        };
      }
      return colab;
    });

    highlightColaboradorCard(
      colaboradorSelecionadoParaAdicionar.email,
      colaboradorSelecionadoParaAdicionar.id
    );
    mostrarMensagemSucesso("Colaborador adicionado ao projeto!");

    colaboradorSelecionadoParaAdicionar = null;
    if (searchInputColaboradores) {
      searchInputColaboradores.value = "";
    }
    esconderSugestoesColaboradores();
  } catch (error) {
    ocorreuErro = true;
    console.error("Erro ao adicionar colaborador:", error);
    renderSuggestionError(
      document.getElementById("colaboradoresSuggestions"),
      error.message || "Não foi possível adicionar o colaborador."
    );
  } finally {
    botaoAdicionarColaborador.textContent = "Adicionar";
    if (!ocorreuErro) {
      botaoAdicionarColaborador.disabled = true;
      limparSelecaoSugestoes();
    } else {
      botaoAdicionarColaborador.disabled = false;
    }
  }
}

function mostrarMensagemSucesso(texto) {
  if (!sugestoesDropdownColaboradores) return;
  sugestoesDropdownColaboradores.innerHTML = `
    <div class="px-4 py-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
      ${escapeHtml(texto || "Ação concluída com sucesso.")}
    </div>
  `;
  sugestoesDropdownColaboradores.classList.remove("hidden");
  setTimeout(() => esconderSugestoesColaboradores(), 2000);
}

function highlightColaboradorCard(email, id) {
  let card = null;
  if (email) {
    card = document.querySelector(
      `[data-colab-email="${email.toLowerCase()}"]`
    );
  }
  if (!card && id) {
    card = document.querySelector(
      `[data-colab-id="${String(id)}"]`
    );
  }
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  const originalShadow = card.style.boxShadow;
  card.style.boxShadow = "0 0 0 3px rgba(109, 40, 217, 0.35)";
  setTimeout(() => {
    card.style.boxShadow = originalShadow || "";
  }, 2000);
}

function renderSugestoesDropdown(colaboradores, termo) {
  if (!sugestoesDropdownColaboradores) return;

  if (!colaboradores.length) {
    sugestoesDropdownColaboradores.innerHTML = `
      <p class="px-4 py-3 text-sm text-gray-500">Nenhum colaborador encontrado.</p>
    `;
    sugestoesDropdownColaboradores.classList.remove("hidden");
    limparSelecaoSugestoes();
    return;
  }

  const termoLower = (termo || "").toLowerCase();
  const selecionadoAtual = colaboradorSelecionadoParaAdicionar;

  sugestoesDropdownColaboradores.innerHTML = colaboradores
    .map((colab) => {
      const nomeDestacado = destacarTermo(colab.nome, termoLower);
      const emailDestacado = destacarTermo(colab.email, termoLower);
      const skillsDestacadas = destacarTermo(colab.skillsResumo, termoLower);
      const badge = colab.estaNoProjeto
        ? '<span class="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Já no projeto</span>'
        : '<span class="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Não inscrito</span>';

      const emailDataset = colab.email
        ? encodeURIComponent(colab.email)
        : "";
      const nomeDataset = encodeURIComponent(colab.nome || "");
      const idDataset = colab.id ? encodeURIComponent(colab.id) : "";

      const isSelecionado =
        selecionadoAtual &&
        ((selecionadoAtual.id && colab.id &&
          String(selecionadoAtual.id) === String(colab.id)) ||
          (selecionadoAtual.email && colab.email &&
            selecionadoAtual.email.toLowerCase() === colab.email.toLowerCase()));

      const highlightClasses = isSelecionado
        ? "bg-violet-50 border-violet-300 ring-1 ring-violet-300 text-violet-800"
        : "border-transparent";

      return `
        <button
          type="button"
          data-id="${idDataset}"
          data-email="${emailDataset}"
          data-nome="${nomeDataset}"
          data-inscrito="${colab.estaNoProjeto ? "1" : "0"}"
          class="w-full text-left px-4 py-3 transition flex items-start justify-between gap-3 border ${highlightClasses}"
        >
          <span class="flex-1">
            <span class="block text-sm font-semibold text-gray-900">${nomeDestacado}</span>
            <span class="block text-xs text-gray-500">${emailDestacado}</span>
            <span class="block text-xs text-violet-700 mt-1">${skillsDestacadas}</span>
          </span>
          ${badge}
        </button>
      `;
    })
    .join("");

  sugestoesDropdownColaboradores.classList.remove("hidden");

  if (selecionadoAtual) {
    const seletorPorId = selecionadoAtual.id
      ? `[data-id="${encodeURIComponent(selecionadoAtual.id)}"]`
      : null;
    const seletorPorEmail = selecionadoAtual.email
      ? `[data-email="${encodeURIComponent(selecionadoAtual.email)}"]`
      : null;
    const botaoSelecionado = sugestoesDropdownColaboradores.querySelector(
      seletorPorId || seletorPorEmail
    );
    if (botaoSelecionado) {
      marcarSugestaoSelecionada(botaoSelecionado);
    } else {
      limparSelecaoSugestoes();
    }
  }
}

function esconderSugestoesColaboradores() {
  if (!sugestoesDropdownColaboradores) return;
  sugestoesDropdownColaboradores.classList.add("hidden");
  sugestoesDropdownColaboradores.innerHTML = "";
  limparSelecaoSugestoes();
}

function renderMensagemColaboradorForaProjeto(nome) {
  if (!sugestoesDropdownColaboradores) return;
  if (botaoAdicionarColaborador) botaoAdicionarColaborador.disabled = false;
  sugestoesDropdownColaboradores.innerHTML = `
    <div class="px-4 py-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
      ${escapeHtml(nome || "Esse colaborador")} ainda não está inscrito neste projeto.
    </div>
  `;
  sugestoesDropdownColaboradores.classList.remove("hidden");
}

function renderMensagemColaboradorNoProjeto(nome) {
  if (!sugestoesDropdownColaboradores) return;
  colaboradorSelecionadoParaAdicionar = null;
  if (botaoAdicionarColaborador) botaoAdicionarColaborador.disabled = true;
  sugestoesDropdownColaboradores.innerHTML = `
    <div class="px-4 py-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
      ${escapeHtml(nome || "Esse colaborador")} já está inscrito neste projeto.
    </div>
  `;
  sugestoesDropdownColaboradores.classList.remove("hidden");
}

function marcarSugestaoSelecionada(botao) {
  if (!sugestoesDropdownColaboradores) return;
  if (sugestaoSelecionadaEl && sugestaoSelecionadaEl !== botao) {
    sugestaoSelecionadaEl.classList.remove(
      "bg-violet-50",
      "border-violet-300",
      "ring-1",
      "ring-violet-300",
      "text-violet-800"
    );
    sugestaoSelecionadaEl.classList.add("border-transparent");
  }

  sugestaoSelecionadaEl = botao;
  if (!botao) return;
  botao.classList.remove("border-transparent");
  botao.classList.add(
    "bg-violet-50",
    "border-violet-300",
    "ring-1",
    "ring-violet-300",
    "text-violet-800"
  );
}

function limparSelecaoSugestoes() {
  if (!sugestaoSelecionadaEl) return;
  sugestaoSelecionadaEl.classList.remove(
    "bg-violet-50",
    "border-violet-300",
    "ring-1",
    "ring-violet-300",
    "text-violet-800"
  );
  sugestaoSelecionadaEl.classList.add("border-transparent");
  sugestaoSelecionadaEl = null;
}

function escapeHtml(texto) {
  if (!texto) return "";
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function destacarTermo(texto, termoLower) {
  const seguro = escapeHtml(texto || "");
  if (!seguro || !termoLower) return seguro;
  try {
    const regex = new RegExp(`(${escapeRegExp(termoLower)})`, "ig");
    return seguro.replace(
      regex,
      '<mark class="bg-violet-100 text-violet-700">$1</mark>'
    );
  } catch {
    return seguro;
  }
}

function escapeRegExp(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

