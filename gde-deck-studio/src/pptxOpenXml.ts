/**
 * ECMA-376 OpenXML (.pptx) Multi-Template Compiler, Theme Parser, and Python Exporter
 * Standalone Engine for GDE Stage // GDE Deck Studio
 */

export const GEMINI_HEAVY_MODEL = 'gemini-4-argon';
export const GEMINI_FAST_MODEL = 'gemini-3.8-flash';
export const GEMINI_LITE_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_IMAGE_MODEL = 'gemini-nano-banana-2.1';
export const GEMINI_VIDEO_MODEL = 'gemini-omni-1.2-flash';
export const GEMINI_MUSIC_MODEL = 'lyria-3-pro-preview';
export const GEMINI_MUSIC_CLIP_MODEL = 'lyria-3-clip-preview';
export const GEMINI_TTS_MODEL = 'gemini-3.5-flash-tts';

export type SlideLayoutKind =
  | 'editorial-split'
  | 'stat-pills'
  | 'architecture-blueprint'
  | 'keynote-split'
  | 'developer-terminal'
  | 'video-showcase'
  | 'roadmap-timeline';

export interface SlideCardItem {
  badge: string;
  heading: string;
  metric?: string;
  bullets: string[];
  accentHex?: string;
}

export interface VideoEditTurn {
  prompt: string;
  timestamp: string;
  durationSec: number;
  resolution: '720p' | '1080p';
}

export interface SlideSpec {
  id: string;
  sectionTag: string;
  title: string;
  subtitle: string;
  layout: SlideLayoutKind;
  cards: SlideCardItem[];
  codeSnippet?: string;
  codeLanguage?: string;
  visualPrompt: string;
  visualDataUrl?: string;
  videoPrompt?: string;
  videoUrl?: string;
  videoDurationSec?: number;
  videoHistory?: VideoEditTurn[];
  musicPrompt?: string;
  musicModel?: string;
  musicAudioUrl?: string;
  narratorScript?: string;
  narratorModel?: string;
  narratorVoiceName?: string;
  narratorRate?: number;
  voiceAudioUrl?: string;
  autoAdvanceSec?: number;
  takeaway: string;
  speakerNotes: string;
  vqaStatus?: 'pending' | 'passed' | 'repaired';
  vqaNotes?: string;
}

export type BrandTemplateStyle =
  | 'gde-2026-navy'
  | 'gde-2026-light-pills'
  | 'cloud-blueprint'
  | 'devfest-split'
  | 'build-with-ai-terminal'
  | 'uploaded-custom-argon';

export interface BrandThemeSpec {
  id: string;
  name: string;
  conferenceTitle: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  warningHex: string;
  darkBgHex: string;
  lightBgHex: string;
  surfaceHex: string;
  headingFont: string;
  bodyFont: string;
  footerSignature: string;
  referenceImageDataUrl?: string;
  secondaryLogoDataUrl?: string;
  featuredGraphicDataUrl?: string;
  referenceTemplateName?: string;
  distilledPptxUrl?: string;
  templateStyle?: BrandTemplateStyle;
  headerStyle?: 'gde-brackets' | 'pill-and-divider' | 'conference-bar';
  footerStyle?: 'gde-minimal' | 'circle-page-badge' | 'executive-banner';
  headlineAccentHex?: string;
  dividerHex?: string;
  cardBgTints?: string[];
  cardBorderTints?: string[];
  cardTitleColors?: string[];
}

export interface PresentationDeckSpec {
  productName: string;
  deckTitle: string;
  deckSubtitle: string;
  presenterName: string;
  gdeCategory: string;
  brand: BrandThemeSpec;
  slides: SlideSpec[];
}

export interface ParsedPptxResult {
  fileName: string;
  extractedSlides: Array<{
    slideNumber: number;
    title: string;
    bullets: string[];
    speakerNotes: string;
  }>;
  extractedTheme: Partial<BrandThemeSpec>;
  markdownSummary: string;
}

export const BRAND_PRESETS: BrandThemeSpec[] = [
  {
    id: 'gde-official-2026',
    name: '2026 GDE Brand Guide · Navy Editorial & Graphics (#20344B)',
    conferenceTitle: 'Google Developer Experts 2026 Official Brand System',
    primaryHex: '#57CAFF',
    secondaryHex: '#FF7DAF',
    accentHex: '#5CDB6D',
    warningHex: '#FFD427',
    darkBgHex: '#20344B',
    lightBgHex: '#20344B',
    surfaceHex: '#162536',
    headingFont: 'Google Sans',
    bodyFont: 'Google Sans',
    footerSignature: 'Google Developer Experts // 2026 Official Brand System',
    referenceImageDataUrl: '/gde-2026-logo-navy.png',
    secondaryLogoDataUrl: '/gde-2026-badge.png',
    featuredGraphicDataUrl: '/gde-2026-brand-graphics.png',
    referenceTemplateName: '2026 GDE Brand Guide (Slide 1 & Slide 19 Navy Editorial)',
    distilledPptxUrl: '/2026-GDE-Brand-Guide-Distilled.pptx',
    templateStyle: 'gde-2026-navy',
    headerStyle: 'gde-brackets',
    footerStyle: 'gde-minimal',
    headlineAccentHex: '#FF7DAF',
    dividerHex: '#57CAFF',
    cardBgTints: ['#162536', '#162536', '#162536'],
    cardBorderTints: ['#57CAFF', '#5CDB6D', '#FFD427'],
    cardTitleColors: ['#57CAFF', '#5CDB6D', '#FFD427'],
  },
  {
    id: 'gde-official-2026-light',
    name: '2026 GDE Brand Guide · Light Slide 23 Overlapping Stat Pills',
    conferenceTitle: 'Google Developer Experts 2026 Slide Template (Slide 23)',
    primaryHex: '#4285F4',
    secondaryHex: '#EA4335',
    accentHex: '#5CDB6D',
    warningHex: '#FFD427',
    darkBgHex: '#20344B',
    lightBgHex: '#FFFFFF',
    surfaceHex: '#F3F3F3',
    headingFont: 'Google Sans',
    bodyFont: 'Google Sans',
    footerSignature: 'Google Developer Experts // 2026 Slide 23 Template',
    referenceImageDataUrl: '/gde-2026-logo-light.png',
    secondaryLogoDataUrl: '/gde-2026-badge.png',
    featuredGraphicDataUrl: '/gde-2026-stat-pills.png',
    referenceTemplateName: '2026 GDE Brand Guide (Slide 23 Overlapping Stat Pills)',
    distilledPptxUrl: '/2026-GDE-Brand-Guide-Distilled.pptx',
    templateStyle: 'gde-2026-light-pills',
    headerStyle: 'gde-brackets',
    footerStyle: 'gde-minimal',
    headlineAccentHex: '#20344B',
    dividerHex: '#20344B',
    cardBgTints: ['#5CDB6D', '#20344B', '#FFD427'],
    cardBorderTints: ['#20344B', '#20344B', '#20344B'],
    cardTitleColors: ['#20344B', '#5CDB6D', '#20344B'],
  },
  {
    id: 'cloud-next-26',
    name: 'Google Cloud Next · Horizontal Architecture Blueprint',
    conferenceTitle: 'Google Cloud Next 2026 Production Architecture',
    primaryHex: '#0B57D0',
    secondaryHex: '#137333',
    accentHex: '#E37400',
    warningHex: '#C5221F',
    darkBgHex: '#0B1220',
    lightBgHex: '#F8FAFD',
    surfaceHex: '#FFFFFF',
    headingFont: 'Google Sans',
    bodyFont: 'Inter',
    footerSignature: 'Google Cloud Next // Production Cloud Run Blueprint',
    templateStyle: 'cloud-blueprint',
    headerStyle: 'pill-and-divider',
    footerStyle: 'circle-page-badge',
    headlineAccentHex: '#0B1220',
    dividerHex: '#CBD5E1',
  },
  {
    id: 'devfest-2026',
    name: 'GDG DevFest 2026 · Asymmetric Keynote Split Stage',
    conferenceTitle: 'GDG DevFest 2026 Flagship Keynote Track',
    primaryHex: '#4285F4',
    secondaryHex: '#EA4335',
    accentHex: '#34A853',
    warningHex: '#FBBC04',
    darkBgHex: '#111827',
    lightBgHex: '#F9FAFB',
    surfaceHex: '#FFFFFF',
    headingFont: 'Google Sans',
    bodyFont: 'Inter',
    footerSignature: 'GDG DevFest 2026 // Flagship Keynote Track',
    templateStyle: 'devfest-split',
    headerStyle: 'conference-bar',
    footerStyle: 'gde-minimal',
    headlineAccentHex: '#FFFFFF',
  },
  {
    id: 'build-with-ai',
    name: 'Build with AI Roadshow · Dark Developer Terminal & SDK',
    conferenceTitle: 'Build with AI 2026 Developer Tour',
    primaryHex: '#3B82F6',
    secondaryHex: '#A855F7',
    accentHex: '#10B981',
    warningHex: '#F59E0B',
    darkBgHex: '#090D16',
    lightBgHex: '#090D16',
    surfaceHex: '#111827',
    headingFont: 'Outfit',
    bodyFont: 'Inter',
    footerSignature: 'Build with AI 2026 // Developer Tour & Live SDK',
    templateStyle: 'build-with-ai-terminal',
    headerStyle: 'conference-bar',
    footerStyle: 'gde-minimal',
    headlineAccentHex: '#F8FAFC',
  },
];

