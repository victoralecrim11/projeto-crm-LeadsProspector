import React from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LeadsProspectorView } from './components/LeadsProspectorView';
import { RedesenhoView } from './components/RedesenhoView';
import { VisualEditorView } from './components/VisualEditorView';
import { PropostasView } from './components/PropostasView';
import { CrmPipelineView } from './components/CrmPipelineView';
import { FollowUpRadarView } from './components/FollowUpRadarView';
import { ContratosView } from './components/ContratosView';
import { AppointmentsView } from './components/AppointmentsView';
import { ProjectsView } from './components/ProjectsView';
import { SetupConfigView } from './components/SetupConfigView';
import { CrmSettingsView } from './components/CrmSettingsView';
import { RankingView } from './components/RankingView';
import { CobrarClienteView, TemplatesView, AfiliadoView } from './components/ExtraViews';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { SiteGeneratorModal } from './components/SiteGeneratorModal';
import { UpgradeModal } from './components/UpgradeModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';

const MainLayout: React.FC = () => {
  const { activePage } = useCrm();

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsProspectorView />;
      case 'redesenhar':
        return <RedesenhoView />;
      case 'editor':
        return <VisualEditorView />;
      case 'propostas':
        return <PropostasView />;
      case 'crm':
        return <CrmPipelineView />;
      case 'followup':
        return <FollowUpRadarView />;
      case 'contratos':
        return <ContratosView />;
      case 'agendamentos':
        return <AppointmentsView />;
      case 'projetos':
        return <ProjectsView />;
      case 'cobrar':
        return <CobrarClienteView />;
      case 'setup':
        return <SetupConfigView />;
      case 'configuracoes':
        return <CrmSettingsView />;
      case 'ranking':
        return <RankingView />;
      case 'templates':
        return <TemplatesView />;
      case 'afiliado':
        return <AfiliadoView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden mesh-bg text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full w-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Interactive Modals */}
      <LeadDetailsModal />
      <SiteGeneratorModal />
      <UpgradeModal />
      <EmailDispatchModal />
      <GlobalCommandPalette />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainLayout />
    </CrmProvider>
  );
}

