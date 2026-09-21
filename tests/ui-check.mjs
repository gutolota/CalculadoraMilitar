import { chromium } from 'playwright-core';

const URL = 'http://localhost:4181/CalculadoraMilitar/';
const fails = [];
const ok = (msg) => console.log('  ok   ', msg);
const bad = (msg) => { console.log('  FAIL ', msg); fails.push(msg); };

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

console.log('\n== boot ==');
const rootKids = await page.locator('#root > *').count();
rootKids > 0 ? ok(`app montou (${rootKids} filhos em #root)`) : bad('app nao montou');
errors.length === 0 ? ok('sem erros de console') : bad('erros: ' + errors.join(' | '));

const norm = (x) => x.toLowerCase().normalize('NFC');
const body = async () => norm(await page.locator('body').innerText());

console.log('\n== item 3: botoes removidos ==');
let t = await body();
for (const kw of ['usar classe', 'data exata', 'Informar Data de Alistamento']) {
  t.includes(norm(kw)) ? bad(`ainda presente: "${kw}"`) : ok(`removido: "${kw}"`);
}
t.includes(norm('Ano de Nascimento (Classe)')) ? ok('campo "Ano de Nascimento (Classe)" mantido') : bad('campo classe sumiu');
t.includes(norm('Data do Alistamento')) ? ok('campo "Data do Alistamento" presente') : bad('campo data ausente');

const dateInput = page.locator('input[type="date"]');
(await dateInput.count()) === 1 ? ok('input type=date (calendario) presente') : bad('input date ausente/duplicado');

console.log('\n== versao leve ==');
for (const kw of ['Configurar Regras', 'Motor Dinâmico', 'Fluxograma']) {
  t.includes(kw) ? bad(`fluxograma ainda exposto: "${kw}"`) : ok(`removido: "${kw}"`);
}

console.log('\n== item 1: valor base 6,69 ==');
const baseVal = await page.locator('header input[type="number"]').first().inputValue();
baseVal === '6.69' ? ok('valor base = 6.69') : bad(`valor base = ${baseVal}, esperado 6.69`);

console.log('\n== item 2: botao AMPAROS ==');
await page.getByRole('button', { name: /amparos/i }).click();
await page.waitForTimeout(300);
t = await body();
t.includes(norm('Configurar Amparos da Lei')) ? ok('painel de amparos abriu') : bad('painel de amparos nao abriu');
const multInputs = await page.locator('section input[type="number"][min="0"]').count();
multInputs >= 20 ? ok(`${multInputs} multiplicadores editaveis`) : bad(`so ${multInputs} multiplicadores`);
const amparoTexts = await page.locator('section input[type="text"]').count();
amparoTexts >= 20 ? ok(`${amparoTexts} referencias legais editaveis`) : bad(`so ${amparoTexts} refs legais`);

// persistencia
const firstMult = page.locator('section input[type="number"][min="0"]').first();
await firstMult.fill('7');
await page.waitForTimeout(400);
const stored = await page.evaluate(() => localStorage.getItem('jsm_rules'));
stored && JSON.parse(stored).alistamentoAtraso?.mult === 7
  ? ok('alteracao persiste automaticamente em localStorage')
  : bad('alteracao nao persistiu');
await firstMult.fill('1');
await page.waitForTimeout(300);
await page.getByRole('button', { name: /amparos/i }).click();
await page.waitForTimeout(300);

const setDate = async (iso) => {
  await dateInput.fill(iso);
  await page.waitForTimeout(800);
  return norm(await page.locator('body').innerText());
};
const setBirth = async (year) => {
  await page.locator('input[type="number"]').nth(1).fill(String(year));
  await page.waitForTimeout(900);
};

console.log('\n== cenario 1: classe do ano, no prazo (01/01-30/06) ==');
await setBirth(2008);
t = await setDate('2026-03-10');
t.includes(norm('No Prazo')) ? ok('marcado como No Prazo') : bad('nao marcou No Prazo');
t.includes(norm('comparecimento obrigatório')) ? ok('CS obrigatoria sinalizada') : bad('nao sinalizou CS obrigatoria');
t.includes(norm('Fora do prazo para alistamento')) ? bad('cobrou multa de alistamento indevida') : ok('sem multa de alistamento');

console.log('\n== cenario 2: classe do ano, 2o semestre ==');
await setBirth(2008);
t = await setDate('2026-08-20');
t.includes(norm('Fora do Prazo')) ? ok('marcado como Fora do Prazo') : bad('nao marcou fora do prazo');
t.includes(norm('Fora do prazo para alistamento')) ? ok('multa de alistamento no extrato') : bad('faltou multa de alistamento');
t.includes(norm('NÃO obrigatório')) ? ok('CS NAO obrigatoria sinalizada') : bad('nao avisou que CS nao e obrigatoria');
t.includes(norm('compor a classe 2009')) ? ok('avisa que passa para a classe 2009') : bad('nao avisou mudanca de classe');
t.includes(norm('Não obrigatório — sem multa por falta')) ? ok('historico marca ano sem multa') : bad('historico nao marcou isencao de falta');
// valor: 1x 6,69
t.match(/r\$\s*6,69/) ? ok('total 1x R$ 6,69') : bad('valor esperado 6,69 nao encontrado');

