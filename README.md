# FigurinhasP2P

Sistema P2P não estruturado para busca e troca de figurinhas usando **Node.js**, **WebSocket** e mensagens **JSON UTF-8**.

Cada instância do programa representa um aluno da rede. O sistema não usa servidor central de busca: cada peer conhece seus vizinhos e repassa buscas por inundação até encontrar a figurinha ou até o `ttl` chegar a zero.

---

## Funcionalidades

- Rede P2P não estruturada, sem servidor central de busca.
- Comunicação entre peers por WebSocket.
- Mensagens no formato JSON UTF-8.
- Identificação de peers no formato `ALUNO-YY`.
- Identificação de figurinhas no formato `FIG-XX`.
- Busca por inundação usando `SEARCH`.
- Campo `ttl` obrigatório nas buscas, com valor padrão `7`.
- Campo `query_id` obrigatório, gerado como UUID.
- Controle de buscas já processadas para evitar retransmissão duplicada.
- Resposta positiva com `SEARCH_HIT`.
- Resposta negativa opcional com `SEARCH_MISS`.
- Troca de figurinhas com `TRADE_OFFER`, `TRADE_ACCEPT`, `TRADE_REJECT` e `TRANSFER_CONFIRM`.
- Atualização automática dos inventários após troca concluída.
- Controle de quantidade disponível para impedir inventário negativo.
- Lista de vizinhos configurada por arquivo JSON.
- Servidor HTTP local para disponibilizar os arquivos PNG das figurinhas.
- Histórico local de buscas e trocas.

---

## Tecnologias

- Node.js
- JavaScript CommonJS
- `ws` para WebSocket
- `express` para servidor HTTP das imagens
- `crypto.randomUUID()` para geração de UUID

---

## Estrutura do projeto