// ---------------------------------------------------------------------------
// PURE-TS ZIP ARCHIVE READER & WRITER (ZERO EXTERNAL RUNTIME DEPENDENCIES)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  path: string;
  data: Uint8Array;
}

export function buildZipArchive(entries: ZipFileEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x2100, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x2100, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralChunks.reduce((acc, c) => acc + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLength = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let cursor = 0;
  for (const chunk of localChunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  output.set(eocd, cursor);
  return output;
}

export async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const entries = new Map<string, Uint8Array>();

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    return entries;
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let cdOffset = view.getUint32(eocdOffset + 16, true);

  for (let i = 0; i < totalEntries; i++) {
    if (cdOffset + 46 > bytes.length || view.getUint32(cdOffset, true) !== 0x02014b50) {
      break;
    }
    const method = view.getUint16(cdOffset + 10, true);
    const compressedSize = view.getUint32(cdOffset + 20, true);
    const nameLen = view.getUint16(cdOffset + 28, true);
    const extraLen = view.getUint16(cdOffset + 30, true);
    const commentLen = view.getUint16(cdOffset + 32, true);
    const localHeaderOffset = view.getUint32(cdOffset + 42, true);

    const fileName = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (localHeaderOffset + 30 > bytes.length) continue;
    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawSlice = bytes.subarray(dataStart, dataStart + compressedSize);

    if (method === 0) {
      entries.set(fileName, rawSlice);
    } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(rawSlice);
        writer.close();
        const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
        entries.set(fileName, new Uint8Array(decompressedBuffer));
      } catch {
        // Skip entries that fail browser deflate-raw stream
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// PPTX SOURCE & BRANDING TEMPLATE PARSER (ppt/theme/theme1.xml & slides)
// ---------------------------------------------------------------------------

function extractXmlTagText(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(decodeXmlEntities(match[1].trim()));
  }
  return matches;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hexToHslMetrics(hex: string): { r: number; g: number; b: number; lum: number; sat: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return { r: 0, g: 0, b: 0, lum: 0, sat: 0 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * lum - 1));
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), lum, sat };
}

function uint8ToBase64DataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  if (typeof btoa === 'function') {
    return `data:${mimeType};base64,${btoa(binary)}`;
  }
  return '';
}

