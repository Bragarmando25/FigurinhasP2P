// Menu interativo do terminal
const readline = require("readline");

function iniciarCli({ peerId, inventario, rede, protocolo }) {
  const interfaceLeitura = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let filaPerguntas = Promise.resolve();

  function perguntar(texto) {
    const perguntaAtual = filaPerguntas.then(
      () => new Promise((resolve) => interfaceLeitura.question(texto, resolve)),
    );

    filaPerguntas = perguntaAtual.catch(() => {});
    return perguntaAtual;
  }

  protocolo.definirTratadorOferta(responderOferta);

  const acoesMenu = {
    1: () => console.log(inventario),

    2: async () =>
      mostrarResultado(
        protocolo.buscarFigurinha(normalizar(await perguntar("Figurinha: "))),
      ),

    3: proporTroca,

    4: () => console.log(rede.listarPeers()),
  };

  async function menu() {
    while (true) {
      console.log(`\n===== ${peerId} =====`);
      console.log("1 - Ver inventario");
      console.log("2 - Buscar figurinha na rede");
      console.log("3 - Propor troca");
      console.log("4 - Ver vizinhos conectados");
      console.log("0 - Sair");

      const opcao = (await perguntar("Escolha: ")).trim();

      if (opcao === "0") {
        interfaceLeitura.close();
        process.exit(0);
      }

      await executarOpcao(opcao);
    }
  }

  async function executarOpcao(opcao) {
    const acao = acoesMenu[opcao];

    if (acao) {
      await acao();
      return;
    }

    console.log("Opcao invalida.");
  }

  async function proporTroca() {
    const peerDestinoId = normalizar(await perguntar("Peer de destino: "));
    const figurinhaOferecida = normalizar(
      await perguntar("Figurinha que voce oferece: "),
    );
    const figurinhaDesejada = normalizar(
      await perguntar("Figurinha que voce quer: "),
    );

    mostrarResultado(
      protocolo.oferecerTroca(
        peerDestinoId,
        figurinhaOferecida,
        figurinhaDesejada,
      ),
    );
  }

  async function responderOferta(troca) {
    console.log("\nNOVA PROPOSTA DE TROCA");
    console.log(`De: ${troca.proposer_peer_id}`);
    console.log(`Voce recebe: ${troca.offered_sticker_id}`);
    console.log(`Voce entrega: ${troca.requested_sticker_id}`);

    while (true) {
      const resposta = normalizar(await perguntar("Aceitar troca? (s/n): "));

      if (resposta === "S") {
        mostrarResultado(protocolo.aceitarTroca(troca.trade_id));
        return;
      }

      if (resposta === "N") {
        mostrarResultado(protocolo.rejeitarTroca(troca.trade_id));
        return;
      }

      console.log("Digite s ou n.");
    }
  }

  menu().catch((erro) => {
    console.error("Erro no menu:", erro);
    process.exit(1);
  });
}

function normalizar(valor) {
  return valor.trim().toUpperCase();
}

function mostrarResultado(resultado) {
  console.log(resultado.mensagem);
}

module.exports = { iniciarCli };
