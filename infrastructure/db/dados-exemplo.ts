import type { ArtigoDaCentralDeAjuda, Chamado, Usuario } from "@/domain/types";

export const USUARIOS_DE_EXEMPLO: Usuario[] = [
  {
    id: "usr-ana",
    nome: "Ana Souza",
    email: "ana.souza@nexo.com.br",
    departamento: "Financeiro",
    papel: "funcionario",
  },
  {
    id: "usr-bruno",
    nome: "Bruno Tavares",
    email: "bruno.tavares@nexo.com.br",
    departamento: "Operações",
    papel: "funcionario",
  },
  {
    id: "usr-carla",
    nome: "Carla Mendes",
    email: "carla.mendes@nexo.com.br",
    departamento: "Comercial",
    papel: "funcionario",
  },
  {
    id: "usr-diego",
    nome: "Diego Ramos",
    email: "diego.ramos@nexo.com.br",
    departamento: "Marketing",
    papel: "funcionario",
  },
  {
    id: "usr-rafael",
    nome: "Rafael Lima",
    email: "rafael.lima@nexo.com.br",
    departamento: "Suporte N2",
    papel: "analista",
  },
];

export const ARTIGOS_DE_EXEMPLO: ArtigoDaCentralDeAjuda[] = [
  {
    id: "kb-001",
    titulo: "VPN com erro 809",
    conteudo:
      "Reinstale o cliente de VPN pelo portal de softwares e reinicie o computador. Vale apenas para Windows 10; no Windows 11, abra um chamado.",
    categoria: "Rede e VPN",
    palavrasChave: ["vpn", "erro 809", "conexão remota", "windows"],
  },
  {
    id: "kb-002",
    titulo: "Horário do service desk",
    conteudo:
      "De segunda a sexta, das 8h às 18h. Chamados críticos têm plantão 24 horas.",
    categoria: "Outros",
    palavrasChave: ["horário", "atendimento", "plantão", "sla"],
  },
  {
    id: "kb-003",
    titulo: "Como redefinir a senha da rede Nexo",
    conteudo:
      "Acesse senha.nexo.com.br pelo navegador, informe o e-mail corporativo e siga o link enviado. A nova senha precisa de 10 caracteres, com números e letras maiúsculas. A troca vale também para o Wi-Fi e para o Outlook.",
    categoria: "Acesso",
    palavrasChave: ["senha", "rede", "redefinir", "login"],
  },
  {
    id: "kb-004",
    titulo: "Senha do SAP bloqueada",
    conteudo:
      "O SAP bloqueia a conta após três tentativas erradas. O desbloqueio é feito pelo service desk e leva até 2 horas úteis. Abra um chamado informando seu usuário SAP.",
    categoria: "Acesso",
    palavrasChave: ["sap", "senha", "bloqueada", "desbloqueio"],
  },
  {
    id: "kb-005",
    titulo: "Segundo monitor e equipamentos para home office",
    conteudo:
      "Pedidos de monitor, teclado, mouse e headset são requisições e precisam da aprovação do gestor. O prazo de entrega é de até 10 dias úteis após a aprovação.",
    categoria: "Hardware",
    palavrasChave: ["monitor", "home office", "equipamento", "requisição"],
  },
  {
    id: "kb-006",
    titulo: "Notebook lento: o que tentar antes de abrir um chamado",
    conteudo:
      "Reinicie o computador, feche abas e programas que não estiver usando e rode o diagnóstico da central de softwares. Se a lentidão continuar depois disso, abra um chamado informando quando começou.",
    categoria: "Hardware",
    palavrasChave: ["notebook", "lento", "desempenho", "diagnóstico"],
  },
  {
    id: "kb-007",
    titulo: "Outlook não sincroniza no celular",
    conteudo:
      "Remova a conta do aplicativo e adicione de novo usando o e-mail corporativo. Se aparecer pedido de autenticação em dois fatores, aprove pelo Microsoft Authenticator.",
    categoria: "E-mail",
    palavrasChave: ["outlook", "celular", "sincronizar", "e-mail"],
  },
  {
    id: "kb-008",
    titulo: "Acesso a pastas compartilhadas no SharePoint",
    conteudo:
      "O acesso é liberado pelo responsável da pasta. Abra uma requisição informando o nome da pasta e o motivo. Acessos a pastas de outro departamento precisam da aprovação do gestor da área.",
    categoria: "Acesso",
    palavrasChave: ["sharepoint", "pasta", "compartilhada", "acesso"],
  },
  {
    id: "kb-009",
    titulo: "Wi-Fi corporativo: como conectar",
    conteudo:
      "Escolha a rede Nexo-Corp e entre com o e-mail corporativo e a senha da rede. A rede Nexo-Visitantes não dá acesso aos sistemas internos.",
    categoria: "Rede e VPN",
    palavrasChave: ["wi-fi", "rede", "conectar", "nexo-corp"],
  },
];

const MS_POR_HORA = 60 * 60 * 1000;
const horasAtras = (agora: Date, horas: number) =>
  new Date(agora.getTime() - horas * MS_POR_HORA);
const diasAtras = (agora: Date, dias: number) => horasAtras(agora, dias * 24);

