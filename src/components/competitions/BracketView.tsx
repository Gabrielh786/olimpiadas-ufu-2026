import { useMemo } from 'react';
import {
  BookmarkCheck,
  Dices,
  Eraser,
  Lock,
  Trash2,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { BYE, NONE, type Athletic, type BracketState, type Modality } from '../../types';
import {
  arrangeSide,
  emptyBracket,
  fillByesSide,
  isReal,
  normalizeBracket,
  roundNames,
  type ResolvedMatch,
} from '../../lib/bracket';
import {
  athleticOfCompetitor,
  repId,
  repOfCompetitor,
  type ModalityResult,
} from '../../lib/scoring';
import {
  getOfficialBracket2026,
  isLoserSlot,
} from '../../data/officialDraw2026';
import { AthleticBadge, displayName } from '../ui';
import { MatchCard, type SlotOption } from './MatchCard';

interface Props {
  mod: Modality;
  bracket: BracketState;
  result: ModalityResult;
  athletics: Athletic[];
  onChange: (b: BracketState) => void;
  notify: (text: string, kind?: 'ok' | 'err' | 'info') => void;
  readOnly?: boolean;
}

const CARD_W = 'w-[188px]';

export function BracketView({ mod, bracket, result, athletics, onChange, notify, readOnly = false }: Props) {
  const res = result.bracket!;
  const size = bracket.slots.length;
  const half = size / 2;
  const names = roundNames(size);
  const isB = mod.group === 'B';
  const athMap = useMemo(() => Object.fromEntries(athletics.map((a) => [a.id, a])), [athletics]);
  const athleticOf = (c: string) => athMap[athleticOfCompetitor(c)];

  const allocated = useMemo(
    () => new Set(bracket.slots.filter((s) => isReal(s) || isLoserSlot(s))),
    [bracket.slots],
  );
  const filled = bracket.slots.filter((s) => s != null).length;
  const competitorsTotal = isB ? mod.enrolled.length * 2 : mod.enrolled.length;
  const hasOfficialDraw = Boolean(getOfficialBracket2026(mod.code));

  // ---------------- Opções de Montagem dos Slots ----------------
  const slotOptions = (i: number): SlotOption[] => {
    const rep: 1 | 2 = i < half ? 1 : 2;
    const opts: SlotOption[] = [];

    // Atléticas inscritas não alocadas
    for (const id of mod.enrolled) {
      const value = isB ? repId(id, rep) : id;
      if (allocated.has(value)) continue;
      opts.push({
        value,
        label: isB ? `${athMap[id]?.name ?? id} (Atleta ${rep})` : (athMap[id]?.name ?? id),
      });
    }
    opts.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

    // Opções de repescagem caso a modalidade suporte e ainda não estejam alocadas
    if (mod.repechageType && mod.repechageType !== 'none') {
      const targetMatches: number[] = [];
      if (mod.repechageType === '15_teams') targetMatches.push(1);
      else if (mod.repechageType === '14_teams') targetMatches.push(1, 2);
      else if (mod.repechageType === '12_teams') targetMatches.push(1, 2, 3, 4);

      for (const mNum of targetMatches) {
        const val = `LOSER:${mNum}`;
        if (!allocated.has(val)) {
          opts.push({ value: val, label: `⚡ Repescagem · Perdedor Jogo ${mNum}` });
        }
      }
    }

    opts.push({ value: BYE, label: '⚡ BYE (Avança Direto)' });
    if (isB) {
      opts.push({
        value: NONE,
        label: rep === 1 ? '❌ Sem 1º Representante' : '❌ Sem 2º Representante',
      });
    }
    return opts;
  };

  const setSlot = (i: number, v: string | null) => {
    const slots = [...bracket.slots];
    slots[i] = v;
    onChange(normalizeBracket({ ...bracket, slots }, mod.hasConsolationBracket));
  };

  const pick = (m: ResolvedMatch, c: string) => {
    if (m.round === -1) {
      // Decisão de 3º lugar
      const thirdWinner = bracket.thirdWinner === c ? null : c;
      onChange(normalizeBracket({ ...bracket, thirdWinner }, mod.hasConsolationBracket));
      return;
    }

    if (m.round === -2) {
      // Semifinais de 5º ao 8º lugar (Jogos 13 e 14)
      const consolationWinners = [...(bracket.consolationWinners ?? [null, null])];
      consolationWinners[m.index] = consolationWinners[m.index] === c ? null : c;
      onChange(normalizeBracket({ ...bracket, consolationWinners }, mod.hasConsolationBracket));
      return;
    }

    if (m.round === -3) {
      // Final 5º ao 6º lugar
      const fifthWinner = bracket.fifthWinner === c ? null : c;
      onChange(normalizeBracket({ ...bracket, fifthWinner }, mod.hasConsolationBracket));
      return;
    }

    if (m.round === -4) {
      // Final 7º ao 8º lugar
      const seventhWinner = bracket.seventhWinner === c ? null : c;
      onChange(normalizeBracket({ ...bracket, seventhWinner }, mod.hasConsolationBracket));
      return;
    }

    // Rodadas normais da chave
    const winners = bracket.winners.map((r) => [...r]);
    winners[m.round][m.index] = winners[m.round][m.index] === c ? null : c;
    onChange(normalizeBracket({ ...bracket, winners }, mod.hasConsolationBracket));
  };

  const loadOfficial = () => {
    const official = getOfficialBracket2026(mod.code);
    if (!official) {
      notify('Não há chaveamento oficial sorteado registrado para esta modalidade.', 'info');
      return;
    }
    if (
      filled > 0 &&
      !confirm(
        `Carregar o chaveamento oficial sorteado no Congresso Técnico UFU 2026 para ${mod.name}? Todos os resultados da chave atual serão resetados.`,
      )
    ) {
      return;
    }
    onChange(normalizeBracket(official, mod.hasConsolationBracket));
    notify(`📋 Chaveamento Oficial UFU 2026 de ${mod.name} carregado com sucesso!`, 'ok');
  };

  const randomDraw = () => {
    if (
      filled > 0 &&
      !confirm('Substituir a chave atual por um sorteio aleatório de teste? Todos os resultados serão apagados.')
    ) {
      return;
    }
    const fresh = emptyBracket(size);
    const slots = isB
      ? [
          ...arrangeSide(mod.enrolled.map((id) => repId(id, 1)), half),
          ...arrangeSide(mod.enrolled.map((id) => repId(id, 2)), half),
        ]
      : arrangeSide(mod.enrolled, size);
    onChange(normalizeBracket({ ...fresh, slots, mode: bracket.mode, ranking: bracket.ranking }, mod.hasConsolationBracket));
    notify('🎲 Chave sorteada aleatoriamente (modo teste).', 'info');
  };

  const autoByes = () => {
    let slots = [...bracket.slots];
    let added = 0;
    if (isB) {
      for (const rep of [1, 2] as const) {
        const start = rep === 1 ? 0 : half;
        const side = slots.slice(start, start + half);
        const un = mod.enrolled.filter((id) => !allocated.has(repId(id, rep))).length;
        const r = fillByesSide(side, un);
        slots.splice(start, half, ...r.slots);
        added += r.added;
      }
    } else {
      const un = mod.enrolled.filter((id) => !allocated.has(id)).length;
      const r = fillByesSide(slots, un);
      slots = r.slots;
      added = r.added;
    }
    if (!added) {
      notify('Nenhum BYE necessário: há atléticas suficientes para todos os slots vazios.', 'info');
      return;
    }
    onChange(normalizeBracket({ ...bracket, slots }, mod.hasConsolationBracket));
    notify(`⚡ ${added} BYE(s) adicionado(s) automaticamente.`, 'ok');
  };

  const clearAll = () => {
    if (!confirm(`Limpar toda a chave de ${mod.name}? Slots e resultados serão apagados.`)) return;
    onChange(normalizeBracket(emptyBracket(size), mod.hasConsolationBracket));
    notify('🗑️ Chave limpa.', 'info');
  };

  // ---------------- Layout ----------------
  const perSideFirst = size / 4;
  const minH = perSideFirst * (isB ? 88 : 108);
  const sideRounds = Array.from({ length: res.numRounds - 1 }, (_, r) => r); // até a semifinal

  const renderColumn = (r: number, side: 'L' | 'R') => {
    const matches = res.rounds[r];
    const n = matches.length;
    const list = side === 'L' ? matches.slice(0, n / 2) : matches.slice(n / 2);

    return (
      <div key={`${side}${r}`} className="flex flex-col">
        <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          {r === res.sf
            ? side === 'L'
              ? 'Semi 1º ao 4º (Esq.)'
              : 'Semi 1º ao 4º (Dir.)'
            : names[r].name}
        </div>
        <div className="flex flex-1 flex-col justify-around gap-2" style={{ minHeight: minH }}>
          {list.map((m) => (
            <MatchCard
              key={m.index}
              className={CARD_W}
              match={m}
              slotIndexes={r === 0 && !readOnly ? [2 * m.index, 2 * m.index + 1] : undefined}
              slotOptions={r === 0 && !readOnly ? slotOptions : undefined}
              onSlotChange={r === 0 && !readOnly ? setSlot : undefined}
              onPick={(c) => !readOnly && pick(m, c)}
              athleticOf={athleticOf}
              repOf={repOfCompetitor}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    );
  };

  const champion = res.finalMatch.winner && isReal(res.finalMatch.winner) ? res.finalMatch.winner : null;
  const champAth = champion ? athleticOf(champion) : undefined;

  return (
    <div className="card overflow-hidden">
      {/* Toolbar Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ink-900/60 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Users size={14} className="text-brand shrink-0" />
          <span>
            <b className="text-zinc-200">{filled}</b>/{size} slots ·{' '}
            <b className="text-zinc-200">{[...allocated].length}</b>/{competitorsTotal}{' '}
            {isB ? 'atletas' : 'atléticas'} alocad{isB ? 'os' : 'as'}
          </span>
          {mod.hasConsolationBracket && (
            <span className="hidden sm:inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300">
              Disputa 5º a 8º Ativa
            </span>
          )}
        </div>

        {readOnly ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-950/70 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
            <Lock size={12} className="text-zinc-500" />
            <span>Modo Visualização</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {hasOfficialDraw && (
              <button
                className="btn-brand font-bold text-xs"
                onClick={loadOfficial}
                title="Carregar o chaveamento oficial sorteado no Congresso Técnico UFU 2026"
              >
                <BookmarkCheck size={13} />
                <span>Chave Oficial UFU 2026</span>
              </button>
            )}

            <button
              className="btn-ghost"
              onClick={randomDraw}
              title="Sorteio aleatório apenas para teste"
            >
              <Dices size={13} />
              <span className="hidden sm:inline">Sortear (Teste)</span>
            </button>

            <button className="btn-ghost" onClick={autoByes}>
              <Zap size={13} />
              <span className="hidden md:inline">BYEs Automáticos</span>
            </button>

            <button className="btn-danger" onClick={clearAll} disabled={filled === 0}>
              <Trash2 size={13} />
              <span className="hidden sm:inline">Limpar Chave</span>
            </button>
          </div>
        )}
      </div>

      {isB && !readOnly && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-ink-950/40 px-4 py-2.5 text-xs">
          <span className="font-semibold text-zinc-400">Regra de consolidação:</span>
          <div className="inline-flex rounded-lg border border-line bg-ink-950 p-0.5">
            {(
              [
                ['best', 'Melhor Representante (Padrão)'],
                ['ranking', 'Ranking Geral Derivado / Soma'],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => onChange({ ...bracket, mode: v })}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  bracket.mode === v ? 'bg-brand text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <span className="text-zinc-500">
            {bracket.mode === 'best'
              ? 'Pontos da atlética = maior Mín/Máx entre Atleta 1 e Atleta 2.'
              : 'Pontos da atlética = tabela 1º–8º confirmada no painel lateral.'}
          </span>
        </div>
      )}

      {/* Dica para Mobile */}
      <div className="block sm:hidden border-b border-line/60 bg-ink-950/50 px-3 py-1 text-center text-[10px] text-zinc-400">
        ↔️ Deslize lateralmente para navegar pelas fases da chave
      </div>

      {/* Bracket Principal */}
      <div className="overflow-x-auto px-3 pb-6 pt-4 sm:px-4">
        <div className="mx-auto flex w-max items-stretch gap-3">
          {/* Lado Esquerdo */}
          <div className="flex flex-col">
            {isB && <SideTag text="CHAVE A · Atleta 1" tone="sky" />}
            <div className="flex gap-3">{sideRounds.map((r) => renderColumn(r, 'L'))}</div>
          </div>

          {/* Coluna Central: Grande Final, Decisão de 3º e Disputa de 5º ao 8º */}
          <div className="flex w-[260px] flex-col items-center justify-start gap-4 px-1">
            {/* Bloco Campeão / Grande Final */}
            <div className="flex w-full flex-col items-center gap-1 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-b from-amber-500/25 to-transparent shadow-[0_0_25px_-5px_rgba(245,158,11,0.6)]">
                <Trophy size={22} className="text-gold" />
              </div>
              {champAth ? (
                <div className="mt-0.5 flex items-center gap-2">
                  <AthleticBadge athletic={champAth} size={22} />
                  <span className="font-display text-sm font-extrabold uppercase text-amber-200">
                    {displayName(champAth)}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Grande Final
                </span>
              )}
            </div>

            <MatchCard
              className="w-full"
              variant="final"
              label="Grande Final (1º e 2º Lugar)"
              match={res.finalMatch}
              onPick={(c) => !readOnly && pick(res.finalMatch, c)}
              athleticOf={athleticOf}
              repOf={repOfCompetitor}
              readOnly={readOnly}
            />

            <MatchCard
              className="w-full"
              variant="third"
              label="Decisão 3º Lugar (3º e 4º)"
              match={res.third}
              onPick={(c) => !readOnly && pick(res.third, c)}
              athleticOf={athleticOf}
              repOf={repOfCompetitor}
              readOnly={readOnly}
            />

            {/* BLOCO OFICIAL UFU 2026: DISPUTA DE 5º AO 8º LUGAR */}
            {mod.hasConsolationBracket && res.hasConsolation && (
              <div className="w-full rounded-xl border border-amber-600/40 bg-gradient-to-b from-amber-950/20 via-card to-card p-2.5 shadow-md">
                <div className="mb-2 flex items-center justify-between border-b border-line/60 pb-1.5">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                    Disputa de 5º ao 8º Lugar
                  </span>
                  <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[8px] font-bold text-amber-400">
                    Oficial 2026
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Semis 5º ao 8º
                  </div>
                  <MatchCard
                    className="w-full"
                    variant="consolation"
                    label="Jogo 13 (Perd 9 vs Perd 12)"
                    match={res.consolationSemis[0]}
                    onPick={(c) => !readOnly && pick(res.consolationSemis[0], c)}
                    athleticOf={athleticOf}
                    repOf={repOfCompetitor}
                    readOnly={readOnly}
                  />
                  <MatchCard
                    className="w-full"
                    variant="consolation"
                    label="Jogo 14 (Perd 10 vs Perd 11)"
                    match={res.consolationSemis[1]}
                    onPick={(c) => !readOnly && pick(res.consolationSemis[1], c)}
                    athleticOf={athleticOf}
                    repOf={repOfCompetitor}
                    readOnly={readOnly}
                  />

                  <div className="border-t border-line/60 pt-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Finais de Posição
                  </div>
                  <MatchCard
                    className="w-full"
                    variant="consolation"
                    label="Final 5º ao 6º (5 pts / 4 pts)"
                    match={res.fifthMatch}
                    onPick={(c) => !readOnly && pick(res.fifthMatch, c)}
                    athleticOf={athleticOf}
                    repOf={repOfCompetitor}
                    readOnly={readOnly}
                  />
                  <MatchCard
                    className="w-full"
                    variant="consolation"
                    label="Final 7º ao 8º (3 pts / 2 pts)"
                    match={res.seventhMatch}
                    onPick={(c) => !readOnly && pick(res.seventhMatch, c)}
                    athleticOf={athleticOf}
                    repOf={repOfCompetitor}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}

            <p className="flex items-center gap-1 text-center text-[9px] text-zinc-500">
              <Eraser size={10} /> Perdedores das semifinais disputam o 3º lugar.
            </p>
          </div>

          {/* Lado Direito */}
          <div className="flex flex-col">
            {isB && <SideTag text="CHAVE B · Atleta 2" tone="fuchsia" />}
            <div className="flex gap-3">
              {[...sideRounds].reverse().map((r) => renderColumn(r, 'R'))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideTag({ text, tone }: { text: string; tone: 'sky' | 'fuchsia' }) {
  return (
    <div
      className={`mb-3 rounded-md border px-3 py-1 text-center text-[10px] font-bold tracking-widest ${
        tone === 'sky'
          ? 'border-sky-900/60 bg-sky-950/30 text-sky-300'
          : 'border-fuchsia-900/60 bg-fuchsia-950/30 text-fuchsia-300'
      }`}
    >
      {text}
    </div>
  );
}
