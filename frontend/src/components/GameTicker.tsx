'use client';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

type Jogo = {
  id: number;
  titulo: string;
  resumo: string;
};

export default function GameTicker() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('http://localhost:3001/api/noticias?categoria=resultado&limit=10')
      .then(r => r.json())
      .then(data => setJogos(data.noticias || []))
      .catch(err => console.error('Erro ticker:', err));
  }, []);

  if (!mounted || jogos.length === 0) return null;

  return (
    <div className="w-full bg-blue-600/10 border-y border-blue-500/20 py-2 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-background to-transparent w-20 z-10" />
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-background to-transparent w-20 z-10" />
      
      <div className="flex whitespace-nowrap animate-ticker items-center gap-12 px-12">
        {/* Duplicar para loop infinito */}
        {[...jogos, ...jogos].map((jogo, i) => (
          <div key={i} className="flex items-center gap-4 group cursor-pointer">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
              <Activity size={10} className="animate-pulse" /> Live
            </span>
            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              {jogo.titulo}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
              {jogo.resumo}
            </span>
            <span className="text-slate-700 mx-4">•</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
