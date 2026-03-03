import React, { useState, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { Card, Input, Select, Button } from "../components/ui/Card";
import { format, parseISO } from "date-fns";
import { Filter } from "lucide-react";

export const Historico: React.FC = () => {
  const { lancamentos, classes, projetos, agentes, contas } = useFinance();

  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroProjeto, setFiltroProjeto] = useState("");

  const filtrados = useMemo(() => {
    return lancamentos
      .filter((l) => {
        const dataRef =
          l.status === "Efetivado" && l.dataBaixa
            ? l.dataBaixa
            : l.dataVencimento;

        if (filtroDataInicio && dataRef < filtroDataInicio) return false;
        if (filtroDataFim && dataRef > filtroDataFim) return false;
        if (filtroClasse && l.classeId !== filtroClasse) return false;
        if (filtroProjeto && l.projetoId !== filtroProjeto) return false;

        return true;
      })
      .sort((a, b) => {
        const dataA =
          a.status === "Efetivado" && a.dataBaixa
            ? a.dataBaixa
            : a.dataVencimento;
        const dataB =
          b.status === "Efetivado" && b.dataBaixa
            ? b.dataBaixa
            : b.dataVencimento;
        return new Date(dataB).getTime() - new Date(dataA).getTime();
      });
  }, [
    lancamentos,
    filtroDataInicio,
    filtroDataFim,
    filtroClasse,
    filtroProjeto,
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
        Histórico Geral
      </h1>

      <Card className="bg-white border-emerald-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4 text-emerald-800 font-medium">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">
              Data Início
            </label>
            <Input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">
              Data Fim
            </label>
            <Input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">
              Classe
            </label>
            <Select
              value={filtroClasse}
              onChange={(e) => setFiltroClasse(e.target.value)}
            >
              <option value="">Todas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-emerald-600 uppercase mb-1">
              Projeto
            </label>
            <Select
              value={filtroProjeto}
              onChange={(e) => setFiltroProjeto(e.target.value)}
            >
              <option value="">Todos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setFiltroDataInicio("");
              setFiltroDataFim("");
              setFiltroClasse("");
              setFiltroProjeto("");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      <Card className="bg-white border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-emerald-600 uppercase bg-emerald-50/50 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 font-medium">Data (Ref)</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Classe</th>
                <th className="px-6 py-4 font-medium">Projeto</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-emerald-500"
                  >
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-emerald-50 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-emerald-900">
                      {format(
                        parseISO(
                          l.status === "Efetivado" && l.dataBaixa
                            ? l.dataBaixa
                            : l.dataVencimento,
                        ),
                        "dd/MM/yyyy",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${l.status === "Efetivado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${l.tipo === "Receita" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                      >
                        {l.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-700">
                      {classes.find((c) => c.id === l.classeId)?.nome}
                    </td>
                    <td className="px-6 py-4 text-emerald-700">
                      {projetos.find((p) => p.id === l.projetoId)?.nome}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${l.tipo === "Receita" ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(l.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
