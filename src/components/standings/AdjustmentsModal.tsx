import { useEffect, useState } from 'react';
import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { Adjustment, Athletic } from '../../types';
import { AthleticBadge, Modal } from '../ui';

interface Props {
  open: boolean;
  onClose: () => void;
  athletics: Athletic[];
  adjustments: Adjustment[];
  initialAthletic?: string;
  onChange: (list: Adjustment[]) => void;
}

const PRESETS = [
  { value: 25, reason: 'Bônus Cerimonial de Abertura (+25)' },
  { value: 50, reason: 'Bônus Cerimonial de Abertura (+50)' },
  { value: -13, reason: 'Punição W.O. (−13)' },
];

/** Ajustes manuais (Bônus de Abertura / Punição W.O.) aplicados sobre Mín e Máx. */
export function AdjustmentsModal({ open, onClose, athletics, adjustments, initialAthletic, onChange }: Props) {
  const [athleticId, setAthleticId] = useState(initialAthletic ?? athletics[0].id);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setAthleticId(initialAthletic ?? athletics[0].id);
  }, [open, initialAthletic, athletics]);

  const add = (v: number, r: string) => {
    if (!Number.isFinite(v) || v === 0) return;
    onChange([...adjustments, { id: crypto.randomUUID(), athleticId, value: Math.round(v), reason: r.trim() || 'Ajuste manual' }]);
    setValue('');
    setReason('');
  };

  const athMap = Object.fromEntries(athletics.map((a) => [a.id, a]));
  const sorted = [...adjustments].sort((a, b) => athMap[a.athleticId].name.localeCompare(athMap[b.athleticId].name, 'pt-BR'));

  return (
    <Modal open={open} onClose={onClose} title="Ajustes · Bônus de Abertura · Punição W.O." icon={<SlidersHorizontal size={18} className="text-brand" />}>
      <p className="mb-4 text-xs text-zinc-400">
        Ajustes são somados igualmente ao <b>Mín.</b> e ao <b>Máx.</b> da atlética na Classificação Geral. Por padrão, nenhum ajuste está ativo.
      </p>

      <div className="space-y-3 rounded-xl border border-line bg-ink-950/50 p-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Atlética</label>
        <div className="flex items-center gap-2">
          <AthleticBadge athletic={athMap[athleticId]} size={30} />
          <select className="select-dark border-solid py-2 text-sm text-zinc-200" value={athleticId} onChange={(e) => setAthleticId(e.target.value)}>
            {athletics.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.value} className={p.value > 0 ? 'btn-brand' : 'btn-danger'} onClick={() => add(p.value, p.reason)}>
              {p.value > 0 ? `+${p.value}` : p.value} · {p.value > 0 ? 'Bônus Abertura' : 'W.O.'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="± pontos"
            className="w-28 rounded-md border border-line bg-ink-950 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-brand"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            maxLength={80}
            className="min-w-[160px] flex-1 rounded-md border border-line bg-ink-950 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-brand"
          />
          <button className="btn-solid" onClick={() => add(Number(value), reason)} disabled={!value || Number(value) === 0}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>

      <h4 className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Ajustes ativos ({adjustments.length})</h4>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-zinc-500">Nenhum ajuste aplicado.</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-2">
              <AthleticBadge athletic={athMap[a.athleticId]} size={22} />
              <span className="text-xs font-bold uppercase text-zinc-200">{athMap[a.athleticId].name}</span>
              <span className="truncate text-xs text-zinc-500">· {a.reason}</span>
              <span className={`ml-auto font-mono text-sm font-bold ${a.value > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {a.value > 0 ? `+${a.value}` : a.value}
              </span>
              <button
                className="rounded p-1 text-zinc-500 hover:bg-red-950/60 hover:text-red-300"
                onClick={() => onChange(adjustments.filter((x) => x.id !== a.id))}
                title="Remover ajuste"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