```text
FigurinhasP2P/
│
├── figurinhas/
│   └── FIG-04.png
│
├── src/
│   ├── config.js
│   ├── conexao.js
│   ├── inventario.js
│   ├── menu.js
│   ├── protocolo.js
│   └── validacao.js
│
├── inventario.json
├── vizinhos.json
├── peer.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## Arquivos principais

| Arquivo | Função |
|---|---|
| `peer.js` | Inicia o peer, carrega configurações, abre a rede e mostra o menu. |
| `src/config.js` | Carrega portas, caminhos, inventário e vizinhos. |
| `src/conexao.js` | Abre o servidor WebSocket, conecta nos vizinhos e envia mensagens. |
| `src/protocolo.js` | Implementa busca, retorno da busca e troca de figurinhas. |
| `src/menu.js` | Exibe o menu interativo no terminal. |
| `src/inventario.js` | Salva inventário e registra histórico local. |
| `src/validacao.js` | Valida `peer_id`, `sticker_id`, inventário e dados de troca. |
| `inventario.json` | Define o aluno, sua figurinha autoral e seu inventário. |
| `vizinhos.json` | Lista de URLs WebSocket dos vizinhos. |
| `figurinhas/` | Pasta dos arquivos PNG das figurinhas. |

---

## Instalação

Na pasta principal do projeto, execute:

```powershell
npm install
```

Esse comando instala as dependências do projeto.

Não é necessário executar `npm install` toda vez que for rodar o sistema. Use novamente apenas se:

- o projeto foi baixado/clonado pela primeira vez;
- a pasta `node_modules` foi apagada;
- o `package.json` foi alterado;
- o projeto foi copiado para outro computador sem as dependências.

---

## Configuração do inventário

O arquivo `inventario.json` define o peer local.

Exemplo para o aluno `ALUNO-04`:

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

- `peer_id` deve seguir o formato `ALUNO-YY`.
- `author_sticker` deve seguir o formato `FIG-XX`.
- Cada item do inventário deve usar o formato `FIG-XX`.
- A quantidade deve ser um número inteiro maior ou igual a zero.
- Pela regra do trabalho, cada aluno inicia com `28` cópias lógicas da própria figurinha.

---

## Configuração da imagem

A imagem da figurinha autoral deve ficar dentro da pasta `figurinhas/`.

Exemplo:

```text
figurinhas/FIG-04.png
```

O nome do arquivo deve seguir o identificador da figurinha:

```text
FIG-XX.png
```

Exemplos válidos:

```text
FIG-01.png
FIG-04.png
FIG-12.png
```

Evite nomes como:

```text
fig04.png
FIG04.png
FIG-04.png.png
```

---

## Configuração dos vizinhos

O arquivo `vizinhos.json` contém os vizinhos aos quais o peer tentará se conectar.

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

Com vários vizinhos:

```json
[
  "ws://192.168.0.25:8080",
  "ws://192.168.0.31:8080"
]
```

Em testes com outros computadores, não use `localhost` no `vizinhos.json`. Use o IP da máquina do colega.

---

## Executar o projeto

Na pasta principal do projeto:

```powershell
node peer.js
```

Ou:

```powershell
npm start
```

Valores padrão:

| Item | Valor padrão |
|---|---|
| Porta WebSocket/P2P | `8080` |
| Porta HTTP das imagens | `3000` |
| Inventário | `inventario.json` |
| Vizinhos | `vizinhos.json` |
| Histórico | `historico.json` |

A porta obrigatória do trabalho é a porta WebSocket `8080`.

A porta `3000` é usada apenas para o servidor HTTP das imagens PNG.

---

## Menu do sistema

```text
1 - Ver inventario
2 - Buscar figurinha na rede
3 - Propor troca
4 - Ver vizinhos conectados
0 - Sair
```

### 1 - Ver inventário

Mostra o inventário local do peer.

### 2 - Buscar figurinha na rede

Inicia uma busca por inundação.

Exemplo:

```text
Figurinha: FIG-03
```

Se a figurinha for encontrada, o terminal mostra:

```text
FIGURINHA ENCONTRADA!
Peer: ALUNO-03
Figurinha: FIG-03
Quantidade: 5
Imagem: http://localhost:3003/figurinhas/FIG-03.png
```

### 3 - Propor troca

Envia uma proposta de troca para outro peer.

Exemplo:

```text
Peer de destino: ALUNO-03
Figurinha que voce oferece: FIG-04
Figurinha que voce quer: FIG-03
```

Quando o peer de destino recebe a proposta, ele pode aceitar ou rejeitar pelo terminal:

```text
Aceitar troca? (s/n):
```

- `s`: aceita a troca;
- `n`: rejeita a troca.

### 4 - Ver vizinhos conectados

Mostra os peers conectados diretamente ao peer local.

---

## Protocolo de mensagens implementado

Tipos de mensagem usados:

| Tipo | Função |
|---|---|
| `HELLO` | Anuncia a presença do peer ao vizinho. |
| `SEARCH` | Busca uma figurinha específica na rede. |
| `SEARCH_HIT` | Resposta positiva informando que a figurinha foi encontrada. |
| `SEARCH_MISS` | Resposta opcional quando a busca não encontra a figurinha. |
| `TRADE_OFFER` | Propõe uma troca. |
| `TRADE_ACCEPT` | Aceita uma troca. |
| `TRADE_REJECT` | Rejeita uma troca. |
| `TRANSFER_CONFIRM` | Confirma a atualização do inventário após a troca. |

---

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
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-01",
  "sticker_id": "FIG-03",
  "ttl": 7
}
```

Quando um peer repassa a busca, ele altera o `sender_peer_id` para o próprio `peer_id` e decrementa o `ttl`:

```json
{
  "type": "SEARCH",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-02",
  "sticker_id": "FIG-03",
  "ttl": 6
}
```

### SEARCH_HIT

```json
{
  "type": "SEARCH_HIT",
  "message_id": "uuid",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-02",
  "from_peer_id": "ALUNO-03",
  "sticker_id": "FIG-03",
  "quantity": 5,
  "image_url": "http://192.168.0.30:3000/figurinhas/FIG-03.png"
}
```

### SEARCH_MISS

