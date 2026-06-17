//Carrega portas, inventario e vizinhos
const fs = require("fs");
const path = require("path");

const raizProjeto = path.join(__dirname, "..");
const PORTA_WEBSOCKET = Number(process.env.PORTA_WEBSOCKET || 8080);
const PORTA_IMAGENS = Number(process.env.PORTA_IMAGENS || 3000);
const URL_IMAGENS =
  process.env.URL_IMAGENS || `http://localhost:${PORTA_IMAGENS}`;
const caminhoInventario = path.resolve(
  raizProjeto,
  process.env.INVENTARIO_PATH || "inventario.json",
);
const caminhoVizinhos = path.resolve(
  raizProjeto,
  process.env.VIZINHOS_PATH || "vizinhos.json",
);
const caminhoHistorico = path.resolve(
  raizProjeto,
  process.env.HISTORICO_PATH || "historico.json",
);

const dadosInventario = JSON.parse(
  fs.readFileSync(caminhoInventario, "utf-8"),
);
const vizinhos = JSON.parse(
  fs.readFileSync(caminhoVizinhos, "utf-8"),
);

validarConfiguracao();

function validarConfiguracao() {
  if (!/^ALUNO-\d{2}$/.test(dadosInventario.peer_id || "")) {
    throw new Error("peer_id invalido no inventario. Use o formato ALUNO-YY.");
  }
  if (!/^FIG-\d{2}$/.test(dadosInventario.author_sticker || "")) {
    throw new Error("author_sticker invalido. Use o formato FIG-XX.");
  }
  if (!dadosInventario.inventario || Array.isArray(dadosInventario.inventario)) {
    throw new Error("inventario deve ser um objeto JSON.");
  }

  Object.entries(dadosInventario.inventario).forEach(([stickerId, quantidade]) => {
    if (!/^FIG-\d{2}$/.test(stickerId) || !Number.isInteger(quantidade) || quantidade < 0) {
      throw new Error(`Item invalido no inventario: ${stickerId}.`);
    }
  });

  if (!Array.isArray(vizinhos) || vizinhos.some((url) => !urlWebSocketValida(url))) {
    throw new Error("vizinhos.json deve conter uma lista de URLs ws:// ou wss://.");
  }
  if (!portaValida(PORTA_WEBSOCKET) || !portaValida(PORTA_IMAGENS)) {
    throw new Error("As portas configuradas devem ser inteiros entre 1 e 65535.");
  }
}

function portaValida(porta) {
  return Number.isInteger(porta) && porta >= 1 && porta <= 65535;
}

function urlWebSocketValida(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === "ws:" || url.protocol === "wss:";
  } catch {
    return false;
  }
}

module.exports = {
  PORTA_WEBSOCKET,
  PORTA_IMAGENS,
  URL_IMAGENS,
  dadosInventario,
  caminhoInventario,
  caminhoHistorico,
  peerId: dadosInventario.peer_id,
  vizinhos,
};
