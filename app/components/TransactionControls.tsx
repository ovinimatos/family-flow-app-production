'use client';
import { useState, useRef, useEffect } from 'react';
import { useTransactions } from '../context/TransactionsContext';
import { useVoiceInput } from '../hooks/useVoiceInput';
import ImmersiveLoader from './ImmersiveLoader'; 
import { Plus, Mic, X, Check, Calendar, User, DollarSign, Trash2, AlertTriangle, RefreshCcw, Coins } from 'lucide-react';

const CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

export default function TransactionControls() {
  const { addTransaction, updateTransaction, deleteTransaction, deleteRecurrenceSeries, transactionToEdit, setTransactionToEdit } = useTransactions();
  const { isListening, startListening } = useVoiceInput();
  
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [modalType, setModalType] = useState<'real' | 'planned' | 'edit' | null>(null);
  
  const [isFullLoading, setIsFullLoading] = useState(false); 
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Outros');
  const [payer, setPayer] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [currentId, setCurrentId] = useState('');
  const [currentRecurrenceId, setCurrentRecurrenceId] = useState<string | undefined>(undefined);

  const descInputRef = useRef<HTMLInputElement>(null);

  // --- PREENCHE O MODAL SE FOR EDIÇÃO ---
  useEffect(() => {
    if (transactionToEdit) {
      setModalType('edit');
      setAmount(Math.abs(transactionToEdit.amount).toString());
      setDesc(transactionToEdit.description);
      setDate(transactionToEdit.date);
      setCategory(transactionToEdit.category || 'Outros');
      setPayer(transactionToEdit.paid_by || '');
      setCurrentId(transactionToEdit.id);
      setCurrentRecurrenceId(transactionToEdit.recurrence_id);
      setRecurrence('none');
      setShowDeleteMenu(false);
    }
  }, [transactionToEdit]);

  const closeModal = () => {
    setModalType(null);
    setTransactionToEdit(null);
    setSheetOpen(false);
    setShowDeleteMenu(false);
  };

  const handleVoice = () => {
    startListening((text) => {
      const amountMatch = text.match(/\d+([.,]\d+)?/);
      const val = amountMatch ? amountMatch[0].replace(',', '.') : '';
      let description = text.replace(amountMatch ? amountMatch[0] : '', '').replace(/reais|real/gi, '').trim();
      description = description.charAt(0).toUpperCase() + description.slice(1);
      const isFuture = ['amanhã', 'mês', 'janeiro', 'fevereiro', 'março', 'abril', 'dia', 'agendar'].some(k => text.toLowerCase().includes(k));
      setAmount(val); setDesc(description || 'Voz');
      if (isFuture) {
        setModalType('planned');
        if(text.toLowerCase().includes('amanhã')) { const d = new Date(); d.setDate(d.getDate() + 1); setDate(d.toISOString().split('T')[0]); }
        else setDate(new Date().toISOString().split('T')[0]);
      } else { 
        setModalType('real'); 
        setDate(new Date().toISOString().split('T')[0]);
      }
    });
  };

  const openNewModal = (type: 'real' | 'planned') => {
    setSheetOpen(false); setModalType(type);
    setAmount(''); setDesc(''); setCategory('Outros'); setRecurrence('none');
    if (type === 'real') { setDate(new Date().toISOString().split('T')[0]); setPayer(localStorage.getItem('familyFlowUser') || ''); } 
    else { setPayer(''); setDate(new Date().toISOString().split('T')[0]); }
    setTimeout(() => descInputRef.current?.focus(), 100);
  };

  // --- FUNÇÃO AUXILIAR DE CÁLCULO DE DATA ---
  const addMonthsToDate = (baseDateStr: string, monthsToAdd: number): string => {
    // 1. Extrai partes da string (YYYY-MM-DD) para evitar timezone
    const [yStr, mStr, dStr] = baseDateStr.split('-');
    const originalYear = parseInt(yStr);
    const originalMonth = parseInt(mStr); // 1-12
    const originalDay = parseInt(dStr);

    // 2. Calcula novo mês e ano
    let targetYear = originalYear + Math.floor((originalMonth - 1 + monthsToAdd) / 12);
    let targetMonth = ((originalMonth - 1 + monthsToAdd) % 12) + 1;

    // 3. Descobre quantos dias tem no mês de destino
    // new Date(ano, mês, 0) retorna o último dia do mês ANTERIOR ao índice.
    // Como targetMonth é 1-based, usá-lo direto pega o último dia do mês atual.
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();

    // 4. Clamping: Se dia original > dias no mês, usa o último dia do mês
    const targetDay = Math.min(originalDay, daysInTargetMonth);

    // 5. Formata
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!amount || !desc) return alert("Preencha valor e descrição");
    
    const isHeavyOperation = recurrence !== 'none';
    if (isHeavyOperation) setIsFullLoading(true); else setIsButtonLoading(true);

    try {
        const val = parseFloat(amount);
        const finalPayer = modalType === 'real' ? (payer || localStorage.getItem('familyFlowUser') || 'Eu') : payer;
        if (modalType === 'real' && payer) localStorage.setItem('familyFlowUser', payer);

        const txData = {
            amount: -Math.abs(val), 
            description: desc, 
            category, 
            paid_by: finalPayer, 
            date: date,
            status: (modalType === 'real' || (modalType === 'edit' && transactionToEdit?.status === 'paid')) ? 'paid' : 'pending' as 'paid'|'pending'
        };

        if (modalType === 'edit') {
            await updateTransaction(currentId, txData);
            // Se o usuário selecionou gerar recorrência na edição, gera FUTURAS
            if (recurrence !== 'none') await generateRecurrence(txData, recurrence);
        } else {
            if (modalType === 'planned' && recurrence !== 'none') {
                // Ao criar novo, gera a série
                await generateRecurrence(txData, recurrence);
            } else {
                await addTransaction(txData);
            }
        }
        
        if (isHeavyOperation) await new Promise(r => setTimeout(r, 2000));
        closeModal();
    } catch (error) { alert("Erro ao salvar"); } finally { setIsFullLoading(false); setIsButtonLoading(false); }
  };

  const generateRecurrence = async (baseTx: any, mode: string) => {
    // Se for 'planned', a baseTx já é o primeiro item. Se for 'monthly', geramos +11 cópias.
    // Se for 'edit', a baseTx é o item editado, geramos +11 ou +1 novos itens FUTUROS.
    
    const loops = mode === 'monthly' ? 12 : 2; 
    const rId = crypto.randomUUID();

    // Se estamos CRIANDO (não editando), o primeiro item já foi considerado no loop?
    // Estratégia: Salvar o primeiro item com o rId e depois gerar os loops-1 seguintes?
    // Melhor: No caso de Create Novo, iteramos de 0 até loops-1.
    // O item 0 é a data original. Os itens > 0 são futuros.
    
    // OBS: Se for Edição, normalmente queremos criar recorrências A PARTIR da data editada.
    
    // Loop começa em 0.
    // Se for CREATE NOVO: O item i=0 é a própria data selecionada.
    // Se for EDIT: O item i=0 seria o item atual (já salvo no updateTransaction).
    // Então, no EDIT, começamos o loop em 1. No CREATE, começamos em 0.
    
    const startIdx = modalType === 'edit' ? 1 : 0;

    for(let i = startIdx; i < (startIdx + loops); i++) {
        let nextDate = baseTx.date;
        
        if (i > 0) {
            if (mode === 'monthly') {
                nextDate = addMonthsToDate(baseTx.date, i);
            } else if (mode === 'yearly') {
                // Lógica simples de ano + i
                const [y, m, d] = baseTx.date.split('-');
                nextDate = `${parseInt(y) + i}-${m}-${d}`;
            }
        }

        // Se for CREATE e i=0, é o primeiro registro. Se i>0 é cópia.
        // Se for EDIT e i>0, são novos registros.
        // Em ambos os casos, chamamos addTransaction (no Create, o primeiro addTransaction foi substituído por este loop)
        
        // Pequena correção: Se for EDIT, o updateTransaction JÁ salvou o item atual, mas sem recurrence_id.
        // Seria ideal atualizar o item atual com o recurrence_id também, mas vamos focar em gerar os futuros corretamente.
        
        await addTransaction({ 
            ...baseTx, 
            date: nextDate, 
            recurrence_id: rId 
        });
    }
  }

  const handleDelete = async (mode: 'single' | 'all') => {
    setIsButtonLoading(true);
    if (mode === 'all' && currentRecurrenceId) await deleteRecurrenceSeries(currentRecurrenceId);
    else await deleteTransaction(currentId);
    setIsButtonLoading(false);
    closeModal();
  };

  const renderChips = (current: string, setFunc: (v: string) => void) => (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {CATEGORIES.map(c => (
        <button key={c} onClick={() => setFunc(c)} className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 active:scale-95 ${category === c ? 'bg-brand text-white border-brand shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700'}`}>{c}</button>
      ))}
    </div>
  );

  return (
    <>
      {isFullLoading && <ImmersiveLoader />}
      
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <button onClick={handleVoice} className="w-12 h-12 bg-dark hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95"><Mic size={20} /></button>
        <button onClick={() => setSheetOpen(true)} className="w-14 h-14 bg-brand hover:bg-brandHover text-white rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-95"><Plus size={28} /></button>
      </div>

      {isListening && <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center text-white backdrop-blur-sm"><div className="animate-bounce mb-4"><Mic size={48} /></div><h2 className="text-xl font-bold">Ouvindo...</h2><p className="text-sm opacity-70 mt-2">Diga: &quot;Mercado 50 reais&quot;</p></div>}
      
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSheetOpen(false)}></div>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl p-6 z-50 animate-slide-up shadow-2xl pb-10 transition-colors">
            <h3 className="text-center font-bold text-gray-400 text-xs uppercase mb-6 tracking-widest">Novo Lançamento</h3>
            <button onClick={() => openNewModal('real')} className="w-full bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-4 mb-3 active:scale-[0.98] transition-transform"><div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><DollarSign size={20} /></div><div><h4 className="font-bold text-dark dark:text-white text-left">Gasto Realizado</h4><p className="text-xs text-secondary dark:text-gray-400 text-left">Já paguei</p></div></button>
            <button onClick={() => openNewModal('planned')} className="w-full bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-4 active:scale-[0.98] transition-transform"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Calendar size={20} /></div><div><h4 className="font-bold text-dark dark:text-white text-left">Planejar Futuro</h4><p className="text-xs text-secondary dark:text-gray-400 text-left">Vou pagar</p></div></button>
          </div>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isFullLoading && closeModal()}></div>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-50 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">{modalType === 'edit' ? 'Editar Lançamento' : (modalType === 'real' ? 'Gasto Realizado' : 'Planejamento')}</h3>
              <div className="flex gap-2">
                {modalType === 'edit' && !showDeleteMenu && <button onClick={() => setShowDeleteMenu(true)} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>}
                {!isFullLoading && <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-zinc-800 dark:text-white rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></button>}
              </div>
            </div>

            {showDeleteMenu && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 animate-fade-in">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-3 justify-center"><AlertTriangle size={18} /><span className="text-sm font-bold">Excluir lançamento?</span></div>
                    {currentRecurrenceId ? (
                        <div className="flex gap-2"><button onClick={() => handleDelete('single')} disabled={isButtonLoading} className="flex-1 py-3 bg-white dark:bg-zinc-800 text-dark dark:text-white text-xs font-bold rounded-lg border border-red-100 dark:border-zinc-700 shadow-sm">Só este</button><button onClick={() => handleDelete('all')} disabled={isButtonLoading} className="flex-1 py-3 bg-red-500 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-transform">Todos</button></div>
                    ) : (
                        <button onClick={() => handleDelete('single')} disabled={isButtonLoading} className="w-full py-3 bg-red-500 text-white text-sm font-bold rounded-lg shadow-md active:scale-95 transition-transform">Sim, excluir</button>
                    )}
                    <button onClick={() => setShowDeleteMenu(false)} className="w-full mt-3 text-xs text-red-400 font-medium underline">Cancelar</button>
                </div>
            )}

            {!showDeleteMenu && (
                <div className="space-y-5">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg border border-gray-100 dark:border-zinc-700 focus-within:border-brand transition-colors"><User size={16} className="text-gray-400" /><input type="text" value={payer} onChange={e => setPayer(e.target.value)} placeholder="Responsável (Opcional)" className="bg-transparent outline-none text-sm w-full font-medium text-dark dark:text-white placeholder-gray-400" /></div>
                <div className="flex gap-4"><div className="w-1/3"><label className="text-[10px] font-bold text-gray-400 uppercase">Valor</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-2 outline-none font-bold text-lg bg-transparent text-dark dark:text-white transition-colors" placeholder="0.00" /></div><div className="w-2/3"><label className="text-[10px] font-bold text-gray-400 uppercase">Descrição</label><input ref={descInputRef} type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-2 outline-none text-lg bg-transparent text-dark dark:text-white transition-colors" placeholder="Ex: Mercado" /></div></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Data</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand py-2 outline-none bg-transparent text-dark dark:text-white transition-colors" /></div>
                <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Categoria</label>{renderChips(category, setCategory)}</div>
                {(modalType === 'planned' || modalType === 'edit') && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-3"><RefreshCcw size={18} className="text-blue-500" /><div className="flex-1"><label className="text-[10px] font-bold text-blue-500 uppercase block mb-1">Repetição Automática</label><select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-900 rounded p-2 text-sm text-dark dark:text-white outline-none"><option value="none">Não repetir</option><option value="monthly">Mensalmente (Próximos 12)</option><option value="yearly">Anualmente (Próximos 2)</option></select></div></div>
                )}
                <button onClick={handleSave} disabled={isButtonLoading || isFullLoading} className="w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 bg-dark hover:bg-black text-white active:scale-95">{isButtonLoading ? <Coins size={18} className="animate-spin" /> : <Check size={18} />}<span>{isButtonLoading ? 'Salvando...' : (modalType === 'edit' ? 'Salvar Alterações' : 'Salvar Lançamento')}</span></button>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}