```json
{
  "type": "SEARCH_MISS",
  "message_id": "uuid",
  "query_id": "550e8400-e29b-41d4-a716-446655440000",
  "origin_peer_id": "ALUNO-01",
  "sender_peer_id": "ALUNO-02",
  "receiver_peer_id": "ALUNO-01",
  "sticker_id": "FIG-03"
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

### TRADE_ACCEPT

```json
{
  "type": "TRADE_ACCEPT",
  "message_id": "uuid",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-01",
  "trade_id": "uuid",
  "proposer_peer_id": "ALUNO-01",
  "offered_sticker_id": "FIG-01",
  "offered_quantity": 1,
  "requested_sticker_id": "FIG-03",
  "requested_quantity": 1
}
```

### TRADE_REJECT

```json
{
  "type": "TRADE_REJECT",
  "message_id": "uuid",
  "sender_peer_id": "ALUNO-03",
  "receiver_peer_id": "ALUNO-01",
  "trade_id": "uuid",
  "reason": "Figurinha indisponivel."
}
```

### TRANSFER_CONFIRM

```json
{
  "type": "TRANSFER_CONFIRM",
  "message_id": "uuid",
  "sender_peer_id": "ALUNO-01",
  "receiver_peer_id": "ALUNO-03",
  "trade_id": "uuid",
  "phase": "PROPOSER_CONFIRMED"
}
```

---

## Como a busca funciona

1. O peer cria um `query_id` único com UUID.
2. A busca sai com `ttl` igual a `7`.
3. Cada peer que recebe a busca verifica se já processou aquele `query_id`.
4. Se já processou, descarta a mensagem.
5. Se ainda não processou, registra o `query_id`.
6. O peer verifica seu inventário local.
7. Se possuir a figurinha, responde com `SEARCH_HIT`.
8. Se não possuir e `ttl > 0`, repassa a busca aos vizinhos, exceto ao remetente, com `ttl - 1`.
9. O `SEARCH_HIT` retorna pelo caminho de volta até o peer que iniciou a busca.

Exemplo:

```text
ALUNO-01 busca FIG-03
↓
ALUNO-02 recebe SEARCH com ttl=7
↓
ALUNO-02 não possui FIG-03
↓
ALUNO-02 repassa SEARCH com ttl=6
↓
ALUNO-03 possui FIG-03
↓
ALUNO-03 envia SEARCH_HIT
↓
ALUNO-02 repassa SEARCH_HIT
↓
ALUNO-01 recebe FIGURINHA ENCONTRADA
```

---

## Como a troca funciona

1. Um peer envia `TRADE_OFFER` informando o que oferece e o que deseja.
2. O peer de destino recebe a proposta.
3. O destino aceita ou rejeita pelo terminal.
4. Se rejeitar, envia `TRADE_REJECT`.
5. Se aceitar, verifica se possui quantidade disponível da figurinha solicitada.
6. Se possuir, reserva a quantidade e envia `TRADE_ACCEPT`.
7. O proponente confirma se ainda possui a figurinha oferecida.
8. O proponente atualiza seu inventário e envia `TRANSFER_CONFIRM`.
9. O recebedor atualiza seu inventário e envia a confirmação final.
10. A reserva de quantidade impede inventário negativo durante a troca.

Exemplo de resultado de troca:

```text
Antes:
ALUNO-01 -> FIG-01: 5
ALUNO-03 -> FIG-03: 5

