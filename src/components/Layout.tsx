import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  CheckCircle,
  History,
  Settings,
  PieChart,
  LogOut,
  KeyRound,
  Users
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/em-aberto", icon: ListTodo, label: "Em Aberto" },
  { to: "/efetivadas", icon: CheckCircle, label: "Efetivadas" },
  { to: "/historico", icon: History, label: "Histórico Geral" },
  { to: "/relatorios", icon: PieChart, label: "Relatórios" },
  { to: "/usuarios", icon: Users, label: "Usuários" },
  { to: "/configuracoes", icon: Settings, label: "Configurações" },
];

export const Layout: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-emerald-50/30 text-emerald-950 font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-emerald-100 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
            $
          </div>
          <h1 className="text-xl font-semibold text-emerald-900 tracking-tight">
            Finanças
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium",
                  isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900",
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-emerald-100 space-y-2">
          <div className="px-3 py-2 text-xs font-medium text-emerald-500 truncate">
            {user?.email}
          </div>
          <NavLink
            to="/senha"
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium",
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900",
              )
            }
          >
            <KeyRound className="w-5 h-5" />
            Alterar Senha
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 flex justify-around p-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-emerald-700"
                  : "text-emerald-400 hover:text-emerald-600",
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/senha"
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px]",
              isActive
                ? "text-emerald-700"
                : "text-emerald-400 hover:text-emerald-600",
            )
          }
        >
          <KeyRound className="w-6 h-6" />
          <span className="text-[10px] font-medium whitespace-nowrap">Senha</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[64px] text-red-400 hover:text-red-600"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium whitespace-nowrap">Sair</span>
        </button>
      </nav>
    </div>
  );
};
