import { type GeneratedMediaRequest } from './aiImageProviderRegistry.types.js';

export function buildAiImageIntent(request: GeneratedMediaRequest): string {
  const { niche, subNiche, section, purpose, imageryDirection, designFamily } = request;

  // 1. Base photographic/editorial style based on Design Family (if any) or default to high-end photography
  let styleBase = 'High-quality editorial photography, professional lighting, cinematic, photorealistic.';
  if (designFamily === 'modern') {
    styleBase = 'Modern, clean, minimalist photography, bright lighting, high-end editorial.';
  } else if (designFamily === 'classic') {
    styleBase = 'Classic, warm, inviting photography, traditional editorial style, rich colors.';
  } else if (designFamily === 'bold') {
    styleBase = 'Bold, vibrant photography, high contrast, dynamic angles, striking editorial look.';
  }

  // 2. Niche context
  let nicheContext = `Focus: ${niche}`;
  if (subNiche) {
    nicheContext += ` (${subNiche})`;
  }

  // 3. Section & Purpose mapping
  let subject = purpose;
  if (section === 'hero') {
    subject = `A stunning hero image depicting ${purpose}. Wide composition, plenty of negative space for text overlays.`;
  } else if (section === 'about') {
    subject = `A lifestyle or documentary style image showing ${purpose}. Authentic, approachable.`;
  } else if (section === 'services') {
    subject = `A professional shot highlighting ${purpose}. Clear, focused, showcasing quality.`;
  }

  // 4. Safety & PII Rules (Crucial for compliance)
  const safetyRules = 'CRITICAL RULES: No text, no words, no letters, no numbers, no logos, no watermarks, no identifiable real-world faces or explicit real-world business names. The image must be generic but high-end.';

  // Combine into final prompt
  const prompt = `
${styleBase}
${nicheContext}
Subject: ${subject}
Additional Direction: ${imageryDirection || 'Authentic and professional.'}
${safetyRules}
  `.trim();

  return prompt;
}
