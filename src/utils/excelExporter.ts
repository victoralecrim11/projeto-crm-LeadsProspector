import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Lead } from '../types';

export interface ExcelExportOptions {
  fileName?: string;
  sheetTitle?: string;
}

/**
 * Format a number as Brazilian Currency
 */
function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
}

/**
 * Export Leads to a high-fidelity, professionally structured Microsoft Excel (.xlsx) file using exceljs
 */
export async function exportLeadsToExcel(leads: Lead[], options: ExcelExportOptions = {}) {
  if (!leads || leads.length === 0) {
    alert('Nenhum lead selecionado para exportação.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const fileDate = new Date().toISOString().slice(0, 10);

  // -------------------------------------------------------------
  // SHEET 1: RESUMO EXECUTIVO (Executive Dashboard & KPIs)
  // -------------------------------------------------------------
  const wsSummary = wb.addWorksheet('Resumo Executivo');

  const totalLeads = leads.length;
  const inCrmCount = leads.filter(l => l.inCrm).length;
  const withoutWebsiteCount = leads.filter(l => !l.hasWebsite).length;
  const hotLeadsCount = leads.filter(l => l.temperature === 'quente').length;
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.dealValue || 1800), 0);
  const totalMrrPotential = leads.reduce((acc, l) => acc + (l.mrrValue || 197), 0);
  const avgScore = Math.round(leads.reduce((acc, l) => acc + (l.score || 0), 0) / (totalLeads || 1));

  wsSummary.columns = [
    { header: '', key: 'col1', width: 45 },
    { header: '', key: 'col2', width: 25 },
    { header: '', key: 'col3', width: 35 },
  ];

  // Header
  const titleRow = wsSummary.addRow(['RELATÓRIO EXECUTIVO DE PROSPECÇÃO GEOGRÁFICA & RADAR DE LEADS']);
  titleRow.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  wsSummary.mergeCells('A1:C1');

  wsSummary.addRow([`Gerado em: ${dateStr} às ${new Date().toLocaleTimeString('pt-BR')}`]).font = { italic: true };
  wsSummary.addRow([]);

  // KPI Section
  const kpiHeader = wsSummary.addRow(['INDICADOR / KPI', 'VALOR / RESULTADO', 'PERCENTUAL / DETALHES']);
  kpiHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  kpiHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.alignment = { horizontal: 'center' };
  });

  const addKpiRow = (label: string, value: any, details: string) => {
    const row = wsSummary.addRow([label, value, details]);
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(2).font = { bold: true };
  };

  addKpiRow('Total de Empresas Prospectadas', totalLeads, '100% da Base');
  addKpiRow('Oportunidades Sem Site Próprio', withoutWebsiteCount, `${Math.round((withoutWebsiteCount / totalLeads) * 100)}% de conversão prioritária`);
  addKpiRow('Leads com Temperatura Quente (🔥)', hotLeadsCount, `${Math.round((hotLeadsCount / totalLeads) * 100)}% prontos para abordagem`);
  addKpiRow('Leads Salvos no CRM Ativo', inCrmCount, `${Math.round((inCrmCount / totalLeads) * 100)}% em negociação`);
  addKpiRow('Média do Score de Oportunidade', `${avgScore} / 100`, avgScore >= 80 ? 'Excelente Potencial' : 'Bom Potencial');
  addKpiRow('Pipeline Total de Setup Estimado', formatCurrency(totalPipelineValue), '');
  addKpiRow('Potencial de Recorrência (MRR/Mês)', formatCurrency(totalMrrPotential), '');

  wsSummary.addRow([]);

  // Niche Section
  const nicheHeader = wsSummary.addRow(['DISTRIBUIÇÃO POR NICHO DE MERCADO', 'Quantidade de Leads', 'Participação na Base']);
  nicheHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  nicheHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
    cell.alignment = { horizontal: 'center' };
  });

  const nicheMap: Record<string, number> = {};
  leads.forEach(l => {
    const key = l.niche || l.category || 'Outros';
    nicheMap[key] = (nicheMap[key] || 0) + 1;
  });

  Object.entries(nicheMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([niche, count]) => {
      const row = wsSummary.addRow([niche, count, `${Math.round((count / totalLeads) * 100)}%`]);
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
    });

  wsSummary.addRow([]);

  // Location Section
  const locHeader = wsSummary.addRow(['DISTRIBUIÇÃO POR BAIRRO / REGIÃO', 'Quantidade de Leads', 'Participação na Base']);
  locHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  locHeader.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    cell.alignment = { horizontal: 'center' };
  });

  const locationMap: Record<string, number> = {};
  leads.forEach(l => {
    const key = l.neighborhood ? `${l.neighborhood} (${l.city})` : l.city;
    locationMap[key] = (locationMap[key] || 0) + 1;
  });

  Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([loc, count]) => {
      const row = wsSummary.addRow([loc, count, `${Math.round((count / totalLeads) * 100)}%`]);
      row.getCell(2).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
    });

  // Borders for Summary
  wsSummary.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // -------------------------------------------------------------
  // SHEET 2: BASE COMPLETA DE LEADS
  // -------------------------------------------------------------
  const wsLeads = wb.addWorksheet(options.sheetTitle || 'Base de Leads');

  wsLeads.columns = [
    { header: 'Nome da Empresa', key: 'name', width: 35 },
    { header: 'Categoria', key: 'category', width: 25 },
    { header: 'Nicho', key: 'niche', width: 25 },
    { header: 'Temperatura', key: 'temperature', width: 20 },
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Nota Maps', key: 'rating', width: 12 },
    { header: 'Avaliações', key: 'reviews', width: 12 },
    { header: 'Telefone Principal', key: 'phone', width: 20 },
    { header: 'WhatsApp Contato', key: 'whatsapp', width: 20 },
    { header: 'Cidade', key: 'city', width: 20 },
    { header: 'Estado', key: 'state', width: 10 },
    { header: 'Bairro', key: 'neighborhood', width: 25 },
    { header: 'Endereço', key: 'address', width: 45 },
    { header: 'Tem Site Próprio?', key: 'hasWebsite', width: 25 },
    { header: 'PageSpeed Mobile', key: 'speedScore', width: 20 },
    { header: 'Status no CRM', key: 'inCrm', width: 15 },
    { header: 'Etapa do Funil', key: 'crmStage', width: 20 },
    { header: 'Valor Setup (R$)', key: 'dealValue', width: 20 },
    { header: 'Mensalidade MRR (R$)', key: 'mrrValue', width: 22 },
    { header: 'Data', key: 'date', width: 15 }
  ];

  // Format headers
  const headerRow = wsLeads.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Add data rows
  leads.forEach(l => {
    const row = wsLeads.addRow({
      name: l.name,
      category: l.category,
      niche: l.niche || l.category,
      temperature: l.temperature === 'quente' ? 'Quente' : l.temperature === 'morno' ? 'Morno' : 'Frio',
      score: l.score || 0,
      rating: l.rating || 5.0,
      reviews: l.reviewsCount || 0,
      phone: l.phone || '',
      whatsapp: l.whatsapp || l.phone || '',
      city: l.city || '',
      state: l.state || 'MG',
      neighborhood: l.neighborhood || '',
      address: l.address || '',
      hasWebsite: l.hasWebsite ? 'Sim' : 'Não',
      speedScore: l.audit?.speedScore ? `${l.audit.speedScore}/100` : (l.hasWebsite ? '28/100' : 'N/A'),
      inCrm: l.inCrm ? 'Sim' : 'Não',
      crmStage: l.crmStage || (l.inCrm ? 'prospeccao' : 'Não Iniciado'),
      dealValue: l.dealValue || 1800,
      mrrValue: l.mrrValue || 197,
      date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : dateStr
    });

    // Styling based on data
    // Temperature color
    const tempCell = row.getCell('temperature');
    if (l.temperature === 'quente') {
      tempCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Red
    } else if (l.temperature === 'morno') {
      tempCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // Orange
    } else {
      tempCell.font = { color: { argb: 'FF3B82F6' }, bold: true }; // Blue
    }
    tempCell.alignment = { horizontal: 'center' };

    // Score color
    const scoreCell = row.getCell('score');
    const score = l.score || 0;
    if (score >= 80) scoreCell.font = { color: { argb: 'FF10B981' }, bold: true }; // Green
    else if (score >= 50) scoreCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // Orange
    else scoreCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Red
    scoreCell.alignment = { horizontal: 'center' };
    
    // Website color
    const siteCell = row.getCell('hasWebsite');
    if (l.hasWebsite) siteCell.font = { color: { argb: 'FF10B981' } };
    else siteCell.font = { color: { argb: 'FFEF4444' }, bold: true };
    siteCell.alignment = { horizontal: 'center' };

    // Setup and MRR as Currency
    const setupCell = row.getCell('dealValue');
    setupCell.numFmt = '"R$" #,##0.00';
    setupCell.font = { color: { argb: 'FF059669' }, bold: true };

    const mrrCell = row.getCell('mrrValue');
    mrrCell.numFmt = '"R$" #,##0.00';
    mrrCell.font = { color: { argb: 'FF0284C7' }, bold: true };

    // Category styling
    row.getCell('category').font = { color: { argb: 'FF6366F1' } };
  });

  // Filters
  wsLeads.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: leads.length + 1, column: 20 }
  };

  // Border and general cell formatting for Leads sheet
  wsLeads.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });
  });

  // -------------------------------------------------------------
  // SAVE & DOWNLOAD WORKBOOK
  // -------------------------------------------------------------
  const fileName = options.fileName || `leads_prospector_${fileDate}.xlsx`;
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
}

