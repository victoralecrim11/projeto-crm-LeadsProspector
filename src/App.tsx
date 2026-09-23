import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { SiteGeneratorModal } from './components/SiteGeneratorModal';
import { UpgradeModal } from './components/UpgradeModal';
import { EmailDispatchModal } from './components/EmailDispatchModal';
import { GlobalCommandPalette } from './components/common/GlobalCommandPalette';
import { ToastViewport } from './components/common/ToastViewport';
import { clearLazyRouteRecoveryState, lazyRoute } from './components/common/lazyRoute';
import { RouteLoadErrorBoundary } from './components/common/RouteLoadErrorBoundary';

// Lazy load views for Code Splitting
const DashboardView = lazyRoute('dashboard', () => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const LeadsProspectorView = lazyRoute('leads', () => import('./components/LeadsProspectorView').then(m => ({ default: m.LeadsProspectorView })));
const RedesenhoView = lazyRoute('redesenhar', () => import('./components/RedesenhoView').then(m => ({ default: m.RedesenhoView })));
const VisualEditorView = lazyRoute('editor', () => import('./components/VisualEditorView').then(m => ({ default: m.VisualEditorView })));
const PropostasView = lazyRoute('propostas', () => import('./components/PropostasView').then(m => ({ default: m.PropostasView })));
const CrmPipelineView = lazyRoute('crm', () => import('./components/CrmPipelineView').then(m => ({ default: m.CrmPipelineView })));
const FollowUpRadarView = lazyRoute('followup', () => import('./components/FollowUpRadarView').then(m => ({ default: m.FollowUpRadarView })));
const ContratosView = lazyRoute('contratos', () => import('./components/ContratosView').then(m => ({ default: m.ContratosView })));
const AppointmentsView = lazyRoute('agendamentos', () => import('./components/AppointmentsView').then(m => ({ default: m.AppointmentsView })));
const ProjectsView = lazyRoute('projetos', () => import('./components/ProjectsView').then(m => ({ default: m.ProjectsView })));
const SetupConfigView = lazyRoute('setup', () => import('./components/SetupConfigView').then(m => ({ default: m.SetupConfigView })));
const CrmSettingsView = lazyRoute('configuracoes', () => import('./components/CrmSettingsView').then(m => ({ default: m.CrmSettingsView })));
const RankingView = lazyRoute('ranking', () => import('./components/RankingView').then(m => ({ default: m.RankingView })));
const CobrarClienteView = lazyRoute('cobrar', () => import('./components/ExtraViews').then(m => ({ default: m.CobrarClienteView })));
const TemplatesView = lazyRoute('templates', () => import('./components/ExtraViews').then(m => ({ default: m.TemplatesView })));
const AfiliadoView = lazyRoute('afiliado', () => import('./components/ExtraViews').then(m => ({ default: m.AfiliadoView })));

// A simple loading skeleton to show while downloading the chunk
const ViewFallback = () => (
  <div className="w-full h-full flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
  </div>
);

const RouteRecoveryComplete: React.FC = () => {
  useEffect(() => {
    clearLazyRouteRecoveryState();
  }, []);

  return null;
};

const RoutedViews: React.FC = () => {
  const location = useLocation();

  return (
    <RouteLoadErrorBoundary key={`${location.pathname}${location.search}`}>
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
        <RouteRecoveryComplete />
      </Suspense>
    </RouteLoadErrorBoundary>
  );
};

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
            <RoutedViews />
          </div>
        </main>
      </div>

      {/* Global Interactive Modals */}
      <LeadDetailsModal />
      <SiteGeneratorModal />
      <UpgradeModal />
      <EmailDispatchModal />
      <GlobalCommandPalette />
      <ToastViewport />
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
