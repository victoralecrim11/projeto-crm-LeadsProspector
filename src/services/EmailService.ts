import { Lead, HostGatorSetupConfig, EmailTemplate, EmailSendOptions, EmailSendResult, SentEmailRecord, CrmSettingsConfig } from '../types';

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_quebra_gelo',
    name: '1. Quebra de Gelo (Demonstração Gratuita)',
    category: 'quebra_gelo',
    recommendedDays: 0,
    tone: 'consultivo',
    subject: '{nome_empresa} + {cidade} (Ideia para o negócio)',
    body: `Oi {responsavel}, tudo bem?\n\nVi a {nome_empresa} no Google e reparei que vocês têm ótimas avaliações em {cidade}, mas o site atual pode estar perdendo alguns clientes no celular por conta da velocidade.\n\nPara te mostrar como isso pode melhorar, minha equipe criou uma nova versão de teste do site de vocês, bem mais rápida e com um botão direto pro seu WhatsApp.\n\nFizemos sem compromisso. Posso te mandar o link pra você dar uma olhada e ver o que acha?\n\nAbraço,\n{closer_nome}\n{whatsapp_closer}`
  },
  {
    id: 'tpl_diagnostico',
    name: '2. Diagnóstico Técnico (Perda de Clientes Mobile)',
    category: 'diagnostico',
    recommendedDays: 3,
    tone: 'urgencia',
    subject: 'O site da {nome_empresa} no celular',
    body: `Oi {responsavel},\n\nPassando só para te dar um toque sobre algo que percebi na presença online da {nome_empresa}.\n\nFizemos um teste rápido e vimos que o site demora um pouco para abrir no celular, o que acaba fazendo algumas pessoas desistirem antes de chamar no WhatsApp.\n\nNós já deixamos aquela nova versão estruturada e voando no celular, pronta para ir ao ar no seu domínio oficial:\n👉 Link da demonstração: {link_preview}\n\nConsegue 5 minutinhos hoje para eu te mostrar como ativar isso?\n\nQualquer coisa me chama aqui ou no WhatsApp: {whatsapp_closer}.\n\nAbraço,\n{closer_nome}`
  },
  {
    id: 'tpl_condicao_especial',
    name: '3. Condição Especial & Setup Facilitado',
    category: 'condicao_especial',
    recommendedDays: 5,
    tone: 'urgencia',
    subject: 'Proposta final para a {nome_empresa} essa semana',
    body: `Oi {responsavel}, tudo joia?\n\nQueria muito colocar esse novo site da {nome_empresa} no ar, porque sei que vai trazer um bom retorno pra vocês em {cidade}.\n\nConsegui liberar uma condição bem mais flexível essa semana:\n\n✨ Implantação e design: De R$ 2.400 por {setup_preco}\n🚀 Servidor dedicado com suporte: {mrr_preco}/mês\n🎁 Bônus: Integração total pro seu WhatsApp de agendamento.\n\nComo o projeto já está 90% pronto ({link_preview}), conseguimos publicar tudo em até 48 horas se aprovarmos agora.\n\nO que acha da gente fechar isso?\n\n{closer_nome}`
  },
  {
    id: 'tpl_ultimo_aviso',
    name: '4. Último Chamado (Liberação de Exclusividade)',
    category: 'ultimo_aviso',
    recommendedDays: 8,
    tone: 'direto',
    subject: 'Acesso à prévia do site da {nome_empresa}',
    body: `Oi {responsavel},\n\nComo não consegui retorno sobre a prévia do site que fizemos para a {nome_empresa} ({link_preview}), vou arquivar o projeto por aqui.\n\nComo nós trabalhamos com exclusividade de template por nicho em {cidade}, vou acabar liberando essa estrutura para outra empresa da região.\n\nSe vocês ainda tiverem interesse em ficar com o site, me avise hoje por aqui ou no WhatsApp ({whatsapp_closer}) que eu seguro a vaga, ok?\n\nSucesso pra vocês!\n\n{closer_nome}`
  },
  {
    id: 'tpl_pos_reuniao',
    name: '5. Pós-Reunião / Minuta de Contrato',
    category: 'pos_reuniao',
    recommendedDays: 1,
    tone: 'rapport',
    subject: 'Resumo da nossa conversa - {nome_empresa}',
    body: `Fala {responsavel}!\n\nFoi excelente nosso papo hoje sobre o momento digital da {nome_empresa}.\n\nConforme combinamos, segue o link da minuta do contrato e da prévia aprovada:\n👉 Link da prévia: {link_preview}\n💰 Implantação: {setup_preco}\n🔒 Hospedagem e Manutenção: {mrr_preco}/mês\n\nAssim que você confirmar o "De Acordo" na minuta, nossa equipe técnica já assume e faz a publicação imediata.\n\nQualquer dúvida estou por aqui: {whatsapp_closer}.\n\nAbraço,\n{closer_nome}`
  }
];

const HISTORY_STORAGE_KEY = 'leadsite_sent_emails_history_v2';

