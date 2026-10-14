import React, { useState } from 'react';
import { Key, Sparkles, Trash2 } from 'lucide-react';
import { getStitchConnection, getStitchHeaders, setStitchConnection } from '../services/stitchConnection';

export function StitchSettingsPanel() {
  const [connection, setConnection] = useState(() => ({ ...getStitchConnection(), mode: 'apiKey' as const }));
  const [visible, setVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  const save = () => {
    if (!connection.apiKey.trim()) {
      console.warn('[Stitch] Salvamento não realizado: informe a chave de API para o modo selecionado.');
      setFailed(true);
      setMessage('Informe a chave de API do Stitch.');
      return false;
    }
    const stitchStored = setStitchConnection(connection);
    if (stitchStored) {
      console.info('[Stitch] Configuração salva na sessão desta aba. Credenciais não incluídas no backup do CRM.', {
        autenticacao: 'Chave de API',
      });
    }
    setFailed(false);
    setMessage(stitchStored ? 'Configuração salva para esta sessão.' : 'Configuração aplicada em memória. O navegador não conseguiu salvar todos os dados da sessão; confira os avisos no console antes de recarregar.');
    return true;
  };
  const test = async () => {
    if (!save()) return;
    setTesting(true);
    console.info('[Stitch] Iniciando teste de conexão com as credenciais aplicadas.');
    setMessage('Verificando acesso ao Stitch MCP…');
    try {
      const response = await fetch('/api/ai/research/stitch/test', {
        method: 'POST', headers: getStitchHeaders(), signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível testar a conexão.');
      setMessage(data.message);
      console.info('[Stitch] Conexão com o MCP validada. Acesso aos projetos confirmado.');
    } catch (error) {
      console.warn('[Stitch] Não foi possível validar a conexão. Confira a mensagem exibida no painel.');
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Falha ao testar a conexão.');
    } finally { setTesting(false); }
  };
  const reset = () => {
    const value = { mode: 'apiKey' as const, apiKey: '' };
    setConnection(value);
    const stitchCleared = setStitchConnection(value);
    if (stitchCleared) console.info('[Stitch] Credenciais locais da sessão removidas. As credenciais configuradas no servidor não foram alteradas.');
    setFailed(false);
    setMessage(stitchCleared ? 'Credenciais desta sessão removidas.' : 'Credenciais removidas da memória, mas a limpeza do armazenamento falhou. Confira os avisos no console antes de recarregar.');
  };
  const inputClass = 'mt-2 w-full rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2.5 text-sm text-white';
  return (
    <section id="stitch" aria-labelledby="stitch-title" className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5 space-y-4">
      <div>
        <h3 id="stitch-title" className="text-base font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-sky-400" />Stitch — Design de sites</h3>
        <p className="mt-1 text-sm text-slate-400">Conecte o Google Stitch para criar os layouts usados em Gerar site.</p>
      </div>
      <label className="block text-sm text-slate-300">Chave de API do Stitch
        <input type={visible ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={connection.apiKey} disabled={testing} onChange={e => { setConnection({ ...connection, apiKey: e.target.value }); setMessage(''); }} className={inputClass} placeholder="Cole a chave criada no Google Stitch" />
      </label>
      <div className="flex flex-wrap gap-4 text-xs text-sky-300">
        <a href="https://stitch.withgoogle.com/settings" target="_blank" rel="noreferrer">Obter chave no Google Stitch ↗</a>
        <a href="https://stitch.withgoogle.com/docs/mcp/setup" target="_blank" rel="noreferrer">Documentação do MCP ↗</a>
        <button type="button" onClick={() => setVisible(!visible)}>{visible ? 'Ocultar credenciais' : 'Mostrar credenciais'}</button>
      </div>
      <p className="text-xs text-slate-400">Conexão pelo MCP oficial do Google. As credenciais são guardadas na sessão desta aba, sobrevivem ao recarregamento e não entram no backup do CRM. Se o navegador bloquear o armazenamento, ficam apenas em memória.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={testing} onClick={save} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-50">Salvar conexão Stitch</button>
        <button type="button" disabled={testing} onClick={test} className="px-4 py-2 rounded-xl border border-sky-400/30 text-sky-300 text-sm flex items-center gap-2 disabled:opacity-50"><Key className="w-4 h-4" />{testing ? 'Testando…' : 'Salvar e testar conexão'}</button>
        <button type="button" disabled={testing} onClick={reset} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-400/40 bg-rose-500/10 text-sm font-medium text-rose-300 transition-colors enabled:hover:bg-rose-500/20 enabled:hover:border-rose-400/70 enabled:hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />Limpar credenciais da sessão</button>
      </div>
      {message && <p role="status" className={`text-sm ${failed ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</p>}
    </section>
  );
}
