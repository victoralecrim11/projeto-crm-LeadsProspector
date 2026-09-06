import jsPDF from 'jspdf';
import { Lead, HostGatorSetupConfig, CrmSettingsConfig } from '../types';

export interface ProposalPdfOptions {
  lead: Lead;
  setupConfig: HostGatorSetupConfig;
  crmSettings: CrmSettingsConfig;
}

export function generateProposalPdf({ lead, setupConfig, crmSettings }: ProposalPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const agencyName = setupConfig.agencyName || 'Nexus Digital Studio';
  const closerName = crmSettings.closerName || setupConfig.senderName || 'Victor Alecrim';
  const closerEmail = crmSettings.closerEmail || setupConfig.senderEmail || 'contato@nexusdigital.com';
  const closerPhone = crmSettings.closerPhone || '(31) 98877-6655';
  const agencyDomain = setupConfig.baseDomain || 'nexusdigital.com.br';

  const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const previewUrl = `https://${agencyDomain}/clientes/${slug}`;
  const proposalCode = `PROP-${new Date().getFullYear()}-${lead.id.slice(0, 6).toUpperCase()}`;

  const today = new Date();
  const validUntil = new Date();
  validUntil.setDate(today.getDate() + 15);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // --- PAGE 1: HEADER & EXECUTIVE SUMMARY ---

  // Top Dark Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Line
  doc.setFillColor(56, 189, 248); // sky-400
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  // Agency Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(agencyName.toUpperCase(), margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('SOLUÇÕES DIGITAIS & DESENVOLVIMENTO WEB DE ALTA PERFORMANCE', margin, 24);
  doc.text(`Proposta Comercial #${proposalCode}  |  Emissão: ${formatDate(today)}  |  Validade: ${formatDate(validUntil)}`, margin, 31);

  // Right-aligned status pill in header
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(pageWidth - margin - 42, 12, 42, 18, 2, 2, 'F');
  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROPOSTA VIP', pageWidth - margin - 21, 20, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(lead.audit ? 'AUDITORIA DISPONÍVEL' : 'NÃO AUDITADO', pageWidth - margin - 21, 26, { align: 'center' });

  let y = 52;

  // Client Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENTE & DESTINATÁRIO', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(lead.name, margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Segmento: ${lead.category}  |  Localização: ${lead.city} - ${lead.state || 'Brasil'}`, margin + 4, y + 19);
  const contactText = lead.phone ? `Contato: ${lead.phone}` : 'Contato: Não informado';
  const ratingText = typeof lead.rating === 'number' ? `Avaliação local: ${lead.rating} ⭐` : 'Avaliação local não informada';
  doc.text(`${ratingText}  |  ${contactText}`, margin + 4, y + 23);

  y += 32;

  // Section 1: Diagnóstico e Oportunidade
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DIAGNÓSTICO DIGITAL & OPORTUNIDADE DE MERCADO', margin, y);

  // Line below heading
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const ratingClause = typeof lead.rating === 'number' ? `tem uma avaliação disponível de ${lead.rating} estrelas` : `possui um grande potencial para se destacar online na região`;
  const diagText = `Identificamos que a ${lead.name} ${ratingClause}. No entanto, a presença digital atual pode estar deixando escapar clientes qualificados diariamente por conta da ausência de uma página focada em conversão, adaptada para smartphones e com agendamento direto.`;
  const splitDiag = doc.splitTextToSize(diagText, contentWidth);
  doc.text(splitDiag, margin, y);
  y += splitDiag.length * 4.2 + 2;

  // 3 Metric Badges
  const badgeWidth = (contentWidth - 6) / 3;
  
  // Badge 1: Speed
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, badgeWidth, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text('VELOCIDADE ATUAL', margin + 3, y + 5);
  doc.setFontSize(10);
  doc.text(lead.audit ? `${lead.audit.loadingTimeSeconds}s (Lento)` : 'Não medido', margin + 3, y + 11);

  // Badge 2: Target Speed
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + badgeWidth + 3, y, badgeWidth, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text('VELOCIDADE COM REDESIGN', margin + badgeWidth + 6, y + 5);
  doc.setFontSize(10);
  doc.text(lead.audit ? 'Meta do redesign' : 'A definir após auditoria', margin + badgeWidth + 6, y + 11);

  // Badge 3: Opportunity Score
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin + (badgeWidth + 3) * 2, y, badgeWidth, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  doc.text('OPORTUNIDADE DE CONVERSÃO', margin + (badgeWidth + 3) * 2 + 3, y + 5);
  doc.setFontSize(10);
  doc.text(`${lead.score}/100 no CRM`, margin + (badgeWidth + 3) * 2 + 3, y + 11);

  y += 22;

  // Section 2: Escopo dos Entregáveis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ESCOPO DA SOLUÇÃO & ENTREGÁVEIS', margin, y);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  y += 7;

  const deliverables = [
    { title: 'Website Mobile-First Ultra Rápido', desc: 'Design personalizado e adaptado para todos os celulares e computadores com pontuação 95+ no Google.' },
    { title: 'Funil de Atendimento no WhatsApp', desc: 'Botões de agendamento automático com mensagens pré-formatadas para maximizar o fechamento de vendas.' },
    { title: 'SEO local', desc: 'Otimização para aparecer nas primeiras posições de busca da região de ' + lead.city + '.' },
    { title: 'Infraestrutura Cloud & Certificado SSL', desc: 'Hospedagem segura em nuvem de alta velocidade, proteção HTTPS e domínio próprio incluso.' },
    { title: 'Painel de Gestão & Suporte Técnico', desc: 'Acompanhamento mensal com backups diários, suporte prioritário e alterações solicitadas.' }
  ];

  deliverables.forEach((item, index) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, 5, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${index + 1}`, margin + 2.5, y + 3.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 8, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(item.desc, margin + 8, y + 8);

    y += 11;
  });

  y += 3;

  // Section 3: Prévia Desenvolvida
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text('🌐 PRÉVIA DEMONSTRATIVA DISPONÍVEL ONLINE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(12, 74, 110);
  doc.text(`Acesse a versão de demonstração desenvolvida exclusivamente para seu negócio:`, margin + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(previewUrl, margin + 4, y + 15);

  y += 24;

  // Section 4: Investimento e Condições Comerciais
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. INVESTIMENTO & CONDIÇÕES COMERCIAIS', margin, y);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);

  y += 7;

  // Investment Table Box
  const setupVal = lead.dealValue || 1800;
  const mrrVal = lead.mrrValue || 197;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  // Row 1: Setup
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Desenvolvimento, Redesign & Otimização Completa (Setup)', margin + 4, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`R$ ${setupVal.toLocaleString('pt-BR')},00`, pageWidth - margin - 4, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Pagamento à vista com 5% de desconto no Pix ou em até 12x no cartão de crédito.', margin + 4, y + 13);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, y + 16, pageWidth - margin - 4, y + 16);

  // Row 2: MRR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Hospedagem Cloud, SSL, Suporte Contínuo & Manutenção (Mensal)', margin + 4, y + 23);
  doc.setFontSize(11);
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text(`R$ ${mrrVal.toLocaleString('pt-BR')},00/mês`, pageWidth - margin - 4, y + 23, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Sem fidelidade. Suporte via WhatsApp, backups de segurança e atualizações técnicas.', margin + 4, y + 28);

  y += 38;

  // Section 5: Assinatura e Contato
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth / 2 - 2, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AGÊNCIA RESPONSÁVEL', margin + 4, y + 5);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(closerName, margin + 4, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${closerEmail} | ${closerPhone}`, margin + 4, y + 16);
  doc.text(agencyName, margin + 4, y + 20);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ACEITE DA PROPOSTA', margin + contentWidth / 2 + 6, y + 5);
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + contentWidth / 2 + 6, y + 17, pageWidth - margin - 6, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Assinatura do Cliente: ${lead.name}`, margin + contentWidth / 2 + 6, y + 21);

  // Footer on bottom of page
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${agencyName} · ${agencyDomain} · Proposta confidencial gerada para ${lead.name}`, margin, pageHeight - 3.5);
  doc.text('Página 1 de 1', pageWidth - margin, pageHeight - 3.5, { align: 'right' });

  return doc;
}

export function downloadProposalPdf(options: ProposalPdfOptions) {
  const doc = generateProposalPdf(options);
  const slug = options.lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`Proposta-Comercial-${slug}.pdf`);
}