export function construirChamadosDeExemplo(agora: Date): Chamado[] {
  return [
    {
      codigo: "INC-20311",
      tipo: "incidente",
      titulo: "Notebook lento após atualização do Windows",
      descricao:
        "Lentidão geral desde a atualização do Windows. Reiniciar e rodar o diagnóstico da central não resolveu.",
      categoria: "Hardware",
      prioridade: "media",
      status: "aguardando_analista",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 14),
      atualizadoEm: diasAtras(agora, 6),
      resolvidoEm: null,
    },
    {
      codigo: "INC-20298",
      tipo: "incidente",
      titulo: "Acesso à pasta Financeiro no SharePoint",
      descricao:
        "A pasta Financeiro parou de abrir no SharePoint e mostra erro de permissão. O acesso funcionava até a semana passada.",
      categoria: "Acesso",
      prioridade: "media",
      status: "em_andamento",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 3),
      atualizadoEm: horasAtras(agora, 4),
      resolvidoEm: null,
    },
    {
      codigo: "REQ-10442",
      tipo: "requisicao",
      titulo: "Segundo monitor para home office",
      descricao:
        "Pedido de um segundo monitor para uso em home office, aprovado pelo gestor e aguardando entrega.",
      categoria: "Hardware",
      prioridade: "baixa",
      status: "aprovado",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 10),
      atualizadoEm: diasAtras(agora, 7),
      resolvidoEm: null,
    },
    {
      codigo: "INC-20150",
      tipo: "incidente",
      titulo: "Senha do SAP bloqueada",
      descricao:
        "A conta do SAP bloqueou após tentativas de login com a senha antiga. Desbloqueada pelo service desk.",
      categoria: "Acesso",
      prioridade: "media",
      status: "resolvido",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 6),
      atualizadoEm: diasAtras(agora, 4),
      resolvidoEm: diasAtras(agora, 4),
    },
    {
      codigo: "INC-19877",
      tipo: "incidente",
      titulo: "Outlook não sincroniza no celular",
      descricao:
        "O aplicativo do Outlook parou de receber e-mails no celular. Resolvido removendo e adicionando a conta.",
      categoria: "E-mail",
      prioridade: "baixa",
      status: "resolvido",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 24),
      atualizadoEm: diasAtras(agora, 20),
      resolvidoEm: diasAtras(agora, 20),
    },
    {
      codigo: "INC-19410",
      tipo: "incidente",
      titulo: "Troca de senha da rede",
      descricao:
        "Senha da rede expirada e sem acesso ao portal de troca. Redefinida pelo service desk.",
      categoria: "Acesso",
      prioridade: "baixa",
      status: "resolvido",
      solicitanteId: "usr-ana",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 112),
      atualizadoEm: diasAtras(agora, 110),
      resolvidoEm: diasAtras(agora, 110),
    },
    {
      codigo: "INC-20455",
      tipo: "incidente",
      titulo: "Sistema de emissão de notas fiscais fora do ar",
      descricao:
        "O sistema de notas fiscais não abre para ninguém do time Comercial. Nenhuma nota está sendo emitida desde o início da tarde.",
      categoria: "Software",
      prioridade: "critica",
      status: "aguardando_analista",
      solicitanteId: "usr-carla",
      afetados: "equipe",
      abertoEm: horasAtras(agora, 2),
      atualizadoEm: horasAtras(agora, 2),
      resolvidoEm: null,
    },
    {
      codigo: "REQ-10501",
      tipo: "requisicao",
      titulo: "Acesso ao SAP para fechamento do mês",
      descricao:
        "Pedido de acesso ao módulo de faturamento do SAP para o fechamento do mês, que acontece hoje.",
      categoria: "Acesso",
      prioridade: "alta",
      status: "aberto",
      solicitanteId: "usr-carla",
      afetados: "pessoa",
      abertoEm: horasAtras(agora, 3),
      atualizadoEm: horasAtras(agora, 3),
      resolvidoEm: null,
    },
    {
      codigo: "INC-20377",
      tipo: "incidente",
      titulo: "Impressora do 3º andar sem conexão",
      descricao:
        "A impressora do 3º andar sumiu da lista de impressoras. O time usa a do 2º andar enquanto isso.",
      categoria: "Hardware",
      prioridade: "media",
      status: "aberto",
      solicitanteId: "usr-bruno",
      afetados: "equipe",
      abertoEm: diasAtras(agora, 1),
      atualizadoEm: diasAtras(agora, 1),
      resolvidoEm: null,
    },
    {
      codigo: "REQ-10520",
      tipo: "requisicao",
      titulo: "Licença do Figma para o time de Marketing",
      descricao:
        "Pedido de uma licença do Figma para a produção das peças de campanha.",
      categoria: "Software",
      prioridade: "baixa",
      status: "aberto",
      solicitanteId: "usr-diego",
      afetados: "pessoa",
      abertoEm: diasAtras(agora, 2),
      atualizadoEm: diasAtras(agora, 2),
      resolvidoEm: null,
    },
  ];
}

export const construirDadosDeExemplo = (agora: Date) => ({
  usuarios: USUARIOS_DE_EXEMPLO,
  artigos: ARTIGOS_DE_EXEMPLO,
  chamados: construirChamadosDeExemplo(agora),
});
