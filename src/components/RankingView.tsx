import React from 'react';
import { 
  Trophy, 
  Medal, 
  Flame, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Zap, 
  Users 
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';

export const RankingView: React.FC = () => {
  const { ranking } = useCrm();

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Ranking de Vendas</h2>
          <p className="text-xs text-slate-300/80 mt-1">Desempenho da equipe comercial, taxa de fechamento e metas mensais</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 glass-card border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Temporada de Setembro Aberta</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* 2nd place */}
        {ranking[1] && (
          <div className="order-2 md:order-1 p-5 glass-panel rounded-3xl flex flex-col items-center text-center shadow-xl">
            <div className="relative mb-3">
              <img 
                src={ranking[1].avatar} 
                alt={ranking[1].name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-400 shadow-md"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-extrabold bg-slate-500 text-white rounded-full">
                #2
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">{ranking[1].name}</h3>
            <span className="text-xs text-slate-300 mt-0.5">{ranking[1].dealsClosed} contratos fechados</span>
            <span className="text-sm font-extrabold text-emerald-300 mt-2">
              R$ {ranking[1].totalRevenue.toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        {/* 1st place */}
        {ranking[0] && (
          <div className="order-1 md:order-2 p-6 glass-panel border-2 border-amber-400/50 rounded-3xl flex flex-col items-center text-center shadow-2xl relative -translate-y-2 bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="absolute -top-3.5 px-3 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/30">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>LÍDER DO MÊS</span>
            </div>

            <div className="relative mb-3 mt-2">
              <img 
                src={ranking[0].avatar} 
                alt={ranking[0].name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-xl"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs font-black bg-amber-400 text-slate-950 rounded-full shadow">
                #1
              </span>
            </div>
            <h3 className="font-bold text-white text-base">{ranking[0].name}</h3>
            <span className="text-xs text-sky-300 font-semibold mt-0.5">{ranking[0].dealsClosed} contratos fechados</span>
            <span className="text-lg font-black text-emerald-300 mt-2">
              R$ {ranking[0].totalRevenue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] text-amber-300 font-semibold mt-1">
              ⭐ {ranking[0].points} XP Acumulados
            </span>
          </div>
        )}

        {/* 3rd place */}
        {ranking[2] && (
          <div className="order-3 p-5 glass-panel rounded-3xl flex flex-col items-center text-center shadow-xl">
            <div className="relative mb-3">
              <img 
                src={ranking[2].avatar} 
                alt={ranking[2].name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-600/70 shadow-md"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-extrabold bg-amber-700 text-white rounded-full">
                #3
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">{ranking[2].name}</h3>
            <span className="text-xs text-slate-300 mt-0.5">{ranking[2].dealsClosed} contratos fechados</span>
            <span className="text-sm font-extrabold text-emerald-300 mt-2">
              R$ {ranking[2].totalRevenue.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="p-5 glass-panel rounded-3xl shadow-xl overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4">Tabela Geral de Produtividade</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 font-semibold pb-2">
                <th className="pb-3 px-3">Posição</th>
                <th className="pb-3 px-3">Vendedor</th>
                <th className="pb-3 px-3">Contratos</th>
                <th className="pb-3 px-3">Taxa Conv.</th>
                <th className="pb-3 px-3">Volume Fechado</th>
                <th className="pb-3 px-3 text-right">Pontuação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ranking.map((user) => (
                <tr key={user.id} className={`hover:bg-white/[0.04] transition-colors ${user.isCurrentUser ? 'bg-indigo-500/15' : ''}`}>
                  <td className="py-3.5 px-3 font-bold text-slate-200">
                    #{user.rank}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <span className="font-semibold text-white block">{user.name}</span>
                        {user.isCurrentUser && <span className="text-[10px] text-sky-300 font-bold">(Você)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-200">{user.dealsClosed}</td>
                  <td className="py-3.5 px-3 font-semibold text-emerald-300">{user.conversionRate}%</td>
                  <td className="py-3.5 px-3 font-bold text-white">R$ {user.totalRevenue.toLocaleString('pt-BR')}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-300">{user.points} XP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
