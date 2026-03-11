import React, { useState, useMemo } from 'react';
import { Calculator, AlertCircle, CheckCircle2, Receipt, Settings, User, FileText, ShieldAlert, Calendar, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  // --- CONFIGURAÇÕES BASE E REGRAS DINÂMICAS ---
  const [baseFee, setBaseFee] = useState(6.46);
  const [showSettings, setShowSettings] = useState(false);

  // Todas as regras e multiplicadores agora são editáveis
  const [rules, setRules] = useState({
    // Alistamento e Seleção
    alistamentoAtraso: 1,
    alistamentoMultiplo: 3,
    refratario1: 1,
    refratario2: 5,
    refratario3Mais: 5,
    // EXAR e Reserva (Atualizado Decreto 12664/2025 RCORE)
    exarPracaR2: 3,
    exarMfdv: 5,
    convocacaoPracaR2: 3,
    convocacaoMfdv: 15,
    residenciaPracaR2: 3,
    residenciaMfdv: 15,
    // Extravios e Taxas
    extravio: 3,
    taxaEmissao: 1,
    // MFDV Específico
    mfdvAdiamento: 1,
    mfdvDiploma: 5
  });

  const handleRuleChange = (key, value) => {
    setRules(prev => ({ ...prev, [key]: Number(value) }));
  };

  // --- ESTADOS DO FORMULÁRIO DO CIDADÃO ---
  const [birthYear, setBirthYear] = useState(2006);
  const [exemption, setExemption] = useState('none');

  // Alistamento e Seleção
  const [enlistmentStatus, setEnlistmentStatus] = useState('on_time');
  const [multipleEnlistments, setMultipleEnlistments] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState('ok');
  const [refractoryYears, setRefractoryYears] = useState(2);

  // Reserva e MFDV (Agrupados)
  const [reserveCategory, setReserveCategory] = useState('praca_r2'); // 'praca_r2' | 'oficial_mfdv'
  const [exarMissedYears, setExarMissedYears] = useState(0);
  const [missedConvocacao, setMissedConvocacao] = useState(false);
  const [missedResidencia, setMissedResidencia] = useState(false);
  const [mfdvMissedRenewals, setMfdvMissedRenewals] = useState(0);
  const [mfdvLateDiploma, setMfdvLateDiploma] = useState(false);

  // Documentos
  const [taxRequests, setTaxRequests] = useState({ cdi: false, cdsa: false, adiamento: false });
  const [lostDocs, setLostDocs] = useState({ cam: false, cr_csm: false, cdi_ci_cdsa: false });

  // Toggle helpers
  const handleTaxToggle = (key) => setTaxRequests(prev => ({...prev, [key]: !prev[key]}));
  const handleLostDocsToggle = (key) => setLostDocs(prev => ({...prev, [key]: !prev[key]}));

  // --- MOTOR DE CÁLCULO ---
  const calculations = useMemo(() => {
    let breakdown = [];
    let total = 0;
    
    // 1. ALISTAMENTO
    if (enlistmentStatus === 'late') {
      const mult = rules.alistamentoAtraso;
      breakdown.push({ label: 'Apresentar-se fora do prazo para alistamento', amparo: 'Art 176 RLSM', mult, amount: mult * baseFee });
      total += mult * baseFee;
    }
    if (multipleEnlistments) {
      const mult = rules.alistamentoMultiplo;
      breakdown.push({ label: 'Alistar-se mais de uma vez', amparo: 'Art 44/177 RLSM', mult, amount: mult * baseFee });
      total += mult * baseFee;
    }

    // 2. SELEÇÃO (REFRATÁRIO)
    if (selectionStatus === 'missed' && refractoryYears > 0) {
      if (refractoryYears >= 1) {
        breakdown.push({ label: 'Faltar à CS pela 1ª vez (Refratário)', amparo: 'Art 176 RLSM', mult: rules.refratario1, amount: rules.refratario1 * baseFee });
        total += rules.refratario1 * baseFee;
      }
      if (refractoryYears >= 2) {
        breakdown.push({ label: 'Faltar à CS pela 2ª vez (Refratário)', amparo: 'Art 178 RLSM', mult: rules.refratario2, amount: rules.refratario2 * baseFee });
        total += rules.refratario2 * baseFee;
      }
      if (refractoryYears >= 3) {
        const extraYears = refractoryYears - 2;
        const mult = extraYears * rules.refratario3Mais;
        breakdown.push({ label: `Faltar à CS após a 2ª vez (${extraYears}x)`, amparo: 'Art 178 RLSM', mult, amount: mult * baseFee });
        total += mult * baseFee;
      }
    }

    // 3. OBRIGAÇÕES DA RESERVA E ATUALIZAÇÕES (Novo Decreto RCORE)
    const isMfdv = reserveCategory === 'oficial_mfdv';

    if (exarMissedYears > 0) {
      const multBase = isMfdv ? rules.exarMfdv : rules.exarPracaR2;
      const amparo = isMfdv ? 'Art. 52/58 LMFDV' : 'Art. 47 LSM / Art. 177 RLSM';
      const multTotal = exarMissedYears * multBase;
      breakdown.push({ 
        label: `Falta EXAR (${exarMissedYears}x - ${isMfdv ? 'Oficiais MFDV' : 'Praças/Oficiais R/2'})`, 
        amparo, mult: multTotal, amount: multTotal * baseFee 
      });
      total += multTotal * baseFee;
    }

    if (missedConvocacao) {
      const mult = isMfdv ? rules.convocacaoMfdv : rules.convocacaoPracaR2;
      const amparo = isMfdv ? 'Art. 60(a) LMFDV' : 'Art. 47 LSM / Art. 177 RLSM';
      breakdown.push({ label: 'Falta à Convocação', amparo, mult, amount: mult * baseFee });
      total += mult * baseFee;
    }

    if (missedResidencia) {
      const mult = isMfdv ? rules.residenciaMfdv : rules.residenciaPracaR2;
      const amparo = isMfdv ? 'Art. 60(b) LMFDV' : 'Art. 47 LSM / Art. 177 RLSM';
      breakdown.push({ label: 'Não comunicou mudança de residência (60 dias)', amparo, mult, amount: mult * baseFee });
      total += mult * baseFee;
    }

    // 4. MFDV ESPECÍFICOS (Adiamento e Diploma)
    if (mfdvMissedRenewals > 0) {
      const mult = mfdvMissedRenewals * rules.mfdvAdiamento;
      breakdown.push({ label: `Deixar de renovar adiamento (${mfdvMissedRenewals}x)`, amparo: 'Art 73-75 RLMFDV', mult, amount: mult * baseFee });
      total += mult * baseFee;
    }
    if (mfdvLateDiploma) {
      const mult = rules.mfdvDiploma;
      breakdown.push({ label: 'Atraso apresentação diploma (>60 dias)', amparo: 'Art 58 LMFDV', mult, amount: mult * baseFee });
      total += mult * baseFee;
    }

    // 5. EXTRAVIOS (Multa 3x editável)
    const multExtravio = rules.extravio;
    if (lostDocs.cam) { breakdown.push({ label: 'Extravio/Inutilização do CAM', amparo: 'Art 177 RLSM', mult: multExtravio, amount: multExtravio * baseFee }); total += multExtravio * baseFee; }
    if (lostDocs.cr_csm) { breakdown.push({ label: 'Extravio/Inutilização do CR/CSM', amparo: 'Art 177 RLSM', mult: multExtravio, amount: multExtravio * baseFee }); total += multExtravio * baseFee; }
    if (lostDocs.cdi_ci_cdsa) { breakdown.push({ label: 'Extravio do CDI, CI ou CDSA', amparo: 'Art 177 RLSM', mult: multExtravio, amount: multExtravio * baseFee }); total += multExtravio * baseFee; }

    // 6. TAXAS (1x editável)
    const multTaxa = rules.taxaEmissao;
    if (taxRequests.cdi) { breakdown.push({ label: 'Requerer CDI', amparo: 'Art 107 RLSM', mult: multTaxa, amount: multTaxa * baseFee }); total += multTaxa * baseFee; }
    if (taxRequests.cdsa) { breakdown.push({ label: 'Requerer CDSA', amparo: 'Art 43 RLPSA', mult: multTaxa, amount: multTaxa * baseFee }); total += multTaxa * baseFee; }
    if (taxRequests.adiamento) { breakdown.push({ label: 'Requerer adiamento de incorporação', amparo: 'Art 103 RLSM', mult: multTaxa, amount: multTaxa * baseFee }); total += multTaxa * baseFee; }

    // 7. ISENÇÕES
    const isExempt = exemption !== 'none';
    if (isExempt && total > 0) {
      breakdown.push({ label: `Isenção por Impossibilidade de Pagamento`, amparo: 'Art 225 RLSM', mult: 0, amount: -total });
      total = 0;
    }

    return { breakdown, total: Math.max(0, total), isExempt, hasItems: breakdown.length > 0 };
  }, [baseFee, rules, enlistmentStatus, multipleEnlistments, selectionStatus, refractoryYears, reserveCategory, exarMissedYears, missedConvocacao, missedResidencia, mfdvMissedRenewals, mfdvLateDiploma, lostDocs, taxRequests, exemption]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="mx-auto space-y-6">
        
        {/* HEADER E CONFIGURAÇÕES */}
        <header className="bg-emerald-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Calculadora JSM (Decreto 12664/2025)
            </h1>
            <p className="text-emerald-200 mt-1 text-sm">Atualizada com as novas penalidades pecuniárias do RCORE.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded-lg text-sm font-bold transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Regras e Multiplicadores {showSettings ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
            </button>
            <div className="bg-emerald-950/50 p-2 px-3 rounded-lg border border-emerald-800 flex items-center gap-2">
              <label className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Base (R$)</label>
              <input 
                type="number" step="0.01" value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-20 px-2 py-1 bg-white rounded text-slate-900 font-bold outline-none"
              />
            </div>
          </div>
        </header>

        {/* PAINEL DE CONFIGURAÇÕES DE REGRAS (EXPANSÍVEL) */}
        {showSettings && (
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" /> Configuração de Multiplicadores (Padrões da Lei)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-3 bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="font-bold text-slate-600 border-b pb-1">Seleção e Alistamento</h4>
                <div className="flex justify-between items-center"><label>Alistamento Atrasado</label><input type="number" value={rules.alistamentoAtraso} onChange={e => handleRuleChange('alistamentoAtraso', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Refratário (1ª vez)</label><input type="number" value={rules.refratario1} onChange={e => handleRuleChange('refratario1', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Refratário (2ª vez)</label><input type="number" value={rules.refratario2} onChange={e => handleRuleChange('refratario2', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Refratário (3ª+ vez)</label><input type="number" value={rules.refratario3Mais} onChange={e => handleRuleChange('refratario3Mais', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
              </div>
              <div className="space-y-3 bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="font-bold text-slate-600 border-b pb-1">Reserva (Praças e Oficiais R/2)</h4>
                <div className="flex justify-between items-center"><label>Falta EXAR</label><input type="number" value={rules.exarPracaR2} onChange={e => handleRuleChange('exarPracaR2', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Falta Convocação</label><input type="number" value={rules.convocacaoPracaR2} onChange={e => handleRuleChange('convocacaoPracaR2', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Não informou residência</label><input type="number" value={rules.residenciaPracaR2} onChange={e => handleRuleChange('residenciaPracaR2', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Multa Padrão Extravio</label><input type="number" value={rules.extravio} onChange={e => handleRuleChange('extravio', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
              </div>
              <div className="space-y-3 bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="font-bold text-purple-800 border-b border-purple-200 pb-1">Reserva (Oficiais MFDV)</h4>
                <div className="flex justify-between items-center"><label>Falta EXAR MFDV</label><input type="number" value={rules.exarMfdv} onChange={e => handleRuleChange('exarMfdv', e.target.value)} className="w-16 border rounded p-1 text-center" /></div>
                <div className="flex justify-between items-center"><label>Falta Convocação MFDV</label><input type="number" value={rules.convocacaoMfdv} onChange={e => handleRuleChange('convocacaoMfdv', e.target.value)} className="w-16 border rounded p-1 text-center text-red-600 font-bold" /></div>
                <div className="flex justify-between items-center"><label>Não inf. residência MFDV</label><input type="number" value={rules.residenciaMfdv} onChange={e => handleRuleChange('residenciaMfdv', e.target.value)} className="w-16 border rounded p-1 text-center text-red-600 font-bold" /></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PAINEL CENTRAL - FLUXO DE TRIAGEM */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Etapa 1: Dados e Alistamento */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold border-b pb-3 mb-5 flex items-center gap-2 text-emerald-800">
                <User className="w-5 h-5" /> 1. Dados e Situação de Alistamento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ano de Nascimento</label>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-slate-400 absolute ml-3" />
                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-full pl-10 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Situação Financeira</label>
                  <select value={exemption} onChange={(e) => setExemption(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50">
                    <option value="none">Capacidade de Pagamento Normal</option>
                    <option value="low_income">Comprovou Impossibilidade (Isento)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700">Como foi o Alistamento?</label>
                <select value={enlistmentStatus} onChange={(e) => setEnlistmentStatus(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="on_time">No prazo correto / Já regularizado sem novas multas</option>
                  <option value="late">Fora do prazo legal (Atrasado)</option>
                </select>

                <label className="flex items-center gap-3 mt-2">
                  <input type="checkbox" checked={multipleEnlistments} onChange={(e) => setMultipleEnlistments(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-sm text-slate-700">Alistou-se mais de uma vez?</span>
                </label>
              </div>
            </section>

            {/* Etapa 2 e 3: Seleção e Reserva (Reestruturado para o Decreto) */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold border-b pb-3 mb-5 flex items-center gap-2 text-emerald-800">
                <ShieldAlert className="w-5 h-5" /> 2. Seleção Geral e Obrigações da Reserva
              </h2>
              
              <div className="space-y-6">
                {/* Seleção */}
                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Comissão de Seleção (CS)</label>
                  <select value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value)} className="w-full p-2 border border-amber-200 rounded focus:ring-2 focus:ring-amber-500 outline-none mb-3">
                    <option value="ok">Compareceu normalmente ou dispensado</option>
                    <option value="missed">Faltou à Seleção (Cidadão Refratário)</option>
                  </select>

                  {selectionStatus === 'missed' && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-amber-200">
                      <span className="text-sm text-slate-700 font-medium">Quantos anos faltou à CS?</span>
                      <input type="number" min="1" value={refractoryYears} onChange={(e) => setRefractoryYears(Number(e.target.value))} className="w-20 p-2 border border-amber-300 rounded text-center outline-none focus:border-amber-500 font-mono text-lg" />
                    </div>
                  )}
                </div>

                {/* Obrigações da Reserva (EXAR, Convocação, Endereço) */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria na Reserva</label>
                    <select value={reserveCategory} onChange={(e) => setReserveCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700">
                      <option value="praca_r2">Praça ou Oficial R/2 (Regra Geral)</option>
                      <option value="oficial_mfdv">Oficial MFDV (Médico, Farmacêutico, Dentista, Vet)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 font-medium flex-1">Faltou ao EXAR:</span>
                      <input type="number" min="0" value={exarMissedYears} onChange={(e) => setExarMissedYears(Number(e.target.value))} className="w-16 p-2 border border-slate-300 rounded text-center outline-none focus:border-emerald-500 font-mono" />
                      <span className="text-sm text-slate-500">vez(es)</span>
                    </div>

                    {reserveCategory === 'oficial_mfdv' && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-700 font-medium flex-1">Não renovou adiamento:</span>
                        <input type="number" min="0" value={mfdvMissedRenewals} onChange={(e) => setMfdvMissedRenewals(Number(e.target.value))} className="w-16 p-2 border border-slate-300 rounded text-center outline-none font-mono" />
                        <span className="text-sm text-slate-500">ano(s)</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-100 p-2 rounded border border-transparent hover:border-slate-200">
                      <input type="checkbox" checked={missedConvocacao} onChange={(e) => setMissedConvocacao(e.target.checked)} className="w-4 h-4 rounded text-emerald-600" />
                      <span className="font-medium">Deixou de se apresentar quando convocado</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-100 p-2 rounded border border-transparent hover:border-slate-200">
                      <input type="checkbox" checked={missedResidencia} onChange={(e) => setMissedResidencia(e.target.checked)} className="w-4 h-4 rounded text-emerald-600" />
                      <span className="font-medium">Não comunicou mudança de residência (60 dias)</span>
                    </label>
                    {reserveCategory === 'oficial_mfdv' && (
                       <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-100 p-2 rounded border border-transparent hover:border-slate-200">
                       <input type="checkbox" checked={mfdvLateDiploma} onChange={(e) => setMfdvLateDiploma(e.target.checked)} className="w-4 h-4 rounded text-emerald-600" />
                       <span className="font-medium">Atraso na apresentação de diploma ({'>'}60 dias)</span>
                     </label>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Etapa 4: Documentos e Extravios */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold border-b pb-3 mb-5 flex items-center gap-2 text-emerald-800">
                <FileText className="w-5 h-5" /> 3. Solicitações e Extravios de Documentos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Taxas */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 bg-slate-100 p-2 rounded">Emissões (Taxa Base)</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input type="checkbox" checked={taxRequests.cdi} onChange={() => handleTaxToggle('cdi')} className="w-4 h-4 rounded text-emerald-600" />
                      Requerer CDI (1ª e demais vias)
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input type="checkbox" checked={taxRequests.cdsa} onChange={() => handleTaxToggle('cdsa')} className="w-4 h-4 rounded text-emerald-600" />
                      Requerer CDSA (1ª e demais vias)
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input type="checkbox" checked={taxRequests.adiamento} onChange={() => handleTaxToggle('adiamento')} className="w-4 h-4 rounded text-emerald-600" />
                      Requerer Adiamento de Incorporação
                    </label>
                  </div>
                </div>

                {/* Extravios */}
                <div>
                  <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 bg-red-50 p-2 rounded">Extravios (Multas)</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={lostDocs.cam} onChange={() => handleLostDocsToggle('cam')} className="w-4 h-4 rounded text-red-600" />
                      Extravio do CAM
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={lostDocs.cr_csm} onChange={() => handleLostDocsToggle('cr_csm')} className="w-4 h-4 rounded text-red-600" />
                      Extravio do CR ou CSM
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={lostDocs.cdi_ci_cdsa} onChange={() => handleLostDocsToggle('cdi_ci_cdsa')} className="w-4 h-4 rounded text-red-600" />
                      Extravio do CDI, CI ou CDSA
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* PAINEL LATERAL - EXTRATO DE RECOLHIMENTO */}
          <div className="lg:col-span-5">
            <div className="bg-white border-2 border-slate-800 rounded-xl shadow-2xl sticky top-6 overflow-hidden flex flex-col h-[calc(100vh-3rem)] max-h-[850px]">
              
              <div className="bg-slate-800 text-white p-5">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Receipt className="w-6 h-6" /> Extrato de Recolhimento
                </h2>
                <p className="text-slate-300 text-sm mt-1">Cidadão nascido em {birthYear}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                {!calculations.hasItems ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <CheckCircle2 className="w-12 h-12 text-slate-300" />
                    <p className="text-center">Nenhuma taxa ou multa selecionada.<br/>Situação regular sem custos.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {calculations.breakdown.map((item, index) => (
                      <li key={index} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-sm font-semibold text-slate-800 leading-tight">
                            {item.label}
                          </span>
                          <span className={`font-mono font-bold whitespace-nowrap text-right ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {item.amount < 0 ? '-' : ''} R$ {Math.abs(item.amount).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        
                        {item.amount >= 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.amparo}
                            </span>
                            <span className="text-slate-400 font-mono">
                              ({item.mult}x R$ {baseFee.toFixed(2).replace('.', ',')})
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white p-5 border-t-2 border-slate-800 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total a Pagar</span>
                    <span className="block text-xs text-slate-400 font-mono">
                      (Soma de {calculations.hasItems && !calculations.isExempt ? calculations.breakdown.reduce((acc, curr) => acc + curr.mult, 0) : 0} multiplicadores)
                    </span>
                  </div>
                  <span className={`text-3xl font-bold font-mono ${calculations.isExempt ? 'text-emerald-500' : 'text-slate-900'}`}>
                    R$ {calculations.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 font-medium">
                  A JSM não está autorizada a receber valores em mãos. Emita a GRU ou chave PIX correspondente.
                </div>

                <button 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 font-bold uppercase tracking-wide text-sm"
                  onClick={() => window.print()}
                >
                  <FileText className="w-4 h-4" />
                  Imprimir Comprovante
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}