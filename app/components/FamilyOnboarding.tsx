'use client';
import { useState } from 'react';
import { useTransactions } from '../context/TransactionsContext';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, Loader2, LogIn } from 'lucide-react';

export default function FamilyOnboarding() {
  const { user } = useAuth();
  const { checkFamilyStatus, joinFamilyByCode } = useTransactions();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  
  const [familyName, setFamilyName] = useState(`Família de ${user?.email?.split('@')[0] || ''}`);
  const [inviteCode, setInviteCode] = useState('');

  // Lógica de Criar (Mantida, mas simplificada aqui para focar no fluxo)
  const handleCreate = async () => {
    setLoading(true);
    // ... (Use a lógica anterior de criação automática via contexto se preferir, ou recrie aqui)
    // Para consistência com V15, chamamos uma função de refresh no final
    // Aqui vou simular a chamada que fizemos no TransactionsContext
    // OBS: Se você já tem o código de create no Context, use-o. Se não, mantenha o código local do componente anterior.
    // Vou usar uma abordagem direta aqui para garantir funcionamento:
    
    // (IMPORTANTE: Se você seguiu o passo 2, o contexto não tem 'createFamily' exposto diretamente, 
    // mas tem a lógica de 'checkFamilyStatus'. Vamos recriar a lógica de insert aqui ou adicionar no contexto.
    // Vamos adicionar no componente para ser rápido, igual ao V15)
    
    try {
        const { supabase } = await import('../lib/supabase');
        const { data: family, error } = await supabase.from('families').insert({ name: familyName, created_by: user?.id }).select().single();
        if(error) throw error;
        await supabase.from('family_members').insert({ family_id: family.id, profile_id: user?.id, role: 'admin' });
        await checkFamilyStatus();
    } catch(e:any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!inviteCode) return alert("Digite o código");
    setLoading(true);
    const success = await joinFamilyByCode(inviteCode.trim());
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 animate-fade-in">
      <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6 text-brand shadow-lg shadow-brand/10">
        {mode === 'create' ? <Users size={40} /> : <LogIn size={40} />}
      </div>
      
      <h1 className="text-2xl font-extrabold text-dark mb-2 text-center">
        {mode === 'create' ? 'Criar Família' : 'Entrar em Família'}
      </h1>
      <p className="text-secondary text-center mb-8 max-w-xs text-sm">
        {mode === 'create' ? 'Crie um novo espaço para gerenciar gastos.' : 'Digite o código recebido para participar.'}
      </p>

      <div className="w-full max-w-sm space-y-4">
        
        {mode === 'create' ? (
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Grupo</label>
                <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="w-full text-xl font-bold border-b-2 border-gray-200 focus:border-brand py-3 outline-none bg-transparent" />
            </div>
        ) : (
            <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Código de Convite</label>
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Ex: a1b2c3d" className="w-full text-xl font-bold border-b-2 border-gray-200 focus:border-brand py-3 outline-none bg-transparent uppercase tracking-widest" />
            </div>
        )}

        <button onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading} className="w-full bg-brand hover:bg-brandHover text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform">
          {loading ? <Loader2 className="animate-spin" /> : (mode === 'create' ? 'Começar' : 'Entrar')} 
          {!loading && <ArrowRight size={18} />}
        </button>

        <div className="pt-6 text-center">
            <button onClick={() => setMode(mode === 'create' ? 'join' : 'create')} className="text-sm font-medium text-gray-500 hover:text-brand transition-colors">
                {mode === 'create' ? 'Tenho um código de convite' : 'Quero criar uma nova família'}
            </button>
        </div>
      </div>
    </div>
  );
}