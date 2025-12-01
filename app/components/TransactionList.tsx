'use client';
import { useTransactions } from '../context/TransactionsContext';
import { Check, RotateCw, TrendingUp } from 'lucide-react';

// Recebe os dados já filtrados da página principal
export default function TransactionList({ monthTransactions }: { monthTransactions: any[] }) {
  const { updateTransaction, setTransactionToEdit } = useTransactions();

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));

  // Lógica de Data (Urgência)
  const getDateStyles = (dateStr: string, status: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    // Parse seguro YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    const itemDate = new Date(y, m - 1, d);
    
    let base = "font-black text-xl tracking-tighter"; 
    if (itemDate < today && status === 'pending') return `${base} text-brand`; 
    if (itemDate.getTime() === today.getTime() && status === 'pending') return `${base} text-orange-500`;
    return `${base} text-gray-700`; 
  };

  const quickToggle = (e: React.MouseEvent, t: any) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    const newStatus = t.status === 'pending' ? 'paid' : 'pending';
    updateTransaction(t.id, { status: newStatus });
  };

  const handleCardClick = (t: any) => setTransactionToEdit(t);

  return (
    <div className="pb-32 px-4 space-y-3 min-h-screen">
      
      {/* ANIMAÇÃO SPRING */}
      <style jsx global>{`
        @keyframes spring-check { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.4); } 100% { transform: scale(1); opacity: 1; } }
        .icon-spring { animation: spring-check 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {monthTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-center opacity-40">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 border border-gray-100"><TrendingUp size={32} className="text-gray-300" /></div>
          <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wide">Sem movimentos</h3>
        </div>
      ) : (
        monthTransactions.map((t) => {
          const isPending = t.status === 'pending';
          const [y, m, d] = t.date.split('-').map(Number);
          const tDate = new Date(y, m - 1, d);
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
                  <div className="flex flex-col items-center w-8">
                    <span className={dateStyle}>{day}</span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase mt-0.5">{wDay}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className={`font-semibold text-[15px] leading-tight transition-all ${isPending ? 'text-gray-900' : 'text-gray-400'}`}>{t.description}</p>
                    <div className="flex items-center gap-2 text-gray-400 mt-0.5">
                      {t.recurrence_id && <RotateCw size={11} className="text-brand" />}
                      <span className="text-[10px] font-medium flex items-center gap-1 opacity-70">
                        {t.category} {t.paid_by && <span>• {t.paid_by}</span>}
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
    </div>
  );
}