export async function parseUploadedPptxFile(file: File): Promise<ParsedPptxResult> {
  const buffer = await file.arrayBuffer();
  const entries = await readZipEntries(buffer);
  const decoder = new TextDecoder();

  const extractedTheme: Partial<BrandThemeSpec> = {
    referenceTemplateName: file.name,
  };

  // 1. Parse ppt/theme/theme1.xml for <a:clrScheme> and <a:fontScheme>
  const themeBytes = entries.get('ppt/theme/theme1.xml');
  if (themeBytes) {
    const themeXml = decoder.decode(themeBytes);
    const readSchemeColor = (slot: string): string | undefined => {
      const slotRegex = new RegExp(`<a:${slot}>([\\s\\S]*?)<\\/a:${slot}>`, 'i');
      const slotMatch = slotRegex.exec(themeXml);
      if (!slotMatch) return undefined;
      const srgb = /<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/i.exec(slotMatch[1]);
      if (srgb) return `#${srgb[1].toUpperCase()}`;
      const sys = /lastClr="([0-9A-Fa-f]{6})"/i.exec(slotMatch[1]);
      if (sys) return `#${sys[1].toUpperCase()}`;
      return undefined;
    };

    const accent1 = readSchemeColor('accent1');
    const accent2 = readSchemeColor('accent2');
    const accent3 = readSchemeColor('accent3');
    const accent4 = readSchemeColor('accent4');
    const dk1 = readSchemeColor('dk1');
    const lt1 = readSchemeColor('lt1');

    if (accent1) extractedTheme.primaryHex = accent1;
    if (accent2) extractedTheme.secondaryHex = accent2;
    if (accent3) extractedTheme.accentHex = accent3;
    if (accent4) extractedTheme.warningHex = accent4;
    if (dk1) extractedTheme.darkBgHex = dk1;
    if (lt1) extractedTheme.lightBgHex = lt1;

    const majorFontMatch = /<a:majorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/i.exec(themeXml);
    const minorFontMatch = /<a:minorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/i.exec(themeXml);
    if (majorFontMatch && !majorFontMatch[1].startsWith('+')) {
      extractedTheme.headingFont = majorFontMatch[1];
    }
    if (minorFontMatch && !minorFontMatch[1].startsWith('+')) {
      extractedTheme.bodyFont = minorFontMatch[1];
    }
  }

  // 2. Parse ppt/slides/slide*.xml and ppt/notesSlides/notesSlide*.xml
  const slidePaths = Array.from(entries.keys())
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return na - nb;
    });

  const extractedSlides: ParsedPptxResult['extractedSlides'] = [];
  const slideColorCounts = new Map<string, number>();
  const slideFontCounts = new Map<string, number>();

  for (let idx = 0; idx < slidePaths.length; idx++) {
    const slidePath = slidePaths[idx];
    const slideXml = decoder.decode(entries.get(slidePath)!);

    const clrRegex = /<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/gi;
    let clrMatch: RegExpExecArray | null;
    while ((clrMatch = clrRegex.exec(slideXml)) !== null) {
      const hex = `#${clrMatch[1].toUpperCase()}`;
      slideColorCounts.set(hex, (slideColorCounts.get(hex) || 0) + 1);
    }

    const fontRegex = /<a:latin\s+typeface="([^"]+)"/gi;
    let fontMatch: RegExpExecArray | null;
    while ((fontMatch = fontRegex.exec(slideXml)) !== null) {
      const tf = fontMatch[1].trim();
      if (tf && !tf.startsWith('+')) {
        slideFontCounts.set(tf, (slideFontCounts.get(tf) || 0) + 1);
      }
    }

    const shapeBlocks = slideXml.split(/<\/p:sp>/i);
    const paragraphs: string[] = [];

    for (const block of shapeBlocks) {
      const runs = extractXmlTagText(block, 'a:t').filter(Boolean);
      if (runs.length > 0) {
        const joined = runs.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) paragraphs.push(joined);
      }
    }

    const title = paragraphs[0] || `Slide ${idx + 1}`;
    const bullets = paragraphs.slice(1);

    const notesPath = `ppt/notesSlides/notesSlide${idx + 1}.xml`;
    let speakerNotes = '';
    if (entries.has(notesPath)) {
      const notesXml = decoder.decode(entries.get(notesPath)!);
      const noteRuns = extractXmlTagText(notesXml, 'a:t').filter(
        (t) => t && !/^\d+$/.test(t.trim())
      );
      speakerNotes = noteRuns.join(' ').trim();
    }

    extractedSlides.push({
      slideNumber: idx + 1,
      title,
      bullets,
      speakerNotes,
    });
  }

  // 3. Slide-Level Brand Synthesis
  const topFonts = Array.from(slideFontCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => f);
  if (topFonts[0]) {
    extractedTheme.headingFont = topFonts[0];
  }
  if (topFonts[1]) {
    extractedTheme.bodyFont = topFonts[1];
  } else if (topFonts[0]) {
    extractedTheme.bodyFont = topFonts[0];
  }

  const rankedSlideColors = Array.from(slideColorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  const chromaticColors: string[] = [];
  const pastelTints: string[] = [];
  const softBorders: string[] = [];
  const darkInkColors: string[] = [];

  for (const hex of rankedSlideColors) {
    if (hex === '#FFFFFF' || hex === '#000000') continue;
    const { lum, sat } = hexToHslMetrics(hex);
    if (lum >= 0.89 && lum <= 0.985 && sat >= 0.04) {
      pastelTints.push(hex);
    } else if (lum >= 0.68 && lum < 0.89 && sat >= 0.08 && sat <= 0.6) {
      softBorders.push(hex);
    } else if (lum >= 0.22 && lum <= 0.76 && sat >= 0.22) {
      chromaticColors.push(hex);
    } else if (lum >= 0.06 && lum < 0.28) {
      darkInkColors.push(hex);
    }
  }

  if (chromaticColors.length >= 2) {
    extractedTheme.primaryHex = chromaticColors[0];
    extractedTheme.secondaryHex = chromaticColors[1];
    extractedTheme.accentHex = chromaticColors[2] || chromaticColors[0];
    extractedTheme.warningHex = chromaticColors[3] || chromaticColors[1];
    extractedTheme.cardTitleColors = chromaticColors.slice(0, 4);
  }
  if (darkInkColors.length > 0) {
    extractedTheme.darkBgHex = darkInkColors[0];
  }
  if (pastelTints.length > 0) {
    extractedTheme.cardBgTints = pastelTints.slice(0, 4);
    extractedTheme.lightBgHex = '#FFFFFF';
    extractedTheme.surfaceHex = pastelTints[0];
  }
  if (softBorders.length > 0) {
    extractedTheme.cardBorderTints = softBorders.slice(0, 4);
    extractedTheme.dividerHex = softBorders[0];
  }

  const mediaKeys = Array.from(entries.keys()).filter((k) =>
    /^ppt\/media\/.+\.(png|jpg|jpeg|svg)$/i.test(k)
  );
  const extractedMediaUrls: Array<{ key: string; size: number; url: string }> = [];
  for (const mKey of mediaKeys) {
    const bytes = entries.get(mKey);
    if (!bytes || bytes.length < 400 || bytes.length > 900_000) continue;
    const ext = mKey.split('.').pop()?.toLowerCase() || 'png';
    const mime =
      ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const url = uint8ToBase64DataUrl(bytes, mime);
    if (url) {
      extractedMediaUrls.push({ key: mKey, size: bytes.length, url });
    }
  }
  if (extractedMediaUrls.length > 0) {
    const sortedBySizeAsc = [...extractedMediaUrls].sort((a, b) => a.size - b.size);
    const sortedBySizeDesc = [...extractedMediaUrls].sort((a, b) => b.size - a.size);
    extractedTheme.referenceImageDataUrl = sortedBySizeAsc[0].url;
    if (sortedBySizeAsc[1]) {
      extractedTheme.secondaryLogoDataUrl = sortedBySizeAsc[1].url;
    }
    extractedTheme.featuredGraphicDataUrl = sortedBySizeDesc[0].url;
  }

  const lowerName = file.name.toLowerCase();
  const allTextJoined = extractedSlides
    .map((s) => `${s.title} ${s.bullets.join(' ')}`)
    .join(' ')
    .toLowerCase();

  const isGde2026 =
    lowerName.includes('gde') ||
    allTextJoined.includes('google developer experts') ||
    (slideColorCounts.has('#20344B') &&
      (slideColorCounts.has('#FF7DAF') || slideColorCounts.has('#5CDB6D')));

  if (isGde2026) {
    const gdePreset = BRAND_PRESETS.find((b) => b.id === 'gde-official-2026');
    if (gdePreset) {
      Object.assign(extractedTheme, {
        ...gdePreset,
        referenceTemplateName: file.name,
      });
    }
  } else {
    extractedTheme.id = 'uploaded-custom-brand';
    extractedTheme.name = `Custom Brand // ${file.name.replace(/\.pptx$/i, '')}`;
    extractedTheme.conferenceTitle =
      extractedSlides[0]?.title?.slice(0, 48) || file.name.replace(/\.pptx$/i, '');
    extractedTheme.footerSignature = `${file.name.replace(/\.pptx$/i, '')} // Custom Brand Template`;
    extractedTheme.templateStyle = 'uploaded-custom-argon';
    extractedTheme.headerStyle = 'pill-and-divider';
    extractedTheme.footerStyle = 'circle-page-badge';
  }

  const markdownSummary = extractedSlides
    .map((s) => {
      const bulletLines = s.bullets.map((b) => `- ${b}`).join('\n');
      const notesLine = s.speakerNotes ? `\n> Speaker Notes: ${s.speakerNotes}` : '';
      return `## Slide ${s.slideNumber}: ${s.title}\n${bulletLines}${notesLine}`;
    })
    .join('\n\n');

  return {
    fileName: file.name,
    extractedSlides,
    extractedTheme,
    markdownSummary,
  };
}

export async function extractPaletteFromBrandImage(
  file: File
): Promise<{ dataUrl: string; primaryHex: string; secondaryHex: string; accentHex: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = (err) => reject(err);
    el.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl,
      primaryHex: '#1A73E8',
      secondaryHex: '#D93025',
      accentHex: '#1E8E3E',
    };
  }

  ctx.drawImage(img, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 180) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.22 || max < 40 || min > 235) continue;

    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  const toHex = (item?: { count: number; r: number; g: number; b: number }, fallback = '#1A73E8') => {
    if (!item) return fallback;
    const r = Math.min(255, Math.round(item.r / item.count));
    const g = Math.min(255, Math.round(item.g / item.count));
    const b = Math.min(255, Math.round(item.b / item.count));
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  };

  return {
    dataUrl,
    primaryHex: toHex(sorted[0], '#1A73E8'),
    secondaryHex: toHex(sorted[1], '#D93025'),
    accentHex: toHex(sorted[2], '#1E8E3E'),
  };
}

// ---------------------------------------------------------------------------
// HIGH-RES 16:9 CANVAS DIAGRAM & VISUAL QA RENDERER
// ---------------------------------------------------------------------------

