//Inventário
const fs = require("fs");
const path = require("path");

function criarArmazenamento({ caminhoInventario, dadosInventario, caminhoHistorico }) {
  const historico = carregarJson(caminhoHistorico, []);
  if (!Array.isArray(historico)) {
    throw new Error("historico.json deve conter uma lista JSON.");
  }

  function salvarInventario() {
    salvarJson(caminhoInventario, dadosInventario);
  }

  function registrarEvento(evento) {
    historico.push({
      timestamp: new Date().toISOString(),
      ...evento,
    });
    salvarJson(caminhoHistorico, historico);
  }

  return {
    inventario: dadosInventario.inventario,
    historico,
    salvarInventario,
    registrarEvento,
  };
}

function carregarJson(caminho, valorPadrao) {
  if (!fs.existsSync(caminho)) {
    return valorPadrao;
  }

  try {
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
  } catch (erro) {
    throw new Error(`JSON invalido em ${caminho}: ${erro.message}`);
  }
}

function salvarJson(caminho, dados) {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  fs.writeFileSync(caminho, `${JSON.stringify(dados, null, 2)}\n`, "utf-8");
}

module.exports = { criarArmazenamento };
