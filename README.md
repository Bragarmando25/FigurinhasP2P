# FigurinhasP2P

Sistema P2P não estruturado para busca e troca de figurinhas usando Node.js, WebSocket e mensagens JSON UTF-8.

Cada instância representa um aluno. O sistema não usa servidor central de busca: cada peer possui uma lista de vizinhos e repassa buscas por inundação até encontrar a figurinha ou até o `ttl` chegar a zero.

## Padrões principais

- Transporte: WebSocket.
- Mensagens: JSON UTF-8.
- Peer: `ALUNO-YY`.
- Figurinha: `FIG-XX`.
- Porta WebSocket padrão: `8080`.
- Porta HTTP das imagens: `3000`.
- TTL padrão da busca: `7`.
- `query_id`: UUID único da busca.
- Cada aluno inicia com 28 cópias lógicas da própria figurinha.

## Instalação

Execute uma vez na pasta do projeto:

```powershell
npm install
```

Depois, para rodar:

```powershell
node peer.js
```

ou:

```powershell
npm start
```

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `peer.js` | Inicializa configuração, armazenamento, rede, protocolo e menu. |
| `src/config.js` | Carrega portas, caminhos, inventário e vizinhos. |
| `src/conexao.js` | Cria servidor WebSocket, conecta vizinhos, envia mensagens e serve imagens. |
| `src/protocolo.js` | Implementa `HELLO`, `SEARCH`, `SEARCH_HIT`, `SEARCH_MISS` e trocas. |
| `src/menu.js` | Menu interativo no terminal. |
| `src/inventario.js` | Salva inventário e histórico local. |
| `src/validacao.js` | Valida `peer_id`, `sticker_id` e mensagens de troca. |
| `inventario.json` | Define o aluno, figurinha autoral e inventário. |
| `vizinhos.json` | Lista de vizinhos WebSocket. |

## Inventário

Exemplo:

```json
{
  "peer_id": "ALUNO-04",
  "author_sticker": "FIG-04",
  "inventario": {
    "FIG-04": 28
  }
}
```

## Vizinhos

Sem vizinhos:

```json
[]
```

Com vizinho:

```json
[
  "ws://IP_DO_COLEGA:8080"
]
```

Em outro computador, não use `localhost`. Use o IP real ou IP do Radmin/VPN.

## Protocolo

### HELLO

```json
{
  "type": "HELLO",
  "message_id": "uuid",
  "sender_peer_id": "ALUNO-04",
  "peers": ["ws://192.168.0.10:8080"]
}
```

### SEARCH

```json
{
  "type": "SEARCH",
  "message_id": "uuid",
  "query_id": "uuid",
  "origin_peer_id": "ALUNO-04",
  "sender_peer_id": "ALUNO-04",
  "receiver_peer_id": "ALUNO-03",
  "sticker_id": "FIG-03",
  "ttl": 7
}
```

Ao repassar, o peer troca `sender_peer_id` para o próprio ID e envia com `ttl - 1`.

### SEARCH_HIT

```json
{
  "type": "SEARCH_HIT",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-03",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-04",
  "query_id": "uuid",
  "sticker_id": "FIG-03"
}
```

### SEARCH_MISS

```json
{
  "type": "SEARCH_MISS",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-02",
  "sender_peer_id": "ALUNO-02",
  "receiver_peer_id": "ALUNO-04",
  "query_id": "uuid",
  "sticker_id": "FIG-03"
}
```

### TRADE_OFFER

```json
{
  "type": "TRADE_OFFER",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-04",
  "sender_peer_id": "ALUNO-04",
  "receiver_peer_id": "ALUNO-03",
  "offer_sticker_id": "FIG-04",
  "want_sticker_id": "FIG-03"
}
```

### TRADE_ACCEPT

```json
{
  "type": "TRADE_ACCEPT",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-03",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-04",
  "offer_sticker_id": "FIG-04",
  "want_sticker_id": "FIG-03"
}
```

### TRADE_REJECT

```json
{
  "type": "TRADE_REJECT",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-03",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-04",
  "offer_sticker_id": "FIG-04",
  "want_sticker_id": "FIG-03"
}
```

### TRANSFER_CONFIRM

```json
{
  "type": "TRANSFER_CONFIRM",
  "message_id": "uuid",
  "origin_peer_id": "ALUNO-04",
  "sender_peer_id": "ALUNO-04",
  "receiver_peer_id": "ALUNO-03",
  "offer_sticker_id": "FIG-04",
  "want_sticker_id": "FIG-03"
}
```

Com colegas, use:

```powershell
$env:PORTA_WEBSOCKET="8080"
$env:PORTA_IMAGENS="3000"
$env:URL_IMAGENS="http://SEU_IP:3000"
node peer.js
```

No `vizinhos.json`:

```json
[
  "ws://IP_DO_COLEGA:8080"
]
```

Libere o Node.js no Firewall do Windows se os peers não conectarem.
