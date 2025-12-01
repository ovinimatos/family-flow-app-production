'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowRight } from 'lucide-react'; // Ícones

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login e Cadastro
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // CADASTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: email.split('@')[0] } } // Salva parte do email como nome
        });
        if (error) throw error;
        setMessage('Conta criada! Você já pode entrar.');
        setIsSignUp(false); // Volta para tela de login
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-red-200">
            F
          </div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">FamilyFlow</h1>
          <p className="text-secondary text-sm mt-2">Controle financeiro com inteligência.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-lg border-b-2 border-gray-200 focus:border-brand py-3 outline-none bg-transparent placeholder-gray-300 transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-lg border-b-2 border-gray-200 focus:border-brand py-3 outline-none bg-transparent placeholder-gray-300 transition-colors"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p className={`text-xs text-center p-2 rounded ${message.includes('criada') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brandHover text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            className="text-sm text-secondary font-medium hover:text-dark transition-colors"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}