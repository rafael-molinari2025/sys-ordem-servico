import { PerfilUsuario } from "shared";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/", label: "Painel", exact: true },
  { to: "/clientes", label: "Clientes" },
  { to: "/estoque", label: "Estoque" },
  { to: "/servicos", label: "Serviços" },
  { to: "/ordens", label: "Ordens de Serviço" },
  { to: "/relatorios", label: "Relatórios" },
];

function linkClasses({ isActive }: { isActive: boolean }) {
  return `rounded px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
  }`;
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const conteudoNav = (
    <>
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-bold text-gray-100">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
          Ordem de Serviço
        </span>
        <button onClick={() => setMenuAberto(false)} className="text-gray-500 md:hidden" aria-label="Fechar menu">
          ✕
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact} className={linkClasses} onClick={() => setMenuAberto(false)}>
            {item.label}
          </NavLink>
        ))}
        {usuario?.perfil === PerfilUsuario.ADMIN && (
          <NavLink to="/configuracoes" className={linkClasses} onClick={() => setMenuAberto(false)}>
            Configurações
          </NavLink>
        )}
        {usuario?.perfil === PerfilUsuario.ADMIN && (
          <NavLink to="/usuarios" className={linkClasses} onClick={() => setMenuAberto(false)}>
            Usuários
          </NavLink>
        )}
        <NavLink to="/ajuda" className={linkClasses} onClick={() => setMenuAberto(false)}>
          Ajuda
        </NavLink>
      </nav>
      <div className="border-t border-line pt-3 text-sm">
        <div className="font-medium text-gray-200">{usuario?.nome}</div>
        <div className="text-xs text-gray-500">{usuario?.perfil === PerfilUsuario.ADMIN ? "Administrador" : "Atendente"}</div>
        <button onClick={logout} className="mt-2 text-xs font-medium text-red-400 hover:text-red-300">
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-app md:flex-row">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <span className="flex items-center gap-2 text-lg font-bold text-gray-100">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          Ordem de Serviço
        </span>
        <button
          onClick={() => setMenuAberto(true)}
          className="rounded border border-line px-3 py-1.5 text-sm font-medium text-gray-300"
          aria-label="Abrir menu"
        >
          ☰ Menu
        </button>
      </header>

      <aside className="hidden w-56 flex-col border-r border-line bg-surface p-4 md:flex">{conteudoNav}</aside>

      {menuAberto && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuAberto(false)} />
          <aside className="relative z-50 flex w-64 flex-col bg-surface p-4 shadow-xl">{conteudoNav}</aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-app p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