console.log('\n== cenario 3a: classe anterior, 1o semestre ==');
await setBirth(2005);
t = await setDate('2026-04-02');
t.includes(norm('Fora do Prazo')) ? ok('fora do prazo') : bad('nao marcou fora do prazo');
t.includes(norm('comparecimento obrigatório')) ? ok('CS obrigatoria (1o sem)') : bad('deveria exigir CS');
t.includes(norm('DEVE obrigatoriamente comparecer')) ? ok('texto explica obrigacao') : bad('faltou explicacao');

console.log('\n== cenario 3b: classe anterior, 2o semestre ==');
t = await setDate('2026-09-05');
t.includes(norm('NÃO obrigatório')) ? ok('CS NAO obrigatoria (2o sem)') : bad('deveria dispensar CS');
t.includes(norm('NÃO pode ser cobrada')) ? ok('texto explica nao-cobranca') : bad('faltou explicacao de nao-cobranca');

console.log('\n== classe = ano de nascimento (casos das fotos) ==');
await setBirth(2003);
t = await setDate('2021-06-20');
t.includes(norm('é da classe 2003')) ? ok('foto 1: cita classe 2003') : bad('foto 1: nao citou classe 2003');
t.includes(norm('classe 2021')) ? bad('foto 1: ainda cita classe 2021') : ok('foto 1: nao cita classe 2021');
t.includes(norm('NO PRAZO')) ? ok('foto 1: no prazo') : bad('foto 1: deveria estar no prazo');
await page.screenshot({ path: '/tmp/calc-foto1.png', fullPage: true });

await setBirth(2005);
t = await setDate('2024-06-20');
t.includes(norm('FORA DO PRAZO - 1 ANO DE ATRASO, COM 19 ANOS')) ? ok('foto 2: selo correto') : bad('foto 2: selo errado');
t.includes(norm('classe 2005')) ? ok('foto 2: cita classe 2005') : bad('foto 2: nao citou classe 2005');
t.includes(norm('classe 2023')) ? bad('foto 2: ainda cita classe 2023') : ok('foto 2: nao cita classe 2023');
await page.screenshot({ path: '/tmp/calc-foto2.png', fullPage: true });

console.log('\n== maior de 30 anos (mais de 28 no ano do alistamento) ==');
await setBirth(1996);
t = await setDate('2026-03-10');
t.includes(norm('FORA DO PRAZO - 12 ANOS DE ATRASO, MAIOR DE 30 ANOS'))
  ? ok('mensagem exigida exibida')
  : bad('mensagem "FORA DO PRAZO - 12 ANOS DE ATRASO, MAIOR DE 30 ANOS" ausente');
t.includes(norm('Maior de 30 anos: não vai à CS')) ? ok('aviso de dispensa de CS') : bad('faltou aviso de dispensa');
t.includes(norm('Histórico de CS')) ? bad('historico de CS nao deveria aparecer') : ok('historico de CS oculto');
t.includes(norm('Fora do prazo para alistamento')) ? ok('multa de alistamento no extrato') : bad('faltou multa de alistamento');
t.includes(norm('Faltar à CS')) ? bad('cobrou multa de CS indevida') : ok('sem multa de CS');
t.match(/r\$\s*6,69/) ? ok('total 1x R$ 6,69') : bad('total esperado 6,69 nao encontrado');
await page.screenshot({ path: '/tmp/calc-maior30.png', fullPage: true });

console.log('\n== limite: 28 anos ainda vai a CS ==');
await setBirth(1998);
t = await setDate('2026-03-10');
t.includes(norm('MAIOR DE 30 ANOS')) ? bad('28 anos nao deveria disparar a regra') : ok('28 anos: regra nao aplicada');
t.includes(norm('comparecimento obrigatório')) ? ok('28 anos: CS obrigatoria') : bad('28 anos deveria exigir CS');

await page.screenshot({ path: '/tmp/calc-cenario3b.png', fullPage: true });
t = await setDate('2026-08-20');
await setBirth(2008);
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/calc-cenario2.png', fullPage: true });

await browser.close();
console.log(`\n=== ${fails.length === 0 ? 'TUDO OK' : fails.length + ' FALHA(S)'} ===`);
if (fails.length) { fails.forEach(f => console.log(' - ' + f)); process.exit(1); }
