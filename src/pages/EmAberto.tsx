import React, { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
} from "../components/ui/Card";
import { format, parseISO } from "date-fns";
import { Plus, CheckCircle2, Edit2, Trash2, List } from "lucide-react";
import { Lancamento } from "../types";

export const EmAberto: React.FC = () => {
  const {
    lancamentos,
    classes,
    projetos,
    agentes,
    contas,
    addLancamento,
    updateLancamento,
    deleteLancamento,
    efetivarLancamento,
  } = useFinance();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false);
  const [isParcelasModalOpen, setIsParcelasModalOpen] = useState(false);
  const [selectedLancamentoId, setSelectedLancamentoId] = useState<
    string | null
  >(null);
  const [selectedRecorrenciaPaiId, setSelectedRecorrenciaPaiId] = useState<
    string | null
  >(null);
  const [lancamentoToEdit, setLancamentoToEdit] = useState<Lancamento | null>(null);

  const pendentesRaw = lancamentos
    .filter((l) => l.status === "Pendente");

  const pendentesGrouped = pendentesRaw.reduce((acc, l) => {
    if (l.quantidadeParcelas > 1 && l.idRecorrenciaPai) {
      if (!acc[l.idRecorrenciaPai]) {
        acc[l.idRecorrenciaPai] = l;
      } else if (l.parcelaAtual < acc[l.idRecorrenciaPai].parcelaAtual) {
        acc[l.idRecorrenciaPai] = l;
      }
    } else {
      acc[l.id] = l;
    }
    return acc;
  }, {} as Record<string, Lancamento>);

  const pendentes = Object.values(pendentesGrouped).sort(
    (a, b) =>
      new Date(a.dataVencimento).getTime() -
      new Date(b.dataVencimento).getTime(),
  );

  const parcelasEmAberto = selectedRecorrenciaPaiId
    ? lancamentos
        .filter(
          (l) =>
            l.idRecorrenciaPai === selectedRecorrenciaPaiId &&
            l.status === "Pendente"
        )
        .sort((a, b) => a.parcelaAtual - b.parcelaAtual)
    : [];

  const handleEfetivar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dataBaixa = formData.get("dataBaixa") as string;
    const contaId = formData.get("contaId") as string;
    if (selectedLancamentoId && dataBaixa && contaId) {
      await efetivarLancamento(selectedLancamentoId, dataBaixa, contaId);
      setIsBaixaModalOpen(false);
      setSelectedLancamentoId(null);
    }
  };

  const handleNewLancamento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await addLancamento({
      tipo: formData.get("tipo") as "Receita" | "Despesa",
      dataVencimento: formData.get("dataVencimento") as string,
      valor: Number(formData.get("valor")),
      quantidadeParcelas: Number(formData.get("quantidadeParcelas")),
      recorrente: formData.get("recorrente") === "on",
      agenteId: formData.get("agenteId") as string,
      projetoId: formData.get("projetoId") as string,
      classeId: formData.get("classeId") as string,
    });

    setIsNewModalOpen(false);
  };

  const handleEditLancamento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lancamentoToEdit) return;
    
    const formData = new FormData(e.currentTarget);

    await updateLancamento(lancamentoToEdit.id, {
      tipo: formData.get("tipo") as "Receita" | "Despesa",
      dataVencimento: formData.get("dataVencimento") as string,
      valor: Number(formData.get("valor")),
      agenteId: formData.get("agenteId") as string,
      projetoId: formData.get("projetoId") as string,
      classeId: formData.get("classeId") as string,
    });

    setIsEditModalOpen(false);
    setLancamentoToEdit(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
      await deleteLancamento(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
          Em Aberto
        </h1>
        <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </div>

      <Card className="bg-white border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-emerald-600 uppercase bg-emerald-50/50 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 font-medium">Vencimento</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Classe</th>
                <th className="px-6 py-4 font-medium">Agente</th>
                <th className="px-6 py-4 font-medium text-right">Valor</th>
                <th className="px-6 py-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendentes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-emerald-500"
                  >
                    Nenhum lançamento pendente.
                  </td>
                </tr>
              ) : (
                pendentes.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-emerald-50 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-emerald-900">
                      {format(parseISO(l.dataVencimento), "dd/MM/yyyy")}
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
                      {l.quantidadeParcelas > 1 && (
                        <span className="ml-2 text-xs text-emerald-500">
                          ({l.parcelaAtual}/{l.quantidadeParcelas})
                        </span>
                      )}
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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-full"
                          onClick={() => {
                            setSelectedLancamentoId(l.id);
                            setIsBaixaModalOpen(true);
                          }}
                          title="Efetivar"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                        {l.quantidadeParcelas > 1 && l.idRecorrenciaPai && (
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-full"
                            onClick={() => {
                              setSelectedRecorrenciaPaiId(l.idRecorrenciaPai || null);
                              setIsParcelasModalOpen(true);
                            }}
                            title="Ver Parcelas"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full"
                          onClick={() => {
                            setLancamentoToEdit(l);
                            setIsEditModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full"
                          onClick={() => handleDelete(l.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isParcelasModalOpen}
        onClose={() => setIsParcelasModalOpen(false)}
        title="Parcelas em Aberto"
        className="max-w-2xl"
      >
        <div className="overflow-x-auto rounded-xl border border-emerald-100">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-emerald-600 uppercase bg-emerald-50/80 border-b border-emerald-100">
              <tr>
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {parcelasEmAberto.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-emerald-500">
                    Nenhuma parcela pendente encontrada.
                  </td>
                </tr>
              ) : (
                parcelasEmAberto.map((p) => (
                  <tr key={p.id} className="border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors">
                    <td className="px-4 py-3 text-emerald-900 font-medium">
                      {p.parcelaAtual} / {p.quantidadeParcelas}
                    </td>
                    <td className="px-4 py-3 text-emerald-900">
                      {format(parseISO(p.dataVencimento), "dd/MM/yyyy")}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${p.tipo === "Receita" ? "text-emerald-600" : "text-red-600"}`}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(p.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pt-4 flex justify-end">
          <Button variant="outline" onClick={() => setIsParcelasModalOpen(false)}>
            Fechar
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isBaixaModalOpen}
        onClose={() => setIsBaixaModalOpen(false)}
        title="Efetivar Lançamento"
      >
        <form onSubmit={handleEfetivar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Data da Baixa
            </label>
            <Input
              name="dataBaixa"
              type="date"
              required
              defaultValue={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Conta Bancária
            </label>
            <Select name="contaId" required>
              <option value="">Selecione uma conta</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBaixaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Confirmar Baixa</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Novo Lançamento"
      >
        <form onSubmit={handleNewLancamento} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Tipo
              </label>
              <Select name="tipo" required>
                <option value="Despesa">Despesa</option>
                <option value="Receita">Receita</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Data de Vencimento
              </label>
              <Input
                name="dataVencimento"
                type="date"
                required
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Valor
            </label>
            <Input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Classe
              </label>
              <Select name="classeId" required>
                <option value="">Selecione</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Projeto
              </label>
              <Select name="projetoId" required>
                <option value="">Selecione</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Agente
            </label>
            <Select name="agenteId" required>
              <option value="">Selecione</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Qtd. Parcelas
              </label>
              <Input
                name="quantidadeParcelas"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </div>
            <div className="flex items-center h-10">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-emerald-900">
                <input
                  type="checkbox"
                  name="recorrente"
                  className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                Lançamento Recorrente
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setLancamentoToEdit(null);
        }}
        title="Editar Lançamento"
      >
        {lancamentoToEdit && (
          <form onSubmit={handleEditLancamento} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Tipo
                </label>
                <Select name="tipo" required defaultValue={lancamentoToEdit.tipo}>
                  <option value="Despesa">Despesa</option>
                  <option value="Receita">Receita</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Data de Vencimento
                </label>
                <Input
                  name="dataVencimento"
                  type="date"
                  required
                  defaultValue={lancamentoToEdit.dataVencimento}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Valor
              </label>
              <Input
                name="valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={lancamentoToEdit.valor}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Classe
                </label>
                <Select name="classeId" required defaultValue={lancamentoToEdit.classeId}>
                  <option value="">Selecione</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-900 mb-1">
                  Projeto
                </label>
                <Select name="projetoId" required defaultValue={lancamentoToEdit.projetoId}>
                  <option value="">Selecione</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Agente
              </label>
              <Select name="agenteId" required defaultValue={lancamentoToEdit.agenteId}>
                <option value="">Selecione</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setLancamentoToEdit(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
