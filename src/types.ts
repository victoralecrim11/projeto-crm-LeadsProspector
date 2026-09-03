export type LeadTemperature = 'quente' | 'morno' | 'frio';

export type LeadStatus = 
  | 'novo'
  | 'auditado'
  | 'redesenhado'
  | 'proposta_enviada'
  | 'follow_up'
  | 'negociacao'
  | 'convertido'
  | 'perdido';

export interface SiteAudit {
  speedScore: number; // 0 - 100
  mobileFriendly: boolean;
  hasSsl: boolean;
  hasWhatsappButton: boolean;
  seoScore: number;
  loadingTimeSeconds: number;
  issues: string[];
  opportunities: string[];
}

export interface SiteCustomization {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  services: { title: string; price: string; description: string }[];
  testimonials: { author: string; role: string; text: string; rating: number }[];
  workingHours: string;
}

export interface ProposalData {
  title: string;
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
  proposalSlug: string;
  dealValue: number;
  mrrValue: number;
  viewsCount: number;
  sentAt?: string;
  openedAt?: string;
}

export interface ContractData {
  contractNumber: string;
  clientName: string;
  clientDoc: string; // CNPJ / CPF
  setupFee: number;
  mrrMonthlyFee: number;
  contractStatus: 'pendente' | 'enviado' | 'assinado';
  paymentTerms: string;
  signedAt?: string;
  pdfGenerated: boolean;
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  niche: string;
  temperature: LeadTemperature;
  score: number; // 0 - 100
  rating: number; // e.g. 4.9, 5.0
  reviewsCount: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  city: string;
  state: string;
  neighborhood?: string;
  address: string;
  distanceKm?: number;
  geoLat?: number;
  geoLng?: number;
  placeId?: string;        // OSM node ID (e.g. "node/123456") or Google place_id
  dataSource?: 'real' | 'synthetic';  // tracks origin of the lead data
  hasWebsite: boolean;
  websiteUrl?: string;
  inCrm: boolean;
  crmStage?: LeadStatus;
  dealValue?: number; // In BRL (Setup)
  mrrValue?: number; // In BRL (Mensalidade)
  assignedTo?: string;
  notes?: string[];
  createdAt: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  daysWithoutResponse?: number;
  audit?: SiteAudit;
  customization?: SiteCustomization;
  proposal?: ProposalData;
  contract?: ContractData;
}

export interface FunnelStats {
  total: number;
  auditados: number;
  redesenhados: number;
  propostasEnviadas: number;
  followUp: number;
  negociando: number;
  convertidos: number;
  perdidos: number;
  taxaConversao: number;
  taxaProposta: number;
  taxaAgendamento: number;
  mrrTotal: number;
  receitaTotal: number;
  ticketMedio: number;
}

export interface Appointment {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'reuniao_online' | 'visita_presencial' | 'ligacao';
  status: 'agendado' | 'realizado' | 'cancelado';
  notes?: string;
  meetingLink?: string;
}

export interface Project {
  id: string;
  leadId?: string;
  clientName: string;
  title: string;
  category: string;
  type: 'Landing Page' | 'Site Institucional' | 'E-commerce' | 'Catálogo Digital';
  status: 'publicado' | 'em_desenvolvimento' | 'rascunho';
  previewUrl: string;
  domain?: string;
  monthlyRevenue?: number;
  createdAt: string;
  slug: string;
  isHostGatorSynced?: boolean;
}

export interface SalesRankUser {
  id: string;
  name: string;
  avatar: string;
  dealsClosed: number;
  totalRevenue: number;
  conversionRate: number;
  points: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'lead' | 'agenda' | 'deal' | 'system' | 'proposal' | 'contract';
  leadId?: string;
}

export interface HostGatorSetupConfig {
  agencyName?: string;
  cpanelHost: string;
  cpanelUser: string;
  cpanelPass: string;
  baseDomain: string;
  targetFolder: string;
  autoSsl: boolean;
  senderName: string;
  senderEmail: string;
  whatsappCloserPhone: string;
  preferredNiches: string[];
}

export type ThemeMode = 'dark' | 'light';

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'quebra_gelo' | 'diagnostico' | 'condicao_especial' | 'ultimo_aviso' | 'pos_reuniao';
  subject: string;
  body: string;
  tone: 'consultivo' | 'urgencia' | 'rapport' | 'direto';
  recommendedDays: number;
}

export interface EmailSendOptions {
  toEmail: string;
  toName: string;
  leadId?: string;
  subject: string;
  body: string;
  templateId?: string;
  senderName?: string;
  senderEmail?: string;
  includePreviewLink?: boolean;
  previewUrl?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  sentAt: string;
  error?: string;
}

export interface SentEmailRecord {
  id: string;
  leadId?: string;
  leadName: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'rascunho' | 'entregue' | 'aberto' | 'clicado' | 'respondido';
  templateName?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'ollama' | 'openrouter' | 'nvidia' | 'groq' | 'huggingface' | 'cohere' | 'github' | 'together';

export interface AIProviderConfig {
  id: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
}

export interface CrmSettingsConfig {
  closerName: string;
  closerTitle: string;
  closerEmail: string;
  closerPhone: string;
  monthlyRevenueGoal: number;
  closerCommissionPercent: number;
  defaultSetupPrice: number;
  defaultMrrPrice: number;
  maxDiscountPercent: number;
  followUpAlertDays: number;
  googleMapsApiKey: string;
  googleMapsMapId: string;
  emailProvider: 'direct' | 'gmail' | 'smtp' | 'resend';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  autoEnrichLeads: boolean;
  notifyOnLeadStall: boolean;
  aiProvider?: AIProvider;
  geminiApiKey?: string; // We'll keep this generic or use a new one, but let's rename to aiApiKey to be generic
  aiApiKey?: string;
  aiBaseUrl?: string; // useful for Ollama or OpenAI compatible endpoints
  aiSystemPrompt?: string;
  aiProviders?: AIProviderConfig[];
  useSeedDemo?: boolean;
}

export type ActivePage = 
  | 'dashboard'
  | 'leads'
  | 'redesenhar'
  | 'editor'
  | 'propostas'
  | 'crm'
  | 'followup'
  | 'contratos'
  | 'agendamentos'
  | 'projetos'
  | 'cobrar'
  | 'setup'
  | 'configuracoes'
  | 'ranking'
  | 'templates'
  | 'afiliado';