Depois:
ALUNO-01 -> FIG-01: 4, FIG-03: 1
ALUNO-03 -> FIG-03: 4, FIG-01: 1
```

---

## Histórico

O arquivo `historico.json` armazena eventos locais da execução, como:

- busca iniciada;
- busca recebida;
- figurinha encontrada;
- proposta de troca enviada;
- proposta de troca recebida;
- troca aceita;
- troca rejeitada;
- transferência confirmada.

O histórico ajuda na depuração e na demonstração do funcionamento do sistema.

Se o arquivo não existir, ele é criado automaticamente quando o primeiro evento for registrado.

O arquivo `historico.json` fica no `.gitignore`, pois é específico da execução local de cada aluno.

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORTA_WEBSOCKET` | `8080` | Porta WebSocket do peer. |
| `PORTA_IMAGENS` | `3000` | Porta HTTP para servir imagens. |
| `URL_IMAGENS` | `http://localhost:3000` | URL divulgada no `SEARCH_HIT`. |
| `INVENTARIO_PATH` | `inventario.json` | Caminho do arquivo de inventário. |
| `VIZINHOS_PATH` | `vizinhos.json` | Caminho do arquivo de vizinhos. |
| `HISTORICO_PATH` | `historico.json` | Caminho do arquivo de histórico. |

Exemplo:

```powershell
$env:PORTA_WEBSOCKET="8080"
$env:PORTA_IMAGENS="3000"
$env:URL_IMAGENS="http://localhost:3000"
node peer.js
```

---

## Teste local com vários peers

Para testar vários peers na mesma máquina, use portas diferentes para cada instância.

Exemplo de topologia:

```text
ALUNO-01 -> ALUNO-02 -> ALUNO-03
```

Arquivos de exemplo:

### `inventario-01.json`

```json
{
  "peer_id": "ALUNO-01",
  "author_sticker": "FIG-01",
  "inventario": {
    "FIG-01": 5
  }
}
```

### `inventario-02.json`

```json
{
  "peer_id": "ALUNO-02",
  "author_sticker": "FIG-02",
  "inventario": {
    "FIG-02": 5
  }
}
```

### `inventario-03.json`

```json
{
  "peer_id": "ALUNO-03",
  "author_sticker": "FIG-03",
  "inventario": {
    "FIG-03": 5
  }
}
```

### `vizinhos-01.json`

```json
[
  "ws://localhost:8082"
]
```

### `vizinhos-02.json`

```json
[
  "ws://localhost:8083"
]
```

### `vizinhos-03.json`

```json
[]
```

Crie também os arquivos de histórico vazios:

### `historico-01.json`

```json
[]
```

### `historico-02.json`

```json
[]
```

### `historico-03.json`

```json
[]
```

Depois abra três terminais na pasta principal do projeto.

### Terminal 1 - ALUNO-01

```powershell
$env:PORTA_WEBSOCKET="8081"
$env:PORTA_IMAGENS="3001"
$env:INVENTARIO_PATH="inventario-01.json"
$env:VIZINHOS_PATH="vizinhos-01.json"
$env:HISTORICO_PATH="historico-01.json"
$env:URL_IMAGENS="http://localhost:3001"

node peer.js
```

### Terminal 2 - ALUNO-02

```powershell
$env:PORTA_WEBSOCKET="8082"
$env:PORTA_IMAGENS="3002"
$env:INVENTARIO_PATH="inventario-02.json"
$env:VIZINHOS_PATH="vizinhos-02.json"
$env:HISTORICO_PATH="historico-02.json"
$env:URL_IMAGENS="http://localhost:3002"

node peer.js
```

### Terminal 3 - ALUNO-03

```powershell
$env:PORTA_WEBSOCKET="8083"
$env:PORTA_IMAGENS="3003"
$env:INVENTARIO_PATH="inventario-03.json"
$env:VIZINHOS_PATH="vizinhos-03.json"
$env:HISTORICO_PATH="historico-03.json"
$env:URL_IMAGENS="http://localhost:3003"

node peer.js
```

Teste recomendado:

1. No `ALUNO-01`, busque `FIG-03`.
2. Verifique se o `ALUNO-02` recebeu a busca e repassou com `ttl=6`.
3. Verifique se o `ALUNO-03` respondeu com `SEARCH_HIT`.
4. Verifique se o `ALUNO-01` mostrou `FIGURINHA ENCONTRADA`.
5. Faça uma troca entre `ALUNO-01` e `ALUNO-03`.

---

## Teste em rede com colegas

Todos os computadores devem estar na mesma rede física ou virtual.

