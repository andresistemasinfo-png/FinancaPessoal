import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserPlus, Mail, Lock, AlertCircle, CheckCircle2, Info, Users as UsersIcon, Shield, User } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, supabase } from '../lib/supabase';

// Criamos um cliente secundário do Supabase com persistSession: false
// Isso garante que ao criar um novo usuário, a sessão do usuário atual (admin) não seja desconectada.
const supabaseSecondary = createClient(supabaseUrl, supabaseAnonKey || 'missing-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface Usuario {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export function Usuarios() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [tableError, setTableError] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    setTableError(false);
    try {
      const { data, error } = await supabase.from('usuarios').select('*').order('email');
      if (error) {
        throw error;
      }
      setUsuarios(data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setTableError(true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabaseSecondary.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Se a tabela existir, insere o novo usuário nela
      if (authData.user && !tableError) {
        const { error: insertError } = await supabase.from('usuarios').insert({
          id: authData.user.id,
          email: authData.user.email,
          role: 'user'
        });
        
        if (!insertError) {
          fetchUsuarios();
        }
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário. Verifique se o e-mail já está em uso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase.from('usuarios').update({ role: newRole }).eq('id', id);
      if (error) throw error;
      
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
      alert('Erro ao atualizar permissão do usuário.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulário de Criação */}
        <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 h-fit">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <UserPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">Novo Usuário</h2>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="ml-2 text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-md">
                <div className="flex">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="ml-2 text-xs text-green-700">
                    Usuário criado com sucesso!
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-emerald-900 mb-1">
                E-mail
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-emerald-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-9 sm:text-sm border-gray-300 rounded-lg py-2 px-3 border outline-none transition-colors"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-900 mb-1">
                Senha
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-emerald-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-9 sm:text-sm border-gray-300 rounded-lg py-2 px-3 border outline-none transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Usuário
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UsersIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-900">Usuários Cadastrados</h2>
                <p className="text-sm text-emerald-600">Gerencie as permissões de acesso</p>
              </div>
            </div>
          </div>

          {tableError ? (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Configuração Necessária no Supabase</h3>
                  <div className="mt-2 text-sm text-amber-700 space-y-2">
                    <p>Para visualizar e gerenciar as permissões dos usuários, você precisa criar uma tabela chamada <strong>usuarios</strong> no seu banco de dados Supabase.</p>
                    <p>Execute o seguinte código SQL no SQL Editor do Supabase:</p>
                    <pre className="bg-amber-100 p-2 rounded text-xs overflow-x-auto mt-2 text-amber-900">
{`create table public.usuarios (
  id uuid references auth.users not null primary key,
  email text not null,
  role text not null default 'user'
);

-- Habilitar RLS (opcional mas recomendado)
alter table public.usuarios enable row level security;

-- Criar política para permitir leitura e atualização
create policy "Permitir acesso total aos usuarios" 
on public.usuarios for all using (true);`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : loadingUsers ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 bg-emerald-50/50 rounded-xl border border-emerald-100 border-dashed">
              <UsersIcon className="mx-auto h-12 w-12 text-emerald-300 mb-3" />
              <p className="text-emerald-600 font-medium">Nenhum usuário encontrado na tabela.</p>
              <p className="text-sm text-emerald-500 mt-1">Os usuários criados aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-emerald-100">
              <table className="min-w-full divide-y divide-emerald-100">
                <thead className="bg-emerald-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Permissão
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-50">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="text-emerald-700 font-medium text-sm">
                              {usuario.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{usuario.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <select
                            value={usuario.role}
                            onChange={(e) => handleRoleChange(usuario.id, e.target.value as 'admin' | 'user')}
                            className="block w-32 pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                          >
                            <option value="user">Usuário Comum</option>
                            <option value="admin">Administrador</option>
                          </select>
                          {usuario.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
