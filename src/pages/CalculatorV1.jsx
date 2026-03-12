import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle2, Receipt, Settings, User, FileText, ShieldAlert, Calendar, SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

// Extraímos as regras padrão para podermos usá-las tanto na inicialização quanto no botão de resetar
const DEFAULT_RULES = {
  alistamentoAtraso: { mult: 1, amparo: 'Art 176 RLSM' },
  alistamentoMultiplo: { mult: 3, amparo: 'Art 44/177 RLSM' },
  refratario1: { mult: 1, amparo: 'Art 176 RLSM' },
  refratario2: { mult: 5, amparo: 'Art 178 RLSM' },
  refratario3Mais: { mult: 5, amparo: 'Art 178 RLSM' },
  exarPracaR2: { mult: 3, amparo: 'Art. 47 LSM / Art. 177 RLSM' },
  exarMfdv: { mult: 5, amparo: 'Art. 52/58 LMFDV' },
  convocacaoPracaR2: { mult: 3, amparo: 'Art. 47 LSM / Art. 177 RLSM' },
  convocacaoMfdv: { mult: 15, amparo: 'Art. 60(a) LMFDV' },
  residenciaPracaR2: { mult: 3, amparo: 'Art. 47 LSM / Art. 177 RLSM' },
  residenciaMfdv: { mult: 15, amparo: 'Art. 60(b) LMFDV' },
  mfdvAdiamento: { mult: 1, amparo: 'Art 73-75 RLMFDV' },
  mfdvDiploma: { mult: 5, amparo: 'Art 58 LMFDV' },
  extravioCam: { mult: 3, amparo: 'Art 177 RLSM' },
  extravioCrCsm: { mult: 3, amparo: 'Art 177 RLSM' },
  extravioCdiCiCdsa: { mult: 3, amparo: 'Art 177 RLSM' },
  taxaCdi: { mult: 1, amparo: 'Art 107 RLSM' },
  taxaCdsa: { mult: 1, amparo: 'Art 43 RLPSA' },
  taxaAdiamento: { mult: 1, amparo: 'Art 103 RLSM' }
};

const DEFAULT_BASE_FEE = 6.46;

