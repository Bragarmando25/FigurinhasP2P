function peerIdValido(valor) {
  return /^ALUNO-\d{2}$/.test(valor || "");
}

function figurinhaValida(valor) {
  return /^FIG-\d{2}$/.test(valor || "");
}

function inventarioValido(valor) {
  return (
    valor &&
    !Array.isArray(valor) &&
    Object.entries(valor).every(
      ([stickerId, quantidade]) =>
        figurinhaValida(stickerId) && Number.isInteger(quantidade) && quantidade >= 0,
    )
  );
}

function trocaValida(mensagem) {
  return (
    typeof mensagem.trade_id === "string" &&
    mensagem.trade_id.length > 0 &&
    peerIdValido(mensagem.proposer_peer_id) &&
    peerIdValido(mensagem.receiver_peer_id) &&
    mensagem.proposer_peer_id !== mensagem.receiver_peer_id &&
    figurinhaValida(mensagem.offered_sticker_id) &&
    figurinhaValida(mensagem.requested_sticker_id) &&
    Number.isInteger(mensagem.offered_quantity) &&
    mensagem.offered_quantity > 0 &&
    Number.isInteger(mensagem.requested_quantity) &&
    mensagem.requested_quantity > 0
  );
}

function mesmaTroca(mensagem, troca) {
  return (
    mensagem.trade_id === troca.trade_id &&
    campoCompativel(mensagem.proposer_peer_id, troca.proposer_peer_id) &&
    campoCompativel(mensagem.offered_sticker_id, troca.offered_sticker_id) &&
    campoCompativel(mensagem.offered_quantity, troca.offered_quantity) &&
    campoCompativel(mensagem.requested_sticker_id, troca.requested_sticker_id) &&
    campoCompativel(mensagem.requested_quantity, troca.requested_quantity)
  );
}

function campoCompativel(recebido, esperado) {
  return recebido === undefined || recebido === esperado;
}

module.exports = {
  peerIdValido,
  figurinhaValida,
  inventarioValido,
  trocaValida,
  mesmaTroca,
};
