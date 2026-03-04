import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card, CardContent, CardHeader, CardTitle, Modal, Button, Input } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Lancamento } from '../types';
import { Calendar, ChevronDown } from 'lucide-react';

type GranularDetail = {
  title: string;
  lancamentos: Lancamento[];
  type: 'conta' | 'projeto';
  extraInfo?: string;
} | null;

export const Dashboard: React.FC = () => {
  const { lancamentos, contas, projetos, classes, agentes } = useFinance();
  const [detail, setDetail] = useState<GranularDetail>(null);
  
  // Filtro de Data
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter(l => {
      const dataRef = l.status === 'Efetivado' && l.dataBaixa ? l.dataBaixa : l.dataVencimento;
      if (dataInicio && dataRef < dataInicio) return false;
      if (dataFim && dataRef > dataFim) return false;
      return true;
    });
  }, [lancamentos, dataInicio, dataFim]);

  const metrics = useMemo(() => {
    // Saldo Atual: considerando todos os lançamentos efetivados
    const saldoAtual = contas.reduce((acc, c) => acc + c.saldoInicial, 0) +
      lancamentos.filter(l => l.status === 'Efetivado').reduce((acc, l) => l.tipo === 'Receita' ? acc + l.valor : acc - l.valor, 0);

    // Em Aberto no período selecionado
    const despesasEmAbertoPeriodo = lancamentosFiltrados
      .filter(l => l.status === 'Pendente' && l.tipo === 'Despesa')
      .reduce((acc, l) => acc + l.valor, 0);

    const receitasEmAbertoPeriodo = lancamentosFiltrados
      .filter(l => l.status === 'Pendente' && l.tipo === 'Receita')
      .reduce((acc, l) => acc + l.valor, 0);

    const isFuture = dataFim >= format(new Date(), 'yyyy-MM-dd');

    // Saldo no fim do período
    let saldoFuturo = 0;
    if (isFuture) {
      // Projeção de Saldo Futuro (até o final do período selecionado)
      const receitasPendentesAteFim = lancamentos
        .filter(l => l.status === 'Pendente' && l.tipo === 'Receita' && l.dataVencimento <= dataFim)
        .reduce((acc, l) => acc + l.valor, 0);

      const despesasPendentesAteFim = lancamentos
        .filter(l => l.status === 'Pendente' && l.tipo === 'Despesa' && l.dataVencimento <= dataFim)
        .reduce((acc, l) => acc + l.valor, 0);

      saldoFuturo = saldoAtual + receitasPendentesAteFim - despesasPendentesAteFim;
    } else {
      // Saldo real no final do período passado
      saldoFuturo = contas.reduce((acc, c) => acc + c.saldoInicial, 0) +
        lancamentos.filter(l => {
          if (l.status !== 'Efetivado') return false;
          const dataRef = l.dataBaixa || l.dataVencimento;
          return dataRef <= dataFim;
        }).reduce((acc, l) => l.tipo === 'Receita' ? acc + l.valor : acc - l.valor, 0);
    }

    return { saldoAtual, despesasEmAbertoPeriodo, receitasEmAbertoPeriodo, saldoFuturo, isFuture };
  }, [lancamentos, lancamentosFiltrados, contas, dataFim]);

  const saldoPorConta = useMemo(() => {
    return contas.map(conta => {
      const saldo = conta.saldoInicial + lancamentos
        .filter(l => {
          if (l.status !== 'Efetivado' || l.contaId !== conta.id) return false;
          const dataRef = l.dataBaixa || l.dataVencimento;
          return dataRef <= dataFim;
        })
        .reduce((acc, l) => l.tipo === 'Receita' ? acc + l.valor : acc - l.valor, 0);
      return { name: conta.nome, valor: saldo, id: conta.id, saldoInicial: conta.saldoInicial };
    });
  }, [contas, lancamentos, dataFim]);

  const despesasPorProjeto = useMemo(() => {
    const despesas = lancamentosFiltrados.filter(l => l.tipo === 'Despesa');
    const data = projetos.map(p => {
      const total = despesas.filter(l => l.projetoId === p.id).reduce((acc, l) => acc + l.valor, 0);
      return { name: p.nome, valor: total, id: p.id };
    }).filter(d => d.valor > 0);
    return data;
  }, [lancamentosFiltrados, projetos]);

  const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669'];

  const handleBarClick = (data: any) => {
    if (!data) return;
    const contaId = data.id || data.payload?.id;
    const contaNome = data.name || data.payload?.name;
    const saldoInicial = data.saldoInicial ?? data.payload?.saldoInicial;
    
    if (!contaId) return;

    const contaLancamentos = lancamentos
      .filter(l => {
        if (l.status !== 'Efetivado' || l.contaId !== contaId) return false;
        const dataRef = l.dataBaixa || l.dataVencimento;
        return dataRef <= dataFim;
      })
      .sort((a, b) => new Date(b.dataBaixa || '').getTime() - new Date(a.dataBaixa || '').getTime());

    setDetail({
      title: `Extrato: ${contaNome}`,
      lancamentos: contaLancamentos,
      type: 'conta',
      extraInfo: `Saldo Inicial: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoInicial || 0)}`
    });
  };

  const handlePieClick = (data: any) => {
    if (!data) return;
    const projetoId = data.id || data.payload?.id;
    const projetoNome = data.name || data.payload?.name;

    if (!projetoId) return;

    const projetoLancamentos = lancamentosFiltrados
      .filter(l => l.tipo === 'Despesa' && l.projetoId === projetoId)
      .sort((a, b) => {
        const dataA = a.status === 'Efetivado' && a.dataBaixa ? a.dataBaixa : a.dataVencimento;
        const dataB = b.status === 'Efetivado' && b.dataBaixa ? b.dataBaixa : b.dataVencimento;
        return new Date(dataB).getTime() - new Date(dataA).getTime();
      });

    setDetail({
      title: `Despesas: ${projetoNome}`,
      lancamentos: projetoLancamentos,
      type: 'projeto'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">Visão Geral</h1>
        
        <div className="relative" ref={filterRef}>
          <Button 
            variant="outline" 
            className="bg-white gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Período:</span>
            {format(parseISO(dataInicio), 'dd/MM/yy')} a {format(parseISO(dataFim), 'dd/MM/yy')}
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 z-10 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">Data Início</label>
                    <Input 
                      type="date" 
                      value={dataInicio} 
                      onChange={e => setDataInicio(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">Data Fim</label>
                    <Input 
                      type="date" 
                      value={dataFim} 
                      onChange={e => setDataFim(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setDataInicio(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                        setDataFim(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
                      }}
                    >
                      Mês Atual
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-emerald-600 text-white shadow-md border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saldoAtual)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-600 text-sm font-medium uppercase tracking-wider">Receitas em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light tracking-tight text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.receitasEmAbertoPeriodo)}
            </div>
            <p className="text-xs text-emerald-500 mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-600 text-sm font-medium uppercase tracking-wider">Despesas em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light tracking-tight text-red-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.despesasEmAbertoPeriodo)}
            </div>
            <p className="text-xs text-emerald-500 mt-1">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-600 text-sm font-medium uppercase tracking-wider">
              {metrics.isFuture ? 'Saldo Projetado' : 'Saldo no Período'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light tracking-tight text-emerald-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saldoFuturo)}
            </div>
            <p className="text-xs text-emerald-500 mt-1">Até o fim do período</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900">Saldo por Conta</CardTitle>
            <p className="text-xs text-emerald-500">Clique nas barras para ver o extrato</p>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={saldoPorConta} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} onClick={handleBarClick} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-emerald-900">Despesas por Projeto</CardTitle>
            <p className="text-xs text-emerald-500">Clique nas fatias para ver os lançamentos</p>
          </CardHeader>
          <CardContent className="h-80 flex justify-center items-center">
            {despesasPorProjeto.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={despesasPorProjeto}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="valor"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {despesasPorProjeto.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-emerald-400 text-sm">Sem dados para exibir</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail?.title || 'Detalhes'} className="max-w-2xl">
        {detail?.extraInfo && (
          <div className="mb-4 text-sm font-medium text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            {detail.extraInfo}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-emerald-100">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-emerald-600 uppercase bg-emerald-50/80 border-b border-emerald-100 sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Classe</th>
                <th className="px-4 py-3 font-medium">Agente</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {detail?.lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-emerald-500">Nenhum lançamento encontrado.</td>
                </tr>
              ) : detail?.lancamentos.map(l => (
                <tr key={l.id} className="border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors">
                  <td className="px-4 py-3 text-emerald-900 whitespace-nowrap">
                    {format(parseISO(l.status === 'Efetivado' && l.dataBaixa ? l.dataBaixa : l.dataVencimento), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${l.status === 'Efetivado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-700">{classes.find(c => c.id === l.classeId)?.nome}</td>
                  <td className="px-4 py-3 text-emerald-700">{agentes.find(a => a.id === l.agenteId)?.nome}</td>
                  <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${l.tipo === 'Receita' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.tipo === 'Despesa' ? '-' : '+'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(l.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
