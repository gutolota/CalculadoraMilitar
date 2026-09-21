import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  User,
  FileText,
  ShieldAlert,
  Calendar,
  RefreshCw,
  Search,
  MapPin,
  Lock,
  BookOpen,
} from "lucide-react";
import {
  AMPAROS_LEGAIS,
  RULE_GROUPS,
  DEFAULT_RULES,
  DEFAULT_BASE_FEE,
} from "../config/amparosLegais";
import {
  analyzeEnrollment,
  csHistoryYears,
  isCsMandatoryForYear,
  countRefractoryYears,
} from "../utils/enrollmentRules";

const SYSTEM_SETTINGS = {
  militaryAge: 18,
  maxRefractoryYears: 10,
  maxExarYears: 5,
};

export default function CalculatorV2() {
  const [showSettings, setShowSettings] = useState(false);
  // Alistamento/refratário e reserva/EXAR são cálculos distintos.
  // Processos/documentos continua compartilhado pelos dois modos.
  const [activeSection, setActiveSection] = useState("enlistment");

  const [baseFee, setBaseFee] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_BASE_FEE;
    try {
      const saved = localStorage.getItem("jsm_baseFee");
      return saved !== null ? parseFloat(saved) : DEFAULT_BASE_FEE;
    } catch {
      return DEFAULT_BASE_FEE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("jsm_baseFee", String(baseFee));
    } catch {}
  }, [baseFee]);

  const [rules, setRules] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_RULES;
    try {
      const saved = localStorage.getItem("jsm_rules");
      if (saved) return { ...DEFAULT_RULES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_RULES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("jsm_rules", JSON.stringify(rules));
    } catch {}
  }, [rules]);

  const [birthYear, setBirthYear] = useState(2008);
  const [debouncedBirthYear, setDebouncedBirthYear] = useState(2008);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBirthYear(Number(birthYear)), 500);
    return () => clearTimeout(t);
  }, [birthYear]);

  const [enlistmentDate, setEnlistmentDate] = useState("");
  const [exemption, setExemption] = useState("none");
  const [csRecords, setCsRecords] = useState({});
  const [multipleEnlistments, setMultipleEnlistments] = useState(false);
  const [reserveCategory, setReserveCategory] = useState("pracas");
  const [exarMissedYears, setExarMissedYears] = useState(0);
  const [missedConvocacao, setMissedConvocacao] = useState(false);
  const [missedResidencia, setMissedResidencia] = useState(false);
  const [mfdvMissedRenewals, setMfdvMissedRenewals] = useState(0);
  const [mfdvLateDiploma, setMfdvLateDiploma] = useState(false);
  const [certificateType, setCertificateType] = useState("digital");
  const [analogLegible, setAnalogLegible] = useState(true);
  const [taxRequests, setTaxRequests] = useState({
    cdi: false, cdsa: false, ci: false, cr: false, csm: false, adiamento: false,
  });
  const [lostDocs, setLostDocs] = useState({ cr_csm: false, cdi_ci_cdsa: false });

  const currentYear = new Date().getFullYear();
  const isExarActive = exarMissedYears > 0;

  useEffect(() => {
    if (isExarActive) {
      setTaxRequests({ cdi: false, cdsa: false, ci: false, cr: false, csm: false, adiamento: false });
      setLostDocs((prev) => (prev.cdi_ci_cdsa ? { ...prev, cdi_ci_cdsa: false } : prev));
    }
  }, [isExarActive]);

  const analysis = useMemo(
    () =>
      analyzeEnrollment({
        birthYear: debouncedBirthYear,
        enlistmentDate,
        militaryAge: SYSTEM_SETTINGS.militaryAge,
      }),
    [debouncedBirthYear, enlistmentDate],
  );

  const historyYears = useMemo(
    () => csHistoryYears(analysis, currentYear),
    [analysis, currentYear],
  );

  useEffect(() => {
    setCsRecords({});
  }, [analysis.enrollYear, analysis.classYear]);

  const refractoryYears = useMemo(
    () => countRefractoryYears(analysis, csRecords, currentYear, SYSTEM_SETTINGS.maxRefractoryYears),
    [analysis, csRecords, currentYear],
  );

  const updateCsRecord = useCallback((year, field, value) => {
    setCsRecords((prev) => ({
      ...prev,
      [year]: { shouldAttend: true, attended: false, happened: false, ...(prev[year] ?? {}), [field]: value },
    }));
  }, []);

  const isExtravioDisabled =
    certificateType === "digital" || (certificateType === "analogico" && analogLegible);

  const calculations = useMemo(() => {
    const enrollmentActive = activeSection === "enlistment";
    const reserveActive = activeSection === "reserve";
    const breakdown = [];
    let total = 0;
    const push = (label, rule, mult = rule.mult) => {
      breakdown.push({ label, amparo: rule.amparo, mult, amount: mult * baseFee });
      total += mult * baseFee;
    };

    if (enrollmentActive && analysis.valid && analysis.isLate) push("Fora do prazo para alistamento", rules.alistamentoAtraso);
    if (enrollmentActive && multipleEnlistments) push("Alistar-se mais de uma vez", rules.alistamentoMultiplo);

    if (enrollmentActive && refractoryYears >= 1) push("Faltar à CS 1ª vez", rules.refratario1);
    if (enrollmentActive && refractoryYears >= 2) push("Faltar à CS 2ª vez", rules.refratario2);
    if (enrollmentActive && refractoryYears >= 3) {
      const extra = refractoryYears - 2;
      push(`Faltar à CS 3ª+ (${extra}x)`, rules.refratario3Mais, extra * rules.refratario3Mais.mult);
    }

    const isMfdv = reserveCategory === "oficial_mfdv";
    const isOficialR2 = reserveCategory === "oficial_r2";
    if (reserveActive && exarMissedYears > 0) {
      const rule = isMfdv ? rules.exarMfdv : isOficialR2 ? rules.exarOficialR2 : rules.exarPracas;
      push(`Falta EXAR (${exarMissedYears}x)`, rule, exarMissedYears * rule.mult);
    }
    if (reserveActive && missedConvocacao) push("Falta à Convocação", isMfdv ? rules.convocacaoMfdv : rules.convocacaoPracaR2);
    if (reserveActive && missedResidencia) push("Omissão de Residência", isMfdv ? rules.residenciaMfdv : rules.residenciaPracaR2);
    if (reserveActive && mfdvMissedRenewals > 0)
      push(`Falta Renovação MFDV (${mfdvMissedRenewals}x)`, rules.mfdvAdiamento, mfdvMissedRenewals * rules.mfdvAdiamento.mult);
    if (reserveActive && mfdvLateDiploma) push("Atraso Apresentação Diploma", rules.mfdvDiploma);

    if (!isExtravioDisabled) {
      if (lostDocs.cr_csm) push("Extravio de CR/CSM", rules.extravioCrCsm);
      if (!isExarActive && lostDocs.cdi_ci_cdsa) push("Extravio de CDI/CI/CDSA", rules.extravioCdiCiCdsa);
    }

    const emissionMult = (m) => (certificateType === "analogico" && analogLegible ? 0 : m);
    if (!isExarActive) {
      const taxMap = {
        cdi: ["Requerer CDI", rules.taxaCdi],
        cdsa: ["Requerer CDSA", rules.taxaCdsa],
        ci: ["Requerer CI", rules.taxaCi],
        cr: ["Requerer CR", rules.taxaCr],
        csm: ["Requerer CSM", rules.taxaCsm],
        adiamento: ["Adiamento Incorporação", rules.taxaAdiamento],
      };
      for (const [key, [label, rule]] of Object.entries(taxMap)) {
        if (taxRequests[key]) push(label, rule, emissionMult(rule.mult));
      }
    }

    const isExempt = exemption !== "none";
    if (isExempt && total > 0) {
      breakdown.push({ label: "Isenção Legal", amparo: "Art 225 RLSM", mult: 0, amount: -total });
      total = 0;
    }
    return { breakdown, total: Math.max(0, total), isExempt, hasItems: breakdown.length > 0 };
  }, [
    baseFee, rules, analysis, multipleEnlistments, refractoryYears, reserveCategory,
    exarMissedYears, missedConvocacao, missedResidencia, mfdvMissedRenewals, mfdvLateDiploma,
    lostDocs, taxRequests, exemption, certificateType, analogLegible, isExtravioDisabled, isExarActive,
    activeSection,
  ]);

  const handleTaxToggle = (key, checked) =>
    setTaxRequests(
      checked
        ? { cdi: false, cdsa: false, ci: false, cr: false, csm: false, adiamento: false, [key]: true }
        : (prev) => ({ ...prev, [key]: false }),
    );

  const handleLostDocsToggle = (key, checked) =>
    setLostDocs(checked ? { cr_csm: false, cdi_ci_cdsa: false, [key]: true } : (prev) => ({ ...prev, [key]: false }));

  const handleRestoreDefaults = () => {
    setRules(DEFAULT_RULES);
    setBaseFee(DEFAULT_BASE_FEE);
    try {
      localStorage.removeItem("jsm_rules");
      localStorage.removeItem("jsm_baseFee");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-green-50 p-4 pb-24 md:p-8 md:pb-8 font-sans text-slate-900 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="bg-green-600 text-white rounded-xl overflow-hidden shadow-2xl border-b-8 border-green-300 relative print:hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <ShieldAlert size={120} />
          </div>
          <div className="p-5 relative z-10 flex flex-wrap gap-3 justify-end items-center">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 ${showSettings ? "bg-green-300 border-green-300 text-green-800" : "bg-transparent border-green-300 text-green-300 hover:bg-green-300 hover:text-green-800"}`}
            >
              <BookOpen size={16} />
              Amparos
            </button>

            <div className="bg-green-700 p-3 rounded-lg border border-green-600 flex items-center gap-3 shadow-inner">
              <span className="text-[10px] text-green-300 font-black uppercase tracking-tighter">
                Valor Base (R$)
              </span>
              <input
                type="number"
                step="0.01"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-20 bg-white/10 text-white font-mono font-bold outline-none border-b border-green-300 focus:bg-white/20 px-1 text-lg"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8 print:hidden">
            {showSettings && (
              <section className="bg-white rounded-2xl shadow-xl border-l-8 border-green-300 overflow-hidden">
                <div className="bg-green-50 p-4 border-b flex justify-between items-center">
                  <h2 className="text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                    <BookOpen size={18} /> Configurar Amparos da Lei
                  </h2>
                  <button
                    onClick={handleRestoreDefaults}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 hover:text-rose-800 border border-rose-200 hover:border-rose-400 px-2 py-1 rounded-lg transition-all"
                  >
                    <RefreshCw size={10} /> Restaurar Padrões
                  </button>
                </div>
                <div className="p-4 space-y-5 max-h-[600px] overflow-y-auto">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Edite o multiplicador e a referência legal de cada ocasião.
                    Alterações persistem automaticamente.
                  </p>
                  {RULE_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-green-700 border-b border-green-100 pb-1 mb-2">
                        {group.label}
                      </h3>
                      {group.keys.map((key) => {
                        const item = AMPAROS_LEGAIS.find((a) => a.key === key);
                        if (!item) return null;
                        return (
                          <div
                            key={key}
                            className="grid grid-cols-[1fr_60px_1fr] gap-2 items-center py-1.5 px-2 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            <span className="text-[10px] font-bold text-slate-600 leading-tight">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                className="w-10 text-center text-xs font-mono font-black bg-green-50 border border-green-200 rounded p-1 outline-none focus:border-green-600"
                                value={rules[key]?.mult ?? 0}
                                onChange={(e) =>
                                  setRules((prev) => ({
                                    ...prev,
                                    [key]: { ...prev[key], mult: Number(e.target.value) },
                                  }))
                                }
                              />
                              <span className="text-[9px] text-slate-400 font-bold">x</span>
                            </div>
                            <input
                              type="text"
                              className="text-[9px] font-mono bg-green-50 border border-green-200 rounded p-1 outline-none focus:border-green-600 text-slate-600 w-full"
                              value={rules[key]?.amparo ?? ""}
                              onChange={(e) =>
                                setRules((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], amparo: e.target.value },
                                }))
                              }
                              placeholder="Art..."
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-green-600 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setActiveSection("enlistment")}
                  className="w-full flex justify-between items-center text-left"
                  aria-expanded={activeSection === "enlistment"}
                >
                  <span className="text-sm font-black uppercase tracking-widest text-green-700 flex items-center gap-2">
                    <User size={18} /> 1. Ficha do Cidadão
                  </span>
                  <span className="text-[10px] font-black uppercase text-green-700">
                    {activeSection === "enlistment" ? "Aberta" : "Abrir"}
                  </span>
                </button>
              </div>
              {activeSection === "enlistment" && (
                <>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Ano de Nascimento (Classe)
                  </label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-3 text-green-600" size={20} />
                    <input
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full pl-12 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-green-600 outline-none font-mono font-bold text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Capacidade Contributiva
                  </label>
                  <select
                    value={exemption}
                    onChange={(e) => setExemption(e.target.value)}
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-green-600 outline-none font-bold text-slate-700"
                  >
                    <option value="none">Normal (Pagamento Integral)</option>
                    <option value="low_income">Isento (Art. 225 RLSM)</option>
                  </select>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Data do Alistamento <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        required
                        value={enlistmentDate}
                        onChange={(e) => setEnlistmentDate(e.target.value)}
                        className={`w-full p-3 bg-white border-2 rounded-xl outline-none font-mono font-bold text-lg transition-colors ${enlistmentDate ? "border-slate-100 focus:border-green-600" : "border-rose-200 focus:border-rose-500"}`}
                      />
                    </div>

                    {!enlistmentDate && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span className="text-[11px] font-bold leading-snug">
                          Informe a data do alistamento para que o sistema determine o prazo e
                          a obrigatoriedade de comparecimento à CS.
                        </span>
                      </div>
                    )}

                    {analysis.valid && (
                      <div className="space-y-2">
                        <div
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${analysis.status === "on_time" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {analysis.status === "on_time" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                          {analysis.headline}
                        </div>

                        <div
                          className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border ${analysis.csMandatoryThisYear ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-amber-50 border-amber-300 text-amber-900"}`}
                        >
                          <Info size={15} className="mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest">
                              {analysis.isOver30
                                ? "Maior de 30 anos: não vai à CS"
                                : analysis.csMandatoryThisYear
                                  ? `CS de ${analysis.enrollYear}: comparecimento obrigatório`
                                  : `CS de ${analysis.enrollYear}: comparecimento NÃO obrigatório`}
                            </p>
                            <p className="text-[11px] font-bold leading-snug">{analysis.notice}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {historyYears.length > 0 && !analysis.isOver30 && (
                    <div className="space-y-1 pt-2 border-t border-slate-200">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        Histórico de CS — Seleção Geral
                      </p>
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        {historyYears.map((year) => {
                          const mandatory = isCsMandatoryForYear(analysis, year);
                          const isEnrollYear = year === analysis.enrollYear;
                          const isCurrent = year === currentYear;
                          const rec = csRecords[year] ?? { shouldAttend: true, attended: false, happened: false };
                          const needsHappened = isCurrent;
                          const isMiss =
                            mandatory &&
                            (needsHappened
                              ? rec.happened && rec.shouldAttend && !rec.attended
                              : rec.shouldAttend && !rec.attended);
                          const isOk = mandatory
                            ? needsHappened
                              ? !rec.happened || !rec.shouldAttend || rec.attended
                              : !rec.shouldAttend || rec.attended
                            : rec.attended;

                          const btn = "px-2.5 py-1 text-[9px] rounded font-black transition-all";
                          const yes = (on) =>
                            `${btn} ${on ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-400"}`;
                          const no = (on, danger) =>
                            `${btn} ${on ? (danger ? "bg-rose-700" : "bg-slate-500") + " text-white" : "bg-white border border-slate-200 text-slate-400"}`;

                          return (
                            <div
                              key={year}
                              className={`px-3 py-2.5 border-b border-slate-100 last:border-0 ${isEnrollYear ? "bg-green-50" : isMiss ? "bg-rose-50" : "bg-white"}`}
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5 w-20 shrink-0">
                                  <span className="text-xs font-black text-slate-700">{year}</span>
                                  {isEnrollYear && (
                                    <span className="text-[8px] bg-green-200 text-green-800 px-1 py-0.5 rounded font-black uppercase">
                                      alist.
                                    </span>
                                  )}
                                  {isCurrent && !isEnrollYear && (
                                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-black uppercase">
                                      atual
                                    </span>
                                  )}
                                </div>

                                {!mandatory ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded">
                                      Não obrigatório — sem multa por falta
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                                        Compareceu?
                                      </span>
                                      <button onClick={() => updateCsRecord(year, "attended", true)} className={yes(rec.attended)}>
                                        Sim
                                      </button>
                                      <button onClick={() => updateCsRecord(year, "attended", false)} className={no(!rec.attended, false)}>
                                        Não
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {needsHappened && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Já ocorreu?</span>
                                        <button onClick={() => updateCsRecord(year, "happened", true)} className={yes(rec.happened)}>
                                          Sim
                                        </button>
                                        <button onClick={() => updateCsRecord(year, "happened", false)} className={no(!rec.happened, false)}>
                                          Não
                                        </button>
                                      </div>
                                    )}
                                    {(!needsHappened || rec.happened) && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                          Deveria comparecer?
                                        </span>
                                        <button onClick={() => updateCsRecord(year, "shouldAttend", true)} className={yes(rec.shouldAttend)}>
                                          Sim
                                        </button>
                                        <button onClick={() => updateCsRecord(year, "shouldAttend", false)} className={no(!rec.shouldAttend, false)}>
                                          Não
                                        </button>
                                      </div>
                                    )}
                                    {(!needsHappened || rec.happened) && rec.shouldAttend && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Compareceu?</span>
                                        <button onClick={() => updateCsRecord(year, "attended", true)} className={yes(rec.attended)}>
                                          Sim
                                        </button>
                                        <button onClick={() => updateCsRecord(year, "attended", false)} className={no(!rec.attended, true)}>
                                          Não
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}

                                <span
                                  className={`ml-auto text-[9px] font-black shrink-0 ${isMiss ? "text-rose-600" : isOk ? "text-emerald-600" : "text-slate-400"}`}
                                >
                                  {isMiss ? "✗ Falta" : isOk ? "✓ Ok" : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border-2 ${multipleEnlistments ? "bg-green-600 border-green-600" : "border-slate-300"}`}
                    >
                      {multipleEnlistments && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={multipleEnlistments}
                      onChange={(e) => setMultipleEnlistments(e.target.checked)}
                      className="hidden"
                    />
                    <span className="text-sm font-bold text-slate-600 group-hover:text-green-700">
                      Alistamento Múltiplo (Tentativa de fraude)
                    </span>
                  </label>
                </div>
              </div>
              </>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-green-700 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection("reserve")}
                  className="w-full flex justify-between items-center text-left"
                  aria-expanded={activeSection === "reserve"}
                >
                  <span className="text-sm font-black uppercase tracking-widest text-green-800 flex items-center gap-2">
                    <ShieldAlert size={18} /> 2. Obrigações e Reserva
                  </span>
                  <span className="text-[10px] font-black uppercase text-green-800">
                    {activeSection === "reserve" ? "Aberta" : "Abrir"}
                  </span>
                </button>
              </div>
              {activeSection === "reserve" && (
                <div className="p-6 space-y-6">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Seleção Geral (CS)
                    </span>
                    {refractoryYears > 0 ? (
                      <div className="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg">
                        <AlertCircle size={13} />
                        <span className="text-xs font-black uppercase">
                          {refractoryYears} {refractoryYears === 1 ? "ano" : "anos"} refratário
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg">
                        <CheckCircle size={13} />
                        <span className="text-xs font-black uppercase">Em dia</span>
                      </div>
                    )}
                  </div>
                  {!analysis.valid && (
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                      Informe a data do alistamento para calcular
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-600/5 rounded-xl border border-green-600/10">
                    <MapPin className="text-green-700" size={20} />
                    <select
                      value={reserveCategory}
                      onChange={(e) => setReserveCategory(e.target.value)}
                      className="bg-transparent w-full outline-none font-black uppercase text-xs text-green-700 cursor-pointer"
                    >
                      <option value="pracas">Praças</option>
                      <option value="oficial_r2">Oficial R/2</option>
                      <option value="oficial_mfdv">Oficial MFDV (Médico/Dent/Vet)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Faltas EXAR:</span>
                      <input
                        type="number"
                        min="0"
                        max={SYSTEM_SETTINGS.maxExarYears}
                        value={exarMissedYears}
                        onChange={(e) => setExarMissedYears(Number(e.target.value))}
                        className="w-12 text-center font-mono font-black text-slate-700 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setMissedConvocacao(!missedConvocacao)}
                      className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between border-2 ${missedConvocacao ? "bg-rose-700 border-rose-700 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"}`}
                    >
                      <span>Falta Convocação</span>
                      {missedConvocacao ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded" />}
                    </button>
                    <button
                      onClick={() => setMissedResidencia(!missedResidencia)}
                      className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between border-2 ${missedResidencia ? "bg-rose-700 border-rose-700 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"}`}
                    >
                      <span>Omissão de Residência</span>
                      {missedResidencia ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded" />}
                    </button>
                    {reserveCategory === "oficial_mfdv" && (
                      <>
                        <div className="p-4 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase">Falta Renov. MFDV:</span>
                          <input
                            type="number"
                            min="0"
                            value={mfdvMissedRenewals}
                            onChange={(e) => setMfdvMissedRenewals(Number(e.target.value))}
                            className="w-12 text-center font-mono font-black text-slate-700 outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setMfdvLateDiploma(!mfdvLateDiploma)}
                          className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between border-2 ${mfdvLateDiploma ? "bg-rose-700 border-rose-700 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"}`}
                        >
                          <span>Atraso Diploma MFDV</span>
                          {mfdvLateDiploma ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 border-2 border-slate-200 rounded" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow-xl border-l-8 border-slate-400 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center gap-2 text-slate-600">
                <FileText size={18} />
                <h2 className="text-sm font-black uppercase tracking-widest">3. Processos e Documentos</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tipo de Registro</label>
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                      <button
                        onClick={() => setCertificateType("digital")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${certificateType === "digital" ? "bg-green-600 text-white" : "text-slate-400"}`}
                      >
                        Digital
                      </button>
                      <button
                        onClick={() => setCertificateType("analogico")}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded ${certificateType === "analogico" ? "bg-green-600 text-white" : "text-slate-400"}`}
                      >
                        Analógico
                      </button>
                    </div>
                  </div>
                  {certificateType === "analogico" && (
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Estado Físico</label>
                      <select
                        value={analogLegible ? "sim" : "nao"}
                        onChange={(e) => setAnalogLegible(e.target.value === "sim")}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none"
                      >
                        <option value="sim">Legível/Conservado</option>
                        <option value="nao">Rasurado/Inutilizado</option>
                      </select>
                    </div>
                  )}
                </div>

                {isExarActive ? (
                  <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-200 border-dashed flex flex-col items-center text-center gap-3">
                    <Lock className="text-amber-600" size={32} />
                    <div>
                      <p className="text-xs font-black uppercase text-amber-800">Emissão Bloqueada</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mt-1">
                        Cidadão com débitos de EXAR não pode requerer novos documentos até a
                        regularização da multa.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-green-700 uppercase border-b pb-1">
                        Taxas de Emissão
                      </h4>
                      {["cdi", "cdsa", "ci", "cr", "csm", "adiamento"].map((tax) => (
                        <label
                          key={tax}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${taxRequests[tax] ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Requerer {tax.toUpperCase()}
                          </span>
                          <input
                            type="checkbox"
                            checked={taxRequests[tax]}
                            onChange={(e) => handleTaxToggle(tax, e.target.checked)}
                            className="hidden"
                          />
                          {taxRequests[tax] ? <CheckCircle size={14} /> : <div className="w-3 h-3 border-2 border-slate-200 rounded" />}
                        </label>
                      ))}
                    </div>
                    <div className={`space-y-3 ${isExtravioDisabled ? "opacity-30 pointer-events-none" : ""}`}>
                      <h4 className="text-[10px] font-black text-rose-700 uppercase border-b pb-1">
                        Multas por Extravio
                      </h4>
                      {Object.keys(lostDocs).map((lost) => (
                        <label
                          key={lost}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${lostDocs[lost] ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                        >
                          <span className="text-[10px] font-black uppercase leading-tight">
                            {lost.replace(/_/g, " ")}
                          </span>
                          <input
                            type="checkbox"
                            checked={lostDocs[lost]}
                            onChange={(e) => handleLostDocsToggle(lost, e.target.checked)}
                            className="hidden"
                          />
                          {lostDocs[lost] ? <AlertCircle size={16} /> : <div className="w-4 h-4 border-2 border-slate-200 rounded" />}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-200 flex flex-col lg:h-[calc(100vh-6rem)] lg:max-h-[900px]">
              <div className="bg-white p-6 text-center border-b-2 border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-400" />
                <div className="space-y-1 relative z-10">
                  <div className="flex flex-col items-center pt-2">
                    <div className="w-12 h-0.5 bg-green-400 mb-3" />
                    <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800">
                      Extrato de Recolhimento
                    </h2>
                  </div>
                </div>
              </div>
              <div className="lg:flex-1 lg:overflow-y-auto p-6 bg-[#FAFAF8] space-y-4">
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
                          <p className="text-xs font-black uppercase text-slate-700 leading-tight">
                            {item.label}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[8px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded tracking-tighter uppercase font-mono">
                              {item.amparo}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase font-mono">
                              {item.mult}x R$ {baseFee.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-mono font-black ${item.amount < 0 ? "text-emerald-600" : "text-slate-900"}`}
                        >
                          {item.amount < 0 ? "-" : ""} R${" "}
                          {Math.abs(item.amount).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white p-6 space-y-4 border-t-2 border-slate-100">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">
                    Total a Recolher
                  </span>
                  <span
                    className={`text-3xl font-black font-mono tracking-tighter ${calculations.isExempt ? "text-emerald-600" : "text-slate-900"}`}
                  >
                    R$ {calculations.total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 text-xs"
                >
                  <FileText size={16} className="text-green-300" /> Imprimir Comprovante
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-green-200 shadow-2xl px-4 py-3 flex items-center justify-between gap-4 print:hidden">
          <div>
            <p className="text-[9px] font-black text-green-600 uppercase tracking-wider">Total a Recolher</p>
            <p className={`text-2xl font-black font-mono ${calculations.isExempt ? "text-emerald-600" : "text-slate-900"}`}>
              R$ {calculations.total.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 shrink-0"
          >
            <FileText size={14} className="text-green-300" /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
