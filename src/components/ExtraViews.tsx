import React, { useState } from 'react';
import { CreditCard, DollarSign, Plus, ArrowUpRight, CheckCircle2, Clock, FileText, Sparkles, Check } from 'lucide-react';

export const CobrarClienteView: React.FC = () => {
  const recurringCharges = [
    { id: '1', client: 'Boy Barbearia Oficial', service: 'Hospedagem & Manutenção de Site', value: 250, status: 'pago', nextDueDate: '10/09/2026' },
    { id: '2', client: 'Dr. Lucas Ribeiro - Ortodontia', service: 'Gestão de Tráfego + Site', value: 890, status: 'pendente', nextDueDate: '15/09/2026' },
    { id: '3', client: 'Sagrada Barber Shop', service: 'Manutenção Mensal', value: 190, status: 'pago', nextDueDate: '05/09/2026' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Cobrar Cliente</h2>
          <p className="text-xs text-slate-300/80 mt-1">Gestão de faturas recorrentes, PIX automático e boletos</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all">
          <Plus className="w-4 h-4" />
          <span>Emitir Nova Cobrança</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-300 block mb-1">Receita Mensal Recorrente (MRR)</span>
          <span className="text-2xl font-black text-emerald-300">R$ 1.330,00</span>
          <span className="text-[11px] text-emerald-300/80 block mt-1">+15% em relação ao mês anterior</span>
        </div>
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-300 block mb-1">Faturas Pagas este Mês</span>
          <span className="text-2xl font-black text-white">R$ 440,00</span>
          <span className="text-[11px] text-emerald-300 block mt-1">2 faturas quitadas</span>
        </div>
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs font-semibold text-slate-300 block mb-1">A Vencer</span>
          <span className="text-2xl font-black text-amber-300">R$ 890,00</span>
          <span className="text-[11px] text-amber-300/80 block mt-1">1 fatura agendada</span>
        </div>
      </div>

      <div className="p-5 glass-panel rounded-3xl shadow-xl overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4">Histórico de Cobranças</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 font-semibold pb-2">
                <th className="pb-3 px-3">Cliente</th>
                <th className="pb-3 px-3">Serviço</th>
                <th className="pb-3 px-3">Vencimento</th>
                <th className="pb-3 px-3">Valor</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recurringCharges.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3.5 px-3 font-bold text-white">{item.client}</td>
                  <td className="py-3.5 px-3 text-slate-300">{item.service}</td>
                  <td className="py-3.5 px-3 text-slate-400">{item.nextDueDate}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-300">R$ {item.value.toFixed(2)}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg capitalize border ${
                      item.status === 'pago' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button className="text-sky-300 hover:text-sky-200 font-semibold text-xs">Copiar PIX</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const TemplatesView: React.FC = () => {
  const templates = [
    { title: 'Barbearia Premium Dark', niche: 'Barbearia', rating: '5.0', conversion: '32%', badge: 'Alta Conversão' },
    { title: 'Clínica Odontológica Clean', niche: 'Odontologia', rating: '4.9', conversion: '28%', badge: 'Mais Usado' },
    { title: 'Hamburgueria & Cardápio WhatsApp', niche: 'Restaurantes', rating: '4.8', conversion: '35%', badge: 'Novo' },
    { title: 'Estética & Harmonização Facial', niche: 'Estética', rating: '5.0', conversion: '30%', badge: 'Premium' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Galeria de Templates de Sites</h2>
        <p className="text-xs text-slate-300/80 mt-1">Modelos pré-configurados prontos para apresentar em reuniões e fechar clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((tpl, i) => (
          <div key={i} className="p-5 glass-panel rounded-3xl shadow-xl flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 rounded-lg border border-sky-400/30">
                {tpl.badge}
              </span>
              <h3 className="font-bold text-white text-base mt-2">{tpl.title}</h3>
              <p className="text-xs text-slate-300 mt-0.5">Nicho: {tpl.niche}</p>

              <div className="mt-4 p-3 glass-card rounded-2xl border border-white/10 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Conversão Média:</span>
                  <span className="font-bold text-emerald-300">{tpl.conversion}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Avaliação:</span>
                  <span className="font-bold text-amber-300">★ {tpl.rating}</span>
                </div>
              </div>
            </div>

            <button className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-white/20 transition-all">
              Usar Este Modelo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AfiliadoView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('https://leadsite.app/ref/victoralecrim');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Programa de Afiliados LeadSite</h2>
        <p className="text-xs text-slate-300/80 mt-1">Indique a ferramenta para agências e closers e ganhe 30% de comissão recorrente todos os meses.</p>
      </div>

      <div className="p-6 glass-panel rounded-3xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Seu Link Exclusivo de Afiliado</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value="https://leadsite.app/ref/victoralecrim"
            className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs font-mono text-sky-300 font-semibold truncate"
          />
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-white/20 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs text-slate-300 font-medium">Cliques no Link</span>
          <span className="text-2xl font-black text-white block mt-1">248</span>
        </div>
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs text-slate-300 font-medium">Assinantes Ativos</span>
          <span className="text-2xl font-black text-sky-300 block mt-1">12</span>
        </div>
        <div className="p-5 glass-panel rounded-3xl shadow-xl">
          <span className="text-xs text-slate-300 font-medium">Comissão Mensal</span>
          <span className="text-2xl font-black text-emerald-300 block mt-1">R$ 889,20</span>
        </div>
      </div>
    </div>
  );
};
