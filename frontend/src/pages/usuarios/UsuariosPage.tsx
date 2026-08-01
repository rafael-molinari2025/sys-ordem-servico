import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { PerfilUsuario, UsuarioDTO } from "shared";
import { apiErrorMessage } from "../../api/client";
import { atualizarUsuario, criarUsuario, listarUsuarios, removerUsuario } from "../../api/usuarios.api";
import { useAuth } from "../../auth/AuthContext";

const vazio = { nome: "", email: "", telefone: "", senha: "", perfil: PerfilUsuario.ATENDENTE };
const inputClasses =
  "w-full rounded border border-line bg-app px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-cyan-400 focus:outline-none";

export function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: usuarios, isLoading } = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios });

  const salvar = useMutation({
    mutationFn: async () => {
      if (editandoId) {
        const { senha, ...resto } = form;
        return atualizarUsuario(editandoId, senha ? form : resto);
      }
      return criarUsuario(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      cancelarEdicao();
    },
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível salvar o usuário")),
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
    onError: (err) => setErro(apiErrorMessage(err, "Não foi possível inativar o usuário")),
  });

  function iniciarEdicao(u: UsuarioDTO) {
    setEditandoId(u.id);
    setForm({ nome: u.nome, email: u.email, telefone: u.telefone ?? "", senha: "", perfil: u.perfil });
    setMostrarForm(true);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(vazio);
    setMostrarForm(false);
    setErro(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Usuários</h1>
        <button
          onClick={() => (mostrarForm ? cancelarEdicao() : setMostrarForm(true))}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {mostrarForm ? "Cancelar" : "Novo Usuário"}
        </button>
      </div>

      {erro && <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-line bg-card p-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Nome *</label>
            <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClasses} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">E-mail *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Telefone (WhatsApp)</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className={inputClasses}
              placeholder="5511999999999"
            />
            <p className="mt-1 text-xs text-gray-600">Usado para receber o link de "esqueci minha senha".</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">
              Senha {editandoId ? "(deixe em branco para manter)" : "*"}
            </label>
            <input
              required={!editandoId}
              type="password"
              minLength={6}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">Perfil *</label>
            <select
              value={form.perfil}
              onChange={(e) => setForm({ ...form, perfil: e.target.value as PerfilUsuario })}
              className={inputClasses}
            >
              <option value={PerfilUsuario.ATENDENTE}>Atendente</option>
              <option value={PerfilUsuario.ADMIN}>Administrador</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={salvar.isPending}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {salvar.isPending ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
                  Carregando...
                </td>
              </tr>
            )}
            {usuarios?.map((u) => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-gray-200">{u.nome}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.perfil === PerfilUsuario.ADMIN ? "Administrador" : "Atendente"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      u.ativo ? "bg-emerald-500/15 text-emerald-300" : "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => iniciarEdicao(u)} className="mr-3 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                    Editar
                  </button>
                  {u.ativo && u.id !== usuarioLogado?.id && (
                    <button onClick={() => remover.mutate(u.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                      Inativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
