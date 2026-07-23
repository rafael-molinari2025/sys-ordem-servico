import { PerfilUsuario } from "shared";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  perfis?: PerfilUsuario[];
}

export function ProtectedRoute({ perfis }: ProtectedRouteProps) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(usuario.perfil)) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-200">Acesso restrito</h1>
          <p className="text-sm text-gray-500">Seu perfil não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
