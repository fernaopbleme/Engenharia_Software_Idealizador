const API_BASE = "http://localhost:8000";

// Mapeamento de níveis para português
const levelNames = {
    "beginner": "Iniciante",
    "intermediate": "Intermediário",
    "advanced": "Avançado"
};

// Mapeamento de tag_id para nomes
const TAG_MAP = {
    1: "JavaScript",
    2: "React",
    3: "DevOps",
    4: "Docker",
    5: "Design UI",
    6: "Figma"
};

// Função para obter o ID do projeto da URL
function getProjetoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Função para mostrar/ocultar elementos
function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

// Função principal para carregar o projeto
async function carregarProjeto(id) {
    try {
        // Carrega os dados do projeto
        const resProjeto = await fetch(`${API_BASE}/projects/${id}`);
        if (!resProjeto.ok) throw new Error('Projeto não encontrado');
        const projeto = await resProjeto.json();
        
        // Preenche os dados do projeto
        document.getElementById('titulo-projeto').textContent = projeto.title || 'Sem título';
        document.getElementById('descricao-projeto').textContent = projeto.description || 'Sem descrição';
        
        // Categoria
        if (projeto.category) {
            document.getElementById('categoria-projeto').innerHTML = 
                `<span class="font-medium">Categoria:</span> ${projeto.category}`;
        }

        // Tags/Skills
        const tagsDiv = document.getElementById('tags-projeto');
        if (projeto.tags && projeto.tags.length > 0) {
            projeto.tags.forEach(tag => {
                const tagName = TAG_MAP[tag.tag_id] || `Tag ${tag.tag_id}`;
                const levelName = levelNames[tag.skill_level] || tag.skill_level;
                const tagElement = document.createElement('span');
                tagElement.className = 'bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium';
                tagElement.textContent = `${tagName} (${levelName})`;
                tagsDiv.appendChild(tagElement);
            });
        } else {
            tagsDiv.innerHTML = '<span class="text-gray-500 text-sm">Nenhuma habilidade especificada</span>';
        }
        
        // Carrega colaboradores inscritos no projeto
        await carregarColaboradoresInscritosNoProjeto(id);
        
        // Atualiza área de IA com os IDs
        const resInscritos = await fetch(`${API_BASE}/colaboradores/inscritos/${id}`);
        if (resInscritos.ok) {
            const dataInscritos = await resInscritos.json();
            atualizarAreaIA(dataInscritos.colaboradores || []);
        }
        
        // Esconde loading e mostra conteúdo
        hideElement('loading');
        showElement('project-content');
        
    } catch (error) {
        console.error('Erro ao carregar projeto:', error);
        hideElement('loading');
        hideElement('project-content');
        showElement('error');
        document.querySelector('#error p').textContent = `Erro ao carregar projeto: ${error.message}`;
    }
}

// Função para carregar colaboradores inscritos no projeto
async function carregarColaboradoresInscritosNoProjeto(projectId) {
    const lista = document.getElementById('colaboradores-lista');
    lista.innerHTML = '';
    
    try {
        const res = await fetch(`${API_BASE}/colaboradores/inscritos/${projectId}`);
        if (!res.ok) throw new Error('Erro ao carregar colaboradores inscritos');
        const data = await res.json();
        
        const colaboradores = data.colaboradores || [];
        
        // Atualiza o contador
        document.getElementById('count-colab').textContent = colaboradores.length;
        
        if (colaboradores.length === 0) {
            showElement('empty-colab');
            hideElement('colaboradores-lista');
            return;
        }
        
        hideElement('empty-colab');
        
        // Renderiza cada colaborador
        colaboradores.forEach(colab => {
            const div = document.createElement('div');
            div.className = 'border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors';
            
            // Renderizar habilidades
            const habilidadesHtml = colab.skills && colab.skills.length > 0 
                ? colab.skills.map(habilidade => `
                    <span class="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                        ${habilidade.nome} - ${levelNames[habilidade.nivel] || habilidade.nivel}
                    </span>
                `).join('')
                : '<span class="text-gray-400 text-sm">Nenhuma habilidade cadastrada</span>';
            
            div.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-1">${colab.nome}</h3>
                        <p class="text-gray-600 mb-1">${colab.cargo}</p>
                        <p class="text-sm text-gray-500 mb-2">${colab.email}</p>
                        ${colab.level ? `
                            <span class="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                                Nível: ${levelNames[colab.level] || colab.level}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${habilidadesHtml}
                </div>
            `;
            lista.appendChild(div);
        });
        
    } catch (error) {
        console.error('Erro ao carregar colaboradores inscritos:', error);
        lista.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p class="text-red-700">Erro ao carregar colaboradores inscritos: ${error.message}</p>
            </div>
        `;
    }
}

// Função para atualizar área de IA com IDs dos colaboradores
function atualizarAreaIA(colaboradores) {
    // Extrair IDs dos colaboradores
    const colaboradoresIds = colaboradores.map(colab => colab.id);
    
    // Atualizar área de IA com os IDs
    const idsElement = document.getElementById('colaboradores-ids');
    if (colaboradoresIds.length > 0) {
        idsElement.textContent = colaboradoresIds.join(', ');
    } else {
        idsElement.textContent = 'Nenhum colaborador inscrito';
    }
    
    // Preparar dados para o microsserviço de IA
    // O container está pronto para receber a integração
    // Expor os IDs globalmente para facilitar a integração
    window.colaboradoresIds = colaboradoresIds;
    window.colaboradoresInscritos = colaboradores;
    
    console.log('Colaboradores inscritos carregados:', colaboradores);
    console.log('IDs disponíveis para IA:', colaboradoresIds);
}

// Executa ao carregar a página
window.onload = () => {
    const id = getProjetoId();
    if (id) {
        carregarProjeto(id);
    } else {
        hideElement('loading');
        showElement('error');
        document.querySelector('#error p').textContent = 'ID do projeto não fornecido na URL. Use: ?id=1, ?id=2 ou ?id=3';
    }
};

