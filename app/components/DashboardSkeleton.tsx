'use client';
import { Ghost } from 'lucide-react';

export default function DashboardSkeleton({ type = 'timeline' }: { type?: 'timeline' | 'dashboard' }) {
  return (
    <div className="w-full px-4 pt-6 animate-fade-in pb-32">
      
      {/* --- CABEÇALHO DIVERTIDO --- */}
      <div className="flex flex-col items-center justify-center mb-8 opacity-50">
        <div className="relative">
            <Ghost size={40} className="text-gray-300 animate-float" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full animate-ping"></div>
        </div>
        <p className="text-xs font-bold text-gray-300 mt-2 tracking-widest uppercase animate-pulse">
          Caçando dados...
        </p>
      </div>

      {/* --- ESTILO SHIMMER (Brilho Líquido) --- */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* --- LAYOUT TIMELINE --- */}
      {type === 'timeline' && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-full skeleton-shimmer flex-shrink-0"></div>
                <div className="flex flex-col gap-2 w-full max-w-[60%]">
                  <div className="h-4 w-3/4 rounded skeleton-shimmer"></div>
                  <div className="h-3 w-1/2 rounded skeleton-shimmer"></div>
                </div>
              </div>
              <div className="h-5 w-16 rounded skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      )}

      {/* --- LAYOUT DASHBOARD --- */}
      {type === 'dashboard' && (
        <div className="space-y-6">
          <div className="h-12 w-full rounded-xl skeleton-shimmer mb-6"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-xl skeleton-shimmer"></div>
            <div className="h-24 rounded-xl skeleton-shimmer"></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 h-64 flex items-end justify-between gap-2 pb-2">
             {[40, 70, 50, 80, 60, 90, 30, 50, 70, 40, 80, 60].map((h, i) => (
               <div key={i} className="w-full rounded-t-sm skeleton-shimmer" style={{ height: `${h}%`, opacity: 0.5 + (i%2)*0.3 }}></div>
             ))}
          </div>
          <div className="space-y-3">
             <div className="h-4 w-1/3 rounded skeleton-shimmer mb-4"></div>
             {[1,2,3].map(i => (
                 <div key={i}>
                     <div className="flex justify-between mb-1">
                         <div className="h-3 w-20 rounded skeleton-shimmer"></div>
                         <div className="h-3 w-10 rounded skeleton-shimmer"></div>
                     </div>
                     <div className="h-2 w-full rounded-full skeleton-shimmer"></div>
                 </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}