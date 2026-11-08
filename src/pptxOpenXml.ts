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
  extraVisualDataUrls?: string[];
  isVisualOnlySlide?: boolean;
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
  sourceSlideNumber?: number;
  mergedFromSlideNumbers?: number[];
  visualNeedsLightSurface?: boolean;
  isVisualDominant?: boolean;
}

export type BrandTemplateStyle =
  | 'keep-original'
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
  sourceZipEntries?: ZipFileEntry[];
}

export interface ParsedPptxResult {
  fileName: string;
  extractedSlides: Array<{
    slideNumber: number;
    title: string;
    subtitle?: string;
    bullets: string[];
    speakerNotes: string;
    imageDataUrl?: string;
    extraImageDataUrls?: string[];
    isVisualOnly?: boolean;
    visualNeedsLightSurface?: boolean;
    isVisualDominant?: boolean;
  }>;
  extractedTheme: Partial<BrandThemeSpec>;
  markdownSummary: string;
  rawZipEntries?: ZipFileEntry[];
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

const FIXED_LITERAL_LENGTHS = (() => {
  const lengths = new Uint8Array(288);
  for (let i = 0; i <= 143; i++) lengths[i] = 8;
  for (let i = 144; i <= 255; i++) lengths[i] = 9;
  for (let i = 256; i <= 279; i++) lengths[i] = 7;
  for (let i = 280; i <= 287; i++) lengths[i] = 8;
  return lengths;
})();

const FIXED_DISTANCE_LENGTHS = (() => {
  const lengths = new Uint8Array(32);
  lengths.fill(5);
  return lengths;
})();

const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258,
];
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
];
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
];
const CLEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

interface HuffmanTable {
  counts: Uint16Array;
  symbols: Uint16Array;
}

function buildHuffmanTable(lengths: Uint8Array, numSymbols: number): HuffmanTable {
  const counts = new Uint16Array(16);
  for (let i = 0; i < numSymbols; i++) {
    const len = lengths[i];
    if (len > 0 && len < 16) counts[len]++;
  }
  const offsets = new Uint16Array(16);
  let sum = 0;
  for (let bits = 1; bits <= 15; bits++) {
    offsets[bits] = sum;
    sum += counts[bits];
  }
  const symbols = new Uint16Array(numSymbols);
  for (let i = 0; i < numSymbols; i++) {
    const len = lengths[i];
    if (len > 0 && len < 16) {
      symbols[offsets[len]++] = i;
    }
  }
  return { counts, symbols };
}

const FIXED_LIT_TABLE = buildHuffmanTable(FIXED_LITERAL_LENGTHS, 288);
const FIXED_DIST_TABLE = buildHuffmanTable(FIXED_DISTANCE_LENGTHS, 32);

export function inflateRawBytes(
  src: Uint8Array,
  expectedSizeHint = 0,
): { data: Uint8Array; bytesRead: number } {
  let bitPos = 0;
  const maxBits = src.length * 8;

  const readBits = (n: number): number => {
    let val = 0;
    for (let i = 0; i < n; i++) {
      if (bitPos >= maxBits) throw new Error('Unexpected EOF in deflate stream');
      const byteIdx = bitPos >>> 3;
      const bitIdx = bitPos & 7;
      val |= ((src[byteIdx] >>> bitIdx) & 1) << i;
      bitPos++;
    }
    return val;
  };

  const decodeSymbol = (table: HuffmanTable): number => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len++) {
      if (bitPos >= maxBits) throw new Error('Unexpected EOF in Huffman symbol');
      const byteIdx = bitPos >>> 3;
      const bitIdx = bitPos & 7;
      code |= (src[byteIdx] >>> bitIdx) & 1;
      bitPos++;
      const count = table.counts[len];
      if (code - count < first) {
        return table.symbols[index + (code - first)];
      }
      index += count;
      first += count;
      first <<= 1;
      code <<= 1;
    }
    throw new Error('Invalid Huffman code');
  };

  let out = new Uint8Array(Math.max(4096, Math.min(expectedSizeHint || 16384, 32 * 1024 * 1024)));
  let outPos = 0;
  const ensureCapacity = (extra: number) => {
    if (outPos + extra <= out.length) return;
    let nextLen = out.length * 2;
    while (nextLen < outPos + extra) nextLen *= 2;
    const next = new Uint8Array(nextLen);
    next.set(out.subarray(0, outPos));
    out = next;
  };

  let isFinal = 0;
  while (!isFinal) {
    isFinal = readBits(1);
    const btype = readBits(2);
    if (btype === 0) {
      bitPos = (bitPos + 7) & ~7;
      const byteIdx = bitPos >>> 3;
      if (byteIdx + 4 > src.length) throw new Error('EOF in stored block header');
      const len = src[byteIdx] | (src[byteIdx + 1] << 8);
      const copyStart = byteIdx + 4;
      if (copyStart + len > src.length) throw new Error('EOF in stored block data');
      ensureCapacity(len);
      out.set(src.subarray(copyStart, copyStart + len), outPos);
      outPos += len;
      bitPos = (copyStart + len) * 8;
    } else if (btype === 1 || btype === 2) {
      let litTable = FIXED_LIT_TABLE;
      let distTable = FIXED_DIST_TABLE;
      if (btype === 2) {
        const hlit = readBits(5) + 257;
        const hdist = readBits(5) + 1;
        const hclen = readBits(4) + 4;
        const clenLengths = new Uint8Array(19);
        for (let i = 0; i < hclen; i++) {
          clenLengths[CLEN_ORDER[i]] = readBits(3);
        }
        const clenTable = buildHuffmanTable(clenLengths, 19);
        const totalCodes = hlit + hdist;
        const codeLengths = new Uint8Array(totalCodes);
        let idx = 0;
        while (idx < totalCodes) {
          const sym = decodeSymbol(clenTable);
          if (sym < 16) {
            codeLengths[idx++] = sym;
          } else if (sym === 16) {
            const prev = idx > 0 ? codeLengths[idx - 1] : 0;
            let rep = readBits(2) + 3;
            while (rep-- > 0 && idx < totalCodes) codeLengths[idx++] = prev;
          } else if (sym === 17) {
            let rep = readBits(3) + 3;
            while (rep-- > 0 && idx < totalCodes) codeLengths[idx++] = 0;
          } else {
            let rep = readBits(7) + 11;
            while (rep-- > 0 && idx < totalCodes) codeLengths[idx++] = 0;
          }
        }
        litTable = buildHuffmanTable(codeLengths.subarray(0, hlit), hlit);
        distTable = buildHuffmanTable(codeLengths.subarray(hlit), hdist);
      }

      while (true) {
        const sym = decodeSymbol(litTable);
        if (sym < 256) {
          ensureCapacity(1);
          out[outPos++] = sym;
        } else if (sym === 256) {
          break;
        } else {
          const lenIdx = sym - 257;
          if (lenIdx < 0 || lenIdx >= LENGTH_BASE.length) {
            throw new Error('Invalid length symbol');
          }
          const copyLen = LENGTH_BASE[lenIdx] + readBits(LENGTH_EXTRA[lenIdx]);
          const distSym = decodeSymbol(distTable);
          if (distSym < 0 || distSym >= DIST_BASE.length) {
            throw new Error('Invalid distance symbol');
          }
          const dist = DIST_BASE[distSym] + readBits(DIST_EXTRA[distSym]);
          if (dist > outPos) throw new Error('Distance out of bounds');
          ensureCapacity(copyLen);
          for (let k = 0; k < copyLen; k++) {
            out[outPos] = out[outPos - dist];
            outPos++;
          }
        }
      }
    } else {
      throw new Error('Invalid deflate block type 3');
    }
  }

  const bytesRead = (bitPos + 7) >>> 3;
  return { data: out.subarray(0, outPos), bytesRead };
}

function readUint64LE(view: DataView, offset: number): number {
  const lo = view.getUint32(offset, true);
  const hi = view.getUint32(offset + 4, true);
  return hi * 0x100000000 + lo;
}

function normalizeZipPath(rawName: string): string {
  return rawName.replace(/\\/g, '/').replace(/^(?:\.\/+|\/+)/, '');
}

