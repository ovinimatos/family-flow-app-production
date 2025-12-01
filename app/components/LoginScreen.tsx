'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowRight, User } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Novo campo
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error("Por favor, digite seu nome.");

        // 1. Criar Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { display_name: name } // Metadata inicial
          }
        });
        if (authError) throw authError;

        // 2. Atualizar Tabela de Perfil (Garantia)
        if (authData.user) {
            await supabase.from('profiles').update({ display_name: name }).eq('id', authData.user.id);
        }

        setMessage('Conta criada com sucesso! Verifique se entrou automaticamente.');
        // O AuthContext vai detectar o login e redirecionar para o Onboarding
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
      setLoading(false); // Só para loading se der erro, se der sucesso o app recarrega
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 px-6 transition-colors">
      <div className="w-full max-w-sm animate-fade-in">
        
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-brand rounded-2xl rotate-3 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-brand/30">
            F
          </div>
          <h1 className="text-3xl font-black text-dark dark:text-white tracking-tight">FamilyFlow</h1>
          <p className="text-secondary dark:text-gray-400 text-sm mt-2">Gestão financeira compartilhada.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campo Nome (Só no Cadastro) */}
          {isSignUp && (
             <div className="animate-slide-up">
                <div className="relative">
                    <User className="absolute left-0 top-3.5 text-gray-400" size={20} />
                    <input
                    type="text"
                    placeholder="Seu Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-lg border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-3 pl-8 outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600 text-dark dark:text-white transition-colors"
                    required={isSignUp}
                    />
                </div>
             </div>
          )}

          <div className="relative">
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-lg border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-3 outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600 text-dark dark:text-white transition-colors"
              required
            />
          </div>
          
          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-lg border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-3 outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600 text-dark dark:text-white transition-colors"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p className={`text-xs text-center p-3 rounded-lg font-medium ${message.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brandHover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-8"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Criar Conta Grátis' : 'Entrar')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            className="text-sm text-secondary dark:text-gray-400 font-medium hover:text-dark dark:hover:text-white transition-colors"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Novo por aqui? Criar conta'}
          </button>
        </div>
      </div>
    </div>
  );
}