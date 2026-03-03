/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { EmAberto } from "./pages/EmAberto";
import { Efetivadas } from "./pages/Efetivadas";
import { Historico } from "./pages/Historico";
import { Relatorios } from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";

export default function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="em-aberto" element={<EmAberto />} />
            <Route path="efetivadas" element={<Efetivadas />} />
            <Route path="historico" element={<Historico />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}
