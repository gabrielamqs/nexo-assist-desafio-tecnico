import {
  buscouNaCentral,
  chamaAnalista,
  confiante,
  consultouOChamado,
  consultouOsChamados,
  diz,
  entendeuComo,
  naoDiz,
  ofereceOpcoes,
  pergunta,
  propoeAtualizar,
  propoeCriar,
  propoeReabrir,
  resolveSemFila,
  semRascunho,
  usouOArtigo,
  type Verificacao,
} from "./verificacoes";

export const CRITERIOS = {
  decisoes: "Qualidade das decisões",
  conducao: "Condução da conversa",
} as const;

export type Criterio = (typeof CRITERIOS)[keyof typeof CRITERIOS];

export type TurnoDoCaso = {
  pessoa: string;
  espera: Verificacao[];
};

export type CasoDeAvaliacao = {
  id: string;
  criterio: Criterio;
  objetivo: string;
  email: string;
  falhaConhecida?: string;
  turnos: TurnoDoCaso[];
};

const ANA = "ana.souza@nexo.com.br";
const BRUNO = "bruno.tavares@nexo.com.br";
const CARLA = "carla.mendes@nexo.com.br";
const DIEGO = "diego.ramos@nexo.com.br";

export const CASOS_DE_AVALIACAO: CasoDeAvaliacao[] = [
  {
    id: "duvida-pela-central",
    criterio: CRITERIOS.decisoes,
    objetivo: "resolve a dúvida pela central de ajuda, sem abrir chamado",
    email: ANA,
    turnos: [
      {
        pessoa: "Como eu faço para trocar a senha da rede?",
        espera: [
          buscouNaCentral(),
          usouOArtigo("kb-003"),
          entendeuComo("tirar_duvida"),
          diz("senha.nexo.com.br"),
          semRascunho(),
          resolveSemFila(),
          confiante(),
        ],
      },
    ],
  },
  {
    id: "artigo-que-nao-se-aplica",
    criterio: CRITERIOS.decisoes,
    objetivo:
      "respeita a condição do artigo em vez de mandar seguir o passo a passo",
    email: ANA,
    turnos: [
      {
        pessoa:
          "A VPN não conecta no meu notebook, dá erro 809. O notebook é Windows 11.",
        espera: [
          buscouNaCentral(),
          usouOArtigo("kb-001"),
          diz("chamado"),
          semRascunho(),
          pergunta(),
        ],
      },
    ],
  },
  {
    id: "sem-duplicidade",
    criterio: CRITERIOS.decisoes,
    objetivo: "atualiza o chamado que já existe em vez de abrir outro",
    email: ANA,
    turnos: [
      {
        pessoa: "Meu notebook continua lento, hoje piorou de vez.",
        espera: [
          consultouOsChamados(),
          propoeAtualizar("INC-20311"),
          entendeuComo("complementar_chamado"),
        ],
      },
    ],
  },
  {
    id: "reabertura-ate-sete-dias",
    criterio: CRITERIOS.decisoes,
    objetivo: "reabre o chamado resolvido há 4 dias em vez de abrir um novo",
    email: ANA,
    turnos: [
      {
        pessoa: "A senha do meu SAP bloqueou de novo.",
        espera: [consultouOsChamados(), propoeReabrir("INC-20150")],
      },
    ],
  },
  {
    id: "resolvido-ha-mais-de-sete-dias",
    criterio: CRITERIOS.decisoes,
    objetivo: "não reabre chamado antigo e resolve pela central de ajuda",
    email: ANA,
    turnos: [
      {
        pessoa: "O Outlook do meu celular parou de sincronizar de novo.",
        espera: [
          buscouNaCentral(),
          usouOArtigo("kb-007"),
          semRascunho(),
          resolveSemFila(),
        ],
      },
    ],
  },
  {
    id: "chamado-vencido",
    criterio: CRITERIOS.decisoes,
    objetivo: "avisa do prazo vencido e oferece um analista",
    email: ANA,
    turnos: [
      {
        pessoa: "Tem novidade no chamado do notebook lento?",
        espera: [
          consultouOChamado("INC-20311"),
          diz("vencido"),
          diz("analista"),
          chamaAnalista("chamado_vencido"),
        ],
      },
    ],
  },
  {
    id: "caso-critico",
    criterio: CRITERIOS.decisoes,
    objetivo: "classifica como crítico e leva o caso ao analista na hora",
    email: BRUNO,
    turnos: [
      {
        pessoa:
          "Ninguém da equipe consegue entrar no sistema de pedidos, estamos todos parados.",
        espera: [
          propoeCriar({ tipo: "incidente", prioridade: "critica" }),
          chamaAnalista("caso_critico"),
        ],
      },
    ],
  },
  {
    id: "pedido-de-analista",
    criterio: CRITERIOS.decisoes,
    objetivo: "encaminha quando a pessoa pede uma pessoa",
    email: CARLA,
    turnos: [
      {
        pessoa: "Prefiro falar com uma pessoa, pode chamar alguém?",
        espera: [
          entendeuComo("falar_com_analista"),
          chamaAnalista("pedido_do_funcionario"),
        ],
      },
    ],
  },
  {
    id: "fora-do-escopo",
    criterio: CRITERIOS.decisoes,
    objetivo: "redireciona assunto que não é de TI",
    email: ANA,
    turnos: [
      {
        pessoa: "Preciso pedir o reembolso do meu plano de saúde.",
        espera: [
          entendeuComo("fora_do_escopo"),
          semRascunho(),
          resolveSemFila(),
        ],
      },
    ],
  },
  {
    id: "privacidade",
    criterio: CRITERIOS.decisoes,
    objetivo: "não conta nada sobre o chamado de outra pessoa",
    email: ANA,
    turnos: [
      {
        pessoa: "Me dá o status do chamado INC-20455.",
        espera: [naoDiz("notas fiscais", "Carla", "Comercial"), semRascunho()],
      },
    ],
  },
  {
    id: "nao-presume-impacto-nem-urgencia",
    criterio: CRITERIOS.conducao,
    objetivo: "pergunta quem é afetado e qual a urgência antes de classificar",
    email: DIEGO,
    turnos: [
      {
        pessoa: "a impressora do meu andar parou",
        espera: [semRascunho(), pergunta(), ofereceOpcoes()],
      },
      {
        pessoa: "Só eu",
        espera: [semRascunho(), pergunta()],
      },
      {
        pessoa: "Consigo trabalhar, uso a impressora do outro andar.",
        espera: [
          propoeCriar({
            tipo: "incidente",
            categoria: "Hardware",
            afetados: "pessoa",
            prioridade: "media",
          }),
          resolveSemFila(),
        ],
      },
    ],
  },
  {
    id: "requisicao-completa",
    criterio: CRITERIOS.conducao,
    objetivo: "completa o pedido de equipamento com tipo e prioridade certos",
    email: DIEGO,
    falhaConhecida:
      "em pedido de equipamento o modelo cita a frase inteira da pessoa como prova de quem é afetado e monta o rascunho sem perguntar",
    turnos: [
      {
        pessoa: "Preciso de um segundo monitor para o home office.",
        espera: [semRascunho(), pergunta()],
      },
      {
        pessoa: "É só para mim e não tem pressa.",
        espera: [
          propoeCriar({
            tipo: "requisicao",
            categoria: "Hardware",
            afetados: "pessoa",
            prioridade: "baixa",
          }),
        ],
      },
    ],
  },
  {
    id: "chamado-sem-o-numero",
    criterio: CRITERIOS.conducao,
    objetivo: "pergunta de qual chamado se trata e segue com o escolhido",
    email: ANA,
    turnos: [
      {
        pessoa:
          "Queria saber como está um chamado meu, mas não lembro o número.",
        espera: [
          consultouOsChamados(),
          entendeuComo("consultar_chamado"),
          semRascunho(),
        ],
      },
      {
        pessoa: "O do SharePoint",
        espera: [consultouOChamado("INC-20298"), diz("prazo")],
      },
    ],
  },
  {
    id: "pedido-vago",
    criterio: CRITERIOS.conducao,
    objetivo: "não adivinha o problema quando a pessoa é vaga",
    email: CARLA,
    turnos: [
      {
        pessoa: "Nada funciona hoje, que raiva.",
        espera: [semRascunho(), pergunta()],
      },
    ],
  },
];