export async function readZipEntries(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  const entries = new Map<string, Uint8Array>();

  const decompressDeflateSlice = async (
    rawSlice: Uint8Array,
    uncompressedSizeHint: number,
  ): Promise<Uint8Array | null> => {
    try {
      return inflateRawBytes(rawSlice, uncompressedSizeHint).data;
    } catch {
      if (typeof DecompressionStream !== 'undefined') {
        try {
          const stream = new Blob([rawSlice]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          const decompressedBuffer = await new Response(stream).arrayBuffer();
          return new Uint8Array(decompressedBuffer);
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset >= 0) {
    let totalEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);

    // Check for ZIP64 End of Central Directory Locator (0x07064b50) 20 bytes before EOCD
    if (
      (totalEntries === 0xffff || cdOffset === 0xffffffff) &&
      eocdOffset >= 20 &&
      view.getUint32(eocdOffset - 20, true) === 0x07064b50
    ) {
      const zip64EocdOffset = readUint64LE(view, eocdOffset - 12);
      if (
        zip64EocdOffset >= 0 &&
        zip64EocdOffset + 56 <= bytes.length &&
        view.getUint32(zip64EocdOffset, true) === 0x06064b50
      ) {
        totalEntries = readUint64LE(view, zip64EocdOffset + 32);
        cdOffset = readUint64LE(view, zip64EocdOffset + 48);
      }
    }

    let entryIdx = 0;
    while (
      cdOffset >= 0 &&
      cdOffset + 46 <= bytes.length &&
      view.getUint32(cdOffset, true) === 0x02014b50 &&
      (totalEntries === 0 || entryIdx < totalEntries + 64)
    ) {
      entryIdx++;
      const method = view.getUint16(cdOffset + 10, true);
      let compressedSize = view.getUint32(cdOffset + 20, true);
      let uncompressedSize = view.getUint32(cdOffset + 24, true);
      const nameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      let localHeaderOffset = view.getUint32(cdOffset + 42, true);

      const rawName = decoder.decode(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));
      const fileName = normalizeZipPath(rawName);
      const extraStart = cdOffset + 46 + nameLen;
      const extraEnd = extraStart + extraLen;

      // Parse ZIP64 Extended Information Extra Field (0x0001) if any 32-bit field is 0xFFFFFFFF
      if (
        (uncompressedSize === 0xffffffff ||
          compressedSize === 0xffffffff ||
          localHeaderOffset === 0xffffffff) &&
        extraEnd <= bytes.length
      ) {
        let exCursor = extraStart;
        while (exCursor + 4 <= extraEnd) {
          const headerId = view.getUint16(exCursor, true);
          const dataSize = view.getUint16(exCursor + 2, true);
          let fieldCursor = exCursor + 4;
          const fieldEnd = fieldCursor + dataSize;
          if (headerId === 0x0001 && fieldEnd <= extraEnd) {
            if (uncompressedSize === 0xffffffff && fieldCursor + 8 <= fieldEnd) {
              uncompressedSize = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            if (compressedSize === 0xffffffff && fieldCursor + 8 <= fieldEnd) {
              compressedSize = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            if (localHeaderOffset === 0xffffffff && fieldCursor + 8 <= fieldEnd) {
              localHeaderOffset = readUint64LE(view, fieldCursor);
              fieldCursor += 8;
            }
            break;
          }
          exCursor = fieldEnd;
        }
      }

      cdOffset += 46 + nameLen + extraLen + commentLen;

      if (!fileName || fileName.endsWith('/') || /\.fntdata$/i.test(fileName)) {
        continue;
      }
      if (localHeaderOffset < 0 || localHeaderOffset + 30 > bytes.length) continue;
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      if (dataStart > bytes.length) continue;

      if (method === 0) {
        const sizeToRead =
          uncompressedSize > 0 && uncompressedSize < 0xffffffff
            ? uncompressedSize
            : compressedSize > 0 && compressedSize < 0xffffffff
              ? compressedSize
              : 0;
        const endOffset = Math.min(bytes.length, dataStart + sizeToRead);
        entries.set(fileName, bytes.subarray(dataStart, endOffset));
      } else if (method === 8) {
        const hasKnownCompSize =
          compressedSize > 0 &&
          compressedSize < 0xffffffff &&
          dataStart + compressedSize <= bytes.length;
        const rawSlice = hasKnownCompSize
          ? bytes.subarray(dataStart, dataStart + compressedSize)
          : bytes.subarray(dataStart);
        const decompressed = await decompressDeflateSlice(
          rawSlice,
          uncompressedSize > 0 && uncompressedSize < 0xffffffff ? uncompressedSize : 16384,
        );
        if (decompressed) {
          entries.set(fileName, decompressed);
        }
      }
    }
  }

  // Fallback Local File Header (0x04034b50) scan if Central Directory yielded no slides
  const hasSlidesFromCd = Array.from(entries.keys()).some((k) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(k),
  );
  if (!hasSlidesFromCd) {
    let pos = 0;
    while (pos + 30 <= bytes.length) {
      if (view.getUint32(pos, true) !== 0x04034b50) {
        pos++;
        continue;
      }
      const method = view.getUint16(pos + 8, true);
      const compSize = view.getUint32(pos + 18, true);
      const uncompSize = view.getUint32(pos + 22, true);
      const nameLen = view.getUint16(pos + 26, true);
      const extraLen = view.getUint16(pos + 28, true);
      const dataStart = pos + 30 + nameLen + extraLen;
      if (dataStart > bytes.length) break;

      const fileName = normalizeZipPath(
        decoder.decode(bytes.subarray(pos + 30, pos + 30 + nameLen)),
      );
      if (fileName && !fileName.endsWith('/') && !/\.fntdata$/i.test(fileName)) {
        if (method === 0 && uncompSize > 0 && uncompSize < 0xffffffff) {
          const endPos = Math.min(bytes.length, dataStart + uncompSize);
          entries.set(fileName, bytes.subarray(dataStart, endPos));
          pos = endPos;
          continue;
        } else if (method === 8) {
          try {
            const inflated = inflateRawBytes(
              bytes.subarray(dataStart),
              uncompSize > 0 && uncompSize < 0xffffffff ? uncompSize : 16384,
            );
            entries.set(fileName, inflated.data);
            pos = dataStart + Math.max(1, inflated.bytesRead);
            continue;
          } catch {
            // Advance if entry could not be inflated
          }
        }
      }
      pos =
        compSize > 0 && compSize < 0xffffffff && dataStart + compSize <= bytes.length
          ? dataStart + compSize
          : dataStart + 1;
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// PPTX SOURCE & BRANDING TEMPLATE PARSER (ppt/theme/theme1.xml & slides)
// ---------------------------------------------------------------------------

function extractXmlTagText(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(decodeXmlEntities(match[1]));
  }
  return matches;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractCleanParagraphsFromXmlBlock(blockXml: string): string[] {
  const normalizedXml = blockXml
    .replace(/<a:br(?:\s[^>]*)?>[\s\S]*?<\/a:br>|<a:br(?:\s[^>]*)?\/>/gi, '<a:t>\n</a:t>')
    .replace(/<a:tab(?:\s[^>]*)?>[\s\S]*?<\/a:tab>|<a:tab(?:\s[^>]*)?\/>/gi, '<a:t> </a:t>');

  const pRegex = /<a:p(?:\s[^>]*)?>([\s\S]*?)<\/a:p>/gi;
  const paragraphs: string[] = [];
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(normalizedXml)) !== null) {
    const runs = extractXmlTagText(pMatch[1], 'a:t');
    if (runs.length === 0) continue;
    let joined = runs.join('');
    joined = joined
      .replace(/(\w)\s*\n\s*(-\w)/g, '$1$2')
      .replace(/\s*\n+\s*/g, ' · ')
      .replace(/(?:\s*·\s*)+/g, ' · ')
      .replace(/\s+/g, ' ')
      .replace(/^(?:·\s*)+|(?:\s*·)+$/g, '')
      .trim();
    if (
      joined &&
      joined.toLowerCase() !== 'editable location' &&
      !/^\d{1,3}$/.test(joined)
    ) {
      paragraphs.push(joined);
    }
  }
  return paragraphs;
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

async function cropDataUrlWithSrcRect(
  dataUrl: string,
  srcRect: { l: number; t: number; r: number; b: number }
): Promise<string> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return dataUrl;
  }
  const { l, t, r, b } = srcRect;
  if (l + r >= 96000 || t + b >= 96000 || l + r + t + b < 8000) {
    return dataUrl;
  }
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = dataUrl;
    });
    const sx = Math.round((l / 100000) * img.width);
    const sy = Math.round((t / 100000) * img.height);
    const sw = Math.max(1, Math.round(((100000 - l - r) / 100000) * img.width));
    const sh = Math.max(1, Math.round(((100000 - t - b) / 100000) * img.height));
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL('image/png');
  } catch {
    return dataUrl;
  }
}

function computeBoxOverlapRatio(
  boxA: { x: number; y: number; cx: number; cy: number },
  boxB: { x: number; y: number; cx: number; cy: number }
): number {
  const areaA = Math.max(1, boxA.cx * boxA.cy);
  const ix = Math.max(0, Math.min(boxA.x + boxA.cx, boxB.x + boxB.cx) - Math.max(boxA.x, boxB.x));
  const iy = Math.max(0, Math.min(boxA.y + boxA.cy, boxB.y + boxB.cy) - Math.max(boxA.y, boxB.y));
  return (ix * iy) / areaA;
}

export async function parseUploadedPptxFile(file: File): Promise<ParsedPptxResult> {
  const buffer = await file.arrayBuffer();
  const entries = await readZipEntries(buffer);
  const rawZipEntries: ZipFileEntry[] = Array.from(entries.entries()).map(([path, data]) => ({
    path,
    data,
  }));
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

  // 2. Pre-index all ppt/media/* images (supporting up to 15 MB per image)
  const mediaKeys = Array.from(entries.keys()).filter((k) =>
    /^ppt\/media\/.+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(k)
  );
  const mediaMap = new Map<string, { key: string; size: number; url: string }>();
  const extractedMediaUrls: Array<{ key: string; size: number; url: string }> = [];
  for (const mKey of mediaKeys) {
    const bytes = entries.get(mKey);
    if (!bytes || bytes.length < 300 || bytes.length > 15_000_000) continue;
    const ext = mKey.split('.').pop()?.toLowerCase() || 'png';
    const mime =
      ext === 'svg'
        ? 'image/svg+xml'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'webp'
              ? 'image/webp'
              : 'image/png';
    const url = uint8ToBase64DataUrl(bytes, mime);
    if (url) {
      const item = { key: mKey, size: bytes.length, url };
      mediaMap.set(mKey, item);
      extractedMediaUrls.push(item);
    }
  }

  // 3. Parse ppt/slides/slide*.xml (respecting ppt/presentation.xml <p:sldIdLst> order), _rels, and ppt/notesSlides/notesSlide*.xml
  const numericSlidePaths = Array.from(entries.keys())
    .filter((k) => /^ppt\/slides\/slide[^/]*\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return na - nb;
    });

  let slidePaths = numericSlidePaths;
  const presBytes = entries.get('ppt/presentation.xml');
  const presRelsBytes = entries.get('ppt/_rels/presentation.xml.rels');
  if (presBytes && presRelsBytes) {
    const presXml = decoder.decode(presBytes);
    const presRelsXml = decoder.decode(presRelsBytes);
    const rIdToSlidePath = new Map<string, string>();
    const relTagRe = /<Relationship\b([^>]*)\/?>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = relTagRe.exec(presRelsXml)) !== null) {
      const attrs = rm[1];
      const idM = /\bId="([^"]+)"/i.exec(attrs);
      const targetM = /\bTarget="([^"]+)"/i.exec(attrs);
      if (idM && targetM) {
        const cleanTarget = targetM[1].replace(/^\/+/, '').replace(/^ppt\//i, '');
        if (/^slides\/slide[^/]*\.xml$/i.test(cleanTarget)) {
          const fullSlidePath = `ppt/${cleanTarget}`;
          if (entries.has(fullSlidePath)) {
            rIdToSlidePath.set(idM[1], fullSlidePath);
          }
        }
      }
    }
    const sldIdLstMatch = /<p:sldIdLst\b[^>]*>([\s\S]*?)<\/p:sldIdLst>/i.exec(presXml);
    if (sldIdLstMatch) {
      const orderedPaths: string[] = [];
      const seenPaths = new Set<string>();
      const sldIdRe = /<p:sldId\b[^>]*\br:id="([^"]+)"/gi;
      let sm: RegExpExecArray | null;
      while ((sm = sldIdRe.exec(sldIdLstMatch[1])) !== null) {
        const resolved = rIdToSlidePath.get(sm[1]);
        if (resolved && !seenPaths.has(resolved)) {
          seenPaths.add(resolved);
          orderedPaths.push(resolved);
        }
      }
      for (const np of numericSlidePaths) {
        if (!seenPaths.has(np)) {
          seenPaths.add(np);
          orderedPaths.push(np);
        }
      }
      if (orderedPaths.length > 0) {
        slidePaths = orderedPaths;
      }
    }
  }

  // Count media usage across slides so recurring old-template corner decorations can be deprioritized
  const mediaSlideRefCount = new Map<string, number>();
  for (const slidePath of slidePaths) {
    const slideNum = parseInt(slidePath.match(/\d+/)?.[0] || '1', 10);
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsBytes = entries.get(relsPath);
    if (!relsBytes) continue;
    const relsXml = decoder.decode(relsBytes);
    const seenOnSlide = new Set<string>();
    const targetRe = /Target="([^"]+)"/gi;
    let tm: RegExpExecArray | null;
    while ((tm = targetRe.exec(relsXml)) !== null) {
      const target = tm[1];
      if (target.includes('media/')) {
        const mediaKey = `ppt/media/${target.split('media/').pop()}`;
        seenOnSlide.add(mediaKey);
      }
    }
    seenOnSlide.forEach((mk) => {
      mediaSlideRefCount.set(mk, (mediaSlideRefCount.get(mk) || 0) + 1);
    });
  }

  const extractedSlides: ParsedPptxResult['extractedSlides'] = [];
  const slideColorCounts = new Map<string, number>();
  const slideFontCounts = new Map<string, number>();

  for (let idx = 0; idx < slidePaths.length; idx++) {
    const slidePath = slidePaths[idx];
    const slideNum = parseInt(slidePath.match(/\d+/)?.[0] || String(idx + 1), 10);
    try {
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

    // Parse slide relationships for media images and speaker notes
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const rIdToMediaKey = new Map<string, string>();
    let notesTargetPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    if (entries.has(relsPath)) {
      const relsXml = decoder.decode(entries.get(relsPath)!);
      const relTagRe = /<Relationship\b([^>]*)\/?>/gi;
      let rm: RegExpExecArray | null;
      while ((rm = relTagRe.exec(relsXml)) !== null) {
        const attrs = rm[1];
        const idMatch = /\bId="([^"]+)"/i.exec(attrs);
        const targetMatch = /\bTarget="([^"]+)"/i.exec(attrs);
        if (!idMatch || !targetMatch) continue;
        const rId = idMatch[1];
        const target = targetMatch[1];
        if (target.includes('media/')) {
          rIdToMediaKey.set(rId, `ppt/media/${target.split('media/').pop()}`);
        } else if (target.includes('notesSlide')) {
          notesTargetPath = `ppt/notesSlides/${target.split('notesSlides/').pop()}`;
        }
      }
    }

    // Extract slide images in visual priority order, accounting for z-order occlusion and <a:srcRect> crops
    interface RawSlidePic {
      mediaKey: string;
      area: number;
      size: number;
      url: string;
      recurring: boolean;
      x: number;
      y: number;
      cx: number;
      cy: number;
      zIndex: number;
      srcRect?: { l: number; t: number; r: number; b: number };
      isRgbaWidePng: boolean;
    }
    const rawPics: RawSlidePic[] = [];
    const seenMediaOnSlide = new Set<string>();
    const spTreeElementRe = /<(p:sp|p:pic|p:graphicFrame|p:cxnSp)\b[^>]*>[\s\S]*?<\/\1>/gi;
    interface SpTreeElement {
      tag: string;
      body: string;
      zIndex: number;
    }
    const treeElements: SpTreeElement[] = [];
    let elM: RegExpExecArray | null;
    let zCounter = 0;
    while ((elM = spTreeElementRe.exec(slideXml)) !== null) {
      treeElements.push({
        tag: elM[1].toLowerCase(),
        body: elM[0],
        zIndex: zCounter++,
      });
    }

    for (const el of treeElements) {
      if (el.tag !== 'p:pic') continue;
      const picBody = el.body;
      const blipM = /<a:blip\b[^>]*r:embed="([^"]+)"/i.exec(picBody);
      if (!blipM) continue;
      const mediaKey = rIdToMediaKey.get(blipM[1]);
      if (!mediaKey || seenMediaOnSlide.has(mediaKey)) continue;
      const mediaEntry = mediaMap.get(mediaKey);
      if (!mediaEntry || mediaEntry.size < 2500) continue;
      seenMediaOnSlide.add(mediaKey);

      const offM = /<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/i.exec(picBody);
      const extM = /<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/i.exec(picBody);
      const x = offM ? parseInt(offM[1], 10) : 0;
      const y = offM ? parseInt(offM[2], 10) : 0;
      const cx = extM ? parseInt(extM[1], 10) : 3000000;
      const cy = extM ? parseInt(extM[2], 10) : 2000000;
      const area = cx * cy;
      const recurring = (mediaSlideRefCount.get(mediaKey) || 0) > 1;

      let srcRect: { l: number; t: number; r: number; b: number } | undefined;
      const srM = /<a:srcRect\b([^>]*)\/?>/i.exec(picBody);
      if (srM) {
        const l = parseInt(/\bl="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
        const t = parseInt(/\bt="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
        const r = parseInt(/\br="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
        const b = parseInt(/\bb="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
        if (l + t + r + b >= 8000) {
          srcRect = { l, t, r, b };
        }
      }

      const rawBytes = entries.get(mediaKey);
      let isRgbaWidePng = false;
      if (
        rawBytes &&
        rawBytes.length > 26 &&
        rawBytes[0] === 0x89 &&
        rawBytes[1] === 0x50 &&
        rawBytes[25] === 6
      ) {
        const dims = getImageDimensionsFromBytes(rawBytes);
        if (dims && dims.width >= 500) {
          isRgbaWidePng = true;
        }
      }

      rawPics.push({
        mediaKey,
        area,
        size: mediaEntry.size,
        url: mediaEntry.url,
        recurring,
        x,
        y,
        cx,
        cy,
        zIndex: el.zIndex,
        srcRect,
        isRgbaWidePng,
      });
    }

    // Filter out pictures occluded (>75%) by a later full-slide picture (e.g. Slide 3 old chart underneath McKinsey chart)
    const visiblePics = rawPics.filter((pic) => {
      const occludedByLater = rawPics.some(
        (later) =>
          later.zIndex > pic.zIndex &&
          later.cx > 6500000 &&
          later.cy > 3500000 &&
          computeBoxOverlapRatio(pic, later) > 0.75
      );
      return !occludedByLater;
    });

    // Apply <a:srcRect> crops in browser for cropped banners (e.g. Slide 13 principle headers)
    for (const pic of visiblePics) {
      if (pic.srcRect) {
        pic.url = await cropDataUrlWithSrcRect(pic.url, pic.srcRect);
      }
    }

    const uniquePics = visiblePics.filter((p) => !p.recurring);
    const hasMultipleCroppedBanners =
      uniquePics.filter((p) => p.srcRect !== undefined).length >= 2;
    const activePics = (uniquePics.length > 0 ? uniquePics : visiblePics).sort((a, b) =>
      hasMultipleCroppedBanners ? a.y - b.y : b.area - a.area || b.size - a.size
    );
    const primaryImageDataUrl = activePics[0]?.url;
    const extraImageDataUrls = activePics.slice(1, 4).map((p) => p.url);
    const visualNeedsLightSurface = activePics.some(
      (p) => p.isRgbaWidePng || p.srcRect !== undefined
    );

    // Extract text shapes (<p:sp>) with position, font size, placeholder type, and occlusion filtering
    interface ParsedShapeText {
      cNvName: string;
      phType: string;
      maxSz: number;
      firstParaSz: number;
      y: number;
      x: number;
      paragraphs: string[];
    }
    const parsedShapes: ParsedShapeText[] = [];
    for (const el of treeElements) {
      if (el.tag !== 'p:sp') continue;
      const spBody = el.body;
      const cNvM = /<p:cNvPr\b[^>]*\bname="([^"]*)"/i.exec(spBody);
      const cNvName = cNvM ? cNvM[1].trim() : '';
      if (
        cNvName === 'SlideFooter' ||
        cNvName === 'SlideBackground' ||
        cNvName === 'BrandDividerLine' ||
        cNvName === 'TopRightSectionPill' ||
        cNvName === 'EyebrowBar' ||
        cNvName === 'ExecutiveTakeawayBanner'
      ) {
        continue;
      }

      const phM = /<p:ph\b([^>]*)\/?>/i.exec(spBody);
      let phType = '';
      if (phM) {
        const typeAttr = /\btype="([^"]+)"/i.exec(phM[1]);
        phType = typeAttr ? typeAttr[1] : 'body';
      }
      if (phType === 'sldNum' || phType === 'dt' || phType === 'ftr') continue;

      const paras = extractCleanParagraphsFromXmlBlock(spBody);
      if (paras.length === 0) continue;

      const offM = /<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"/i.exec(spBody);
      const extM = /<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/i.exec(spBody);
      const x = offM ? parseInt(offM[1], 10) : 99999999;
      const y = offM ? parseInt(offM[2], 10) : 99999999;
      const cx = extM ? parseInt(extM[1], 10) : 2000000;
      const cy = extM ? parseInt(extM[2], 10) : 600000;

      // Skip slide footers, top eyebrow chrome bars, and corner section pills
      const joinedParas = paras.join(' ').trim();
      if (y >= 6100000 && /\|\s*Slide\s+\d+\s+of\s+\d+/i.test(joinedParas)) continue;
      if (y < 600000 && /^<\s*>\s*Google Developer Experts\s*\/\//i.test(joinedParas)) continue;
      if (y < 550000 && x < 2500000 && paras.length === 1 && /^SLIDE\s+\d+\s*\|/i.test(paras[0])) {
        continue;
      }
      if (y < 550000 && x > 7500000 && paras.length <= 2 && joinedParas.length <= 36) {
        continue;
      }

      // Skip shapes that are occluded (>75%) by a later full-slide picture (e.g. Slide 3 old title underneath McKinsey chart)
      if (x < 90000000 && y < 90000000) {
        const occludedByLaterPic = visiblePics.some(
          (pic) =>
            pic.zIndex > el.zIndex &&
            pic.cx > 6500000 &&
            pic.cy > 3500000 &&
            computeBoxOverlapRatio({ x, y, cx, cy }, pic) > 0.75
        );
        if (occludedByLaterPic) continue;
      }

      const szMatches = Array.from(spBody.matchAll(/\bsz="(\d+)"/gi)).map((m) =>
        parseInt(m[1], 10)
      );
      const maxSz =
        szMatches.length > 0
          ? Math.max(...szMatches)
          : phType === 'title' || phType === 'ctrTitle'
            ? 2400
            : 1400;

      // Measure the font size of the first non-empty paragraph so a body card with a large
      // secondary stat metric (e.g. sz=2600 on paragraph 2) does not outrank the slide header.
      let firstParaSz = maxSz;
      const pBlocks = spBody.match(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/gi) || [];
      for (const pBlock of pBlocks) {
        if (extractCleanParagraphsFromXmlBlock(pBlock).length > 0) {
          const pSzMatches = Array.from(pBlock.matchAll(/\bsz="(\d+)"/gi)).map((m) =>
            parseInt(m[1], 10)
          );
          if (pSzMatches.length > 0) {
            firstParaSz = Math.max(...pSzMatches);
          }
          break;
        }
      }

      parsedShapes.push({ cNvName, phType, maxSz, firstParaSz, y, x, paragraphs: paras });
    }

    // Extract table rows (<a:tbl> inside <p:graphicFrame>)
    const tableRowStrings: string[] = [];
    const tblRe = /<a:tbl(?:\s[^>]*)?>([\s\S]*?)<\/a:tbl>/gi;
    let tblM: RegExpExecArray | null;
    while ((tblM = tblRe.exec(slideXml)) !== null) {
      const trRe = /<a:tr(?:\s[^>]*)?>([\s\S]*?)<\/a:tr>/gi;
      let trM: RegExpExecArray | null;
      while ((trM = trRe.exec(tblM[1])) !== null) {
        const cells: string[] = [];
        const tcRe = /<a:tc(?:\s[^>]*)?>([\s\S]*?)<\/a:tc>/gi;
        let tcM: RegExpExecArray | null;
        while ((tcM = tcRe.exec(trM[1])) !== null) {
          const cellText = extractCleanParagraphsFromXmlBlock(tcM[1]).join(' ').trim();
          if (cellText) cells.push(cellText);
        }
        if (cells.length > 0) {
          tableRowStrings.push(cells.join(': '));
        }
      }
    }

    // Determine slide title, subtitle, and body bullets
    let slideTitle = '';
    let slideSubtitle = '';
    const bullets: string[] = [];
    let isVisualOnly = false;

    if (parsedShapes.length === 0 && tableRowStrings.length === 0) {
      isVisualOnly = true;
      slideTitle = '';
    } else if (parsedShapes.length === 0) {
      slideTitle = tableRowStrings[0] || `Slide ${slideNum}`;
      for (const rowStr of tableRowStrings.slice(1)) {
        bullets.push(rowStr);
      }
    } else {
      const headerBoxShape = parsedShapes.find((s) => s.cNvName === 'HeaderBox');
      const titlePlaceholders = parsedShapes.filter(
        (s) => s.phType === 'title' || s.phType === 'ctrTitle'
      );
      let primaryTitleShape: ParsedShapeText;
      if (headerBoxShape) {
        primaryTitleShape = headerBoxShape;
      } else if (titlePlaceholders.length > 0) {
        titlePlaceholders.sort((a, b) => b.firstParaSz - a.firstParaSz || a.y - b.y || a.x - b.x);
        primaryTitleShape = titlePlaceholders[0];
      } else {
        const topCandidates = [...parsedShapes].sort((a, b) => {
          const aTop = a.y < 1150000 ? 0 : 1;
          const bTop = b.y < 1150000 ? 0 : 1;
          if (aTop !== bTop) return aTop - bTop;
          if (b.firstParaSz !== a.firstParaSz) return b.firstParaSz - a.firstParaSz;
          return a.y - b.y || a.x - b.x;
        });
        primaryTitleShape = topCandidates[0];
      }

      slideTitle = primaryTitleShape.paragraphs[0] || `Slide ${slideNum}`;
      if (primaryTitleShape.paragraphs.length > 1) {
        slideSubtitle = primaryTitleShape.paragraphs[1];
        for (const extraP of primaryTitleShape.paragraphs.slice(2)) {
          bullets.push(extraP);
        }
      }

      const remainingShapes = parsedShapes
        .filter((s) => s !== primaryTitleShape)
        .sort((a, b) => {
          const rowDiff = Math.abs(a.y - b.y);
          if (rowDiff > 280000) return a.y - b.y;
          return a.x - b.x;
        });

      const isFlowchartDiagramSlide =
        remainingShapes.length >= 9 &&
        remainingShapes.filter((s) => s.paragraphs.join(' ').length < 48).length >= 7;

      if (isFlowchartDiagramSlide) {
        const seenLabels = new Set<string>();
        const flowSteps: string[] = [];
        for (const sh of remainingShapes) {
          const combined = sh.paragraphs.join(' · ').trim();
          const lower = combined.toLowerCase();
          if (
            !combined ||
            lower === 'yes' ||
            lower === 'no' ||
            lower === 'done' ||
            seenLabels.has(lower)
          ) {
            continue;
          }
          seenLabels.add(lower);
          flowSteps.push(combined);
        }
        const chunkSize = Math.max(1, Math.ceil(flowSteps.length / 3));
        for (let i = 0; i < flowSteps.length; i += chunkSize) {
          const group = flowSteps.slice(i, i + chunkSize);
          if (group.length > 0) {
            bullets.push(group.join(' → '));
          }
        }
      } else {
        for (const sh of remainingShapes) {
          if (sh.phType === 'subTitle' && !slideSubtitle && sh.paragraphs.length === 1) {
            slideSubtitle = sh.paragraphs[0];
            continue;
          }
          if (/^PillarCard_\d+$/i.test(sh.cNvName) && sh.paragraphs.length >= 3) {
            const cardHeading = sh.paragraphs[2] || sh.paragraphs[0];
            const cardBody = sh.paragraphs.slice(3).join(' · ').trim();
            bullets.push(cardBody ? `${cardHeading}: ${cardBody}` : cardHeading);
            continue;
          }
          if (
            sh.paragraphs.length === 2 &&
            sh.paragraphs[0].length <= 54 &&
            !sh.paragraphs[0].startsWith('http') &&
            !sh.paragraphs[0].endsWith(':')
          ) {
            bullets.push(`${sh.paragraphs[0]}: ${sh.paragraphs[1]}`);
          } else {
            for (const p of sh.paragraphs) {
              bullets.push(p);
            }
          }
        }
      }

      for (const rowStr of tableRowStrings) {
        bullets.push(rowStr);
      }
    }

    // Extract speaker notes
    let speakerNotes = '';
    if (entries.has(notesTargetPath)) {
      const notesXml = decoder.decode(entries.get(notesTargetPath)!);
      const noteParas: string[] = [];
      const nSpRe = /<p:sp(?:\s[^>]*)?>([\s\S]*?)<\/p:sp>/gi;
      let nSpM: RegExpExecArray | null;
      while ((nSpM = nSpRe.exec(notesXml)) !== null) {
        const spBody = nSpM[1];
        if (/<p:ph\b[^>]*type="sldNum"/i.test(spBody)) continue;
        const pList = extractCleanParagraphsFromXmlBlock(spBody);
        noteParas.push(...pList);
      }
      speakerNotes = noteParas.join('\n').trim();
    }

    const maxPicArea = activePics[0]?.area || 0;
    const isVisualDominant = maxPicArea > 18_000_000_000_000 && bullets.length <= 2;

    extractedSlides.push({
      slideNumber: slideNum,
      title: slideTitle,
      subtitle: slideSubtitle || undefined,
      bullets,
      speakerNotes,
      imageDataUrl: primaryImageDataUrl,
      extraImageDataUrls: extraImageDataUrls.length > 0 ? extraImageDataUrls : undefined,
      isVisualOnly,
      visualNeedsLightSurface,
      isVisualDominant,
    });
    } catch {
      extractedSlides.push({
        slideNumber: slideNum,
        title: `Slide ${slideNum}`,
        bullets: [],
        speakerNotes: '',
        isVisualOnly: true,
      });
    }
  }

  // 4. Slide-Level Brand Synthesis (used when uploading a custom Brand Template in Step 2)
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
  const isGde2026 =
    lowerName.includes('2026-gde') ||
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
      const headingText = s.title || `Visual Slide ${s.slideNumber}`;
      const bulletLines = s.bullets.map((b) => `- ${b}`).join('\n');
      const notesLine = s.speakerNotes ? `\n> Speaker Notes: ${s.speakerNotes}` : '';
      return `## Slide ${s.slideNumber}: ${headingText}${bulletLines ? `\n${bulletLines}` : ''}${notesLine}`;
    })
    .join('\n\n');

  return {
    fileName: file.name,
    extractedSlides,
    extractedTheme,
    markdownSummary,
    rawZipEntries,
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
  if (
    url.startsWith('data:image/png;base64,') ||
    url.startsWith('data:image/jpeg;base64,') ||
    url.startsWith('data:image/jpg;base64,') ||
    url.startsWith('data:image/gif;base64,')
  ) {
    return url;
  }
  if (typeof document === 'undefined' || typeof Image === 'undefined') return url.startsWith('data:image/') ? url : undefined;

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
      extraVisualDataUrls: slide.extraVisualDataUrls ? [...slide.extraVisualDataUrls] : undefined,
    };
    if (copy.visualDataUrl) {
      const converted = await convertAnyImageUrlToPngDataUrl(copy.visualDataUrl);
      if (converted) {
        copy.visualDataUrl = converted;
      }
    }
    if (copy.extraVisualDataUrls && copy.extraVisualDataUrls.length > 0) {
      const convertedExtras: string[] = [];
      for (const extraUrl of copy.extraVisualDataUrls) {
        const conv = await convertAnyImageUrlToPngDataUrl(extraUrl);
        if (conv) convertedExtras.push(conv);
      }
      copy.extraVisualDataUrls = convertedExtras;
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

function getImageDimensionsFromBytes(
  bytes: Uint8Array
): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16, false);
    const height = view.getUint32(20, false);
    if (width > 0 && height > 0) return { width, height };
  }
  // GIF signature: 47 49 46 ("GIF")
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    if (width > 0 && height > 0) return { width, height };
  }
  // JPEG signature: FF D8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xff) {
        offset++;
        continue;
      }
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        marker === 0x01 ||
        (marker >= 0xd0 && marker <= 0xd7)
      ) {
        offset += 2;
        continue;
      }
      const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (segLen < 2) break;
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        if (width > 0 && height > 0) return { width, height };
      }
      offset += 2 + segLen;
    }
  }
  return null;
}

