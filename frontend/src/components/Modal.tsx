'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay com Blur mais profissional */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose} 
      />
      
      {/* Container do Modal */}
      <div 
        className="relative bg-[#0f172a] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header inspirado no CRM Premium */}
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100 uppercase">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-slate-400 hover:text-white border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body com padding corrigido e scroll sutil */}
        <div className="p-7 overflow-y-auto custom-scrollbar text-slate-300 font-normal leading-relaxed text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
