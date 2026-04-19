import React, { useState, useCallback, useEffect } from 'react';
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
import { Save, RefreshCw, DollarSign, Settings2, ShieldAlert, Zap, Trash2, Download, Cpu, BookOpen } from 'lucide-react';

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

    { id: 'q1', type: 'condition', position: { x: 500, y: 0 }, data: { field: 'enlistmentStatus', operator: 'eq', value: 'late', label: 'Alistamento Atrasado?' } },
    { id: 'a1', type: 'action', position: { x: 50, y: 250 }, data: { label: 'Multa Art 176 (Atraso)', mult: 1, amparo: 'Art 176 RLSM' } },

    { id: 'q2', type: 'condition', position: { x: 500, y: 500 }, data: { field: 'multipleEnlistments', operator: 'eq', value: 'true', label: 'Alistamento Múltiplo?' } },
    { id: 'a2', type: 'action', position: { x: 50, y: 750 }, data: { label: 'Multa Art 177 (Múltiplo)', mult: 3, amparo: 'Art 177 RLSM' } },

    { id: 'q-check-ref', type: 'condition', position: { x: 500, y: 1000 }, data: { field: 'selectionStatus', operator: 'eq', value: 'missed', label: 'Faltou à Seleção (CS)?' } },

    { id: 'q3', type: 'condition', position: { x: 700, y: 1250 }, data: { field: 'refractoryYears', operator: 'gt', value: '0', label: 'Refratário (1ª Falta)?' } },
    { id: 'a3', type: 'action', position: { x: 250, y: 1500 }, data: { label: 'Falta CS (1ª vez)', mult: 1, amparo: 'Art 176 RLSM' } },

    { id: 'q4', type: 'condition', position: { x: 700, y: 1750 }, data: { field: 'refractoryYears', operator: 'gt', value: '1', label: 'Refratário (2ª Falta)?' } },
    { id: 'a4', type: 'action', position: { x: 250, y: 2000 }, data: { label: 'Falta CS (2ª vez)', mult: 5, amparo: 'Art 178 RLSM' } },

    { id: 'q5', type: 'condition', position: { x: 700, y: 2250 }, data: { field: 'refractoryYears', operator: 'gt', value: '2', label: 'Refratário (3ª Falta em diante)?' } },
    { id: 'a5', type: 'action', position: { x: 250, y: 2500 }, data: { label: 'Faltas Extras CS', mult: 5, amparo: 'Art 178 RLSM', multiplyByField: 'refractoryYears', subtractValue: 2 } },

    { id: 'q6', type: 'condition', position: { x: 500, y: 2800 }, data: { field: 'reserveCategory', operator: 'eq', value: 'oficial_mfdv', label: 'É MFDV?' } },

    { id: 'q6a', type: 'condition', position: { x: 200, y: 3100 }, data: { field: 'exarMissedYears', operator: 'gt', value: '0', label: 'Falta EXAR MFDV?' } },
    { id: 'a6a', type: 'action', position: { x: 50, y: 3400 }, data: { label: 'Multa EXAR MFDV', mult: 5, amparo: 'Art. 52 LMFDV', multiplyByField: 'exarMissedYears' } },

    { id: 'q6b', type: 'condition', position: { x: 200, y: 3700 }, data: { field: 'missedConvocacao', operator: 'eq', value: 'true', label: 'Falta Convocação MFDV?' } },
    { id: 'a6b', type: 'action', position: { x: 50, y: 4000 }, data: { label: 'Falta Convocação MFDV', mult: 15, amparo: 'Art. 60 LMFDV' } },

    { id: 'q7a', type: 'condition', position: { x: 800, y: 3100 }, data: { field: 'exarMissedYears', operator: 'gt', value: '0', label: 'Falta EXAR Praça?' } },
    { id: 'a7a', type: 'action', position: { x: 600, y: 3400 }, data: { label: 'Multa EXAR Praça', mult: 3, amparo: 'Art. 47 LSM', multiplyByField: 'exarMissedYears' } },

    { id: 'q7b', type: 'condition', position: { x: 800, y: 3700 }, data: { field: 'missedConvocacao', operator: 'eq', value: 'true', label: 'Falta Convocação Praça?' } },
    { id: 'a7b', type: 'action', position: { x: 600, y: 4000 }, data: { label: 'Falta Convocação Praça', mult: 3, amparo: 'Art. 47 LSM' } },

    { id: 'q8', type: 'condition', position: { x: 500, y: 4400 }, data: { field: 'certificateType', operator: 'eq', value: 'analogico', label: 'Certificado Analógico?' } },
    { id: 'q8a', type: 'condition', position: { x: 250, y: 4700 }, data: { field: 'analogLegible', operator: 'eq', value: 'false', label: 'Não legível/Extraviado?' } },
    { id: 'q8b', type: 'condition', position: { x: 50, y: 5000 }, data: { field: 'lostDocs_cdi_ci_cdsa', operator: 'eq', value: 'true', label: 'Extraviou CDI/CI/CDSA?' } },
    { id: 'a8', type: 'action', position: { x: 50, y: 5300 }, data: { label: 'Multa Extravio', mult: 3, amparo: 'Art 177 RLSM' } },
  ],
  edges: [
    { id: 'e1-y', source: 'q1', sourceHandle: 'yes', target: 'a1', label: 'SIM', animated: true, style: { stroke: '#16a34a', strokeWidth: 3 }, labelStyle: { fill: '#16a34a', fontWeight: 900 } },
    { id: 'e1-n', source: 'q1', sourceHandle: 'no', target: 'q2', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e1-next', source: 'a1', target: 'q2' },
    { id: 'e2-y', source: 'q2', sourceHandle: 'yes', target: 'a2', label: 'SIM', animated: true, style: { stroke: '#16a34a', strokeWidth: 3 } },
    { id: 'e2-n', source: 'q2', sourceHandle: 'no', target: 'q-check-ref', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e2-next', source: 'a2', target: 'q-check-ref' },

    { id: 'e-ref-y', source: 'q-check-ref', sourceHandle: 'yes', target: 'q3', label: 'SIM', animated: true, style: { stroke: '#16a34a' } },
    { id: 'e-ref-n', source: 'q-check-ref', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },

    { id: 'e3-y', source: 'q3', sourceHandle: 'yes', target: 'a3', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e3-n', source: 'q3', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e3-next', source: 'a3', target: 'q4' },
    { id: 'e4-y', source: 'q4', sourceHandle: 'yes', target: 'a4', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e4-n', source: 'q4', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e4-next', source: 'a4', target: 'q5' },
    { id: 'e5-y', source: 'q5', sourceHandle: 'yes', target: 'a5', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e5-n', source: 'q5', sourceHandle: 'no', target: 'q6', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e5-next', source: 'a5', target: 'q6' },
    { id: 'e6-y', source: 'q6', sourceHandle: 'yes', target: 'q6a', label: 'SIM (MFDV)', style: { stroke: '#16a34a' } },
    { id: 'e6-n', source: 'q6', sourceHandle: 'no', target: 'q7a', label: 'NÃO (PRAÇA)', style: { stroke: '#64748b' } },
    { id: 'e6a-y', source: 'q6a', sourceHandle: 'yes', target: 'a6a', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e6a-n', source: 'q6a', sourceHandle: 'no', target: 'q6b', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e6a-next', source: 'a6a', target: 'q6b' },
    { id: 'e6b-y', source: 'q6b', sourceHandle: 'yes', target: 'a6b', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e6b-n', source: 'q6b', sourceHandle: 'no', target: 'q8', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e6b-next', source: 'a6b', target: 'q8' },
    { id: 'e7a-y', source: 'q7a', sourceHandle: 'yes', target: 'a7a', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e7a-n', source: 'q7a', sourceHandle: 'no', target: 'q7b', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e7a-next', source: 'a7a', target: 'q7b' },
    { id: 'e7b-y', source: 'q7b', sourceHandle: 'yes', target: 'a7b', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e7b-n', source: 'q7b', sourceHandle: 'no', target: 'q8', label: 'NÃO', style: { stroke: '#991b1b' } },
    { id: 'e7b-next', source: 'a7b', target: 'q8' },
    { id: 'e8-y', source: 'q8', sourceHandle: 'yes', target: 'q8a', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e8a-y', source: 'q8a', sourceHandle: 'yes', target: 'q8b', label: 'SIM', style: { stroke: '#16a34a' } },
    { id: 'e8b-y', source: 'q8b', sourceHandle: 'yes', target: 'a8', label: 'SIM', style: { stroke: '#16a34a' } },
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
        if (parsed.nodes && parsed.edges) {
          setNodes(injectHandlers(parsed.nodes));
          setEdges(parsed.edges);
          if (parsed.name) setRuleName(parsed.name);
        } else { loadDefaultFlow(); }
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
      labelStyle: { fill: isYes ? '#16a34a' : '#991b1b', fontWeight: 900, fontSize: 10 },
      style: { stroke: isYes ? '#16a34a' : '#991b1b', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isYes ? '#16a34a' : '#991b1b' }
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

  const actionNodes = nodes.filter(n => n.type === 'action');
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;
  const [showCommandPanel, setShowCommandPanel] = useState(isDesktop);
  const [showAmparosPanel, setShowAmparosPanel] = useState(isDesktop);

  return (
    <div className="h-screen w-full bg-green-50 flex flex-col overflow-hidden font-sans">
      <header className="bg-green-700 text-white px-3 py-3 flex justify-between items-center z-20 border-b-4 border-green-300 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-green-300 p-2 rounded-xl shrink-0">
            <ShieldAlert className="w-5 h-5 text-green-800" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight uppercase leading-tight hidden sm:block">Interpretação Jurídica</h1>
            <div className="flex items-center gap-1">
              <input value={ruleName} onChange={e => setRuleName(e.target.value)} className="bg-transparent border-b border-green-600 text-slate-100 text-[10px] outline-none focus:border-green-300 w-36 sm:w-56 font-mono" />
            </div>
          </div>
        </div>

        <div className="flex gap-1 sm:gap-2 shrink-0">
          <button onClick={exportJSON} className="flex items-center gap-1 text-green-300 hover:text-white p-2 sm:px-3 sm:py-2 rounded-lg transition-all text-xs font-black border border-green-300/30" title="Exportar JSON">
            <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => { if(window.confirm('Resetar fluxo para o padrão federal?')) loadDefaultFlow(); }} className="flex items-center gap-1 text-slate-400 hover:text-rose-400 p-2 sm:px-3 sm:py-2 rounded-lg transition-all text-xs font-black" title="Resetar Padrão">
            <RefreshCw size={14} /> <span className="hidden sm:inline">Resetar</span>
          </button>
          <button onClick={saveFlow} className="flex items-center gap-1 bg-green-300 hover:bg-green-200 px-3 py-2 sm:px-5 rounded-xl text-xs font-black text-green-800 shadow-lg transition-all">
            <Save size={14} /> <span className="hidden xs:inline">Sincronizar</span>
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} fitView>
          <Background color="#bbf7d0" gap={30} size={1} />
          <Controls />

          <Panel position="top-left" className="m-2 sm:m-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-green-700 overflow-hidden w-56 sm:w-72">
              <button
                onClick={() => setShowCommandPanel(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-green-700 text-white hover:bg-green-600 transition-colors"
              >
                <span className="text-xs font-black uppercase tracking-widest">Painel de Comando</span>
                <span className="text-green-300 text-lg leading-none">{showCommandPanel ? '−' : '+'}</span>
              </button>

              {showCommandPanel && (
                <div className="p-3 flex flex-col gap-2">
                  <button onClick={() => addNode('condition')} className="flex items-center gap-3 bg-white hover:bg-slate-50 px-3 py-3 rounded-xl border-2 border-slate-100 hover:border-green-600 text-green-800 transition-all shadow-sm active:scale-95">
                    <div className="bg-green-600 text-green-200 p-2 rounded-lg shrink-0">
                      <Settings2 size={18} />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="font-black text-xs uppercase">Nova Condição</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Validação Jurídica</div>
                    </div>
                  </button>

                  <button onClick={() => addNode('action')} className="flex items-center gap-3 bg-white hover:bg-slate-50 px-3 py-3 rounded-xl border-2 border-slate-100 hover:border-green-600 text-green-800 transition-all shadow-sm active:scale-95">
                    <div className="bg-green-300 text-green-800 p-2 rounded-lg shrink-0">
                      <DollarSign size={18} />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="font-black text-xs uppercase">Nova Penalidade</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Cálculo Pecuniário</div>
                    </div>
                  </button>

                  <button onClick={() => addNode('system')} className="flex items-center gap-3 bg-green-700 hover:bg-green-600 px-3 py-3 rounded-xl border-2 border-green-300 text-white transition-all shadow-lg active:scale-95">
                    <div className="bg-green-300 text-green-800 p-2 rounded-lg shrink-0">
                      <Cpu size={18} />
                    </div>
                    <div className="text-left leading-tight">
                      <div className="font-black text-xs uppercase">Parâmetros Globais</div>
                      <div className="text-[9px] text-green-300 font-bold uppercase">Constantes do Sistema</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </Panel>

          <Panel position="top-right" className="m-2 sm:m-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-green-600 overflow-hidden w-56 sm:w-72">
              <button
                onClick={() => setShowAmparosPanel(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-700 text-white hover:bg-green-600 transition-colors"
              >
                <BookOpen size={15} className="text-green-300 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest flex-1 text-left">Amparos do Fluxo</span>
                <span className="text-[9px] font-mono text-green-300 bg-green-800 px-1.5 py-0.5 rounded">{actionNodes.length}</span>
                <span className="text-green-300 text-lg leading-none ml-1">{showAmparosPanel ? '−' : '+'}</span>
              </button>

              {showAmparosPanel && (
                actionNodes.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase">Nenhuma ação no fluxo</div>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_36px_1fr] gap-1 px-3 py-1.5 bg-green-50 border-b border-green-100">
                      <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Ocasião</span>
                      <span className="text-[8px] font-black text-green-700 uppercase tracking-widest text-center">Mult</span>
                      <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Amparo</span>
                    </div>
                    <div className="divide-y divide-green-50 max-h-64 sm:max-h-80 overflow-y-auto">
                      {actionNodes.map(n => (
                        <div key={n.id} className="grid grid-cols-[1fr_36px_1fr] gap-1 items-center px-3 py-2 hover:bg-green-50 transition-colors">
                          <input
                            className="nodrag text-[10px] font-bold text-slate-700 bg-transparent outline-none focus:bg-white focus:border focus:border-green-300 focus:rounded px-1 truncate w-full"
                            value={n.data.label || ''}
                            onChange={(e) => onNodeDataChange(n.id, 'label', e.target.value)}
                            title={n.data.label}
                          />
                          <input
                            type="number"
                            className="nodrag nowheel w-full text-[10px] font-mono font-black text-green-800 bg-green-50 border border-green-200 rounded text-center outline-none focus:border-green-600 px-0.5"
                            value={n.data.mult ?? 0}
                            onChange={(e) => onNodeDataChange(n.id, 'mult', Number(e.target.value))}
                          />
                          <input
                            className="nodrag text-[9px] font-mono text-green-700 bg-green-50 border border-green-100 rounded px-1 py-0.5 outline-none focus:border-green-500 w-full"
                            value={n.data.amparo || ''}
                            onChange={(e) => onNodeDataChange(n.id, 'amparo', e.target.value)}
                            placeholder="Art..."
                          />
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2 bg-green-50 border-t border-green-100">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Edite e clique em Sincronizar para salvar</p>
                    </div>
                  </>
                )
              )}
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
