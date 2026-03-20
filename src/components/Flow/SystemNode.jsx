import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Cpu, Calendar, ShieldCheck, Clock, Trash2 } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="shadow-2xl rounded-xl bg-[#3A3F1C] border-2 border-[#D4AF37] min-w-[300px] overflow-hidden">
      <div className="bg-[#D4AF37] p-3 flex items-center justify-between border-b-2 border-[#3A3F1C]">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-[#3A3F1C]" />
          <span className="text-[10px] font-black text-[#3A3F1C] uppercase tracking-[0.2em]">Parâmetros Globais</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-[#3A3F1C]/50 hover:text-rose-700 transition-colors"
          title="Remover Nó"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4 bg-white/5">
        {/* Idade Militar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Calendar size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase">Idade de Alistamento:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              className="w-16 bg-[#F4F4F0]/10 border border-[#D4AF37]/30 text-white font-mono text-xs p-1 rounded text-center"
              value={data.militaryAge || 18}
              onChange={(e) => data.onChange('militaryAge', Number(e.target.value))}
            />
            <span className="text-[8px] text-slate-400 uppercase">anos</span>
          </div>
        </div>

        {/* Limite Refratário */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase">Teto de Refratário:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              className="w-16 bg-[#F4F4F0]/10 border border-[#D4AF37]/30 text-white font-mono text-xs p-1 rounded text-center"
              value={data.maxRefractoryYears || 10}
              onChange={(e) => data.onChange('maxRefractoryYears', Number(e.target.value))}
            />
            <span className="text-[8px] text-slate-400 uppercase">anos</span>
          </div>
        </div>

        {/* Prazo de Comunicação */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Clock size={14} className="text-[#D4AF37]" />
            <span className="text-[10px] font-bold uppercase">Prazo Comunicação:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              className="w-16 bg-[#F4F4F0]/10 border border-[#D4AF37]/30 text-white font-mono text-xs p-1 rounded text-center"
              value={data.communicationDeadlineDays || 60}
              onChange={(e) => data.onChange('communicationDeadlineDays', Number(e.target.value))}
            />
            <span className="text-[8px] text-slate-400 uppercase">dias</span>
          </div>
        </div>
      </div>

      <div className="p-2 bg-[#D4AF37]/10 text-center">
        <p className="text-[8px] text-[#D4AF37] font-bold uppercase tracking-tighter">Este nó define as constantes de cálculo</p>
      </div>
    </div>
  );
});
