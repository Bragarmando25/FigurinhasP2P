//Conecta e inicializa os módulos
const {
  PORTA_WEBSOCKET,
  PORTA_IMAGENS,
  URL_IMAGENS,
  dadosInventario,
  caminhoInventario,
  caminhoHistorico,
  peerId,
  vizinhos,
} = require("./src/config");
const { criarRede } = require("./src/conexao");
const { criarProtocolo } = require("./src/protocolo");
const { iniciarCli } = require("./src/menu");
const { criarArmazenamento } = require("./src/inventario");

const armazenamento = criarArmazenamento({
  caminhoInventario,
  dadosInventario,
  caminhoHistorico,
});

const rede = criarRede({
  peerId,
  vizinhos,
  portaWebsocket: PORTA_WEBSOCKET,
  portaImagens: PORTA_IMAGENS,
});

const protocolo = criarProtocolo({
  peerId,
  inventario: armazenamento.inventario,
  urlImagens: URL_IMAGENS,
  rede,
  armazenamento,
});

rede.definirTratadorMensagem(protocolo.tratarMensagem);
rede.iniciar();

iniciarCli({
  peerId,
  inventario: armazenamento.inventario,
  rede,
  protocolo,
});
