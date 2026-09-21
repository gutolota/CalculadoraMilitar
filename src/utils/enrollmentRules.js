/**
 * Regras de alistamento e obrigatoriedade de Comissão de Seleção (CS).
 *
 * Módulo puro (sem React, sem DOM) para permitir teste automatizado.
 *
 * Conceitos:
 *  - "classe": ano em que o cidadão completa a idade militar (nascimento + 18).
 *  - prazo regular de alistamento: 01/01 a 30/06 do ano da classe.
 *  - quem se alista a partir de 01/07 está fora do prazo E passa a compor a
 *    classe posterior, portanto NÃO é obrigado a comparecer à CS do ano do
 *    alistamento (pode comparecer; se faltar, não cabe multa por falta à CS).
 */

export const MILITARY_AGE = 18;
export const ENROLLMENT_DEADLINE_MONTH = 6; // junho
/**
 * Acima desta idade no ANO do alistamento o cidadão é considerado maior de
 * 30 anos: não é encaminhado à CS e responde apenas pela multa de alistamento
 * fora do prazo. "Mais de 28 anos" => a partir de 29.
 */
export const OVER_30_AGE_THRESHOLD = 28;

/** Converte "AAAA-MM-DD" (valor de <input type="date">) em partes numéricas. */
export function parseISODate(iso) {
  if (typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Analisa a situação de alistamento.
 *
 * @param {object} params
 * @param {number|string} params.birthYear   ano de nascimento (classe de origem)
 * @param {string} params.enlistmentDate     data no formato "AAAA-MM-DD"
 * @param {number} [params.militaryAge=18]
 * @returns {{
 *   valid: boolean,
 *   status: 'on_time'|'late'|null,
 *   isLate: boolean,
 *   enrollYear: number|null,
 *   enrollMonth: number|null,
 *   classYear: number|null,
 *   effectiveClass: number|null,
 *   ageAtEnrollment: number|null,
 *   yearsLate: number|null,
 *   withinFirstSemester: boolean,
 *   csMandatoryThisYear: boolean,
 *   csFirstMandatoryYear: number|null,
 *   scenario: string|null,
 *   notice: string|null
 * }}
 */
export function analyzeEnrollment({ birthYear, enlistmentDate, militaryAge = MILITARY_AGE }) {
  const empty = {
    valid: false,
    status: null,
    isLate: false,
    isOver30: false,
    enrollYear: null,
    enrollMonth: null,
    classYear: null,
    effectiveClass: null,
    ageAtEnrollment: null,
    yearsLate: null,
    withinFirstSemester: false,
    csMandatoryThisYear: false,
    csFirstMandatoryYear: null,
    scenario: null,
    notice: null,
    headline: null,
  };

  const by = Number(birthYear);
  const date = parseISODate(enlistmentDate);
  if (!by || by < 1900 || by > 2100 || !date) return empty;

  const { year: enrollYear, month: enrollMonth } = date;
  const classYear = by + militaryAge;
  const ageAtEnrollment = enrollYear - by;
  const yearsLate = enrollYear - classYear;
  const withinFirstSemester = enrollMonth <= ENROLLMENT_DEADLINE_MONTH;

  // Fora do prazo sempre que: classe anterior (yearsLate > 0),
  // ou classe do ano porém a partir de 01/07.
  const isLate = yearsLate > 0 || (yearsLate === 0 && !withinFirstSemester);

  // Quem se apresenta no 2º semestre passa a compor a classe posterior:
  // a primeira CS obrigatória é a do ano seguinte.
  // Mais de 28 anos no ano do alistamento: o cidadão é tratado como maior de
  // 30 anos. Não é encaminhado à CS em nenhum ano; responde apenas pela multa
  // de alistamento fora do prazo.
  const isOver30 = ageAtEnrollment > OVER_30_AGE_THRESHOLD;

  const csMandatoryThisYear = isOver30 ? false : withinFirstSemester;
  const csFirstMandatoryYear = isOver30
    ? null
    : withinFirstSemester
      ? enrollYear
      : enrollYear + 1;
  const effectiveClass = isOver30 ? classYear : csFirstMandatoryYear;

  let scenario;
  let notice;

  if (isOver30) {
    scenario = 'maior_de_30';
    notice =
      `Fora do prazo para alistamento (classe ${classYear}, ${yearsLate} ` +
      `${yearsLate === 1 ? 'ano' : 'anos'} de atraso). Com ${ageAtEnrollment} anos no ano ` +
      `do alistamento, o cidadão é considerado MAIOR DE 30 ANOS: NÃO é encaminhado à ` +
      `Comissão de Seleção e NÃO pode ser cobrada multa por falta à CS. Recolhe apenas ` +
      `a multa por alistamento fora do prazo.`;
  } else if (yearsLate < 0) {
    scenario = 'antecipado';
    notice =
      `Alistamento anterior ao ano da classe (${classYear}). Confira o ano de ` +
      `nascimento e a data informada antes de prosseguir.`;
  } else if (yearsLate === 0 && withinFirstSemester) {
    scenario = 'classe_no_prazo';
    notice =
      `No prazo (01/01 a 30/06 de ${enrollYear}). O cidadão é da classe ${classYear} ` +
      `e DEVE comparecer à CS de ${enrollYear}. Se faltar, é considerado refratário ` +
      `e cabe multa por falta à CS.`;
  } else if (yearsLate === 0 && !withinFirstSemester) {
    scenario = 'classe_segundo_semestre';
    notice =
      `Fora do prazo para alistamento (a partir de 01/07 de ${enrollYear}) — cabe a ` +
      `multa de alistamento em atraso. O cidadão passa a compor a classe ` +
      `${effectiveClass} e NÃO é obrigado a comparecer à CS de ${enrollYear}: pode ser ` +
      `encaminhado e, se comparecer, fica em dia; se faltar, NÃO pode ser cobrada ` +
      `multa por falta à CS neste ano. A primeira CS obrigatória é a de ${csFirstMandatoryYear}.`;
  } else if (withinFirstSemester) {
    scenario = 'classe_anterior_primeiro_semestre';
    notice =
      `Fora do prazo para alistamento (classe ${classYear}, ${yearsLate} ` +
      `${yearsLate === 1 ? 'ano' : 'anos'} de atraso) — cabe a multa de alistamento em ` +
      `atraso. Por se apresentar entre 01/01 e 30/06, DEVE obrigatoriamente comparecer ` +
      `à CS de ${enrollYear}; se faltar, é considerado refratário e cabe multa por falta à CS.`;
  } else {
    scenario = 'classe_anterior_segundo_semestre';
    notice =
      `Fora do prazo para alistamento (classe ${classYear}, ${yearsLate} ` +
      `${yearsLate === 1 ? 'ano' : 'anos'} de atraso) — cabe a multa de alistamento em ` +
      `atraso. Por se apresentar a partir de 01/07, passa a compor a classe ` +
      `${effectiveClass} e NÃO é obrigado a comparecer à CS de ${enrollYear}: se ` +
      `comparecer fica em dia; se faltar, NÃO pode ser cobrada multa por falta à CS ` +
      `neste ano. A primeira CS obrigatória é a de ${csFirstMandatoryYear}.`;
  }

  // Texto curto exibido como selo de status na interface.
  let headline;
  if (isOver30) {
    headline =
      `FORA DO PRAZO - ${yearsLate} ${yearsLate === 1 ? 'ANO' : 'ANOS'} DE ATRASO, ` +
      `MAIOR DE 30 ANOS`;
  } else if (!isLate) {
    headline = 'NO PRAZO';
  } else if (yearsLate === 0) {
    headline = `FORA DO PRAZO - 2º SEMESTRE, COM ${ageAtEnrollment} ANOS`;
  } else {
    headline =
      `FORA DO PRAZO - ${yearsLate} ${yearsLate === 1 ? 'ANO' : 'ANOS'} DE ATRASO, ` +
      `COM ${ageAtEnrollment} ANOS`;
  }

  return {
    valid: true,
    status: isLate ? 'late' : 'on_time',
    isLate,
    isOver30,
    enrollYear,
    enrollMonth,
    classYear,
    effectiveClass,
    ageAtEnrollment,
    yearsLate,
    withinFirstSemester,
    csMandatoryThisYear,
    csFirstMandatoryYear,
    scenario,
    notice,
    headline,
  };
}

/**
 * Anos de CS a exibir no histórico, do primeiro ano relevante até o ano corrente.
 * O ano do alistamento entra na lista mesmo quando a CS não é obrigatória,
 * para que o secretário registre o comparecimento voluntário.
 */
export function csHistoryYears(analysis, currentYear) {
  if (!analysis?.valid) return [];
  const start = analysis.enrollYear;
  if (currentYear < start) return [start];
  const years = [];
  for (let y = start; y <= currentYear; y++) years.push(y);
  return years;
}

/** Um ano do histórico é cobrável por falta à CS? */
export function isCsMandatoryForYear(analysis, year) {
  if (!analysis?.valid) return false;
  if (analysis.isOver30) return false;
  if (year === analysis.enrollYear) return analysis.csMandatoryThisYear;
  return year >= analysis.csFirstMandatoryYear;
}

/**
 * Conta as faltas à CS puníveis.
 * @param {object} analysis         saída de analyzeEnrollment
 * @param {object} csRecords        { [ano]: { shouldAttend, attended, happened } }
 * @param {number} currentYear
 * @param {number} maxRefractoryYears
 */
export function countRefractoryYears(analysis, csRecords, currentYear, maxRefractoryYears) {
  if (!analysis?.valid) return 0;
  let count = 0;
  for (const year of csHistoryYears(analysis, currentYear)) {
    if (!isCsMandatoryForYear(analysis, year)) continue;
    const rec = csRecords?.[year] ?? {};
    const shouldAttend = rec.shouldAttend ?? true;
    const attended = rec.attended ?? false;
    // No ano corrente só conta falta se a CS já ocorreu.
    if (year === currentYear) {
      const happened = rec.happened ?? false;
      if (happened && shouldAttend && !attended) count++;
    } else if (shouldAttend && !attended) {
      count++;
    }
  }
  return Math.min(maxRefractoryYears, Math.max(0, count));
}
