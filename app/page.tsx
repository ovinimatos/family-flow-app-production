'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useTransactions } from './context/TransactionsContext';
import LoginScreen from './components/LoginScreen';
import TransactionList from './components/TransactionList';
import FamilyOnboarding from './components/FamilyOnboarding';
import DashboardSkeleton from './components/DashboardSkeleton';
import TransactionControls from './components/TransactionControls';
import FamilySettings from './components/FamilySettings';
import MonthCelebration from './components/MonthCelebration';
import { Loader2, ChevronLeft, ChevronRight, Settings, Check, TrendingUp, Calendar, List, BarChart3 } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, hasFamily, loading: txLoading } = useTransactions();
  
  const [currentView, setCurrentView] = useState<'timeline' | 'dashboard'>('timeline');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dashYear, setDashYear] = useState(new Date().getFullYear());
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const isUserAction = useRef(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { monthTransactions, dashboardData, totals } = useMemo(() => {
    const viewMonth = currentDate.getMonth();
    const viewYear = currentDate.getFullYear();

    const monthTx = transactions
      .filter(t => {
        const [y, m, d] = t.date.split('-');
        const tDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
        return tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
      });

    const realized = monthTx.reduce((acc, t) => t.status === 'paid' ? acc + Number(t.amount) : acc, 0);
    const planned = monthTx.reduce((acc, t) => t.status === 'pending' ? acc + Number(t.amount) : acc, 0);
    const total = realized + planned;
    
    const yearData = transactions.filter(t => new Date(t.date).getFullYear() === dashYear);
    const totalSpent = yearData.reduce((acc, t) => t.status === 'paid' ? acc + Math.abs(Number(t.amount)) : acc, 0);
    const totalPlannedYear = yearData.reduce((acc, t) => t.status === 'pending' ? acc + Math.abs(Number(t.amount)) : acc, 0);
    
    const mReal = Array(12).fill(0), mPlan = Array(12).fill(0);
    yearData.forEach(t => { 
        const [y, m, d] = t.date.split('-');
        const mo = parseInt(m)-1;
        if(t.status === 'paid') mReal[mo] += Math.abs(Number(t.amount)); 
        else mPlan[mo] += Math.abs(Number(t.amount)); 
    });
    const maxVal = Math.max(...mReal, ...mPlan, 1);
    
    const catData: Record<string, number> = {};
    yearData.forEach(t => { if(t.status === 'paid') { const c = t.category || 'Outros'; catData[c] = (catData[c] || 0) + Math.abs(Number(t.amount)); }});
    const sortedCats = Object.entries(catData).sort((a,b) => b[1] - a[1]);

    return { 
        monthTransactions: monthTx,
        totals: { realized, planned, total },
        dashboardData: { totalSpent, totalPlannedYear, mReal, mPlan, maxVal, sortedCats }
    };
  }, [transactions, currentDate, dashYear]);

  useEffect(() => {
    const percentage = totals.total === 0 ? 0 : (totals.realized / totals.total) * 100;
    if (percentage >= 99.9 && totals.total > 0 && !showCelebration && currentView === 'timeline') {
        const timer = setTimeout(() => {
             setShowCelebration(true);
             if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50, 50]);
             setTimeout(() => setShowCelebration(false), 5000);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [totals.realized, totals.total]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };
  
  const changeDashYear = (offset: number) => {
      setDashYear(prev => prev + offset);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
  const formatMonth = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const getMonthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long' });
  const getYear = (date: Date) => date.getFullYear();
  const formatCompact = (num: number) => num >= 1000 ? (num/1000).toFixed(1).replace('.',',') + 'k' : Math.round(num).toString();
  const mInitials = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const progressPercent = totals.total === 0 ? 0 : (totals.realized / totals.total) * 100;

  if (authLoading || (user && txLoading && transactions.length === 0)) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 text-brand animate-spin" /></div>;
  if (!user) return <LoginScreen />;
  if (!hasFamily) return <FamilyOnboarding />;

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      
      {showSettings && <FamilySettings onClose={() => setShowSettings(false)} />}
      {showCelebration && <MonthCelebration />}

      <style jsx global>{`
        .metallic-green { background: linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%); box-shadow: 0 0 15px rgba(16, 185, 129, 0.6); }
        .progress-gradient { background: linear-gradient(90deg, #FF385C 0%, #E91E63 100%); }
        .collapsible-grid { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .collapsible-grid.collapsed { grid-template-rows: 0fr; }
        .collapsible-inner { overflow: hidden; }
      `}</style>

      <header 
        className={`sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${isScrolled ? 'h-[110px]' : 'h-[200px]'}
        `}
      >
        <div className="relative h-full flex flex-col justify-between max-w-xl mx-auto px-5">
            
            <div className="pt-4 flex justify-between items-center relative z-20">
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setCurrentView('timeline')} 
                        className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${currentView === 'timeline' ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Fluxo
                    </button>
                    <button 
                        onClick={() => setCurrentView('dashboard')} 
                        className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${currentView === 'dashboard' ? 'bg-white text-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Análises
                    </button>
                </div>

                <button onClick={() => setShowSettings(true)} className="p-2.5 text-gray-400 hover:text-dark rounded-full hover:bg-gray-100 transition-all active:scale-95">
                    <Settings size={20} />
                </button>
            </div>

            <div className={`collapsible-grid ${isScrolled ? 'collapsed' : ''}`}>
                <div className="collapsible-inner">
                    {currentView === 'timeline' ? (
                        <div className="pb-4 pt-2 px-1">
                             <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">Pago <Check size={10} className="text-green-500" /></p>
                                    <h2 className="text-3xl font-black text-dark tracking-tight tabular-nums leading-none">{formatCurrency(totals.realized)}</h2>
                                </div>
                                <div className="text-right pb-0.5">
                                    <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">A Pagar</p>
                                    <h3 className="text-lg font-bold text-gray-400 tabular-nums leading-none">{formatCurrency(totals.planned)}</h3>
                                </div>
                            </div>
                            <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-100">
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${progressPercent >= 99.9 ? 'metallic-green' : 'progress-gradient'}`} style={{ width: `${progressPercent}%` }}><div className="absolute right-0 top-0 h-full w-3 bg-white/30 blur-[3px]"></div></div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 pb-4 pt-2 px-1">
                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 border-l-[3px] border-l-brand"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Gasto {dashYear}</p><p className="text-lg font-black text-dark">{formatCurrency(dashboardData.totalSpent)}</p></div>
                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 border-l-[3px] border-l-gray-300"><p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Planejado {dashYear}</p><p className="text-lg font-black text-gray-500">{formatCurrency(dashboardData.totalPlannedYear)}</p></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pb-4 pt-1 flex justify-center items-center border-t border-gray-50/50">
                <div className="flex items-center gap-6 w-full max-w-xs justify-between">
                    <button 
                        onClick={() => currentView === 'timeline' ? changeMonth(-1) : changeDashYear(-1)} 
                        className="p-2 text-gray-300 hover:text-dark hover:bg-gray-100 rounded-full transition-all active:scale-90"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-black text-dark whitespace-nowrap select-none cursor-default tracking-tight">
                        {currentView === 'timeline' ? formatMonth(currentDate) : `Ano de ${dashYear}`}
                    </span>

                    <button 
                        onClick={() => currentView === 'timeline' ? changeMonth(1) : changeDashYear(1)} 
                        className="p-2 text-gray-300 hover:text-dark hover:bg-gray-100 rounded-full transition-all active:scale-90"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

        </div>
        
        {isScrolled && (
            <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 w-12 h-3 bg-gray-200/50 backdrop-blur rounded-b-lg flex items-center justify-center cursor-pointer z-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-4 h-1 bg-gray-400 rounded-full opacity-50"></div>
            </div>
        )}
      </header>

      <div className="pt-2">
        {currentView === 'timeline' ? (
            <TransactionList monthTransactions={monthTransactions} onScroll={() => {}} />
        ) : (
            <div className="px-4 max-w-lg mx-auto animate-fade-in pb-32">
                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 mb-6">
                    <div className="flex justify-between items-center mb-8"><h3 className="text-xs font-bold text-dark uppercase tracking-wider">Evolução Anual</h3><div className="flex gap-3 text-[9px] font-bold uppercase"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand"></div> Real</div><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Plan</div></div></div>
                    <div className="flex items-end justify-between h-48 gap-1 pb-2">
                        {dashboardData.mReal.map((realVal, idx) => {
                            const planVal = dashboardData.mPlan[idx]; const realH = (realVal / dashboardData.maxVal) * 100; const planH = (planVal / dashboardData.maxVal) * 100;
                            const label = realVal > 0 ? formatCompact(realVal) : (planVal > 0 ? formatCompact(planVal) : ''); const labelColor = realVal > 0 ? 'text-brand' : 'text-gray-300';
                            return (<div key={idx} className="w-full flex flex-col justify-end items-center h-full group"><div className={`text-[9px] font-bold ${labelColor} -mb-1 opacity-0 group-hover:opacity-100 transition-opacity`}>{label}</div><div className="w-full flex gap-[2px] items-end justify-center h-full mt-1"><div className="w-1/2 bg-brand rounded-t-sm grow-bar opacity-90" style={{height: `${realH}%`, animationDelay: `${idx*0.05}s`}}></div><div className="w-1/2 bg-gray-200 rounded-t-sm grow-bar opacity-80" style={{height: `${planH}%`, animationDelay: `${idx*0.05}s`}}></div></div></div>);
                        })}
                    </div>
                    <div className="flex justify-between mt-2 px-1 text-[9px] text-gray-400 font-bold uppercase">{mInitials.map((m, i) => <div key={i} className="w-full text-center">{m}</div>)}</div>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 mb-24">
                  <h3 className="text-xs font-bold text-dark uppercase tracking-wider mb-6">Destino dos Gastos</h3>
                  <div className="space-y-5">
                    {dashboardData.sortedCats.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4">Sem dados para este ano.</p>
                    ) : (
                      dashboardData.sortedCats.map(([cat, val]) => { 
                        const pct = (val / dashboardData.totalSpent) * 100; 
                        const barPct = (val / dashboardData.sortedCats[0][1]) * 100; 
                        return (
                          <div key={cat}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="font-bold text-dark">{cat}</span>
                              <span className="text-secondary font-medium">{formatCurrency(val)} <span className="text-gray-300 ml-1 text-[10px]">({pct.toFixed(0)}%)</span></span>
                            </div>
                            <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
                              <div className="bg-brand h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${barPct}%` }}></div>
                            </div>
                          </div>
                        ); 
                      })
                    )}
                  </div>
                </div>
            </div>
        )}
      </div>
      
      <TransactionControls /> 
    </div>
  );
}