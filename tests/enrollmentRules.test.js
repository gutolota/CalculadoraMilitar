import { describe, it, expect } from 'vitest';
import {
  analyzeEnrollment,
  parseISODate,
  csHistoryYears,
  isCsMandatoryForYear,
  countRefractoryYears,
} from '../src/utils/enrollmentRules.js';
import { DEFAULT_BASE_FEE, DEFAULT_RULES } from '../src/config/amparosLegais.js';

describe('valor base da taxa', () => {
  it('é 6,69', () => {
    expect(DEFAULT_BASE_FEE).toBe(6.69);
  });

  it('multa de alistamento em atraso = 1x R$ 6,69 (Nr 1) Art 176 RLSM)', () => {
    const rule = DEFAULT_RULES.alistamentoAtraso;
    expect(rule.mult).toBe(1);
    expect(rule.amparo).toBe('Nr 1) Art 176 RLSM');
    expect(+(rule.mult * DEFAULT_BASE_FEE).toFixed(2)).toBe(6.69);
  });
});

describe('parseISODate', () => {
  it('lê o formato do input type=date', () => {
    expect(parseISODate('2026-03-15')).toEqual({ year: 2026, month: 3, day: 15 });
  });
  it('rejeita entrada vazia ou malformada', () => {
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('15/03/2026')).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });
});

// Cenário 1 — cidadão da classe, dentro do prazo (01/01 a 30/06)
describe('cenário 1: classe do ano, alistamento no prazo', () => {
  // nasce em 2008 -> classe 2026
  const a = analyzeEnrollment({ birthYear: 2008, enlistmentDate: '2026-03-10' });

  it('está no prazo e sem multa de alistamento', () => {
    expect(a.valid).toBe(true);
    expect(a.status).toBe('on_time');
    expect(a.isLate).toBe(false);
  });

  it('é obrigado a comparecer à CS do próprio ano', () => {
    expect(a.csMandatoryThisYear).toBe(true);
    expect(a.csFirstMandatoryYear).toBe(2026);
    expect(isCsMandatoryForYear(a, 2026)).toBe(true);
  });

  it('faltar à CS gera refratário cobrável', () => {
    const n = countRefractoryYears(a, { 2026: { shouldAttend: true, attended: false, happened: true } }, 2026, 10);
    expect(n).toBe(1);
  });
});

// Cenário 2 — cidadão da classe que se apresenta a partir de 01/07
describe('cenário 2: classe do ano, alistamento no 2º semestre', () => {
  const a = analyzeEnrollment({ birthYear: 2008, enlistmentDate: '2026-08-20' });

  it('está fora do prazo (cabe multa de alistamento)', () => {
    expect(a.status).toBe('late');
    expect(a.isLate).toBe(true);
    expect(a.yearsLate).toBe(0);
  });

  it('passa a compor a classe posterior', () => {
    expect(a.classYear).toBe(2026);
    expect(a.effectiveClass).toBe(2027);
    expect(a.csFirstMandatoryYear).toBe(2027);
  });

  it('NÃO é obrigado a comparecer à CS do ano do alistamento', () => {
    expect(a.csMandatoryThisYear).toBe(false);
    expect(isCsMandatoryForYear(a, 2026)).toBe(false);
    expect(isCsMandatoryForYear(a, 2027)).toBe(true);
  });

  it('faltar à CS no ano do alistamento NÃO gera multa', () => {
    const n = countRefractoryYears(a, { 2026: { shouldAttend: true, attended: false, happened: true } }, 2026, 10);
    expect(n).toBe(0);
  });

  it('o aviso explica a não-obrigatoriedade ao secretário', () => {
    expect(a.notice).toMatch(/NÃO é obrigado a comparecer à CS de 2026/);
    expect(a.notice).toMatch(/se faltar, NÃO pode ser cobrada/i);
  });
});

