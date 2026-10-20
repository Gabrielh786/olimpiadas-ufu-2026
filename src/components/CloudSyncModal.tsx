import { useState } from 'react';
import { Cloud, CheckCircle2, RefreshCw, Unlink } from 'lucide-react';
import { Modal } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  cloudUrl: string;
  cloudStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onSaveUrl: (url: string) => Promise<void>;
  onForceSync: () => Promise<boolean>;
  notify: (text: string, kind?: 'ok' | 'err' | 'info') => void;
}

export function CloudSyncModal({
  open,
  onClose,
  cloudUrl,
  cloudStatus,
  onSaveUrl,
  onForceSync,
  notify,
}: Props) {
  const [inputUrl, setInputUrl] = useState(cloudUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSaveUrl(inputUrl);
    setSaving(false);
    if (inputUrl.trim()) {
      notify('☁️ Banco em nuvem conectado e sincronizado!', 'ok');
    } else {
      notify('Sincronização em nuvem desconectada.', 'info');
    }
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
          <p className="font-semibold text-orange-300">Como funciona o salvamento online entre ADMIN e USER?</p>
          <p className="mt-1 leading-relaxed text-zinc-300">
            Para que as alterações feitas pelo <b>admin</b> fiquem salvas na internet e apareçam automaticamente no celular/computador de todos os usuários (<b>USER</b>), conecte a URL gratuita de um <b>Firebase Realtime Database</b>.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-bold uppercase tracking-wider text-zinc-300">
            URL do Firebase Realtime Database (ou deixe no código via VITE_CLOUD_DB_URL)
          </label>
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://seu-projeto-default-rtdb.firebaseio.com"
            className="w-full rounded-xl border border-line bg-ink-950 px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-brand"
          />
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Crie gratuitamente em <b>console.firebase.google.com</b> &rarr; <i>Realtime Database</i> &rarr; <i>Criar banco de dados (Modo de teste)</i> e cole o link acima.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            {cloudUrl && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await onForceSync();
                    notify(ok ? 'Dados sincronizados com a nuvem!' : 'Falha ao sincronizar.', ok ? 'ok' : 'err');
                  }}
                  className="btn-ghost"
                >
                  <RefreshCw size={13} className={cloudStatus === 'syncing' ? 'animate-spin' : ''} />
                  <span>Sincronizar Agora</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setInputUrl('');
                    await onSaveUrl('');
                    notify('Nuvem desconectada.', 'info');
                  }}
                  className="btn-danger"
                >
                  <Unlink size={13} />
                  <span>Desconectar</span>
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
