import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings2, HelpCircle, ShieldAlert, Trash2 } from 'lucide-react';

export const AVAILABLE_FIELDS = {
  enlistmentStatus: { label: 'Status do Alistamento', options: { 'late': 'Atrasado', 'on_time': 'No Prazo' } },
  multipleEnlistments: { label: 'Alistamento Múltiplo', options: { 'true': 'Sim', 'false': 'Não' } },
  selectionStatus: { label: 'Status da Seleção (CS)', options: { 'missed': 'Faltou', 'ok': 'Compareceu/Dispensado' } },
  refractoryYears: { label: 'Anos de Refratário', type: 'number' },
  exarMissedYears: { label: 'Faltas no EXAR', type: 'number' },
  reserveCategory: { label: 'Categoria da Reserva', options: { 'praca_r2': 'Praça/Oficial R2', 'oficial_mfdv': 'Oficial MFDV' } },
  missedConvocacao: { label: 'Faltou à Convocação', options: { 'true': 'Sim', 'false': 'Não' } },
  missedResidencia: { label: 'Mudança de Residência', options: { 'true': 'Sim', 'false': 'Não' } },
  certificateType: { label: 'Tipo de Certificado', options: { 'digital': 'Digital', 'analogico': 'Analógico' } },
  analogLegible: { label: 'Certificado Legível', options: { 'true': 'Sim', 'false': 'Não' } },
  lostDocs_cr_csm: { label: 'Extraviou CR/CSM', options: { 'true': 'Sim', 'false': 'Não' } },
  lostDocs_cdi_ci_cdsa: { label: 'Extraviou CDI/CI/CDSA', options: { 'true': 'Sim', 'false': 'Não' } },
  mfdvMissedRenewals: { label: 'Falta Renov. MFDV', type: 'number' },
  mfdvLateDiploma: { label: 'Atraso Diploma MFDV', options: { 'true': 'Sim', 'false': 'Não' } },
};

const OPERATORS = [
  { id: 'eq', label: 'for igual a' },
  { id: 'neq', label: 'for diferente de' },
  { id: 'gt', label: 'for maior que' },
  { id: 'lt', label: 'for menor que' },
];

export default memo(({ data, isConnectable }) => {
  const currentField = AVAILABLE_FIELDS[data.field];

  return (
    <div className="shadow-2xl rounded-xl bg-white border-2 border-[#3A3F1C] min-w-[280px] overflow-hidden transition-all hover:border-[#D4AF37]">
      <div className="bg-[#3A3F1C] p-3 flex items-center justify-between border-b-2 border-[#D4AF37]">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#D4AF37]" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Ponto de Decisão</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
            className="text-slate-500 hover:text-rose-500 transition-colors"
            title="Remover Nó"
          >
            <Trash2 size={14} />
          </button>
          <Settings2 size={14} className="text-slate-500" />
        </div>
      </div>

      <div className="p-4 space-y-4 bg-[#F4F4F0]/50">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-[#4B5320] uppercase tracking-tighter">Se o campo:</label>
          <select 
            className="nodrag w-full text-xs font-bold bg-white border-2 border-slate-200 rounded p-2 outline-none focus:border-[#4B5320] appearance-none cursor-pointer"
            value={data.field || ''}
            onChange={(e) => data.onChange('field', e.target.value)}
          >
            <option value="">-- Escolher Campo --</option>
            {Object.entries(AVAILABLE_FIELDS).map(([id, info]) => (
              <option key={id} value={id}>{info.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-black text-[#4B5320] uppercase tracking-tighter">Lógica:</label>
            <select 
              className="nodrag w-full text-[10px] font-bold bg-white border-2 border-slate-200 rounded p-2 outline-none focus:border-[#4B5320]"
              value={data.operator || 'eq'}
              onChange={(e) => data.onChange('operator', e.target.value)}
            >
              {OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
            </select>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-black text-[#4B5320] uppercase tracking-tighter">Valor:</label>
            {currentField?.options ? (
              <select 
                className="nodrag w-full text-[10px] font-bold bg-white border-2 border-[#D4AF37]/30 rounded p-2 outline-none focus:border-[#4B5320]"
                value={data.value || ''}
                onChange={(e) => data.onChange('value', e.target.value)}
              >
                <option value="">Escolher...</option>
                {Object.entries(currentField.options).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            ) : (
              <input 
                type="number"
                className="nodrag nowheel w-full text-xs font-mono font-bold bg-white border-2 border-[#D4AF37]/30 rounded p-2 outline-none focus:border-[#4B5320]"
                placeholder="0"
                value={data.value || ''}
                onChange={(e) => data.onChange('value', e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex border-t-2 border-[#3A3F1C] h-12 relative font-mono">
        <div className="flex-1 flex items-center justify-center bg-[#4B5320] hover:bg-[#3A3F1C] transition-colors group cursor-default">
          <span className="text-[10px] font-black text-white tracking-widest">SIM</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '25%', background: '#D4AF37', width: '14px', height: '14px', bottom: '-7px' }}
            className="border-2 border-[#3A3F1C] shadow-md"
          />
        </div>
        <div className="flex-1 flex items-center justify-center bg-rose-900 hover:bg-rose-950 transition-colors group cursor-default">
          <span className="text-[10px] font-black text-rose-100 tracking-widest">NÃO</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '75%', background: '#fff', width: '14px', height: '14px', bottom: '-7px' }}
            className="border-2 border-rose-900 shadow-md"
          />
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-[#D4AF37] border-2 border-[#3A3F1C] shadow-sm"
        style={{ top: '-8px' }}
      />
    </div>
  );
});
