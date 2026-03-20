import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle, Receipt, Settings, User, FileText, ShieldAlert, Calendar, SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw, Info, Workflow, Star, ShieldCheck, MapPin, Search, FolderTree, Cpu } from 'lucide-react';
import { processRules } from '../utils/RuleEngine';

const DEFAULT_RULES = {
  alistamentoAtraso: { mult: 1, amparo: 'Nr 1) Art 176 RLSM' },
  alistamentoMultiplo: { mult: 3, amparo: 'Art 44 e Nr 1) Art 177 RLSM' },
  refratario1: { mult: 1, amparo: 'Nr 2) Art 176 RLSM' },
  refratario2: { mult: 5, amparo: 'Nr 1) Art 178 RLSM' },
  refratario3Mais: { mult: 5, amparo: 'Nr 2) Art 178 RLSM' },
  exarPracaR2: { mult: 3, amparo: 'Art. 47 LSM e Nr 3 Art. 177 RLSM' },
  exarMfdv: { mult: 5, amparo: 'Art. 52 e 58, c) LMFDV' },
  convocacaoPracaR2: { mult: 3, amparo: 'Art. 47 LSM e Nr 3 Art. 177 RLSM' },
  convocacaoMfdv: { mult: 15, amparo: 'Art. 60(a) LMFDV' },
  residenciaPracaR2: { mult: 3, amparo: 'Art. 47 LSM e Nr 4 Art. 177 RLSM' },
  residenciaMfdv: { mult: 15, amparo: 'Art. 60(b) LMFDV' },
  mfdvAdiamento: { mult: 1, amparo: 'Art 73, 74 e 75 RLMFDV' },
  mfdvDiploma: { mult: 5, amparo: 'Art 58 LMFDV' },
  extravioCrCsm: { mult: 3, amparo: 'Nr 1) Art 177 RLSM' },
  extravioCdiCiCdsa: { mult: 3, amparo: 'Nr 1) Art 177 RLSM' },
  taxaCdi: { mult: 1, amparo: '§ 2º 107 RLSM' },
  taxaCdsa: { mult: 1, amparo: '§ 3º Art 43 RLPSA' },
  taxaCi: { mult: 0, amparo: 'Art 165 RLSM' },
  taxaCr: { mult: 0, amparo: '' },
  taxaCsm: { mult: 0, amparo: '' },
  taxaAdiamento: { mult: 1, amparo: 'Art 103 RLSM' }
};

const DEFAULT_BASE_FEE = 6.46;

