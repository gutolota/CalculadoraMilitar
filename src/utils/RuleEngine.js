/**
 * Motor de Regras Interativo para Calculadora Militar
 * Percorre o fluxograma JSON e gera o extrato de multas baseado nos inputs do usuário.
 */

export const processRules = (flow, userData, baseFee) => {
  if (!flow || !flow.nodes) return { breakdown: [], total: 0, settings: {} };

  const { nodes, edges } = flow;
  let breakdown = [];
  let total = 0;
  let visitedNodes = new Set();
  
  // 1. Extrair Parâmetros Globais (se houver)
  const systemNode = nodes.find(n => n.type === 'system');
  const settings = systemNode ? systemNode.data : { militaryAge: 18, maxRefractoryYears: 10, communicationDeadlineDays: 60 };

  // 2. Encontrar nós iniciais para o fluxo de lógica (ignorando o nó de sistema)
  const targetNodeIds = new Set(edges.map(e => e.target));
  let currentNodes = nodes.filter(n => !targetNodeIds.has(n.id) && n.type !== 'system');

  if (currentNodes.length === 0 && nodes.length > 0) {
    const firstLogicNode = nodes.find(n => n.type !== 'system');
    if (firstLogicNode) currentNodes = [firstLogicNode];
  }

  const executeNode = (node) => {
    if (!node || visitedNodes.has(node.id)) return;
    visitedNodes.add(node.id);

    if (node.type === 'condition') {
      const { field, operator, value } = node.data;
      const userValue = userData[field];
      let isTrue = false;

      const valA = isNaN(userValue) ? userValue : Number(userValue);
      const valB = isNaN(value) ? value : Number(value);

      switch (operator) {
        case 'eq': isTrue = String(valA) === String(valB); break;
        case 'neq': isTrue = String(valA) !== String(valB); break;
        case 'gt': isTrue = Number(valA) > Number(valB); break;
        case 'lt': isTrue = Number(valA) < Number(valB); break;
        default: isTrue = false;
      }

      const handle = isTrue ? 'yes' : 'no';
      const nextEdge = edges.find(e => e.source === node.id && e.sourceHandle === handle);
      
      if (nextEdge) {
        const nextNode = nodes.find(n => n.id === nextEdge.target);
        executeNode(nextNode);
      }
    } 
    
    else if (node.type === 'action') {
      const { label, mult, amparo, multiplyByField, subtractValue } = node.data;
      let finalMult = Number(mult);

      if (multiplyByField && userData[multiplyByField]) {
        const factor = Math.max(0, Number(userData[multiplyByField]) - (Number(subtractValue) || 0));
        finalMult = finalMult * factor;
      }

      if (finalMult > 0) {
        const amount = finalMult * baseFee;
        breakdown.push({ label, amparo, mult: finalMult, amount });
        total += amount;
      }

      const nextEdge = edges.find(e => e.source === node.id && !e.sourceHandle);
      if (nextEdge) {
        const nextNode = nodes.find(n => n.id === nextEdge.target);
        executeNode(nextNode);
      }
    }
  };

  currentNodes.forEach(node => executeNode(node));

  return { breakdown, total, settings, hasItems: breakdown.length > 0 };
};
