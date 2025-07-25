# SHOOT-N-SURVIVE---Projeto-com-IA
Este jogo para navegador faz parte de um projeto pessoal com objetivo de testar as capacidades de codificação de diferentes Inteligências Artificiais. Todos os aspectos do código foram criados inteiramente por IA e mostram o poder que essa tecnologia tem a oferecer à partir de boas práticas de uso.

A base desse projeto surgiu da ideia de testar como diferentes IAs podem auxiliar na codificação, não apenas isso, mas também fazendo-as trabalhar em conjunto sem que nem mesmo soubessem. Decidi colocar essa ideia em prática no início de junho e levei pelo menos 1 mês para chegar nos estágios finais do jogo, porém, decidi postá-lo apenas quando atingisse os seguintes objetivos:

REQUISITOS PARA O MENU, SUAS OPÇÕES E FUNCIONAMENTO:

N.1 - O jogo deve possuir 2 telas principais: MENU INICIAL, onde estarão diferentes opções de personalização e TELA DE JOGO, onde ocorrerá a gameplay;

N.2 - Devem haver 2 modos de jogo: 1 JOGADOR e 2 JOGADORES, onde cada um pode controlar seu personagem usando comandos diferentes;

N.3 - A personalização de Jogadores deve estar presente, permitindo que o nome e aparência dos personagens sejam editáveis;

N.4 - Criar um menu para tocar músicas, exibindo as opções de escolher música, pausar, tocar e retirar música.

REQUISITOS PARA O JOGO:

N.5 - Os jogadores devem se mover utilizando as teclas W, A, S e D (para o JOGADOR 1) e Setas Direcionais (para o JOGADOR 2);

N.6 - Para atirar os Projéteis Básicos será utilizado a Barra de Espaço (para o JOGADOR 1) e Enter (para o JOGADOR 2);

N.7 - Os inimigos devem surgir com certos intervalos de tempo, além disso, quanto mais tempo se passar durante uma sessão de jogo mais inimigos surgirão, além de receberem mais vida e dano contra os jogadores;

N.8 - Deve haver um sistema de Ondas para indicar o nível de ameaça que os jogadores enfrentarão, além de que a cada 5 Ondas um Chefão irá surgir para trazer mais um desafio;

N.9 - Derrotar um Chefão garante uma evolução imediata de nível, derrotar 50 inimigos gera uma poção de cura;

REQUISITOS PARA OS JOGADORES:

N.10 - Todos os Jogadores começam com 100 de Vida, 1 Projétil Básico por tiro, podem atirar 2.5 vezes por segundo, causam 19 de Dano e têm 0/10 de Experiência;

N.11 - Cada inimigo derrotado irá gerar 1 de Experiência para os Jogadores, ao atingir o marco de Experiência de seu nível evoluirão para o próximo, recebendo mais Vida, Dano e aumentando a quantidade de Experiência necessária para evoluir em 2 (12, 14, 16, 18...);

N.12 - Ao evoluir seu nível, os Jogadores podem escolher entre o aumento de um atributo (Vida, Dano, Velocidade e N. de Projéteis) ou receber uma Habilidade Especial;

Com esses 12 requisitos em mente iniciei a produção.

COMO FOI A PRODUÇÃO:

A primeira IA utilizada foi o GEMINI, o qual disponibiliza 2 versões: FLASH e PRO. A primeira traz uma criação mais veloz, porém em contrapartida, a versão PRO é capaz de gerar códigos mais robustos e com mais funções. Isso pode parecer vantajoso a curto prazo, mas no contexto desse projeto tornou-se um desafio.
Meu intuito era utilizar apenas a IA para a criação desse jogo, mas quanto maiores as linhas e blocos de código, mais tokens eram utilizados, tanto na leitura do código pela IA, quanto na criação de novas linhas, blocos e funções.
A partir do GEMINI foram criadas 2 mil linhas de código para a versão protótipo, sendo divididas entre o HTML, CSS e JAVASCRIPT que estavam juntos em um mesmo arquivo para facilitar as edições iniciais pela IA. Conforme o código evoluia, nem todas as funções desejadas haviam sido criadas, então decidi usar outra ferramenta. Até esse momento, foram atingidos os requisitos: 1, 2, 5, 6 e 10;

