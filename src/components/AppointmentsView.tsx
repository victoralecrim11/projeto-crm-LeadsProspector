import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  PhoneCall, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Users
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { Appointment } from '../types';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const AppointmentsView: React.FC = () => {
  const { 
    appointments, 
    addAppointment, 
    updateAppointmentStatus, 
    crmLeads 
  } = useCrm();

  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [newAptForm, setNewAptForm] = useState({
    leadId: '',
    leadName: '',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '14:00',
    type: 'reuniao_online' as Appointment['type'],
    notes: '',
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptForm.title || !newAptForm.leadName) return;

    addAppointment({
      leadId: newAptForm.leadId,
      leadName: newAptForm.leadName,
      title: newAptForm.title,
      date: newAptForm.date,
      time: newAptForm.time,
      type: newAptForm.type,
      status: 'agendado',
      notes: newAptForm.notes,
      meetingLink: newAptForm.type === 'reuniao_online' ? 'https://meet.google.com/ais-lead-crm' : undefined,
    });

    setShowNewAptModal(false);
    setNewAptForm({
      leadId: '',
      leadName: '',
      title: '',
      date: new Date().toISOString().slice(0, 10),
      time: '14:00',
      type: 'reuniao_online',
      notes: '',
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Agendamentos</h2>
          <p className="text-xs text-slate-300/80 mt-1">Reuniões de demonstração, visitas e fechamentos comerciais</p>
        </div>

        <button
          onClick={() => setShowNewAptModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="p-5 glass-panel rounded-3xl shadow-xl flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border ${
                  apt.type === 'reuniao_online' ? 'bg-indigo-500/20 text-sky-300 border-indigo-400/30' :
                  apt.type === 'visita_presencial' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' :
                  'bg-purple-500/20 text-purple-300 border-purple-400/30'
                }`}>
                  {apt.type === 'reuniao_online' ? '🌐 Google Meet Online' :
                   apt.type === 'visita_presencial' ? '📍 Visita Presencial' : '📞 Ligação Telefônica'}
                </span>

                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg capitalize border ${
                  apt.status === 'agendado' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  apt.status === 'realizado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {apt.status}
                </span>
              </div>

              <h3 className="font-bold text-white text-base leading-snug">{apt.title}</h3>
              <p className="text-xs font-semibold text-sky-300 mt-1">Cliente: {apt.leadName}</p>

              <div className="flex items-center gap-4 text-xs text-slate-200 mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{apt.time}h</span>
                </div>
              </div>

              {apt.notes && (
                <p className="text-xs text-slate-300 mt-3 glass-card p-3 rounded-2xl border border-white/10 leading-relaxed">
                  {apt.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              {apt.meetingLink ? (
                <a
                  href={apt.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Entrar no Meet</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">Agendado presencialmente</span>
              )}

              <div className="flex items-center gap-1.5">
                {apt.status === 'agendado' && (
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, 'realizado')}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl border border-emerald-400/30 text-xs transition-colors"
                    title="Marcar como Realizado"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => updateAppointmentStatus(apt.id, 'cancelado')}
                  className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-400/30 text-xs transition-colors"
                  title="Cancelar Agendamento"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Appointment */}
      {showNewAptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">Agendar Nova Reunião</h3>
              </div>
              <button 
                onClick={() => setShowNewAptModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Selecionar Lead / Cliente *</label>
                <ResponsiveSelect
                  value={newAptForm.leadId}
                  onChange={(val) => {
                    const lead = crmLeads.find(l => l.id === val);
                    setNewAptForm({
                      ...newAptForm,
                      leadId: val,
                      leadName: lead ? lead.name : '',
                      title: lead ? `Apresentação de Projeto - ${lead.name}` : newAptForm.title
                    });
                  }}
                  placeholder="Selecione um lead da sua lista"
                  options={[
                    { value: '', label: 'Selecione um lead da sua lista' },
                    ...crmLeads.map(lead => ({
                      value: lead.id,
                      label: `${lead.name} (${lead.category})`
                    }))
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Título do Agendamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Call de Fechamento de Proposta"
                  value={newAptForm.title}
                  onChange={(e) => setNewAptForm({ ...newAptForm, title: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={newAptForm.date}
                    onChange={(e) => setNewAptForm({ ...newAptForm, date: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={newAptForm.time}
                    onChange={(e) => setNewAptForm({ ...newAptForm, time: e.target.value })}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Modalidade</label>
                <ResponsiveSelect
                  value={newAptForm.type}
                  onChange={(val) => setNewAptForm({ ...newAptForm, type: val as any })}
                  options={[
                    { value: 'reuniao_online', label: 'Reunião Online (Google Meet)' },
                    { value: 'visita_presencial', label: 'Visita Presencial no Local' },
                    { value: 'ligacao', label: 'Ligação Telefônica Comercial' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1">Observações ou Pauta</label>
                <textarea
                  rows={3}
                  placeholder="Objetivos da reunião, script a ser demonstrado..."
                  value={newAptForm.notes}
                  onChange={(e) => setNewAptForm({ ...newAptForm, notes: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white glass-card rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