function fitBoxMaintainingAspectRatio(
  box: { x: number; y: number; cx: number; cy: number },
  dims: { width: number; height: number } | null
): { x: number; y: number; cx: number; cy: number } {
  if (!dims || dims.width <= 0 || dims.height <= 0) return box;
  const imgRatio = dims.width / dims.height;
  const boxRatio = box.cx / box.cy;
  let fitCx = box.cx;
  let fitCy = box.cy;
  if (imgRatio > boxRatio) {
    fitCy = Math.round(box.cx / imgRatio);
  } else {
    fitCx = Math.round(box.cy * imgRatio);
  }
  const fitX = Math.round(box.x + (box.cx - fitCx) / 2);
  const fitY = Math.round(box.y + (box.cy - fitCy) / 2);
  return { x: fitX, y: fitY, cx: fitCx, cy: fitCy };
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

function setRunSolidFillHex(rXml: string, targetHex: string, forceBold = false): string {
  const cleanHex = hexNoHash(targetHex, 'F8FAFC');
  const fillTag = `<a:solidFill><a:srgbClr val="${cleanHex}"/></a:solidFill>`;
  if (/<a:rPr\b[^>]*\/>/i.test(rXml)) {
    return rXml.replace(/<a:rPr(\b[^>]*)\/>/i, (_, attrs) => {
      const bAttr = forceBold && !/\bb="/i.test(attrs) ? ' b="1"' : '';
      return `<a:rPr${attrs}${bAttr}>${fillTag}</a:rPr>`;
    });
  }
  if (/<a:rPr\b[^>]*>[\s\S]*?<\/a:rPr>/i.test(rXml)) {
    return rXml.replace(/<a:rPr(\b[^>]*)>([\s\S]*?)<\/a:rPr>/i, (_, attrs, inner) => {
      const bAttr = forceBold && !/\bb="/i.test(attrs) ? ' b="1"' : '';
      let cleanedInner = inner
        .replace(/<a:solidFill>[\s\S]*?<\/a:solidFill>/gi, '')
        .replace(/<a:noFill\s*\/>/gi, '')
        .replace(/<a:gradFill>[\s\S]*?<\/a:gradFill>/gi, '');
      return `<a:rPr${attrs}${bAttr}>${fillTag}${cleanedInner}</a:rPr>`;
    });
  }
  return rXml.replace(/<a:r(\b[^>]*)>/i, `<a:r$1><a:rPr lang="en-US"${forceBold ? ' b="1"' : ''}>${fillTag}</a:rPr>`);
}

function getRunEffectiveLuminance(rXml: string, defaultIsDarkText = true): number {
  const rPrM = /<a:rPr\b[^>]*>([\s\S]*?)<\/a:rPr>/i.exec(rXml);
  if (!rPrM) return defaultIsDarkText ? 0.05 : 0.95;
  const rPr = rPrM[1];
  const srgbM = /<a:solidFill>\s*<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/i.exec(rPr);
  if (srgbM) {
    return hexToHslMetrics('#' + srgbM[1]).lum;
  }
  const schemeM = /<a:solidFill>\s*<a:schemeClr\s+val="([^"]+)"/i.exec(rPr);
  if (schemeM) {
    const val = schemeM[1].toLowerCase();
    if (val === 'lt1' || val === 'lt2' || val === 'bg1' || val === 'bg2') return 0.96;
    if (val === 'dk1' || val === 'dk2' || val === 'tx1' || val === 'tx2') return 0.05;
    return 0.45;
  }
  return defaultIsDarkText ? 0.05 : 0.95;
}

