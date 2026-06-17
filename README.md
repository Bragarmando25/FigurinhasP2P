# FigurinhasP2P

Sistema P2P nao estruturado para busca e troca de figurinhas usando Node.js, WebSocket e mensagens JSON.

Cada instancia do programa representa um aluno da rede. O sistema nao usa servidor central para buscar figurinhas: cada peer conhece uma lista de vizinhos e repassa as buscas por inundacao ate a figurinha ser encontrada ou ate o TTL chegar a zero.

## Funcionalidades

- Rede P2P nao estruturada.
- Comunicacao por WebSocket.
- Mensagens JSON em UTF-8.
- Busca de figurinhas por inundacao.
- TTL padrao `7`.
- `query_id` unico para evitar processar a mesma busca mais de uma vez.
- Resposta positiva com `SEARCH_HIT`.
- Troca de figurinhas com aceite ou rejeicao pelo terminal.
- Confirmacao de transferencia com atualizacao dos inventarios.
- Controle de quantidade disponivel para impedir inventario negativo.
- Lista de vizinhos configurada por arquivo JSON.
- Servidor HTTP local para disponibilizar as imagens PNG.
- Historico local de buscas e trocas gerado automaticamente.

## Tecnologias

- Node.js
- CommonJS
- `ws` para WebSocket
- `express` para servir imagens via HTTP

## Estrutura

