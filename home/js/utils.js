export const levelNames = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export function mostrarMensagem(container, mensagem) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <p class="text-gray-500 text-center">${mensagem}</p>
    </div>
  `;
}

export function stringValida(valor) {
  return typeof valor === "string" && valor.trim() ? valor.trim() : "";
}

export function normalizarNivel(nivel) {
  if (!nivel) return "";
  const texto = String(nivel).toLowerCase();
  return levelNames[texto] || nivel;
}

export function obterInicialNome(nome) {
  if (!nome || typeof nome !== "string") return "";
  const texto = nome.trim();
  if (!texto) return "";
  const palavras = texto.split(/\s+/);
  const primeira = palavras[0];
  return primeira ? primeira.charAt(0) : "";
}

export function capitalizarNome(texto) {
  if (!stringValida(texto)) return "";
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