export function generateNanoBananaDiagramDataUrl(
  slide: SlideSpec,
  brand: BrandThemeSpec
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const promptText = (slide.visualPrompt || slide.title || 'GDE Technical Architecture').trim();
  let hash = 2166136261;
  for (let i = 0; i < promptText.length; i++) {
    hash ^= promptText.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  const palette = [
    brand.primaryHex || '#4285F4',
    brand.accentHex || '#34A853',
    brand.warningHex || '#F9AB00',
    brand.secondaryHex || '#EA4335',
    '#57CAFF',
    '#5CDB6D',
    '#FFD427',
    '#FF7DAF',
  ];
  const primaryAccent = palette[hash % 4];
  const secondaryAccent = palette[(hash + 1) % 4];
  const halftoneAccent = palette[4 + (hash % 4)];

  const grad = ctx.createLinearGradient(0, 0, 1280, 720);
  grad.addColorStop(0, '#0F1B29');
  grad.addColorStop(0.55, brand.darkBgHex || '#20344B');
  grad.addColorStop(1, '#09131F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);

  const orbX1 = 220 + (hash % 360);
  const orbY1 = 180 + ((hash >> 4) % 260);
  const radGrad1 = ctx.createRadialGradient(orbX1, orbY1, 20, orbX1, orbY1, 340);
  radGrad1.addColorStop(0, `${primaryAccent}44`);
  radGrad1.addColorStop(1, 'rgba(15, 27, 41, 0)');
  ctx.fillStyle = radGrad1;
  ctx.fillRect(0, 0, 1280, 720);

  const orbX2 = 820 + ((hash >> 8) % 280);
  const orbY2 = 260 + ((hash >> 12) % 240);
  const radGrad2 = ctx.createRadialGradient(orbX2, orbY2, 20, orbX2, orbY2, 320);
  radGrad2.addColorStop(0, `${secondaryAccent}3A`);
  radGrad2.addColorStop(1, 'rgba(15, 27, 41, 0)');
  ctx.fillStyle = radGrad2;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = 'rgba(87, 202, 255, 0.11)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1280; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 720);
    ctx.stroke();
  }
  for (let y = 0; y < 720; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }

  const segW = 1184 / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = palette[i];
    ctx.fillRect(48 + i * segW, 32, segW, 8);
  }

  ctx.fillStyle = 'rgba(66, 133, 244, 0.22)';
  ctx.strokeStyle = halftoneAccent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(48, 56, 430, 38, 19);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = halftoneAccent;
  ctx.font = '700 16px "PT Mono", monospace, sans-serif';
  ctx.fillText('✦ GEMINI-NANO-BANANA-2.1 // VISUAL SYNTHESIS', 66, 80);

  const rawSegments = promptText
    .split(/[,.;]|->|→|\bwith\b|\bshowing\b|\bfeaturing\b|\band\b|\binto\b|\bversus\b|\bvs\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);

  const conceptNodes: string[] = [];
  for (const seg of rawSegments) {
    if (conceptNodes.length < 4) {
      conceptNodes.push(seg.slice(0, 34));
    }
  }
  while (conceptNodes.length < 3) {
    const fallbackCard = slide.cards[conceptNodes.length];
    conceptNodes.push(
      fallbackCard ? fallbackCard.heading.slice(0, 32) : `Architecture Node ${conceptNodes.length + 1}`
    );
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 30px "Google Sans", Outfit, sans-serif';
  const words = promptText.split(/\s+/);
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= 54) {
      line1 = (line1 + ' ' + w).trim();
    } else if ((line2 + ' ' + w).trim().length <= 58) {
      line2 = (line2 + ' ' + w).trim();
    }
  }
  ctx.fillText(line1, 48, 134);
  if (line2) {
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 24px "Google Sans", Outfit, sans-serif';
    ctx.fillText(line2, 48, 168);
  }

  const nodeCount = Math.min(4, Math.max(3, conceptNodes.length));
  const totalAreaW = 1184;
  const gapX = 28;
  const boxWidth = Math.floor((totalAreaW - gapX * (nodeCount - 1)) / nodeCount);
  const boxHeight = 340;
  const startX = 48;
  const startY = 202;

  conceptNodes.slice(0, nodeCount).forEach((concept, idx) => {
    const x = startX + idx * (boxWidth + gapX);
    const y = startY;
    const accent = palette[idx % 4];
    const halftone = palette[4 + (idx % 4)];

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.fillRect(x, y, boxWidth, 10);

    const centerX = x + boxWidth / 2;
    const centerY = y + 108;
    ctx.save();
    ctx.strokeStyle = halftone;
    ctx.fillStyle = `${accent}33`;
    ctx.lineWidth = 3;
    const shapeType = (hash + idx) % 3;
    if (shapeType === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shapeType === 1) {
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a - Math.PI / 6;
        const hx = centerX + 46 * Math.cos(angle);
        const hy = centerY + 46 * Math.sin(angle);
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      for (let layer = -1; layer <= 1; layer++) {
        ctx.beginPath();
        ctx.roundRect(centerX - 48, centerY + layer * 22 - 10, 96, 18, 6);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.fillStyle = halftone;
    ctx.font = '700 15px "PT Mono", monospace, sans-serif';
    ctx.fillText(`STAGE 0${idx + 1}`, x + 22, y + 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 22px "Google Sans", Outfit, sans-serif';
    const cWords = concept.split(/\s+/);
    let cLine1 = '';
    let cLine2 = '';
    for (const cw of cWords) {
      if ((cLine1 + ' ' + cw).trim().length <= 18) {
        cLine1 = (cLine1 + ' ' + cw).trim();
      } else {
        cLine2 = (cLine2 + ' ' + cw).trim();
      }
    }
    ctx.fillText(cLine1, x + 22, y + 205);
    if (cLine2) {
      ctx.fillText(cLine2.slice(0, 20), x + 22, y + 233);
    }

    const cardRef = slide.cards[idx % Math.max(1, slide.cards.length)];
    const subDetail =
      cardRef?.bullets?.[0]?.slice(0, 32) ||
      cardRef?.heading?.slice(0, 30) ||
      slide.sectionTag;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 15px "Google Sans", Inter, sans-serif';
    ctx.fillText(`• ${subDetail}`, x + 22, y + 278);

    if (cardRef?.metric) {
      ctx.fillStyle = halftone;
      ctx.font = '700 20px "PT Mono", monospace, sans-serif';
      ctx.fillText(cardRef.metric.slice(0, 18), x + 22, y + 314);
    }

    if (idx < nodeCount - 1) {
      const arrowX = x + boxWidth + 4;
      const arrowY = y + boxHeight / 2;
      ctx.strokeStyle = '#FFD427';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + gapX - 8, arrowY);
      ctx.stroke();

      ctx.fillStyle = '#FFD427';
      ctx.beginPath();
      ctx.moveTo(arrowX + gapX - 4, arrowY);
      ctx.lineTo(arrowX + gapX - 14, arrowY - 7);
      ctx.lineTo(arrowX + gapX - 14, arrowY + 7);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.fillStyle = 'rgba(9, 19, 31, 0.94)';
  ctx.strokeStyle = primaryAccent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(48, 576, 1184, 96, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = halftoneAccent;
  ctx.font = '700 15px "PT Mono", monospace, sans-serif';
  ctx.fillText('NANO BANANA 2.1 PROMPT SPECIFICATION // 16:9 OPENXML ASSET', 72, 608);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '600 18px "Google Sans", Inter, sans-serif';
  ctx.fillText(promptText.slice(0, 102), 72, 642);

  return canvas.toDataURL('image/png');
}

export function synthesizeLyriaAmbientWavDataUrl(prompt: string, durationSec = 6): string {
  const sampleRate = 22050;
  const numSamples = sampleRate * Math.max(2, Math.min(12, durationSec));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset + i, s.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  const baseFreqs = [220, 246.94, 261.63, 293.66, 329.63];
  const root = baseFreqs[hash % baseFreqs.length];
  const fifth = root * 1.4983;
  const majorThird = root * 1.2599;
  const octave = root * 2;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env =
      t < 0.4
        ? t / 0.4
        : t > durationSec - 0.6
          ? Math.max(0, (durationSec - t) / 0.6)
          : 1.0;
    const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 1.8 * t);
    const wave =
      0.38 * Math.sin(2 * Math.PI * root * t) +
      0.26 * Math.sin(2 * Math.PI * majorThird * t) +
      0.22 * Math.sin(2 * Math.PI * fifth * t) +
      0.14 * Math.sin(2 * Math.PI * octave * t);
    const sample = Math.max(-1, Math.min(1, wave * env * lfo * 0.45));
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function renderSlideToDataUrl(
  slide: SlideSpec,
  brand: BrandThemeSpec,
  slideNumber: number,
  totalSlides: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isDarkCanvas =
    brand.templateStyle === 'gde-2026-navy' ||
    brand.templateStyle === 'build-with-ai-terminal';
  ctx.fillStyle = isDarkCanvas ? brand.darkBgHex : brand.lightBgHex;
  ctx.fillRect(0, 0, 1920, 1080);

  ctx.fillStyle = isDarkCanvas ? brand.headlineAccentHex || '#FF7DAF' : brand.darkBgHex || '#0F172A';
  ctx.font = `700 46px "${brand.headingFont}", sans-serif`;
  ctx.fillText(slide.title.slice(0, 68), 84, 132);

  ctx.fillStyle = isDarkCanvas ? '#CBD5E1' : '#5A6B7C';
  ctx.font = `500 25px "${brand.bodyFont}", sans-serif`;
  ctx.fillText(slide.subtitle.slice(0, 96), 84, 176);

  ctx.fillStyle = isDarkCanvas ? '#94A3B8' : '#64748B';
  ctx.font = `500 18px "${brand.bodyFont}", sans-serif`;
  ctx.fillText(brand.footerSignature, 84, 1036);
  ctx.fillText(`Slide ${slideNumber} of ${totalSlides}`, 1720, 1036);

  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// IMAGE RASTERIZER HELPER SO RELATIVE & UPLOADED IMAGES EMBED INTO .PPTX
// ---------------------------------------------------------------------------

async function convertAnyImageUrlToPngDataUrl(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith('data:image/png;base64,')) return url;
  if (typeof document === 'undefined' || typeof Image === 'undefined') return undefined;

  return new Promise<string | undefined>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = Math.max(1, Math.min(1920, img.naturalWidth || 1280));
        const h = Math.max(1, Math.min(1080, img.naturalHeight || 720));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(undefined);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

export async function prepareDeckForOpenXmlExport(
  deck: PresentationDeckSpec
): Promise<PresentationDeckSpec> {
  const clonedSlides: SlideSpec[] = [];
  for (const slide of deck.slides) {
    const copy: SlideSpec = {
      ...slide,
      cards: slide.cards.map((c) => ({ ...c, bullets: [...c.bullets] })),
    };
    if (copy.visualDataUrl) {
      const pngUrl = await convertAnyImageUrlToPngDataUrl(copy.visualDataUrl);
      if (pngUrl) {
        copy.visualDataUrl = pngUrl;
      }
    }
    clonedSlides.push(copy);
  }
  return {
    ...deck,
    brand: { ...deck.brand },
    slides: clonedSlides,
  };
}

// ---------------------------------------------------------------------------
// ECMA-376 OPENXML (.PPTX) NATIVE MULTI-TEMPLATE 16:9 COMPILER
// ---------------------------------------------------------------------------

function dataUrlToUint8Array(dataUrl: string): Uint8Array | null {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return null;
  try {
    const base64 = dataUrl.slice(commaIdx + 1);
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function hexNoHash(hex: string, fallback = '1A73E8'): string {
  const cleaned = hex.replace('#', '').trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(cleaned) ? cleaned : fallback;
}

function buildOpenXmlRectShape(params: {
  id: number;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
  fillHex: string;
  borderHex?: string;
  borderWidthEmu?: number;
  roundRect?: boolean;
  roundAdj?: number;
  alignCenter?: boolean;
  paragraphs?: Array<{
    text: string;
    fontSizePt: number;
    bold?: boolean;
    colorHex: string;
    fontFace?: string;
    bullet?: boolean;
    align?: 'l' | 'ctr' | 'r';
  }>;
}): string {
  const adjVal = params.roundAdj ?? 3500;
  const geom = params.roundRect
    ? `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${adjVal}"/></a:avLst></a:prstGeom>`
    : `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`;

  const lnW = params.borderWidthEmu ?? 19050;
  const lnXml = params.borderHex
    ? `<a:ln w="${lnW}"><a:solidFill><a:srgbClr val="${hexNoHash(params.borderHex)}"/></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;

  const parasXml = (params.paragraphs || [{ text: '', fontSizePt: 12, colorHex: '0F172A' }])
    .map((p) => {
      const sz = Math.round(p.fontSizePt * 100);
      const bAttr = p.bold ? ' b="1"' : '';
      const bulletXml = p.bullet ? `<a:buChar char="•"/>` : `<a:buNone/>`;
      const font = escapeXml(p.fontFace || 'Google Sans');
      const algn = p.align || (params.alignCenter ? 'ctr' : 'l');
      return `<a:p>
        <a:pPr algn="${algn}" marL="${p.bullet ? 182880 : 0}" indent="${p.bullet ? -137160 : 0}">
          ${bulletXml}
        </a:pPr>
        <a:r>
          <a:rPr lang="en-US" sz="${sz}"${bAttr} dirty="0">
            <a:solidFill><a:srgbClr val="${hexNoHash(p.colorHex)}"/></a:solidFill>
            <a:latin typeface="${font}"/>
          </a:rPr>
          <a:t>${escapeXml(p.text)}</a:t>
        </a:r>
      </a:p>`;
    })
    .join('');

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${params.id}" name="${escapeXml(params.name)}"/>
      <p:cNvSpPr/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm>
        <a:off x="${Math.round(params.x)}" y="${Math.round(params.y)}"/>
        <a:ext cx="${Math.round(params.cx)}" cy="${Math.round(params.cy)}"/>
      </a:xfrm>
      ${geom}
      <a:solidFill><a:srgbClr val="${hexNoHash(params.fillHex)}"/></a:solidFill>
      ${lnXml}
    </p:spPr>
    <p:txBody>
      <a:bodyPr wrap="square" lIns="160000" tIns="130000" rIns="160000" bIns="130000" anchor="${params.alignCenter ? 'ctr' : 't'}"/>
      <a:lstStyle/>
      ${parasXml}
    </p:txBody>
  </p:sp>`;
}

function buildOpenXmlPictureShape(params: {
  id: number;
  rId: string;
  name: string;
  x: number;
  y: number;
  cx: number;
  cy: number;
}): string {
  return `<p:pic>
    <p:nvPicPr>
      <p:cNvPr id="${params.id}" name="${escapeXml(params.name)}"/>
      <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
      <p:nvPr/>
    </p:nvPicPr>
    <p:blipFill>
      <a:blip r:embed="${params.rId}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </p:blipFill>
    <p:spPr>
      <a:xfrm>
        <a:off x="${Math.round(params.x)}" y="${Math.round(params.y)}"/>
        <a:ext cx="${Math.round(params.cx)}" cy="${Math.round(params.cy)}"/>
      </a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </p:spPr>
  </p:pic>`;
}

export function compileOpenXmlPptx(deck: PresentationDeckSpec): Uint8Array {
  const encoder = new TextEncoder();
  const entries: ZipFileEntry[] = [];
  const addXml = (path: string, xml: string) => {
    entries.push({ path, data: encoder.encode(xml.trim()) });
  };

  const brand = deck.brand;
  const style: BrandTemplateStyle = brand.templateStyle || 'gde-2026-navy';

  const slideOverrides = deck.slides
    .map(
      (_, i) =>
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    )
    .join('\n');

  addXml(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.theme+xml"/>
  ${slideOverrides}
</Types>`
  );

  addXml(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const sldIdLst = deck.slides
    .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 6}"/>`)
    .join('\n');

  addXml(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  saveSubsetFonts="1" autoCompressPictures="0">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle>
    <a:defPPr><a:defRPr lang="en-US"/></a:defPPr>
    <a:lvl1pPr marL="0" algn="l" defTabSz="457200" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
      <a:defRPr sz="1800" kern="1200">
        <a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
        <a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/>
      </a:defRPr>
    </a:lvl1pPr>
  </p:defaultTextStyle>
</p:presentation>`
  );

  const presRels = deck.slides
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 6}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    )
    .join('\n');

  addXml(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>
  ${presRels}
</Relationships>`
  );

  addXml(
    'ppt/presProps.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentationPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`
  );

  addXml(
    'ppt/viewProps.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" lastView="sldThumbnailView">
  <p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr>
  <p:slideViewPr><p:cSldViewPr snapToGrid="0" snapToObjects="1"><p:cViewPr varScale="1"><p:scale><a:sx n="100" d="100"/><a:sy n="100" d="100"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:cSldViewPr></p:slideViewPr>
  <p:notesTextViewPr><p:cViewPr><p:scale><a:sx n="100" d="100"/><a:sy n="100" d="100"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:notesTextViewPr>
  <p:gridSpacing cx="76200" cy="76200"/>
</p:viewPr>`
  );

  addXml(
    'ppt/tableStyles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`
  );

  addXml(
    'ppt/slideMasters/slideMaster1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle>
    <p:bodyStyle><a:lvl1pPr marL="342900" indent="-342900" algn="l"><a:defRPr sz="2800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr></p:bodyStyle>
    <p:otherStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:otherStyle>
  </p:txStyles>
</p:sldMaster>`
  );

  addXml(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
  );

  addXml(
    'ppt/slideLayouts/slideLayout1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`
  );

  addXml(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
  );

  addXml(
    'ppt/theme/theme1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${escapeXml(brand.name)}">
  <a:themeElements>
    <a:clrScheme name="${escapeXml(brand.name)}">
      <a:dk1><a:srgbClr val="${hexNoHash(brand.darkBgHex, '0F172A')}"/></a:dk1>
      <a:lt1><a:srgbClr val="${hexNoHash(brand.lightBgHex, 'F8FAFC')}"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="FFFFFF"/></a:lt2>
      <a:accent1><a:srgbClr val="${hexNoHash(brand.primaryHex, '1A73E8')}"/></a:accent1>
      <a:accent2><a:srgbClr val="${hexNoHash(brand.secondaryHex, 'D93025')}"/></a:accent2>
      <a:accent3><a:srgbClr val="${hexNoHash(brand.accentHex, '1E8E3E')}"/></a:accent3>
      <a:accent4><a:srgbClr val="${hexNoHash(brand.warningHex, 'F29900')}"/></a:accent4>
      <a:accent5><a:srgbClr val="4285F4"/></a:accent5>
      <a:accent6><a:srgbClr val="34A853"/></a:accent6>
      <a:hlink><a:srgbClr val="${hexNoHash(brand.primaryHex, '1A73E8')}"/></a:hlink>
      <a:folHlink><a:srgbClr val="${hexNoHash(brand.secondaryHex, 'D93025')}"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="GDEFonts">
      <a:majorFont><a:latin typeface="${escapeXml(brand.headingFont)}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="${escapeXml(brand.bodyFont)}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="GDEFormat">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
        <a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
        <a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/>
  <a:extraClrSchemeLst/>
</a:theme>`
  );

  // 5. Build each slide with bespoke template-specific OpenXML geometry
  deck.slides.forEach((slide, idx) => {
    const slideNum = idx + 1;
    let shapeId = 2;
    const shapes: string[] = [];

    let imageRelXml = '';
    if (slide.visualDataUrl && slide.visualDataUrl.startsWith('data:image/')) {
      const imgBytes = dataUrlToUint8Array(slide.visualDataUrl);
      if (imgBytes) {
        const mediaFileName = `slide_img_${slideNum}.png`;
        entries.push({ path: `ppt/media/${mediaFileName}`, data: imgBytes });
        imageRelXml = `<Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaFileName}"/>`;
      }
    }

    if (style === 'gde-2026-navy') {
      // ---------------------------------------------------------------------
      // TEMPLATE 1: 2026 GDE BRAND GUIDE · NAVY EDITORIAL SPLIT (SLIDE 1 & 19)
      // ---------------------------------------------------------------------
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'NavyBackground',
          x: 0,
          y: 0,
          cx: 12192000,
          cy: 6858000,
          fillHex: '#20344B',
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'GdeTopMotifBar',
          x: 640000,
          y: 220000,
          cx: 10912000,
          cy: 300000,
          fillHex: '#20344B',
          paragraphs: [
            {
              text: `< > Google Developer Experts   //   { ${slide.sectionTag.toUpperCase()} }                { # }   //   O O O`,
              fontSizePt: 11,
              bold: true,
              colorHex: '#57CAFF',
              fontFace: 'PT Mono',
            },
          ],
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'HalftonePinkHeadline',
          x: 640000,
          y: 620000,
          cx: 10912000,
          cy: 1150000,
          fillHex: '#20344B',
          paragraphs: [
            {
              text: slide.title,
              fontSizePt: 29,
              bold: true,
              colorHex: '#FF7DAF',
              fontFace: brand.headingFont,
            },
            {
              text: slide.subtitle,
              fontSizePt: 13.5,
              bold: false,
              colorHex: '#CBD5E1',
              fontFace: brand.bodyFont,
            },
          ],
        })
      );

      const leftW = imageRelXml ? 5450000 : 10912000;
      const accentColors = ['#57CAFF', '#5CDB6D', '#FFD427'];
      slide.cards.slice(0, 3).forEach((card, cIdx) => {
        const blockY = 1920000 + cIdx * 1420000;
        const barClr = accentColors[cIdx % accentColors.length];
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `EditorialAccentBar_${cIdx + 1}`,
            x: 640000,
            y: blockY + 40000,
            cx: 45000,
            cy: 1150000,
            fillHex: barClr,
          })
        );
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `EditorialCopyBlock_${cIdx + 1}`,
            x: 740000,
            y: blockY,
            cx: leftW - 100000,
            cy: 1280000,
            fillHex: '#20344B',
            paragraphs: [
              {
                text: `${card.heading}${card.metric ? `  (${card.metric})` : ''}`,
                fontSizePt: 14.5,
                bold: true,
                colorHex: barClr,
                fontFace: 'PT Mono',
              },
              ...card.bullets.map((b) => ({
                text: b,
                fontSizePt: 12.5,
                bold: false,
                colorHex: '#FFFFFF',
                fontFace: brand.bodyFont,
              })),
            ],
          })
        );
      });

      if (imageRelXml) {
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'VisualFrameBg',
            x: 6350000,
            y: 1920000,
            cx: 5202000,
            cy: 4180000,
            fillHex: '#162536',
            borderHex: '#57CAFF',
            roundRect: true,
          })
        );
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: 'rIdImg1',
            name: 'SlideGraphic',
            x: 6450000,
            y: 2020000,
            cx: 5002000,
            cy: 3980000,
          })
        );
      }

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'SlideFooter',
          x: 640000,
          y: 6320000,
          cx: 10912000,
          cy: 360000,
          fillHex: '#20344B',
          paragraphs: [
            {
              text: `${brand.footerSignature}   |   ${deck.presenterName}   |   Slide ${slideNum} of ${deck.slides.length}`,
              fontSizePt: 9.5,
              colorHex: '#94A3B8',
              fontFace: 'PT Mono',
            },
          ],
        })
      );
    } else if (style === 'gde-2026-light-pills') {
      // ---------------------------------------------------------------------
      // TEMPLATE 2: 2026 GDE BRAND GUIDE · SLIDE 23 OVERLAPPING STAT PILLS
      // ---------------------------------------------------------------------
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'LightSlide23Background',
          x: 0,
          y: 0,
          cx: 12192000,
          cy: 6858000,
          fillHex: '#FFFFFF',
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'GdeLightHeader',
          x: 640000,
          y: 220000,
          cx: 10912000,
          cy: 280000,
          fillHex: '#FFFFFF',
          paragraphs: [
            {
              text: `< > Google Developer Experts   //   { ${slide.sectionTag.toUpperCase()} }`,
              fontSizePt: 10.5,
              bold: true,
              colorHex: '#20344B',
              fontFace: 'PT Mono',
            },
          ],
        })
      );

      const copyParagraphs = slide.cards.flatMap((c) =>
        c.bullets.slice(0, 1).map((b) => ({
          text: `${c.heading}: ${b}`,
          fontSizePt: 13.5,
          bold: false,
          colorHex: '#20344B',
          fontFace: brand.bodyFont,
        }))
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'LeftEditorialColumn',
          x: 640000,
          y: 680000,
          cx: 4550000,
          cy: 4300000,
          fillHex: '#FFFFFF',
          paragraphs: [
            {
              text: slide.title,
              fontSizePt: 28,
              bold: true,
              colorHex: '#20344B',
              fontFace: brand.headingFont,
            },
            {
              text: slide.subtitle,
              fontSizePt: 13,
              bold: true,
              colorHex: '#4285F4',
              fontFace: brand.bodyFont,
            },
            ...copyParagraphs,
          ],
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'Slide23DirectionalArrow',
          x: 640000,
          y: 5150000,
          cx: 2400000,
          cy: 750000,
          fillHex: '#FFFFFF',
          paragraphs: [
            {
              text: '──────►',
              fontSizePt: 34,
              bold: true,
              colorHex: '#20344B',
              fontFace: 'Google Sans',
            },
          ],
        })
      );

      const card0 = slide.cards[0] || { heading: 'Primary Metric', metric: '14%', bullets: [] };
      const card1 = slide.cards[1] || { heading: 'Secondary Metric', metric: '86%', bullets: [] };

      // Top-Right Halftone Green Stat Pill (#5CDB6D with #20344B border)
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'HalftoneGreenStatPill',
          x: 6550000,
          y: 780000,
          cx: 5000000,
          cy: 2650000,
          fillHex: '#5CDB6D',
          borderHex: '#20344B',
          borderWidthEmu: 28575,
          roundRect: true,
          roundAdj: 16000,
          alignCenter: true,
          paragraphs: [
            {
              text: card0.metric || '14%',
              fontSizePt: 56,
              bold: true,
              colorHex: '#20344B',
              fontFace: brand.headingFont,
              align: 'ctr',
            },
            {
              text: card0.heading,
              fontSizePt: 14,
              bold: true,
              colorHex: '#20344B',
              fontFace: 'PT Mono',
              align: 'ctr',
            },
            {
              text: (card0.bullets[0] || '').slice(0, 68),
              fontSizePt: 11.5,
              bold: false,
              colorHex: '#20344B',
              fontFace: 'PT Mono',
              align: 'ctr',
            },
          ],
        })
      );

      // Overlapping Bottom-Left Grounding Navy Stat Pill (#20344B with #5CDB6D text)
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'GroundingNavyStatPill',
          x: 5400000,
          y: 3260000,
          cx: 5000000,
          cy: 2650000,
          fillHex: '#20344B',
          borderHex: '#20344B',
          borderWidthEmu: 28575,
          roundRect: true,
          roundAdj: 16000,
          alignCenter: true,
          paragraphs: [
            {
              text: card1.metric || '86%',
              fontSizePt: 56,
              bold: true,
              colorHex: '#5CDB6D',
              fontFace: brand.headingFont,
              align: 'ctr',
            },
            {
              text: card1.heading,
              fontSizePt: 14,
              bold: true,
              colorHex: '#5CDB6D',
              fontFace: 'PT Mono',
              align: 'ctr',
            },
            {
              text: (card1.bullets[0] || '').slice(0, 68),
              fontSizePt: 11.5,
              bold: false,
              colorHex: '#5CDB6D',
              fontFace: 'PT Mono',
              align: 'ctr',
            },
          ],
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'SlideFooter',
          x: 640000,
          y: 6320000,
          cx: 10912000,
          cy: 360000,
          fillHex: '#FFFFFF',
          paragraphs: [
            {
              text: `${brand.footerSignature}   |   ${deck.presenterName}   |   Slide ${slideNum} of ${deck.slides.length}`,
              fontSizePt: 9.5,
              colorHex: '#64748B',
              fontFace: 'PT Mono',
            },
          ],
        })
      );
    } else if (style === 'devfest-split') {
      // ---------------------------------------------------------------------
      // TEMPLATE 4: GDG DEVFEST 2026 ASYMMETRIC KEYNOTE SPLIT STAGE
      // ---------------------------------------------------------------------
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'RightLightCanvas',
          x: 0,
          y: 0,
          cx: 12192000,
          cy: 6858000,
          fillHex: '#F9FAFB',
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'LeftDarkKeynoteSidebar',
          x: 0,
          y: 0,
          cx: 4550000,
          cy: 6858000,
          fillHex: '#111827',
          paragraphs: [
            {
              text: slide.sectionTag.toUpperCase(),
              fontSizePt: 11,
              bold: true,
              colorHex: '#FBBC04',
              fontFace: 'PT Mono',
            },
            {
              text: slide.title,
              fontSizePt: 26,
              bold: true,
              colorHex: '#FFFFFF',
              fontFace: brand.headingFont,
            },
            {
              text: slide.subtitle,
              fontSizePt: 13,
              bold: false,
              colorHex: '#9CA3AF',
              fontFace: brand.bodyFont,
            },
          ],
        })
      );

      const gColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
      const segW = Math.floor(4550000 / 4);
      for (let i = 0; i < 4; i++) {
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `GoogleBar_${i + 1}`,
            x: i * segW,
            y: 0,
            cx: segW,
            cy: 95000,
            fillHex: gColors[i],
          })
        );
      }

      if (imageRelXml) {
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: 'rIdImg1',
            name: 'DevFestVisual',
            x: 4950000,
            y: 420000,
            cx: 6750000,
            cy: 2950000,
          })
        );
      }

      const startY = imageRelXml ? 3580000 : 620000;
      const rowH = imageRelXml ? 880000 : 1720000;
      const rowGap = imageRelXml ? 110000 : 220000;

      slide.cards.slice(0, 3).forEach((card, cIdx) => {
        const yPos = startY + cIdx * (rowH + rowGap);
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `DevFestAgendaRow_${cIdx + 1}`,
            x: 4950000,
            y: yPos,
            cx: 6750000,
            cy: rowH,
            fillHex: '#FFFFFF',
            borderHex: gColors[cIdx % 4],
            roundRect: true,
            paragraphs: [
              {
                text: `0${cIdx + 1} // ${card.heading}${card.metric ? ` (${card.metric})` : ''}`,
                fontSizePt: 14,
                bold: true,
                colorHex: '#111827',
                fontFace: brand.headingFont,
              },
              {
                text: card.bullets[0] || '',
                fontSizePt: 11.5,
                colorHex: '#4B5563',
                fontFace: brand.bodyFont,
              },
            ],
          })
        );
      });
    } else if (style === 'build-with-ai-terminal') {
      // ---------------------------------------------------------------------
      // TEMPLATE 5: BUILD WITH AI ROADSHOW · DARK DEVELOPER TERMINAL & SDK
      // ---------------------------------------------------------------------
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'ObsidianBackground',
          x: 0,
          y: 0,
          cx: 12192000,
          cy: 6858000,
          fillHex: '#090D16',
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'BuildWithAiHeader',
          x: 580000,
          y: 320000,
          cx: 11032000,
          cy: 1100000,
          fillHex: '#090D16',
          paragraphs: [
            {
              text: `BUILD WITH AI 2026 // ${slide.sectionTag.toUpperCase()}`,
              fontSizePt: 10.5,
              bold: true,
              colorHex: '#3B82F6',
              fontFace: 'PT Mono',
            },
            {
              text: slide.title,
              fontSizePt: 26,
              bold: true,
              colorHex: '#F8FAFC',
              fontFace: brand.headingFont,
            },
            {
              text: slide.subtitle,
              fontSizePt: 13,
              colorHex: '#94A3B8',
              fontFace: brand.bodyFont,
            },
          ],
        })
      );

      slide.cards.slice(0, 3).forEach((card, cIdx) => {
        const rowY = 1580000 + cIdx * 1500000;
        const borderClr = cIdx === 0 ? '#3B82F6' : cIdx === 1 ? '#A855F7' : '#10B981';
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `DevFeatureRow_${cIdx + 1}`,
            x: 580000,
            y: rowY,
            cx: 5100000,
            cy: 1340000,
            fillHex: '#111827',
            borderHex: borderClr,
            roundRect: true,
            paragraphs: [
              {
                text: `${card.heading}${card.metric ? `  [${card.metric}]` : ''}`,
                fontSizePt: 14,
                bold: true,
                colorHex: '#F8FAFC',
                fontFace: brand.headingFont,
              },
              ...card.bullets.slice(0, 2).map((b) => ({
                text: b,
                fontSizePt: 11,
                colorHex: '#CBD5E1',
                fontFace: brand.bodyFont,
                bullet: true,
              })),
            ],
          })
        );
      });

      // Right-hand Terminal / Visual Window
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'TerminalWindowFrame',
          x: 5950000,
          y: 1580000,
          cx: 5662000,
          cy: 4340000,
          fillHex: '#0F172A',
          borderHex: '#3B82F6',
          roundRect: true,
          paragraphs: imageRelXml
            ? []
            : [
                {
                  text: '● ● ●   gemini-4-argon // antigravity-sdk',
                  fontSizePt: 10,
                  bold: true,
                  colorHex: '#60A5FA',
                  fontFace: 'PT Mono',
                },
                {
                  text:
                    slide.codeSnippet ||
                    `from google.antigravity import Agent\n\nagent = Agent(\n  model="${GEMINI_HEAVY_MODEL}",\n  thinking_level="HIGH",\n)\nresponse = agent.run("${slide.title}")`,
                  fontSizePt: 12,
                  colorHex: '#E2E8F0',
                  fontFace: 'PT Mono',
                },
              ],
        })
      );

      if (imageRelXml) {
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: 'rIdImg1',
            name: 'TerminalVisual',
            x: 6080000,
            y: 1700000,
            cx: 5402000,
            cy: 4100000,
          })
        );
      }
    } else {
      // ---------------------------------------------------------------------
      // TEMPLATE 3 & UPLOADED CUSTOM: HORIZONTAL BLUEPRINT ROWS + VISUAL
      // ---------------------------------------------------------------------
      const bgHex = brand.lightBgHex || '#F8FAFD';
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'BlueprintBackground',
          x: 0,
          y: 0,
          cx: 12192000,
          cy: 6858000,
          fillHex: bgHex,
        })
      );

      // Left vertical accent rail
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'LeftVerticalAccentRail',
          x: 0,
          y: 0,
          cx: 180000,
          cy: 6858000,
          fillHex: brand.primaryHex || '#0B57D0',
        })
      );

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'BlueprintHeader',
          x: 580000,
          y: 280000,
          cx: 11032000,
          cy: 1080000,
          fillHex: bgHex,
          paragraphs: [
            {
              text: slide.sectionTag.toUpperCase(),
              fontSizePt: 10.5,
              bold: true,
              colorHex: brand.primaryHex || '#0B57D0',
              fontFace: 'PT Mono',
            },
            {
              text: slide.title,
              fontSizePt: 26,
              bold: true,
              colorHex: brand.darkBgHex || '#0B1220',
              fontFace: brand.headingFont,
            },
            {
              text: slide.subtitle,
              fontSizePt: 13,
              colorHex: '#475569',
              fontFace: brand.bodyFont,
            },
          ],
        })
      );

      const rowWidth = imageRelXml ? 5450000 : 11032000;
      const rowAccents = [brand.primaryHex, brand.secondaryHex, brand.accentHex];
      slide.cards.slice(0, 3).forEach((card, cIdx) => {
        const rowY = 1520000 + cIdx * 1500000;
        const accentClr =
          brand.cardTitleColors?.[cIdx % (brand.cardTitleColors.length || 1)] ||
          rowAccents[cIdx % rowAccents.length] ||
          '#0B57D0';
        const rowFill =
          brand.cardBgTints?.[cIdx % (brand.cardBgTints.length || 1)] || '#FFFFFF';

        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: `HorizontalStageRow_${cIdx + 1}`,
            x: 580000,
            y: rowY,
            cx: rowWidth,
            cy: 1340000,
            fillHex: rowFill,
            borderHex: '#CBD5E1',
            roundRect: true,
            paragraphs: [
              {
                text: `${card.heading}${card.metric ? `   ·   ${card.metric}` : ''}`,
                fontSizePt: 14.5,
                bold: true,
                colorHex: accentClr,
                fontFace: brand.headingFont,
              },
              ...card.bullets.slice(0, 2).map((b) => ({
                text: b,
                fontSizePt: 11.5,
                colorHex: '#1E293B',
                fontFace: brand.bodyFont,
                bullet: true,
              })),
            ],
          })
        );
      });

      if (imageRelXml) {
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: 'rIdImg1',
            name: 'BlueprintDiagram',
            x: 6280000,
            y: 1520000,
            cx: 5332000,
            cy: 4340000,
          })
        );
      }

      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'SlideFooter',
          x: 580000,
          y: 6320000,
          cx: 11032000,
          cy: 360000,
          fillHex: bgHex,
          paragraphs: [
            {
              text: `${brand.footerSignature}   |   ${deck.presenterName}   |   Slide ${slideNum} of ${deck.slides.length}`,
              fontSizePt: 9.5,
              colorHex: '#64748B',
              fontFace: brand.bodyFont,
            },
          ],
        })
      );
    }

    const transitionXml = slide.autoAdvanceSec
      ? `<p:transition spd="med" advClick="1" advTm="${Math.round(slide.autoAdvanceSec * 1000)}"/>`
      : '';

    addXml(
      `ppt/slides/slide${slideNum}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${shapes.join('\n')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
  ${transitionXml}
</p:sld>`
    );

    addXml(
      `ppt/slides/_rels/slide${slideNum}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  ${imageRelXml}
</Relationships>`
    );
  });

  return buildZipArchive(entries);
}

