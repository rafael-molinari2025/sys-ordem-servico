import { UsuarioDTO } from "shared";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { login as loginApi, me as meApi } from "../api/auth.api";

interface AuthContextValue {
  usuario: UsuarioDTO | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCarregando(false);
      return;
    }
    meApi()
      .then(setUsuario)
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      })
      .finally(() => setCarregando(false));
  }, []);

  async function login(email: string, senha: string) {
    const resposta = await loginApi({ email, senha });
    localStorage.setItem("token", resposta.token);
    localStorage.setItem("usuario", JSON.stringify(resposta.usuario));
    setUsuario(resposta.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return <AuthContext.Provider value={{ usuario, carregando, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