export class EmailService {
  /**
   * Obtém a lista de templates cadastrados
   */
  public static getTemplates(): EmailTemplate[] {
    return DEFAULT_EMAIL_TEMPLATES;
  }

  /**
   * Substitui placeholders e variáveis dinâmicas no corpo e assunto do e-mail
   */
  public static replacePlaceholders(
    templateText: string, 
    lead: Partial<Lead>, 
    config?: Partial<HostGatorSetupConfig>,
    crmSettings?: Partial<CrmSettingsConfig>
  ): string {
    const slug = (lead.name || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const domain = config?.baseDomain || 'prospector.app.br';
    const previewUrl = `https://${domain}/clientes/${slug}`;

    const closerName = crmSettings?.closerName || config?.senderName || 'Victor Alecrim';
    const closerCargo = crmSettings?.closerTitle || 'Closer Top #1';
    const whatsapp = crmSettings?.closerPhone || config?.whatsappCloserPhone || '(31) 99842-1100';

    const setupPrice = crmSettings?.defaultSetupPrice 
      ? `R$ ${crmSettings.defaultSetupPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : (lead.dealValue ? `R$ ${lead.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 1.800,00');

    const mrrPrice = crmSettings?.defaultMrrPrice 
      ? `R$ ${crmSettings.defaultMrrPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
      : (lead.mrrValue ? `R$ ${lead.mrrValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 197,00');

    const issues = lead.audit?.issues?.length 
      ? lead.audit.issues.join(', ') 
      : 'Site lento no mobile e sem botão de agendamento instantâneo';

    const replacements: Record<string, string> = {
      '{nome_empresa}': lead.name || 'Sua Empresa',
      '{responsavel}': lead.name ? lead.name.split(' ')[0] : 'Responsável',
      '{nicho}': lead.niche || lead.category || 'Negócios Locais',
      '{categoria}': lead.category || 'Empresa',
      '{cidade}': lead.city || 'sua região',
      '{estado}': lead.state || 'BR',
      '{link_preview}': previewUrl,
      '{diagnostico_site}': issues,
      '{score_google}': lead.score ? `${lead.score}/100` : '92/100',
      '{avaliacao_google}': lead.rating ? `${lead.rating} ⭐` : '4.9 ⭐',
      '{closer_nome}': closerName,
      '{closer_cargo}': closerCargo,
      '{whatsapp_closer}': whatsapp,
      '{setup_preco}': setupPrice,
      '{mrr_preco}': mrrPrice,
    };

    let result = templateText;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.split(key).join(value);
    }
    return result;
  }

  /**
   * Gera link de mailto direto para clientes de e-mail locais (Outlook, Apple Mail, etc.)
   */
  public static generateMailtoLink(options: EmailSendOptions): string {
    const subject = encodeURIComponent(options.subject);
    const body = encodeURIComponent(options.body);
    return `mailto:${options.toEmail}?subject=${subject}&body=${body}`;
  }

  /**
   * Gera link para abrir o compositor do Gmail Web diretamente
   */
  public static generateGmailWebLink(options: EmailSendOptions): string {
    const to = encodeURIComponent(options.toEmail);
    const su = encodeURIComponent(options.subject);
    const body = encodeURIComponent(options.body);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
  }

  /**
   * Simula ou executa o envio de e-mail pelo CRM e salva no histórico
   */
  public static async sendEmail(
    options: EmailSendOptions,
    crmSettings?: Partial<CrmSettingsConfig>
  ): Promise<EmailSendResult> {
    // Simulação com pequeno delay para feedback de envio realista
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!options.toEmail || !options.toEmail.includes('@')) {
      return {
        success: false,
        messageId: '',
        sentAt: new Date().toISOString(),
        error: 'Endereço de e-mail inválido.'
      };
    }

    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const sentAt = new Date().toISOString();

    const record: SentEmailRecord = {
      id: messageId,
      leadId: options.leadId,
      leadName: options.toName,
      toEmail: options.toEmail,
      subject: options.subject,
      body: options.body,
      sentAt,
      status: 'entregue',
      templateName: options.templateId ? DEFAULT_EMAIL_TEMPLATES.find(t => t.id === options.templateId)?.name : 'E-mail Personalizado'
    };

    this.saveToHistory(record);

    return {
      success: true,
      messageId,
      sentAt
    };
  }

  /**
   * Salva o registro de e-mail enviado no histórico do localStorage
   */
  public static saveToHistory(record: SentEmailRecord): void {
    try {
      const history = this.getHistory();
      const updated = [record, ...history].slice(0, 100); // guarda até 100 envios
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Falha ao salvar histórico de e-mails', e);
    }
  }

  /**
   * Recupera o histórico de e-mails enviados
   */
  public static getHistory(leadId?: string): SentEmailRecord[] {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed: SentEmailRecord[] = JSON.parse(saved);
        if (leadId) {
          return parsed.filter(item => item.leadId === leadId);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Falha ao ler histórico de e-mails', e);
    }
    return [];
  }

  /**
   * Limpa o histórico de e-mails enviados
   */
  public static clearHistory(): void {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }
}
