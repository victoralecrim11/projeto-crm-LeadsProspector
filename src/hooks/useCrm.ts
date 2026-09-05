import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';
import { useLeadStore } from '../store/leadStore';
import { useCrmConfigStore } from '../store/crmConfigStore';
import { ActivePage, FunnelStats, Lead } from '../types';
import { exportLeadsToExcel } from '../utils/excelExporter';

export const useCrm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const path = location.pathname.substring(1);
  const validPages: ActivePage[] = [
    'dashboard', 'leads', 'redesenhar', 'editor', 'propostas',
    'crm', 'followup', 'contratos', 'agendamentos', 'projetos',
    'cobrar', 'setup', 'configuracoes', 'ranking', 'templates', 'afiliado'
  ];
  const activePage: ActivePage = validPages.includes(path as ActivePage) ? (path as ActivePage) : 'dashboard';

  const setActivePage = (page: ActivePage) => {
    navigate(`/${page}`);
  };

  const ui = useUiStore();
  const leadsState = useLeadStore();
  const configState = useCrmConfigStore();

  const crmLeads = useMemo(() => leadsState.leads.filter(l => l.inCrm), [leadsState.leads]);

  const funnelStats = useMemo<FunnelStats>(() => {
    const total = leadsState.leads.length;
    const auditados = leadsState.leads.filter(l => l.crmStage === 'auditado').length;
    const redesenhados = leadsState.leads.filter(l => l.crmStage === 'redesenhado').length;
    const propostasEnviadas = leadsState.leads.filter(l => l.crmStage === 'proposta_enviada').length;
    const followUp = leadsState.leads.filter(l => l.crmStage === 'follow_up').length;
    const negociando = leadsState.leads.filter(l => l.crmStage === 'negociacao').length;
    const convertidosLeads = leadsState.leads.filter(l => l.crmStage === 'convertido');
    const convertidos = convertidosLeads.length;
    const perdidos = leadsState.leads.filter(l => l.crmStage === 'perdido').length;

    const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;
    const taxaProposta = total > 0 ? (propostasEnviadas / total) * 100 : 0;
    const taxaAgendamento = total > 0 ? ((negociando + convertidos) / total) * 100 : 0;

    const mrrTotal = convertidosLeads.reduce((acc, curr) => acc + (curr.mrrValue || 197), 0);
    const receitaTotal = convertidosLeads.reduce((acc, curr) => acc + (curr.dealValue || 1800), 0);
    const ticketMedio = convertidos > 0 ? receitaTotal / convertidos : 0;

    return {
      total, auditados, redesenhados, propostasEnviadas, followUp, negociando,
      convertidos, perdidos, taxaConversao, taxaProposta, taxaAgendamento,
      mrrTotal, receitaTotal, ticketMedio
    };
  }, [leadsState.leads]);

  const exportLeadsExcel = (leadsToExport?: Lead[], customFileName?: string) => {
    const dataToExport = leadsToExport || leadsState.leads;
    exportLeadsToExcel(dataToExport, {
      fileName: customFileName,
      sheetTitle: 'Base de Leads'
    });
  };

  const exportLeadsCsv = (leadsToExport?: Lead[]) => {
    exportLeadsExcel(leadsToExport);
  };

  return {
    ...ui,
    ...leadsState,
    ...configState,
    activePage,
    setActivePage,
    crmLeads,
    funnelStats,
    exportLeadsExcel,
    exportLeadsCsv,
    monthlyLeadsUsed: 20,
    monthlyLeadsLimit: 500,
  };
};