// Cenário 3 — classe anterior
describe('cenário 3a: classe anterior, apresenta-se entre 01/01 e 30/06', () => {
  // nasce em 2005 -> classe 2023; alista em 2026
  const a = analyzeEnrollment({ birthYear: 2005, enlistmentDate: '2026-04-02' });

  it('está fora do prazo com anos de atraso', () => {
    expect(a.status).toBe('late');
    expect(a.classYear).toBe(2023);
    expect(a.yearsLate).toBe(3);
  });

  it('DEVE comparecer à CS do ano corrente', () => {
    expect(a.csMandatoryThisYear).toBe(true);
    expect(a.csFirstMandatoryYear).toBe(2026);
  });

  it('faltar torna refratário', () => {
    const n = countRefractoryYears(a, { 2026: { shouldAttend: true, attended: false, happened: true } }, 2026, 10);
    expect(n).toBe(1);
  });
});

describe('cenário 3b: classe anterior, apresenta-se a partir de 01/07', () => {
  const a = analyzeEnrollment({ birthYear: 2005, enlistmentDate: '2026-09-05' });

  it('está fora do prazo', () => {
    expect(a.status).toBe('late');
    expect(a.yearsLate).toBe(3);
  });

  it('não é obrigado à CS do ano, primeira obrigatória é a seguinte', () => {
    expect(a.csMandatoryThisYear).toBe(false);
    expect(a.csFirstMandatoryYear).toBe(2027);
    expect(isCsMandatoryForYear(a, 2026)).toBe(false);
  });

  it('faltar à CS no ano do alistamento NÃO gera multa', () => {
    const n = countRefractoryYears(a, { 2026: { shouldAttend: true, attended: false, happened: true } }, 2026, 10);
    expect(n).toBe(0);
  });
});

describe('limites de borda do prazo', () => {
  it('30/06 ainda é dentro do prazo', () => {
    const a = analyzeEnrollment({ birthYear: 2008, enlistmentDate: '2026-06-30' });
    expect(a.status).toBe('on_time');
    expect(a.csMandatoryThisYear).toBe(true);
  });
  it('01/07 já é fora do prazo', () => {
    const a = analyzeEnrollment({ birthYear: 2008, enlistmentDate: '2026-07-01' });
    expect(a.status).toBe('late');
    expect(a.csMandatoryThisYear).toBe(false);
  });
});

describe('entradas inválidas', () => {
  it('sem data não produz análise', () => {
    expect(analyzeEnrollment({ birthYear: 2008, enlistmentDate: '' }).valid).toBe(false);
  });
  it('sem ano de nascimento não produz análise', () => {
    expect(analyzeEnrollment({ birthYear: '', enlistmentDate: '2026-03-01' }).valid).toBe(false);
  });
  it('alistamento antes do ano da classe é sinalizado', () => {
    const a = analyzeEnrollment({ birthYear: 2010, enlistmentDate: '2026-03-01' });
    expect(a.scenario).toBe('antecipado');
    expect(a.notice).toMatch(/Confira o ano de nascimento/);
  });
});

describe('histórico de CS', () => {
  it('vai do ano do alistamento até o ano corrente', () => {
    const a = analyzeEnrollment({ birthYear: 2005, enlistmentDate: '2024-03-01' });
    expect(csHistoryYears(a, 2026)).toEqual([2024, 2025, 2026]);
  });

  it('acumula faltas de anos anteriores, respeitando o teto', () => {
    const a = analyzeEnrollment({ birthYear: 2005, enlistmentDate: '2024-03-01' });
    const records = {
      2024: { shouldAttend: true, attended: false },
      2025: { shouldAttend: true, attended: false },
      2026: { shouldAttend: true, attended: false, happened: false },
    };
    // 2026 ainda não ocorreu -> não conta
    expect(countRefractoryYears(a, records, 2026, 10)).toBe(2);
  });

  it('ano em que não deveria comparecer não conta falta', () => {
    const a = analyzeEnrollment({ birthYear: 2005, enlistmentDate: '2024-03-01' });
    const records = { 2024: { shouldAttend: false, attended: false } };
    expect(countRefractoryYears(a, records, 2024, 10)).toBe(0);
  });
});