function updateXfrmBoxInXml(
  xml: string,
  box: { x: number; y: number; cx: number; cy: number }
): string {
  let replaced = false;
  return xml.replace(
    /<a:xfrm(\b[^>]*)>\s*<a:off\s+x="-?\d+"\s+y="-?\d+"\s*\/>\s*<a:ext\s+cx="\d+"\s+cy="\d+"\s*\/>/i,
    (match, attrs) => {
      if (replaced) return match;
      replaced = true;
      return `<a:xfrm${attrs}><a:off x="${Math.round(box.x)}" y="${Math.round(box.y)}"/><a:ext cx="${Math.round(box.cx)}" cy="${Math.round(box.cy)}"/>`;
    }
  );
}

function parseElementBoxFromXml(
  xml: string
): { x: number; y: number; cx: number; cy: number } | null {
  const m = /<a:xfrm\b[^>]*>\s*<a:off\s+x="(-?\d+)"\s+y="(-?\d+)"\s*\/>\s*<a:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/i.exec(
    xml
  );
  if (!m) return null;
  return {
    x: parseInt(m[1], 10),
    y: parseInt(m[2], 10),
    cx: parseInt(m[3], 10),
    cy: parseInt(m[4], 10),
  };
}

export function rebrandUploadedPptxEntries(
  sourceEntries: ZipFileEntry[],
  deck: PresentationDeckSpec
): Uint8Array {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const entryMap = new Map<string, Uint8Array>();
  for (const item of sourceEntries) {
    entryMap.set(item.path, new Uint8Array(item.data));
  }

  const brand = deck.brand;
  const isKeepExistingBrand = brand.id === 'keep-existing-brand';
  const primaryHex = hexNoHash(brand.primaryHex, '57CAFF');
  const secondaryHex = hexNoHash(brand.secondaryHex, 'FF7DAF');
  const accentHex = hexNoHash(brand.accentHex, '5CDB6D');
  const warningHex = hexNoHash(brand.warningHex, 'FFD427');
  const darkBgHex = hexNoHash(brand.darkBgHex, '20344B');
  const lightBgHex = hexNoHash(brand.lightBgHex, '20344B');
  const surfaceHex = hexNoHash(brand.surfaceHex, '162536');
  const headlineHex = hexNoHash(brand.headlineAccentHex || brand.secondaryHex, 'FF7DAF');
  const headingFont = brand.headingFont || 'Google Sans';
  const bodyFont = brand.bodyFont || 'Google Sans';

  const isDarkBrand =
    !isKeepExistingBrand &&
    (hexToHslMetrics('#' + lightBgHex).lum < 0.35 ||
      brand.templateStyle === 'gde-2026-navy' ||
      brand.templateStyle === 'build-with-ai-terminal');
  const canvasBgHex = isDarkBrand ? darkBgHex : lightBgHex;
  const primaryTextHex = isDarkBrand ? 'F8FAFC' : darkBgHex;
  const mutedTextHex = isDarkBrand ? 'CBD5E1' : '475569';

  // 1. Update ppt/theme/theme1.xml when applying a Brand Guide
  if (!isKeepExistingBrand && entryMap.has('ppt/theme/theme1.xml')) {
    let themeXml = decoder.decode(entryMap.get('ppt/theme/theme1.xml')!);
    const replaceThemeSlot = (slot: string, hex: string) => {
      const re = new RegExp(`(<a:${slot}>)([\\s\\S]*?)(<\\/a:${slot}>)`, 'i');
      themeXml = themeXml.replace(re, `$1<a:srgbClr val="${hex}"/>$3`);
    };
    replaceThemeSlot('accent1', primaryHex);
    replaceThemeSlot('accent2', secondaryHex);
    replaceThemeSlot('accent3', accentHex);
    replaceThemeSlot('accent4', warningHex);
    replaceThemeSlot('accent5', primaryHex);
    replaceThemeSlot('accent6', secondaryHex);
    replaceThemeSlot('hlink', primaryHex);
    replaceThemeSlot('folHlink', secondaryHex);

    themeXml = themeXml.replace(
      /(<a:majorFont>[\s\S]*?<a:latin\s+typeface=")([^"]+)(")/i,
      `$1${escapeXml(headingFont)}$3`
    );
    themeXml = themeXml.replace(
      /(<a:minorFont>[\s\S]*?<a:latin\s+typeface=")([^"]+)(")/i,
      `$1${escapeXml(bodyFont)}$3`
    );
    entryMap.set('ppt/theme/theme1.xml', encoder.encode(themeXml));
  }

  // 2. Update Slide Master & Slide Layouts (removing old red borders and styling light/dark cards)
  if (!isKeepExistingBrand) {
    for (const [path, bytes] of Array.from(entryMap.entries())) {
      if (/^ppt\/slideMasters\/slideMaster\d+\.xml$/i.test(path)) {
        let masterXml = decoder.decode(bytes);
        masterXml = masterXml.replace(
          /<p:bg>[\s\S]*?<\/p:bg>/i,
          `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${canvasBgHex}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`
        );
        masterXml = masterXml.replace(/<p:pic\b[^>]*>[\s\S]*?<\/p:pic>/gi, '');
        masterXml = masterXml.replace(
          /<a:schemeClr\s+val="(?:dk1|tx1|dk2|tx2)"\s*\/>/gi,
          `<a:srgbClr val="${primaryTextHex}"/>`
        );
        entryMap.set(path, encoder.encode(masterXml));
      } else if (/^ppt\/slideLayouts\/slideLayout\d+\.xml$/i.test(path)) {
        let layoutXml = decoder.decode(bytes);
        const isLightCardLayout = /slideLayout16\.xml$/i.test(path);
        const bgReplacement = `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${canvasBgHex}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`;
        if (/<p:bg>[\s\S]*?<\/p:bg>/i.test(layoutXml)) {
          layoutXml = layoutXml.replace(/<p:bg>[\s\S]*?<\/p:bg>/i, bgReplacement);
        } else {
          layoutXml = layoutXml.replace(/<p:cSld(\b[^>]*)>/i, `<p:cSld$1>${bgReplacement}`);
        }
        // Remove old decorative template pictures from layouts
        layoutXml = layoutXml.replace(/<p:pic\b[^>]*>[\s\S]*?<\/p:pic>/gi, '');

        layoutXml = layoutXml.replace(/<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/gi, (spXml) => {
          const box = parseElementBoxFromXml(spXml);
          if (isLightCardLayout && box && box.cx > 7000000 && box.cy > 3500000) {
            // Expand the inner light card on slideLayout16 so it frames all flowchart nodes and code + title cleanly
            let cardSp = updateXfrmBoxInXml(spXml, {
              x: 200000,
              y: 120000,
              cx: 8744000,
              cy: 4620000,
            });
            cardSp = cardSp.replace(
              /<a:solidFill>\s*<a:schemeClr\s+val="lt1"\s*\/>\s*<\/a:solidFill>/i,
              `<a:solidFill><a:srgbClr val="F8FAFC"/></a:solidFill>`
            );
            cardSp = cardSp.replace(
              /<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i,
              `<a:ln w="25400"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:ln>`
            );
            return cardSp;
          }
          // Footer / slide number shapes in layout
          let updatedSp = spXml.replace(
            /<a:solidFill>\s*<a:schemeClr\s+val="lt1"\s*\/>\s*<\/a:solidFill>/gi,
            `<a:noFill/>`
          );
          updatedSp = updatedSp.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) =>
            setRunSolidFillHex(rXml, mutedTextHex)
          );
          updatedSp = updatedSp.replace(
            /<a:latin\s+typeface="[^"]+"/gi,
            `<a:latin typeface="${escapeXml(bodyFont)}"`
          );
          return updatedSp;
        });

        entryMap.set(path, encoder.encode(layoutXml));
      }
    }
  }

  // 3. Transform each slide in ppt/slides/slide*.xml (ONLY when a Brand Guide template is selected;
  // when Keep Existing Deck Template is selected, keep original slide XML intact)
  const sourceSlideNumbers = Array.from(entryMap.keys())
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .map((k) => parseInt(k.match(/\d+/)?.[0] || '0', 10))
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  for (const slideNum of isKeepExistingBrand ? [] : sourceSlideNumbers) {
    const slidePath = `ppt/slides/slide${slideNum}.xml`;
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const slideBytes = entryMap.get(slidePath);
    if (!slideBytes) continue;

    let slideXml = decoder.decode(slideBytes);
    const relsXml = entryMap.has(relsPath) ? decoder.decode(entryMap.get(relsPath)!) : '';

    // Map rId -> media path and detect layout
    const rIdToMediaKey = new Map<string, string>();
    let usesLightCardLayout = false;
    let notesTargetPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    const relTagRe = /<Relationship\b([^>]*)\/?>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = relTagRe.exec(relsXml)) !== null) {
      const attrs = rm[1];
      const idM = /\bId="([^"]+)"/i.exec(attrs);
      const targetM = /\bTarget="([^"]+)"/i.exec(attrs);
      if (!idM || !targetM) continue;
      const rId = idM[1];
      const target = targetM[1];
      if (target.includes('media/')) {
        rIdToMediaKey.set(rId, `ppt/media/${target.split('media/').pop()}`);
      } else if (target.includes('slideLayout16')) {
        usesLightCardLayout = true;
      } else if (target.includes('notesSlide')) {
        notesTargetPath = `ppt/notesSlides/${target.split('notesSlides/').pop()}`;
      }
    }

    // Sync speaker notes if user modified them in Step 3
    const matchingSpec =
      deck.slides.find((s) => s.sourceSlideNumber === slideNum) || deck.slides[slideNum - 1];
    if (matchingSpec && entryMap.has(notesTargetPath)) {
      const notesXml = decoder.decode(entryMap.get(notesTargetPath)!);
      const existingNotes = extractXmlTagText(notesXml, 'a:t').join(' ').trim();
      if (
        matchingSpec.speakerNotes &&
        matchingSpec.speakerNotes.trim() &&
        matchingSpec.speakerNotes.trim() !== existingNotes
      ) {
        let updatedNotes = false;
        const patchedNotesXml = notesXml.replace(
          /<p:sp\b[^>]*>[\s\S]*?<\/p:sp>/gi,
          (nSp) => {
            if (updatedNotes || /<p:ph\b[^>]*type="sldNum"/i.test(nSp)) return nSp;
            if (!/<p:txBody>/i.test(nSp)) return nSp;
            updatedNotes = true;
            return nSp.replace(
              /<p:txBody>[\s\S]*?<\/p:txBody>/i,
              `<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1200"/><a:t>${escapeXml(matchingSpec.speakerNotes.trim())}</a:t></a:r></a:p></p:txBody>`
            );
          }
        );
        entryMap.set(notesTargetPath, encoder.encode(patchedNotesXml));
      }
    }

    if (isKeepExistingBrand) {
      continue;
    }

    // Set slide background when not inheriting slideLayout16's framed card
    if (!usesLightCardLayout) {
      const bgXml = `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${canvasBgHex}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`;
      if (/<p:bg>[\s\S]*?<\/p:bg>/i.test(slideXml)) {
        slideXml = slideXml.replace(/<p:bg>[\s\S]*?<\/p:bg>/i, bgXml);
      } else {
        slideXml = slideXml.replace(/<p:cSld(\b[^>]*)>/i, `<p:cSld$1>${bgXml}`);
      }
    }

    // Strip all copy-pasted white <a:highlight> tags so text never has white highlight bars on dark backgrounds
    slideXml = slideXml.replace(/<a:highlight>[\s\S]*?<\/a:highlight>/gi, '');

    // Parse <p:spTree> children for occlusion removal, transparent PNG card backing, and collision resolution
    const spTreeMatch = /(<p:spTree>\s*<p:nvGrpSpPr>(?:(?!<\/p:nvGrpSpPr>)[\s\S])*?<\/p:nvGrpSpPr>\s*<p:grpSpPr>(?:(?!<\/p:grpSpPr>)[\s\S])*?<\/p:grpSpPr>)([\s\S]*?)(<\/p:spTree>)/i.exec(
      slideXml
    );
    if (!spTreeMatch) {
      entryMap.set(slidePath, encoder.encode(slideXml));
      continue;
    }

    const spTreeHeader = spTreeMatch[1];
    const spTreeInner = spTreeMatch[2];
    const spTreeFooter = spTreeMatch[3];

    interface SlideChildNode {
      tag: string;
      xml: string;
      zIndex: number;
      box: { x: number; y: number; cx: number; cy: number } | null;
      mediaKey?: string;
      hasCrop?: boolean;
      needsLightBacking?: boolean;
      isOverlayOnLightChart?: boolean;
      remove?: boolean;
    }

    // Depth-aware top-level child extractor so <p:grpSp> containing nested <p:sp> is kept intact
    const topLevelRawChildren: Array<{ tag: string; xml: string }> = [];
    const tokenRe = /<(\/?)(p:sp|p:pic|p:graphicFrame|p:grpSp|p:cxnSp)\b[^>]*>/gi;
    let tokMatch: RegExpExecArray | null;
    let depth = 0;
    let currentStart = -1;
    let currentTag = '';
    while ((tokMatch = tokenRe.exec(spTreeInner)) !== null) {
      const isClose = tokMatch[1] === '/';
      const tagName = tokMatch[2].toLowerCase();
      const isSelfClose = !isClose && tokMatch[0].endsWith('/>');
      if (depth === 0 && !isClose) {
        if (isSelfClose) {
          topLevelRawChildren.push({ tag: tagName, xml: tokMatch[0] });
        } else {
          currentStart = tokMatch.index;
          currentTag = tagName;
          depth = 1;
        }
      } else if (depth > 0) {
        if (!isClose && !isSelfClose && tagName === currentTag) {
          depth++;
        } else if (isClose && tagName === currentTag) {
          depth--;
          if (depth === 0 && currentStart >= 0) {
            topLevelRawChildren.push({
              tag: currentTag,
              xml: spTreeInner.slice(currentStart, tokMatch.index + tokMatch[0].length),
            });
            currentStart = -1;
            currentTag = '';
          }
        }
      }
    }

    const children: SlideChildNode[] = [];
    let zIdx = 0;
    for (const rawChild of topLevelRawChildren) {
      const tag = rawChild.tag;
      const xml = rawChild.xml;
      const box = parseElementBoxFromXml(xml);
      let mediaKey: string | undefined;
      let hasCrop = false;
      let needsLightBacking = false;

      if (tag === 'p:pic') {
        const blipM = /<a:blip\b[^>]*r:embed="([^"]+)"/i.exec(xml);
        if (blipM) {
          mediaKey = rIdToMediaKey.get(blipM[1]);
        }
        const srM = /<a:srcRect\b([^>]*)\/?>/i.exec(xml);
        if (srM) {
          const l = parseInt(/\bl="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
          const t = parseInt(/\bt="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
          const r = parseInt(/\br="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
          const b = parseInt(/\bb="(-?\d+)"/i.exec(srM[1])?.[1] || '0', 10);
          if (l + t + r + b >= 8000) {
            hasCrop = true;
          }
        }
        if (isDarkBrand && !usesLightCardLayout && mediaKey && !hasCrop) {
          const imgBytes = entryMap.get(mediaKey);
          if (
            imgBytes &&
            imgBytes.length > 26 &&
            imgBytes[0] === 0x89 &&
            imgBytes[1] === 0x50 &&
            imgBytes[25] === 6 &&
            mediaKey !== 'ppt/media/image12.png'
          ) {
            const dims = getImageDimensionsFromBytes(imgBytes);
            if (dims && dims.width >= 500) {
              needsLightBacking = true;
            }
          }
        }
      }

      children.push({
        tag,
        xml,
        zIndex: zIdx++,
        box,
        mediaKey,
        hasCrop,
        needsLightBacking,
      });
    }

    // Step 3A: Mark occluded shapes/pictures and template clutter for removal
    const allPics = children.filter((c) => c.tag === 'p:pic' && c.box);
    for (const child of children) {
      if (child.tag === 'p:pic' && child.box) {
        const occluded = allPics.some(
          (later) =>
            later.zIndex > child.zIndex &&
            later.box! &&
            later.box.cx > 6500000 &&
            later.box.cy > 3500000 &&
            computeBoxOverlapRatio(child.box!, later.box!) > 0.75
        );
        if (occluded) {
          child.remove = true;
        }
      } else if (child.tag === 'p:sp') {
        const rawText = extractXmlTagText(child.xml, 'a:t').join('').trim();
        if (rawText.toLowerCase() === 'editable location') {
          child.remove = true;
          continue;
        }
        // Empty white cover box from old template (e.g. Slide 1 sp 94)
        if (
          rawText.length === 0 &&
          child.box &&
          child.box.y > 4200000 &&
          /<p:spPr>[\s\S]*?<a:solidFill>\s*(?:<a:schemeClr\s+val="lt1"|<a:srgbClr\s+val="FFFFFF")/i.test(
            child.xml
          )
        ) {
          child.remove = true;
          continue;
        }
        if (child.box) {
          const isQrContainer = /\bQR\b/i.test(rawText);
          const occluded =
            !isQrContainer &&
            allPics.some(
              (later) =>
                !later.remove &&
                later.zIndex > child.zIndex &&
                later.box &&
                computeBoxOverlapRatio(child.box!, later.box) > 0.6
            );
          if (occluded) {
            child.remove = true;
            continue;
          }
          // Check if this text shape intentionally sits ON TOP of an earlier large white chart (e.g. Slide 3 sp 107, Slide 6 sp 127)
          const sitsOnEarlierChart = allPics.some(
            (earlier) =>
              !earlier.remove &&
              earlier.zIndex < child.zIndex &&
              earlier.box &&
              earlier.box.cx > 6500000 &&
              earlier.box.cy > 3500000 &&
              computeBoxOverlapRatio(child.box!, earlier.box) > 0.65
          );
          if (sitsOnEarlierChart) {
            child.isOverlayOnLightChart = true;
          }
        }
      }
    }

    const activeChildren = children.filter((c) => !c.remove);
    const activePicNodes = activeChildren.filter((c) => c.tag === 'p:pic' && c.box);
    const activeSpNodes = activeChildren.filter((c) => c.tag === 'p:sp' && c.box);

    // Step 3B: Spatial Collision Resolution (<p:sp> vs <p:pic>)
    if (!usesLightCardLayout) {
      for (const sp of activeSpNodes) {
        if (sp.isOverlayOnLightChart || !sp.box) continue;
        const spText = extractXmlTagText(sp.xml, 'a:t').join(' ').trim();
        if (!spText) continue;

        // Normalize Slide 19 GuardRailsAPI excessive spaces & dual-URL horizontal tab overflow
        if (spText.includes('GuardRailsAPI') && spText.includes('guardrailsai.com')) {
          sp.xml = sp.xml.replace(/\s{10,}GuardRailsAPI/g, '</a:t></a:r><a:r><a:t>\t\t\tGuardRailsAPI');
          // Replace the <a:tab/> between the two URLs with <a:br/> so they stack vertically in the left column
          sp.xml = sp.xml.replace(
            /(guardrailsai\.com\/<\/a:t><\/a:r>)\s*<a:r>\s*<a:rPr[^>]*>[\s\S]*?<\/a:rPr>\s*<a:tab\s*\/>\s*<\/a:r>/i,
            '$1<a:br/>'
          );
          sp.xml = sp.xml.replace(/sz="13\d\d"/gi, 'sz="1150"');
        }

        const collidingPics = activePicNodes.filter(
          (pic) => pic.box && computeBoxOverlapRatio(sp.box!, pic.box) > 0.01
        );
        if (collidingPics.length === 0) continue;

        // Pattern 1: Body text shape in middle of slide overlapping bottom + right images while top-left is empty (Slide 10 sp 155)
        const hasBottomPic = collidingPics.some((p) => p.box!.y > sp.box!.y + 200000);
        const hasRightPic = collidingPics.some((p) => p.box!.x > 5000000);
        const topLeftOccupied = activeChildren.some(
          (other) =>
            other !== sp &&
            other.box &&
            computeBoxOverlapRatio(
              { x: 450000, y: 450000, cx: 5000000, cy: 1400000 },
              other.box
            ) > 0.05
        );
        if (sp.box.y > 1200000 && hasBottomPic && hasRightPic && !topLeftOccupied) {
          sp.box = { x: 450000, y: 450000, cx: 5100000, cy: 1420000 };
          sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
          sp.xml = sp.xml.replace(/sz="1[5-9]\d\d"/gi, 'sz="1300"');
          continue;
        }

        // Pattern 2: Left-column text shape extending horizontally into a right-hand picture (Slide 1, Slide 12, Slide 19, Slide 21)
        const rightSidePics = collidingPics.filter(
          (p) => p.box!.x >= 3400000 && sp.box!.x < 1200000
        );
        if (rightSidePics.length > 0) {
          const minPicX = Math.min(...rightSidePics.map((p) => p.box!.x));
          const newX = Math.max(180000, sp.box.x);
          const newY = Math.max(60000, sp.box.y);
          const newCx = Math.max(2400000, minPicX - newX - 110000);
          sp.box = { x: newX, y: newY, cx: newCx, cy: sp.box.cy };
          sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
        }

        // Pattern 2B: Right-column text shape touching right edge of a left-side chart (Slide 6 sp 6)
        const leftSidePics = collidingPics.filter(
          (p) => p.box!.x < 1000000 && sp.box!.x >= 5500000
        );
        if (leftSidePics.length > 0) {
          const maxPicRight = Math.max(...leftSidePics.map((p) => p.box!.x + p.box!.cx));
          const newX = maxPicRight + 45000;
          const newCx = Math.max(2200000, 9050000 - newX);
          sp.box = { x: newX, y: sp.box.y, cx: newCx, cy: sp.box.cy };
          sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
        }

        // Pattern 3: Top header/subtitle overlapping top of chart picture (Slide 4 sp 112, Slide 11 sp 165)
        const belowChartPics = collidingPics.filter(
          (p) =>
            p.box!.y > 250000 &&
            p.box!.cy > 2500000 &&
            sp.box!.y < p.box!.y &&
            sp.box!.y + sp.box!.cy > p.box!.y
        );
        if (belowChartPics.length > 0) {
          const chartPic = belowChartPics[0];
          const earlierTopTitle = activeSpNodes.find(
            (other) => other !== sp && other.box && other.box.y < sp.box!.y && other.box.y < 350000
          );
          if (earlierTopTitle && earlierTopTitle.box) {
            earlierTopTitle.box = {
              x: earlierTopTitle.box.x,
              y: 85000,
              cx: earlierTopTitle.box.cx,
              cy: 310000,
            };
            earlierTopTitle.xml = updateXfrmBoxInXml(earlierTopTitle.xml, earlierTopTitle.box);
            sp.box = {
              x: sp.box.x,
              y: 410000,
              cx: sp.box.cx,
              cy: 540000,
            };
            sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
            sp.xml = sp.xml.replace(/sz="1[6-9]\d\d"/gi, 'sz="1350"');
            if (chartPic.box!.y < 990000) {
              const delta = 990000 - chartPic.box!.y;
              chartPic.box = {
                x: chartPic.box!.x,
                y: 990000,
                cx: chartPic.box!.cx,
                cy: Math.max(2000000, chartPic.box!.cy - delta),
              };
              chartPic.xml = updateXfrmBoxInXml(chartPic.xml, chartPic.box);
            }
          } else {
            const clampedY = Math.max(20000, sp.box.y);
            const clampedCy = Math.max(240000, chartPic.box!.y - clampedY - 25000);
            sp.box = { x: sp.box.x, y: clampedY, cx: sp.box.cx, cy: clampedCy };
            sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
          }
        }

        // Pattern 4: Bottom URL/caption overlapping bottom edge of chart picture (Slide 4 sp 114, Slide 12 sp 179)
        const aboveChartPics = collidingPics.filter(
          (p) =>
            p.box!.cy > 2500000 &&
            sp.box!.y > 4300000 &&
            p.box!.y + p.box!.cy > sp.box!.y
        );
        if (aboveChartPics.length > 0) {
          const chartPic = aboveChartPics[0];
          const newSpY = Math.max(sp.box.y, 4750000);
          sp.box = { x: sp.box.x, y: newSpY, cx: sp.box.cx, cy: sp.box.cy };
          sp.xml = updateXfrmBoxInXml(sp.xml, sp.box);
          if (chartPic.box!.y + chartPic.box!.cy > newSpY - 25000) {
            chartPic.box = {
              x: chartPic.box!.x,
              y: chartPic.box!.y,
              cx: chartPic.box!.cx,
              cy: Math.max(2000000, newSpY - chartPic.box!.y - 35000),
            };
            chartPic.xml = updateXfrmBoxInXml(chartPic.xml, chartPic.box);
          }
        }
      }
    }

    // Step 3C: Determine primary title shape on this slide
    let primaryTitleNode: SlideChildNode | undefined;
    if (activeSpNodes.length > 0) {
      const sortedForTitle = [...activeSpNodes].sort((a, b) => {
        const aIsPh = /<p:ph\b[^>]*type="(?:title|ctrTitle)"/i.test(a.xml) ? 0 : 1;
        const bIsPh = /<p:ph\b[^>]*type="(?:title|ctrTitle)"/i.test(b.xml) ? 0 : 1;
        if (aIsPh !== bIsPh) return aIsPh - bIsPh;
        return (a.box?.y || 0) - (b.box?.y || 0);
      });
      if ((sortedForTitle[0].box?.y ?? 9999999) < 1500000) {
        primaryTitleNode = sortedForTitle[0];
      }
    }

    // Step 3D: Re-style shapes, pills, flowcharts, code blocks, and tables
    let gradPillCounter = 0;
    const pillPalette = [primaryHex, accentHex, warningHex];

    for (const child of activeChildren) {
      if (child.tag === 'p:sp') {
        const isTitleNode = child === primaryTitleNode;
        const targetFont = isTitleNode ? headingFont : bodyFont;
        child.xml = child.xml.replace(
          /<a:latin\s+typeface="([^"]+)"/gi,
          (_, tf) => `<a:latin typeface="${tf.startsWith('+') ? tf : escapeXml(targetFont)}"`
        );
        child.xml = child.xml.replace(
          /<a:cs\s+typeface="([^"]+)"/gi,
          (_, tf) => `<a:cs typeface="${tf.startsWith('+') ? tf : escapeXml(targetFont)}"`
        );

        if (usesLightCardLayout) {
          // Slides 14-18 (inside light #F8FAFC card on #20344B navy frame)
          const isDarkQrCard = /<p:spPr>[\s\S]*?<a:solidFill>\s*<a:schemeClr\s+val="dk1"\s*\/>\s*<\/a:solidFill>/i.test(
            child.xml
          );
          if (isDarkQrCard) {
            child.xml = child.xml.replace(
              /<a:solidFill>\s*<a:schemeClr\s+val="dk1"\s*\/>\s*<\/a:solidFill>/i,
              `<a:solidFill><a:srgbClr val="${darkBgHex}"/></a:solidFill>`
            );
            child.xml = child.xml.replace(
              /<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i,
              `<a:ln w="19050"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:ln>`
            );
            child.xml = child.xml.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) =>
              setRunSolidFillHex(rXml, 'F8FAFC', true)
            );
          } else {
            // Flowchart node or code block on light #F8FAFC card: ensure any default/dk1 text is crisp darkBgHex (#20344B)
            child.xml = child.xml.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) => {
              if (
                !/<a:solidFill>/i.test(rXml) ||
                /<a:schemeClr\s+val="(?:dk1|tx1|dk2|tx2)"/i.test(rXml)
              ) {
                return setRunSolidFillHex(rXml, darkBgHex, isTitleNode);
              }
              return rXml;
            });
          }
        } else if (child.isOverlayOnLightChart) {
          // Shapes sitting directly on a full-slide chart/photo (Slide 3 sp 107, Slide 6 sp 127, Slide 9 sp 145..150)
          child.xml = child.xml.replace(
            /(<p:spPr>[\s\S]*?<a:solidFill>)\s*<a:schemeClr\s+val="lt1"\s*\/>\s*(<\/a:solidFill>[\s\S]*?<\/p:spPr>)/i,
            `$1<a:srgbClr val="FFFFFF"/>$2`
          );
          child.xml = child.xml.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) => {
            const origLum = getRunEffectiveLuminance(rXml, true);
            // If author explicitly used light text (e.g. Slide 9 sp 147 over dark bottom of photo), keep it high-contrast light
            if (origLum > 0.78) {
              return setRunSolidFillHex(
                rXml,
                /<a:hlinkClick\b/i.test(rXml) ? primaryHex : 'F8FAFC'
              );
            }
            if (/<a:hlinkClick\b/i.test(rXml)) {
              return setRunSolidFillHex(rXml, '0B57D0');
            }
            return setRunSolidFillHex(rXml, darkBgHex);
          });
        } else if (isDarkBrand) {
          // Standard shapes on #20344B dark navy canvas
          let spTextTargetHex: string | null = null;
          let spCardAccentHex: string | null = null;
          let forceBoldText = false;

          // Check <p:spPr> fills
          child.xml = child.xml.replace(/<p:spPr(\b[^>]*)>([\s\S]*?)<\/p:spPr>/i, (_, attrs, spPrInner) => {
            // 1. Legacy red gradient pill (Slide 13 bottom pills sp 194, 195, 196) -> 2026 GDE Halftone pill
            if (/<a:gradFill>[\s\S]*?<\/a:gradFill>/i.test(spPrInner)) {
              const pillColor = pillPalette[gradPillCounter++ % pillPalette.length];
              spTextTargetHex = pillColor;
              forceBoldText = true;
              let updated = spPrInner.replace(
                /<a:gradFill>[\s\S]*?<\/a:gradFill>/i,
                `<a:solidFill><a:srgbClr val="${surfaceHex}"/></a:solidFill>`
              );
              if (/<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i.test(updated)) {
                updated = updated.replace(
                  /<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i,
                  `<a:ln w="25400"><a:solidFill><a:srgbClr val="${pillColor}"/></a:solidFill></a:ln>`
                );
              } else {
                updated += `<a:ln w="25400"><a:solidFill><a:srgbClr val="${pillColor}"/></a:solidFill></a:ln>`;
              }
              return `<p:spPr${attrs}>${updated}</p:spPr>`;
            }
            // 2. White shape fill from light template: if it has a visible border (e.g. Slide 20 feature cards), style as GDE surface card; otherwise make transparent
            if (
              /<a:solidFill>\s*(?:<a:schemeClr\s+val="(?:lt1|bg1)"\s*\/>|<a:srgbClr\s+val="(?:FFFFFF|F8F9FA|F1F3F4)"\s*\/>)\s*<\/a:solidFill>/i.test(
                spPrInner
              )
            ) {
              const hasVisibleBorder =
                /<a:ln\b[^>]*>[\s\S]*?<a:solidFill>/i.test(spPrInner) &&
                !/<a:ln\b[^>]*>\s*<a:noFill\s*\/>/i.test(spPrInner);
              if (hasVisibleBorder) {
                const cardColor = pillPalette[gradPillCounter++ % pillPalette.length];
                spCardAccentHex = cardColor;
                let updated = spPrInner.replace(
                  /<a:solidFill>[\s\S]*?<\/a:solidFill>/i,
                  `<a:solidFill><a:srgbClr val="${surfaceHex}"/></a:solidFill>`
                );
                updated = updated.replace(
                  /<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i,
                  `<a:ln w="19050"><a:solidFill><a:srgbClr val="${cardColor}"/></a:solidFill></a:ln>`
                );
                return `<p:spPr${attrs}>${updated}</p:spPr>`;
              }
              const updated = spPrInner.replace(
                /<a:solidFill>[\s\S]*?<\/a:solidFill>/i,
                '<a:noFill/>'
              );
              return `<p:spPr${attrs}>${updated}</p:spPr>`;
            }
            // 3. Yellow warning callout box (Slide 8 sp 143 #FBBC04) -> 2026 GDE Halftone Yellow #FFD427 with dark navy text
            if (/<a:solidFill>\s*<a:srgbClr\s+val="FBBC04"/i.test(spPrInner)) {
              spTextTargetHex = darkBgHex;
              forceBoldText = true;
              const updated = spPrInner.replace(
                /<a:solidFill>[\s\S]*?<\/a:solidFill>/i,
                `<a:solidFill><a:srgbClr val="${warningHex}"/></a:solidFill>`
              );
              return `<p:spPr${attrs}>${updated}</p:spPr>`;
            }
            // 4. Blue callout box (Slide 9 sp 148 #4285F4) -> 2026 GDE Surface #162536 with #57CAFF border
            if (/<a:solidFill>\s*<a:srgbClr\s+val="4285F4"/i.test(spPrInner)) {
              spTextTargetHex = 'F8FAFC';
              let updated = spPrInner.replace(
                /<a:solidFill>[\s\S]*?<\/a:solidFill>/i,
                `<a:solidFill><a:srgbClr val="${surfaceHex}"/></a:solidFill>`
              );
              if (/<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i.test(updated)) {
                updated = updated.replace(
                  /<a:ln\b[^>]*>[\s\S]*?<\/a:ln>/i,
                  `<a:ln w="19050"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:ln>`
                );
              }
              return `<p:spPr${attrs}>${updated}</p:spPr>`;
            }
            return `<p:spPr${attrs}>${spPrInner}</p:spPr>`;
          });

          // Re-color runs inside <p:txBody> for high contrast on #20344B
          let pIndex = 0;
          child.xml = child.xml.replace(/<a:p(\b[^>]*)>([\s\S]*?)<\/a:p>/gi, (_, pAttrs, pInner) => {
            const currentP = pIndex++;
            const updatedP = pInner.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) => {
              if (spTextTargetHex) {
                return setRunSolidFillHex(rXml, spTextTargetHex, forceBoldText);
              }
              if (spCardAccentHex) {
                return setRunSolidFillHex(
                  rXml,
                  currentP === 0 ? spCardAccentHex : 'E2E8F0',
                  currentP === 0
                );
              }
              if (/<a:hlinkClick\b/i.test(rXml)) {
                return setRunSolidFillHex(rXml, primaryHex);
              }
              const lum = getRunEffectiveLuminance(rXml, true);
              if (lum < 0.72) {
                const chosenHex =
                  isTitleNode && currentP === 0 ? headlineHex : primaryTextHex;
                return setRunSolidFillHex(rXml, chosenHex);
              }
              return rXml;
            });
            return `<a:p${pAttrs}>${updatedP}</a:p>`;
          });
        }
      } else if (child.tag === 'p:graphicFrame' && isDarkBrand && /<a:tbl\b/i.test(child.xml)) {
        // Re-brand table (e.g. Slide 22 AI Regulations)
        let rowIdx = 0;
        child.xml = child.xml.replace(/<a:tr(\b[^>]*)>([\s\S]*?)<\/a:tr>/gi, (_, trAttrs, trInner) => {
          const rIdx = rowIdx++;
          const rowFillHex = rIdx % 2 === 0 ? surfaceHex : '1B2D42';
          let colIdx = 0;
          const updatedTr = trInner.replace(
            /<a:tc(\b[^>]*)>([\s\S]*?)<\/a:tc>/gi,
            (__, tcAttrs, tcInner) => {
              const cIdx = colIdx++;
              const textColor = cIdx === 0 ? primaryHex : 'F8FAFC';
              let updatedTc = tcInner.replace(/<a:r\b[^>]*>[\s\S]*?<\/a:r>/gi, (rXml) =>
                setRunSolidFillHex(rXml, textColor, cIdx === 0)
              );
              updatedTc = updatedTc.replace(
                /<a:latin\s+typeface="[^"]+"/gi,
                `<a:latin typeface="${escapeXml(cIdx === 0 ? headingFont : bodyFont)}"`
              );
              const borderLines = `<a:lnL w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:lnL><a:lnR w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:lnR><a:lnT w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:lnT><a:lnB w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="${primaryHex}"/></a:solidFill></a:lnB>`;
              if (/<a:tcPr\b[^>]*>[\s\S]*?<\/a:tcPr>/i.test(updatedTc)) {
                updatedTc = updatedTc.replace(
                  /<a:tcPr(\b[^>]*)>([\s\S]*?)<\/a:tcPr>/i,
                  `<a:tcPr$1>${borderLines}<a:solidFill><a:srgbClr val="${rowFillHex}"/></a:solidFill></a:tcPr>`
                );
              } else {
                updatedTc = updatedTc.replace(
                  /<a:tcPr(\b[^>]*)\/>/i,
                  `<a:tcPr$1>${borderLines}<a:solidFill><a:srgbClr val="${rowFillHex}"/></a:solidFill></a:tcPr>`
                );
              }
              return `<a:tc${tcAttrs}>${updatedTc}</a:tc>`;
            }
          );
          return `<a:tr${trAttrs}>${updatedTr}</a:tr>`;
        });
      }
    }

    // Step 3E: Reassemble <p:spTree>, inserting light #F8FAFC card backings behind transparent dark-ink PNGs
    let backingShapeId = 9000 + slideNum * 20;
    const outputTreeParts: string[] = [];
    for (const child of activeChildren) {
      if (child.tag === 'p:pic' && child.needsLightBacking && child.box) {
        const padX = 35000;
        const padY = 25000;
        const bx = Math.max(40000, child.box.x - padX);
        const by = Math.max(30000, child.box.y - padY);
        const bcx = child.box.cx + padX * 2;
        const bcy = child.box.cy + padY * 2;
        outputTreeParts.push(
          buildOpenXmlRectShape({
            id: backingShapeId++,
            name: `LightSurfaceBacking_${backingShapeId}`,
            x: bx,
            y: by,
            cx: bcx,
            cy: bcy,
            fillHex: '#F8FAFC',
            borderHex: `#${primaryHex}`,
            borderWidthEmu: 19050,
            roundRect: true,
            roundAdj: 3500,
          })
        );
      }
      outputTreeParts.push(child.xml);
    }

    const rebuiltSlideXml =
      slideXml.slice(0, spTreeMatch.index!) +
      spTreeHeader +
      '\n' +
      outputTreeParts.join('\n') +
      '\n' +
      spTreeFooter +
      slideXml.slice(spTreeMatch.index! + spTreeMatch[0].length);

    entryMap.set(slidePath, encoder.encode(rebuiltSlideXml));
  }

  // 3F. Inject user-added Courier New code snippets or merged slide content into existing source slides
  const presXmlForSize = entryMap.has('ppt/presentation.xml')
    ? decoder.decode(entryMap.get('ppt/presentation.xml')!)
    : '';
  const szMatchForInject = /<p:sldSz\s+cx="(\d+)"\s+cy="(\d+)"/i.exec(presXmlForSize);
  const injectSldCx = szMatchForInject ? parseInt(szMatchForInject[1], 10) : 9144000;
  const injectSldCy = szMatchForInject ? parseInt(szMatchForInject[2], 10) : 5143500;

  for (const slideSpec of deck.slides) {
    const sNum = slideSpec.sourceSlideNumber;
    if (!sNum || !sourceSlideNumbers.includes(sNum)) continue;
    const hasCode = Boolean(slideSpec.codeSnippet && slideSpec.codeSnippet.trim());
    const hasMerge = Boolean(
      slideSpec.mergedFromSlideNumbers && slideSpec.mergedFromSlideNumbers.length > 0
    );
    if (!hasCode && !hasMerge) continue;

    const sPath = `ppt/slides/slide${sNum}.xml`;
    if (!entryMap.has(sPath)) continue;
    let sXml = decoder.decode(entryMap.get(sPath)!);
    const extraShapes: string[] = [];

    if (hasCode && slideSpec.codeSnippet) {
      const codeLines = slideSpec.codeSnippet.replace(/\r\n/g, '\n').split('\n').slice(0, 22);
      extraShapes.push(
        buildOpenXmlRectShape({
          id: 9500 + sNum,
          name: `InsertedCodeSnippet_${sNum}`,
          x: Math.round(injectSldCx * 0.46),
          y: Math.round(injectSldCy * 0.22),
          cx: Math.round(injectSldCx * 0.5),
          cy: Math.round(injectSldCy * 0.66),
          fillHex: '#0F172A',
          borderHex: `#${primaryHex}`,
          borderWidthEmu: 19050,
          roundRect: true,
          roundAdj: 3500,
          paragraphs: codeLines.map((line) => ({
            text: line || ' ',
            fontSizePt: 11,
            colorHex: '#E2E8F0',
            fontFace: 'Courier New',
          })),
        })
      );
    }

    if (hasMerge) {
      const mergedBullets = slideSpec.cards
        .flatMap((c) => [c.heading, ...c.bullets])
        .filter((t) => Boolean(t && t.trim()))
        .slice(0, 8);
      if (mergedBullets.length > 0) {
        extraShapes.push(
          buildOpenXmlRectShape({
            id: 9600 + sNum,
            name: `MergedSlideContent_${sNum}`,
            x: Math.round(injectSldCx * 0.05),
            y: Math.round(injectSldCy * 0.62),
            cx: Math.round(injectSldCx * 0.9),
            cy: Math.round(injectSldCy * 0.28),
            fillHex: isDarkBrand ? '#162536' : '#F8FAFC',
            borderHex: `#${primaryHex}`,
            borderWidthEmu: 15875,
            roundRect: true,
            roundAdj: 3500,
            paragraphs: mergedBullets.map((line, idx) => ({
              text: line,
              fontSizePt: idx === 0 ? 13 : 11.5,
              bold: idx === 0,
              bullet: idx > 0,
              colorHex: isDarkBrand ? '#F8FAFC' : '#1E293B',
              fontFace: bodyFont,
            })),
          })
        );
      }
    }

    if (extraShapes.length > 0 && /<\/p:spTree>/i.test(sXml)) {
      sXml = sXml.replace(/<\/p:spTree>/i, `${extraShapes.join('\n')}\n</p:spTree>`);
      entryMap.set(sPath, encoder.encode(sXml));
    }
  }

  // 4. Synchronize ppt/presentation.xml <p:sldIdLst> for Removed, Merged, or Newly Added slides
  if (
    entryMap.has('ppt/presentation.xml') &&
    entryMap.has('ppt/_rels/presentation.xml.rels') &&
    entryMap.has('[Content_Types].xml')
  ) {
    let presXml = decoder.decode(entryMap.get('ppt/presentation.xml')!);
    let presRelsXml = decoder.decode(entryMap.get('ppt/_rels/presentation.xml.rels')!);
    let contentTypesXml = decoder.decode(entryMap.get('[Content_Types].xml')!);

    const sldSzMatch = /<p:sldSz\s+cx="(\d+)"\s+cy="(\d+)"/i.exec(presXml);
    const sldCx = sldSzMatch ? parseInt(sldSzMatch[1], 10) : 9144000;
    const sldCy = sldSzMatch ? parseInt(sldSzMatch[2], 10) : 5143500;

    const existingLayouts = Array.from(entryMap.keys()).filter((k) =>
      /^ppt\/slideLayouts\/slideLayout\d+\.xml$/i.test(k)
    );
    const defaultLayoutTarget =
      existingLayouts.length > 0
        ? `../slideLayouts/${existingLayouts[0].split('/').pop()}`
        : '../slideLayouts/slideLayout1.xml';

    // Map slideN -> existing <p:sldId .../> tag via presentation.xml.rels
    const rIdToSlideNum = new Map<string, number>();
    for (const m of presRelsXml.matchAll(/<Relationship\b[^>]+>/gi)) {
      const tag = m[0];
      const idM = /\bId="([^"]+)"/i.exec(tag);
      const targetM = /\bTarget="[^"]*slides\/slide(\d+)\.xml"/i.exec(tag);
      if (idM && targetM) {
        rIdToSlideNum.set(idM[1], parseInt(targetM[1], 10));
      }
    }

    const slideNumToSldIdTag = new Map<number, string>();
    for (const m of presXml.matchAll(/<p:sldId\b[^>]*\/?>/gi)) {
      const tag = m[0];
      const rIdM = /\br:id="([^"]+)"/i.exec(tag);
      if (rIdM && rIdToSlideNum.has(rIdM[1])) {
        slideNumToSldIdTag.set(rIdToSlideNum.get(rIdM[1])!, tag);
      }
    }

    let nextSlideNum = (sourceSlideNumbers[sourceSlideNumbers.length - 1] || 0) + 1;
    let maxSldId = Math.max(
      256,
      ...Array.from(presXml.matchAll(/<p:sldId\s+id="(\d+)"/gi)).map((m) => parseInt(m[1], 10))
    );
    let maxRId = Math.max(
      50,
      ...Array.from(presRelsXml.matchAll(/Id="rId(\d+)"/gi)).map((m) => parseInt(m[1], 10))
    );

    const orderedSldIdTags: string[] = [];

    for (const slideSpec of deck.slides) {
      if (
        slideSpec.sourceSlideNumber &&
        slideNumToSldIdTag.has(slideSpec.sourceSlideNumber)
      ) {
        orderedSldIdTags.push(slideNumToSldIdTag.get(slideSpec.sourceSlideNumber)!);
        continue;
      }

      const newSlide = slideSpec;
      const sNum = nextSlideNum++;
      const sldId = ++maxSldId;
      const rId = `rId${++maxRId}`;
      const bulletLines = newSlide.cards.flatMap((c) => [
        `${c.heading}${c.metric ? ` (${c.metric})` : ''}`,
        ...c.bullets,
      ]);

      const newSlideShapes: string[] = [
        buildOpenXmlRectShape({
          id: 2,
          name: 'NewSlideTitle',
          x: Math.round(sldCx * 0.05),
          y: Math.round(sldCy * 0.08),
          cx: Math.round(sldCx * 0.9),
          cy: Math.round(sldCy * 0.16),
          fillHex: `#${canvasBgHex}`,
          paragraphs: [
            {
              text: newSlide.title || `Slide ${sNum}`,
              fontSizePt: 26,
              bold: true,
              colorHex: `#${isDarkBrand ? headlineHex : darkBgHex}`,
              fontFace: headingFont,
            },
          ],
        }),
        buildOpenXmlRectShape({
          id: 3,
          name: 'NewSlideBodyCard',
          x: Math.round(sldCx * 0.05),
          y: Math.round(sldCy * 0.27),
          cx: Math.round(sldCx * 0.9),
          cy: Math.round(sldCy * 0.62),
          fillHex: `#${isDarkBrand ? surfaceHex : 'F8FAFC'}`,
          borderHex: `#${primaryHex}`,
          borderWidthEmu: 19050,
          roundRect: true,
          roundAdj: 3500,
          paragraphs: (bulletLines.length > 0 ? bulletLines : [newSlide.subtitle || 'Key points']).map(
            (line, idx) => ({
              text: line,
              fontSizePt: idx === 0 ? 15 : 13,
              bold: idx === 0,
              bullet: idx > 0,
              colorHex: `#${primaryTextHex}`,
              fontFace: bodyFont,
            })
          ),
        }),
      ];

      if (newSlide.codeSnippet && newSlide.codeSnippet.trim()) {
        const codeLines = newSlide.codeSnippet.replace(/\r\n/g, '\n').split('\n').slice(0, 22);
        newSlideShapes.push(
          buildOpenXmlRectShape({
            id: 4,
            name: 'NewSlideCodeSnippet',
            x: Math.round(sldCx * 0.48),
            y: Math.round(sldCy * 0.27),
            cx: Math.round(sldCx * 0.47),
            cy: Math.round(sldCy * 0.62),
            fillHex: '#0F172A',
            borderHex: `#${primaryHex}`,
            borderWidthEmu: 19050,
            roundRect: true,
            roundAdj: 3500,
            paragraphs: codeLines.map((line) => ({
              text: line || ' ',
              fontSizePt: 11,
              colorHex: '#E2E8F0',
              fontFace: 'Courier New',
            })),
          })
        );
      }

      const newSlideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="${canvasBgHex}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${newSlideShapes.join('\n      ')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

      const newSlideRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="${defaultLayoutTarget}"/>
</Relationships>`;

      entryMap.set(`ppt/slides/slide${sNum}.xml`, encoder.encode(newSlideXml));
      entryMap.set(`ppt/slides/_rels/slide${sNum}.xml.rels`, encoder.encode(newSlideRelsXml));

      orderedSldIdTags.push(`<p:sldId id="${sldId}" r:id="${rId}"/>`);
      presRelsXml = presRelsXml.replace(
        /<\/Relationships>/i,
        `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${sNum}.xml"/>\n</Relationships>`
      );
      contentTypesXml = contentTypesXml.replace(
        /<\/Types>/i,
        `  <Override PartName="/ppt/slides/slide${sNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n</Types>`
      );
    }

    if (orderedSldIdTags.length > 0 && /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/i.test(presXml)) {
      presXml = presXml.replace(
        /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/i,
        `<p:sldIdLst>\n    ${orderedSldIdTags.join('\n    ')}\n  </p:sldIdLst>`
      );
    }

    entryMap.set('ppt/presentation.xml', encoder.encode(presXml));
    entryMap.set('ppt/_rels/presentation.xml.rels', encoder.encode(presRelsXml));
    entryMap.set('[Content_Types].xml', encoder.encode(contentTypesXml));
  }

  const finalEntries: ZipFileEntry[] = Array.from(entryMap.entries()).map(([path, data]) => ({
    path,
    data,
  }));
  return buildZipArchive(finalEntries);
}

