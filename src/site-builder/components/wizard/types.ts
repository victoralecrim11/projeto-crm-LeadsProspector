import { ModelSelection, SitePreferences } from "../../types";

export type WizardStep = 'lead' | 'context' | 'mode' | 'review';

export type GenerationPhase = 'idle' | 'starting' | 'design' | 'site-generation' | 'completed' | 'failed';

export type DraftFlowState = {
  categoryId: string | null;
  leadId: string | null;
  generationMode: 'standard' | 'existing'; // standard = intelligent, existing = classic
  prefs: SitePreferences;
  selection: ModelSelection;
};
