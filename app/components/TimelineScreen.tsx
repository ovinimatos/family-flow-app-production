'use client';
import { useState, useEffect, useRef } from 'react';
import { useTransactions } from '../context/TransactionsContext';
import MonthCelebration from './MonthCelebration';
import FamilySettings from './FamilySettings';
import { ChevronLeft, ChevronRight, Check, Clock, RotateCw, Calendar, TrendingUp, Settings } from 'lucide-react';

export default function TimelineScreen() {
  const { transactions, updateTransaction, loading, setTransactionToEdit } = useTransactions();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [progressWidth, setProgressWidth] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const isUserAction = useRef(false);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setShowCelebration(false);
  };

  const viewMonth = currentDate.getMonth();
  const viewYear = currentDate.getFullYear();
  
  // --- LÓGICA DE ORDENAÇÃO ESTÁVEL (FIX) ---
  const monthTransactions = transactions
    .filter(t => {
      const tDate = new Date(t.date + 'T12:00:00');
      return tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear;
    })
    .sort((a, b) => {
      // 1. Critério: Data
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      
      // 2. Critério de Desempate: ID (Garante estabilidade total)
      return a.id.localeCompare(b.id);
    });

  const realized = monthTransactions.reduce((acc, t) => t.status === 'paid' ? acc + Number(t.amount) : acc, 0);
  const planned = monthTransactions.reduce((acc, t) => t.status === 'pending' ? acc + Number(t.amount) : acc, 0);
  const totalMonth = realized + planned;

  useEffect(() => {
    const percentage = totalMonth === 0 ? 0 : (realized / totalMonth) * 100;
    const timer = setTimeout(() => setProgressWidth(percentage), 100);

    if (percentage >= 99.9 && totalMonth > 0 && isUserAction.current && !showCelebration) {
        setShowCelebration(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 100, 50, 200]);
        const hideTimer = setTimeout(() => { setShowCelebration(false); isUserAction.current = false; }, 5000);
        return () => clearTimeout(hideTimer);
    }
    return () => clearTimeout(timer);
  }, [realized, totalMonth]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
  const formatMonth = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Estilos de Urgência da Data
  const getDateStyles = (dateStr: string, status: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const itemDate = new Date(dateStr + 'T12:00:00');
    
    let base = "font-black text-xl tracking-tighter"; 
    if (itemDate < today && status === 'pending') return `${base} text-brand`; 
    if (itemDate.getTime() === today.getTime() && status === 'pending') return `${base} text-orange-500`;
    return `${base} text-gray-700`; 
  };

  const quickToggle = (e: React.MouseEvent, t: any) => {
    e.stopPropagation();
    isUserAction.current = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    const newStatus = t.status === 'pending' ? 'paid' : 'pending';
    updateTransaction(t.id, { status: newStatus });
  };

  const handleCardClick = (t: any) => setTransactionToEdit(t);

  if (loading && transactions.length === 0) return <div className="p-8 text-center text-gray-400 animate-pulse font-medium">Sincronizando...</div>;

  return (
    <div className="pb-32 animate-fade-in min-h-screen bg-[#F8F9FA]">
      
      {showCelebration && <MonthCelebration />}
      {showSettings && <FamilySettings onClose={() => setShowSettings(false)} />}

      <style jsx global>{`
        @keyframes spring-check { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.4); } 100% { transform: scale(1); opacity: 1; } }
        .icon-spring { animation: spring-check 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .metallic-green { background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%); box-shadow: 0 0 15px rgba(16, 185, 129, 0.6), inset 0 0 10px rgba(255,255,255,0.4); }
        .progress-gradient { background: linear-gradient(90deg, #FF385C 0%, #E91E63 100%); box-shadow: 0 0 10px rgba(255, 56, 92, 0.3); }
        .success-gradient { background: linear-gradient(90deg, #10B981 0%, #059669 100%); box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
      `}</style>

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 shadow-sm transition-all rounded-b-[2rem]">
        <div className="absolute right-6 top-5 z-30">
            <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-50 text-gray-400 hover:text-dark hover:bg-gray-200 rounded-full transition-all shadow-sm active:scale-95"><Settings size={20} /></button>
        </div>
        <div className="pt-4 pb-2 flex justify-center">
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 pl-4 pr-1 shadow-sm">
            <span className="text-sm font-bold text-dark capitalize mr-3 flex items-center gap-2"><Calendar size={14} className="text-brand mb-0.5" />{formatMonth(currentDate)}</span>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-dark transition-all"><ChevronLeft size={16} /></button>
              <button onClick={() => changeMonth(1)} className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-dark transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-2">
          <div className="flex justify-between items-end mb-3">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pago</p><h2 className="text-3xl font-extrabold text-dark tracking-tighter tabular-nums leading-none">{formatCurrency(realized)}</h2></div>
            <div className="text-right pb-0.5"><p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">A Pagar</p><h3 className="text-lg font-bold text-gray-400 tabular-nums leading-none">{formatCurrency(planned)}</h3></div>
          </div>
          <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-100">
            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressWidth >= 99.9 ? 'success-gradient' : 'progress-gradient'}`} style={{ width: `${progressWidth}%` }}><div className="absolute right-0 top-0 h-full w-3 bg-white/30 blur-[3px]"></div></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-[10px] font-bold transition-all duration-500 ${progressWidth >= 99.9 ? 'text-green-600 scale-105 origin-left' : 'text-brand'}`}>{progressWidth >= 99.9 ? 'Mês Quitado! 🎉' : `${Math.round(progressWidth)}% pago`}</span>
            <span className="text-[10px] font-bold text-gray-300">Total: {formatCurrency(totalMonth)}</span>
          </div>
        </div>
      </header>

      {/* LISTA */}
      <main className="max-w-xl mx-auto px-4 mt-6 space-y-3">
        {monthTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center opacity-40">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-100"><TrendingUp size={32} className="text-gray-300" /></div>
            <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wide">Sem movimentos</h3>
          </div>
        ) : (
          monthTransactions.map((t) => {
            const isPending = t.status === 'pending';
            const tDate = new Date(t.date + 'T12:00:00');
            const day = tDate.getDate();
            const wDay = tDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const dateStyle = getDateStyles(t.date, t.status);

            return (
              <div key={t.id} className={`group relative w-full rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border flex overflow-hidden transition-all duration-500 ${isPending ? 'bg-white border-white' : 'bg-[#F9FAFB] border-transparent opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0'}`}>
                
                {/* LADO ESQUERDO */}
                <div onClick={(e) => quickToggle(e, t)} className="w-[4.5rem] flex items-center justify-center cursor-pointer transition-colors duration-300 border-r border-gray-50/50">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isPending ? 'border-brand/40 bg-white text-transparent hover:border-brand' : 'border-green-500 bg-green-500 text-white scale-100 shadow-sm'}`}>
                    {!isPending && <Check size={16} strokeWidth={3} className="icon-spring" />}
                  </div>
                </div>

                {/* CONTEÚDO */}
                <div onClick={() => handleCardClick(t)} className="flex-1 py-4 px-5 flex justify-between items-center cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Data com Peso Visual */}
                    <div className="flex flex-col items-center w-8">
                      <span className={dateStyle}>{day}</span>
                      <span className="text-[9px] font-bold text-gray-300 uppercase mt-0.5">{wDay}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className={`font-semibold text-[15px] leading-tight transition-all ${isPending ? 'text-gray-900' : 'text-gray-400'}`}>{t.description}</p>
                      <div className="flex items-center gap-2 text-gray-400 mt-0.5">
                        {t.recurrence_id && <RotateCw size={11} className="text-brand" />}
                        <span className="text-[10px] font-medium flex items-center gap-1 opacity-70">
                          {t.category} 
                          {t.paid_by && <span>• {t.paid_by}</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={`text-[15px] font-bold tabular-nums tracking-tight transition-colors ${isPending ? 'text-dark' : 'text-gray-400'}`}>{formatCurrency(Number(t.amount))}</p>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}