import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Cpu, Calendar, ShieldCheck, Clock, Trash2, MapPin } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="shadow-2xl rounded-xl bg-green-700 border-2 border-green-300 min-w-[300px] overflow-hidden">
      <div className="bg-green-300 p-3 flex items-center justify-between border-b-2 border-green-700">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-green-800" />
          <span className="text-[10px] font-black text-green-800 uppercase tracking-[0.2em]">Parâmetros Globais</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-green-800/50 hover:text-rose-700 transition-colors"
          title="Remover Nó"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4 bg-white/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Calendar size={14} className="text-green-300" />
            <span className="text-[10px] font-bold uppercase">Idade Alistamento:</span>
          </div>
          <input
            type="number"
            className="nodrag nowheel w-16 bg-white/10 border border-green-300/30 text-white font-mono text-xs p-1 rounded text-center outline-none focus:border-green-300"
            value={data.militaryAge || 18}
            onChange={(e) => data.onChange('militaryAge', Number(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={14} className="text-green-300" />
            <span className="text-[10px] font-bold uppercase">Teto Refratário:</span>
          </div>
          <input
            type="number"
            className="nodrag nowheel w-16 bg-white/10 border border-green-300/30 text-white font-mono text-xs p-1 rounded text-center outline-none focus:border-green-300"
            value={data.maxRefractoryYears || 10}
            onChange={(e) => data.onChange('maxRefractoryYears', Number(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <MapPin size={14} className="text-green-300" />
            <span className="text-[10px] font-bold uppercase">Teto Faltas EXAR:</span>
          </div>
          <input
            type="number"
            className="nodrag nowheel w-16 bg-white/10 border border-green-300/30 text-white font-mono text-xs p-1 rounded text-center outline-none focus:border-green-300"
            value={data.maxExarYears || 5}
            onChange={(e) => data.onChange('maxExarYears', Number(e.target.value))}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Clock size={14} className="text-green-300" />
            <span className="text-[10px] font-bold uppercase">Prazo Comunicação:</span>
          </div>
          <input
            type="number"
            className="nodrag nowheel w-16 bg-white/10 border border-green-300/30 text-white font-mono text-xs p-1 rounded text-center outline-none focus:border-green-300"
            value={data.communicationDeadlineDays || 60}
            onChange={(e) => data.onChange('communicationDeadlineDays', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="p-2 bg-green-300/10 text-center text-green-300 font-black text-[7px] uppercase tracking-widest">
        Configurações Mestres do Sistema
      </div>
    </div>
  );
});
