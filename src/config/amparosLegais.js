export const AMPAROS_LEGAIS = [
  { key: 'alistamentoAtraso',   label: 'Fora do prazo para alistamento',      mult: 1,  amparo: 'Nr 1) Art 176 RLSM' },
  { key: 'alistamentoMultiplo', label: 'Alistar-se mais de uma vez',           mult: 3,  amparo: 'Art 44 e Nr 1) Art 177 RLSM' },
  { key: 'refratario1',         label: 'Faltar à CS (1ª vez)',                 mult: 1,  amparo: 'Nr 2) Art 176 RLSM' },
  { key: 'refratario2',         label: 'Faltar à CS (2ª vez)',                 mult: 5,  amparo: 'Nr 1) Art 178 RLSM' },
  { key: 'refratario3Mais',     label: 'Faltas extras CS (3ª vez em diante)',  mult: 5,  amparo: 'Nr 2) Art 178 RLSM' },
  { key: 'exarPracaR2',         label: 'Falta EXAR — Praça/R2',               mult: 3,  amparo: 'Art. 47 LSM e Nr 3 Art. 177 RLSM' },
  { key: 'exarMfdv',            label: 'Falta EXAR — Oficial MFDV',           mult: 5,  amparo: 'Art. 52 e 58, c) LMFDV' },
  { key: 'convocacaoPracaR2',   label: 'Falta à Convocação — Praça/R2',       mult: 3,  amparo: 'Art. 47 LSM e Nr 3 Art. 177 RLSM' },
  { key: 'convocacaoMfdv',      label: 'Falta à Convocação — MFDV',           mult: 15, amparo: 'Art. 60(a) LMFDV' },
  { key: 'residenciaPracaR2',   label: 'Omissão de Residência — Praça/R2',    mult: 3,  amparo: 'Art. 47 LSM e Nr 4 Art. 177 RLSM' },
  { key: 'residenciaMfdv',      label: 'Omissão de Residência — MFDV',        mult: 15, amparo: 'Art. 60(b) LMFDV' },
  { key: 'mfdvAdiamento',       label: 'Falta Renovação MFDV',                mult: 1,  amparo: 'Art 73, 74 e 75 RLMFDV' },
  { key: 'mfdvDiploma',         label: 'Atraso Apresentação Diploma MFDV',     mult: 5,  amparo: 'Art 58 LMFDV' },
  { key: 'extravioCrCsm',       label: 'Extravio de CR/CSM',                  mult: 3,  amparo: 'Nr 1) Art 177 RLSM' },
  { key: 'extravioCdiCiCdsa',   label: 'Extravio de CDI/CI/CDSA',             mult: 3,  amparo: 'Nr 1) Art 177 RLSM' },
  { key: 'taxaCdi',             label: 'Taxa emissão CDI',                     mult: 1,  amparo: '§ 2º 107 RLSM' },
  { key: 'taxaCdsa',            label: 'Taxa emissão CDSA',                    mult: 1,  amparo: '§ 3º Art 43 RLPSA' },
  { key: 'taxaCi',              label: 'Taxa emissão CI',                      mult: 0,  amparo: 'Art 165 RLSM' },
  { key: 'taxaCr',              label: 'Taxa emissão CR',                      mult: 0,  amparo: '' },
  { key: 'taxaCsm',             label: 'Taxa emissão CSM',                     mult: 0,  amparo: '' },
  { key: 'taxaAdiamento',       label: 'Taxa Adiamento Incorporação',          mult: 1,  amparo: 'Art 103 RLSM' },
];

export const RULE_GROUPS = [
  { label: 'Alistamento', keys: ['alistamentoAtraso', 'alistamentoMultiplo'] },
  { label: 'CS e Refratário', keys: ['refratario1', 'refratario2', 'refratario3Mais'] },
  { label: 'Reserva e Serviços', keys: ['exarPracaR2', 'exarMfdv', 'convocacaoPracaR2', 'convocacaoMfdv', 'residenciaPracaR2', 'residenciaMfdv'] },
  { label: 'MFDV', keys: ['mfdvAdiamento', 'mfdvDiploma'] },
  { label: 'Documentos', keys: ['extravioCrCsm', 'extravioCdiCiCdsa', 'taxaCdi', 'taxaCdsa', 'taxaCi', 'taxaCr', 'taxaCsm', 'taxaAdiamento'] },
];

export const DEFAULT_RULES = Object.fromEntries(
  AMPAROS_LEGAIS.map(({ key, mult, amparo }) => [key, { mult, amparo }])
);
