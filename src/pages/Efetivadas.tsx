import React from "react";
import { useFinance } from "../context/FinanceContext";
import { Card } from "../components/ui/Card";
import { format, parseISO } from "date-fns";

export const Efetivadas: React.FC = () => {
  const { lancamentos, classes, projetos, agentes, contas } = useFinance();

  const efetivadas = lancamentos
    .filter((l) => l.status === "Efetivado")
    .sort(
      (a, b) =>
        new Date(b.dataBaixa || "").getTime() -
        new Date(a.dataBaixa || "").getTime(),
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
        Efetivadas
      </h1>

      <Card className="bg-white border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-emerald-600 uppercase bg-emerald-50/50 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 font-medium">Data Baixa</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Classe</th>
                <th className="px-6 py-4 font-medium">Conta</th>
                <th className="px-6 py-4 font-medium">Agente</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {efetivadas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-emerald-500"
                  >
                    Nenhum lançamento efetivado.
                  </td>
                </tr>
              ) : (
                efetivadas.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-emerald-50 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-emerald-900">
                      {l.dataBaixa
                        ? format(parseISO(l.dataBaixa), "dd/MM/yyyy")
                        : "-"}
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
                      {contas.find((c) => c.id === l.contaId)?.nome}
                    </td>
                    <td className="px-6 py-4 text-emerald-700">
                      {agentes.find((a) => a.id === l.agenteId)?.nome}
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
