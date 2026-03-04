import React, { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
} from "../components/ui/Card";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";

export const Configuracoes: React.FC = () => {
  const {
    contas,
    projetos,
    agentes,
    classes,
    addConta,
    deleteConta,
    addProjeto,
    deleteProjeto,
    addAgente,
    deleteAgente,
    addClasse,
    deleteClasse,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<
    "contas" | "projetos" | "agentes" | "classes"
  >("contas");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para o modal de confirmação de reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (activeTab === "contas") {
      await addConta({
        nome: formData.get("nome") as string,
        saldoInicial: Number(formData.get("saldoInicial")),
      });
    } else if (activeTab === "projetos") {
      await addProjeto({ nome: formData.get("nome") as string });
    } else if (activeTab === "agentes") {
      await addAgente({ nome: formData.get("nome") as string });
    } else if (activeTab === "classes") {
      await addClasse({
        nome: formData.get("nome") as string,
        tipo: formData.get("tipo") as "Receita" | "Despesa",
      });
    }

    setIsModalOpen(false);
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      // 1. Apagar todos os lançamentos
      const { error: errorLancamentos } = await supabase
        .from('lancamentos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos

      if (errorLancamentos) throw errorLancamentos;

      // 2. Zerar o saldo inicial de todas as contas
      for (const conta of contas) {
        const { error: errorConta } = await supabase
          .from('contas')
          .update({ saldoInicial: 0 })
          .eq('id', conta.id);
          
        if (errorConta) throw errorConta;
      }

      // Recarregar a página para atualizar o contexto
      window.location.reload();
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      alert('Ocorreu um erro ao resetar os dados. Por favor, tente novamente.');
      setIsResetting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "contas":
        return (
          <ul className="space-y-2">
            {contas.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100"
              >
                <div>
                  <div className="font-medium text-emerald-900">{c.nome}</div>
                  <div className="text-xs text-emerald-600">
                    Saldo Inicial: R$ {c.saldoInicial.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteConta(c.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        );
      case "projetos":
        return (
          <ul className="space-y-2">
            {projetos.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100"
              >
                <div className="font-medium text-emerald-900">{p.nome}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProjeto(p.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        );
      case "agentes":
        return (
          <ul className="space-y-2">
            {agentes.map((a) => (
              <li
                key={a.id}
                className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100"
              >
                <div className="font-medium text-emerald-900">{a.nome}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAgente(a.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        );
      case "classes":
        return (
          <ul className="space-y-2">
            {classes.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100"
              >
                <div>
                  <div className="font-medium text-emerald-900">{c.nome}</div>
                  <div className="text-xs text-emerald-600">{c.tipo}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteClasse(c.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-emerald-950 tracking-tight">
          Configurações
        </h1>
        <Button 
          variant="outline" 
          className="bg-white gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={() => setIsResetModalOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Resetar Dados</span>
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["contas", "projetos", "agentes", "classes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50"}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Card className="bg-white border-emerald-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-900 capitalize">
            {activeTab}
          </CardTitle>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="gap-2 h-8 text-xs"
          >
            <Plus className="w-3 h-3" /> Novo
          </Button>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Novo(a) ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Nome
            </label>
            <Input name="nome" required placeholder="Digite o nome..." />
          </div>

          {activeTab === "contas" && (
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Saldo Inicial
              </label>
              <Input
                name="saldoInicial"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
          )}

          {activeTab === "classes" && (
            <div>
              <label className="block text-sm font-medium text-emerald-900 mb-1">
                Tipo
              </label>
              <Select name="tipo" required>
                <option value="Despesa">Despesa</option>
                <option value="Receita">Receita</option>
              </Select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Reset */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => !isResetting && setIsResetModalOpen(false)} 
        title="Atenção: Ação Irreversível" 
        className="max-w-md"
      >
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Você está prestes a apagar todos os dados!</h3>
              <p className="mt-1 text-sm text-red-700">
                Esta ação irá <strong>apagar todos os lançamentos</strong> e <strong>zerar o saldo inicial</strong> de todas as contas. Esta operação não pode ser desfeita.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              onClick={handleResetData}
              disabled={isResetting}
            >
              {isResetting ? 'Apagando Dados...' : 'Sim, Apagar Tudo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
