'use client';
import { useEffect, useState } from 'react';

// Emojis temáticos para o "Fator Novidade" (Craft)
const MONTH_THEMES = [
  ['☀️', '🌊', '😎', '🍹'], // Jan (Verão)
  ['🎉', '🎭', '🥁', '✨'], // Fev (Carnaval)
  ['🍫', '🐰', '🥚', '🌸'], // Mar (Páscoa/Outono)
  ['🍂', '🎻', '📖', '☕'], // Abr
  ['❤️', '🌹', '👩', '🎁'], // Mai (Mães)
  ['🔥', '🌽', '🥜', '🤠'], // Jun (São João)
  ['❄️', '⛄', '🧣', '🏂'], // Jul (Inverno)
  ['🪁', '💨', '🍃', '👨'], // Ago (Pais/Vento)
  ['🌱', '🌺', '🐝', '🌤️'], // Set (Primavera)
  ['🎃', '👻', '🍭', '🕷️'], // Out (Halloween)
  ['🛍️', '🏷️', '💻', '💸'], // Nov (Black Friday)
  ['🎅', '🎄', '🎁', '⭐'], // Dez (Natal)
];

export default function MonthCelebration({ monthIndex = 0 }: { monthIndex?: number }) {
  const [particles, setParticles] = useState<any[]>([]);
  const themeIcons = MONTH_THEMES[monthIndex % 12];

  useEffect(() => {
    // Gera partículas explodindo de baixo
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Posição horizontal
      delay: Math.random() * 0.5, // Atraso aleatório
      duration: 3 + Math.random() * 2, // Duração da subida
      size: 1.5 + Math.random() * 2, // Tamanho variado
      icon: themeIcons[Math.floor(Math.random() * themeIcons.length)],
      xOffset: (Math.random() - 0.5) * 50, // Movimento lateral
    }));
    setParticles(newParticles);
  }, [monthIndex]);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-end pb-20">
      
      {/* Backdrop Suave (Foco na celebração) */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] animate-fade-in-out"></div>

      {/* Badge Central (Pulo Elástico) */}
      <div className="relative z-10 animate-spring-up mb-32">
        <div className="bg-white px-8 py-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-white/50 flex flex-col items-center transform hover:scale-105 transition-transform">
          <span className="text-3xl mb-1 filter drop-shadow-sm">🏆</span>
          <span className="text-[10px] font-black text-brand uppercase tracking-[0.25em]">
            Mês Concluído!
          </span>
        </div>
      </div>

      {/* Partículas Flutuantes */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute -bottom-10 opacity-0"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animation: `celebration-float ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${p.delay}s`,
            transform: `translateX(${p.xOffset}px)` // Vento lateral inicial
          }}
        >
          {/* Rotação interna para dar vida */}
          <div className="animate-spin-slow">
            {p.icon}
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes celebration-float {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translateY(-10vh) scale(1); }
          100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
        }
        @keyframes spring-up {
          0% { transform: scale(0) translateY(50px); opacity: 0; }
          50% { transform: scale(1.2) translateY(-10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes fade-in-out {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-spring-up { animation: spring-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-fade-in-out { animation: fade-in-out 4s ease-in-out forwards; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}