Na apresentação com computadores diferentes, cada peer pode usar a porta obrigatória:

```text
8080
```

Descubra o IP da sua máquina:

```powershell
ipconfig
```

Procure por `Endereço IPv4`.

No `vizinhos.json`, coloque o IP de pelo menos um colega:

```json
[
  "ws://IP_DO_COLEGA:8080"
]
```

Configure a URL das imagens com o seu próprio IP:

```powershell
$env:URL_IMAGENS="http://SEU_IP:3000"
node peer.js
```

Exemplo:

```powershell
$env:URL_IMAGENS="http://192.168.0.10:3000"
node peer.js
```

Se estiver usando Radmin/VPN, use o IP virtual da rede.

Exemplo:

```json
[
  "ws://26.10.10.2:8080"
]
```

E rode:

```powershell
$env:URL_IMAGENS="http://26.10.10.1:3000"
node peer.js
```

Importante: não use `localhost` para se conectar a outro computador. `localhost` sempre aponta para a própria máquina.

---

## Firewall

Se os peers não conectarem em rede, libere no Firewall do Windows:

- Node.js;
- porta `8080` para WebSocket;
- porta `3000` para imagens.

Em teste local com várias portas, libere também as portas usadas, por exemplo:

- `8081`, `8082`, `8083`;
- `3001`, `3002`, `3003`.

---

## Problemas comuns

### `Cannot find module ... peer.js`

Esse erro acontece quando o comando é executado dentro da pasta `src`.

Volte para a pasta principal do projeto:

```powershell
cd ..
node peer.js
```

Ou acesse diretamente a pasta principal:

```powershell
cd C:\caminho\para\FigurinhasP2P
node peer.js
```

### `ENOENT: no such file or directory`

Esse erro significa que algum arquivo configurado não foi encontrado.

Verifique se existem, na pasta principal:

```text
inventario.json
vizinhos.json
```

Ou, no teste local:

```text
inventario-01.json
vizinhos-01.json
historico-01.json
```

### O peer não conecta

Verifique:

- se o IP está correto;
- se a porta está correta;
- se o outro peer está rodando;
- se o firewall permitiu o Node.js;
- se os computadores estão na mesma rede.

### A imagem não abre

Verifique:

- se `URL_IMAGENS` está correta;
- se a porta HTTP das imagens está correta;
- se o arquivo `figurinhas/FIG-XX.png` existe;
- se, em rede, a URL usa IP real e não `localhost`.

### A busca inicia, mas não encontra

Verifique:

- se o peer que possui a figurinha está conectado;
- se o inventário dele contém a figurinha;
- se o `sticker_id` foi digitado no formato `FIG-XX`;
- se o `ttl` não chegou a zero;
- se a busca não foi descartada por `query_id` duplicado.

---

## Verificação de sintaxe

Execute:

```powershell
node --check peer.js
node --check src\conexao.js
node --check src\protocolo.js
node --check src\menu.js
node --check src\inventario.js
node --check src\validacao.js
```

---

## Demonstração sugerida

Para demonstrar o funcionamento do trabalho:

1. Inicie os peers sem erros.
2. Mostre o envio e recebimento de `HELLO`.
3. Busque uma figurinha que esteja em outro peer.
4. Mostre o `query_id` gerado.
5. Mostre o `ttl` sendo decrementado.
6. Mostre a busca sendo repassada por inundação.
7. Mostre o `SEARCH_HIT` voltando.
8. Faça uma troca de figurinhas.
9. Mostre os dois inventários atualizados.
10. Mostre que o sistema não permite inventário negativo.

---

## Observações

- A porta WebSocket padrão do trabalho é `8080`.
- A porta HTTP `3000` serve apenas para disponibilizar imagens.
- Para teste local na mesma máquina, use portas diferentes.
- Para teste em rede com colegas, use o IP do colega no `vizinhos.json`.
- Para imagem em rede, configure `URL_IMAGENS` com o seu próprio IP.
- O arquivo de histórico é local e não precisa ser versionado.
