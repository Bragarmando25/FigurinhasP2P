//Servidores, sockets e envio de mensagens
const { randomUUID } = require("crypto");
const path = require("path");
const express = require("express");
const WebSocket = require("ws");

function criarRede({
  peerId,
  vizinhos,
  portaWebsocket,
  portaImagens,
}) {
  const conexoes = new Set();
  const peersConectados = new Map();
  let tratarMensagem = () => {
    throw new Error("Tratador de mensagens nao configurado.");
  };

  function configurarSocket(socket) {
    conexoes.add(socket);

    socket.on("message", (data) => {
      try {
        const mensagem = JSON.parse(data.toString());
        tratarMensagem(mensagem, socket);
      } catch (erro) {
        console.log(`Mensagem invalida recebida: ${erro.message}`);
      }
    });

    socket.on("close", () => {
      conexoes.delete(socket);

      peersConectados.forEach((socketDoPeer, peerConectadoId) => {
        if (socketDoPeer === socket) {
          peersConectados.delete(peerConectadoId);
        }
      });
    });
  }

  function iniciarServidorImagens() {
    const app = express();
    const diretorioFigurinhas = path.join(__dirname, "..", "figurinhas");

    app.use("/figurinhas", express.static(diretorioFigurinhas));
    app.listen(portaImagens, () => {
      console.log(
        `Servidor de imagens rodando em http://localhost:${portaImagens}/figurinhas`,
      );
    });
  }

  function iniciarServidorWebSocket() {
    const servidor = new WebSocket.Server({ port: portaWebsocket });

    console.log(`No ${peerId} escutando WebSocket na porta ${portaWebsocket}`);

    servidor.on("connection", (socket) => {
      console.log("Novo vizinho conectado.");
      configurarSocket(socket);
      enviarMensagem(socket, { type: "HELLO", peer_id: peerId });
    });
  }

  function conectarAosVizinhos() {
    vizinhos.forEach(conectarAoVizinho);
  }

  function conectarAoVizinho(url) {
    const socket = new WebSocket(url);

    socket.on("open", () => {
      console.log(`Conectado ao vizinho ${url}`);
      configurarSocket(socket);
      enviarMensagem(socket, { type: "HELLO", peer_id: peerId });
    });

    socket.on("error", () => {
      console.log(`Nao foi possivel conectar em ${url}`);
    });

    socket.on("close", () => {
      setTimeout(() => conectarAoVizinho(url), 5000);
    });
  }

  function registrarPeer(peerConectadoId, socket) {
    peersConectados.set(peerConectadoId, socket);
  }

  function enviarParaPeer(peerDestinoId, mensagem) {
    const socket = peersConectados.get(peerDestinoId);

    if (!socket) {
      return false;
    }

    enviarMensagem(socket, mensagem);
    return true;
  }

  function listarPeers() {
    return [...peersConectados.keys()];
  }

  function enviarBuscaParaTodos(mensagem, socketIgnorado = null) {
    conexoes.forEach((socket) => {
      if (socket !== socketIgnorado && socket.readyState === WebSocket.OPEN) {
        const peerDestinoId = obterPeerDoSocket(socket);
        enviarMensagem(socket, {
          ...mensagem,
          message_id: randomUUID(),
          ...(peerDestinoId ? { receiver_peer_id: peerDestinoId } : {}),
        });
      }
    });
  }

  function enviarParaTodos(mensagem, socketIgnorado = null) {
    conexoes.forEach((socket) => {
      if (socket !== socketIgnorado && socket.readyState === WebSocket.OPEN) {
        enviarMensagem(socket, mensagem);
      }
    });
  }

  function enviarMensagem(socket, mensagem) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(mensagem));
    }
  }

  function obterPeerDoSocket(socketProcurado) {
    for (const [peerConectadoId, socket] of peersConectados.entries()) {
      if (socket === socketProcurado) {
        return peerConectadoId;
      }
    }
    return null;
  }

  return {
    definirTratadorMensagem(novoTratador) {
      tratarMensagem = novoTratador;
    },
    iniciar() {
      iniciarServidorImagens();
      iniciarServidorWebSocket();
      conectarAosVizinhos();
    },
    registrarPeer,
    enviarParaPeer,
    obterPeerDoSocket,
    listarPeers,
    enviarBuscaParaTodos,
    enviarParaTodos,
    enviarMensagem,
  };
}

module.exports = { criarRede };
