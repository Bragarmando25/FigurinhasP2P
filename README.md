# FigurinhasP2P

Sistema P2P nao estruturado para busca e troca de figurinhas usando Node.js, WebSocket e mensagens JSON.

O projeto foi feito para a primeira etapa do trabalho de Sistemas Distribuidos. Cada instancia do programa representa um aluno da rede. Nao existe servidor central para busca: cada peer conhece alguns vizinhos e repassa mensagens de busca por inundacao ate encontrar a figurinha ou ate o TTL acabar.

## Funcionalidades

- Rede P2P nao estruturada.
- Comunicacao por WebSocket.
- Mensagens em JSON UTF-8.
- Descoberta de figurinhas por inundacao.
- TTL padrao `7` para limitar o alcance da busca.
- Supressao de buscas repetidas usando `query_id`.
- Retorno de `SEARCH_HIT` pelo caminho inverso.
- Consulta de inventario de outro peer.
- Proposta de troca entre dois peers.
- Aceite ou rejeicao de troca diretamente no terminal.
- Confirmacao de transferencia e atualizacao dos inventarios.
- Bloqueio de inventario negativo usando reserva de quantidades.
- Persistencia local de inventario e historico.
- Configuracao simples de vizinhos por arquivo JSON.
- Servidor HTTP local para disponibilizar imagens das figurinhas.

## Tecnologias

- Node.js
- CommonJS
- `ws` para WebSocket
- `express` para servir imagens via HTTP

## Estrutura do projeto

