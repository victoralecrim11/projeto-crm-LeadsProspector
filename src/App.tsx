import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { SiteGeneratorModal } from './components/SiteGeneratorModal';
import { UpgradeModal } from './components/UpgradeModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';

// Lazy load views for Code Splitting
const DashboardView = React.lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const LeadsProspectorView = React.lazy(() => import('./components/LeadsProspectorView').then(m => ({ default: m.LeadsProspectorView })));
const RedesenhoView = React.lazy(() => import('./components/RedesenhoView').then(m => ({ default: m.RedesenhoView })));
const VisualEditorView = React.lazy(() => import('./components/VisualEditorView').then(m => ({ default: m.VisualEditorView })));
const PropostasView = React.lazy(() => import('./components/PropostasView').then(m => ({ default: m.PropostasView })));
const CrmPipelineView = React.lazy(() => import('./components/CrmPipelineView').then(m => ({ default: m.CrmPipelineView })));
const FollowUpRadarView = React.lazy(() => import('./components/FollowUpRadarView').then(m => ({ default: m.FollowUpRadarView })));
const ContratosView = React.lazy(() => import('./components/ContratosView').then(m => ({ default: m.ContratosView })));
const AppointmentsView = React.lazy(() => import('./components/AppointmentsView').then(m => ({ default: m.AppointmentsView })));
const ProjectsView = React.lazy(() => import('./components/ProjectsView').then(m => ({ default: m.ProjectsView })));
const SetupConfigView = React.lazy(() => import('./components/SetupConfigView').then(m => ({ default: m.SetupConfigView })));
const CrmSettingsView = React.lazy(() => import('./components/CrmSettingsView').then(m => ({ default: m.CrmSettingsView })));
const RankingView = React.lazy(() => import('./components/RankingView').then(m => ({ default: m.RankingView })));
const CobrarClienteView = React.lazy(() => import('./components/ExtraViews').then(m => ({ default: m.CobrarClienteView })));
const TemplatesView = React.lazy(() => import('./components/ExtraViews').then(m => ({ default: m.TemplatesView })));
const AfiliadoView = React.lazy(() => import('./components/ExtraViews').then(m => ({ default: m.AfiliadoView })));

// A simple loading skeleton to show while downloading the chunk
const ViewFallback = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
  </div>
);

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden mesh-bg text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full w-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <Suspense fallback={<ViewFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/leads" element={<LeadsProspectorView />} />
                <Route path="/redesenhar" element={<RedesenhoView />} />
                <Route path="/editor" element={<VisualEditorView />} />
                <Route path="/propostas" element={<PropostasView />} />
                <Route path="/crm" element={<CrmPipelineView />} />
                <Route path="/followup" element={<FollowUpRadarView />} />
                <Route path="/contratos" element={<ContratosView />} />
                <Route path="/agendamentos" element={<AppointmentsView />} />
                <Route path="/projetos" element={<ProjectsView />} />
                <Route path="/cobrar" element={<CobrarClienteView />} />
                <Route path="/setup" element={<SetupConfigView />} />
                <Route path="/configuracoes" element={<CrmSettingsView />} />
                <Route path="/ranking" element={<RankingView />} />
                <Route path="/templates" element={<TemplatesView />} />
                <Route path="/afiliado" element={<AfiliadoView />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
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
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
