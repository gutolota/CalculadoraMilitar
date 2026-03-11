import React, { useState, useMemo } from 'react';
import { Calculator, AlertCircle, CheckCircle2, Receipt, Settings, User, FileText, ShieldAlert, Calendar } from 'lucide-react';

export default function App() {
  // Configurações Base
  const [baseFee, setBaseFee] = useState(6.46); // Atualizado para o valor do exemplo
  
  // 1. DADOS INICIAIS
  const [birthYear, setBirthYear] = useState(2006); // Usando ano de nascimento para simplificar o fluxo
  const [exemption, setExemption] = useState('none');

  // 2. ALISTAMENTO E SELEÇÃO
  const [enlistmentStatus, setEnlistmentStatus] = useState('on_time'); // on_time, late
  const [multipleEnlistments, setMultipleEnlistments] = useState(false);
  
  const [selectionStatus, setSelectionStatus] = useState('ok'); // ok, missed
  const [refractoryYears, setRefractoryYears] = useState(2); // Inicia com 2 conforme o exemplo

  // 3. EXAR
  const [exarType, setExarType] = useState('praca');
  const [exarMissedYears, setExarMissedYears] = useState(0);

  // 4. TAXAS (Emissões)
  const [taxRequests, setTaxRequests] = useState({
    cdi: false,
    cdsa: false,
    adiamento: false
  });

  // 5. MULTAS (Extravios)
  const [lostDocs, setLostDocs] = useState({
    cam: false,
    cr_csm: false,
    cdi_ci_cdsa: false
  });

  // 6. MFDV
  const [mfdvMissedRenewals, setMfdvMissedRenewals] = useState(0);
  const [mfdvLateDiploma, setMfdvLateDiploma] = useState(false);

  // Toggle helpers
  const handleTaxToggle = (key) => setTaxRequests(prev => ({...prev, [key]: !prev[key]}));
  const handleLostDocsToggle = (key) => setLostDocs(prev => ({...prev, [key]: !prev[key]}));

  // MOTOR DE CÁLCULO
  const calculations = useMemo(() => {
    let breakdown = [];
    let total = 0;
    
    // --- MULTAS: ALISTAMENTO ---
    if (enlistmentStatus === 'late') {
      breakdown.push({ 
        label: 'Apresentar-se fora do prazo para alistamento', 
        amparo: '1) Art 176 RLSM',
        mult: 1,
        amount: 1 * baseFee 
      });
      total += 1 * baseFee;
    }
    
    if (multipleEnlistments) {
      breakdown.push({ 
        label: 'Alistar-se mais de uma vez', 
        amparo: 'Art 44 e № 1) Art 177 RLSM',
        mult: 3,
        amount: 3 * baseFee 
      });
      total += 3 * baseFee;
    }

    // --- MULTAS: SELEÇÃO (REFRATÁRIO) ---
    if (selectionStatus === 'missed' && refractoryYears > 0) {
      // 1ª vez
      if (refractoryYears >= 1) {
        breakdown.push({ 
          label: 'Faltar à CS pela 1ª vez (Refratário)', 
          amparo: '№ 2) Art 176 RLSM',
          mult: 1,
          amount: 1 * baseFee 
        });
        total += 1 * baseFee;
      }
      // 2ª vez
      if (refractoryYears >= 2) {
        breakdown.push({ 
          label: 'Faltar à CS pela 2ª vez (Refratário)', 
          amparo: '№ 1) Art 178 RLSM',
          mult: 5,
          amount: 5 * baseFee 
        });
        total += 5 * baseFee;
      }
      // 3ª vez em diante
      if (refractoryYears >= 3) {
        const extraYears = refractoryYears - 2;
        breakdown.push({ 
          label: `Faltar à CS após a 2ª vez (${extraYears}x)`, 
          amparo: '№ 2) Art 178 RLSM',
          mult: extraYears * 5,
          amount: extraYears * 5 * baseFee 
        });
        total += extraYears * 5 * baseFee;
      }
    }

    // --- EXAR ---
    if (exarMissedYears > 0) {
      const multiplier = exarType === 'oficial' ? 5 : 1;
      const amparo = exarType === 'oficial' ? 'Art 47 RCORE' : '№ 3) Art 176 RLSM';
      const exarFine = exarMissedYears * multiplier * baseFee;
      
      breakdown.push({ 
        label: `Deixar de apresentar-se anualmente no EXAR (${exarMissedYears}x - ${exarType === 'oficial' ? 'Oficiais' : 'Praças'})`, 
        amparo: amparo,
        mult: exarMissedYears * multiplier,
        amount: exarFine 
      });
      total += exarFine;
    }

    // --- MFDV ---
    if (mfdvMissedRenewals > 0) {
      breakdown.push({ 
        label: `Deixar de renovar adiamento anualmente (${mfdvMissedRenewals}x)`, 
        amparo: 'Art 73, 74 e 75 RLMFDV',
        mult: mfdvMissedRenewals,
        amount: mfdvMissedRenewals * baseFee 
      });
      total += mfdvMissedRenewals * baseFee;
    }
    
    if (mfdvLateDiploma) {
      breakdown.push({ 
        label: 'Deixar de apresentar diploma após formação no prazo (60 dias)', 
        amparo: 'Art 58 LMFDV',
        mult: 5,
        amount: 5 * baseFee 
      });
      total += 5 * baseFee;
    }

    // --- MULTAS EXTRAVIO (3x) ---
    if (lostDocs.cam) {
      breakdown.push({ label: 'Extravio, inutilização ou alteração do CAM', amparo: '1) Art 177 RLSM', mult: 3, amount: 3 * baseFee });
      total += 3 * baseFee;
    }
    if (lostDocs.cr_csm) {
      breakdown.push({ label: 'Extravio, inutilização ou alteração do CR/CSM', amparo: '1) Art 177 RLSM', mult: 3, amount: 3 * baseFee });
      total += 3 * baseFee;
    }
    if (lostDocs.cdi_ci_cdsa) {
      breakdown.push({ label: 'Extravio, inutilização ou alteração do CDI, CI ou CDSA', amparo: '1) Art 177 RLSM', mult: 3, amount: 3 * baseFee });
      total += 3 * baseFee;
    }

    // --- TAXAS EMISSÃO (1x) ---
    if (taxRequests.cdi) {
      breakdown.push({ label: 'Requerer CDI (1ª e demais vias)', amparo: '§ 2º Art 107 RLSM', mult: 1, amount: 1 * baseFee });
      total += 1 * baseFee;
    }
    if (taxRequests.cdsa) {
      breakdown.push({ label: 'Requerer CDSA (1ª e demais vias)', amparo: '§ 3º Art 43 RLPSA', mult: 1, amount: 1 * baseFee });
      total += 1 * baseFee;
    }
    if (taxRequests.adiamento) {
      breakdown.push({ label: 'Requerer adiamento de incorporação', amparo: 'Art 103 RLSM', mult: 1, amount: 1 * baseFee });
      total += 1 * baseFee;
    }

    // --- ISENÇÕES ---
    const isExempt = exemption !== 'none';
    if (isExempt && total > 0) {
      breakdown.push({
        label: `Isenção por Impossibilidade de Pagamento`,
        amparo: 'Art 225 RLSM',
        mult: 0,
        amount: -total
      });
      total = 0;
    }

    return {
      breakdown,
      total: Math.max(0, total),
      isExempt,
      hasItems: breakdown.length > 0
    };
  }, [baseFee, enlistmentStatus, multipleEnlistments, selectionStatus, refractoryYears, exarType, exarMissedYears, mfdvMissedRenewals, mfdvLateDiploma, lostDocs, taxRequests, exemption]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800">
      <div className="mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-emerald-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              Calculadora JSM (Fluxo Oficial)
            </h1>
            <p className="text-emerald-200 mt-1 text-sm">Geração de taxas e multas com base no RLSM, RCORE e LMFDV.</p>
          </div>
          <div className="flex flex-col items-start md:items-end w-full md:w-auto bg-emerald-950/50 p-3 rounded-lg border border-emerald-800">
            <label className="text-xs text-emerald-300 mb-1 flex items-center gap-1 uppercase font-bold tracking-wider">
              <Settings className="w-3 h-3" /> Valor da Taxa/Multa Base
            </label>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">R$</span>
              <input 
                type="number" 
                step="0.01"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-white rounded text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </header>

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
                    <input 
                      type="number" 
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full pl-10 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Situação Financeira</label>
                  <select 
                    value={exemption}
                    onChange={(e) => setExemption(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                  >
                    <option value="none">Capacidade de Pagamento Normal</option>
                    <option value="low_income">Comprovou Impossibilidade (Isento)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700">Como foi o Alistamento?</label>
                <select 
                  value={enlistmentStatus}
                  onChange={(e) => setEnlistmentStatus(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="on_time">No prazo correto (ou regularizado anteriormente sem novas multas neste item)</option>
                  <option value="late">Fora do prazo legal (Multa 1x)</option>
                </select>

                <label className="flex items-center gap-3 mt-2">
                  <input type="checkbox" checked={multipleEnlistments} onChange={(e) => setMultipleEnlistments(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-sm text-slate-700">Alistou-se mais de uma vez? <span className="text-xs text-red-600 font-mono">(Multa 3x)</span></span>
                </label>
              </div>
            </section>

            {/* Etapa 2: Seleção e EXAR */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold border-b pb-3 mb-5 flex items-center gap-2 text-emerald-800">
                <ShieldAlert className="w-5 h-5" /> 2. Apresentações (Seleção e Reserva)
              </h2>
              
              <div className="space-y-6">
                {/* Seleção */}
                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Comissão de Seleção (CS)</label>
                  <select 
                    value={selectionStatus}
                    onChange={(e) => setSelectionStatus(e.target.value)}
                    className="w-full p-2 border border-amber-200 rounded focus:ring-2 focus:ring-amber-500 outline-none mb-3"
                  >
                    <option value="ok">Compareceu normalmente ou dispensado</option>
                    <option value="missed">Faltou à Seleção (Cidadão Refratário)</option>
                  </select>

                  {selectionStatus === 'missed' && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-amber-200">
                      <span className="text-sm text-slate-700 font-medium">Quantos anos faltou à CS?</span>
                      <input 
                        type="number" min="1" value={refractoryYears} onChange={(e) => setRefractoryYears(Number(e.target.value))}
                        className="w-20 p-2 border border-amber-300 rounded text-center outline-none focus:border-amber-500 font-mono text-lg"
                      />
                      <span className="text-xs text-amber-700 flex-1 leading-tight">
                        A 1ª vez conta 1x.<br/>Da 2ª vez em diante, 5x cada.
                      </span>
                    </div>
                  )}
                </div>

                {/* EXAR */}
                <div className="p-4 rounded-lg border border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Exercício de Apresentação da Reserva (EXAR)</label>
                  <div className="flex items-center gap-3">
                    <select value={exarType} onChange={(e) => setExarType(e.target.value)} className="p-2 border border-slate-300 rounded text-sm outline-none">
                      <option value="praca">Praça (Multa 1x)</option>
                      <option value="oficial">Oficial (Multa 5x)</option>
                    </select>
                    <span className="text-sm text-slate-700">Faltou:</span>
                    <input 
                      type="number" min="0" value={exarMissedYears} onChange={(e) => setExarMissedYears(Number(e.target.value))}
                      className="w-16 p-2 border border-slate-300 rounded text-center outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-sm text-slate-700">vez(es)</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Etapa 3: Documentos e Extravios */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold border-b pb-3 mb-5 flex items-center gap-2 text-emerald-800">
                <FileText className="w-5 h-5" /> 3. Solicitações e Extravios de Documentos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Taxas */}
                <div>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 bg-slate-100 p-2 rounded">Emissões (Taxa 1x)</h3>
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
                  <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 bg-red-50 p-2 rounded">Extravios (Multa 3x)</h3>
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
                  <Receipt className="w-6 h-6" /> Resumo de Atendimento JSM
                </h2>
                <p className="text-slate-300 text-sm mt-1">Cidadão nascido em {birthYear}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
                {!calculations.hasItems ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <CheckCircle2 className="w-12 h-12 text-slate-300" />
                    <p className="text-center">Nenhuma taxa ou multa selecionada.<br/>Situação regularizada sem custos.</p>
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
                        
                        {/* Linha de Amparo Legal e Multiplicador */}
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
                      (Total de {calculations.hasItems && !calculations.isExempt ? calculations.breakdown.reduce((acc, curr) => acc + curr.mult, 0) : 0}x taxas base)
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