```text
FigurinhasP2P/
├── figurinhas/
│   └── FIG-04.png
├── src/
│   ├── config.js
│   ├── conexao.js
│   ├── inventario.js
│   ├── menu.js
│   ├── protocolo.js
│   └── validacao.js
├── inventario.json
├── vizinhos.json
├── peer.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Papel de cada arquivo

- `peer.js`: ponto de entrada do sistema. Carrega configuracoes, cria a rede, cria o protocolo e inicia o menu.
- `src/config.js`: le arquivos JSON, portas e variaveis de ambiente.
- `src/conexao.js`: cria o servidor WebSocket, conecta nos vizinhos e envia mensagens.
- `src/protocolo.js`: implementa as regras de busca, resposta, consulta de inventario e troca.
- `src/menu.js`: interface de terminal usada pelo usuario.
- `src/inventario.js`: salva inventario e historico em arquivos JSON.
- `src/validacao.js`: valida `peer_id`, `sticker_id`, inventarios e dados de troca.
- `inventario.json`: identifica o peer local e suas figurinhas.
- `vizinhos.json`: lista de URLs WebSocket dos vizinhos.
- `figurinhas/`: pasta onde ficam as imagens PNG das figurinhas.

## Requisitos

- Node.js 18 ou superior.
- npm.
- Portas liberadas no firewall para testes em rede real.

## Instalacao

Na pasta do projeto, execute:

```powershell
npm.cmd install
```

## Configuracao do inventario

O arquivo `inventario.json` define qual aluno o peer representa e quais figurinhas ele possui.

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
- Cada figurinha no inventario deve estar no formato `FIG-XX`.
- Cada quantidade deve ser um numero inteiro maior ou igual a zero.
- Pela regra do trabalho, o aluno inicia com `28` copias logicas da sua figurinha autoral.

## Configuracao da imagem

A imagem da figurinha deve ficar na pasta `figurinhas/`.

Exemplo para a figurinha `FIG-04`:

```text
figurinhas/FIG-04.png
```

O arquivo deve ser PNG e o nome deve bater com o identificador da figurinha.

## Configuracao de vizinhos

O arquivo `vizinhos.json` contem os peers aos quais este peer vai tentar se conectar.

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

Importante: JSON nao aceita comentarios. Isto quebra o projeto:

```json
[
  //"ws://192.168.0.25:8080"
]
```

Use `[]` quando nao quiser configurar vizinhos.

## Executar

Para iniciar o peer:

```powershell
node peer.js
```

Ou:

```powershell
npm.cmd start
```

Configuracao padrao:

| Item | Valor |
| --- | --- |
| Porta WebSocket | `8080` |
| Porta das imagens | `3000` |
| Inventario | `inventario.json` |
| Vizinhos | `vizinhos.json` |
| Historico | `historico.json` |

## Menu

Ao iniciar o projeto, o terminal mostra:

```text
1 - Ver inventario
2 - Buscar figurinha na rede
3 - Consultar inventario de um peer
4 - Propor troca
5 - Ver vizinhos conectados
0 - Sair
```

### 1 - Ver inventario

Mostra o inventario local do peer.

### 2 - Buscar figurinha na rede

Inicia uma busca por inundacao.

Exemplo:

```text
Figurinha: FIG-03
```

Se a figurinha for encontrada, o peer mostra quem possui a figurinha, a quantidade disponivel e a URL da imagem.

### 3 - Consultar inventario de um peer

Envia uma consulta de inventario para outro peer.

Exemplo:

```text
Peer: ALUNO-03
```

### 4 - Propor troca

Envia uma proposta de troca para outro peer.

Exemplo:

```text
Peer de destino: ALUNO-03
Figurinha que voce oferece: FIG-04
Figurinha que voce quer: FIG-03
```

Quando o peer destino recebe a proposta, ele responde no proprio terminal:

```text
Aceitar troca? (s/n):
```

- `s`: aceita a proposta.
- `n`: rejeita a proposta.

### 5 - Ver vizinhos conectados

Mostra os peers conectados diretamente.

## Protocolo implementado

O projeto implementa os tipos principais:

- `HELLO`: anuncia a presenca de um peer.
- `SEARCH`: busca uma figurinha.
- `SEARCH_HIT`: informa que a figurinha foi encontrada.
- `SEARCH_MISS`: informa que a busca nao encontrou resultado quando o TTL acaba.
- `INVENTORY_REQUEST`: solicita inventario de outro peer.
- `INVENTORY_RESPONSE`: responde com inventario local.
- `TRADE_OFFER`: propoe uma troca.
- `TRADE_ACCEPT`: aceita uma troca.
- `TRADE_REJECT`: rejeita uma troca.
- `TRANSFER_CONFIRM`: confirma a atualizacao do inventario.

## Campos importantes

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
3. Cada peer que recebe a busca verifica se ja processou aquele `query_id`.
4. Se ja processou, descarta.
5. Se nao processou, registra o `query_id`.
6. Se tiver a figurinha disponivel, responde com `SEARCH_HIT`.
7. Se nao tiver e `ttl > 0`, repassa para os vizinhos, exceto para quem enviou.
8. O `SEARCH_HIT` volta pelo caminho inverso usando a rota armazenada por `query_id`.

## Como a troca funciona

1. Um peer envia `TRADE_OFFER`.
2. O peer destino recebe a proposta e decide `s` ou `n`.
3. Se rejeitar, envia `TRADE_REJECT`.
4. Se aceitar, verifica disponibilidade no inventario.
5. Se houver disponibilidade, reserva a figurinha e envia `TRADE_ACCEPT`.
6. O proponente atualiza seu inventario e envia `TRANSFER_CONFIRM`.
7. O recebedor atualiza seu inventario e envia a confirmacao final.
8. Os dois inventarios ficam atualizados.

O sistema usa reservas temporarias para evitar que a mesma figurinha seja prometida em duas trocas ao mesmo tempo.

## Variaveis de ambiente

Voce pode alterar portas e caminhos sem mudar o codigo:

| Variavel | Padrao | Descricao |
| --- | --- | --- |
| `PORTA_WEBSOCKET` | `8080` | Porta WebSocket do peer |
| `PORTA_IMAGENS` | `3000` | Porta HTTP para imagens |
| `URL_IMAGENS` | `http://localhost:3000` | URL divulgada para outros peers |
| `INVENTARIO_PATH` | `inventario.json` | Caminho do inventario |
| `VIZINHOS_PATH` | `vizinhos.json` | Caminho do arquivo de vizinhos |
| `HISTORICO_PATH` | `historico.json` | Caminho do historico |

