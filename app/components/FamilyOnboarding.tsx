'use client';
import { useState } from 'react';
import { useTransactions } from '../context/TransactionsContext';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, Loader2, LogIn, Home, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function FamilyOnboarding() {
  const { user, signOut } = useAuth();
  const { checkFamilyStatus, joinFamilyByCode } = useTransactions(); // Certifique-se que joinFamilyByCode está no contexto
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Create State
  const [familyName, setFamilyName] = useState(`Casa de ${user?.user_metadata?.display_name || user?.email?.split('@')[0]}`);
  
  // Join State
  const [inviteCode, setInviteCode] = useState('');
  const [previewData, setPreviewData] = useState<{ id: string; name: string; members: { name: string }[] } | null>(null);

  // --- AÇÃO: CRIAR ---
  const handleCreate = async () => {
    if(!familyName.trim()) return;
    setLoading(true);
    try {
        // 1. Cria Família
        const { data: family, error: famError } = await supabase.from('families').insert({ name: familyName, created_by: user?.id }).select().single();
        if(famError) throw famError;
        
        // 2. Entra nela como Admin
        const { error: linkError } = await supabase.from('family_members').insert({ family_id: family.id, profile_id: user?.id, role: 'admin' });
        if(linkError) throw linkError;

        // 3. Atualiza App
        await checkFamilyStatus();
    } catch(e:any) { setErrorMsg(e.message); } finally { setLoading(false); }
  };

  // --- AÇÃO: BUSCAR (Passo 1) ---
  const handleSearch = async () => {
    if (!inviteCode) return;
    setLoading(true);
    setErrorMsg('');
    try {
        // Chama a RPC segura que criamos antes
        const { data, error } = await supabase.rpc('get_family_preview', { invite_code_input: inviteCode.trim() });
        
        if (error || !data) throw new Error("Código inválido ou família não encontrada.");
        
        setPreviewData(data); // { id, name, members: [{name: 'João'}] }
        setStep('preview');
    } catch (e: any) {
        setErrorMsg("Não encontramos nenhuma família com este código.");
    } finally {
        setLoading(false);
    }
  };

  // --- AÇÃO: CONFIRMAR ENTRADA (Passo 2) ---
  const handleJoin = async () => {
    if (!previewData) return;
    setLoading(true);
    // Usa a função do contexto que já lida com o refresh
    const success = await joinFamilyByCode(inviteCode.trim());
    if (!success) setErrorMsg("Erro ao entrar. Tente novamente.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 animate-fade-in relative">
      
      <button onClick={() => signOut()} className="absolute top-6 right-6 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">Sair / Trocar Conta</button>

      <div className="w-full max-w-sm">
        
        {/* HEADER COM ANIMAÇÃO DE TROCA */}
        <div className="text-center mb-10 transition-all duration-500">
            <div className={`w-20 h-20 rounded-3xl rotate-3 flex items-center justify-center mb-6 shadow-xl shadow-brand/10 mx-auto transition-colors duration-300 ${mode === 'create' ? 'bg-brand text-white' : 'bg-dark text-white'}`}>
                {mode === 'create' ? <Home size={36} /> : <Users size={36} />}
            </div>
            <h1 className="text-2xl font-black text-dark mb-2 tracking-tight">
                {mode === 'create' ? 'Fundar Família' : 'Juntar-se à Família'}
            </h1>
            <p className="text-secondary text-sm mx-auto max-w-[280px] leading-relaxed">
                {mode === 'create' 
                    ? 'Você será o administrador e poderá convidar membros via código.' 
                    : 'Insira o código compartilhado por alguém da sua família.'}
            </p>
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600 font-bold animate-fade-in">
                <AlertCircle size={16} /> {errorMsg}
            </div>
        )}

        {/* --- FORMULÁRIOS --- */}
        
        {/* MODO: CREATE */}
        {mode === 'create' && (
            <div className="space-y-6 animate-slide-up">
                <div className="group bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 transition-all duration-300">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 group-focus-within:text-brand transition-colors">Nome do Grupo</label>
                    <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="w-full text-lg font-bold bg-transparent outline-none text-dark placeholder-gray-300" autoFocus />
                </div>
                <button onClick={handleCreate} disabled={loading} className="w-full bg-brand hover:bg-brandHover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:scale-100">
                    {loading ? <Loader2 className="animate-spin" /> : 'Criar Espaço'} {!loading && <ArrowRight size={18} />}
                </button>
            </div>
        )}

        {/* MODO: JOIN - PASSO 1 (INPUT) */}
        {mode === 'join' && step === 'input' && (
            <div className="space-y-6 animate-slide-up">
                <div className="group bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-dark focus-within:ring-4 focus-within:ring-gray-200 transition-all duration-300">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 group-focus-within:text-dark transition-colors">Código de Convite</label>
                    <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Ex: 8f3a21" className="w-full text-lg font-bold bg-transparent outline-none text-dark placeholder-gray-300 uppercase tracking-widest" autoFocus />
                </div>
                <button onClick={handleSearch} disabled={loading || inviteCode.length < 3} className="w-full bg-dark hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:scale-100">
                    {loading ? <Loader2 className="animate-spin" /> : 'Buscar Família'} {!loading && <Search size={18} />}
                </button>
            </div>
        )}

        {/* MODO: JOIN - PASSO 2 (PREVIEW) */}
        {mode === 'join' && step === 'preview' && previewData && (
            <div className="space-y-6 animate-slide-up">
                {/* Card Preview */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xl shadow-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand to-purple-500"></div>
                    
                    <h3 className="text-xl font-black text-dark mb-1">{previewData.name}</h3>
                    <p className="text-xs text-gray-400 mb-6">Futuros membros da casa:</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                        {previewData.members?.map((m, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                <div className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">{m.name.charAt(0).toUpperCase()}</div>
                                <span className="text-xs font-bold text-gray-600">{m.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-green-600 bg-green-50 p-2 rounded-lg">
                        <CheckCircle size={12} /> <span>Código válido e verificado.</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => { setStep('input'); setPreviewData(null); }} className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors">Voltar</button>
                    <button onClick={handleJoin} disabled={loading} className="flex-[2] bg-brand hover:bg-brandHover text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                        {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Entrada'}
                    </button>
                </div>
            </div>
        )}

        {/* BOTÃO TOGGLE (Rodapé) */}
        {step === 'input' && (
            <div className="pt-8 text-center border-t border-gray-100 mt-8">
                <button onClick={() => { setMode(mode === 'create' ? 'join' : 'create'); setErrorMsg(''); }} className="text-sm font-bold text-gray-400 hover:text-brand transition-colors">
                    {mode === 'create' ? 'Tenho um código de convite' : 'Quero criar um novo grupo'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}