import type { Lead } from '../../../types';
import { resolveLeadCanonicalNiche } from '../../leadSource';

export type InitialLeadSelection = {
  categoryId: string | null;
  leadId: string | null;
};

export function createInitialLeadSelection(
  leads: Lead[],
  initialLeadId?: string,
): InitialLeadSelection {
  const selectedLead = leads.find((lead) => lead.id === initialLeadId);

  if (!selectedLead) {
    return { categoryId: null, leadId: null };
  }

  // O filtro e o lead inicial devem usar a mesma classificação canônica.
  return {
    categoryId: resolveLeadCanonicalNiche(selectedLead),
    leadId: selectedLead.id,
  };
}

export function synchronizeExplicitLeadSelection(
  current: InitialLeadSelection,
  leads: Lead[],
  initialLeadId?: string,
): InitialLeadSelection {
  const explicitSelection = createInitialLeadSelection(leads, initialLeadId);

  if (!explicitSelection.leadId || current.leadId === explicitSelection.leadId) {
    return current;
  }

  // O lead recebido do card é autoridade mesmo quando chega após a montagem do modal.
  return explicitSelection;
}

export function filterLeadsByCategory(
  leads: Lead[],
  categoryId: string,
  selectedLeadId?: string | null,
): Lead[] {
  return leads.filter(
    (lead) =>
      lead.id === selectedLeadId
      || categoryId === 'all'
      || resolveLeadCanonicalNiche(lead) === categoryId,
  );
}