Exemplo:

```powershell
$env:PORTA_WEBSOCKET="8081"
$env:PORTA_IMAGENS="3001"
$env:URL_IMAGENS="http://localhost:3001"
node peer.js
```

## Teste local com varios peers

Para simular uma rede real no mesmo computador, abra tres terminais e rode tres peers com portas e arquivos diferentes.

Topologia:

```text
ALUNO-01 <-> ALUNO-02 <-> ALUNO-03
```

Crie uma pasta para arquivos temporarios:

```powershell
mkdir localtest
```

Cada peer deve ter:

- um inventario proprio;
- um arquivo de vizinhos proprio;
- um historico proprio;
- uma porta WebSocket propria;
- uma porta de imagens propria.

Exemplo do `ALUNO-03`:

```powershell
$env:PORTA_WEBSOCKET="8083"
$env:PORTA_IMAGENS="3003"
$env:URL_IMAGENS="http://localhost:3003"
$env:INVENTARIO_PATH="localtest/inventario-03.json"
$env:VIZINHOS_PATH="localtest/vizinhos-03.json"
$env:HISTORICO_PATH="localtest/historico-03.json"
node peer.js
```

Exemplo do `ALUNO-02`:

```powershell
$env:PORTA_WEBSOCKET="8082"
$env:PORTA_IMAGENS="3002"
$env:URL_IMAGENS="http://localhost:3002"
$env:INVENTARIO_PATH="localtest/inventario-02.json"
$env:VIZINHOS_PATH="localtest/vizinhos-02.json"
$env:HISTORICO_PATH="localtest/historico-02.json"
node peer.js
```

Exemplo do `ALUNO-01`:

```powershell
$env:PORTA_WEBSOCKET="8081"
$env:PORTA_IMAGENS="3001"
$env:URL_IMAGENS="http://localhost:3001"
$env:INVENTARIO_PATH="localtest/inventario-01.json"
$env:VIZINHOS_PATH="localtest/vizinhos-01.json"
$env:HISTORICO_PATH="localtest/historico-01.json"
node peer.js
```

Depois teste:

1. Em cada terminal, use `5 - Ver vizinhos conectados`.
2. No `ALUNO-01`, busque `FIG-03`.
3. A busca deve passar pelo `ALUNO-02` e chegar ao `ALUNO-03`.
4. Teste uma troca entre `ALUNO-01` e `ALUNO-03`.

## Teste em rede com colegas

Todos devem estar na mesma rede.

Cada aluno descobre seu IP com:

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

Antes de iniciar, configure a URL das suas imagens com o seu IP:

```powershell
$env:URL_IMAGENS="http://SEU_IP:3000"
node peer.js
```

Exemplo:

```powershell
$env:URL_IMAGENS="http://192.168.0.10:3000"
node peer.js
```

Se o Windows perguntar sobre firewall, permita o acesso na rede usada pelo grupo.

## Problemas comuns

### O peer nao conecta

Verifique:

- se o IP do colega esta correto;
- se a porta WebSocket e `8080`;
- se o colega tambem esta com o programa rodando;
- se o firewall liberou a conexao;
- se os computadores estao na mesma rede.

### A imagem nao abre

Verifique:

- se `URL_IMAGENS` esta com seu IP correto;
- se a porta `3000` esta liberada;
- se existe arquivo em `figurinhas/FIG-XX.png`.

### Erro em `vizinhos.json`

O arquivo precisa ser JSON valido. Para nao ter vizinhos, use:

```json
[]
```

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

Rodar testes configurados:

```powershell
npm.cmd test
```

Atualmente o projeto nao possui testes automatizados, entao o comando pode mostrar `0 tests`.
