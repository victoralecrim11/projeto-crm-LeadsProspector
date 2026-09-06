import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Globe, Star } from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { calculateOpportunityScore } from '../utils/leadScoring';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({ isOpen, onClose }) => {
  const { addCustomLead } = useCrm();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    city: 'Belo Horizonte',
    neighborhood: '',
    address: '',
    phone: '',
    hasWebsite: false,
    websiteUrl: '',
    whatsapp: '',
    rating: '',
    reviewsCount: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) return;

    addCustomLead({
      name: formData.name,
      category: formData.category,
      niche: formData.category,
      temperature: 'quente',
      score: calculateOpportunityScore({
        hasWebsite: formData.hasWebsite,
        phone: formData.phone,
        address: formData.address,
        category: formData.category,
      }),
      rating: formData.rating.trim() ? Number(formData.rating) : undefined,
      reviewsCount: formData.reviewsCount.trim() ? Number(formData.reviewsCount) : undefined,
      phone: formData.phone,
      whatsapp: formData.whatsapp.trim() || undefined,
      email: '',
      city: formData.city,
      state: 'MG',
      neighborhood: formData.neighborhood,
      address: formData.address || `${formData.neighborhood}, ${formData.city} - MG`,
      distanceKm: undefined,
      hasWebsite: formData.hasWebsite,
      websiteUrl: formData.websiteUrl,
      inCrm: false,
    });
    
    setFormData({
      name: '',
      category: '',
      city: 'Belo Horizonte',
      neighborhood: '',
      address: '',
      phone: '',
      hasWebsite: false,
      websiteUrl: '',
      whatsapp: '',
      rating: '',
      reviewsCount: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-white text-sm">Adicionar Lead Manualmente</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome da Empresa *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                placeholder="Ex: Barbearia Mateus Guerra"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                placeholder="Informe somente se confirmado"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nicho / Categoria *</label>
                <input
                  required
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  placeholder="Ex: Barbearia"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    placeholder="(31) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bairro *</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    required
                    type="text"
                    value={formData.neighborhood}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    placeholder="Ex: Alto Caiçaras"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cidade</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Endereço Completo</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                placeholder="R. Exemplo, 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avaliação (opcional)</label>
                <div className="relative">
                  <Star className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    placeholder="Não informada"
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Qtd. Avaliações</label>
                <input
                  type="number"
                    min="0"
                    placeholder="Não informada"
                  value={formData.reviewsCount}
                  onChange={e => setFormData({ ...formData, reviewsCount: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasWebsite}
                onChange={e => setFormData({ ...formData, hasWebsite: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-900/60 border-white/15 text-sky-500 focus:ring-sky-500/20"
              />
              <span className="text-xs font-medium text-slate-300">Empresa já possui website</span>
            </label>

            {formData.hasWebsite && (
              <div>
                <div className="relative mt-2">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/60 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    placeholder="https://exemplo.com.br"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl shadow-md transition-all"
            >
              Adicionar ao Radar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
