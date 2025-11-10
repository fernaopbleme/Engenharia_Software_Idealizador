import {
  getProjectMembers,
  getColaboradorById,
  getColaboradoresLista,
} from "./api.js";
import {
  mostrarMensagem,
  normalizarNivel,
  stringValida,
  obterInicialNome,
  capitalizarNome,
} from "./utils.js";

export async function carregarColaboradoresDoProjeto(projectId) {
  const resposta = await getProjectMembers(projectId);
  const membros = Array.isArray(resposta)
    ? resposta
    : resposta?.members || resposta?.results || [];

  return Promise.all(
    membros.map(async (membro) => {
      const detalhes = await obterColaboradorDetalhado(membro?.id);
      return {
        nome: obterNomeColaborador(membro, detalhes),
        skill: obterSkillColaborador(membro, detalhes),
      };
    })
  );
}

export function renderColaboradoresProjeto(container, colaboradores) {
  if (!colaboradores.length) {
    container.innerHTML = `<p class="text-sm text-gray-500">Nenhum colaborador inscrito.</p>`;
    return;
  }

  container.innerHTML = `
    <div class="flex flex-wrap gap-6 items-start">
      ${colaboradores.map(renderColaboradorCard).join("")}
    </div>
  `;
}

export async function listarColaboradores(container) {
  try {
    const colaboradores = await getColaboradoresLista();
    renderizarColaboradoresLista(container, colaboradores);
  } catch (error) {
    console.error(error);
    mostrarMensagem(container, "Erro ao carregar colaboradores.");
  }
}

export async function buscarColaboradores(termo, container) {
  const termoNormalizado = termo.trim().toLowerCase();
  if (!termoNormalizado) {
    container.classList.add("hidden");
    return;
  }

  try {
    const colaboradores = await getColaboradoresLista();
    const filtrados = colaboradores.filter((colab) => {
      const base = `${colab.nome} ${colab.email} ${colab.cargo}`.toLowerCase();
      const skills = (colab.skills || []).map((s) => (s.nome || "").toLowerCase());
      return (
        base.includes(termoNormalizado) ||
        skills.some((skill) => skill.includes(termoNormalizado))
      );
    });
    renderizarColaboradoresLista(container, filtrados, termo);
  } catch (error) {
    console.error(error);
    mostrarMensagem(container, "Erro ao buscar colaboradores.");
  }
}

function renderizarColaboradoresLista(container, colaboradores, termoBusca) {
  container.classList.remove("hidden");

  if (!colaboradores.length) {
    mostrarMensagem(
      container,
      termoBusca
        ? `Nenhum colaborador encontrado para "${termoBusca}".`
        : "Nenhum colaborador cadastrado."
    );
    return;
  }

  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h3 class="text-xl font-bold text-gray-900 mb-6">
        ${
          termoBusca
            ? `Resultados para "${termoBusca}"`
            : `Todos os colaboradores (${colaboradores.length})`
        }
      </h3>
      <div class="space-y-4">
        ${colaboradores.map(renderColaboradorListaItem).join("")}
      </div>
    </div>
  `;
}

async function obterColaboradorDetalhado(id) {
  if (!id) return null;
  try {
    return await getColaboradorById(id);
  } catch (error) {
    console.error(`Erro ao buscar colaborador ${id}:`, error);
    return null;
  }
}

function obterNomeColaborador(membro, detalhes) {
  const candidatos = [
    detalhes?.nome,
    detalhes?.name,
    detalhes?.full_name,
    detalhes?.fullName,
    detalhes?.display_name,
    detalhes?.displayName,
    detalhes?.usuario?.nome,
    detalhes?.usuario?.name,
    membro?.collaborator_name,
    membro?.nome,
    membro?.name,
  ];

  const nome = candidatos.find((valor) => typeof valor === "string" && valor.trim());
  if (nome) return capitalizarNome(nome.trim());

  const email =
    typeof detalhes?.email === "string"
      ? detalhes.email
      : typeof detalhes?.usuario?.email === "string"
      ? detalhes.usuario.email
      : typeof membro?.collaborator_email === "string"
      ? membro.collaborator_email
      : typeof membro?.email === "string"
      ? membro.email
      : null;

  if (email) {
    const [antesArroba] = email.split("@");
    if (!antesArroba) return email;
    const nomeNormalizado = antesArroba
      .replace(/[._-]+/g, " ")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    return capitalizarNome(nomeNormalizado) || email;
  }

  return "Colaborador";
}

function obterSkillColaborador(membro, detalhes) {
  const nomeDireto = stringValida(
    membro?.contributed_skill_name ||
      membro?.skill ||
      membro?.primary_skill ||
      membro?.primarySkill
  );

  if (nomeDireto) {
    const nivelDireto = normalizarNivel(
      membro?.contributed_skill_level ||
        membro?.primary_skill_level ||
        membro?.primarySkillLevel
    );
    return nivelDireto ? `${nomeDireto} - ${nivelDireto}` : nomeDireto;
  }

  const listaSkills =
    detalhes?.skills ||
    detalhes?.habilidades ||
    membro?.skills ||
    membro?.habilidades ||
    membro?.competencias ||
    membro?.user?.skills;

  if (Array.isArray(listaSkills) && listaSkills.length) {
    const skill = listaSkills[0];
    const nomeSkill =
      (typeof skill === "string" && skill) ||
      stringValida(skill?.nome) ||
      stringValida(skill?.name) ||
      stringValida(skill?.titulo) ||
      stringValida(skill?.title);
    if (nomeSkill) {
      const nivelSkill = normalizarNivel(skill?.nivel || skill?.level);
      return nivelSkill ? `${nomeSkill} - ${nivelSkill}` : nomeSkill;
    }
  }

  const skillUnica =
    stringValida(detalhes?.skill) ||
    stringValida(detalhes?.primary_skill) ||
    stringValida(detalhes?.primarySkill);

  if (skillUnica) return skillUnica;

  return "Sem habilidades cadastradas";
}

function renderColaboradorCard(colaborador) {
  const inicial = obterInicialNome(colaborador.nome);

  return `
    <div class="flex flex-col items-center text-center gap-2 w-24">
      <div
        class="h-14 w-14 rounded-full flex items-center justify-center text-white font-semibold uppercase shadow-sm"
        style="background: linear-gradient(135deg, #a855f7, #6366f1);"
      >
        ${inicial}
      </div>
      <p class="font-semibold text-gray-900 text-sm leading-tight">${colaborador.nome}</p>
      <p class="text-xs text-gray-600 leading-tight">${colaborador.skill}</p>
    </div>
  `;
}

function renderColaboradorListaItem(colab) {
  const habilidades =
    colab.skills?.length
      ? colab.skills
          .map((skill) => {
            const nome = stringValida(skill?.nome) || "Habilidade";
            const nivel = normalizarNivel(skill?.nivel || skill?.level);
            return `
              <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                ${nivel ? `${nome} - ${nivel}` : nome}
              </span>
            `;
          })
          .join("")
      : '<span class="text-gray-400 text-xs">Nenhuma habilidade registrada.</span>';

  return `
    <div class="border border-gray-200 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900">${colab.nome}</h4>
      <p class="text-sm text-gray-600">${colab.cargo || "Cargo não informado"}</p>
      <p class="text-xs text-gray-500 mb-2">${colab.email || "E-mail não informado"}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        ${habilidades}
      </div>
    </div>
  `;
}

