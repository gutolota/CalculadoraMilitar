import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { DollarSign, Zap, ReceiptText, Trash2 } from 'lucide-react';
import { AVAILABLE_FIELDS } from './ConditionNode';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="px-4 py-2 shadow-2xl rounded-2xl bg-white border-2 border-green-300 min-w-[280px] overflow-hidden">
      <div className="bg-green-300 p-3 -mx-4 -mt-2 mb-3 flex items-center justify-between border-b-2 border-green-700">
        <div className="flex items-center gap-2">
          <ReceiptText size={16} className="text-green-800" />
          <span className="text-[10px] font-black text-green-800 uppercase tracking-[0.2em]">Aplicar Penalidade</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
            className="text-green-800/50 hover:text-rose-700 transition-colors"
            title="Remover Nó"
          >
            <Trash2 size={14} />
          </button>
          <DollarSign size={14} className="text-green-800" />
        </div>
      </div>

      <div className="space-y-3 pb-2">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-green-700 uppercase tracking-tighter">Descrição Oficial:</label>
          <input
            className="nodrag w-full text-xs font-bold bg-green-50 border-2 border-green-200 rounded p-2 outline-none focus:border-green-600"
            value={data.label || ''}
            onChange={(e) => data.onChange('label', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-green-50 p-2 rounded-xl border-2 border-green-100">
            <div className="text-[8px] font-black text-green-700 uppercase">Peso (Mult)</div>
            <input type="number" className="nodrag nowheel text-sm font-mono font-black bg-transparent outline-none w-full text-green-800"
              value={data.mult || 0}
              onChange={(e) => data.onChange('mult', Number(e.target.value))}
            />
          </div>
          <div className="bg-green-50 p-2 rounded-xl border-2 border-green-100">
            <div className="text-[8px] font-black text-green-700 uppercase">Amparo Legal</div>
            <input className="nodrag text-[10px] font-mono font-bold bg-transparent outline-none w-full text-green-700"
              placeholder="Art..."
              value={data.amparo || ''}
              onChange={(e) => data.onChange('amparo', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-green-700 p-3 rounded-xl border-2 border-green-300 space-y-2 shadow-inner">
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-green-300" />
            <div className="text-[8px] font-black text-green-300 uppercase tracking-widest">Variável de Cálculo</div>
          </div>

          <select
            className="nodrag w-full text-[10px] font-bold bg-white/10 text-white border border-green-300/30 rounded p-1 outline-none"
            value={data.multiplyByField || ''}
            onChange={(e) => data.onChange('multiplyByField', e.target.value)}
          >
            <option value="" className="text-slate-900">Valor Fixo (1x)</option>
            {Object.entries(AVAILABLE_FIELDS).filter(([_, info]) => info.type === 'number').map(([id, info]) => (
              <option key={id} value={id} className="text-slate-900">Mult. por: {info.label}</option>
            ))}
          </select>

          {data.multiplyByField && (
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[9px] font-bold text-green-300 uppercase">Abatimento:</span>
              <input
                type="number"
                className="nodrag nowheel w-16 text-[10px] font-mono bg-white/5 text-white border border-green-300/20 rounded p-1 text-center outline-none focus:border-green-300"
                value={data.subtractValue || 0}
                onChange={(e) => data.onChange('subtractValue', Number(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-4 h-4 bg-green-300 border-2 border-green-700 shadow-sm" style={{ top: '-8px' }} />
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-4 h-4 bg-white border-2 border-slate-400 shadow-sm" style={{ bottom: '-8px' }} />
    </div>
  );
});
