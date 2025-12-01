'use client';
import { useEffect, useState } from 'react';
import { Calendar, Coins } from 'lucide-react';

const FUN_MESSAGES = [
  "Negociando com o calendário...",
  "Multiplicando os lançamentos...",
  "Organizando o futuro financeiro...",
  "Convencendo os boletos...",
  "Alinhando os astros da economia...",
  "Gerando fluxo de caixa...",
  "Tudo pronto em 3, 2, 1..."
];

export default function ImmersiveLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => { setMessageIndex((prev) => (prev + 1) % FUN_MESSAGES.length); }, 1500);
    const progInterval = setInterval(() => {
      setProgress((old) => { if (old > 90) return old; const diff = Math.random() * 10; return Math.min(old + diff, 90); });
    }, 200);
    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-brand flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
        <div className="relative flex items-center justify-center">
          <div className="absolute animate-spin-slow"><div className="w-24 h-24 border-2 border-white/30 rounded-full border-t-white border-l-transparent"></div></div>
          <div className="absolute animate-reverse-spin"><div className="w-16 h-16 border-2 border-white/50 rounded-full border-b-white border-r-transparent"></div></div>
          <Calendar size={48} className="text-white drop-shadow-lg animate-bounce-slight" />
          <div className="absolute -right-6 -top-4 bg-white text-brand p-2 rounded-full shadow-lg animate-float"><Coins size={20} /></div>
        </div>
      </div>
      <div className="h-8 mb-6 overflow-hidden flex flex-col items-center justify-center">
        <p key={messageIndex} className="text-lg font-bold tracking-wide animate-slide-up-fade text-center px-4">{FUN_MESSAGES[messageIndex]}</p>
      </div>
      <div className="w-64 h-2 bg-black/20 rounded-full overflow-hidden relative">
        <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] transition-all duration-300 ease-out rounded-full" style={{ width: `${progress}%` }}></div>
        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer"></div>
      </div>
      <style jsx>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes reverse-spin { to { transform: rotate(-360deg); } }
        @keyframes bounce-slight { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(12deg); } 50% { transform: translateY(-8px) rotate(0deg); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        .animate-reverse-spin { animation: reverse-spin 5s linear infinite; }
        .animate-bounce-slight { animation: bounce-slight 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 1.5s infinite; }
        .animate-slide-up-fade { animation: slide-up-fade 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}