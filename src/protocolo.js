//Buscas, consultas e trocas.
const { randomUUID } = require("crypto");
const {
  figurinhaValida,
  inventarioValido,
  mesmaTroca,
  peerIdValido,
  trocaValida,
} = require("./validacao");

const TIPOS_DIRECIONADOS = new Set([
  "INVENTORY_REQUEST",
  "INVENTORY_RESPONSE",
  "TRADE_OFFER",
  "TRADE_ACCEPT",
  "TRADE_REJECT",
  "TRANSFER_CONFIRM",
]);

function criarProtocolo({ peerId, inventario, urlImagens, rede, armazenamento }) {
  const buscasProcessadas = new Set(
    armazenamento.historico
      .map((evento) => evento.query_id)
      .filter((queryId) => typeof queryId === "string"),
  );
  const buscasOriginadas = new Set();
  const rotasDeRetorno = new Map();
  const mensagensProcessadas = new Set();
  const trocas = new Map();
  const quantidadesReservadas = new Map();
  let tratarOfertaRecebida = null;
  const tratadoresMensagem = {
    HELLO: tratarHello,
    SEARCH: tratarBusca,
    SEARCH_HIT: tratarBuscaEncontrada,
    SEARCH_MISS: tratarBuscaNaoEncontrada,
  };
  const tratadoresDirecionados = {
    INVENTORY_REQUEST: responderInventario,
    INVENTORY_RESPONSE: exibirInventario,
    TRADE_OFFER: receberOferta,
    TRADE_ACCEPT: receberAceite,
    TRADE_REJECT: receberRejeicao,
    TRANSFER_CONFIRM: receberConfirmacao,
  };

  function tratarMensagem(mensagem, socket) {
    if (!mensagem || typeof mensagem.type !== "string") {
      console.log("Mensagem invalida recebida.");
      return;
    }

    if (TIPOS_DIRECIONADOS.has(mensagem.type)) {
      tratarMensagemDirecionada(mensagem, socket);
      return;
    }

    const tratador = tratadoresMensagem[mensagem.type];

    if (tratador) {
      tratador(mensagem, socket);
      return;
    }

    console.log("Tipo de mensagem desconhecido.");
  }

  function tratarHello(mensagem, socket) {
    if (!peerIdValido(mensagem.peer_id)) {
      console.log("HELLO ignorado: peer_id invalido.");
      return;
    }

    rede.registrarPeer(mensagem.peer_id, socket);
    console.log(`HELLO recebido de ${mensagem.peer_id}`);
  }

  function tratarBusca(mensagem, socket) {
    if (
      !mensagem.query_id ||
      !figurinhaValida(mensagem.sticker_id) ||
      !peerIdValido(mensagem.origin_peer_id) ||
      !peerIdValido(mensagem.sender_peer_id) ||
      !Number.isInteger(mensagem.ttl) ||
      mensagem.ttl < 0
    ) {
      console.log("SEARCH ignorado: campos invalidos.");
      return;
    }

    if (buscasProcessadas.has(mensagem.query_id)) {
      console.log("Busca duplicada ignorada.");
      return;
    }

    buscasProcessadas.add(mensagem.query_id);
    rotasDeRetorno.set(mensagem.query_id, socket);
    armazenamento.registrarEvento({
      type: "SEARCH_RECEIVED",
      query_id: mensagem.query_id,
      sticker_id: mensagem.sticker_id,
      origin_peer_id: mensagem.origin_peer_id || mensagem.origin_peer,
    });

    const figurinhaId = mensagem.sticker_id;

    if (quantidadeDisponivel(figurinhaId, 1)) {
      enviarNoSocket(socket, {
        type: "SEARCH_HIT",
        message_id: randomUUID(),
        query_id: mensagem.query_id,
        origin_peer_id: mensagem.origin_peer_id || mensagem.origin_peer,
        sender_peer_id: peerId,
        receiver_peer_id: mensagem.sender_peer_id,
        from_peer: peerId,
        from_peer_id: peerId,
        sticker_id: figurinhaId,
        quantity: obterQuantidadeDisponivel(figurinhaId),
        image_url: `${urlImagens.replace(/\/$/, "")}/figurinhas/${figurinhaId}.png`,
      });
      return;
    }

    if (mensagem.ttl > 0) {
      rede.enviarBuscaParaTodos(
        {
          ...mensagem,
          sender_peer_id: peerId,
          ttl: mensagem.ttl - 1,
        },
        socket,
      );
      return;
    }

    enviarNoSocket(socket, {
      type: "SEARCH_MISS",
      message_id: randomUUID(),
      query_id: mensagem.query_id,
      origin_peer_id: mensagem.origin_peer_id,
      sender_peer_id: peerId,
      receiver_peer_id: mensagem.sender_peer_id,
      sticker_id: figurinhaId,
    });
  }

  function tratarBuscaEncontrada(mensagem, socket) {
    const peerEncontrado =
      mensagem.from_peer_id || mensagem.from_peer || mensagem.sender_peer_id;
    if (
      !mensagem.query_id ||
      !figurinhaValida(mensagem.sticker_id) ||
      !peerIdValido(peerEncontrado)
    ) {
      return;
    }

    if (buscasOriginadas.has(mensagem.query_id)) {
      armazenamento.registrarEvento({
        type: "SEARCH_HIT",
        query_id: mensagem.query_id,
        sticker_id: mensagem.sticker_id,
        from_peer_id: peerEncontrado,
      });
      console.log("\nFIGURINHA ENCONTRADA!");
      console.log(`Peer: ${peerEncontrado}`);
      console.log(`Figurinha: ${mensagem.sticker_id}`);
      console.log(`Quantidade: ${mensagem.quantity}`);
      console.log(`Imagem: ${mensagem.image_url}`);
      return;
    }

    const socketDeRetorno = rotasDeRetorno.get(mensagem.query_id);

    if (socketDeRetorno && socketDeRetorno !== socket) {
      rede.enviarMensagem(socketDeRetorno, mensagem);
    }
  }

  function tratarBuscaNaoEncontrada(mensagem, socket) {
    if (!mensagem.query_id || !figurinhaValida(mensagem.sticker_id)) {
      return;
    }

    if (buscasOriginadas.has(mensagem.query_id)) {
      armazenamento.registrarEvento({
        type: "SEARCH_MISS",
        query_id: mensagem.query_id,
        sticker_id: mensagem.sticker_id,
        from_peer_id: mensagem.sender_peer_id,
      });
      return;
    }

    const socketDeRetorno = rotasDeRetorno.get(mensagem.query_id);
    if (socketDeRetorno && socketDeRetorno !== socket) {
      rede.enviarMensagem(socketDeRetorno, mensagem);
    }
  }

  function tratarMensagemDirecionada(mensagem, socket) {
    if (
      typeof mensagem.message_id !== "string" ||
      !peerIdValido(mensagem.sender_peer_id) ||
      !peerIdValido(mensagem.receiver_peer_id) ||
      mensagensProcessadas.has(mensagem.message_id)
    ) {
      return;
    }

    mensagensProcessadas.add(mensagem.message_id);

    if (mensagem.receiver_peer_id !== peerId) {
      rede.enviarParaTodos(mensagem, socket);
      return;
    }

    const tratador = tratadoresDirecionados[mensagem.type];

    if (tratador) {
      tratador(mensagem, socket);
    }
  }

  function responderInventario(mensagem) {
    enviarDirecionada("INVENTORY_RESPONSE", mensagem.sender_peer_id, {
      inventory: { ...inventario },
    });
  }

  function exibirInventario(mensagem) {
    if (!inventarioValido(mensagem.inventory)) {
      return;
    }

    console.log(`\nInventario de ${mensagem.sender_peer_id}:`);
    console.log(mensagem.inventory);
  }

  function buscarFigurinha(figurinhaId) {
    if (!figurinhaValida(figurinhaId)) {
      return { ok: false, mensagem: "sticker_id invalido." };
    }

    const queryId = randomUUID();
    buscasProcessadas.add(queryId);
    buscasOriginadas.add(queryId);
    armazenamento.registrarEvento({
      type: "SEARCH_STARTED",
      query_id: queryId,
      sticker_id: figurinhaId,
    });
    rede.enviarBuscaParaTodos({
      type: "SEARCH",
      query_id: queryId,
      origin_peer_id: peerId,
      sender_peer_id: peerId,
      sticker_id: figurinhaId,
      ttl: 7,
    });
    return { ok: true, mensagem: `Busca ${queryId} iniciada.` };
  }

  function consultarInventario(peerDestinoId) {
    if (!peerIdValido(peerDestinoId) || peerDestinoId === peerId) {
      return { ok: false, mensagem: "peer_id de destino invalido." };
    }

    enviarDirecionada("INVENTORY_REQUEST", peerDestinoId);
    return { ok: true, mensagem: `Consulta enviada para ${peerDestinoId}.` };
  }

  function oferecerTroca(peerDestinoId, figurinhaOferecida, figurinhaDesejada) {
    if (!peerIdValido(peerDestinoId) || peerDestinoId === peerId) {
      return { ok: false, mensagem: "peer_id de destino invalido." };
    }
    if (!figurinhaValida(figurinhaOferecida) || !figurinhaValida(figurinhaDesejada)) {
      return { ok: false, mensagem: "Identificador de figurinha invalido." };
    }
    if (!quantidadeDisponivel(figurinhaOferecida, 1)) {
      return { ok: false, mensagem: `Voce nao possui ${figurinhaOferecida}.` };
    }

    const tradeId = randomUUID();
    const troca = {
      trade_id: tradeId,
      proposer_peer_id: peerId,
      receiver_peer_id: peerDestinoId,
      offered_sticker_id: figurinhaOferecida,
      offered_quantity: 1,
      requested_sticker_id: figurinhaDesejada,
      requested_quantity: 1,
      status: "OFFERED",
    };

    trocas.set(tradeId, troca);
    reservarFigurinha(figurinhaOferecida, 1);
    armazenamento.registrarEvento({ type: "TRADE_OFFER", ...troca });
    enviarDirecionada("TRADE_OFFER", peerDestinoId, troca);
    return { ok: true, mensagem: `Proposta ${tradeId} enviada.` };
  }

  function receberOferta(mensagem) {
    const mensagemNormalizada = normalizarQuantidadesDaTroca(mensagem);
    if (
      !trocaValida(mensagemNormalizada) ||
      mensagemNormalizada.proposer_peer_id !== mensagemNormalizada.sender_peer_id ||
      trocas.has(mensagemNormalizada.trade_id)
    ) {
      console.log("TRADE_OFFER ignorada: campos invalidos.");
      return;
    }

    const troca = dadosDaTroca(mensagemNormalizada, "PENDING");
    trocas.set(troca.trade_id, troca);
    armazenamento.registrarEvento({ type: "TRADE_OFFER_RECEIVED", ...troca });

    if (tratarOfertaRecebida) {
      Promise.resolve(tratarOfertaRecebida({ ...troca })).catch((erro) => {
        console.error("Erro ao tratar proposta de troca:", erro.message);
      });
    }
  }

  function aceitarTroca(tradeId) {
    const troca = trocas.get(tradeId);

    if (!troca || troca.status !== "PENDING") {
      return { ok: false, mensagem: "Proposta pendente nao encontrada." };
    }
    if (!quantidadeDisponivel(troca.requested_sticker_id, troca.requested_quantity)) {
      rejeitarTroca(tradeId, "Figurinha desejada indisponivel.");
      return { ok: false, mensagem: "Troca rejeitada: figurinha indisponivel." };
    }

    troca.status = "ACCEPTED";
    reservarFigurinha(troca.requested_sticker_id, troca.requested_quantity);
    armazenamento.registrarEvento({ type: "TRADE_ACCEPT", ...troca });
    enviarDirecionada("TRADE_ACCEPT", troca.proposer_peer_id, troca);
    return { ok: true, mensagem: `Troca ${tradeId} aceita.` };
  }

  function rejeitarTroca(tradeId, reason = "Proposta rejeitada pelo usuario.") {
    const troca = trocas.get(tradeId);

    if (!troca || !["PENDING", "ACCEPTED"].includes(troca.status)) {
      return { ok: false, mensagem: "Proposta pendente nao encontrada." };
    }

    troca.status = "REJECTED";
    troca.reason = reason;
    liberarFigurinha(troca.requested_sticker_id, troca.requested_quantity);
    armazenamento.registrarEvento({ type: "TRADE_REJECT", ...troca });
    enviarDirecionada("TRADE_REJECT", troca.proposer_peer_id, troca);
    return { ok: true, mensagem: `Troca ${tradeId} rejeitada.` };
  }

  function receberAceite(mensagem) {
    const troca = trocas.get(mensagem.trade_id);

    if (
      !troca ||
      troca.status !== "OFFERED" ||
      mensagem.sender_peer_id !== troca.receiver_peer_id ||
      !mesmaTroca(mensagem, troca)
    ) {
      return;
    }
    if (!quantidadeNoInventario(troca.offered_sticker_id, troca.offered_quantity)) {
      troca.status = "REJECTED";
      liberarFigurinha(troca.offered_sticker_id, troca.offered_quantity);
      enviarDirecionada("TRADE_REJECT", troca.receiver_peer_id, {
        ...troca,
        reason: "Figurinha oferecida ficou indisponivel.",
      });
      return;
    }

    atualizarInventario(
      troca.offered_sticker_id,
      -troca.offered_quantity,
      troca.requested_sticker_id,
      troca.requested_quantity,
    );
    liberarFigurinha(troca.offered_sticker_id, troca.offered_quantity);
    troca.status = "PROPOSER_CONFIRMED";
    armazenamento.registrarEvento({ type: "TRANSFER_CONFIRM_SENT", ...troca });
    enviarDirecionada("TRANSFER_CONFIRM", troca.receiver_peer_id, {
      ...troca,
      phase: "PROPOSER_CONFIRMED",
    });
  }

  function receberRejeicao(mensagem) {
    const troca = trocas.get(mensagem.trade_id);
    const remetenteEsperado =
      troca?.proposer_peer_id === peerId
        ? troca.receiver_peer_id
        : troca?.proposer_peer_id;
    if (
      !troca ||
      mensagem.sender_peer_id !== remetenteEsperado ||
      !mesmaTroca(mensagem, troca)
    ) {
      return;
    }

    troca.status = "REJECTED";
    troca.reason = mensagem.reason;
    trocas.set(troca.trade_id, troca);
    if (troca.proposer_peer_id === peerId) {
      liberarFigurinha(troca.offered_sticker_id, troca.offered_quantity);
    } else {
      liberarFigurinha(troca.requested_sticker_id, troca.requested_quantity);
    }
    armazenamento.registrarEvento({ type: "TRADE_REJECT_RECEIVED", ...troca });
    console.log(`\nTroca ${troca.trade_id} rejeitada: ${troca.reason || "sem motivo"}`);
  }

  function receberConfirmacao(mensagem) {
    const troca = trocas.get(mensagem.trade_id);

    const remetenteEsperado =
      mensagem.phase === "PROPOSER_CONFIRMED"
        ? troca?.proposer_peer_id
        : troca?.receiver_peer_id;
    if (
      !troca ||
      mensagem.sender_peer_id !== remetenteEsperado ||
      !mesmaTroca(mensagem, troca)
    ) {
      return;
    }

    if (mensagem.phase === "PROPOSER_CONFIRMED" && troca.status === "ACCEPTED") {
      if (!quantidadeNoInventario(troca.requested_sticker_id, troca.requested_quantity)) {
        console.log(`Nao foi possivel concluir a troca ${troca.trade_id}.`);
        return;
      }

      atualizarInventario(
        troca.requested_sticker_id,
        -troca.requested_quantity,
        troca.offered_sticker_id,
        troca.offered_quantity,
      );
      liberarFigurinha(troca.requested_sticker_id, troca.requested_quantity);
      troca.status = "COMPLETED";
      armazenamento.registrarEvento({ type: "TRANSFER_CONFIRM", ...troca });
      enviarDirecionada("TRANSFER_CONFIRM", troca.proposer_peer_id, {
        ...troca,
        phase: "COMPLETED",
      });
      console.log(`\nTroca ${troca.trade_id} concluida.`);
      return;
    }

    if (mensagem.phase === "COMPLETED" && troca.status === "PROPOSER_CONFIRMED") {
      troca.status = "COMPLETED";
      armazenamento.registrarEvento({ type: "TRANSFER_CONFIRM", ...troca });
      console.log(`\nTroca ${troca.trade_id} concluida.`);
    }
  }

  function atualizarInventario(removerId, removerQuantidade, adicionarId, adicionarQuantidade) {
    inventario[removerId] = (inventario[removerId] || 0) + removerQuantidade;
    inventario[adicionarId] = (inventario[adicionarId] || 0) + adicionarQuantidade;
    armazenamento.salvarInventario();
  }

  function enviarDirecionada(type, receiverPeerId, dados = {}) {
    const mensagem = {
      ...dados,
      type,
      message_id: randomUUID(),
      sender_peer_id: peerId,
      receiver_peer_id: receiverPeerId,
    };

    mensagensProcessadas.add(mensagem.message_id);
    if (!rede.enviarParaPeer(receiverPeerId, mensagem)) {
      rede.enviarParaTodos(mensagem);
    }
  }

  function quantidadeDisponivel(figurinhaId, quantidade) {
    return obterQuantidadeDisponivel(figurinhaId) >= quantidade;
  }

  function obterQuantidadeDisponivel(figurinhaId) {
    const quantidadeAtual = Number.isInteger(inventario[figurinhaId])
      ? inventario[figurinhaId]
      : 0;
    const reservada = quantidadesReservadas.get(figurinhaId) || 0;
    return Math.max(0, quantidadeAtual - reservada);
  }

  function quantidadeNoInventario(figurinhaId, quantidade) {
    return Number.isInteger(inventario[figurinhaId]) && inventario[figurinhaId] >= quantidade;
  }

  function reservarFigurinha(figurinhaId, quantidade) {
    const atual = quantidadesReservadas.get(figurinhaId) || 0;
    quantidadesReservadas.set(figurinhaId, atual + quantidade);
  }

  function liberarFigurinha(figurinhaId, quantidade) {
    const atual = quantidadesReservadas.get(figurinhaId) || 0;
    quantidadesReservadas.set(figurinhaId, Math.max(0, atual - quantidade));
  }

  function dadosDaTroca(mensagem, status) {
    return {
      trade_id: mensagem.trade_id,
      proposer_peer_id: mensagem.proposer_peer_id || mensagem.sender_peer_id,
      receiver_peer_id: mensagem.receiver_peer_id,
      offered_sticker_id: mensagem.offered_sticker_id,
      offered_quantity: mensagem.offered_quantity || 1,
      requested_sticker_id: mensagem.requested_sticker_id,
      requested_quantity: mensagem.requested_quantity || 1,
      status,
    };
  }

  function normalizarQuantidadesDaTroca(mensagem) {
    return {
      ...mensagem,
      offered_quantity: mensagem.offered_quantity ?? 1,
      requested_quantity: mensagem.requested_quantity ?? 1,
    };
  }

  return {
    tratarMensagem,
    definirTratadorOferta(handler) {
      tratarOfertaRecebida = handler;
    },
    buscarFigurinha,
    consultarInventario,
    oferecerTroca,
    aceitarTroca,
    rejeitarTroca,
  };
}

module.exports = { criarProtocolo };
