import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HelpCircle } from 'lucide-react';

export default memo(({ data, isConnectable }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-slate-700 min-w-[200px]">
      <div className="flex items-center border-b border-slate-200 pb-2 mb-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 mr-2">
          <HelpCircle size={16} />
        </div>
        <div className="ml-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Pergunta</div>
          <input 
            className="text-sm font-bold bg-transparent outline-none w-full" 
            placeholder="Ex: O alistamento foi no prazo?" 
            value={data.label || ''}
            onChange={(e) => data.onChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
        <span className="bg-emerald-50 text-emerald-600 px-1 rounded border border-emerald-100 uppercase">SIM (Direita)</span>
        <span className="bg-rose-50 text-rose-600 px-1 rounded border border-rose-100 uppercase">NÃO (Baixo)</span>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ top: '50%', background: '#10b981' }}
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{ left: '50%', background: '#ef4444' }}
        isConnectable={isConnectable}
        className="w-3 h-3 border-2 border-white"
      />
    </div>
  );
});