export default function CalculatorV2() {
  const [showSettings, setShowSettings] = useState(false);
  const [useFlowEngine, setUseFlowEngine] = useState(false);
  const [activeFlow, setActiveFlow] = useState(null);
  const [availablePatterns, setAvailablePatterns] = useState([{ id: 'custom', name: 'Fluxograma Editado', file: null }]);
  const [selectedPatternId, setSelectedPatternId] = useState('custom');
  
  // Parâmetros de sistema extraídos do fluxo ativo
  const [systemSettings, setSystemSettings] = useState({ militaryAge: 18, maxRefractoryYears: 10, communicationDeadlineDays: 60 });

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await fetch('interpretations/manifest.json');
        if (response.ok) {
          const data = await response.json();
          // Define a lista completa de uma vez para evitar duplicações por re-render do useEffect
          setAvailablePatterns([
            { id: 'custom', name: 'Fluxograma Editado', file: null },
            ...data.filter(d => d.id !== 'custom')
          ]);
        }
      } catch (e) {}
    };
    fetchManifest();
  }, []);

  useEffect(() => {
    const loadPattern = async () => {
      if (selectedPatternId === 'custom') {
        const saved = localStorage.getItem('military_flow_rules');
        if (saved) {
          const data = JSON.parse(saved);
          setActiveFlow(data);
          // Buscar nó de sistema no JSON salvo
          const sys = data.nodes.find(n => n.type === 'system');
          if (sys) setSystemSettings(sys.data);
        }
      } else {
        const pattern = availablePatterns.find(p => p.id === selectedPatternId);
        if (pattern && pattern.file) {
          try {
            const response = await fetch(pattern.file);
            if (response.ok) {
              const data = await response.json();
              setActiveFlow(data);
              const sys = data.nodes.find(n => n.type === 'system');
              if (sys) setSystemSettings(sys.data);
            }
          } catch (e) {}
        }
      }
    };
    loadPattern();
  }, [selectedPatternId, availablePatterns]);

  const [baseFee, setBaseFee] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_BASE_FEE;
    try {
      const saved = localStorage.getItem('jsm_baseFee');
      return saved !== null ? parseFloat(saved) : DEFAULT_BASE_FEE;
    } catch (e) { return DEFAULT_BASE_FEE; }
  });

  const [rules, setRules] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_RULES;
    try {
      const saved = localStorage.getItem('jsm_rules');
      if (saved) return { ...DEFAULT_RULES, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_RULES;
  });

  const [birthYear, setBirthYear] = useState(2006);
  const [exemption, setExemption] = useState('none');
  const [enlistmentStatus, setEnlistmentStatus] = useState('on_time');
  const [multipleEnlistments, setMultipleEnlistments] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState('ok');
  const [refractoryYears, setRefractoryYears] = useState(0);
  const [reserveCategory, setReserveCategory] = useState('praca_r2');
  const [exarMissedYears, setExarMissedYears] = useState(0);
  const [missedConvocacao, setMissedConvocacao] = useState(false);
  const [missedResidencia, setMissedResidencia] = useState(false);
  const [mfdvMissedRenewals, setMfdvMissedRenewals] = useState(0);
  const [mfdvLateDiploma, setMfdvLateDiploma] = useState(false);
  const [certificateType, setCertificateType] = useState('digital');
  const [analogLegible, setAnalogLegible] = useState(true);
  const [taxRequests, setTaxRequests] = useState({ cdi: false, cdsa: false, ci: false, cr: false, csm: false, adiamento: false });
  const [lostDocs, setLostDocs] = useState({ cr_csm: false, cdi_ci_cdsa: false });

  // Cálculo de refratário baseado nos novos parâmetros dinâmicos
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const anosPassados = age - systemSettings.militaryAge;
    setRefractoryYears(anosPassados > 0 ? Math.min(systemSettings.maxRefractoryYears, anosPassados) : 0);
  }, [birthYear, systemSettings]);

  const isExtravioDisabled = certificateType === 'digital' || (certificateType === 'analogico' && analogLegible);

  const calculations = useMemo(() => {
    if (useFlowEngine && activeFlow) {
      const userData = {
        enlistmentStatus, multipleEnlistments: String(multipleEnlistments), selectionStatus,
        refractoryYears: Number(refractoryYears), reserveCategory, exarMissedYears: Number(exarMissedYears),
        missedConvocacao: String(missedConvocacao), missedResidencia: String(missedResidencia),
        certificateType, analogLegible: String(analogLegible), lostDocs_cr_csm: String(lostDocs.cr_csm),
        lostDocs_cdi_ci_cdsa: String(lostDocs.cdi_ci_cdsa), mfdvMissedRenewals: Number(mfdvMissedRenewals),
        mfdvLateDiploma: String(mfdvLateDiploma),
      };
      const result = processRules(activeFlow, userData, baseFee);
      const isExempt = exemption !== 'none';
      if (isExempt && result.total > 0) {
        result.breakdown.push({ label: `Isenção por Impossibilidade de Pagamento`, amparo: 'Art 225 RLSM', mult: 0, amount: -result.total });
        result.total = 0;
      }
      return { ...result, isExempt, hasItems: result.breakdown.length > 0 };
    }

    let breakdown = [];
    let total = 0;
    if (enlistmentStatus === 'late') { const rule = rules.alistamentoAtraso; breakdown.push({ label: 'Fora do prazo para alistamento', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (multipleEnlistments) { const rule = rules.alistamentoMultiplo; breakdown.push({ label: 'Alistar-se mais de uma vez', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (selectionStatus === 'missed' && refractoryYears > 0) {
      if (refractoryYears >= 1) { const rule = rules.refratario1; breakdown.push({ label: 'Faltar à CS 1ª vez', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
      if (refractoryYears >= 2) { const rule = rules.refratario2; breakdown.push({ label: 'Faltar à CS 2ª vez', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
      if (refractoryYears >= 3) { const extra = refractoryYears - 2; const rule = rules.refratario3Mais; const mult = extra * rule.mult; breakdown.push({ label: `Faltar à CS 3ª+ (${extra}x)`, amparo: rule.amparo, mult, amount: mult * baseFee }); total += mult * baseFee; }
    }
    const isMfdv = reserveCategory === 'oficial_mfdv';
    if (exarMissedYears > 0) { const rule = isMfdv ? rules.exarMfdv : rules.exarPracaR2; const mult = exarMissedYears * rule.mult; breakdown.push({ label: `Falta EXAR (${exarMissedYears}x)`, amparo: rule.amparo, mult, amount: mult * baseFee }); total += mult * baseFee; }
    if (missedConvocacao) { const rule = isMfdv ? rules.convocacaoMfdv : rules.convocacaoPracaR2; breakdown.push({ label: 'Falta à Convocação', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (missedResidencia) { const rule = isMfdv ? rules.residenciaMfdv : rules.residenciaPracaR2; breakdown.push({ label: 'Omissão de Residência', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (mfdvMissedRenewals > 0) { const rule = rules.mfdvAdiamento; const mult = mfdvMissedRenewals * rule.mult; breakdown.push({ label: `Falta Renovação MFDV (${mfdvMissedRenewals}x)`, amparo: rule.amparo, mult, amount: mult * baseFee }); total += mult * baseFee; }
    if (mfdvLateDiploma) { const rule = rules.mfdvDiploma; breakdown.push({ label: 'Atraso Apresentação Diploma', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    if (!isExtravioDisabled) {
      if (lostDocs.cr_csm) { const rule = rules.extravioCrCsm; breakdown.push({ label: 'Extravio de CR/CSM', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
      if (lostDocs.cdi_ci_cdsa) { const rule = rules.extravioCdiCiCdsa; breakdown.push({ label: 'Extravio de CDI/CI/CDSA', amparo: rule.amparo, mult: rule.mult, amount: rule.mult * baseFee }); total += rule.mult * baseFee; }
    }
    const getEmissionMult = (m) => (certificateType === 'analogico' && analogLegible) ? 0 : m;
    if (taxRequests.cdi) { const r = rules.taxaCdi; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Requerer CDI', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    if (taxRequests.cdsa) { const r = rules.taxaCdsa; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Requerer CDSA', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    if (taxRequests.ci) { const r = rules.taxaCi; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Requerer CI', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    if (taxRequests.cr) { const r = rules.taxaCr; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Requerer CR', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    if (taxRequests.csm) { const r = rules.taxaCsm; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Requerer CSM', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    if (taxRequests.adiamento) { const r = rules.taxaAdiamento; const m = getEmissionMult(r.mult); breakdown.push({ label: 'Adiamento Incorporação', amparo: r.amparo, mult: m, amount: m * baseFee }); total += m * baseFee; }
    const isExempt = exemption !== 'none';
    if (isExempt && total > 0) { breakdown.push({ label: `Isenção Legal`, amparo: 'Art 225 RLSM', mult: 0, amount: -total }); total = 0; }
    return { breakdown, total: Math.max(0, total), isExempt, hasItems: breakdown.length > 0 };
  }, [baseFee, rules, enlistmentStatus, multipleEnlistments, selectionStatus, refractoryYears, reserveCategory, exarMissedYears, missedConvocacao, missedResidencia, mfdvMissedRenewals, mfdvLateDiploma, lostDocs, taxRequests, exemption, certificateType, analogLegible, isExtravioDisabled, useFlowEngine, activeFlow]);

  const handleTaxToggle = (key, isChecked) => {
    if (isChecked) { setTaxRequests({ cdi: false, cdsa: false, ci: false, cr: false, csm: false, adiamento: false, [key]: true }); } 
    else { setTaxRequests(prev => ({ ...prev, [key]: false })); }
  };

  const handleLostDocsToggle = (key, isChecked) => {
    if (isChecked) { setLostDocs({ cr_csm: false, cdi_ci_cdsa: false, [key]: true }); } 
    else { setLostDocs(prev => ({ ...prev, [key]: false })); }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-4 md:p-8 font-sans text-slate-900 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="bg-[#4B5320] text-white rounded-xl overflow-hidden shadow-2xl border-b-8 border-[#D4AF37] relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <ShieldAlert size={120} />
          </div>
          <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Star className="text-[#D4AF37] fill-[#D4AF37]" size={20} />
                <span className="text-[#D4AF37] font-black uppercase tracking-[0.3em] text-xs">Ministério da Defesa</span>
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight leading-none">Calculadora de Penalidades</h1>
              <p className="text-slate-300 mt-2 font-medium flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#D4AF37]" /> Junta de Serviço Militar (JSM)
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {useFlowEngine && (
                <div className="bg-[#3A3F1C] p-2 rounded-lg border border-[#D4AF37]/30 flex items-center gap-2">
                  <FolderTree size={14} className="text-[#D4AF37]" />
                  <select 
                    value={selectedPatternId} 
                    onChange={(e) => setSelectedPatternId(e.target.value)}
                    className="bg-transparent text-white text-[10px] font-black uppercase outline-none cursor-pointer"
                  >
                    {availablePatterns.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>)}
                  </select>
                </div>
              )}
              <button
                onClick={() => setUseFlowEngine(!useFlowEngine)}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 ${useFlowEngine ? 'bg-[#D4AF37] border-[#D4AF37] text-[#3A3F1C] shadow-lg shadow-[#D4AF37]/20' : 'bg-transparent border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#3A3F1C]'}`}
              >
                <Workflow size={16} className={useFlowEngine ? 'animate-spin-slow' : ''} />
                {useFlowEngine ? "Motor Dinâmico" : "Interpretação Padrão"}
              </button>
              <div className="bg-[#3A3F1C] p-3 rounded-lg border border-[#4B5320] flex items-center gap-3 shadow-inner">
                <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-tighter">Valor Base (R$)</span>
                <input type="number" step="0.01" value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value))} className="w-20 bg-white/10 text-white font-mono font-bold outline-none border-b border-[#D4AF37] focus:bg-white/20 px-1 text-lg" />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8 print:hidden">
            
            {/* INFORMATIVO DE PARÂMETROS ATIVOS (SE NO MODO DINÂMICO) */}
            {useFlowEngine && (
              <div className="bg-[#3A3F1C] text-white p-4 rounded-xl border-l-8 border-[#D4AF37] flex items-center justify-between animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#D4AF37] rounded-lg text-[#3A3F1C]"><Cpu size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#D4AF37]">Parâmetros do Fluxo Ativo</p>
                    <p className="text-xs font-bold">Idade: {systemSettings.militaryAge} anos | Teto Refratário: {systemSettings.maxRefractoryYears} anos</p>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-slate-400 bg-black/20 p-2 rounded tracking-tighter">ENGINE V3.0</div>
              </div>
            )}

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-[#4B5320] overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#4B5320] flex items-center gap-2">
                  <User size={18} /> 1. Ficha do Cidadão
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ano de Nascimento (Classe)</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-3 text-[#4B5320]" size={20} />
                    <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="w-full pl-12 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#4B5320] outline-none font-mono font-bold text-lg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidade Contributiva</label>
                  <select value={exemption} onChange={(e) => setExemption(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#4B5320] outline-none font-bold text-slate-700">
                    <option value="none">Normal (Pagamento Integral)</option>
                    <option value="low_income">Isento (Art. 225 RLSM)</option>
                  </select>
                </div>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status do Alistamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setEnlistmentStatus('on_time')} className={`p-3 rounded-lg text-xs font-black uppercase transition-all ${enlistmentStatus === 'on_time' ? 'bg-[#4B5320] text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>No Prazo</button>
                      <button onClick={() => setEnlistmentStatus('late')} className={`p-3 rounded-lg text-xs font-black uppercase transition-all ${enlistmentStatus === 'late' ? 'bg-rose-700 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>Atrasado</button>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${multipleEnlistments ? 'bg-[#4B5320] border-[#4B5320]' : 'border-slate-300'}`}>
                      {multipleEnlistments && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={multipleEnlistments} onChange={(e) => setMultipleEnlistments(e.target.checked)} className="hidden" />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-[#4B5320]">Alistamento Múltiplo (Tentativa de fraude)</span>
                  </label>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-[#3A3F1C] overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#3A3F1C] flex items-center gap-2">
                  <ShieldAlert size={18} /> 2. Obrigações e Reserva
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Seleção Geral (CS)</span>
                    <select value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value)} className={`text-xs font-black uppercase p-2 rounded-lg outline-none ${selectionStatus === 'missed' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      <option value="ok">Compareceu</option>
                      <option value="missed">Faltou (Refratário)</option>
                    </select>
                  </div>
                  {selectionStatus === 'missed' && (
                    <div className="flex items-center gap-4 animate-in zoom-in-95">
                      <span className="text-sm font-bold text-slate-600">Anos de Refratário:</span>
                      <input type="number" min="1" max={systemSettings.maxRefractoryYears} value={refractoryYears} onChange={(e) => setRefractoryYears(Number(e.target.value))} className="w-20 p-2 bg-white border-2 border-slate-200 rounded-xl font-mono font-bold text-center text-rose-700" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-[#4B5320]/5 rounded-xl border border-[#4B5320]/10">
                    <MapPin className="text-[#4B5320]" size={20} />
                    <select value={reserveCategory} onChange={(e) => setReserveCategory(e.target.value)} className="bg-transparent w-full outline-none font-black uppercase text-xs text-[#4B5320] cursor-pointer">
                      <option value="praca_r2">Praça ou Oficial R/2</option>
                      <option value="oficial_mfdv">Oficial MFDV (Médico/Dent/Vet)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Faltas EXAR:</span>
                      <input type="number" value={exarMissedYears} onChange={(e) => setExarMissedYears(Number(e.target.value))} className="w-12 text-center font-mono font-black text-slate-700 outline-none" />
                    </div>
                    <button onClick={() => setMissedConvocacao(!missedConvocacao)} className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between border-2 ${missedConvocacao ? 'bg-rose-700 border-rose-700 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                      <span>Falta Convocação</span>
                      {missedConvocacao ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-slate-400 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center gap-2 text-slate-600">
                <FileText size={18} /> <h2 className="text-sm font-black uppercase tracking-widest">3. Processos e Documentos</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Registro</label>
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                      <button onClick={() => setCertificateType('digital')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${certificateType === 'digital' ? 'bg-[#4B5320] text-white' : 'text-slate-400'}`}>Digital</button>
                      <button onClick={() => setCertificateType('analogico')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${certificateType === 'analogico' ? 'bg-[#4B5320] text-white' : 'text-slate-400'}`}>Analógico</button>
                    </div>
                  </div>
                  {certificateType === 'analogico' && (
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Estado Físico</label>
                      <select value={analogLegible ? 'sim' : 'nao'} onChange={(e) => setAnalogLegible(e.target.value === 'sim')} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none">
                        <option value="sim">Legível/Conservado</option>
                        <option value="nao">Rasurado/Inutilizado</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-[#4B5320] uppercase border-b pb-1">Taxas de Emissão</h4>
                    {['cdi', 'cdsa', 'ci', 'cr', 'csm', 'adiamento'].map(tax => (
                      <label key={tax} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${taxRequests[tax] ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Requerer {tax.toUpperCase()}</span>
                        <input type="checkbox" checked={taxRequests[tax]} onChange={(e) => handleTaxToggle(tax, e.target.checked)} className="hidden" />
                        {taxRequests[tax] ? <CheckCircle size={14} /> : <div className="w-3 h-3 border-2 border-slate-200 rounded" />}
                      </label>
                    ))}
                  </div>
                  <div className={`space-y-3 ${isExtravioDisabled ? 'opacity-30 pointer-events-none' : ''}`}>
                    <h4 className="text-[10px] font-black text-rose-700 uppercase border-b pb-1">Multas por Extravio</h4>
                    {Object.keys(lostDocs).map(lost => (
                      <label key={lost} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${lostDocs[lost] ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <span className="text-[10px] font-black uppercase leading-tight">{lost.replace(/_/g, ' ')}</span>
                        <input type="checkbox" checked={lostDocs[lost]} onChange={(e) => handleLostDocsToggle(lost, e.target.checked)} className="hidden" />
                        {lostDocs[lost] ? <AlertCircle size={16} /> : <div className="w-4 h-4 border-2 border-slate-200 rounded" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 sticky top-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-200 flex flex-col h-[calc(100vh-6rem)] max-h-[900px]">
              <div className="bg-white p-8 text-center border-b-2 border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]" />
                <div className="absolute -top-10 -left-10 opacity-5 grayscale"><Star size={150} /></div>
                <div className="space-y-1 relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Ministério da Defesa</h3>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#4B5320]">Exército Brasileiro</h4>
                  <div className="pt-4 flex flex-col items-center">
                    <div className="w-16 h-1 bg-[#D4AF37] mb-4" />
                    <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Extrato de Recolhimento</h2>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAF8] space-y-4">
                {!calculations.hasItems ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                    <Search size={48} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-widest">Aguardando dados...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calculations.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase text-slate-700 leading-tight">{item.label}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[8px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded tracking-tighter uppercase font-mono">{item.amparo}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono">{item.mult}x R$ {baseFee.toFixed(2)}</span>
                          </div>
                        </div>
                        <span className={`text-sm font-mono font-black ${item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {item.amount < 0 ? '-' : ''} R$ {Math.abs(item.amount).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white p-8 space-y-6 border-t-2 border-slate-100">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">Total a Recolher</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-4xl font-black font-mono tracking-tighter ${calculations.isExempt ? 'text-emerald-600' : 'text-slate-900'}`}>
                      R$ {calculations.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <button onClick={() => window.print()} className="w-full bg-[#4B5320] hover:bg-[#3A3F1C] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 text-xs">
                  <FileText size={16} className="text-[#D4AF37]" /> Imprimir Comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