```text
FigurinhasP2P/
|-- figurinhas/
|   `-- FIG-04.png
|-- src/
|   |-- config.js
|   |-- conexao.js
|   |-- inventario.js
|   |-- menu.js
|   |-- protocolo.js
|   `-- validacao.js
|-- inventario.json
|-- vizinhos.json
|-- peer.js
|-- package.json
|-- package-lock.json
|-- .gitignore
`-- README.md
```

## Arquivos principais

- `peer.js`: inicia o programa, cria a rede, cria o protocolo e abre o menu.
- `src/config.js`: carrega portas, caminhos, inventario e vizinhos.
- `src/conexao.js`: abre o servidor WebSocket, conecta nos vizinhos e envia mensagens.
- `src/protocolo.js`: implementa busca, resposta e troca.
- `src/menu.js`: mostra o menu interativo no terminal.
- `src/inventario.js`: salva o inventario e registra eventos no historico.
- `src/validacao.js`: valida `peer_id`, `sticker_id`, inventario e troca.
- `inventario.json`: identifica o aluno e as figurinhas possuidas.
- `vizinhos.json`: lista de URLs WebSocket dos vizinhos.
- `figurinhas/`: imagens PNG das figurinhas.

## Instalar

Na pasta do projeto:

```powershell
npm.cmd install
```

## Configurar o inventario

O arquivo `inventario.json` define o peer local.

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

Regras:

- `peer_id` deve estar no formato `ALUNO-YY`.
- `author_sticker` deve estar no formato `FIG-XX`.
- Cada item do inventario deve usar `FIG-XX`.
- A quantidade deve ser inteira e maior ou igual a zero.
- Pela regra do trabalho, cada aluno inicia com `28` copias logicas da propria figurinha.

## Configurar a imagem

A imagem da figurinha autoral deve ficar em `figurinhas/` com o mesmo codigo da figurinha.

Exemplo:

```text
figurinhas/FIG-04.png
```

## Configurar vizinhos

O arquivo `vizinhos.json` define os peers aos quais este peer tenta se conectar.

Sem vizinhos:

```json
[]
```

Com um vizinho:

```json
[
  "ws://192.168.0.25:8080"
]
```

Com varios vizinhos:

```json
[
  "ws://192.168.0.25:8080",
  "ws://192.168.0.31:8080"
]
```
## Executar

```powershell
node peer.js
```

Ou:

```powershell
npm.cmd start
```

Valores padrao:

| Item | Valor |
| --- | --- |
| Porta WebSocket | `8080` |
| Porta HTTP das imagens | `3000` |
| Inventario | `inventario.json` |
| Vizinhos | `vizinhos.json` |
| Historico | `historico.json` |

## Menu

```text
1 - Ver inventario
2 - Buscar figurinha na rede
3 - Propor troca
4 - Ver vizinhos conectados
0 - Sair
```

### 1 - Ver inventario

Mostra o inventario local.

### 2 - Buscar figurinha na rede

Inicia uma busca por inundacao.

Exemplo:

```text
Figurinha: FIG-03
```

Se a figurinha for encontrada, o terminal mostra o peer que possui a figurinha, a quantidade disponivel e a URL da imagem.

### 3 - Propor troca

Envia uma proposta de troca para outro peer.

Exemplo:

```text
Peer de destino: ALUNO-03
Figurinha que voce oferece: FIG-04
Figurinha que voce quer: FIG-03
```

Quando o destino recebe a proposta, aparece:

```text
Aceitar troca? (s/n):
```

- `s`: aceita a troca.
- `n`: rejeita a troca.

### 4 - Ver vizinhos conectados

Mostra os peers conectados diretamente ao peer local.

## Protocolo implementado

Tipos de mensagem usados:

- `HELLO`: anuncia a presenca do peer ao vizinho.
- `SEARCH`: busca uma figurinha.
- `SEARCH_HIT`: resposta positiva de busca.
- `SEARCH_MISS`: resposta opcional quando a busca chega ao limite sem encontrar.
- `TRADE_OFFER`: proposta de troca.
- `TRADE_ACCEPT`: aceite da troca.
- `TRADE_REJECT`: rejeicao da troca.
- `TRANSFER_CONFIRM`: confirmacao de atualizacao do inventario.

O projeto nao usa `INVENTORY_REQUEST` nem `INVENTORY_RESPONSE`, porque eles nao sao necessarios para esta versao do trabalho.

## Exemplos de mensagens

### HELLO

```json
{
  "type": "HELLO",
  "peer_id": "ALUNO-04"
}
```

### SEARCH

```json
{
  "type": "SEARCH",
  "message_id": "uuid",
  "query_id": "uuid",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-02",
  "receiver_peer_id": "ALUNO-03",
  "sticker_id": "FIG-03",
  "ttl": 6
}
```

### SEARCH_HIT

```json
{
  "type": "SEARCH_HIT",
  "message_id": "uuid",
  "query_id": "uuid",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-02",
  "from_peer_id": "ALUNO-03",
  "sticker_id": "FIG-03",
  "quantity": 5,
  "image_url": "http://192.168.0.30:3000/figurinhas/FIG-03.png"
}
```

### TRADE_OFFER

```json
{
  "type": "TRADE_OFFER",
  "message_id": "uuid",
  "sender_peer_id": "ALUNO-01",
  "receiver_peer_id": "ALUNO-03",
  "trade_id": "uuid",
  "proposer_peer_id": "ALUNO-01",
  "offered_sticker_id": "FIG-01",
  "offered_quantity": 1,
  "requested_sticker_id": "FIG-03",
  "requested_quantity": 1
}
```

## Como a busca funciona

1. O peer cria um `query_id` unico.
2. A busca sai com `ttl` igual a `7`.
3. Cada peer verifica se ja processou aquele `query_id`.
4. Se ja processou, descarta.
5. Se ainda nao processou, registra o `query_id`.
6. Se possuir a figurinha, responde com `SEARCH_HIT`.
7. Se nao possuir e `ttl > 0`, repassa a busca aos vizinhos, exceto ao remetente.
8. O `SEARCH_HIT` volta pelo caminho inverso.

## Como a troca funciona

1. Um peer envia `TRADE_OFFER`.
2. O destino responde `s` ou `n` no terminal.
3. Se rejeitar, envia `TRADE_REJECT`.
4. Se aceitar, verifica se possui a figurinha pedida.
5. Se possuir, reserva a quantidade e envia `TRADE_ACCEPT`.
6. O proponente atualiza seu inventario e envia `TRANSFER_CONFIRM`.
7. O recebedor atualiza seu inventario e envia a confirmacao final.
8. A reserva impede que o inventario fique negativo.

## Historico

O arquivo `historico.json` nao precisa existir antes da primeira execucao. Ele e criado automaticamente quando o sistema registra algum evento, como:

- busca iniciada;
- busca recebida;
- figurinha encontrada;
- proposta de troca enviada;
- proposta de troca recebida;
- troca aceita;
- troca rejeitada;
- transferencia confirmada.

Esse arquivo e importante porque guarda rastros da execucao local e tambem ajuda a manter a lista de `query_id` ja processados entre execucoes. Assim, se o peer reiniciar, ele ainda consegue lembrar buscas antigas registradas no historico.

O `historico.json` esta no `.gitignore` porque e um arquivo de execucao local. Cada aluno deve ter seu proprio historico na propria maquina.

## Variaveis de ambiente

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `PORTA_WEBSOCKET` | `8080` | Porta WebSocket do peer |
| `PORTA_IMAGENS` | `3000` | Porta HTTP para imagens |
| `URL_IMAGENS` | `http://localhost:3000` | URL divulgada no `SEARCH_HIT` |
| `INVENTARIO_PATH` | `inventario.json` | Caminho do inventario |
| `VIZINHOS_PATH` | `vizinhos.json` | Caminho dos vizinhos |
| `HISTORICO_PATH` | `historico.json` | Caminho do historico |

