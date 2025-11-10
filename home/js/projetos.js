import { getProjectsMine } from "./api.js";
import { mostrarMensagem } from "./utils.js";
import {
  carregarColaboradoresDoProjeto,
  renderColaboradoresProjeto,
} from "./colaboradores.js";

export async function carregarProjetos(projectsContainer) {
  const projetos = await getProjectsMine();
  renderizarProjetos(projetos, projectsContainer);
  return projetos;
}

export function renderizarProjetos(projetos, container) {
  container.innerHTML = "";

  if (!projetos?.length) {
    mostrarMensagem(
      container,
      `Nenhum projeto encontrado. <a href="../Criar_projeto/criar_projeto.html" class="text-violet-700 hover:underline">Criar primeiro projeto</a>`
    );
    return;
  }

  projetos.forEach((projeto) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl shadow-sm border border-gray-200 p-8";

    card.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2">${projeto.title || "Sem título"}</h3>
          <p class="text-gray-600 text-sm">${projeto.description || "Sem descrição"}</p>
        </div>
        <a href="../visualizar_projeto/pagina_projeto.html?id=${projeto.id}" class="text-violet-700 hover:text-violet-900 font-medium text-sm ml-4">
          Ver detalhes →
        </a>
      </div>
      <div class="colaboradores mt-6">
        <p class="text-sm text-gray-500">Carregando colaboradores...</p>
      </div>
    `;

    container.appendChild(card);

    const containerColaboradores = card.querySelector(".colaboradores");

    carregarColaboradoresDoProjeto(projeto.id)
      .then((colaboradores) =>
        renderColaboradoresProjeto(containerColaboradores, colaboradores)
      )
      .catch((error) => {
        console.error(error);
        containerColaboradores.innerHTML = `<p class="text-sm text-gray-500">Não foi possível carregar os colaboradores.</p>`;
      });
  });
}

export function filtrarProjetosPorTermo(projetos, termo) {
  const termoNormalizado = (termo || "").trim().toLowerCase();
  if (!termoNormalizado) return projetos;

  return (projetos || []).filter((projeto) => {
    const campos = [
      projeto?.title,
      projeto?.description,
      projeto?.category,
      Array.isArray(projeto?.tags)
        ? projeto.tags
            .map(
              (tag) =>
                tag?.name ||
                tag?.tag_name ||
                tag?.tag_id ||
                tag?.titulo ||
                tag?.title ||
                ""
            )
            .join(" ")
        : "",
    ];

    return campos.some((campo) =>
      typeof campo === "string" && campo.toLowerCase().includes(termoNormalizado)
    );
  });
}

