import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Input } from "../components/ui/Card";
import { FileDown, FileText } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Relatorios: React.FC = () => {
  const { lancamentos, contas, agentes, classes } = useFinance();
  const [activeReport, setActiveReport] = useState<string>("extrato");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [selectedConta, setSelectedConta] = useState<string>("");

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const title = getReportTitle();
    
    doc.setFontSize(16);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Período: ${format(parseISO(startDate), "dd/MM/yyyy")} a ${format(parseISO(endDate), "dd/MM/yyyy")}`, 14, 30);

    let head: string[][] = [];
    let body: any[][] = [];

    if (activeReport === "extrato") {
      head = [["Data", "Descrição", "Classe", "Agente", "Valor", "Saldo"]];
      body = reportDataExtrato.map(item => [
        format(parseISO(item.data), "dd/MM/yyyy"),
        item.descricao,
        item.classe,
        item.agente,
        `R$ ${item.valor.toFixed(2)}`,
        `R$ ${item.saldo.toFixed(2)}`
      ]);
    } else if (activeReport === "despesa_fornecedor") {
      head = [["Fornecedor (Agente)", "Classe", "Total"]];
      body = reportDataDespesa.map(item => [
        item.agente,
        item.classe,
        `R$ ${item.total.toFixed(2)}`
      ]);
    } else if (activeReport === "receita_periodo") {
      head = [["Data", "Descrição", "Agente", "Valor"]];
      body = reportDataReceita.map(item => [
        format(parseISO(item.data), "dd/MM/yyyy"),
        item.descricao,
        item.agente,
        `R$ ${item.valor.toFixed(2)}`
      ]);
    } else if (activeReport === "saldo_investimentos") {
      head = [["Conta", "Saldo Inicial", "Entradas", "Saídas", "Saldo Atual"]];
      body = reportDataInvestimentos.map(item => [
        item.conta,
        `R$ ${item.saldoInicial.toFixed(2)}`,
        `R$ ${item.entradas.toFixed(2)}`,
        `R$ ${item.saidas.toFixed(2)}`,
        `R$ ${item.saldoAtual.toFixed(2)}`
      ]);
    }

    autoTable(doc, {
      startY: 35,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
    });

    doc.save(`${activeReport}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const getReportTitle = () => {
    switch (activeReport) {
      case "extrato": return "Extrato da Conta";
      case "despesa_fornecedor": return "Despesa por Fornecedor e Classe";
      case "receita_periodo": return "Receita por Período";
      case "saldo_investimentos": return "Saldo da Conta Investimentos";
      default: return "Relatório";
    }
  };

  // --- Report Data Calculations ---

  // 1. Extrato da conta
  const reportDataExtrato = useMemo(() => {
    if (activeReport !== "extrato" || !selectedConta) return [];
    
    const conta = contas.find(c => c.id === selectedConta);
    if (!conta) return [];

    let currentBalance = conta.saldoInicial;
    
    // Calculate balance before start date
    const pastLancamentos = lancamentos.filter(l => 
      l.contaId === selectedConta && 
      l.status === "Efetivado" && 
      l.data < startDate
    );
    
    pastLancamentos.forEach(l => {
      if (l.tipo === "Receita") currentBalance += l.valor;
      else if (l.tipo === "Despesa") currentBalance -= l.valor;
      else if (l.tipo === "Transferencia") {
        if (l.contaDestinoId === selectedConta) currentBalance += l.valor;
        else currentBalance -= l.valor;
      }
    });

    // Get transactions in period
    const periodLancamentos = lancamentos
      .filter(l => 
        l.status === "Efetivado" &&
        l.data >= startDate && 
        l.data <= endDate &&
        (l.contaId === selectedConta || l.contaDestinoId === selectedConta)
      )
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    return periodLancamentos.map(l => {
      let valor = l.valor;
      let isCredit = false;

      if (l.tipo === "Receita") isCredit = true;
      else if (l.tipo === "Despesa") isCredit = false;
      else if (l.tipo === "Transferencia") {
        isCredit = l.contaDestinoId === selectedConta;
      }

      if (isCredit) currentBalance += valor;
      else currentBalance -= valor;

      return {
        id: l.id,
        data: l.data,
        descricao: l.descricao,
        classe: classes.find(c => c.id === l.classeId)?.nome || "-",
        agente: agentes.find(a => a.id === l.agenteId)?.nome || "-",
        valor: isCredit ? valor : -valor,
        saldo: currentBalance
      };
    });
  }, [activeReport, selectedConta, startDate, endDate, lancamentos, contas, classes, agentes]);

  // 2. Despesa por fornecedor e classe
  const reportDataDespesa = useMemo(() => {
    if (activeReport !== "despesa_fornecedor") return [];

    const periodLancamentos = lancamentos.filter(l => 
      l.tipo === "Despesa" &&
      l.status === "Efetivado" &&
      l.data >= startDate && 
      l.data <= endDate
    );

    const grouped: Record<string, { agente: string, classe: string, total: number }> = {};

    periodLancamentos.forEach(l => {
      const agenteNome = agentes.find(a => a.id === l.agenteId)?.nome || "Sem Agente";
      const classeNome = classes.find(c => c.id === l.classeId)?.nome || "Sem Classe";
      const key = `${agenteNome}-${classeNome}`;

      if (!grouped[key]) {
        grouped[key] = { agente: agenteNome, classe: classeNome, total: 0 };
      }
      grouped[key].total += l.valor;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [activeReport, startDate, endDate, lancamentos, agentes, classes]);

  // 3. Receita por período
  const reportDataReceita = useMemo(() => {
    if (activeReport !== "receita_periodo") return [];

    return lancamentos
      .filter(l => 
        l.tipo === "Receita" &&
        l.status === "Efetivado" &&
        l.data >= startDate && 
        l.data <= endDate
      )
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map(l => ({
        data: l.data,
        descricao: l.descricao,
        agente: agentes.find(a => a.id === l.agenteId)?.nome || "-",
        valor: l.valor
      }));
  }, [activeReport, startDate, endDate, lancamentos, agentes]);

  // 4. Saldo da Conta investimentos
  const reportDataInvestimentos = useMemo(() => {
    if (activeReport !== "saldo_investimentos") return [];

    // Assuming "Investimentos" is a word in the account name, or we just show all accounts if none selected
    const targetContas = selectedConta ? contas.filter(c => c.id === selectedConta) : contas.filter(c => c.nome.toLowerCase().includes('investimento'));

    return targetContas.map(conta => {
      let saldoInicial = conta.saldoInicial;
      let entradas = 0;
      let saidas = 0;

      lancamentos.filter(l => l.status === "Efetivado").forEach(l => {
        if (l.tipo === "Receita" && l.contaId === conta.id) {
          if (l.data < startDate) saldoInicial += l.valor;
          else if (l.data <= endDate) entradas += l.valor;
        } else if (l.tipo === "Despesa" && l.contaId === conta.id) {
          if (l.data < startDate) saldoInicial -= l.valor;
          else if (l.data <= endDate) saidas += l.valor;
        } else if (l.tipo === "Transferencia") {
          if (l.contaId === conta.id) {
            if (l.data < startDate) saldoInicial -= l.valor;
            else if (l.data <= endDate) saidas += l.valor;
          }
          if (l.contaDestinoId === conta.id) {
            if (l.data < startDate) saldoInicial += l.valor;
            else if (l.data <= endDate) entradas += l.valor;
          }
        }
      });

      return {
        conta: conta.nome,
        saldoInicial,
        entradas,
        saidas,
        saldoAtual: saldoInicial + entradas - saidas
      };
    });
  }, [activeReport, selectedConta, startDate, endDate, lancamentos, contas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
          Relatórios
        </h1>
        <Button onClick={handleGeneratePDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          Gerar PDF
        </Button>
      </div>

      <Card className="bg-white border-emerald-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Tipo de Relatório
              </label>
              <Select
                value={activeReport}
                onChange={(e) => setActiveReport(e.target.value)}
              >
                <option value="extrato">Extrato da Conta</option>
                <option value="despesa_fornecedor">Despesa por Fornecedor e Classe</option>
                <option value="receita_periodo">Receita por Período</option>
                <option value="saldo_investimentos">Saldo da Conta Investimentos</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {(activeReport === "extrato" || activeReport === "saldo_investimentos") && (
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Conta
                </label>
                <Select
                  value={selectedConta}
                  onChange={(e) => setSelectedConta(e.target.value)}
                >
                  <option value="">Selecione uma conta...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-emerald-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {getReportTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {activeReport === "extrato" && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-emerald-700 uppercase bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Agente</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDataExtrato.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-emerald-500">
                        Nenhum dado encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    reportDataExtrato.map((item, idx) => (
                      <tr key={idx} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                        <td className="px-4 py-3">{format(parseISO(item.data), "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3 font-medium text-emerald-900">{item.descricao}</td>
                        <td className="px-4 py-3 text-emerald-600">{item.classe}</td>
                        <td className="px-4 py-3 text-emerald-600">{item.agente}</td>
                        <td className={`px-4 py-3 text-right font-medium ${item.valor >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          R$ {item.valor.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-900">
                          R$ {item.saldo.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "despesa_fornecedor" && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-emerald-700 uppercase bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Fornecedor (Agente)</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDataDespesa.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-emerald-500">
                        Nenhum dado encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    reportDataDespesa.map((item, idx) => (
                      <tr key={idx} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                        <td className="px-4 py-3 font-medium text-emerald-900">{item.agente}</td>
                        <td className="px-4 py-3 text-emerald-600">{item.classe}</td>
                        <td className="px-4 py-3 text-right font-medium text-red-600">
                          R$ {item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "receita_periodo" && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-emerald-700 uppercase bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Agente</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDataReceita.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-emerald-500">
                        Nenhum dado encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    reportDataReceita.map((item, idx) => (
                      <tr key={idx} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                        <td className="px-4 py-3">{format(parseISO(item.data), "dd/MM/yyyy")}</td>
                        <td className="px-4 py-3 font-medium text-emerald-900">{item.descricao}</td>
                        <td className="px-4 py-3 text-emerald-600">{item.agente}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          R$ {item.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeReport === "saldo_investimentos" && (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-emerald-700 uppercase bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Conta</th>
                    <th className="px-4 py-3 text-right">Saldo Inicial (Período)</th>
                    <th className="px-4 py-3 text-right">Entradas</th>
                    <th className="px-4 py-3 text-right">Saídas</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Saldo Atual</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDataInvestimentos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-emerald-500">
                        Nenhum dado encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    reportDataInvestimentos.map((item, idx) => (
                      <tr key={idx} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                        <td className="px-4 py-3 font-medium text-emerald-900">{item.conta}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">R$ {item.saldoInicial.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">R$ {item.entradas.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-red-600">R$ {item.saidas.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-900">R$ {item.saldoAtual.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