Após a criação da base do código pelo GEMINI, me foi recomendado utilizar o DEEPSEEK. Geralmente, utilizo a seguinte mensagem "NÃO RETIRE, ALTERE OU INSIRA NADA QUE NÃO FOI SOLICITADO" para que a IA não altere aspectos importantes do código a menos que eu a solicite, entretanto, como eu possuia apenas a base do código, permiti que o DEEPSEEK fizesse grandes mudanças. Ele trouxe uma grande reforma, levando o código para 4 mil linhas, todo o design havia sido melhorado e muitas características haviam evoluído. Utilizando-o, consegui atingir os requisitos: 7, 8, 9, 11 e 12.
Ele implementou com apenas 1 prompt o sistema de Ondas e Chefes, além da parte mais divertida do jogo que são as Habilidades Especiais. Mas conforme as linhas se tornavam maiores, o DEEPSEEK começou a travar e não finalizava os códigos. Com isso, decidi separar meu código em diversos arquivos e voltar a utilizar o GEMINI devido ao fato dele ser mais capacitado para escrever códigos extensos. Essa divisão se fez presente até o fim do projeto, separando os arquivos HTML, CSS e JAVASCRIPT em seus respectivos pacotes, além de dividir o JAVASCRIPT em Player, Enemies e GameFunctions.

De volta ao GEMINI, fiz um uso misto entre a versão PRO e FLASH para unir o melhor dos dois mundos, a robustez do PRO e velocidade do FLASH. Ele adicionou mais Habilidades Especiais e melhorou alguns aspectos de balanceamento no jogo, além de introduzir o sistema de Habilidades Lendárias, habilidades que interagem diretamente com os Projéteis Básicos dos Jogadores e dão a eles novas capacidades extremamente poderosas.
O GEMINI PRO conseguiu inserir as opções restantes para o MENU INICIAL, finalmente trazendo para o jogo a capacidade de personalizar os Jogadores e inserir músicas do dispositivo durante sessões. Finalmente, o projeto atingiu os requisitos restantes: 3 e 4.
Com isso, o jogo havia atingido um patamar que eu não esperava, já que a IA havia implementado funções que eu mesmo não pensei para o projeto e o melhor de tudo, DEEPSEEK e ambas as versões do GEMINI criaram em conjunto uma versão muito coesa para o jogo e seu código, mesmo que nem soubessem disso. Os toques finais foram dados pelo GEMINI FLASH, onde foram inseridas uma TELA DE TÍTULO e músicas automáticas para o MENU INICIAL e TELA DE JOGO, ideias que recebi ao conversar com colegas de minha faculdade.

Enfim, após 1 mês de produção diária o jogo SHOOT N' SURVIVE atingiu seu ápice e, após alguns reparos finais, finalmente decidi trazê-lo ao GitHub. Diversas versões foram criadas e o estilo do jogo mudou 3 vezes, saindo de meros círculos sem vida, para um tema medieval e por fim chegando a temática espacial presente no jogo.
Diversos testes foram efetuados antes da postagem oficial, todos eles feitos por mim ou colegas da minha faculdade e curso técnico e cada um trouxe uma leva de novas mudanças e ideias a serem implementadas no projeto final. O jogo conseguiu evoluir de uma simples ideia para um protótipo gerado no GEMINI, recebeu grandes melhorias no DEEPSEEK e retornou ao GEMINI para ser finalizado.

OBSERVAÇÕES:

