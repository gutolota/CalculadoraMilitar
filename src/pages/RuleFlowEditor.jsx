import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  applyEdgeChanges, 
  applyNodeChanges,
  Panel,
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, RefreshCw, DollarSign, Settings2, ShieldAlert, Star, Zap, Trash2, Download, Cpu } from 'lucide-react';

import ConditionNode from '../components/Flow/ConditionNode';
import ActionNode from '../components/Flow/ActionNode';
import SystemNode from '../components/Flow/SystemNode';

const nodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  system: SystemNode,
};

const DEFAULT_FLOW = {
  name: 'Lei Federal 12664 (Sincronizada)',
  nodes: [
    { id: 'sys-config', type: 'system', position: { x: 1000, y: 0 }, data: { militaryAge: 18, maxRefractoryYears: 10, communicationDeadlineDays: 60 } },
    
    // 1. ALISTAMENTO (Y: 0 -> 500)
    { id: 'q1', type: 'condition', position: { x: 500, y: 0 }, data: { field: 'enlistmentStatus', operator: 'eq', value: 'late', label: 'Alistamento Atrasado?' } },
    { id: 'a1', type: 'action', position: { x: 50, y: 250 }, data: { label: 'Multa Art 176 (Atraso)', mult: 1, amparo: 'Art 176 RLSM' } },
    
    { id: 'q2', type: 'condition', position: { x: 500, y: 500 }, data: { field: 'multipleEnlistments', operator: 'eq', value: 'true', label: 'Alistamento Múltiplo?' } },
    { id: 'a2', type: 'action', position: { x: 50, y: 750 }, data: { label: 'Multa Art 177 (Múltiplo)', mult: 3, amparo: 'Art 177 RLSM' } },

    // 2. REFRATÁRIO (Y: 1000 -> 2000)
    { id: 'q3', type: 'condition', position: { x: 500, y: 1000 }, data: { field: 'refractoryYears', operator: 'gt', value: '0', label: 'Refratário (1ª Falta)?' } },
    { id: 'a3', type: 'action', position: { x: 50, y: 1250 }, data: { label: 'Falta CS (1ª vez)', mult: 1, amparo: 'Art 176 RLSM' } },
    
    { id: 'q4', type: 'condition', position: { x: 500, y: 1500 }, data: { field: 'refractoryYears', operator: 'gt', value: '1', label: 'Refratário (2ª Falta)?' } },
    { id: 'a4', type: 'action', position: { x: 50, y: 1750 }, data: { label: 'Falta CS (2ª vez)', mult: 5, amparo: 'Art 178 RLSM' } },

    { id: 'q5', type: 'condition', position: { x: 500, y: 2000 }, data: { field: 'refractoryYears', operator: 'gt', value: '2', label: 'Refratário (3ª Falta em diante)?' } },
    { id: 'a5', type: 'action', position: { x: 50, y: 2250 }, data: { label: 'Faltas Extras CS', mult: 5, amparo: 'Art 178 RLSM', multiplyByField: 'refractoryYears', subtractValue: 2 } },

    // 3. CATEGORIA RESERVA (Y: 2500 -> 3500)
    { id: 'q6', type: 'condition', position: { x: 500, y: 2500 }, data: { field: 'reserveCategory', operator: 'eq', value: 'oficial_mfdv', label: 'É MFDV?' } },
    
    // Caminho MFDV
    { id: 'q6a', type: 'condition', position: { x: 200, y: 2800 }, data: { field: 'exarMissedYears', operator: 'gt', value: '0', label: 'Falta EXAR MFDV?' } },
    { id: 'a6a', type: 'action', position: { x: 50, y: 3100 }, data: { label: 'Multa EXAR MFDV', mult: 5, amparo: 'Art. 52 LMFDV', multiplyByField: 'exarMissedYears' } },
    
    { id: 'q6b', type: 'condition', position: { x: 200, y: 3400 }, data: { field: 'missedConvocacao', operator: 'eq', value: 'true', label: 'Falta Convocação MFDV?' } },
    { id: 'a6b', type: 'action', position: { x: 50, y: 3700 }, data: { label: 'Falta Convocação MFDV', mult: 15, amparo: 'Art. 60 LMFDV' } },

    // Caminho Praça/R2
    { id: 'q7a', type: 'condition', position: { x: 800, y: 2800 }, data: { field: 'exarMissedYears', operator: 'gt', value: '0', label: 'Falta EXAR Praça?' } },
    { id: 'a7a', type: 'action', position: { x: 600, y: 3100 }, data: { label: 'Multa EXAR Praça', mult: 3, amparo: 'Art. 47 LSM', multiplyByField: 'exarMissedYears' } },
    
    { id: 'q7b', type: 'condition', position: { x: 800, y: 3400 }, data: { field: 'missedConvocacao', operator: 'eq', value: 'true', label: 'Falta Convocação Praça?' } },
    { id: 'a7b', type: 'action', position: { x: 600, y: 3700 }, data: { label: 'Falta Convocação Praça', mult: 3, amparo: 'Art. 47 LSM' } },

    // 4. EXTRAVIOS (Y: 4100+)
    { id: 'q8', type: 'condition', position: { x: 500, y: 4100 }, data: { field: 'certificateType', operator: 'eq', value: 'analogico', label: 'Certificado Analógico?' } },
    { id: 'q8a', type: 'condition', position: { x: 250, y: 4400 }, data: { field: 'analogLegible', operator: 'eq', value: 'false', label: 'Não legível/Extraviado?' } },
    { id: 'q8b', type: 'condition', position: { x: 50, y: 4700 }, data: { field: 'lostDocs_cdi_ci_cdsa', operator: 'eq', value: 'true', label: 'Extraviou CDI/CI/CDSA?' } },
    { id: 'a8', type: 'action', position: { x: 50, y: 5000 }, data: { label: 'Multa Extravio', mult: 3, amparo: 'Art 177 RLSM' } },
  ],
  edges: [
    { id: 'e1-y', source: 'q1', sourceHandle: 'yes', target: 'a1', label: 'SIM', animated: true, style: { stroke: '#4B5320', strokeWidth: 3 }, labelStyle: { fill: '#4B5320', fontWeight: 900 } },
    { id: 'e1-n', source: 'q1', sourceHandle: 'no', target: 'q2', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e1-next', source: 'a1', target: 'q2' },
    { id: 'e2-y', source: 'q2', sourceHandle: 'yes', target: 'a2', label: 'SIM', animated: true, style: { stroke: '#4B5320', strokeWidth: 3 } },
    { id: 'e2-n', source: 'q2', sourceHandle: 'no', target: 'q3', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e2-next', source: 'a2', target: 'q3' },
    { id: 'e3-y', source: 'q3', sourceHandle: 'yes', target: 'a3', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e3-n', source: 'q3', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e3-next', source: 'a3', target: 'q4' },
    { id: 'e4-y', source: 'q4', sourceHandle: 'yes', target: 'a4', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e4-n', source: 'q4', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e4-next', source: 'a4', target: 'q5' },
    { id: 'e5-y', source: 'q5', sourceHandle: 'yes', target: 'a5', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e5-n', source: 'q5', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e5-next', source: 'a5', target: 'q6' },
    { id: 'e6-y', source: 'q6', sourceHandle: 'yes', target: 'q6a', label: 'SIM (MFDV)', style: { stroke: '#4B5320' } },
    { id: 'e6-n', source: 'q6', sourceHandle: 'no', target: 'q7a', label: 'NÃO (PRAÇA)', style: { stroke: '#64748b' } },
    { id: 'e6a-y', source: 'q6a', sourceHandle: 'yes', target: 'a6a', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e6a-n', source: 'q6a', sourceHandle: 'no', target: 'q6b', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e6a-next', source: 'a6a', target: 'q6b' },
    { id: 'e7a-y', source: 'q7a', sourceHandle: 'yes', target: 'a7a', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e7a-n', source: 'q7a', sourceHandle: 'no', target: 'q7b', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e7a-next', source: 'a7a', target: 'q7b' },
    { id: 'e_to_lost', source: 'a6b', target: 'q8' },
    { id: 'e_to_lost_2', source: 'a7b', target: 'q8' },
    { id: 'e_to_lost_3', source: 'q6b', sourceHandle: 'no', target: 'q8' },
    { id: 'e_to_lost_4', source: 'q7b', sourceHandle: 'no', target: 'q8' },
    { id: 'e8-y', source: 'q8', sourceHandle: 'yes', target: 'q8a', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e8a-y', source: 'q8a', sourceHandle: 'yes', target: 'q8b', label: 'SIM', style: { stroke: '#4B5320' } },
    { id: 'e8b-y', source: 'q8b', sourceHandle: 'yes', target: 'a8', label: 'SIM', style: { stroke: '#4B5320' } },
  ]
};

function FlowEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [ruleName, setRuleName] = useState('Lei Federal 12664');

  const onNodeDataChange = useCallback((id, field, value) => {
    setNodes((nds) => nds.map((node) => node.id === id ? { ...node, data: { ...node.data, [field]: value } } : node));
  }, []);

  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, []);

  const injectHandlers = useCallback((nds) => {
    return nds.map(node => ({
      ...node,
      data: { 
        ...node.data, 
        onChange: (field, val) => onNodeDataChange(node.id, field, val),
        onDelete: () => deleteNode(node.id)
      }
    }));
  }, [onNodeDataChange, deleteNode]);

  const loadDefaultFlow = useCallback(() => {
    setNodes(injectHandlers(DEFAULT_FLOW.nodes));
    setEdges(DEFAULT_FLOW.edges);
    setRuleName(DEFAULT_FLOW.name);
  }, [injectHandlers]);

  useEffect(() => {
    const saved = localStorage.getItem('military_flow_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNodes(injectHandlers(parsed.nodes));
        setEdges(parsed.edges);
        if (parsed.name) setRuleName(parsed.name);
      } catch (e) { loadDefaultFlow(); }
    } else { loadDefaultFlow(); }
  }, [injectHandlers, loadDefaultFlow]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  
  const onConnect = useCallback((params) => {
    const isYes = params.sourceHandle === 'yes';
    setEdges((eds) => addEdge({ 
      ...params, 
      animated: isYes,
      label: isYes ? 'SIM' : 'NÃO',
      labelStyle: { fill: isYes ? '#4B5320' : '#991b1b', fontWeight: 900, fontSize: 10 },
      style: { stroke: isYes ? '#4B5320' : '#991b1b', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isYes ? '#4B5320' : '#991b1b' } 
    }, eds));
  }, []);

  const addNode = (type) => {
    const id = `${type}-${Date.now()}`;
    const data = type === 'system' 
      ? { militaryAge: 18, maxRefractoryYears: 10, communicationDeadlineDays: 60, onChange: (f, v) => onNodeDataChange(id, f, v), onDelete: () => deleteNode(id) }
      : { label: 'Novo Item', mult: 1, amparo: '', field: 'enlistmentStatus', operator: 'eq', value: '', onChange: (f, v) => onNodeDataChange(id, f, v), onDelete: () => deleteNode(id) };

    setNodes((nds) => nds.concat({ id, type, position: { x: 100, y: 100 }, data }));
  };

  const exportJSON = () => {
    const flow = { nodes, edges, name: ruleName };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const fileName = ruleName.toLowerCase().replace(/\s+/g, '_') || 'regras_jsm';
    downloadAnchorNode.setAttribute("download", `${fileName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const saveFlow = () => {
    localStorage.setItem('military_flow_rules', JSON.stringify({ nodes, edges, name: ruleName }));
    alert('Regras sincronizadas com sucesso!');
  };

  return (
    <div className="h-screen w-full bg-[#F4F4F0] flex flex-col overflow-hidden font-sans">
      <header className="bg-[#3A3F1C] text-white p-5 flex justify-between items-center z-20 border-b-4 border-[#D4AF37]">
        <div className="flex items-center gap-5">
          <div className="bg-[#D4AF37] p-3 rounded-2xl">
            <Star className="w-7 h-7 text-[#3A3F1C] fill-[#3A3F1C]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">Mapeamento de Interpretação Jurídica</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Documento:</span>
              <input value={ruleName} onChange={e => setRuleName(e.target.value)} className="bg-transparent border-b border-[#4B5320] text-slate-100 text-xs outline-none focus:border-[#D4AF37] w-64 font-mono" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={exportJSON} className="flex items-center gap-2 text-[#D4AF37] hover:text-white px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-[#D4AF37]/30">
            <Download size={14} /> Exportar JSON
          </button>
          <button onClick={() => { if(window.confirm('Resetar fluxo para o padrão federal?')) loadDefaultFlow(); }} className="flex items-center gap-2 text-slate-400 hover:text-rose-400 px-4 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
            <RefreshCw size={14} /> Resetar Padrão
          </button>
          <button onClick={saveFlow} className="flex items-center gap-2 bg-[#D4AF37] hover:bg-yellow-500 px-8 py-3 rounded-2xl text-xs font-black text-[#3A3F1C] shadow-xl transition-all uppercase tracking-[0.2em]">
            <Save size={18} /> Sincronizar Regras
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
          <Background color="#cbd5e1" gap={30} size={1} />
          <Controls />
          
          <Panel position="top-left" className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border-2 border-[#3A3F1C] flex flex-col gap-5 w-80 m-6">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-[#3A3F1C] uppercase tracking-widest">Blocos Estruturais</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Painel de Comando</p>
            </div>
            
            <button onClick={() => addNode('condition')} className="flex items-center gap-4 bg-white hover:bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#4B5320] text-[#3A3F1C] transition-all shadow-sm active:scale-95">
              <div className="bg-[#4B5320] text-[#D4AF37] p-3 rounded-xl shadow-md">
                <Settings2 size={24} />
              </div>
              <div className="text-left leading-tight">
                <div className="font-black text-xs uppercase tracking-tight tracking-tighter">Nova Condição</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Validação Jurídica</div>
              </div>
            </button>

            <button onClick={() => addNode('action')} className="flex items-center gap-4 bg-white hover:bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#4B5320] text-[#3A3F1C] transition-all shadow-sm active:scale-95">
              <div className="bg-[#D4AF37] text-[#3A3F1C] p-3 rounded-xl shadow-md">
                <DollarSign size={24} />
              </div>
              <div className="text-left leading-tight">
                <div className="font-black text-xs uppercase tracking-tight tracking-tighter">Nova Penalidade</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Cálculo Pecuniário</div>
              </div>
            </button>

            <button onClick={() => addNode('system')} className="flex items-center gap-4 bg-[#3A3F1C] hover:bg-[#4B5320] p-5 rounded-2xl border-2 border-[#D4AF37] text-white transition-all shadow-lg active:scale-95">
              <div className="bg-[#D4AF37] text-[#3A3F1C] p-3 rounded-xl shadow-md">
                <Cpu size={24} />
              </div>
              <div className="text-left leading-tight">
                <div className="font-black text-xs uppercase tracking-tight tracking-tighter">Parâmetros do Sistema</div>
                <div className="text-[9px] text-slate-300 font-bold uppercase mt-1 tracking-tighter">Constantes Globais</div>
              </div>
            </button>

            <div className="bg-[#3A3F1C] rounded-2xl p-4 border-2 border-[#D4AF37] space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-[#D4AF37]" />
                <h4 className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Instruções</h4>
              </div>
              <p className="text-[9px] text-slate-300 font-medium leading-relaxed uppercase">
                Conecte os pontos <strong className="text-[#D4AF37]">Dourados</strong> para fluxos positivos (SIM) e os pontos <strong className="text-white">Brancos</strong> para fluxos negativos (NÃO).
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function RuleFlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
