import { PerfilUsuario } from "shared";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layout/AppLayout";
import { PublicLayout } from "./layout/PublicLayout";
import { AjudaPage } from "./pages/AjudaPage";
import { ClientesListPage } from "./pages/clientes/ClientesListPage";
import { EmpresaPage } from "./pages/configuracoes/EmpresaPage";
import { WhatsappStatusPage } from "./pages/configuracoes/WhatsappStatusPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EsqueciSenhaPage } from "./pages/EsqueciSenhaPage";
import { PecasListPage } from "./pages/estoque/PecasListPage";
import { LoginPage } from "./pages/LoginPage";
import { RedefinirSenhaPage } from "./pages/RedefinirSenhaPage";
import { OrcamentoAutorizacaoPage } from "./pages/orcamento/OrcamentoAutorizacaoPage";
import { OrdemCreatePage } from "./pages/ordens/OrdemCreatePage";
import { OrdemDetailPage } from "./pages/ordens/OrdemDetailPage";
import { OrdensListPage } from "./pages/ordens/OrdensListPage";
import { RelatoriosPage } from "./pages/relatorios/RelatoriosPage";
import { ServicosListPage } from "./pages/servicos/ServicosListPage";
import { UsuariosPage } from "./pages/usuarios/UsuariosPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/redefinir-senha/:token" element={<RedefinirSenhaPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/autorizacao/:token" element={<OrcamentoAutorizacaoPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesListPage />} />
          <Route path="/estoque" element={<PecasListPage />} />
          <Route path="/servicos" element={<ServicosListPage />} />
          <Route path="/ordens" element={<OrdensListPage />} />
          <Route path="/ordens/nova" element={<OrdemCreatePage />} />
          <Route path="/ordens/:id" element={<OrdemDetailPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/ajuda" element={<AjudaPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute perfis={[PerfilUsuario.ADMIN]} />}>
        <Route element={<AppLayout />}>
          <Route path="/configuracoes" element={<Navigate to="/configuracoes/empresa" replace />} />
          <Route path="/configuracoes/empresa" element={<EmpresaPage />} />
          <Route path="/configuracoes/whatsapp" element={<WhatsappStatusPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
