import { useEffect, useState } from 'react';
import { Cloud, CheckCircle2, DownloadCloud, UploadCloud } from 'lucide-react';
import { DEFAULT_CLOUD_URL } from '../hooks/useAppState';
import { Modal } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  cloudUrl: string;
  cloudStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onSaveUrl: (url: string) => Promise<void>;
  onForcePush: () => Promise<boolean>;
  onForcePull: () => Promise<boolean>;
  notify: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}

export function CloudSyncModal({
  open,
  onClose,
  cloudUrl,
  cloudStatus,
  onSaveUrl,
  onForcePush,
  onForcePull,
  notify,
}: Props) {
  const [inputUrl, setInputUrl] = useState(cloudUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setInputUrl(cloudUrl || DEFAULT_CLOUD_URL);
  }, [open, cloudUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveUrl(inputUrl || DEFAULT_CLOUD_URL);
    setSaving(false);
    notify('☁️ Alterações salvas e sincronizadas com a nuvem!', 'ok');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sincronização Automática na Nuvem (Online)"
      icon={<Cloud size={18} className="text-brand" />}
      width="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs text-zinc-300">
        <div className="rounded-xl border border-brand/30 bg-brand/10 p-3 text-zinc-200">
          <p className="font-semibold text-orange-300">Salvamento Automático Ativo</p>
          <p className="mt-1 leading-relaxed text-zinc-300">
            Todas as alterações feitas pelo <b>admin</b> são salvas automaticamente na nuvem e aparecem em tempo real no celular e computador de todos os visitantes (<b>USER</b>).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-300">
            URL do Banco Firebase Conectado
          </label>
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder={DEFAULT_CLOUD_URL}
            className="w-full rounded-xl border border-line bg-ink-950 px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {cloudUrl && (
              <>
                <button
                  type="button"
                  disabled={cloudStatus === 'syncing'}
                  onClick={async () => {
                    const ok = await onForcePush();
                    notify(
                      ok ? '☁️ Todos os dados atuais foram salvos na nuvem!' : 'Falha ao salvar na nuvem. Verifique sua internet.',
                      ok ? 'ok' : 'err',
                    );
                  }}
                  className="btn-ghost border-emerald-500/40 text-emerald-300"
                >
                  <UploadCloud size={13} />
                  <span>Salvar na Nuvem Agora</span>
                </button>
                <button
                  type="button"
                  disabled={cloudStatus === 'syncing'}
                  onClick={async () => {
                    const ok = await onForcePull();
                    notify(ok ? 'Dados recarregados da nuvem!' : 'Falha ao recarregar da nuvem.', ok ? 'ok' : 'err');
                  }}
                  className="btn-ghost"
                >
                  <DownloadCloud size={13} />
                  <span>Recarregar da Nuvem</span>
                </button>
              </>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn-brand">
            <CheckCircle2 size={14} />
            <span>{saving ? 'Salvando...' : 'Salvar Configuração'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
