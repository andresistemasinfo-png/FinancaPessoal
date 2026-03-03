import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { addMonths, format, parseISO } from "date-fns";
import { supabase } from "../lib/supabase";
import {
  Conta,
  Projeto,
  Agente,
  Classe,
  Lancamento,
  TipoLancamento,
  StatusLancamento,
} from "../types";

interface FinanceContextData {
  contas: Conta[];
  projetos: Projeto[];
  agentes: Agente[];
  classes: Classe[];
  lancamentos: Lancamento[];
  addConta: (conta: Omit<Conta, "id">) => Promise<void>;
  updateConta: (id: string, conta: Partial<Conta>) => Promise<void>;
  deleteConta: (id: string) => Promise<void>;
  addProjeto: (projeto: Omit<Projeto, "id">) => Promise<void>;
  updateProjeto: (id: string, projeto: Partial<Projeto>) => Promise<void>;
  deleteProjeto: (id: string) => Promise<void>;
  addAgente: (agente: Omit<Agente, "id">) => Promise<void>;
  updateAgente: (id: string, agente: Partial<Agente>) => Promise<void>;
  deleteAgente: (id: string) => Promise<void>;
  addClasse: (classe: Omit<Classe, "id">) => Promise<void>;
  updateClasse: (id: string, classe: Partial<Classe>) => Promise<void>;
  deleteClasse: (id: string) => Promise<void>;
  addLancamento: (
    lancamento: Omit<Lancamento, "id" | "status" | "parcelaAtual">,
  ) => Promise<void>;
  updateLancamento: (id: string, lancamento: Partial<Lancamento>) => Promise<void>;
  efetivarLancamento: (id: string, dataBaixa: string, contaId: string) => Promise<void>;
  deleteLancamento: (id: string) => Promise<void>;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextData | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: contasData },
        { data: projetosData },
        { data: agentesData },
        { data: classesData },
        { data: lancamentosData },
      ] = await Promise.all([
        supabase.from("contas").select("*"),
        supabase.from("projetos").select("*"),
        supabase.from("agentes").select("*"),
        supabase.from("classes").select("*"),
        supabase.from("lancamentos").select("*"),
      ]);

      if (contasData) setContas(contasData);
      if (projetosData) setProjetos(projetosData);
      if (agentesData) setAgentes(agentesData);
      if (classesData) setClasses(classesData);
      if (lancamentosData) setLancamentos(lancamentosData);
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Contas
  const addConta = async (conta: Omit<Conta, "id">) => {
    const newConta = { ...conta, id: uuidv4() };
    const { error } = await supabase.from("contas").insert([newConta]);
    if (error) {
      console.error("Error adding conta:", error);
    } else {
      setContas([...contas, newConta]);
    }
  };
  const updateConta = async (id: string, data: Partial<Conta>) => {
    const { error } = await supabase.from("contas").update(data).eq("id", id);
    if (error) {
      console.error("Error updating conta:", error);
    } else {
      setContas(contas.map((c) => (c.id === id ? { ...c, ...data } : c)));
    }
  };
  const deleteConta = async (id: string) => {
    const { error } = await supabase.from("contas").delete().eq("id", id);
    if (error) {
      console.error("Error deleting conta:", error);
    } else {
      setContas(contas.filter((c) => c.id !== id));
    }
  };

  // CRUD Projetos
  const addProjeto = async (projeto: Omit<Projeto, "id">) => {
    const newProjeto = { ...projeto, id: uuidv4() };
    const { error } = await supabase.from("projetos").insert([newProjeto]);
    if (error) {
      console.error("Error adding projeto:", error);
    } else {
      setProjetos([...projetos, newProjeto]);
    }
  };
  const updateProjeto = async (id: string, data: Partial<Projeto>) => {
    const { error } = await supabase.from("projetos").update(data).eq("id", id);
    if (error) {
      console.error("Error updating projeto:", error);
    } else {
      setProjetos(projetos.map((p) => (p.id === id ? { ...p, ...data } : p)));
    }
  };
  const deleteProjeto = async (id: string) => {
    const { error } = await supabase.from("projetos").delete().eq("id", id);
    if (error) {
      console.error("Error deleting projeto:", error);
    } else {
      setProjetos(projetos.filter((p) => p.id !== id));
    }
  };

  // CRUD Agentes
  const addAgente = async (agente: Omit<Agente, "id">) => {
    const newAgente = { ...agente, id: uuidv4() };
    const { error } = await supabase.from("agentes").insert([newAgente]);
    if (error) {
      console.error("Error adding agente:", error);
    } else {
      setAgentes([...agentes, newAgente]);
    }
  };
  const updateAgente = async (id: string, data: Partial<Agente>) => {
    const { error } = await supabase.from("agentes").update(data).eq("id", id);
    if (error) {
      console.error("Error updating agente:", error);
    } else {
      setAgentes(agentes.map((a) => (a.id === id ? { ...a, ...data } : a)));
    }
  };
  const deleteAgente = async (id: string) => {
    const { error } = await supabase.from("agentes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting agente:", error);
    } else {
      setAgentes(agentes.filter((a) => a.id !== id));
    }
  };

  // CRUD Classes
  const addClasse = async (classe: Omit<Classe, "id">) => {
    const newClasse = { ...classe, id: uuidv4() };
    const { error } = await supabase.from("classes").insert([newClasse]);
    if (error) {
      console.error("Error adding classe:", error);
    } else {
      setClasses([...classes, newClasse]);
    }
  };
  const updateClasse = async (id: string, data: Partial<Classe>) => {
    const { error } = await supabase.from("classes").update(data).eq("id", id);
    if (error) {
      console.error("Error updating classe:", error);
    } else {
      setClasses(classes.map((c) => (c.id === id ? { ...c, ...data } : c)));
    }
  };
  const deleteClasse = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      console.error("Error deleting classe:", error);
    } else {
      setClasses(classes.filter((c) => c.id !== id));
    }
  };

  // Lançamentos
  const addLancamento = async (
    data: Omit<Lancamento, "id" | "status" | "parcelaAtual">,
  ) => {
    const novosLancamentos: Lancamento[] = [];
    const idRecorrenciaPai = uuidv4();

    if (data.quantidadeParcelas > 1 && !data.recorrente) {
      // Parcelamento
      for (let i = 0; i < data.quantidadeParcelas; i++) {
        const dataVenc = format(
          addMonths(parseISO(data.dataVencimento), i),
          "yyyy-MM-dd",
        );
        novosLancamentos.push({
          ...data,
          id: uuidv4(),
          status: "Pendente",
          dataVencimento: dataVenc,
          parcelaAtual: i + 1,
          idRecorrenciaPai,
        });
      }
    } else {
      // Único ou Recorrente
      novosLancamentos.push({
        ...data,
        id: uuidv4(),
        status: "Pendente",
        parcelaAtual: 1,
        idRecorrenciaPai: data.recorrente ? idRecorrenciaPai : undefined,
      });
    }

    const { error } = await supabase.from("lancamentos").insert(novosLancamentos);
    if (!error) setLancamentos([...lancamentos, ...novosLancamentos]);
  };

  const updateLancamento = async (id: string, data: Partial<Lancamento>) => {
    const { error } = await supabase.from("lancamentos").update(data).eq("id", id);
    if (!error) {
      setLancamentos(lancamentos.map((l) => (l.id === id ? { ...l, ...data } : l)));
    }
  };

  const efetivarLancamento = async (
    id: string,
    dataBaixa: string,
    contaId: string,
  ) => {
    const current = lancamentos.find((l) => l.id === id);
    if (!current) return;

    const updates = {
      status: "Efetivado" as StatusLancamento,
      dataBaixa,
      contaId,
    };

    const { error } = await supabase.from("lancamentos").update(updates).eq("id", id);

    if (!error) {
      let nextLancamento: Lancamento | null = null;

      if (current.recorrente) {
        const nextDate = format(
          addMonths(parseISO(current.dataVencimento), 1),
          "yyyy-MM-dd",
        );
        nextLancamento = {
          ...current,
          id: uuidv4(),
          status: "Pendente",
          dataVencimento: nextDate,
          parcelaAtual: current.parcelaAtual + 1,
          dataBaixa: undefined,
          contaId: undefined,
        };
        await supabase.from("lancamentos").insert([nextLancamento]);
      }

      setLancamentos((prev) => {
        const updatedList = prev.map((l) =>
          l.id === id ? { ...l, ...updates } : l,
        );
        if (nextLancamento) {
          updatedList.push(nextLancamento);
        }
        return updatedList;
      });
    }
  };

  const deleteLancamento = async (id: string) => {
    const { error } = await supabase.from("lancamentos").delete().eq("id", id);
    if (!error) setLancamentos(lancamentos.filter((l) => l.id !== id));
  };

  return (
    <FinanceContext.Provider
      value={{
        contas,
        projetos,
        agentes,
        classes,
        lancamentos,
        addConta,
        updateConta,
        deleteConta,
        addProjeto,
        updateProjeto,
        deleteProjeto,
        addAgente,
        updateAgente,
        deleteAgente,
        addClasse,
        updateClasse,
        deleteClasse,
        addLancamento,
        updateLancamento,
        efetivarLancamento,
        deleteLancamento,
        loading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinance must be used within a FinanceProvider");
  return context;
};
