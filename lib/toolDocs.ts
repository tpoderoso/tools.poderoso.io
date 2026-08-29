import type { ToolId } from "./nav";

export interface ToolDocContent {
  /** Abertura: o que a ferramenta faz, pra quem e por quê. */
  intro: string;
  sections: {
    h: string;
    body: string[];
    /** Implementações da mesma coisa em linguagens diferentes: viram abas, não blocos empilhados. */
    code?: { id: string; lang: string; src: string }[];
    /**
     * Amostra de Markdown: a fonte e, embaixo, o mesmo trecho renderizado pelo
     * próprio visualizador. Ver components/tools/markdown/MarkdownDemo.tsx.
     */
    demo?: string;
    /**
     * Ilustração da seção. `w`/`h` são os pixels reais do arquivo (2x); o CSS exibe
     * pela metade e o par largura/altura reserva o espaço, então nada pula ao carregar.
     * Fonte em assets/doc-images/*.svg, gerada com `npm run doc-images`.
     */
    img?: { src: string; alt: string; caption: string; w: number; h: number };
  }[];
  /** Vira FAQPage no JSON-LD da página, então pergunta e resposta precisam se sustentar sozinhas. */
  faq: { q: string; a: string }[];
  /** Fonte primária, não link de blog. Renderizado como lista no fim do texto. */
  refs: { label: string; href: string; note: string }[];
}

// Prosa aceita link inline no formato [texto](url). Ver components/ui/ToolDoc.tsx.

const PRIVACIDADE =
  "Nada do que você cola aqui sai do seu navegador. O processamento é todo local, em JavaScript, sem envio para servidor, sem log e sem armazenamento.";

const REF_LGPD = {
  label: "Lei 13.709/2018 (LGPD)",
  href: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
  note: "Texto integral da lei, incluindo o conceito de dado pessoal que vale também em ambiente de teste.",
};