Exemplo:

```powershell
$env:PORTA_WEBSOCKET="8081"
$env:PORTA_IMAGENS="3001"
$env:URL_IMAGENS="http://localhost:3001"
node peer.js
```

## Testar localmente com varios peers

Para simular uma rede real no mesmo computador, rode varias instancias em terminais diferentes.

Exemplo de topologia:

```text
ALUNO-01 <-> ALUNO-02 <-> ALUNO-03
```

Cada peer deve ter:

- uma porta WebSocket propria;
- uma porta HTTP propria;
- um inventario proprio;
- um arquivo de vizinhos proprio;
- um historico proprio.

Exemplo:

```powershell
$env:PORTA_WEBSOCKET="8081"
$env:PORTA_IMAGENS="3001"
$env:URL_IMAGENS="http://localhost:3001"
$env:INVENTARIO_PATH="localtest/inventario-01.json"
$env:VIZINHOS_PATH="localtest/vizinhos-01.json"
$env:HISTORICO_PATH="localtest/historico-01.json"
node peer.js
```

## Testar em rede com colegas

Todos devem estar na mesma rede.

Descubra seu IP:

```powershell
ipconfig
```

Procure por `Endereco IPv4`.

No `vizinhos.json`, coloque o IP de pelo menos um colega:

```json
[
  "ws://IP_DO_COLEGA:8080"
]
```

Antes de iniciar, configure `URL_IMAGENS` com o seu proprio IP:

```powershell
$env:URL_IMAGENS="http://SEU_IP:3000"
node peer.js
```

Exemplo:

```powershell
$env:URL_IMAGENS="http://192.168.0.10:3000"
node peer.js
```

Se o Windows perguntar sobre firewall, libere o acesso na rede usada pelo grupo.

## Problemas comuns

### O peer nao conecta

Verifique:

- IP do colega;
- porta `8080`;
- firewall;
- se os dois programas estao rodando;
- se os computadores estao na mesma rede.

### A imagem nao abre

Verifique:

- `URL_IMAGENS`;
- porta `3000`;
- arquivo `figurinhas/FIG-XX.png`.

## Verificacoes

Checar sintaxe:

```powershell
node --check peer.js
node --check src\conexao.js
node --check src\protocolo.js
node --check src\menu.js
node --check src\inventario.js
node --check src\validacao.js
```

Rodar testes:

```powershell
npm.cmd test
```

Atualmente o projeto nao possui testes automatizados, entao o comando pode mostrar `0 tests`.
