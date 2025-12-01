'use client';
import { useState, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useTransactions } from './context/TransactionsContext';
import LoginScreen from './components/LoginScreen';
import TimelineScreen from './components/TimelineScreen';
import FamilyOnboarding from './components/FamilyOnboarding';
import DashboardSkeleton from './components/DashboardSkeleton';
import TransactionControls from './components/TransactionControls';
import { Loader2, List, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { transactions, hasFamily, loading: txLoading } = useTransactions();
  const [currentView, setCurrentView] = useState<'timeline' | 'dashboard'>('timeline');
  const [dashYear, setDashYear] = useState(new Date().getFullYear());

  const dashboardData = useMemo(() => {
    const yearData = transactions.filter(t => new Date(t.date).getFullYear() === dashYear);
    
    const totalSpent = yearData.reduce((acc, t) => t.status === 'paid' ? acc + Math.abs(Number(t.amount)) : acc, 0);
    const totalPlanned = yearData.reduce((acc, t) => t.status === 'pending' ? acc + Math.abs(Number(t.amount)) : acc, 0);
    
    const mReal = Array(12).fill(0), mPlan = Array(12).fill(0);
    yearData.forEach(t => { 
      const d = new Date(t.date + 'T12:00:00'); 
      const m = d.getMonth(); 
      if(t.status === 'paid') mReal[m] += Math.abs(Number(t.amount)); 
      else mPlan[m] += Math.abs(Number(t.amount)); 
    });
    
    const maxVal = Math.max(...mReal, ...mPlan, 1);
    
    const catData: Record<string, number> = {};
    yearData.forEach(t => { 
      if(t.status === 'paid') { 
        const c = t.category || 'Outros'; 
        catData[c] = (catData[c] || 0) + Math.abs(Number(t.amount)); 
      }
    });
    
    const sortedCats = Object.entries(catData).sort((a,b) => b[1] - a[1]);
    
    return { totalSpent, totalPlanned, mReal, mPlan, maxVal, sortedCats };
  }, [transactions, dashYear]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatCompact = (num: number) => num >= 1000 ? (num/1000).toFixed(1).replace('.',',') + 'k' : Math.round(num).toString();
  const mInitials = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  if (authLoading || (user && txLoading && transactions.length === 0)) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="h-8 w-8 text-brand animate-spin" /></div>;
  if (!user) return <LoginScreen />;
  if (!hasFamily) return <FamilyOnboarding />;

  return (
    <>
      <div className={currentView === 'timeline' ? 'block' : 'hidden'}><TimelineScreen /></div>
      
      <div className={currentView === 'dashboard' ? 'block' : 'hidden'}>
        {txLoading ? <DashboardSkeleton type="dashboard" /> : (
          <div className="px-4 pt-4 max-w-lg mx-auto animate-fade-in pb-32">
            
            {/* Navegação Ano */}
            <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => setDashYear(d => d - 1)} className="p-2 text-gray-400 hover:text-brand rounded-full transition-colors"><ChevronLeft size={20} /></button>
                <h1 className="text-lg font-extrabold text-dark">Análise <span className="text-brand">{dashYear}</span></h1>
                <button onClick={() => setDashYear(d => d + 1)} className="p-2 text-gray-400 hover:text-brand rounded-full transition-colors"><ChevronRight size={20} /></button>
            </div>

            {/* Cards Resumo */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-brand">
                  <p className="text-[10px] font-bold text-secondary uppercase mb-1">Total Realizado</p>
                  <p className="text-lg font-bold text-dark">{formatCurrency(dashboardData.totalSpent)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-gray-300">
                  <p className="text-[10px] font-bold text-secondary uppercase mb-1">Total Planejado</p>
                  <p className="text-lg font-bold text-gray-500">{formatCurrency(dashboardData.totalPlanned)}</p>
                </div>
            </div>

            {/* Gráfico */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xs font-bold text-dark uppercase">Evolução Anual</h3>
                  <div className="flex gap-3 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand"></div> Real</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-300"></div> Plan</div>
                  </div>
                </div>
                <div className="flex items-end justify-between h-48 gap-1 pb-2">
                    {dashboardData.mReal.map((realVal, idx) => {
                        const planVal = dashboardData.mPlan[idx]; 
                        const realH = (realVal / dashboardData.maxVal) * 100; 
                        const planH = (planVal / dashboardData.maxVal) * 100;
                        const label = realVal > 0 ? formatCompact(realVal) : (planVal > 0 ? formatCompact(planVal) : ''); 
                        const labelColor = realVal > 0 ? 'text-brand' : 'text-gray-300';
                        
                        return (
                          <div key={idx} className="w-full flex flex-col justify-end items-center h-full group">
                            <div className={`text-[9px] font-bold ${labelColor} -mb-1 opacity-0 group-hover:opacity-100 transition-opacity`}>{label}</div>
                            <div className="w-full flex gap-[1px] items-end justify-center h-full mt-1">
                              <div className="w-1/2 bg-brand rounded-t-sm grow-bar opacity-90" style={{height: `${realH}%`, animationDelay: `${idx*0.05}s`}}></div>
                              <div className="w-1/2 bg-gray-300 rounded-t-sm grow-bar opacity-80" style={{height: `${planH}%`, animationDelay: `${idx*0.05}s`}}></div>
                            </div>
                          </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1 px-1 text-[8px] text-gray-400 font-bold uppercase">
                  {mInitials.map((m, i) => <div key={i} className="w-full text-center">{m}</div>)}
                </div>
            </div>

            {/* Lista Categorias (CORRIGIDO: className) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-24">
              <h3 className="text-sm font-bold text-dark mb-4">Top Categorias</h3>
              <div className="space-y-4">
                {dashboardData.sortedCats.length === 0 ? (
                  <p className="text-center text-xs text-gray-400">Sem dados.</p>
                ) : (
                  dashboardData.sortedCats.map(([cat, val]) => { 
                    const pct = (val / dashboardData.totalSpent) * 100; 
                    const barPct = (val / dashboardData.sortedCats[0][1]) * 100; 
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          {/* AQUI ESTAVA O ERRO: class -> className */}
                          <span className="font-bold text-dark">{cat}</span>
                          <span className="text-secondary">{formatCurrency(val)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-brand h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${barPct}%` }}></div>
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
      
      <nav className="fixed bottom-0 w-full bg-surface border-t border-gray-200 pb-safe pt-2 px-6 shadow-nav z-30 flex justify-between items-center h-[80px]">
        <button onClick={() => setCurrentView('timeline')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${currentView === 'timeline' ? 'text-brand' : 'text-gray-400'}`}><List size={24} /><span className="text-[10px] font-bold">Fluxo</span></button>
        <div className="w-16"></div>
        <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${currentView === 'dashboard' ? 'text-brand' : 'text-gray-400'}`}><BarChart3 size={24} /><span className="text-[10px] font-bold">Análises</span></button>
      </nav>
    </>
  );
}