export function compileOpenXmlPptx(deck: PresentationDeckSpec): Uint8Array {
  if (deck.sourceZipEntries && deck.sourceZipEntries.length > 0) {
    return rebrandUploadedPptxEntries(deck.sourceZipEntries, deck);
  }
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
        `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n  <Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`
    )
    .join('\n  ');

  addXml(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="gif" ContentType="image/gif"/>
  <Default Extension="svg" ContentType="image/svg+xml"/>
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

    const rawVisualUrls = [
      slide.visualDataUrl,
      ...(slide.extraVisualDataUrls || []),
    ].filter((u): u is string => Boolean(u && u.startsWith('data:image/')));

    const slideImageItems: Array<{
      rId: string;
      mediaFileName: string;
      dims: { width: number; height: number } | null;
    }> = [];

    rawVisualUrls.slice(0, 4).forEach((dataUrl, imgIdx) => {
      const imgBytes = dataUrlToUint8Array(dataUrl);
      if (!imgBytes) return;
      const mimeHeader = dataUrl.slice(5, dataUrl.indexOf(';')).toLowerCase();
      const ext =
        mimeHeader.includes('jpeg') || mimeHeader.includes('jpg')
          ? 'jpg'
          : mimeHeader.includes('gif')
            ? 'gif'
            : mimeHeader.includes('svg')
              ? 'svg'
              : 'png';
      const rId = `rIdImg${imgIdx + 1}`;
      const mediaFileName = `slide_${slideNum}_img_${imgIdx + 1}.${ext}`;
      entries.push({ path: `ppt/media/${mediaFileName}`, data: imgBytes });
      slideImageItems.push({
        rId,
        mediaFileName,
        dims: getImageDimensionsFromBytes(imgBytes),
      });
    });

    const imageRelXml = slideImageItems
      .map(
        (item) =>
          `<Relationship Id="${item.rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${item.mediaFileName}"/>`
      )
      .join('\n  ');
    const hasVisual = slideImageItems.length > 0;

    const pushFittedSlidePictures = (box: { x: number; y: number; cx: number; cy: number }) => {
      if (slideImageItems.length === 0) return;
      if (slideImageItems.length === 1) {
        const fitted = fitBoxMaintainingAspectRatio(box, slideImageItems[0].dims);
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: slideImageItems[0].rId,
            name: 'SlideGraphic_1',
            ...fitted,
          })
        );
        return;
      }
      if (slideImageItems.length === 2) {
        const gap = 100000;
        const isWideBox = box.cx > box.cy * 1.35;
        slideImageItems.forEach((item, i) => {
          const cell = isWideBox
            ? {
                x: box.x + i * Math.floor((box.cx + gap) / 2),
                y: box.y,
                cx: Math.floor((box.cx - gap) / 2),
                cy: box.cy,
              }
            : {
                x: box.x,
                y: box.y + i * Math.floor((box.cy + gap) / 2),
                cx: box.cx,
                cy: Math.floor((box.cy - gap) / 2),
              };
          const fitted = fitBoxMaintainingAspectRatio(cell, item.dims);
          shapes.push(
            buildOpenXmlPictureShape({
              id: shapeId++,
              rId: item.rId,
              name: `SlideGraphic_${i + 1}`,
              ...fitted,
            })
          );
        });
        return;
      }
      const gap = 90000;
      const cellW = Math.floor((box.cx - gap) / 2);
      const cellH = Math.floor((box.cy - gap) / 2);
      slideImageItems.slice(0, 4).forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cell = {
          x: box.x + col * (cellW + gap),
          y: box.y + row * (cellH + gap),
          cx: cellW,
          cy: cellH,
        };
        const fitted = fitBoxMaintainingAspectRatio(cell, item.dims);
        shapes.push(
          buildOpenXmlPictureShape({
            id: shapeId++,
            rId: item.rId,
            name: `SlideGraphic_${i + 1}`,
            ...fitted,
          })
        );
      });
    };

    if (style === 'gde-2026-navy') {
      // ---------------------------------------------------------------------
      // TEMPLATE 1: 2026 GDE BRAND GUIDE · NAVY EDITORIAL & GRAPHICS (#20344B)
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
          y: 200000,
          cx: 10912000,
          cy: 280000,
          fillHex: '#20344B',
          paragraphs: [
            {
              text: `< > Google Developer Experts   //   { ${slide.sectionTag.toUpperCase()} }                { # }   //   O O O`,
              fontSizePt: 10.5,
              bold: true,
              colorHex: '#57CAFF',
              fontFace: 'PT Mono',
            },
          ],
        })
      );

      const isVisualOnly =
        Boolean(slide.isVisualOnlySlide) ||
        (!slide.title.trim() && slide.cards.length === 0 && hasVisual);
      const isHeadlinePlusFullVisual =
        !isVisualOnly && slide.cards.length === 0 && hasVisual;
      const isSingleCaptionChartSlide =
        !isVisualOnly &&
        slide.cards.length === 1 &&
        hasVisual &&
        slide.cards[0].bullets.length <= 1 &&
        (slide.cards[0].heading.length + (slide.cards[0].bullets[0]?.length || 0) <= 140);

      if (isVisualOnly) {
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'FullVisualFrameBg',
            x: 640000,
            y: 560000,
            cx: 10912000,
            cy: 5620000,
            fillHex: '#162536',
            borderHex: '#57CAFF',
            roundRect: true,
          })
        );
        pushFittedSlidePictures({
          x: 780000,
          y: 680000,
          cx: 10632000,
          cy: 5380000,
        });
      } else if (isHeadlinePlusFullVisual) {
        const headlineParas: Array<{
          text: string;
          fontSizePt: number;
          bold?: boolean;
          colorHex: string;
          fontFace?: string;
        }> = [
          {
            text: slide.title,
            fontSizePt: slide.title.length > 58 ? 24 : 28,
            bold: true,
            colorHex: '#FF7DAF',
            fontFace: brand.headingFont,
          },
        ];
        if (slide.subtitle && slide.subtitle.trim()) {
          headlineParas.push({
            text: slide.subtitle,
            fontSizePt: 13,
            bold: false,
            colorHex: '#CBD5E1',
            fontFace: brand.bodyFont,
          });
        }
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'HalftonePinkHeadline',
            x: 640000,
            y: 540000,
            cx: 10912000,
            cy: 980000,
            fillHex: '#20344B',
            paragraphs: headlineParas,
          })
        );
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'VisualFrameBg',
            x: 640000,
            y: 1600000,
            cx: 10912000,
            cy: 4580000,
            fillHex: '#162536',
            borderHex: '#57CAFF',
            roundRect: true,
          })
        );
        pushFittedSlidePictures({
          x: 780000,
          y: 1720000,
          cx: 10632000,
          cy: 4340000,
        });
      } else if (isSingleCaptionChartSlide) {
        const singleCard = slide.cards[0];
        const captionLine = singleCard.bullets[0]
          ? `${singleCard.heading}: ${singleCard.bullets[0]}`
          : singleCard.heading;
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'HalftonePinkHeadline',
            x: 640000,
            y: 540000,
            cx: 10912000,
            cy: 960000,
            fillHex: '#20344B',
            paragraphs: [
              {
                text: slide.title,
                fontSizePt: slide.title.length > 58 ? 23 : 27,
                bold: true,
                colorHex: '#FF7DAF',
                fontFace: brand.headingFont,
              },
              {
                text: captionLine,
                fontSizePt: 13,
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
            name: 'ChartVisualFrameBg',
            x: 640000,
            y: 1580000,
            cx: 10912000,
            cy: 4600000,
            fillHex: '#162536',
            borderHex: '#57CAFF',
            roundRect: true,
          })
        );
        pushFittedSlidePictures({
          x: 780000,
          y: 1700000,
          cx: 10632000,
          cy: 4360000,
        });
      } else {
        const headlineParas: Array<{
          text: string;
          fontSizePt: number;
          bold?: boolean;
          colorHex: string;
          fontFace?: string;
        }> = [
          {
            text: slide.title,
            fontSizePt: slide.title.length > 62 ? 23 : 27,
            bold: true,
            colorHex: '#FF7DAF',
            fontFace: brand.headingFont,
          },
        ];
        if (slide.subtitle && slide.subtitle.trim()) {
          headlineParas.push({
            text: slide.subtitle,
            fontSizePt: 13,
            bold: false,
            colorHex: '#CBD5E1',
            fontFace: brand.bodyFont,
          });
        }
        shapes.push(
          buildOpenXmlRectShape({
            id: shapeId++,
            name: 'HalftonePinkHeadline',
            x: 640000,
            y: 540000,
            cx: 10912000,
            cy: 1120000,
            fillHex: '#20344B',
            paragraphs: headlineParas,
          })
        );

        const leftW = hasVisual ? 5450000 : 10912000;
        const accentColors = ['#57CAFF', '#5CDB6D', '#FFD427'];
        const activeCards = slide.cards.slice(0, 3);
        const cardCount = Math.max(1, activeCards.length);
        const availH = 4320000;
        const slotH = Math.floor(availH / cardCount);

        activeCards.forEach((card, cIdx) => {
          const blockY = 1780000 + cIdx * slotH;
          const barClr = accentColors[cIdx % accentColors.length];
          const bulletCount = card.bullets.length;
          const bulletPt =
            bulletCount >= 7 ? 9.5 : bulletCount >= 4 ? 10.5 : bulletCount >= 2 ? 11.5 : 12.5;
          const headPt = bulletCount >= 6 ? 12.5 : 14;

          shapes.push(
            buildOpenXmlRectShape({
              id: shapeId++,
              name: `EditorialAccentBar_${cIdx + 1}`,
              x: 640000,
              y: blockY + 35000,
              cx: 45000,
              cy: Math.max(400000, slotH - 150000),
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
              cy: Math.max(460000, slotH - 80000),
              fillHex: '#20344B',
              paragraphs: [
                ...(card.heading || card.metric
                  ? [
                      {
                        text: `${card.heading}${card.metric ? `${card.heading ? '  ' : ''}(${card.metric})` : ''}`,
                        fontSizePt: headPt,
                        bold: true,
                        colorHex: barClr,
                        fontFace: 'PT Mono',
                      },
                    ]
                  : []),
                ...card.bullets.map((b) => ({
                  text: b,
                  fontSizePt: bulletPt,
                  bold: false,
                  colorHex: '#FFFFFF',
                  fontFace: brand.bodyFont,
                })),
              ],
            })
          );
        });

        if (hasVisual) {
          shapes.push(
            buildOpenXmlRectShape({
              id: shapeId++,
              name: 'VisualFrameBg',
              x: 6350000,
              y: 1780000,
              cx: 5202000,
              cy: 4360000,
              fillHex: '#162536',
              borderHex: '#57CAFF',
              roundRect: true,
            })
          );
          pushFittedSlidePictures({
            x: 6450000,
            y: 1880000,
            cx: 5002000,
            cy: 4160000,
          });
        }
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

      const copyParagraphs = slide.cards.flatMap((c) => {
        if (c.bullets.length === 0) {
          return [
            {
              text: c.heading,
              fontSizePt: 13.5,
              bold: false,
              colorHex: '#20344B',
              fontFace: brand.bodyFont,
            },
          ];
        }
        return c.bullets.map((b) => ({
          text: `${c.heading}: ${b}`,
          fontSizePt: 12.5,
          bold: false,
          colorHex: '#20344B',
          fontFace: brand.bodyFont,
        }));
      });

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
              text: slide.title || `Slide ${slideNum}`,
              fontSizePt: 26,
              bold: true,
              colorHex: '#20344B',
              fontFace: brand.headingFont,
            },
            ...(slide.subtitle
              ? [
                  {
                    text: slide.subtitle,
                    fontSizePt: 13,
                    bold: true,
                    colorHex: '#4285F4',
                    fontFace: brand.bodyFont,
                  },
                ]
              : []),
            ...copyParagraphs,
          ],
        })
      );

      if (hasVisual) {
        pushFittedSlidePictures({
          x: 5400000,
          y: 780000,
          cx: 6150000,
          cy: 5130000,
        });
      } else {
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
      }

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
              text: slide.title || `Slide ${slideNum}`,
              fontSizePt: 26,
              bold: true,
              colorHex: '#FFFFFF',
              fontFace: brand.headingFont,
            },
            ...(slide.subtitle
              ? [
                  {
                    text: slide.subtitle,
                    fontSizePt: 13,
                    bold: false,
                    colorHex: '#9CA3AF',
                    fontFace: brand.bodyFont,
                  },
                ]
              : []),
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

      if (hasVisual) {
        pushFittedSlidePictures({
          x: 4950000,
          y: 420000,
          cx: 6750000,
          cy: slide.cards.length === 0 ? 5800000 : 2950000,
        });
      }

      const startY = hasVisual ? 3580000 : 620000;
      const rowH = hasVisual ? 880000 : 1720000;
      const rowGap = hasVisual ? 110000 : 220000;

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
              ...card.bullets.map((b) => ({
                text: b,
                fontSizePt: 11,
                colorHex: '#4B5563',
                fontFace: brand.bodyFont,
              })),
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
              text: slide.title || `Slide ${slideNum}`,
              fontSizePt: 26,
              bold: true,
              colorHex: '#F8FAFC',
              fontFace: brand.headingFont,
            },
            ...(slide.subtitle
              ? [
                  {
                    text: slide.subtitle,
                    fontSizePt: 13,
                    colorHex: '#94A3B8',
                    fontFace: brand.bodyFont,
                  },
                ]
              : []),
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
              ...card.bullets.map((b) => ({
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
          paragraphs: hasVisual
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

      if (hasVisual) {
        pushFittedSlidePictures({
          x: 6080000,
          y: 1700000,
          cx: 5402000,
          cy: 4100000,
        });
      }
    } else {
      // ---------------------------------------------------------------------
      // TEMPLATE 3 & KEEP EXISTING / UPLOADED CUSTOM: HORIZONTAL BLUEPRINT + VISUAL
      // ---------------------------------------------------------------------
      const bgHex = brand.lightBgHex || '#F8FAFD';
      const isVisualOnlyCustom =
        Boolean(slide.isVisualOnlySlide) ||
        (!slide.title.trim() && slide.cards.length === 0 && hasVisual);
      const isSingleCaptionChartCustom =
        !isVisualOnlyCustom &&
        slide.cards.length === 1 &&
        hasVisual &&
        slide.cards[0].bullets.length <= 1 &&
        slide.cards[0].heading.length + (slide.cards[0].bullets[0]?.length || 0) <= 140;

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

      if (isVisualOnlyCustom) {
        pushFittedSlidePictures({
          x: 580000,
          y: 360000,
          cx: 11032000,
          cy: 5760000,
        });
      } else if (isSingleCaptionChartCustom) {
        const singleCard = slide.cards[0];
        const captionLine = singleCard.bullets[0]
          ? `${singleCard.heading}: ${singleCard.bullets[0]}`
          : singleCard.heading;
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
                fontSizePt: 25,
                bold: true,
                colorHex: brand.darkBgHex || '#0B1220',
                fontFace: brand.headingFont,
              },
              {
                text: captionLine,
                fontSizePt: 13,
                bold: true,
                colorHex: brand.primaryHex || '#0B57D0',
                fontFace: brand.bodyFont,
              },
            ],
          })
        );
        pushFittedSlidePictures({
          x: 580000,
          y: 1520000,
          cx: 11032000,
          cy: 4600000,
        });
      } else {
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
                text: slide.title || `Slide ${slideNum}`,
                fontSizePt: 25,
                bold: true,
                colorHex: brand.darkBgHex || '#0B1220',
                fontFace: brand.headingFont,
              },
              ...(slide.subtitle
                ? [
                    {
                      text: slide.subtitle,
                      fontSizePt: 13,
                      colorHex: '#475569',
                      fontFace: brand.bodyFont,
                    },
                  ]
                : []),
            ],
          })
        );

        const rowWidth = hasVisual ? 5450000 : 11032000;
        const rowAccents = [brand.primaryHex, brand.secondaryHex, brand.accentHex];
        slide.cards.slice(0, 3).forEach((card, cIdx) => {
          const rowY = 1520000 + cIdx * 1500000;
          const accentClr =
            brand.cardTitleColors?.[cIdx % (brand.cardTitleColors.length || 1)] ||
            rowAccents[cIdx % rowAccents.length] ||
            '#0B57D0';
          const rowFill =
            brand.cardBgTints?.[cIdx % (brand.cardBgTints.length || 1)] || '#FFFFFF';
          const bulletPt = card.bullets.length >= 6 ? 9.5 : card.bullets.length >= 3 ? 10.5 : 11;

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
                ...(card.heading || card.metric
                  ? [
                      {
                        text: `${card.heading}${card.metric ? `${card.heading ? '   ·   ' : ''}${card.metric}` : ''}`,
                        fontSizePt: 14,
                        bold: true,
                        colorHex: accentClr,
                        fontFace: brand.headingFont,
                      },
                    ]
                  : []),
                ...card.bullets.map((b) => ({
                  text: b,
                  fontSizePt: bulletPt,
                  colorHex: '#1E293B',
                  fontFace: brand.bodyFont,
                  bullet: true,
                })),
              ],
            })
          );
        });

        if (hasVisual) {
          pushFittedSlidePictures({
            x: slide.cards.length === 0 ? 580000 : 6280000,
            y: 1520000,
            cx: slide.cards.length === 0 ? 11032000 : 5332000,
            cy: 4340000,
          });
        }
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

    if (
      slide.codeSnippet &&
      slide.codeSnippet.trim() &&
      (style !== 'build-with-ai-terminal' || hasVisual)
    ) {
      const codeLines = slide.codeSnippet.replace(/\r\n/g, '\n').split('\n').slice(0, 22);
      shapes.push(
        buildOpenXmlRectShape({
          id: shapeId++,
          name: 'SlideInsertedCodeSnippet',
          x: 6150000,
          y: 1520000,
          cx: 5460000,
          cy: 4500000,
          fillHex: '#0F172A',
          borderHex: brand.primaryHex || '#3B82F6',
          roundRect: true,
          paragraphs: codeLines.map((line) => ({
            text: line || ' ',
            fontSizePt: 11,
            colorHex: '#E2E8F0',
            fontFace: 'Courier New',
          })),
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

    const noteParasXml = (slide.speakerNotes || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(
        (line) => `<a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1200" dirty="0"/>
              <a:t>${escapeXml(line)}</a:t>
            </a:r>
          </a:p>`
      )
      .join('\n          ');

    addXml(
      `ppt/notesSlides/notesSlide${slideNum}.xml`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Notes Placeholder"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr><p:ph type="body" idx="1"/></p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="685800" y="4343400"/><a:ext cx="5486400" cy="4114800"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          ${noteParasXml || '<a:p><a:endParaRPr lang="en-US" sz="1200"/></a:p>'}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:notes>`
    );

    addXml(
      `ppt/notesSlides/_rels/notesSlide${slideNum}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${slideNum}.xml"/>
</Relationships>`
    );

    addXml(
      `ppt/slides/_rels/slide${slideNum}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rIdNotes1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${slideNum}.xml"/>
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
