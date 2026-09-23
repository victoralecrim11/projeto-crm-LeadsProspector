import React from "react";
import { useCrm } from "../hooks/useCrm";
import { GenerationFlowOrchestrator } from "../site-builder/components/wizard/GenerationFlowOrchestrator";

export const SiteGeneratorModal: React.FC = () => {
  const crm = useCrm();

  if (!crm.isCreateSiteModalOpen) return null;

  const initialLeadId = crm.siteGeneratorLead?.id || "";

  const handleClose = () => {
    crm.setIsCreateSiteModalOpen(false);
    crm.setSiteGeneratorLead(null);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 p-3 flex items-center justify-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-generator-title"
        className="site-workspace site-generator-panel bg-slate-950 text-white rounded-2xl border border-slate-600 w-full max-w-2xl h-[calc(100dvh-1.5rem)] sm:h-[90dvh] sm:max-h-[760px] min-h-0 overflow-hidden flex flex-col p-5 sm:p-6"
      >
        <GenerationFlowOrchestrator 
          initialLeadId={initialLeadId} 
          onClose={handleClose} 
        />
      </section>
    </div>
  );
};