// ---------------------------------------------------------------------------
// STANDALONE PYTHON-PPTX + LXML BUILDER SCRIPT GENERATOR
// ---------------------------------------------------------------------------

export function generatePythonPptxScript(deck: PresentationDeckSpec): string {
  const brand = deck.brand;
  const slidesJson = JSON.stringify(deck.slides, null, 2);

  return `#!/usr/bin/env python3
"""
Autonomous 16:9 OpenXML (.pptx) Presentation Builder
Generated by GDE Stage // GDE Deck Studio
Active Template: ${brand.name} (${brand.templateStyle})
"""

import os
import json
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

GEMINI_HEAVY_MODEL = os.environ.get("GEMINI_HEAVY_MODEL", "${GEMINI_HEAVY_MODEL}")
GEMINI_FAST_MODEL = os.environ.get("GEMINI_FAST_MODEL", "${GEMINI_FAST_MODEL}")
GEMINI_IMAGE_MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "${GEMINI_IMAGE_MODEL}")
GEMINI_VIDEO_MODEL = os.environ.get("GEMINI_VIDEO_MODEL", "${GEMINI_VIDEO_MODEL}")
GEMINI_MUSIC_MODEL = os.environ.get("GEMINI_MUSIC_MODEL", "${GEMINI_MUSIC_MODEL}")

SLIDES_SPEC = json.loads(r'''${slidesJson}''')

def hex_to_rgb(h: str) -> RGBColor:
    c = h.lstrip("#")
    return RGBColor(int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))

def build_deck(output_path: str = "gde_stage_16x9_deck.pptx") -> None:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    for idx, s in enumerate(SLIDES_SPEC, start=1):
        slide = prs.slides.add_slide(blank)
        notes = slide.notes_slide.notes_text_frame
        notes.text = s.get("speakerNotes", "")

    prs.save(output_path)
    print(f"Saved {output_path}")

if __name__ == "__main__":
    build_deck()
`;
}