export default function CalculatorV1() {
  // --- CONFIGURAÇÕES BASE E REGRAS DINÂMICAS (COM LOCALSTORAGE) ---
  const [showSettings, setShowSettings] = useState(false);

  // Inicializa a taxa base lendo do localStorage, se não existir, usa o padrão
  const [baseFee, setBaseFee] = useState(() => {
    const saved = localStorage.getItem('jsm_baseFee');
    return saved !== null ? parseFloat(saved) : DEFAULT_BASE_FEE;
  });

  // Inicializa as regras lendo do localStorage, se não existir ou der erro, usa as padrão
  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('jsm_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar regras salvas", e);
        return DEFAULT_RULES;
      }
    }
    return DEFAULT_RULES;
  });

  // Salva a taxa base no localStorage sempre que ela mudar
  useEffect(() => {
    localStorage.setItem('jsm_baseFee', baseFee.toString());
  }, [baseFee]);

  // Salva as regras no localStorage sempre que elas mudarem
  useEffect(() => {
    localStorage.setItem('jsm_rules', JSON.stringify(rules));
  }, [rules]);

  const handleRuleChange = (key, field, value) => {
    setRules(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === 'mult' ? Number(value) : value
      }
    }));
  };

  const handleResetRules = () => {
    if (window.confirm('Tem certeza que deseja restaurar todos os multiplicadores e amparos para os valores originais da lei?')) {
      setRules(DEFAULT_RULES);
      setBaseFee(DEFAULT_BASE_FEE);
    }
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
  const [reserveCategory, setReserveCategory] = useState('praca_r2'); 
  const [exarMissedYears, setExarMissedYears] = useState(0);
  const [missedConvocacao, setMissedConvocacao] = useState(false);
  const [missedResidencia, setMissedResidencia] = useState(false);
  const [mfdvMissedRenewals, setMfdvMissedRenewals] = useState(0);
  const [mfdvLateDiploma, setMfdvLateDiploma] = useState(false);

  // Documentos
  const [taxRequests, setTaxRequests] = useState({ cdi: false, cdsa: false, adiamento: false });
  const [lostDocs, setLostDocs] = useState({ cam: false, cr_csm: false, cdi_ci_cdsa: false });

  // --- MOTOR DE CÁLCULO ---
  const calculations = useMemo(() => {
    let breakdown = [];
    let total = 0;

    // 1. ALISTAMENTO
    if (enlistmentStatus === 'late') {
      const rule = rules.alistamentoAtraso;
      breakdown.push({ label: 'Apresentar-se fora do prazo para alistamento', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
      total += rule.mult * baseFee;
    }
    if (multipleEnlistments) {
      const rule = rules.alistamentoMultiplo;
      breakdown.push({ label: 'Alistar-se mais de uma vez', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
      total += rule.mult * baseFee;
    }

    // 2. SELEÇÃO (REFRATÁRIO)
    if (selectionStatus === 'missed' && refractoryYears > 0) {
      if (refractoryYears >= 1) {
        const rule = rules.refratario1;
        breakdown.push({ label: 'Faltar à CS pela 1ª vez (Refratário)', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
        total += rule.mult * baseFee;
      }
      if (refractoryYears >= 2) {
        const rule = rules.refratario2;
        breakdown.push({ label: 'Faltar à CS pela 2ª vez (Refratário)', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
        total += rule.mult * baseFee;
      }
      if (refractoryYears >= 3) {
        const extraYears = refractoryYears - 2;
        const rule = rules.refratario3Mais;
        const mult = extraYears * rule.mult;
        breakdown.push({ label: `Faltar à CS após a 2ª vez (${extraYears}x)`, amparo: rule.amparo, mult, amount: mult * baseFee });
        total += mult * baseFee;
      }
    }

    // 3. OBRIGAÇÕES DA RESERVA E ATUALIZAÇÕES
    const isMfdv = reserveCategory === 'oficial_mfdv';

    if (exarMissedYears > 0) {
      const rule = isMfdv ? rules.exarMfdv : rules.exarPracaR2;
      const multTotal = exarMissedYears * rule.mult;
      breakdown.push({
        label: `Falta EXAR (${exarMissedYears}x - ${isMfdv ? 'Oficiais MFDV' : 'Praças/Oficiais R/2'})`,
        amparo: rule.amparo, mult: multTotal, amount: multTotal * baseFee
      });
      total += multTotal * baseFee;
    }

    if (missedConvocacao) {
      const rule = isMfdv ? rules.convocacaoMfdv : rules.convocacaoPracaR2;
      breakdown.push({ label: 'Falta à Convocação', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
      total += rule.mult * baseFee;
    }

    if (missedResidencia) {
      const rule = isMfdv ? rules.residenciaMfdv : rules.residenciaPracaR2;
      breakdown.push({ label: 'Não comunicou mudança de residência (60 dias)', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
      total += rule.mult * baseFee;
    }

    // 4. MFDV ESPECÍFICOS
    if (mfdvMissedRenewals > 0) {
      const rule = rules.mfdvAdiamento;
      const mult = mfdvMissedRenewals * rule.mult;
      breakdown.push({ label: `Deixar de renovar adiamento (${mfdvMissedRenewals}x)`, amparo: rule.amparo, mult, amount: mult * baseFee });
      total += mult * baseFee;
    }
    if (mfdvLateDiploma) {
      const rule = rules.mfdvDiploma;
      breakdown.push({ label: 'Atraso apresentação diploma (>60 dias)', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee });
      total += rule.mult * baseFee;
    }

    // 5. EXTRAVIOS
    if (lostDocs.cam) { const rule = rules.extravioCam; breakdown.push({ label: 'Extravio/Inutilização do CAM', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (lostDocs.cr_csm) { const rule = rules.extravioCrCsm; breakdown.push({ label: 'Extravio/Inutilização do CR/CSM', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (lostDocs.cdi_ci_cdsa) { const rule = rules.extravioCdiCiCdsa; breakdown.push({ label: 'Extravio do CDI, CI ou CDSA', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }

    // 6. TAXAS
    if (taxRequests.cdi) { const rule = rules.taxaCdi; breakdown.push({ label: 'Requerer CDI', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (taxRequests.cdsa) { const rule = rules.taxaCdsa; breakdown.push({ label: 'Requerer CDSA', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (taxRequests.adiamento) { const rule = rules.taxaAdiamento; breakdown.push({ label: 'Requerer adiamento de incorporação', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }

    // 7. ISENÇÕES
    const isExempt = exemption !== 'none';
    if (isExempt && total > 0) {
      breakdown.push({ label: `Isenção por Impossibilidade de Pagamento`, amparo: 'Art 225 RLSM', mult: 0, amount: -total });
      total = 0;
    }

    return { breakdown, total: Math.max(0, total), isExempt, hasItems: breakdown.length > 0 };
  }, [baseFee, rules, enlistmentStatus, multipleEnlistments, selectionStatus, refractoryYears, reserveCategory, exarMissedYears, missedConvocacao, missedResidencia, mfdvMissedRenewals, mfdvLateDiploma, lostDocs, taxRequests, exemption]);

  // Função auxiliar para renderizar os inputs de configuração
  const renderRuleInput = (label, key) => (
    <div className="flex flex-col gap-1 mb-3 border-b border-slate-200/60 pb-2 last:border-0 last:mb-0 last:pb-0">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={rules[key].mult}
          onChange={e => handleRuleChange(key, 'mult', e.target.value)}
          className="w-16 border border-slate-300 rounded p-1 text-center text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
          title="Multiplicador (Qtd. vezes)"
        />
        <input
          type="text"
          value={rules[key].amparo}
          onChange={e => handleRuleChange(key, 'amparo', e.target.value)}
          className="flex-1 border border-slate-300 rounded p-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-slate-600"
          title="Amparo Legal"
        />
      </div>
    </div>
  );

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
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 rounded-lg text-sm font-bold transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Regras e Multiplicadores {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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

        {/* PAINEL DE CONFIGURAÇÕES DE REGRAS */}
        {showSettings && (
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" /> Configuração de Multiplicadores e Amparo Legal
              </h3>
              <button 
                onClick={handleResetRules}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Restaurar Padrões
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3 border-b pb-1">Alistamento & Seleção</h4>
                {renderRuleInput('Atraso Alistamento (Refratário)', 'alistamentoAtraso')}
                {renderRuleInput('Alist. Múltiplo', 'alistamentoMultiplo')}
                {renderRuleInput('Faltar a CS 1ª vez', 'refratario1')}
                {renderRuleInput('Faltar a CS 2ª vez', 'refratario2')}
                {renderRuleInput('Faltar a CS 3ª+ vezes', 'refratario3Mais')}
              </div>
              
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3 border-b pb-1">Reserva (Oficiais R2/Praças)</h4>
                {renderRuleInput('Falta EXAR', 'exarPracaR2')}
                {renderRuleInput('Falta Convocação', 'convocacaoPracaR2')}
                {renderRuleInput('Omissão Residência', 'residenciaPracaR2')}
              </div>
              
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3 border-b border-purple-200 pb-1">Reserva (MFDV)</h4>
                {renderRuleInput('Falta EXAR MFDV', 'exarMfdv')}
                {renderRuleInput('Falta Convocação MFDV', 'convocacaoMfdv')}
                {renderRuleInput('Omissão Res. MFDV', 'residenciaMfdv')}
                {renderRuleInput('Falta Renov. Adiamento', 'mfdvAdiamento')}
                {renderRuleInput('Atraso Diploma', 'mfdvDiploma')}
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-3 border-b pb-1">Taxas & Extravios</h4>
                {renderRuleInput('Taxa CDI', 'taxaCdi')}
                {renderRuleInput('Taxa CDSA', 'taxaCdsa')}
                {renderRuleInput('Taxa Adiamento', 'taxaAdiamento')}
                {renderRuleInput('Extravio CAM', 'extravioCam')}
                {renderRuleInput('Extravio CR/CSM', 'extravioCrCsm')}
                {renderRuleInput('Extravio CDI/CI/CDSA', 'extravioCdiCiCdsa')}
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-4 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Suas alterações são salvas automaticamente neste navegador.
            </p>
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

            {/* Etapa 2 e 3: Seleção e Reserva */}
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

                {/* Obrigações da Reserva */}
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
                      <input 
                        type="checkbox" 
                        checked={taxRequests.cdi}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTaxRequests({ cdi: true, cdsa: false, adiamento: false });
                          } else {
                            setTaxRequests({ cdi: false, cdsa: false, adiamento: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-emerald-600" 
                      />
                      Requerer CDI (1ª e demais vias)
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={taxRequests.cdsa} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTaxRequests({ cdi: false, cdsa: true, adiamento: false });
                          } else {
                            setTaxRequests({ cdi: false, cdsa: false, adiamento: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-emerald-600" 
                      />
                      Requerer CDSA (1ª e demais vias)
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={taxRequests.adiamento} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTaxRequests({ cdi: false, cdsa: false, adiamento: true });
                          } else {
                            setTaxRequests({ cdi: false, cdsa: false, adiamento: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-emerald-600" 
                      />
                      Requerer Adiamento de Incorporação
                    </label>
                  </div>
                </div>

                {/* Extravios */}
                <div>
                  <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 bg-red-50 p-2 rounded">Extravios (Multas)</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={lostDocs.cam} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLostDocs({ cam: true, cr_csm: false, cdi_ci_cdsa: false });
                          } else {
                            setLostDocs({ cam: false, cr_csm: false, cdi_ci_cdsa: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-red-600" 
                      />
                      Extravio do CAM
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={lostDocs.cr_csm} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLostDocs({ cam: false, cr_csm: true, cdi_ci_cdsa: false });
                          } else {
                            setLostDocs({ cam: false, cr_csm: false, cdi_ci_cdsa: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-red-600" 
                      />
                      Extravio do CR ou CSM
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={lostDocs.cdi_ci_cdsa} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLostDocs({ cam: false, cr_csm: false, cdi_ci_cdsa: true });
                          } else {
                            setLostDocs({ cam: false, cr_csm: false, cdi_ci_cdsa: false });
                          }
                        }} 
                        className="w-4 h-4 rounded text-red-600" 
                      />
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
                    <p className="text-center">Nenhuma taxa ou multa selecionada.<br />Situação regular sem custos.</p>
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