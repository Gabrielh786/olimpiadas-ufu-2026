import { useRef } from 'react';
import { ImagePlus, Palette, RotateCcw, Trash2 } from 'lucide-react';
import type { Athletic } from '../types';
import { DEFAULT_ATHLETICS } from '../data/athletics';
import { MODALITIES } from '../data/modalities';
import { AthleticBadge, Modal } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  athletics: Athletic[];
  onChange: (list: Athletic[]) => void;
  notify: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}

/** Redimensiona o escudo para 128px (mantém o localStorage leve). */
function resizeImage(file: File, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AthleticsModal({ open, onClose, athletics, onChange, notify }: Props) {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const patch = (id: string, p: Partial<Athletic>) => onChange(athletics.map((a) => (a.id === id ? { ...a, ...p } : a)));

  const onFile = async (id: string, file?: File) => {
    if (!file) return;
    try {
      const logo = await resizeImage(file);
      patch(id, { logo });
      notify('Escudo atualizado.', 'ok');
    } catch {
      notify('Não foi possível carregar a imagem.', 'err');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Atléticas · Cores, Siglas e Escudos" icon={<Palette size={18} className="text-brand" />} width="max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">Personalize a identidade visual das 16 AAAs. As alterações são salvas automaticamente.</p>
        <button
          className="btn-ghost shrink-0"
          onClick={() => confirm('Restaurar cores, siglas e remover todos os escudos?') && onChange(DEFAULT_ATHLETICS.map((a) => ({ ...a })))}
        >
          <RotateCcw size={14} /> Restaurar padrão
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {athletics.map((a) => {
          const count = MODALITIES.filter((m) => m.enrolled.includes(a.id)).length;
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-ink-950/50 p-2.5">
              <AthleticBadge athletic={a} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold uppercase text-zinc-100">{a.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {count} de 25 modalidades · Máx. inicial {count * 13} pts
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    type="color"
                    value={a.color}
                    onChange={(e) => patch(a.id, { color: e.target.value })}
                    className="h-6 w-8 cursor-pointer rounded border border-line bg-transparent"
                    title="Cor temática"
                  />
                  <input
                    value={a.short}
                    maxLength={4}
                    onChange={(e) => patch(a.id, { short: e.target.value.toUpperCase() })}
                    className="w-14 rounded border border-line bg-ink-950 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold text-zinc-200 outline-none focus:border-brand"
                    title="Sigla do avatar"
                  />
                  <input
                    ref={(el) => {
                      fileRefs.current[a.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onFile(a.id, e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button className="btn-ghost px-2 py-1" onClick={() => fileRefs.current[a.id]?.click()} title="Enviar escudo">
                    <ImagePlus size={13} /> Escudo
                  </button>
                  {a.logo && (
                    <button className="rounded p-1 text-zinc-500 hover:bg-red-950/60 hover:text-red-300" onClick={() => patch(a.id, { logo: '' })} title="Remover escudo">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
