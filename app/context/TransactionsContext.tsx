'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Transaction = {
  id: string; description: string; amount: number; date: string;
  status: 'paid' | 'pending'; category: string; paid_by?: string;
  recurrence_id?: string; family_id: string;
};

export type Member = {
  profile_id: string;
  role: string;
  display_name: string;
  email: string;
};

type TransactionsContextType = {
  transactions: Transaction[];
  loading: boolean;
  hasFamily: boolean;
  currentFamilyId: string | null;
  familyName: string;
  inviteCode: string;
  members: Member[];
  
  transactionToEdit: Transaction | null;
  setTransactionToEdit: (t: Transaction | null) => void;

  checkFamilyStatus: () => Promise<void>;
  addTransaction: (t: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteRecurrenceSeries: (id: string) => Promise<void>;
  
  // Novas funções de gestão
  updateFamilyName: (name: string) => Promise<void>;
  removeMember: (profileId: string) => Promise<void>;
  joinFamilyByCode: (code: string) => Promise<boolean>;
  refresh: () => void;
};

const TransactionsContext = createContext<TransactionsContextType>({} as any);

export const TransactionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Family State
  const [hasFamily, setHasFamily] = useState(false);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const fetchData = async () => {
    if (!user) return;
    // Loading discreto se já tiver dados
    if (!hasFamily) setLoading(true); 

    try {
      // 1. Busca vínculo
      const { data: link } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (link) {
        setHasFamily(true);
        setCurrentFamilyId(link.family_id);

        // 2. Busca Detalhes da Família (Nome e Código)
        const { data: fam } = await supabase.from('families').select('name, invite_code').eq('id', link.family_id).single();
        if (fam) {
            setFamilyName(fam.name);
            setInviteCode(fam.invite_code);
        }

        // 3. Busca Membros (Join com Profiles)
        const { data: mems } = await supabase
            .from('family_members')
            .select('role, profile_id, profiles(display_name, email)')
            .eq('family_id', link.family_id);
        
        if (mems) {
            const formattedMembers = mems.map((m: any) => ({
                profile_id: m.profile_id,
                role: m.role,
                display_name: m.profiles?.display_name || 'Usuário',
                email: m.profiles?.email || ''
            }));
            setMembers(formattedMembers);
        }

        // 4. Busca Transações
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('family_id', link.family_id)
          .order('date', { ascending: true });
        if (txs) setTransactions(txs);

      } else {
        setHasFamily(false);
        setCurrentFamilyId(null);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  // --- CRUD TRANSACTIONS ---
  const addTransaction = async (t: Partial<Transaction>) => {
    if (!user || !currentFamilyId) return alert("Erro: Família não encontrada.");
    try {
      const { error } = await supabase.from('transactions').insert({ ...t, family_id: currentFamilyId, profile_id: user.id });
      if (error) throw error;
      fetchData();
    } catch (error: any) { alert("Erro: " + error.message); }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)); // Optimistic
    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (!error) fetchData();
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('transactions').delete().eq('id', id);
    fetchData();
  };

  const deleteRecurrenceSeries = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.recurrence_id !== id));
    await supabase.from('transactions').delete().eq('recurrence_id', id);
    fetchData();
  };

  // --- GESTÃO DE FAMÍLIA ---
  const updateFamilyName = async (name: string) => {
    if (!currentFamilyId) return;
    setFamilyName(name); // Optimistic
    await supabase.from('families').update({ name }).eq('id', currentFamilyId);
  };

  const removeMember = async (profileId: string) => {
    if (!currentFamilyId) return;
    // Não permite remover a si mesmo por aqui (segurança de UI)
    if (profileId === user?.id) return alert("Você não pode se remover. Use a opção Sair da Família.");
    
    setMembers(prev => prev.filter(m => m.profile_id !== profileId)); // Optimistic
    const { error } = await supabase.from('family_members').delete().match({ family_id: currentFamilyId, profile_id: profileId });
    if (error) { fetchData(); alert("Erro ao remover membro."); }
  };

  const joinFamilyByCode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    try {
        // 1. Achar família
        const { data: fam, error: fErr } = await supabase.from('families').select('id').eq('invite_code', code).single();
        if (fErr || !fam) throw new Error("Código inválido");

        // 2. Entrar
        const { error: joinErr } = await supabase.from('family_members').insert({ family_id: fam.id, profile_id: user.id, role: 'member' });
        if (joinErr) throw joinErr;

        await fetchData();
        return true;
    } catch (e) {
        alert("Não foi possível entrar: Código inválido ou você já é membro.");
        return false;
    }
  };

  return (
    <TransactionsContext.Provider value={{ 
      transactions, loading, hasFamily, currentFamilyId, 
      familyName, inviteCode, members,
      transactionToEdit, setTransactionToEdit, 
      checkFamilyStatus: fetchData, addTransaction, updateTransaction, deleteTransaction, deleteRecurrenceSeries, 
      updateFamilyName, removeMember, joinFamilyByCode, refresh: fetchData 
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionsContext);