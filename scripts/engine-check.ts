// Auto-verificação do motor matemático: `npm run test:engine`
import { MODALITY_BY_CODE } from '../src/data/modalities.ts';
import { ALL_IDS } from '../src/data/athletics.ts';
import { BYE } from '../src/types.ts';
import type { AppState, BracketState } from '../src/types.ts';
import { normalizeBracket, resolveBracket } from '../src/lib/bracket.ts';
import { computeModality, computeOverview } from '../src/lib/scoring.ts';
import { defaultState } from '../src/lib/storage.ts';

let fails = 0;
const eq = (label: string, got: unknown, exp: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(exp);
  if (!ok) fails++;
  console.log(`${ok ? '✅' : '❌'} ${label}: ${JSON.stringify(got)}${ok ? '' : `  (esperado ${JSON.stringify(exp)})`}`);
};

// ---------- 1. Estado inicial oficial UFU 2026 ----------
const s0 = defaultState();
const o0 = computeOverview(s0);
const row = (o: ReturnType<typeof computeOverview>, id: string) => {
  const r = o.rows.find((x) => x.athletic.id === id)!;
  return [r.min, r.max, r.avg];
};
eq('Engenharia inicial', row(o0, 'engenharia'), [0, 325, 162.5]);
// Agrárias tem BYE oficial no TCM, garantindo quartas (mín = 2)
eq('Agrárias inicial (com BYE no TCM)', row(o0, 'agrarias'), [2, 312, 157]);
eq('Moca inicial', row(o0, 'moca'), [0, 182, 91]);
eq('Definidas inicial', o0.definedCount, 0);

// ---------- Helpers para navegação na chave ----------
const win = (b: BracketState, r: number, i: number, side: 'a' | 'b', hasCons = false): BracketState => {
  const res = resolveBracket(b, hasCons);
  const m = res.rounds[r][i];
  const winners = b.winners.map((x) => [...x]);
  winners[r][i] = m[side];
  return normalizeBracket({ ...b, winners }, hasCons);
};
const winThird = (b: BracketState, side: 'a' | 'b', hasCons = false): BracketState => {
  const res = resolveBracket(b, hasCons);
  return normalizeBracket({ ...b, thirdWinner: res.third[side] }, hasCons);
};
const winConsolationSemi = (b: BracketState, idx: number, side: 'a' | 'b'): BracketState => {
  const res = resolveBracket(b, true);
  const m = res.consolationSemis[idx];
  const cWins = [...(b.consolationWinners ?? [null, null])];
  cWins[idx] = m[side];
  return normalizeBracket({ ...b, consolationWinners: cWins as [string | null, string | null] }, true);
};
const winFifth = (b: BracketState, side: 'a' | 'b'): BracketState => {
  const res = resolveBracket(b, true);
  return normalizeBracket({ ...b, fifthWinner: res.fifthMatch[side] }, true);
};
const winSeventh = (b: BracketState, side: 'a' | 'b'): BracketState => {
  const res = resolveBracket(b, true);
  return normalizeBracket({ ...b, seventhWinner: res.seventhMatch[side] }, true);
};

const st = (b: BracketState, code: string): AppState => ({ ...s0, brackets: { ...s0.brackets, [code]: b } });
const sc = (b: BracketState, id: string, code: string) => {
  const s = computeModality(MODALITY_BY_CODE[code], st(b, code)).scores[id];
  return [s.min, s.max];
};

// ---------- 2. Grupo A Coletivo: Vôlei Masculino (Com Disputa de 5º ao 8º) ----------
let bvm: BracketState = { ...s0.brackets.VM, slots: [...ALL_IDS] };
// Oitavas: lado "a" vence todos -> agrarias, artes, computacao, educa, fisioterapia, infernal, moca, odonto
for (let i = 0; i < 8; i++) bvm = win(bvm, 0, i, 'a', true);
eq('VM: Perdeu nas oitavas (aplicada)', sc(bvm, 'aplicada', 'VM'), [0, 0]);
eq('VM: Viva nas quartas (agrarias)', sc(bvm, 'agrarias', 'VM'), [2, 13]);

// Quartas: agrarias x artes -> agrarias ; computacao x educa -> computacao ; fisio x infernal -> fisio ; moca x odonto -> moca
// Perdedores de QF: artes, educa, infernal, odonto (vão para Semis 5º-8º: Jogo 13 e Jogo 14)
for (let i = 0; i < 4; i++) bvm = win(bvm, 1, i, 'a', true);
eq('VM: Perdedora QF vai para disputa 5º-8º (artes)', sc(bvm, 'artes', 'VM'), [2, 5]);
eq('VM: Viva na semi 1º-4º (agrarias)', sc(bvm, 'agrarias', 'VM'), [7, 13]);

// Semis 1º-4º:
// Semi 0: agrarias x computacao -> agrarias na final
// Semi 1: fisio x moca -> moca na final
bvm = win(bvm, 2, 0, 'a', true);
bvm = win(bvm, 2, 1, 'b', true);
eq('VM: Na grande final (agrarias)', sc(bvm, 'agrarias', 'VM'), [10, 13]);
eq('VM: Disputa de 3º (computacao)', sc(bvm, 'computacao', 'VM'), [7, 8]);

// Semis de 5º ao 8º:
// Jogo 13 (Perd QF 0 vs Perd QF 1: artes vs educa) -> artes vence e vai para final 5º/6º; educa vai para 7º/8º
bvm = winConsolationSemi(bvm, 0, 'a');
eq('VM: Venceu semi 5º-8º (artes na final 5º/6º)', sc(bvm, 'artes', 'VM'), [4, 5]);
eq('VM: Perdeu semi 5º-8º (educa na final 7º/8º)', sc(bvm, 'educa', 'VM'), [2, 3]);

// Jogo 14 (infernal vs odonto) -> infernal vence e vai para final 5º/6º; odonto vai para 7º/8º
bvm = winConsolationSemi(bvm, 1, 'a');

// Finais:
bvm = win(bvm, 3, 0, 'b', true); // Grande Final: moca campeã, agrarias vice
bvm = winThird(bvm, 'a', true);   // 3º Lugar: computacao 3º, fisio 4º
bvm = winFifth(bvm, 'a');         // 5º Lugar: artes vence infernal -> artes 5º (5pts), infernal 6º (4pts)
bvm = winSeventh(bvm, 'a');       // 7º Lugar: educa vence odonto -> educa 7º (3pts), odonto 8º (2pts)

eq('VM: Campeã (moca)', sc(bvm, 'moca', 'VM'), [13, 13]);
eq('VM: Vice (agrarias)', sc(bvm, 'agrarias', 'VM'), [10, 10]);
eq('VM: 3º (computacao)', sc(bvm, 'computacao', 'VM'), [8, 8]);
eq('VM: 4º (fisioterapia)', sc(bvm, 'fisioterapia', 'VM'), [7, 7]);
eq('VM: 5º lugar (artes)', sc(bvm, 'artes', 'VM'), [5, 5]);
eq('VM: 6º lugar (infernal)', sc(bvm, 'infernal', 'VM'), [4, 4]);
eq('VM: 7º lugar (educa)', sc(bvm, 'educa', 'VM'), [3, 3]);
eq('VM: 8º lugar (odonto)', sc(bvm, 'odonto', 'VM'), [2, 2]);
eq('VM: Definida', computeModality(MODALITY_BY_CODE.VM, st(bvm, 'VM')).status, 'defined');

// Cascata: altera o vencedor das oitavas
bvm = win(bvm, 0, 0, 'b', true);
eq('VM Cascata: agrarias eliminada', sc(bvm, 'agrarias', 'VM'), [0, 0]);
eq('VM Cascata: aplicada viva QF', sc(bvm, 'aplicada', 'VM'), [2, 13]);
eq('VM Cascata: final limpa', resolveBracket(bvm, true).finalMatch.winner, null);

// ---------- 3. Tênis de Campo (TCM - Sem Consolação, Regra Tradicional do Algoz) ----------
let btcm: BracketState = { ...s0.brackets.TCM, slots: [...ALL_IDS] };
for (let i = 0; i < 8; i++) btcm = win(btcm, 0, i, 'a', false);
for (let i = 0; i < 4; i++) btcm = win(btcm, 1, i, 'a', false);
eq('TCM: Eliminada QF aguardando algoz (artes)', sc(btcm, 'artes', 'TCM'), [2, 5]);

// Semi 0: agrarias vence computacao -> artes (algoz agrarias) garante 4 a 5; educa (algoz computacao) fica com 2 a 3
btcm = win(btcm, 2, 0, 'a', false);
btcm = win(btcm, 2, 1, 'b', false);
eq('TCM: Algoz venceu semi (artes, algoz agrarias na final)', sc(btcm, 'artes', 'TCM'), [4, 5]);
eq('TCM: Algoz perdeu semi (educa, algoz computacao no 3º)', sc(btcm, 'educa', 'TCM'), [2, 3]);

btcm = win(btcm, 3, 0, 'a', false); // agrarias campeã, moca vice
btcm = winThird(btcm, 'a', false);  // computacao 3º, fisio 4º
eq('TCM: 5º (artes, algoz agrarias campeã)', sc(btcm, 'artes', 'TCM'), [5, 5]);
eq('TCM: 6º (odonto, algoz moca vice)', sc(btcm, 'odonto', 'TCM'), [4, 4]);
eq('TCM: 7º (educa, algoz computacao 3º)', sc(btcm, 'educa', 'TCM'), [3, 3]);
eq('TCM: 8º (infernal, algoz fisio 4º)', sc(btcm, 'infernal', 'TCM'), [2, 2]);
eq('TCM: Definida', computeModality(MODALITY_BY_CODE.TCM, st(btcm, 'TCM')).status, 'defined');

// ---------- 4. Repescagem Oficial UFU 2026 (Basquete Feminino - BF) ----------
// No BF: Jogo 1 é humanas x aplicada. Quem perde vai para o Jogo 7 ('LOSER:1') contra biologicas!
let bbf = { ...s0.brackets.BF };
// Jogo 1 (índice 0): humanas (a) vs aplicada (b) -> humanas vence, aplicada perde
bbf = win(bbf, 0, 0, 'a', true);
const rbf = resolveBracket(bbf, true);
eq('BF Repescagem: Perdedora do Jogo 1 (aplicada) alimenta Jogo 7', rbf.rounds[0][7].b, 'aplicada');
eq('BF Repescagem: Aplicada viva na repescagem', sc(bbf, 'aplicada', 'BF'), [0, 13]);

// Jogo 7: biologicas (a) vs aplicada (b) -> aplicada vence a repescagem!
bbf = win(bbf, 0, 7, 'b', true);
eq('BF Repescagem: Aplicada venceu repescagem e foi para as quartas', sc(bbf, 'aplicada', 'BF'), [2, 13]);
eq('BF Repescagem: Biologicas eliminada na repescagem', sc(bbf, 'biologicas', 'BF'), [0, 0]);

// ---------- 5. BYE tradicional ----------
const hm = MODALITY_BY_CODE.HM;
let bhm: BracketState = { ...s0.brackets.HM, slots: [hm.enrolled[0], BYE, ...Array(14).fill(null)] };
bhm = normalizeBracket(bhm, true);
eq('BYE nas oitavas garante 2/13', sc(bhm, hm.enrolled[0], 'HM'), [2, 13]);
eq('N/I no HM (artes)', sc(bhm, 'artes', 'HM'), [0, 0]);

// ---------- 6. Grupo B: dois representantes na final ----------
const left = ['engenharia:1', ...Array(15).fill(BYE)];
const right = ['engenharia:2', ...Array(15).fill(BYE)];
let bb: BracketState = normalizeBracket({ ...s0.brackets.ESM, slots: [...left, ...right] });
eq('ESM ambos na final -> 13/13', sc(bb, 'engenharia', 'ESM'), [13, 13]);
bb = normalizeBracket({ ...s0.brackets.ESM, slots: [...left, ...Array(16).fill(null)] });
eq('ESM rep1 na final, rep2 aguardando', sc(bb, 'engenharia', 'ESM'), [10, 13]);

// ---------- 7. Grupo C ----------
const sC: AppState = {
  ...s0,
  tables: { ...s0.tables, AM: { positions: ['medicina', null, 'direito', null, null, null, null, null], finalized: false } },
};
const am = computeModality(MODALITY_BY_CODE.AM, sC).scores;
eq('AM 1º medicina', [am.medicina.min, am.medicina.max], [13, 13]);
eq('AM elegível com 1º preenchido -> máx 10', [am.educa.min, am.educa.max], [0, 10]);
sC.tables.AM = { ...sC.tables.AM, finalized: true };
const am2 = computeModality(MODALITY_BY_CODE.AM, sC);
eq('AM finalizada -> demais 0/0', [am2.scores.educa.min, am2.scores.educa.max], [0, 0]);
eq('AM status definida', am2.status, 'defined');

console.log(fails ? `\n${fails} falha(s)` : '\nTodos os cálculos conferem ✅');
process.exit(fails ? 1 : 0);
