import { useEffect, useState } from 'react';
import { ArrowRight, Newspaper, ChevronRight } from 'lucide-react';

type Noticia = {
  id: number;
  titulo: string;
  resumo: string;
  link: string;
  imagem_url: string;
  categoria: string;
  fonte: string;
  data_publicacao: string;
};

export default function FeedNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [categoria, setCategoria] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const categorias = [
    { key: 'todas',      label: '🔥 Tudo' },
    { key: 'lancamento', label: '👕 Lançamentos' },
    { key: 'resultado',  label: '⚽ Jogos' },
    { key: 'geral',      label: '📰 Notícias' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    const url = categoria === 'todas'
      ? 'http://localhost:3001/api/noticias?limit=12'
      : `http://localhost:3001/api/noticias?categoria=${categoria}&limit=12`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        // API v2 returns { noticias: [], total: ... }
        setNoticias(data.noticias || data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar notícias:', err);
        setLoading(false);
      });
  }, [categoria]);

  return (
    <section className="px-6 py-8">
      <h2 className="text-2xl font-bold mb-4 text-white">📡 Notícias & Lançamentos</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categorias.map(c => (
          <button
            key={c.key}
            onClick={() => setCategoria(c.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
              ${categoria === c.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="h-44 w-full bg-white/5 animate-pulse rounded-xl" />
          <div className="h-4 w-2/3 bg-white/5 animate-pulse rounded" />
        </div>
      ) : noticias.length === 0 ? (
        <div className="text-gray-500 italic p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
          Nenhuma notícia encontrada no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {noticias.map(n => (
            <a
              key={n.id}
              href={n.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl hover:shadow-blue-500/10 hover:bg-white/10 transition-all duration-300 overflow-hidden group flex flex-col"
            >
              {n.imagem_url ? (
                <div className="w-full h-52 overflow-hidden relative">
                  <img
                    src={n.imagem_url}
                    alt={n.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1">Ler matéria completa <ArrowRight size={14} /></span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-52 bg-slate-800 flex items-center justify-center">
                   <Newspaper size={48} className="text-slate-600" />
                </div>
              )}
              <div className="p-8 flex flex-col flex-1 gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full
                    ${n.categoria === 'lancamento' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      n.categoria === 'resultado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-white/10'}`}>
                    {n.categoria}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">• {n.fonte}</span>
                </div>
                <h3 className="font-bold text-lg leading-tight text-white group-hover:text-blue-400 transition-colors line-clamp-3 min-h-[60px]">
                  {n.titulo}
                </h3>
                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {n.data_publicacao ? new Date(n.data_publicacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