Vale lembrar que meu único papel neste projeto foi a parte criativa, ou seja, fui apenas uma "mente artística" por trás do jogo, levando para as Inteligências Artificiais as minhas visões para estilo, mecânicas de jogo e funcionamento geral. De fato, a Inteligência Artificial fez toda a parte da produção, não estou tirando meu mérito já que nada disso seria possível sem minhas ideias, mas devo dizer que a IA foi a grande chave para tudo isso.
Como já foi dito, todos os aspectos do código do jogo foram gerados pela IA, mas isso foi resultado de prompts muito bem planejados para a situação do momento, por exemplo, muitas vezes a IA trocava partes inteiras do código que não deveriam ser alteradas, levando a minha ideia de sempre utilizar "NÃO RETIRE, ALTERE OU INSIRA NADA QUE NÃO FOI SOLICITADO" no final do primeiro prompt ao iniciar um novo chat, e acredite, precisei criar mais de 50 chats pois os tokens se esgotavam muito rapidamente  mesmo com a separação do código em várias partes.
Outra estratégia que eu utilizei foi escrever em letras maiúsculas todas as palavras e termos importantes para o jogo, como por exemplo: JOGADORES, INIMIGOS, HABILIDADES ESPECIAIS, VIDA, etc... Isso ajudou a IA na hora de separar e identificar o que deveria ser alterado a cada novo prompt.

Caso deseje fazer um projeto semelhante, tenha em mente algumas coisas:

N.1 - Se feito com boas práticas e muita paciência saiba que ele levará bastante tempo, no meu caso, foi finalizado perto de 1 mês após seu inicio, entretanto, eu trabalhei nele diariamente por pelo menos 7 horas. Mas esse investimento de tempo ajudou a criar um jogo sólido, com mecânicas e jogabilidade coesa;

N.2 - Seu hardware deve estar preparado, a leitura e edição de grandes códigos pela IA acarreta no uso elevado de RAM pelo seu navegador, além de que sua ferramenta para "codar" irá consumir RAM a cada alteração no código, isso se tornará um desafio conforme ele avança. Cada alteração no código permite que você possa desfazê-la, isso fará com que sua máquina armazene cada mudança na RAM (dependendo do swapping, também no HD). No meu caso utilizei as IAs pelo meu navegador MICROSOFT EDGE e utilizei o VISUAL STUDIO CODE para editar e salvar os códigos, meu notebook possui apenas 4GB de RAM e isso se tornou um grande desafio, mas nas máquinas do curso técnico e faculdade que possuiam 8GB de RAM ou mais não sofri este problema.

N.3 - Faça backups frequentes, principalmente em máquinas mais fracas, mais propensas a travamentos e lentidão para evitar que seus arquivos sejam perdidos durante um problema, além de ser uma boa prática necessária em qualquer atividade na área de informática, seus projetos devem ter alguma forma de recuperação em casos de perda.

CONSIDERAÇÕES FINAIS:

Muitas vezes temos uma ideia negativa sobre o uso de Inteligências Artificiais, vendo isso como um ato de preguiça ou falta de habilidade e até certo ponto isso está correto, afinal, o uso indevido e não planejado das IAs acarreta em prompts e resultados muito simples e que muitas vezes não atingem os resultados esperados.
Ao longo do meu tempo de estudo ví muitos colegas utilizarem o poder das IAs de maneira errada, pedindo respostas rápidas que muitas vezes nem seriam necessárias, deixando de lado o estudo e aprendizado para conseguir uma solução imediata, isso deixa uma questão "Esse conhecimento é deles, ou da IA?" afinal não houve um desafio que impulsionasse uma pesquisa ou análise mais a fundo sobre o tema, apenas uma resposta rápida para uma pergunta mais rápida ainda. Claro, elas podem auxiliar e muito durante os estudos mas isso precisa ser feito de maneira consciente, não fazer uso delas como uma mera ferramenta de solução de problemas, mas como parte de uma estratégia de aprendizado.
Para evitar esse tipo de uso pela minha parte, decidi desenvolver este projeto como uma maneira de identificar estratégias que possam me auxiliar no uso de diferentes Inteligências Artificiais, criar um jogo foi a melhor ideia para mim pois sou um grande amante desse universo, então pude me influeniar a dar meu máximo nesse estudo. Por muito tempo eu me neguei a utilizar a Inteligência Artificial por compartilhar essa visão  enviesada de que seu uso é fruto de falta de esforço e aprendizado, mas ao iniciar esse projeto e vê-lo evoluir a cada novo prompt, percebi que existem muitas vantagens no uso das IAs, elas apenas precisam ser melhor exploradas de acordo com o contexto e uso de cada.
