export type TipoLancamento = "Receita" | "Despesa";
export type StatusLancamento = "Pendente" | "Efetivado";

export interface Conta {
  id: string;
  nome: string;
  saldoInicial: number;
}

export interface Projeto {
  id: string;
  nome: string;
}

export interface Agente {
  id: string;
  nome: string;
}

export interface Classe {
  id: string;
  nome: string;
  tipo: TipoLancamento;
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  dataVencimento: string; // YYYY-MM-DD
  valor: number;
  quantidadeParcelas: number;
  parcelaAtual: number;
  recorrente: boolean;
  agenteId: string;
  projetoId: string;
  classeId: string;
  status: StatusLancamento;
  dataBaixa?: string; // YYYY-MM-DD
  contaId?: string;
  idRecorrenciaPai?: string;
}
