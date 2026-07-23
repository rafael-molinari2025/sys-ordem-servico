import { NavLink } from "react-router-dom";

const abas = [
  { to: "/configuracoes/empresa", label: "Dados da Empresa" },
  { to: "/configuracoes/whatsapp", label: "WhatsApp" },
];

function tabClasses({ isActive }: { isActive: boolean }) {
  return `rounded px-3 py-1.5 text-sm font-medium ${
    isActive ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
  }`;
}

export function ConfiguracoesTabs() {
  return (
    <div className="mb-6 flex gap-2 border-b border-line pb-4">
      {abas.map((aba) => (
        <NavLink key={aba.to} to={aba.to} className={tabClasses}>
          {aba.label}
        </NavLink>
      ))}
    </div>
  );
}
