function peerIdValido(valor) {
  return /^ALUNO-\d{2}$/.test(valor || "");
}

function figurinhaValida(valor) {
  return /^FIG-\d{2}$/.test(valor || "");
}

function obterCampoOferta(mensagem) {
  return mensagem.offered_sticker_id || mensagem.offer_sticker_id;
}

function obterCampoDesejo(mensagem) {
  return mensagem.requested_sticker_id || mensagem.want_sticker_id;
}

function trocaValida(mensagem) {
  const figurinhaOferecida = obterCampoOferta(mensagem);
  const figurinhaDesejada = obterCampoDesejo(mensagem);
  const quantidadeOferecida = mensagem.offered_quantity ?? 1;
  const quantidadeDesejada = mensagem.requested_quantity ?? 1;

  return (
    typeof mensagem.trade_id === "string" &&
    mensagem.trade_id.length > 0 &&
    peerIdValido(mensagem.proposer_peer_id) &&
    peerIdValido(mensagem.receiver_peer_id) &&
    mensagem.proposer_peer_id !== mensagem.receiver_peer_id &&
    figurinhaValida(figurinhaOferecida) &&
    figurinhaValida(figurinhaDesejada) &&
    Number.isInteger(quantidadeOferecida) &&
    quantidadeOferecida > 0 &&
    Number.isInteger(quantidadeDesejada) &&
    quantidadeDesejada > 0
  );
}

function mesmaTroca(mensagem, troca) {
  const figurinhaOferecida = obterCampoOferta(mensagem);
  const figurinhaDesejada = obterCampoDesejo(mensagem);
  const quantidadeOferecida = mensagem.offered_quantity;
  const quantidadeDesejada = mensagem.requested_quantity;

  const idsCompativeis =
    campoCompativel(mensagem.trade_id, troca.trade_id) &&
    campoCompativel(mensagem.proposer_peer_id, troca.proposer_peer_id);

  const original =
    campoCompativel(figurinhaOferecida, troca.offered_sticker_id) &&
    campoCompativel(quantidadeOferecida, troca.offered_quantity) &&
    campoCompativel(figurinhaDesejada, troca.requested_sticker_id) &&
    campoCompativel(quantidadeDesejada, troca.requested_quantity);

  const invertida =
    campoCompativel(figurinhaOferecida, troca.requested_sticker_id) &&
    campoCompativel(quantidadeOferecida, troca.requested_quantity) &&
    campoCompativel(figurinhaDesejada, troca.offered_sticker_id) &&
    campoCompativel(quantidadeDesejada, troca.offered_quantity);

  return idsCompativeis && (original || invertida);
}

function campoCompativel(recebido, esperado) {
  return recebido === undefined || recebido === esperado;
}

module.exports = {
  peerIdValido,
  figurinhaValida,
  trocaValida,
  mesmaTroca,
};