export const TOOL_DOCS: Partial<Record<ToolId, ToolDocContent>> = {
  json: {
    intro:
      "Uma caixa de entrada e três respostas: o JSON reindentado, a árvore navegável e o veredito da validação. Você cola o texto uma vez e escolhe como quer olhar para ele, sem trocar de ferramenta no meio do caminho.",
    sections: [
      {
        h: "JSON em trinta segundos",
        body: [
          "JSON é um jeito de escrever dados que tanto uma pessoa quanto um programa conseguem ler. Ele tem duas caixas e nada além disso. O objeto, escrito entre chaves, guarda pares de nome e valor. O array, escrito entre colchetes, guarda uma lista em ordem.",
          "Dentro do objeto, cada par é uma chave e um valor separados por dois-pontos. A chave é sempre um texto entre aspas duplas, sem exceção. Os pares são separados por vírgula, e o último par não leva vírgula nenhuma. É justamente essa vírgula sobrando que quebra a maioria dos JSONs escritos à mão.",
          "Objeto dentro de objeto, array dentro de array, array dentro de objeto: dá para aninhar quanto você quiser. É essa hierarquia que a indentação desenha, e é por isso que um JSON indentado é tão mais fácil de ler que o mesmo JSON em uma linha só.",
        ],
        img: {
          src: "/img/json-anatomia.webp",
          alt: "Objeto JSON com chave, valor, vírgula, array e null identificados por números, com a legenda de cada parte embaixo.",
          caption: "As partes de um objeto JSON. Os quatro números marcam o que aparece em praticamente todo documento.",
          w: 880,
          h: 656,
        },
      },
      {
        h: "Os seis tipos, e só eles",
        body: [
          "Um valor em JSON só pode ser uma de seis coisas: texto, número, verdadeiro ou falso, null, objeto ou array. Não existe uma sétima opção, e é isso que torna o formato tão simples de implementar em qualquer linguagem.",
          "Repare no que não está na lista: data. Quando você vê 2024-03-01 dentro de um JSON, aquilo é um texto. Quem entende que ali tem uma data é o seu código, não o formato. Vale o mesmo para dinheiro, que aparece ora como número, ora como texto, dependendo de quem escreveu a API.",
          "null também merece atenção. Ele quer dizer que o campo existe e está vazio de propósito, o que é diferente do campo simplesmente não aparecer no documento. Muita regra de negócio depende dessa distinção.",
        ],
        img: {
          src: "/img/json-tipos.webp",
          alt: "Tabela com os seis tipos do JSON, string, number, boolean, null, object e array, cada um com um exemplo de valor.",
          caption: "Todo valor de um JSON é um destes seis tipos. Data não é um deles.",
          w: 880,
          h: 600,
        },
      },
      {
        h: "Uma entrada, três respostas",
        body: [
          "O texto que você cola passa por [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) e volta por JSON.stringify com indentação de dois espaços. Não existe botão de formatar: a saída acompanha a digitação, e a mesma leitura que produz o texto formatado alimenta a árvore e a validação.",
          "Por isso a validação não é uma aba separada. Ela é o estado da entrada, mostrada na faixa embaixo do editor: JSON válido com o tamanho e a contagem de chaves, ou a linha e a coluna exatas do erro com uma explicação em português e, quando dá, o botão de corrigir.",
          "Enquanto o texto está quebrado, o painel da direita não fica vazio: ele segura o último resultado válido, apagado, para você não perder a referência do que estava lendo. Assim que o JSON volta a fechar, a saída acende de novo.",
          PRIVACIDADE,
        ],
      },
      {
        h: "Por que um JSON quebra",
        body: [
          "Quase todo JSON inválido cai em um punhado pequeno de erros, e quase sempre pelo mesmo motivo: alguém escreveu à mão, ou colou um objeto de JavaScript achando que era JSON. Os quatro mais comuns estão na imagem abaixo, com a versão que falha em cima e a que funciona embaixo.",
          "A regra que resume os quatro é curta. JSON é um formato de dados, não é código. Ele não tem comentário, não aceita vírgula depois do último item, não aceita aspas simples e não conhece undefined. Se o texto parece código, provavelmente é código, e o parser vai recusar.",
          "Quando o erro aparece, ele vem com linha e coluna. Vá até essa linha, mas olhe também a de cima: falta de vírgula ou de fechamento só é percebida pelo parser na linha seguinte, que é onde ele desiste. O erro está apontado onde a leitura travou, não necessariamente onde você digitou errado.",
        ],
        img: {
          src: "/img/json-erros.webp",
          alt: "Quatro erros comuns de JSON, vírgula sobrando, aspas simples, chave sem aspas e comentário, cada um com a versão errada em vermelho e a corrigida em verde.",
          caption: "Os quatro erros que aparecem em quase todo JSON escrito à mão. A correção automática resolve esses casos.",
          w: 880,
          h: 732,
        },
      },
      {
        h: "O que a correção automática resolve",
        body: [
          "Aspas simples no lugar de duplas, vírgula sobrando antes de fechar chave ou colchete, comentários no estilo // e /* */, e chaves ou colchetes que ficaram abertos. São os erros que aparecem quando alguém escreve JSON à mão ou cola um objeto JavaScript achando que é JSON.",
          "A correção é uma sugestão, não uma imposição: o botão só aparece quando a ferramenta consegue reconstruir um JSON válido, e o resultado substitui a entrada para você conferir antes de copiar. Em caso de ambiguidade ela prefere não adivinhar e devolve só o erro apontado.",
        ],
      },
      {
        h: "JSON não é JavaScript",
        body: [
          "A confusão mais comum vem daí. Na [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) as chaves são sempre strings entre aspas duplas, não existe comentário, não existe vírgula final e não existem valores como undefined, NaN ou Infinity. Um objeto que roda no console do navegador pode perfeitamente ser um JSON inválido.",
          "Existem dialetos que relaxam essas regras, como JSON5 e JSONC, esse último o que o VS Code aceita em tsconfig.json e settings.json. Eles são convenientes, mas não são JSON: uma API que recebe JSON5 vai recusar.",
        ],
      },
      {
        h: "Do texto para a árvore",
        body: [
          "Ler JSON como texto obriga você a contar chaves e colchetes de cabeça para saber em que nível está. A árvore faz essa conta por você. Cada objeto e cada array vira um nó que abre e fecha, e a indentação deixa de ser algo que você interpreta e passa a ser algo que você navega.",
          "A tradução é direta. Cada campo do objeto vira um filho com o nome do campo. Cada item do array vira um filho também, só que o nome dele é a posição, começando do zero. É exatamente a mesma contagem que você usaria no código para pegar aquele item, então o caminho que você lê na árvore é o caminho que você escreve.",
          "Valores simples, como texto e número, são folhas: não abrem, porque não têm nada dentro. Só objeto e array abrem. Quando um nó não expande, é porque você chegou no valor final.",
        ],
        img: {
          src: "/img/json-arvore.webp",
          alt: "O mesmo documento JSON mostrado duas vezes, primeiro como texto indentado e depois como árvore de nós com campos e itens de array.",
          caption: "O mesmo documento nas duas formas. Cada campo vira um nó; cada item do array vira um nó nomeado pela posição.",
          w: 880,
          h: 888,
        },
      },
      {
        h: "Dois modos de leitura da árvore",
        body: [
          "O modo de valores mostra o conteúdo real de cada campo. O modo de estrutura esconde os valores e mostra só os tipos, colapsando arrays homogêneos em uma linha, por exemplo string[] no lugar de trezentas strings repetidas. O segundo modo é o que responde rápido a pergunta que aparece quando você recebe uma API nova: qual é o formato disso?",
          "Na prática, o modo de estrutura é um esquema inferido do documento. Ele não substitui um [JSON Schema](https://json-schema.org/) escrito, porque só enxerga o que está naquele exemplo, mas serve para escrever o schema depois, ou para comparar duas respostas e achar o campo que apareceu.",
        ],
      },
      {
        h: "Documentos grandes",
        body: [
          "Expandir tudo de uma vez em um JSON muito grande trava a aba, então acima de um limite a ferramenta pede que você abra os nós manualmente. A contagem de nós usa saída antecipada, ou seja, ela para de contar assim que sabe que o documento é grande, sem varrer a árvore inteira.",
          "A leitura que acompanha a digitação também tem freio: ela roda em prioridade baixa, então colar alguns megabytes atrasa a saída por um instante em vez de travar a tecla. Acima de duzentos mil caracteres o texto formatado sai sem cores, porque dezenas de milhares de elementos coloridos custam mais do que ajudam.",
        ],
      },
      {
        h: "O que a especificação garante e o que não garante",
        body: [
          "A [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) define seis tipos e nada além disso: objeto, array, string, número, booleano e null. Não existe data, não existe inteiro versus decimal, não existe comentário. Data em JSON é convenção, quase sempre uma string no formato da [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339), e quem interpreta é a sua aplicação.",
          "A especificação também não obriga a preservar a ordem das chaves nem proíbe chave repetida, e cada linguagem resolve isso de um jeito. Em JavaScript a última repetida vence, silenciosamente. Vale saber disso antes de culpar a API.",
          "Números são outro ponto cego: a RFC não define precisão. Um id de 64 bits que cabe em Java perde precisão ao ser lido por JSON.parse, porque o number do JavaScript é ponto flutuante de 53 bits significativos. É por isso que APIs sérias mandam id grande como string.",
        ],
      },
      {
        h: "Sintaxe válida não é dado correto",
        body: [
          "Validar aqui é verificar sintaxe. Um JSON pode estar perfeitamente bem formado e ainda assim faltar um campo obrigatório, trazer um número onde a aplicação espera string ou usar um enum que não existe. Essa segunda camada é trabalho de [JSON Schema](https://json-schema.org/), que descreve o formato esperado e valida contra ele.",
        ],
      },
    ],
    faq: [
      {
        q: "O que é JSON, explicado de forma simples?",
        a: "É um formato de texto para guardar e trocar dados. Ele usa chaves para agrupar pares de nome e valor, e colchetes para listas. Qualquer linguagem de programação lê e escreve JSON, e é por isso que quase toda API usa esse formato.",
      },
      {
        q: "Qual a diferença entre objeto e array em JSON?",
        a: "O objeto, entre chaves, guarda campos com nome, então você busca pelo nome do campo. O array, entre colchetes, guarda uma lista em ordem, então você busca pela posição, começando do zero. Um usuário é um objeto; uma lista de usuários é um array de objetos.",
      },
      {
        q: "Preciso clicar em algo para formatar ou validar?",
        a: "Não. A saída acompanha a digitação e a validação fica sempre visível embaixo do editor, com JSON válido ou a linha e a coluna do erro. As abas formatado e árvore só trocam a forma de olhar o mesmo documento.",
      },
      {
        q: "A ferramenta altera meus dados?",
        a: "Não. A formatação só muda espaço em branco e indentação: chaves, valores e tipos continuam os mesmos, porque o texto é reserializado a partir do objeto que foi lido. A árvore é só leitura. A única ação que reescreve a entrada é a correção automática, e ela depende de você clicar.",
      },
      {
        q: "Ele valida contra um JSON Schema?",
        a: "Não. A validação aqui é de sintaxe, não de esquema. Ela garante que o texto é um JSON bem formado, não que ele tem os campos e tipos que a sua aplicação espera. Para isso existe o JSON Schema.",
      },
      {
        q: "Posso colar um objeto JavaScript?",
        a: "Pode, e é exatamente para isso que serve a correção automática. Aspas simples, comentários e vírgula final são convertidos para JSON válido quando a conversão não é ambígua.",
      },
      {
        q: "Por que meu tsconfig.json não valida?",
        a: "Porque ele quase sempre é JSONC, o dialeto com comentários que o VS Code aceita. É válido para o VS Code e inválido como JSON. A correção automática remove os comentários e devolve JSON puro.",
      },
      {
        q: "Dá para ver só a estrutura, sem os valores?",
        a: "Sim, é o modo de estrutura da árvore. Ele substitui cada valor pelo seu tipo e agrupa arrays de primitivos homogêneos em uma entrada só, o que deixa o formato do documento visível em poucas linhas.",
      },
      {
        q: "O modo de estrutura serve como JSON Schema?",
        a: "Serve como ponto de partida, não como substituto. Ele descreve o exemplo que você colou, então campo opcional ausente naquela resposta simplesmente não aparece. Use como rascunho e complete à mão.",
      },
      {
        q: "Funciona com JSON muito grande?",
        a: "Sim, com o limite prático da memória da aba. Arquivos de alguns megabytes funcionam. Acima de um certo tamanho a árvore deixa de expandir tudo de uma vez e pede que você abra os nós manualmente, porque expandir milhares de nós é o que trava o navegador.",
      },
      {
        q: "Meu JSON é confidencial. Posso usar?",
        a: "Pode. Tudo roda inteiramente no seu navegador e nenhum byte é enviado para servidor. Você pode conferir desligando a rede depois de carregar a página: a ferramenta continua funcionando.",
      },
      {
        q: "Por que meu id numérico grande fica errado depois de formatar?",
        a: "Porque o number do JavaScript guarda 53 bits significativos. Um id de 64 bits é arredondado ao ser lido. Não é a formatação que corrompe, é a leitura. A solução do lado da API é trafegar o id como string.",
      },
    ],
    refs: [
      {
        label: "RFC 8259 (The JavaScript Object Notation Data Interchange Format)",
        href: "https://datatracker.ietf.org/doc/html/rfc8259",
        note: "A especificação vigente do JSON, e a referência que decide o que é sintaxe válida.",
      },
      {
        label: "json.org (em português)",
        href: "https://www.json.org/json-pt.html",
        note: "A gramática do formato em diagramas, útil para entender o que é e o que não é válido.",
      },
      {
        label: "MDN: JSON.parse()",
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse",
        note: "Comportamento exato do parser usado por esta ferramenta, incluindo o reviver.",
      },
      {
        label: "JSON Schema",
        href: "https://json-schema.org/",
        note: "A camada seguinte: validar campos, tipos e obrigatoriedade, não só sintaxe.",
      },
    ],
  },

  md: {
    intro:
      "O visualizador de Markdown pega texto em Markdown cru e mostra o documento formatado ao lado, com controles de leitura de verdade: fonte serifada ou monoespaçada, corpo do texto, largura da coluna, tema claro, escuro ou sépia, sumário e tela cheia.",
    sections: [
      {
        h: "Por que abrir Markdown fora do editor",
        body: [
          "README que chegou por anexo, resposta de uma IA, documentação copiada de um chat, rascunho de RFC, changelog de release. Em todos esses casos você tem Markdown e quer ler, não editar. O GitHub renderiza bem, mas exige um repositório e um commit. O seu editor renderiza, mas em um painel apertado, com a fonte do código e o tema do código.",
          "Aqui o documento vira uma página de leitura: coluna estreita, fonte com serifa, tema de sua escolha e nada de barra lateral competindo por atenção. É a diferença entre olhar um arquivo e ler um texto.",
          PRIVACIDADE,
        ],
      },
      {
        h: "Os controles de leitura, e por que cada um existe",
        body: [
          "Fonte. Texto corrido em fonte monoespaçada cansa, porque toda letra ocupa a mesma largura e o olho perde a silhueta da palavra, que é o que ele usa para reconhecer o texto sem soletrar. Por isso o padrão é serifada. A monoespaçada continua ali para quando o documento é quase todo código.",
          "Largura da coluna. Linha longa demais faz o olho errar a volta e reler a mesma frase. As três larguras oferecidas ficam entre 58 e 88 caracteres, que é a faixa onde a leitura contínua funciona melhor. Junto com o corpo do texto, em três tamanhos, dá para acertar a combinação para a sua tela e a sua distância dela.",
          "Tema. O escuro é o padrão da casa, o claro serve para imprimir ou projetar, e o sépia baixa o contraste do branco puro, que é o que incomoda em sessão longa de leitura. O sumário lista os títulos do documento e serve de índice, e a tela cheia tira o resto da interface do caminho.",
        ],
      },
      {
        h: "Títulos, e a estrutura que sai deles",
        body: [
          "O número de sustenidos no começo da linha define o nível: um para o título do documento, dois para seção, três para subseção, até seis. Não é decoração. É a partir dessa hierarquia que o sumário é montado, e é por ela que um leitor de tela navega o documento pulando de título em título.",
          "Parágrafo é qualquer bloco de texto separado por uma linha em branco. Duas quebras seguidas fazem dois parágrafos; uma quebra simples, no meio de uma frase, é ignorada e o texto continua na mesma linha. Se você quer mesmo forçar a quebra sem abrir parágrafo, termine a linha com dois espaços.",
        ],
        demo: `# Relatório de migração

## Contexto

O banco atual roda em uma versão sem suporte desde março.

### Riscos conhecidos

Nenhum backup foi testado nos últimos seis meses.`,
      },
      {
        h: "Ênfase: negrito, itálico, riscado e código",
        body: [
          "Um asterisco de cada lado deixa em itálico, dois deixam em negrito, três fazem os dois. Sublinhado funciona igual ao asterisco para itálico e negrito, e é questão de gosto qual usar, com uma ressalva: dentro de uma palavra, o sublinhado não pega, justamente para não estragar nomes como minha_variavel_longa.",
          "Crase simples marca código no meio da frase, e é o que você usa para um nome de arquivo, uma flag ou um trecho de comando sem tirá-lo do parágrafo. Dois tis de cada lado riscam o texto, que é uma extensão do GitHub e não faz parte do Markdown original.",
        ],
        demo: `Texto **em negrito**, texto *em itálico* e os dois
juntos em ***negrito e itálico***.

Rode \`npm run build\` antes do deploy.

Prazo ~~sexta-feira~~ segunda-feira.`,
      },
      {
        h: "Listas, inclusive a de tarefas",
        body: [
          "Hífen, asterisco ou mais no começo da linha abrem uma lista sem ordem, e tanto faz qual dos três. Número seguido de ponto abre uma lista numerada, e o número que importa é só o primeiro: os seguintes são recontados na renderização, então uma lista escrita inteira com 1. sai numerada certinho. Para aninhar, recue o item filho com dois espaços.",
          "A lista de tarefas é a mesma lista sem ordem com um par de colchetes logo depois do marcador. Com um xis dentro, a caixa aparece marcada; vazia, desmarcada. É extensão do GitHub, e é o que transforma uma lista qualquer em checklist de pull request ou de release.",
        ],
        demo: `- primeiro item
- segundo item
  - item aninhado, com dois espaços de recuo
  - outro aninhado

1. subir a migração
2. rodar o smoke test
3. liberar o tráfego

- [x] backup restaurado em homologação
- [ ] janela de manutenção comunicada`,
      },
      {
        h: "Citação, linha divisória, link e imagem",
        body: [
          "Um sinal de maior no começo da linha faz citação de bloco, que serve para destacar um trecho de outra fonte, um erro copiado do log ou um aviso. Três hífens sozinhos em uma linha viram régua horizontal, que separa assuntos dentro do mesmo documento.",
          "Link é o texto entre colchetes seguido do endereço entre parênteses. Imagem é a mesma coisa com um ponto de exclamação na frente, e o texto entre colchetes vira o atributo alt, que é o que aparece se a imagem não carregar e o que um leitor de tela anuncia. A sintaxe de imagem não está na amostra abaixo de propósito, para o manual não sair puxando arquivo de fora, mas é exatamente `![texto alternativo](endereço.png)`.",
        ],
        demo: `> A migração não pode começar sem backup validado.
> Isso não é recomendação, é bloqueio.

---

Detalhes na [especificação do CommonMark](https://commonmark.org/).`,
      },
      {
        h: "Tabela, com alinhamento por coluna",
        body: [
          "A primeira linha é o cabeçalho, a segunda define o alinhamento e as demais são os dados, tudo separado por barras verticais. Os dois-pontos na linha de alinhamento é que mandam: à esquerda alinha à esquerda, dos dois lados centraliza, à direita alinha à direita. Número quase sempre fica melhor alinhado à direita.",
          "As barras das pontas são opcionais e as colunas não precisam estar alinhadas no texto cru, embora alinhar ajude muito na hora de revisar. O número de colunas sai do cabeçalho: célula sobrando é descartada, célula faltando vira vazia.",
        ],
        demo: `| Método | Rota          | Status |
| :----- | :-----------: | -----: |
| GET    | /usuarios     |    200 |
| POST   | /usuarios     |    201 |
| DELETE | /usuarios/:id |    204 |`,
      },
      {
        h: "Bloco de código, com a linguagem declarada",
        body: [
          "Três crases abrem e fecham um bloco de código. O que vier logo depois das três crases de abertura é o nome da linguagem, e aparece como etiqueta no canto do bloco. Dentro do bloco nada é interpretado: asterisco continua asterisco, sustenido continua sustenido, e é por isso que o bloco é o lugar certo para colar comando, log e trecho de arquivo.",
          "Se o próprio código tiver três crases dentro, abra o bloco com quatro. A regra é que a cerca de fechamento precisa ter pelo menos tantas crases quanto a de abertura.",
        ],
        // string comum e não template literal: as crases da cerca são o conteúdo
        demo: [
          "```ts",
          "export function formatarCpf(cpf: string) {",
          "  return cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, \"$1.$2.$3-$4\");",
          "}",
          "```",
        ].join("\n"),
      },
      {
        h: "O que o renderizador entende, e o que ele descarta",
        body: [
          "Tudo o que está nas amostras acima, mais imagem, quebra de linha forçada e aninhamento de listas em vários níveis. É o Markdown do dia a dia, no sabor do [CommonMark](https://commonmark.org/) com as extensões do [GitHub](https://github.github.com/gfm/) que aparecem em documentação real: tabela, lista de tarefas e riscado.",
          "Link com esquema perigoso, como javascript:, é descartado na hora de montar o documento em vez de virar um link clicável. Isso importa porque documento Markdown circula colado de qualquer lugar, e um link que executa script é a forma mais fácil de transformar um texto em problema.",
          "O rodapé mostra contagem de palavras e uma estimativa de tempo de leitura, calculada a partir de uma velocidade média. Serve para dimensionar o documento antes de começar, não como cronômetro.",
        ],
      },
      {
        h: "Markdown é o formato em que a IA responde",
        body: [
          "Modelos de linguagem escrevem em Markdown por padrão. Você pede um plano de migração, uma análise comparativa, a documentação de um endpoint, e recebe títulos, listas, tabelas e blocos de código em texto cru. Enquanto está na janela do chat, aquilo é uma resposta. Colado aqui, vira um documento que você lê, ajusta e compartilha.",
          "É especialmente útil quando a resposta é longa. Um comparativo de quinze linhas de tabela é ilegível em texto cru e óbvio renderizado, e a diferença aparece já na primeira olhada.",
        ],
      },
    ],
    faq: [
      {
        q: "O que é Markdown?",
        a: "É uma forma de escrever texto formatado usando só caracteres comuns. Você escreve # antes de um título, asteriscos em volta de uma palavra para dar ênfase e hífen no começo da linha para fazer lista. O arquivo continua sendo texto puro, e é por isso que ele funciona em qualquer editor e entra bem em controle de versão.",
      },
      {
        q: "Preciso instalar alguma coisa?",
        a: "Não. Cole o texto ou abra o arquivo e o documento aparece renderizado. Tudo roda no navegador, sem cadastro e sem envio para servidor.",
      },
      {
        q: "Dá para colar a resposta de uma IA aqui?",
        a: "Dá, e é um dos usos mais comuns. Modelos respondem em Markdown, então copiar a resposta e colar aqui mostra o documento formatado, com títulos, tabelas e blocos de código no lugar.",
      },
      {
        q: "Como faço uma tabela em Markdown?",
        a: "Separe as células com barra vertical, ponha o cabeçalho na primeira linha e, na segunda, uma linha de hífens para cada coluna. Os dois-pontos nessa segunda linha definem o alinhamento: :--- à esquerda, :---: centralizado e ---: à direita. Tabela não faz parte do Markdown original, é extensão do GitHub, e é entendida aqui.",
      },
      {
        q: "Como quebro a linha sem começar um parágrafo novo?",
        a: "Termine a linha com dois espaços e continue escrevendo na linha seguinte. Uma quebra simples, sem os dois espaços, é ignorada e o texto continua no mesmo parágrafo. Duas quebras seguidas, ou seja, uma linha em branco, abrem um parágrafo novo.",
      },
      {
        q: "Qual a diferença entre Markdown e GitHub Flavored Markdown?",
        a: "O Markdown original, de 2004, não tem tabela, lista de tarefas nem texto riscado. O GitHub padronizou essas três coisas em cima do CommonMark, e o resultado é o dialeto que praticamente toda documentação usa hoje. Este visualizador entende os dois, então tanto faz em qual deles o seu texto foi escrito.",
      },
      {
        q: "Por que a fonte padrão é serifada e não monoespaçada?",
        a: "Porque o documento é para ler, não para editar. Fonte monoespaçada é ótima para código, onde alinhamento de coluna importa, e cansativa em texto corrido. O botão de monoespaçada continua ali para quando o documento é majoritariamente código.",
      },
      {
        q: "Ele edita o arquivo?",
        a: "Não. É um leitor. O texto que você cola é interpretado e exibido, sem gravar nada e sem alterar o original.",
      },
    ],
    refs: [
      {
        label: "CommonMark",
        href: "https://commonmark.org/",
        note: "A especificação que resolve as ambiguidades do Markdown original. Tem um tutorial de dez minutos que ensina a sintaxe inteira.",
      },
      {
        label: "GitHub Flavored Markdown",
        href: "https://github.github.com/gfm/",
        note: "O dialeto do GitHub, que adiciona tabela, lista de tarefas e riscado ao CommonMark.",
      },
      {
        label: "Guia de Markdown do GitHub",
        href: "https://docs.github.com/pt/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax",
        note: "Referência de sintaxe em português, útil para consultar enquanto escreve.",
      },
    ],
  },

  mermaid: {
    intro:
      "O visualizador de Mermaid transforma o texto do diagrama em desenho. Você escreve ou cola o código de um lado, o diagrama aparece do outro e atualiza enquanto você digita, com zoom, arraste, tela cheia e exportação em SVG ou PNG.",
    sections: [
      {
        h: "Diagrama que é texto",
        body: [
          "Mermaid é uma linguagem para descrever diagramas escrevendo. Em vez de arrastar retângulo e puxar seta com o mouse, você declara os nós e as ligações, e o layout é calculado para você. Trocar a ordem de dois passos é mover uma linha, não redesenhar metade da tela.",
          "A consequência prática é que o diagrama passa a morar no repositório, ao lado do código que ele explica. Ele entra no diff, aparece no pull request e é revisado como qualquer outro arquivo. Diagrama feito em ferramenta de desenho vira um binário que ninguém revisa e que desatualiza em silêncio na primeira mudança de arquitetura.",
          "O GitHub e o GitLab renderizam Mermaid direto no README e nas issues, dentro de um bloco de código marcado com a linguagem mermaid. Esta ferramenta é onde você confere o desenho antes de commitar.",
        ],
      },
      {
        h: "A dupla que funciona: peça o diagrama para a IA e veja aqui",
        body: [
          "Como Mermaid é texto, e modelo de linguagem gera texto muito bem, pedir o diagrama pronto para uma IA funciona melhor do que pedir uma imagem. Cole o trecho de código, o schema do banco ou só a descrição do processo no chat e peça: gere um diagrama Mermaid disso. A resposta vem em um bloco de código que você cola aqui e vê desenhado na hora.",
          "O ciclo completo tem quatro passos e leva menos de um minuto. Um, descreva ou cole o material no chat e peça o Mermaid, dizendo o tipo de diagrama que você quer. Dois, cole a resposta aqui. Três, olhe o desenho e conserte o que ficou errado editando o texto, com o diagrama atualizando enquanto você digita. Quatro, exporte em PNG para colar em apresentação, ou em SVG para versionar junto da documentação.",
          "O passo três não é opcional. Modelo acerta a estrutura geral e erra detalhe: um nó a mais, uma seta invertida, um rótulo trocado, um estado que ficou órfão. Ver o desenho é de longe a forma mais rápida de encontrar esse tipo de erro, muito mais rápida do que reler o código do diagrama. E corrigir costuma ser mudar uma linha.",
          "O caminho inverso também vale. Cole um diagrama que já existe, peça para a IA explicar o que ele descreve, adicionar um caminho de erro ou converter de fluxograma para diagrama de sequência. Como a entrada e a saída são texto, a conversa flui nos dois sentidos.",
        ],
      },
      {
        h: "Os tipos que dão mais retorno",
        body: [
          "Fluxograma, escrito como flowchart, é o mais usado: decisão, pipeline de deploy, caminho de um pedido. Diagrama de sequência, o sequenceDiagram, mostra quem chama quem e em que ordem no tempo, e é imbatível para explicar integração, autenticação e handshake de webhook.",
          "Diagrama de entidade e relacionamento, o erDiagram, descreve o modelo de dados com cardinalidade e vale como documentação viva do banco. Diagrama de estados, o stateDiagram-v2, descreve ciclo de vida, o clássico sendo o de um pedido que vai de criado a pago, cancelado ou estornado.",
          "Além desses existem diagrama de classes, gráfico de Gantt para cronograma, gráfico de pizza, mapa de jornada do usuário e outros. A [documentação oficial](https://mermaid.js.org/intro/) lista todos com exemplo copiável de cada um.",
        ],
      },
      {
        h: "O que a ferramenta faz além de desenhar",
        body: [
          "O diagrama é renderizado enquanto você digita, e dá para desligar isso e renderizar só quando quiser, o que ajuda em diagrama grande. Quando a sintaxe quebra, o erro aparece com o número da linha e o desenho anterior continua na tela, então você não perde a referência do que estava vendo.",
          "Na área do desenho: zoom com as teclas mais e menos, tecla 1 para voltar a cem por cento, tecla 0 para ajustar o diagrama à tela, tecla f para tela cheia e arraste com o mouse para mover. O painel de código abre e fecha com ctrl+b, para quando você quer só olhar.",
          "Para levar embora: copiar o SVG para a área de transferência, baixar o SVG, que é vetorial e escala sem borrar, ou baixar um PNG em duas vezes a resolução, que é o que costuma servir para slide e documento. Cinco temas de cor mudam a aparência do diagrama, incluindo o tema da casa.",
          "Tudo isso roda no seu navegador. A biblioteca do Mermaid é carregada na página e o diagrama nunca é enviado para servidor, o que importa quando ele descreve a arquitetura interna de um sistema.",
        ],
      },
    ],
    faq: [
      {
        q: "O que é Mermaid?",
        a: "É uma linguagem de texto para descrever diagramas. Você escreve as caixas e as setas em algumas linhas e uma biblioteca calcula o layout e desenha. Como é texto, o diagrama pode viver no repositório e ser revisado junto com o código.",
      },
      {
        q: "Posso pedir para uma IA gerar o diagrama e colar aqui?",
        a: "Pode, e é o uso mais comum hoje. Peça no chat um diagrama Mermaid do fluxo, do modelo de dados ou da sequência de chamadas, cole a resposta aqui e confira o desenho. Erros de detalhe ficam evidentes na imagem e se corrigem editando uma linha do texto.",
      },
      {
        q: "O GitHub renderiza Mermaid?",
        a: "Renderiza, dentro de um bloco de código marcado com a linguagem mermaid, tanto em README quanto em issue e pull request. O GitLab também. Esta ferramenta serve para você ver o resultado antes de commitar.",
      },
      {
        q: "Meu diagrama não renderiza, e agora?",
        a: "A mensagem de erro traz o número da linha em que o interpretador parou. As causas mais comuns são a primeira linha não declarar o tipo do diagrama, um identificador de nó com espaço ou acento fora de aspas, e uma seta escrita com a sintaxe de outro tipo de diagrama.",
      },
      {
        q: "Dá para exportar a imagem?",
        a: "Dá. SVG, que é vetorial e não perde qualidade em nenhum tamanho, ou PNG em duas vezes a resolução, que já sai nítido em tela de alta densidade e em projetor.",
      },
      {
        q: "Preciso instalar o Mermaid?",
        a: "Não. A biblioteca roda no navegador, dentro desta página. Nada é instalado e nada é enviado para servidor.",
      },
    ],
    refs: [
      {
        label: "Documentação oficial do Mermaid",
        href: "https://mermaid.js.org/intro/",
        note: "Sintaxe de todos os tipos de diagrama, com exemplo copiável de cada um.",
      },
      {
        label: "Mermaid: diagramas no GitHub",
        href: "https://docs.github.com/pt/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams",
        note: "Como colocar o diagrama dentro do README para o GitHub renderizar sozinho.",
      },
      {
        label: "Mermaid Live Editor",
        href: "https://mermaid.live/",
        note: "O editor oficial do projeto, útil como referência de comportamento e para gerar link compartilhável.",
      },
    ],
  },

  xml: {
    intro:
      "O formatador de XML reindenta documentos XML com a hierarquia correta de tags, incluindo os casos que costumam quebrar formatadores simples: atributos longos, elementos vazios auto fechados e conteúdo misto.",
    sections: [
      {
        h: "Onde XML ainda aparece",
        body: [
          "Nota fiscal eletrônica, SOAP, RSS, sitemap, arquivos de build como pom.xml, configuração de servidor de aplicação e integração bancária. É formato antigo, mas segue muito vivo em contexto corporativo e fiscal no Brasil.",
          "Um XML de NF-e vem tipicamente em uma linha só, com centenas de elementos. Reindentado, ele passa a ser conferível a olho.",
        ],
      },
      {
        h: "Espaço em branco importa mais do que parece",
        body: [
          "Diferente do JSON, em XML o espaço entre tags pode ser conteúdo. A [especificação do XML](https://www.w3.org/TR/xml/) trata espaço dentro de um elemento com conteúdo misto como texto significativo, e xml:space=\"preserve\" existe justamente para dizer isso ao processador. Reindentar um documento assim muda o conteúdo, não só a aparência.",
          "Na prática isso quase nunca morde em NF-e ou SOAP, onde os elementos carregam só valores. Mas morde em XHTML, em documentos com texto corrido e em qualquer schema que declare mixed=\"true\". Se o seu XML tem parágrafos, confira antes de sobrescrever o original.",
        ],
      },
      {
        h: "Formatar não é validar",
        body: [
          "A formatação reorganiza o documento e detecta erro grosseiro de boa formação, como tag que abre e não fecha. Ela não verifica se o documento obedece a um esquema. Para isso existe o validador de XSD, que confere o documento contra um ou mais schemas.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Ele preserva os atributos e os namespaces?",
        a: "Sim. A formatação mexe em quebra de linha e indentação. Atributos, prefixos de namespace, declaração XML e CDATA continuam onde estavam.",
      },
      {
        q: "Posso formatar um XML de nota fiscal eletrônica?",
        a: "Pode. É um dos usos mais comuns. O documento é processado localmente no navegador, então o conteúdo fiscal não sai da sua máquina.",
      },
      {
        q: "Qual o tamanho máximo?",
        a: "Não há limite fixo, mas acima de dezenas de milhares de elementos a coloração de sintaxe é desligada automaticamente e o resultado vira texto puro, porque renderizar tudo colorido travaria a aba.",
      },
      {
        q: "Reindentar pode mudar o significado do documento?",
        a: "Pode, em documentos com conteúdo misto, onde o espaço entre tags é texto de verdade. Em XML de integração, que só carrega valores em elementos, não muda nada. Na dúvida, guarde o original.",
      },
    ],
    refs: [
      {
        label: "W3C: Extensible Markup Language (XML) 1.0",
        href: "https://www.w3.org/TR/xml/",
        note: "A especificação. A seção 2.10 é a que trata do espaço em branco significativo.",
      },
      {
        label: "W3C: XML Schema Part 1 (Structures)",
        href: "https://www.w3.org/TR/xmlschema-1/",
        note: "Onde mixed content é definido, que é o caso em que a indentação importa.",
      },
    ],
  },

  sql: {
    intro:
      "O formatador de SQL quebra uma query longa em linhas com indentação por cláusula, deixando SELECT, FROM, JOIN, WHERE e GROUP BY alinhados. Uma query de trinta linhas mal formatada e a mesma query formatada têm custo de leitura completamente diferente.",
    sections: [
      {
        h: "Dialetos",
        body: [
          "A formatação usa o [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) e cobre a sintaxe comum a PostgreSQL, MySQL, SQL Server, Oracle e SQLite. Construções muito específicas de um banco podem cair em um tratamento genérico, que reindenta sem tentar entender a semântica, em vez de estragar a query.",
          "Bloco procedural é o limite conhecido. PL/SQL com BEGIN e END aninhados, ou T-SQL com fluxo de controle, não é SQL declarativo e o formatador é conservador ali de propósito: prefere devolver um resultado morno a reescrever errado.",
        ],
      },
      {
        h: "Formatar é a metade barata da revisão",
        body: [
          "Formatar não muda plano de execução nem resultado, mas muda o que você enxerga. JOIN sem condição, parêntese que fecha no lugar errado em um OR misturado com AND, e subquery correlacionada escondida no meio de uma linha de duzentos caracteres são todos erros que só aparecem depois da indentação.",
          "A outra metade é o EXPLAIN. Nenhuma formatação diz que você esqueceu um índice.",
        ],
      },
      {
        h: "Quando usar",
        body: [
          "Query capturada de log do ORM, consulta herdada que ninguém formatou, SQL colado de um chamado, revisão de pull request com migração grande. Formatar antes de revisar é o que torna possível enxergar o problema.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "A formatação muda o resultado da query?",
        a: "Não. Só muda espaço em branco e quebra de linha. A query formatada é semanticamente idêntica à original e produz exatamente o mesmo plano de execução.",
      },
      {
        q: "Funciona com query de qualquer banco?",
        a: "Funciona com a sintaxe comum aos principais bancos relacionais. Bloco procedural muito específico, como PL/SQL com BEGIN e END aninhados, cai em um tratamento conservador que reindenta sem reescrever.",
      },
      {
        q: "Posso colar query com dados reais?",
        a: "Pode. A formatação acontece no navegador e nada é enviado para servidor, então valores literais dentro da query não saem da sua máquina.",
      },
    ],
    refs: [
      {
        label: "sql-formatter",
        href: "https://github.com/sql-formatter-org/sql-formatter",
        note: "A biblioteca que faz a formatação aqui. O README lista os dialetos suportados.",
      },
    ],
  },

  xsdval: {
    intro:
      "O validador de XSD confere um documento XML contra um ou mais schemas XSD e lista os erros encontrados, com a linha de cada um. É a checagem que responde se o documento obedece ao contrato, não apenas se ele está bem formado.",
    sections: [
      {
        h: "Boa formação e validade são coisas diferentes",
        body: [
          "Um XML bem formado tem tags que abrem e fecham na ordem certa, conforme a [especificação do XML](https://www.w3.org/TR/xml/). Um XML válido, além disso, obedece a um esquema: os elementos certos, na ordem certa, com os tipos certos, conforme o [XML Schema](https://www.w3.org/TR/xmlschema-1/). Sem schema carregado a ferramenta verifica apenas a boa formação e diz isso explicitamente no resultado.",
          "Você pode carregar vários schemas de uma vez, o que é necessário quando o XSD principal usa import ou include para puxar outros. O limite é de cem arquivos por sessão.",
        ],
      },
      {
        h: "Validação de verdade, no navegador",
        body: [
          "A validação usa a [libxml2](https://gitlab.gnome.org/GNOME/libxml2) compilada para WebAssembly, o mesmo motor por trás do xmllint que você usaria no terminal. Isso significa validação real de XSD 1.0, não uma aproximação por expressão regular, rodando localmente.",
          "A consequência prática é que o resultado bate com o que o servidor de destino vai dizer, porque muita integração corporativa valida com a mesma libxml. E o documento não precisa sair da sua máquina para ser conferido, o que importa quando ele tem dado fiscal ou pessoal.",
        ],
      },
      {
        h: "Por que XSD 1.0 e não 1.1",
        body: [
          "A [versão 1.1](https://www.w3.org/TR/xmlschema11-1/) existe desde 2012 e traz assertions e tipos condicionais, mas quase nenhum motor a implementou por completo, a libxml2 incluída. Na prática, contratos de integração no Brasil, NF-e e schemas bancários entre eles, são escritos em 1.0 justamente porque é o que todo mundo consegue validar.",
        ],
      },
    ],
    faq: [
      {
        q: "Preciso enviar o XML para um servidor?",
        a: "Não. O validador roda inteiramente no navegador via WebAssembly. Documento e schemas são lidos localmente, o que importa quando o XML tem dado fiscal ou pessoal.",
      },
      {
        q: "Posso carregar mais de um schema?",
        a: "Sim, até cem arquivos. É o cenário normal quando o XSD principal usa import ou include para puxar outros schemas.",
      },
      {
        q: "Ele valida XSD 1.1?",
        a: "Não. A validação cobre XSD 1.0, que é o que a libxml2 implementa e o que praticamente todos os contratos de integração usam na prática, inclusive os da NF-e.",
      },
      {
        q: "O resultado é o mesmo do xmllint?",
        a: "É o mesmo motor, a libxml2, compilada para WebAssembly. As mensagens de erro e o veredito são os que o xmllint daria na linha de comando.",
      },
    ],
    refs: [
      {
        label: "W3C: XML Schema Part 1 (Structures)",
        href: "https://www.w3.org/TR/xmlschema-1/",
        note: "A especificação do XSD 1.0, que é a versão validada aqui.",
      },
      {
        label: "W3C: XML Schema Definition Language 1.1",
        href: "https://www.w3.org/TR/xmlschema11-1/",
        note: "A versão seguinte, para entender o que ficou de fora e por quê.",
      },
      {
        label: "libxml2",
        href: "https://gitlab.gnome.org/GNOME/libxml2",
        note: "O motor de validação usado aqui, o mesmo do xmllint.",
      },
    ],
  },

  epoch: {
    intro:
      "O conversor de epoch traduz timestamp Unix para data legível e o caminho de volta, mostrando o mesmo instante em vários fusos ao mesmo tempo. É a ferramenta que resolve o campo created_at que veio como 1735689600 no meio de um log.",
    sections: [
      {
        h: "Segundos ou milissegundos",
        body: [
          "Epoch é a contagem de tempo desde 1 de janeiro de 1970 em UTC. A confusão clássica é a unidade: linguagens como Java e JavaScript trabalham em milissegundos, enquanto Unix, PostgreSQL e a maioria das APIs usam segundos. Um número de dez dígitos costuma ser segundos e um de treze, milissegundos.",
          "O sintoma de errar a unidade é característico. Ler milissegundos como se fossem segundos joga a data para o ano 56 mil; ler segundos como milissegundos joga para janeiro de 1970. Se você viu uma dessas duas datas, o problema é a unidade, não o valor.",
        ],
      },
      {
        h: "Fuso é onde o bug mora",
        body: [
          "O Brasil não tem horário de verão desde o [Decreto 9.772/2019](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/d9772.htm), mas o país continua com mais de um fuso: Brasília em GMT menos 3, Amazonas em GMT menos 4 e Acre em GMT menos 5. A ferramenta mostra o instante convertido em vários fusos lado a lado, incluindo o seu, justamente para tornar visível a diferença que causa o erro de um dia a mais ou a menos.",
          "Vale lembrar que epoch em si não tem fuso: ele é um instante absoluto. O fuso entra só na hora de exibir. Quase todo bug de data nasce de guardar o resultado da exibição em vez do instante, ou de converter duas vezes.",
          "Regras de fuso mudam por decisão política e são distribuídas pelo [banco de dados de fusos da IANA](https://www.iana.org/time-zones), que é atualizado várias vezes por ano. Sistema com tzdata velho erra datas históricas mesmo com o código certo.",
        ],
      },
      {
        h: "Formato de troca",
        body: [
          "Para trafegar data entre sistemas, o formato recomendado é o da [RFC 3339](https://datatracker.ietf.org/doc/html/rfc3339), o perfil do ISO 8601 usado na internet: 2026-08-28T14:30:00-03:00. Ele carrega o deslocamento explícito, o que elimina a ambiguidade que uma string sem fuso sempre traz.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Como sei se meu timestamp está em segundos ou milissegundos?",
        a: "Pelo número de dígitos. Datas atuais em segundos têm dez dígitos e em milissegundos têm treze. Se a conversão devolveu uma data em 1970, o valor provavelmente estava em milissegundos e foi lido como segundos.",
      },
      {
        q: "O que é o problema do ano 2038?",
        a: "Sistemas que guardam epoch em inteiro de 32 bits com sinal estouram em 19 de janeiro de 2038, virando para 1901. Sistemas modernos usam 64 bits e não têm esse limite, mas ele ainda aparece em código legado e em bancos com coluna mal dimensionada.",
      },
      {
        q: "A conversão usa o fuso do meu computador?",
        a: "O fuso local do seu navegador é um dos exibidos, identificado como tal, mas a conversão também mostra UTC e outros GMT em paralelo para você comparar sem precisar mudar configuração.",
      },
      {
        q: "O Brasil ainda tem horário de verão?",
        a: "Não. Foi extinto pelo Decreto 9.772, de 2019. Datas anteriores a essa mudança continuam sujeitas ao horário de verão vigente na época, o que é motivo comum de erro de uma hora em relatório histórico.",
      },
    ],
    refs: [
      {
        label: "RFC 3339 (Date and Time on the Internet)",
        href: "https://datatracker.ietf.org/doc/html/rfc3339",
        note: "O formato de data recomendado para troca entre sistemas, com deslocamento explícito.",
      },
      {
        label: "IANA Time Zone Database",
        href: "https://www.iana.org/time-zones",
        note: "A fonte das regras de fuso que todo sistema operacional e runtime consome.",
      },
      {
        label: "Decreto 9.772/2019",
        href: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/decreto/d9772.htm",
        note: "O decreto que revogou o horário de verão brasileiro.",
      },
      {
        label: "Problema do ano 2038",
        href: "https://en.wikipedia.org/wiki/Year_2038_problem",
        note: "Por que inteiro de 32 bits com sinal estoura em 19 de janeiro de 2038.",
      },
    ],
  },

  cpf: {
    intro:
      "O gerador de CPF cria números de CPF que passam na validação do dígito verificador, para você usar em teste de cadastro, formulário e ambiente de homologação. São números sinteticamente válidos e não pertencem a nenhuma pessoa.",
    sections: [
      {
        h: "Como o CPF é validado",
        body: [
          "O CPF tem onze dígitos: nove de base e dois verificadores. Os verificadores saem de um cálculo de módulo 11 sobre os dígitos anteriores, com pesos decrescentes. O primeiro usa pesos de 10 a 2 sobre os nove primeiros dígitos; o segundo usa pesos de 11 a 2 sobre os dez primeiros, já incluindo o dígito recém calculado. Em ambos, resto menor que dois resulta em dígito zero.",
          "É por isso que digitar onze dígitos quaisquer quase sempre é rejeitado: a chance de acertar os dois verificadores por acaso é de um em cem. A ferramenta faz esse cálculo, então o número gerado passa em qualquer validação de dígito verificador.",
          "O nono dígito, aliás, não é aleatório na vida real: ele identifica a região fiscal de emissão, de 1 a 0, sendo 8 o código de São Paulo, por exemplo. Validador nenhum confere isso, mas vale saber que o número carrega essa informação.",
        ],
      },
      {
        h: "O cálculo, passo a passo",
        body: [
          "Vale acompanhar com um número concreto: 529.982.247-25. A base são os nove primeiros dígitos, 529982247, e os dois últimos são o que vamos recalcular.",
          "Primeiro dígito: multiplique cada um dos nove dígitos por um peso que começa em 10 e desce até 2. Fica 5x10=50, 2x9=18, 9x8=72, 9x7=63, 8x6=48, 2x5=10, 2x4=8, 4x3=12 e 7x2=14. A soma dá 295. O resto de 295 por 11 é 9. Como o resto é maior ou igual a 2, o dígito é 11 menos 9, ou seja, 2.",
          "Segundo dígito: repita a conta sobre dez dígitos, agora incluindo o 2 que acabou de sair, com pesos de 11 a 2. A soma dá 347, o resto por 11 é 6, e o dígito é 11 menos 6, ou seja, 5. Fecha em 25, que é exatamente o que estava no número.",
          "A regra que sobra é a do resto menor que 2: nesse caso o dígito é zero, não 11 nem 10. É de longe o erro mais comum em implementação caseira.",
        ],
      },
      {
        h: "Implementação de referência",
        body: [
          "As duas funções abaixo fazem a conta descrita acima. O detalhe do (soma vezes 10) módulo 11 é um atalho aritmético equivalente à regra do 11 menos o resto, com a vantagem de já devolver 0 nos casos em que o resto era 0 ou 1. Só o 10 precisa ser tratado à parte.",
          "Duas guardas antes da conta merecem atenção. A primeira remove só a máscara, ponto, hífen e espaço, em vez de remover todo caractere não numérico: um replace genérico aceitaria 529.982.247-25x, porque o x sairia junto com a pontuação. A segunda rejeita sequência repetida, sem a qual 111.111.111-11 e as outras dez passam, já que satisfazem o módulo 11 por acidente.",
        ],
        code: [
          { id: "ts", lang: "TypeScript", src: `export function isValidCpf(value: string): boolean {
  // tira so a mascara. Um \\D generico aqui aceitaria "529.982.247-25x",
  // porque o lixo sairia junto com o ponto e o hifen.
  const digits = value.replace(/[.\\s-]/g, "");

  // 11 digitos e nada de sequencia repetida: 111.111.111-11
  // satisfaz o modulo 11 por acidente.
  if (!/^\\d{11}$/.test(digits)) return false;
  if (/^(\\d)\\1{10}$/.test(digits)) return false;

  // len = 9 calcula o primeiro DV (pesos 10..2),
  // len = 10 calcula o segundo (pesos 11..2).
  const dv = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Number(digits[i]) * (len + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return dv(9) === Number(digits[9])
    && dv(10) === Number(digits[10]);
}` },
          { id: "cs", lang: "C#", src: `public static bool IsValidCpf(string value)
{
    var digits = "";
    foreach (var c in value)
    {
        if (c == '.' || c == '-' || c == ' ') continue;
        if (c < '0' || c > '9') return false;
        digits += c;
    }

    if (digits.Length != 11) return false;

    var repeated = true;
    for (var i = 1; i < 11; i++)
        if (digits[i] != digits[0]) { repeated = false; break; }
    if (repeated) return false;

    int Dv(int len)
    {
        var sum = 0;
        for (var i = 0; i < len; i++)
            sum += (digits[i] - '0') * (len + 1 - i);
        var rest = sum * 10 % 11;
        return rest == 10 ? 0 : rest;
    }

    return Dv(9) == digits[9] - '0'
        && Dv(10) == digits[10] - '0';
}` },
        ],
      },
      {
        h: "Válido não é o mesmo que existente",
        body: [
          "Passar no dígito verificador significa apenas que o número é bem formado. Não diz nada sobre estar inscrito na [Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf), nem sobre a situação cadastral. Quem precisa dessa checagem consulta a Receita, e nenhum gerador substitui isso.",
          "Alguns validadores mal escritos aceitam sequências como 111.111.111-11, que satisfazem o módulo 11 por acidente. Um validador correto rejeita as onze sequências de dígito repetido explicitamente. Vale testar o seu com esses valores.",
        ],
      },
      {
        h: "Uso responsável",
        body: [
          "Estes números servem para desenvolvimento e teste. Usar CPF de terceiro ou apresentar CPF falso como próprio em cadastro real é crime. O ponto da ferramenta é justamente o contrário: parar de usar CPF de pessoa real em base de teste, o que também é uma exigência prática da [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), já que ambiente de homologação com dado real continua sendo tratamento de dado pessoal.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "O CPF gerado existe de verdade?",
        a: "Não. Ele é matematicamente válido, ou seja, passa na checagem do dígito verificador, mas não corresponde a nenhum cadastro na Receita Federal. É exatamente o que se quer em ambiente de teste.",
      },
      {
        q: "Posso usar em cadastro real?",
        a: "Não. Serve só para desenvolvimento, teste automatizado e homologação. Usar CPF falso ou de terceiro em cadastro real é ilegal.",
      },
      {
        q: "Como funciona o cálculo do dígito verificador?",
        a: "Os dois últimos dígitos vêm de um módulo 11. O primeiro aplica pesos de 10 a 2 sobre os nove dígitos de base; o segundo aplica pesos de 11 a 2 sobre os dez dígitos já com o primeiro verificador. Se o resto for menor que dois, o dígito é zero.",
      },
      {
        q: "Por que 111.111.111-11 passa em alguns validadores?",
        a: "Porque sequências de dígito repetido satisfazem o módulo 11 por acidente. Um validador correto rejeita as onze sequências explicitamente, antes de calcular. É um bom caso de teste para o seu código.",
      },
      {
        q: "O que significa o nono dígito do CPF?",
        a: "Ele indica a região fiscal em que o CPF foi emitido. Não entra em nenhuma validação de formato, mas explica por que CPFs de um mesmo estado tendem a compartilhar esse dígito.",
      },
    ],
    refs: [
      {
        label: "Receita Federal: Meu CPF",
        href: "https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf",
        note: "Página oficial do cadastro, incluindo consulta de situação cadastral.",
      },
      REF_LGPD,
    ],
  },

  cnpj: {
    intro:
      "O gerador de CNPJ produz números válidos no dígito verificador para teste de cadastro de empresa, integração fiscal e homologação. Inclui o formato alfanumérico definido pela Receita Federal, que a maioria dos sistemas ainda não suporta.",
    sections: [
      {
        h: "CNPJ alfanumérico",
        body: [
          "A Instrução Normativa RFB 2.229, de 2024, define o CNPJ alfanumérico: os oito dígitos da raiz e os quatro da ordem passam a aceitar letras, enquanto os dois dígitos verificadores continuam numéricos. O cálculo do verificador usa o valor ASCII do caractere menos 48, o que faz letra e número entrarem na mesma conta.",
          "A consequência é direta e cara: todo sistema que guarda CNPJ como inteiro vai quebrar, toda máscara que só aceita dígito vai recusar cadastro legítimo, e todo índice numérico vai precisar migrar para texto. Testar com esse formato desde já é a diferença entre descobrir agora e descobrir em produção.",
          "A ferramenta gera nos dois formatos, o numérico tradicional e o alfanumérico, para você exercitar os dois caminhos do código.",
        ],
      },
      {
        h: "O cálculo, passo a passo",
        body: [
          "Acompanhe com 11.222.333/0001-81. A base são as doze primeiras posições, 112223330001, e os dois últimos dígitos são o que vamos recalcular.",
          "Primeiro dígito: os pesos são 5, 4, 3, 2 e depois 9, 8, 7, 6, 5, 4, 3, 2. Note que eles descem até 2 e voltam para 9, que é a diferença em relação ao CPF. As parcelas dão 5, 4, 6, 4, 18, 24, 21, 18, 0, 0, 0 e 2, somando 102. O resto de 102 por 11 é 3, então o dígito é 11 menos 3, ou seja, 8.",
          "Segundo dígito: mesma ideia sobre treze posições, incluindo o 8, com os pesos deslocados em um: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2. A soma dá 120, o resto por 11 é 10 e o dígito é 1. Fecha em 81.",
          "Como no CPF, resto menor que 2 significa dígito zero.",
        ],
      },
      {
        h: "Implementação de referência",
        body: [
          "A implementação abaixo já trata o formato alfanumérico. A única mudança em relação ao CNPJ numérico é a linha que converte o caractere: em vez de interpretar o dígito, ela usa o código ASCII menos 48. Para \"0\" a \"9\" o resultado é 0 a 9, exatamente como antes, e para \"A\" a \"Z\" é 17 a 42. Por isso o mesmo código serve para os dois formatos.",
          "Os dois dígitos verificadores continuam numéricos, então uma letra nas posições 13 ou 14 nunca vai bater com o valor calculado e o CNPJ é recusado, que é o comportamento correto.",
        ],
        code: [
          { id: "ts", lang: "TypeScript", src: `export function isValidCnpj(value: string): boolean {
  // tira so a mascara, nao qualquer nao-alfanumerico.
  const base = value.replace(/[./\\s-]/g, "").toUpperCase();

  // 12 posicoes alfanumericas + 2 DVs, que continuam numericos.
  if (!/^[0-9A-Z]{12}\\d{2}$/.test(base)) return false;
  if (/^(.)\\1{13}$/.test(base)) return false;

  // IN RFB 2.229/2024: o valor do caractere e o ASCII menos 48.
  // "0" vira 0, "A" vira 17. Digito e letra entram na mesma conta.
  const val = (i: number) => base.charCodeAt(i) - 48;

  // pesos: 5,4,3,2,9,8,7,6,5,4,3,2 no primeiro DV
  //     e  6,5,4,3,2,9,8,7,6,5,4,3,2 no segundo.
  const dv = (len: number): number => {
    let sum = 0;
    let weight = len - 7;
    for (let i = 0; i < len; i++) {
      sum += val(i) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  // DV continua numerico: letra na posicao 12 ou 13 nunca bate.
  return dv(12) === val(12) && dv(13) === val(13);
}` },
          { id: "cs", lang: "C#", src: `public static bool IsValidCnpj(string value)
{
    var b = "";
    foreach (var c in value.ToUpperInvariant())
    {
        if (c == '.' || c == '/' || c == '-' || c == ' ') continue;
        if (!((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z')))
            return false;
        b += c;
    }

    // 12 posicoes alfanumericas + 2 DVs, que continuam numericos.
    if (b.Length != 14) return false;
    if (b[12] < '0' || b[12] > '9') return false;
    if (b[13] < '0' || b[13] > '9') return false;

    var repeated = true;
    for (var i = 1; i < 14; i++)
        if (b[i] != b[0]) { repeated = false; break; }
    if (repeated) return false;

    int Dv(int len)
    {
        int sum = 0, weight = len - 7;
        for (var i = 0; i < len; i++)
        {
            // ASCII menos 48: "0" vira 0, "A" vira 17.
            sum += (b[i] - '0') * weight;
            weight = weight == 2 ? 9 : weight - 1;
        }
        var rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    }

    return Dv(12) == b[12] - '0' && Dv(13) == b[13] - '0';
}` },
        ],
      },
      {
        h: "Estrutura do número",
        body: [
          "São catorze posições: oito de raiz, que identificam a empresa, quatro de ordem, que identificam o estabelecimento, sendo 0001 a matriz, e dois verificadores calculados por módulo 11 com pesos que vão de 5 a 2 e depois de 9 a 2. O formato impresso é 00.000.000/0001-00.",
          "Cada filial tem CNPJ próprio, com a mesma raiz e ordem diferente, e verificadores recalculados. Sistemas que assumem um CNPJ por empresa costumam tropeçar aí.",
        ],
      },
      {
        h: "Válido não é o mesmo que ativo",
        body: [
          "O dígito verificador só diz que o número é bem formado. Situação cadastral, natureza jurídica, CNAE e endereço vêm da [base do CNPJ na Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj), não do número. Nenhum gerador consulta isso, e é bom que não consulte.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "O que muda no CNPJ alfanumérico?",
        a: "A raiz e a ordem passam a aceitar letras além de números. Os dois dígitos verificadores continuam numéricos e o cálculo usa o valor ASCII dos caracteres menos 48. Na prática, quem guarda CNPJ em coluna numérica precisa migrar para texto.",
      },
      {
        q: "O CNPJ gerado corresponde a uma empresa real?",
        a: "Não. Ele é válido no dígito verificador mas não existe no cadastro da Receita Federal. Serve para teste, não para consulta.",
      },
      {
        q: "Como gerar CNPJ de filial?",
        a: "A ordem é o bloco de quatro dígitos depois da raiz. 0001 é a matriz e 0002 em diante são filiais, cada uma com dígitos verificadores próprios calculados sobre a raiz mais a ordem.",
      },
      {
        q: "Meu sistema guarda CNPJ como número. O que quebra?",
        a: "Tudo que envolver letra: inserção, índice, comparação e máscara de formulário. A migração mínima é trocar a coluna para texto de catorze posições e trocar a validação de dígito por uma que trate caractere, não valor numérico.",
      },
    ],
    refs: [
      {
        label: "Receita Federal: CNPJ",
        href: "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj",
        note: "Página oficial do cadastro, com as regras vigentes e as orientações de transição.",
      },
      REF_LGPD,
    ],
  },

  company: {
    intro:
      "O gerador de empresa fictícia monta um cadastro de pessoa jurídica completo e coerente: razão social, nome fantasia, CNPJ válido, inscrição estadual, endereço, telefone e e-mail. É a massa de teste que um formulário de cadastro de fornecedor ou cliente costuma exigir por inteiro.",
    sections: [
      {
        h: "Coerência entre os campos",
        body: [
          "Os dados não são sorteados de forma independente. O nome fantasia combina com o segmento, a razão social deriva do nome fantasia com o tipo societário, e a inscrição estadual segue a regra de cálculo do estado do endereço.",
          "Isso importa porque um cadastro de teste com campos incoerentes esconde bug: o formulário aceita, mas a regra de negócio real recusaria. Massa de teste boa é a que se parece com produção o suficiente para exercitar as mesmas validações.",
        ],
      },
      {
        h: "Inscrição estadual não tem formato único",
        body: [
          "Cada unidade da federação define o seu, e eles diferem em tudo: número de dígitos, pesos e até o módulo do cálculo. São Paulo usa doze posições com dois dígitos verificadores em posições não contíguas; Rio de Janeiro usa oito; Minas Gerais tem um algoritmo próprio com etapa intermediária. O [SINTEGRA](http://www.sintegra.gov.br/insc_est.html) publica a regra de cada estado.",
          "É por isso que validar inscrição estadual com uma expressão regular só dá errado, e por isso a empresa gerada aqui usa a regra do estado que saiu no endereço.",
        ],
      },
      {
        h: "Para que serve",
        body: [
          "Popular ambiente de homologação, montar cenário de teste automatizado, demonstrar um sistema sem expor cliente real e preencher formulário longo durante desenvolvimento sem inventar dado a cada campo.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "A inscrição estadual gerada é válida?",
        a: "Ela segue a regra de formação e o dígito verificador do estado escolhido, que difere de estado para estado. É válida no cálculo, mas não corresponde a nenhuma inscrição realmente registrada.",
      },
      {
        q: "As empresas geradas existem?",
        a: "Não. Razão social, nome fantasia e CNPJ são sintéticos. Qualquer coincidência com empresa real é acaso e o dado não deve ser usado como se fosse verdadeiro.",
      },
      {
        q: "Posso gerar várias empresas de uma vez?",
        a: "Cada geração produz um cadastro completo e você pode gerar quantos quiser em sequência, copiando cada um. É o suficiente para montar uma massa de teste manualmente.",
      },
      {
        q: "Por que a inscrição estadual muda de tamanho?",
        a: "Porque o formato é definido por cada estado. São Paulo tem doze dígitos, Rio de Janeiro tem oito, e assim por diante. Um validador único para o Brasil inteiro não existe: são vinte e sete regras.",
      },
    ],
    refs: [
      {
        label: "SINTEGRA: formatos de inscrição estadual",
        href: "http://www.sintegra.gov.br/insc_est.html",
        note: "A regra de cálculo e o formato da inscrição estadual de cada unidade da federação.",
      },
      {
        label: "Receita Federal: CNPJ",
        href: "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj",
        note: "Regras do cadastro de pessoa jurídica.",
      },
      REF_LGPD,
    ],
  },

  pessoa: {
    intro:
      "O gerador de pessoa fictícia cria um cadastro de pessoa física coerente: nome completo brasileiro, CPF válido no dígito verificador, RG e e-mail derivado do nome. Serve para preencher formulário de teste sem recorrer a dado de pessoa real.",
    sections: [
      {
        h: "Por que não usar dado real em teste",
        body: [
          "Base de homologação vaza, é copiada para a máquina de desenvolvedor, aparece em captura de tela de chamado e vai parar em log. A [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) trata dado pessoal em ambiente de teste como dado pessoal do mesmo jeito: o artigo 5º define dado pessoal sem ressalva de ambiente, e as obrigações do controlador valem para todo tratamento.",
          "A defesa mais barata é simplesmente não ter dado real ali. Dado sintético coerente resolve isso sem custo: o formulário é exercitado da mesma forma e não há titular para ser exposto.",
          "Quando substituir não é possível, o caminho é anonimizar ou pseudonimizar, mas as duas coisas são mais trabalhosas e mais fáceis de fazer errado do que gerar dado novo.",
        ],
      },
      {
        h: "O que é gerado",
        body: [
          "Nome e sobrenome sorteados de listas de nomes comuns no Brasil, CPF calculado com dígito verificador correto, RG no formato com dígito e e-mail montado a partir do nome, no padrão que um cadastro real produziria.",
          "O RG merece uma ressalva: diferente do CPF, ele é emitido por órgão estadual e não tem formato nacional. O dígito verificador aqui segue o padrão de São Paulo, que é o mais difundido, mas um sistema que valide RG por estado pode recusar.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Essas pessoas existem?",
        a: "Não. Nome, CPF, RG e e-mail são gerados sinteticamente. O CPF é válido no cálculo do dígito verificador mas não está vinculado a nenhum cadastro real.",
      },
      {
        q: "Posso usar isso para popular banco de homologação?",
        a: "Sim, é o uso principal. Substituir dado real por dado sintético em ambiente que não é produção reduz risco de LGPD sem prejudicar o teste.",
      },
      {
        q: "O e-mail gerado funciona?",
        a: "Não. Ele tem formato válido e combina com o nome, mas a caixa não existe. Para teste de envio real, use um serviço de caixa descartável.",
      },
      {
        q: "O RG gerado vale para qualquer estado?",
        a: "O RG não tem formato nacional: cada estado emite com regra própria. O gerado aqui segue o padrão de São Paulo, o mais difundido. Sistemas que validam por estado podem recusar.",
      },
    ],
    refs: [
      REF_LGPD,
      {
        label: "Receita Federal: Meu CPF",
        href: "https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf",
        note: "Regras do cadastro de pessoa física e consulta de situação.",
      },
    ],
  },

  card: {
    intro:
      "O gerador de cartão de crédito produz números fictícios que passam no algoritmo de Luhn, com bandeira, validade e código de segurança, para testar formulário de pagamento e integração com gateway em ambiente de homologação.",
    sections: [
      {
        h: "O algoritmo de Luhn",
        body: [
          "[Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm) é uma verificação de dígito que detecta erro de digitação em número de cartão. Ele dobra dígitos alternados a partir do penúltimo, subtrai nove de qualquer resultado maior que nove, soma tudo e checa se o total é múltiplo de dez.",
          "É a primeira validação que qualquer checkout faz, antes mesmo de falar com a operadora, e é por isso que um número inventado à mão é rejeitado na hora. Ele pega troca de um dígito e quase toda transposição de dois dígitos adjacentes, que são os dois erros de digitação mais comuns.",
        ],
      },
      {
        h: "Anatomia do número",
        body: [
          "A estrutura é definida pela norma ISO/IEC 7812. O primeiro dígito identifica a indústria e os primeiros seis a oito formam o IIN, ou BIN, que identifica o emissor. Por isso Visa começa com 4, Mastercard com 5 ou com a faixa 2221 a 2720, e American Express com 34 ou 37, esse último com quinze dígitos em vez de dezesseis.",
          "É o BIN que o checkout usa para desenhar a bandeira enquanto você digita, antes de qualquer chamada de rede.",
        ],
      },
      {
        h: "Só para teste, e nem sempre suficiente",
        body: [
          "Estes números passam na validação de formato e não têm nenhum vínculo com conta ou crédito. Não são aceitos em transação real e não devem ser usados para tentar nenhuma.",
          "Para teste ponta a ponta, combine com os cartões oficiais de sandbox do seu gateway. Eles existem porque disparam cenários específicos que um número aleatório não dispara: aprovação, recusa por saldo, recusa por antifraude, timeout, chargeback. Formato válido resolve o formulário; o resto é o gateway.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "O cartão gerado funciona em compra real?",
        a: "Não. Ele só satisfaz a validação de formato e Luhn. Não existe conta, emissor ou limite associado, e nenhuma transação real é autorizada.",
      },
      {
        q: "Serve para testar meu checkout?",
        a: "Serve para a etapa de validação de formulário: máscara, bandeira detectada pelo BIN, Luhn e validade. Para testar aprovação e recusa no gateway, combine com os cartões de teste que o próprio gateway publica.",
      },
      {
        q: "Como a bandeira é identificada?",
        a: "Pelos primeiros dígitos, o IIN ou BIN. Visa começa com 4, Mastercard com 5 ou com a faixa 2221 a 2720, American Express com 34 ou 37, e Elo tem faixas próprias.",
      },
      {
        q: "Por que American Express tem quinze dígitos?",
        a: "Porque a ISO/IEC 7812 permite de oito a dezenove dígitos, e cada emissor escolheu o seu. Dezesseis é o mais comum, mas um formulário que trava em dezesseis recusa Amex legítimo.",
      },
    ],
    refs: [
      {
        label: "Algoritmo de Luhn",
        href: "https://en.wikipedia.org/wiki/Luhn_algorithm",
        note: "O cálculo do dígito verificador, com exemplo passo a passo e os erros que ele detecta.",
      },
    ],
  },

  uuid: {
    intro:
      "O gerador de UUID cria identificadores únicos nas versões 3, 4, 5, 6 e 7. Cada versão resolve um problema diferente, e escolher errado custa desempenho de banco de dados ou colisão de chave.",
    sections: [
      {
        h: "Qual versão usar",
        body: [
          "A v4 é aleatória e é o padrão para identificador de uso geral. A v7, definida pela [RFC 9562](https://datatracker.ietf.org/doc/html/rfc9562), também é aleatória mas começa com um timestamp em milissegundos, então ordena por tempo. A v3 e a v5 são determinísticas: o mesmo nome dentro do mesmo namespace sempre gera o mesmo UUID. A v6 é uma reordenação da v1 para ficar ordenável.",
          "Na prática: precisa só de identificador único, use v4. Vai ser chave primária de tabela grande, prefira v7. Precisa que o mesmo dado gere sempre o mesmo id, use v5.",
        ],
      },
      {
        h: "Por que v7 importa em banco de dados",
        body: [
          "Chave primária aleatória espalha inserções por toda a árvore do índice. Cada insert toca uma página diferente, o cache do banco perde eficiência e o índice fragmenta. Com v7 os valores crescem no tempo, então as inserções vão para o fim do índice, que é o caso que todo B-tree otimiza.",
          "Em MySQL com InnoDB o efeito é mais forte, porque a tabela é fisicamente ordenada pela chave primária: id aleatório causa divisão de página constante. Em PostgreSQL o impacto é menor, mas ainda existe no índice.",
          "O custo do v7 é que ele revela quando o registro foi criado. Se o identificador é público e essa informação for sensível, prefira v4.",
        ],
      },
      {
        h: "RFC 9562 substituiu a RFC 4122",
        body: [
          "As versões 1 a 5 vinham da [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122), de 2005. A [RFC 9562](https://datatracker.ietf.org/doc/html/rfc9562), de 2024, a tornou obsoleta e acrescentou v6, v7 e v8. Se você está lendo documentação que só menciona v1 a v5, ela é anterior a essa atualização.",
          "A aleatoriedade da v4 e da v7 aqui vem de [crypto.getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues), o gerador criptográfico do navegador, e não de Math.random. A v5 usa SHA-1 e a v3 usa MD5, ambos aplicados sobre namespace mais nome.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Qual a diferença entre UUID v4 e v7?",
        a: "A v4 é totalmente aleatória. A v7 começa com um timestamp em milissegundos, então UUIDs gerados em sequência ficam ordenados. Isso mantém a inserção no fim do índice do banco em vez de espalhar por toda a árvore.",
      },
      {
        q: "UUID v4 pode repetir?",
        a: "Na prática não. São 122 bits aleatórios. A probabilidade de colisão só se torna relevante depois de bilhões de bilhões de gerações, o que está muito além de qualquer aplicação real.",
      },
      {
        q: "Quando usar UUID v5 em vez de v4?",
        a: "Quando você precisa que a mesma entrada produza sempre o mesmo identificador, por exemplo para derivar um id estável a partir de uma URL ou de um e-mail sem guardar um mapeamento.",
      },
      {
        q: "UUID v7 vaza informação?",
        a: "Vaza o instante de criação, que está no início do valor em texto claro. Para identificador interno isso raramente importa; para identificador público de recurso sensível, prefira v4.",
      },
      {
        q: "A RFC 4122 ainda vale?",
        a: "Foi tornada obsoleta pela RFC 9562 em 2024. As versões 1 a 5 continuam idênticas, então nada quebrou, mas as versões 6, 7 e 8 só existem na especificação nova.",
      },
    ],
    refs: [
      {
        label: "RFC 9562 (Universally Unique IDentifiers)",
        href: "https://datatracker.ietf.org/doc/html/rfc9562",
        note: "A especificação vigente, que define v6, v7 e v8 além de reeditar as anteriores.",
      },
      {
        label: "RFC 4122 (obsoleta)",
        href: "https://datatracker.ietf.org/doc/html/rfc4122",
        note: "A especificação anterior, ainda citada em muita documentação de biblioteca.",
      },
      {
        label: "MDN: crypto.getRandomValues()",
        href: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues",
        note: "A fonte de aleatoriedade usada pela v4 e pela v7 aqui.",
      },
    ],
  },

  pwd: {
    intro:
      "O gerador de senha cria senhas aleatórias com o comprimento e o conjunto de caracteres que você escolher, usando o gerador criptográfico do navegador. É o jeito rápido de criar uma senha para um serviço novo sem cair de novo no padrão de sempre.",
    sections: [
      {
        h: "Comprimento vence complexidade",
        body: [
          "Uma senha longa e simples resiste mais a ataque de força bruta do que uma curta e cheia de símbolo. Cada caractere a mais multiplica o espaço de busca, enquanto trocar a por arroba não engana nenhum dicionário moderno. Doze caracteres é o mínimo razoável hoje e dezesseis é uma escolha confortável.",
          "A recomendação do [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) foi na mesma direção: exigir comprimento mínimo, permitir senhas longas, e parar de impor regras de composição, do tipo obrigar maiúscula, número e símbolo. Elas produzem senhas previsíveis, porque todo mundo resolve a exigência do mesmo jeito.",
        ],
      },
      {
        h: "Aleatoriedade de verdade",
        body: [
          "A geração usa [crypto.getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues), não Math.random. A diferença importa: Math.random é previsível a partir de saídas observadas e nunca deve gerar segredo. É um erro comum e silencioso, porque a senha resultante parece igualmente aleatória a olho nu.",
          "Uma senha de dezesseis caracteres sorteados de um alfabeto de setenta e poucos símbolos tem em torno de noventa e oito bits de entropia, o que está muito além do que força bruta alcança.",
        ],
      },
      {
        h: "Onde guardar",
        body: [
          "Senha gerada só ajuda se você não precisar decorar. Use um gerenciador de senhas e ative segundo fator onde houver. Senha única por serviço é o que impede que um vazamento em um site vire acesso a todos os outros.",
          "Do lado de quem armazena, a regra é outra: senha nunca é guardada, é derivada com uma função lenta e com sal, como Argon2id ou bcrypt, conforme o [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Hash rápido como SHA-256 puro não serve para senha.",
          PRIVACIDADE + " A senha aparece só na sua tela e não é registrada em lugar nenhum.",
        ],
      },
    ],
    faq: [
      {
        q: "A senha gerada é enviada para algum servidor?",
        a: "Não. Ela é criada no seu navegador com o gerador criptográfico nativo e nunca sai da página. Não há registro, histórico ou telemetria do valor gerado.",
      },
      {
        q: "Qual o tamanho ideal de senha?",
        a: "Doze caracteres é o mínimo razoável e dezesseis é uma escolha confortável para conta importante. Comprimento contribui mais para a resistência do que a variedade de símbolos.",
      },
      {
        q: "Devo trocar de senha periodicamente?",
        a: "A recomendação atual do NIST é não forçar troca periódica sem motivo. Troca obrigatória leva a senhas piores e previsíveis, do tipo Senha1, Senha2. Troque quando houver suspeita de vazamento.",
      },
      {
        q: "Por que não usar Math.random para gerar senha?",
        a: "Porque ele é um gerador pseudoaleatório previsível: quem observa saídas suficientes consegue prever as próximas. Para segredo, o correto é crypto.getRandomValues, que é o usado aqui.",
      },
    ],
    refs: [
      {
        label: "NIST SP 800-63B (Digital Identity Guidelines)",
        href: "https://pages.nist.gov/800-63-3/sp800-63b.html",
        note: "A seção 5.1.1 é a que trata de comprimento, regras de composição e troca periódica.",
      },
      {
        label: "OWASP Password Storage Cheat Sheet",
        href: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
        note: "Como armazenar senha do lado do servidor: Argon2id, bcrypt, sal e custo.",
      },
      {
        label: "MDN: crypto.getRandomValues()",
        href: "https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues",
        note: "A fonte de aleatoriedade criptográfica usada por esta ferramenta.",
      },
    ],
  },

  lorem: {
    intro:
      "O gerador de Lorem Ipsum produz texto de preenchimento na quantidade que você pedir, em parágrafos, frases ou palavras. Serve para ocupar o espaço de conteúdo em layout, protótipo e componente antes de o texto real existir.",
    sections: [
      {
        h: "Por que texto falso e não texto real",
        body: [
          "[Lorem Ipsum](https://en.wikipedia.org/wiki/Lorem_ipsum) existe desde a tipografia impressa por um motivo prático: texto sem sentido mantém a atenção no layout. Se você preencher um protótipo com texto legível, todo mundo na reunião vai discutir a redação em vez do espaçamento e da hierarquia.",
          "A origem é uma passagem deturpada de De Finibus Bonorum et Malorum, de Cícero, escrita em 45 antes de Cristo. A primeira palavra, lorem, é na verdade o final de dolorem, cortado no meio quando o trecho virou amostra tipográfica no século dezesseis.",
        ],
      },
      {
        h: "O limite do texto falso",
        body: [
          "Lorem Ipsum tem distribuição de letras parecida com a do latim, não do português. Palavra em português é em média mais longa, tem acento, tem cedilha e tem sequências que quebram diferente na justificação. Layout aprovado com lorem às vezes estoura com o texto real.",
          "Para testar layout de verdade, gere na quantidade que o texto real terá: preencher com um parágrafo curto esconde o problema que aparece com quatro.",
        ],
      },
      {
        h: "Cuidado com o vazamento para produção",
        body: [
          "Lorem Ipsum indexado é um clássico constrangedor, e não é só vergonha: página publicada com texto de preenchimento é lida como conteúdo de baixa qualidade e pode prejudicar a avaliação do site. Antes de publicar, busque por lorem no repositório e no conteúdo do CMS.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "De onde vem o texto Lorem Ipsum?",
        a: "De uma passagem deturpada de De Finibus Bonorum et Malorum, de Cícero, escrita em 45 antes de Cristo. Ela virou padrão em tipografia desde o século dezesseis. A palavra lorem é o final de dolorem, cortado ao meio.",
      },
      {
        q: "Posso gerar por parágrafo, frase ou palavra?",
        a: "Sim. Você escolhe a unidade e a quantidade, o que permite ajustar o volume ao espaço real que o componente vai ocupar.",
      },
      {
        q: "Lorem Ipsum atrapalha o SEO?",
        a: "Atrapalha se for para produção. Página publicada com texto de preenchimento é lida como conteúdo de baixa qualidade e pode prejudicar a avaliação do site inteiro.",
      },
      {
        q: "Lorem Ipsum representa bem um texto em português?",
        a: "Aproximadamente. A distribuição de letras vem do latim, então palavra média mais curta e nenhum acento. Layout justificado ou com espaço apertado pode se comportar diferente com o texto real.",
      },
    ],
    refs: [
      {
        label: "Lorem ipsum: origem e história",
        href: "https://en.wikipedia.org/wiki/Lorem_ipsum",
        note: "De onde vem o trecho, como ele foi deturpado e por que virou padrão tipográfico.",
      },
    ],
  },

  qr: {
    intro:
      "O gerador de QR Code transforma texto, URL, contato ou qualquer conteúdo curto em um código lido por câmera de celular. Funciona para link de cardápio, Wi-Fi, chave Pix, cartão de visita e etiqueta de inventário.",
    sections: [
      {
        h: "Correção de erro e tamanho",
        body: [
          "QR Code é padronizado pela ISO/IEC 18004 e carrega redundância por [código de correção Reed-Solomon](https://www.qrcode.com/en/about/standards.html), em quatro níveis: L recupera cerca de 7 por cento do código danificado, M cerca de 15, Q cerca de 25 e H cerca de 30. É isso que permite colar um logo no meio sem quebrar a leitura.",
          "O preço da redundância é densidade. Quanto mais conteúdo e quanto maior o nível de correção, mais módulos o desenho tem e maior precisa ser a impressão para a câmera resolver. Para material impresso, prefira URL curta.",
        ],
      },
      {
        h: "Onde ele costuma falhar",
        body: [
          "Contraste invertido, ou seja, código claro em fundo escuro, quebra a leitura em muitos aplicativos, porque o algoritmo espera módulo escuro sobre fundo claro. Margem branca ao redor, a chamada quiet zone, é obrigatória e a norma pede quatro módulos: sem ela o leitor não acha as bordas.",
          "E código impresso pequeno demais para a quantidade de dado simplesmente não lê, o que só aparece depois de mil folhetos impressos. A regra prática é testar no tamanho final, com o celular mais velho que você tiver à mão.",
        ],
      },
      {
        h: "Estático e dinâmico",
        body: [
          "O código gerado aqui é estático: o conteúdo está no próprio desenho, sem intermediário. A vantagem é que ele não expira e não depende de ninguém. A desvantagem é que mudar o destino exige gerar outro código e reimprimir.",
          "QR dinâmico é só um QR estático apontando para um encurtador que você controla. Se o destino pode mudar depois da impressão, aponte para uma URL própria e faça o redirecionamento do seu lado, em vez de depender de um serviço de terceiro que pode sumir.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "O QR Code gerado expira?",
        a: "Não. O código é uma representação direta do conteúdo, sem redirecionador no meio. Enquanto o destino existir, o código funciona.",
      },
      {
        q: "Posso usar em material impresso e comercial?",
        a: "Pode. A imagem gerada é sua para usar como quiser, inclusive comercialmente. Só teste a leitura no tamanho final antes de mandar imprimir em quantidade.",
      },
      {
        q: "Qual o tamanho máximo de conteúdo?",
        a: "Tecnicamente alguns milhares de caracteres, mas na prática o limite útil é bem menor: quanto mais dado, mais denso o desenho e mais difícil a leitura. Para URL, use a versão curta.",
      },
      {
        q: "Posso colocar um logo no meio do código?",
        a: "Pode, dentro do limite da correção de erro. No nível H, cerca de 30 por cento do código pode estar coberto e ele ainda lê. Teste sempre depois de aplicar a arte.",
      },
    ],
    refs: [
      {
        label: "QR Code: padrões e correção de erro",
        href: "https://www.qrcode.com/en/about/standards.html",
        note: "Página da Denso Wave, criadora do formato, com os níveis de correção e as normas ISO.",
      },
    ],
  },

  b64: {
    intro:
      "O codificador de Base64 converte texto em Base64 e de volta, em tempo real. Base64 representa dados binários usando apenas 64 caracteres seguros para texto, o que permite carregar conteúdo por canais que só aceitam texto.",
    sections: [
      {
        h: "Base64 não é criptografia",
        body: [
          "Essa é a confusão mais cara que existe em torno do formato. Base64 é codificação, não cifra: qualquer pessoa decodifica em um segundo, sem chave e sem esforço. Guardar senha, token ou dado pessoal em Base64 achando que está protegido é o mesmo que guardar em texto puro com um passo a mais.",
          "Ele existe para transporte: anexo de e-mail, [Basic Auth em cabeçalho HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Authorization), payload de JWT, data URI de imagem em CSS. Em todos esses casos o problema resolvido é o canal aceitar só texto, nunca sigilo.",
        ],
      },
      {
        h: "Base64 e Base64URL",
        body: [
          "A [RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648) define duas tabelas. A padrão usa mais e barra nos dois últimos símbolos, o que quebra quando o valor vai dentro de uma URL ou de um nome de arquivo. A variante Base64URL troca esses dois por menos e sublinhado, e costuma dispensar o preenchimento com igual.",
          "É por isso que um JWT não decodifica com um decodificador Base64 comum: as três partes dele são Base64URL. Se você viu caractere estranho ou erro de preenchimento, provavelmente é isso.",
        ],
      },
      {
        h: "Acentuação e UTF-8",
        body: [
          "Base64 opera sobre bytes, não sobre caracteres. Texto em português precisa ser convertido para UTF-8 antes, senão acento e cedilha se perdem ou geram erro. Em JavaScript esse é o motivo clássico do erro de btoa com caractere fora do intervalo Latin-1.",
          "A ferramenta faz essa conversão nos dois sentidos com TextEncoder e TextDecoder, então acentuação atravessa a ida e a volta intacta.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Base64 protege meus dados?",
        a: "Não. É codificação reversível sem chave, projetada para transporte, não para sigilo. Qualquer pessoa com o texto codificado recupera o original imediatamente.",
      },
      {
        q: "Por que o texto codificado fica maior?",
        a: "Base64 usa quatro caracteres para cada três bytes, então o resultado cresce cerca de 33 por cento. É o custo de representar binário usando só caracteres seguros para texto.",
      },
      {
        q: "Funciona com acento e emoji?",
        a: "Sim. O texto é convertido para UTF-8 antes de codificar e reconvertido ao decodificar, então caractere acentuado e emoji sobrevivem ao processo.",
      },
      {
        q: "Qual a diferença entre Base64 e Base64URL?",
        a: "Base64URL troca os caracteres mais e barra por menos e sublinhado, para o valor poder viajar dentro de URL e nome de arquivo. JWT usa Base64URL, e é por isso que ele não abre em um decodificador comum.",
      },
    ],
    refs: [
      {
        label: "RFC 4648 (Base16, Base32 e Base64)",
        href: "https://datatracker.ietf.org/doc/html/rfc4648",
        note: "Define as duas tabelas, o preenchimento e a variante segura para URL.",
      },
      {
        label: "MDN: Base64",
        href: "https://developer.mozilla.org/en-US/docs/Glossary/Base64",
        note: "Como codificar e decodificar em JavaScript sem quebrar acentuação.",
      },
    ],
  },

  b64img: {
    intro:
      "O conversor de imagem para Base64 transforma um arquivo de imagem em data URI, pronto para colar em CSS, HTML ou JSON, e faz o caminho inverso, reconstruindo a imagem a partir do Base64.",
    sections: [
      {
        h: "Quando embutir imagem compensa",
        body: [
          "Ícone pequeno, logo, imagem de placeholder e sprite minúsculo compensam: você elimina uma requisição HTTP e o conteúdo chega junto com o CSS. Imagem grande não compensa: ela cresce cerca de 33 por cento ao ser codificada, não é cacheada separadamente e bloqueia a renderização da folha de estilo enquanto baixa.",
          "A regra prática comum é embutir abaixo de alguns kilobytes e servir como arquivo acima disso. Com HTTP/2 e HTTP/3 o argumento de economizar requisição perdeu força, então o limite hoje é mais baixo do que era.",
          "Para ícone, o melhor dos dois mundos costuma ser SVG inline: menor que o PNG equivalente, escalável e recolorível por CSS, sem passar por Base64.",
        ],
      },
      {
        h: "Data URI",
        body: [
          "O resultado sai no formato definido pela [RFC 2397](https://datatracker.ietf.org/doc/html/rfc2397): a palavra data, o tipo MIME, a marca base64 e o conteúdo. É o formato que src de img e url de CSS aceitam diretamente, documentado também na [MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data).",
          "Na decodificação, o tipo é inferido do próprio conteúdo, então mesmo um Base64 cru sem cabeçalho costuma abrir corretamente, porque o navegador faz sniff dos primeiros bytes.",
          PRIVACIDADE + " A imagem não é enviada para nenhum servidor.",
        ],
      },
    ],
    faq: [
      {
        q: "Minha imagem é enviada para algum servidor?",
        a: "Não. O arquivo é lido pelo navegador e convertido localmente. Nada é transmitido, o que importa quando a imagem é um documento ou uma captura de tela com dado sensível.",
      },
      {
        q: "Vale a pena embutir imagem em Base64?",
        a: "Vale para arquivo pequeno, onde economizar uma requisição compensa. Para imagem grande é contraproducente: aumenta o tamanho em cerca de um terço e impede o cache separado do arquivo.",
      },
      {
        q: "Quais formatos funcionam?",
        a: "Qualquer formato que o navegador abra, incluindo PNG, JPEG, WebP, GIF e SVG. A conversão é sobre os bytes do arquivo, independente do formato.",
      },
      {
        q: "Data URI funciona em e-mail?",
        a: "Em geral não. Boa parte dos clientes de e-mail, Outlook e Gmail entre eles, bloqueia imagem em data URI. Para e-mail, hospede a imagem e use URL absoluta.",
      },
    ],
    refs: [
      {
        label: "RFC 2397 (The data URL scheme)",
        href: "https://datatracker.ietf.org/doc/html/rfc2397",
        note: "A especificação do formato data, com a sintaxe do tipo MIME e da marca base64.",
      },
      {
        label: "MDN: data URLs",
        href: "https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data",
        note: "Uso prático em HTML e CSS, com as limitações de cada navegador.",
      },
    ],
  },

  jwt: {
    intro:
      "O decodificador de JWT abre um token e mostra o cabeçalho e o payload em texto legível, com as datas já convertidas. É o que você usa quando precisa saber por que uma requisição voltou 401.",
    sections: [
      {
        h: "As três partes do token",
        body: [
          "Um JWT, definido pela [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519), tem cabeçalho, payload e assinatura, separados por ponto e codificados em Base64URL. O cabeçalho diz o algoritmo, o payload carrega as claims e a assinatura, definida pela [RFC 7515](https://datatracker.ietf.org/doc/html/rfc7515), garante que ninguém alterou o conteúdo.",
          "As duas primeiras partes são apenas codificadas, não cifradas: qualquer pessoa com o token lê o payload. Por isso nunca se coloca senha, número de cartão ou dado sensível dentro de um JWT. Ele é assinado, não secreto.",
        ],
      },
      {
        h: "Isto é um leitor, não um validador",
        body: [
          "A ferramenta decodifica e exibe. Ela não verifica a assinatura, porque isso exigiria a chave secreta, que não deve sair do seu servidor. Um token expirado ou com assinatura falsa é decodificado normalmente aqui, então nunca tome a leitura como prova de que o token é legítimo.",
          "As claims de tempo, exp, iat e nbf, vêm em epoch conforme a RFC 7519. Elas são convertidas para data legível, que é geralmente onde está a resposta: o token expirou.",
        ],
      },
      {
        h: "Os erros que a especificação de boas práticas cataloga",
        body: [
          "A [RFC 8725](https://datatracker.ietf.org/doc/html/rfc8725) existe porque JWT foi implementado errado muitas vezes, sempre do mesmo jeito. O caso mais conhecido é aceitar alg none, em que o token diz que não tem assinatura e a biblioteca acredita. O outro é confusão de algoritmo: o servidor espera RS256, o atacante manda HS256 e a biblioteca usa a chave pública como se fosse segredo compartilhado.",
          "A defesa é sempre a mesma: o verificador decide o algoritmo, nunca o token. E confira aud e iss, não só exp, senão um token válido emitido para outro serviço é aceito pelo seu.",
          PRIVACIDADE + " O token não é enviado para servidor nenhum, o que importa porque um JWT válido é uma credencial.",
        ],
      },
    ],
    faq: [
      {
        q: "O decodificador verifica a assinatura?",
        a: "Não. Verificar exige a chave secreta ou a chave pública do emissor, que não deve circular. Aqui o token é apenas lido, o que basta para inspecionar claims e datas.",
      },
      {
        q: "Meu token é enviado para algum servidor?",
        a: "Não. A decodificação acontece inteiramente no navegador. Isso é importante porque um JWT válido dá acesso, e colar um token em um site que o transmite é entregar a credencial.",
      },
      {
        q: "Por que consigo ler o conteúdo de um JWT sem a chave?",
        a: "Porque JWT é assinado, não criptografado. A assinatura prova que o conteúdo não foi alterado, mas não esconde nada. Qualquer um decodifica o payload, então dado sensível não deve estar ali.",
      },
      {
        q: "O que é o ataque de alg none?",
        a: "É quando o token declara que não tem assinatura e a biblioteca aceita sem verificar. A RFC 8725 recomenda que o verificador fixe o algoritmo esperado e ignore o que o token declara.",
      },
      {
        q: "Verificar exp é suficiente?",
        a: "Não. Sem checar aud e iss, um token válido emitido para outro serviço, ou por outro emissor, é aceito pelo seu. As três claims precisam ser verificadas juntas.",
      },
    ],
    refs: [
      {
        label: "RFC 7519 (JSON Web Token)",
        href: "https://datatracker.ietf.org/doc/html/rfc7519",
        note: "A especificação do formato e das claims registradas, exp, iat, nbf, aud e iss entre elas.",
      },
      {
        label: "RFC 7515 (JSON Web Signature)",
        href: "https://datatracker.ietf.org/doc/html/rfc7515",
        note: "Como a assinatura é construída e verificada.",
      },
      {
        label: "RFC 8725 (JWT Best Current Practices)",
        href: "https://datatracker.ietf.org/doc/html/rfc8725",
        note: "O catálogo dos erros de implementação conhecidos e como se defender de cada um.",
      },
      {
        label: "RFC 4648 (Base64URL)",
        href: "https://datatracker.ietf.org/doc/html/rfc4648",
        note: "A codificação usada nas três partes do token, que não é o Base64 comum.",
      },
    ],
  },

  text: {
    intro:
      "As ferramentas de texto reúnem as transformações que aparecem todo dia: mudar caixa, remover acentuação, gerar slug, limpar espaço duplicado, contar caracteres e palavras e ver o tamanho em bytes.",
    sections: [
      {
        h: "Contagem de caractere e de byte",
        body: [
          "São números diferentes e a diferença importa. Em UTF-8, uma letra sem acento ocupa um byte, uma letra acentuada ocupa dois, e um emoji pode ocupar quatro. Se você está preenchendo um campo com limite em bytes, como coluna varchar de banco ou legenda de rede social, é o número de bytes que decide se cabe.",
          "Tem ainda uma terceira contagem: a de unidades de código. JavaScript mede string em UTF-16, então um emoji conta como dois no length. É por isso que cortar string com slice às vezes parte um emoji ao meio e produz caractere quebrado.",
        ],
      },
      {
        h: "Slug e normalização",
        body: [
          "A geração de slug remove acento, troca espaço por hífen e derruba o que não for seguro em URL. O passo de remover acento usa a [normalização Unicode](https://unicode.org/reports/tr15/) na forma NFD, que separa a letra do sinal diacrítico, e depois descarta os sinais. É o que [String.normalize](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) faz em JavaScript.",
          "Isso explica um bug clássico: dois textos que parecem idênticos na tela podem ter bytes diferentes, porque um usa é como caractere único e o outro usa e mais acento combinante. Comparação de string falha, busca não acha, e a normalização é o que resolve.",
          "Vale rodar o slug sobre o título real antes de publicar, para conferir o resultado em vez de descobrir depois que a URL ficou estranha.",
        ],
      },
      {
        h: "Limpeza de texto colado",
        body: [
          "Texto vindo de PDF, Word ou navegador traz caracteres invisíveis que estragam comparação e busca: espaço não separável, marca de ordenação de bytes no começo do arquivo, hífen de largura zero. A limpeza remove esses casos, que é justamente o que faz um diff parar de acusar diferença em linhas visualmente iguais.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "Qual a diferença entre contagem de caracteres e de bytes?",
        a: "Caractere é o que você vê, byte é o que ocupa em memória ou banco. Em UTF-8, letra sem acento usa um byte, letra acentuada usa dois e emoji pode usar quatro. Campos com limite costumam contar bytes.",
      },
      {
        q: "A remoção de acento preserva o significado?",
        a: "Preserva a leitura, não a grafia correta. Ela existe para gerar slug, chave de busca e identificador, não para reescrever texto que será publicado.",
      },
      {
        q: "O texto colado fica salvo?",
        a: "Não. Tudo acontece no navegador, sem envio e sem armazenamento. Ao fechar a aba, o conteúdo desaparece.",
      },
      {
        q: "Por que dois textos iguais na tela não são iguais no código?",
        a: "Porque um pode usar a letra acentuada como caractere único e o outro como letra mais acento combinante. São bytes diferentes com a mesma aparência. Normalizar para NFC antes de comparar resolve.",
      },
    ],
    refs: [
      {
        label: "Unicode Standard Annex 15 (Normalization Forms)",
        href: "https://unicode.org/reports/tr15/",
        note: "O que são NFC, NFD, NFKC e NFKD, e quando cada uma é a escolha certa.",
      },
      {
        label: "MDN: String.prototype.normalize()",
        href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize",
        note: "Como aplicar a normalização em JavaScript, que é a base da remoção de acento.",
      },
      {
        label: "Unicode: FAQ sobre UTF-8 e BOM",
        href: "https://www.unicode.org/faq/utf_bom.html",
        note: "Quantos bytes cada caractere ocupa e o que é a marca de ordenação de bytes.",
      },
    ],
  },

  diff: {
    intro:
      "O comparador de textos mostra linha a linha o que mudou entre duas versões, marcando o que entrou e o que saiu. Serve para conferir alteração em configuração, resposta de API, log e qualquer texto que não esteja versionado em Git.",
    sections: [
      {
        h: "Como a comparação é feita",
        body: [
          "O algoritmo usa a [maior subsequência comum](https://en.wikipedia.org/wiki/Longest_common_subsequence), o mesmo princípio por trás do [git diff](https://git-scm.com/docs/git-diff), para achar o menor conjunto de mudanças que transforma um texto no outro. Isso evita o resultado inútil de marcar tudo como alterado quando você apenas inseriu uma linha no começo.",
          "O custo é proporcional ao produto do número de linhas dos dois lados, então arquivo muito grande fica pesado. Acima de um limite a ferramenta força o modo que mostra só as diferenças, porque renderizar todas as linhas iguais de um diff gigante trava a aba.",
        ],
      },
      {
        h: "Diferença invisível",
        body: [
          "Quando o diff acusa mudança em uma linha que parece idêntica, quase sempre é uma destas quatro: espaço no fim da linha, tabulação trocada por espaços, fim de linha em CRLF do Windows contra LF do Unix, ou marca de ordenação de bytes no começo do arquivo.",
          "As ferramentas de texto ajudam aqui: limpar o texto dos dois lados antes de comparar transforma um diff cheio de ruído em um diff com as mudanças reais.",
        ],
      },
      {
        h: "Quando usar",
        body: [
          "Comparar duas respostas de API para achar o campo que mudou, conferir arquivo de configuração entre ambientes, revisar texto de contrato ou documento, e validar que uma migração produziu a saída esperada.",
          PRIVACIDADE,
        ],
      },
    ],
    faq: [
      {
        q: "A comparação é por linha ou por palavra?",
        a: "Por linha. Uma linha alterada aparece como removida e adicionada, o que é o comportamento esperado para código, configuração e log.",
      },
      {
        q: "Posso comparar arquivos grandes?",
        a: "Até cerca de vinte megabytes por lado. Acima disso a comparação é bloqueada, porque o consumo de memória cresce com o produto do número de linhas dos dois textos.",
      },
      {
        q: "Os textos comparados são enviados para servidor?",
        a: "Não. A comparação roda no navegador, então é seguro comparar configuração com senha, resposta de API com dado de cliente ou documento interno.",
      },
      {
        q: "Por que o diff acusa mudança em linhas iguais?",
        a: "Quase sempre é caractere invisível: espaço no fim da linha, tabulação contra espaços, CRLF contra LF ou marca de ordenação de bytes. Limpe os dois textos antes de comparar.",
      },
    ],
    refs: [
      {
        label: "Maior subsequência comum (LCS)",
        href: "https://en.wikipedia.org/wiki/Longest_common_subsequence",
        note: "O algoritmo por trás desta comparação e da maioria das ferramentas de diff.",
      },
      {
        label: "git diff",
        href: "https://git-scm.com/docs/git-diff",
        note: "A documentação do diff do Git, útil para entender as opções de tratamento de espaço em branco.",
      },
    ],
  },
};
