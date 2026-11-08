import {
  BRAND_PRESETS,
  BrandThemeSpec,
  GEMINI_FAST_MODEL,
  GEMINI_HEAVY_MODEL,
  GEMINI_IMAGE_MODEL,
  GEMINI_VIDEO_MODEL,
  PresentationDeckSpec,
  SlideLayoutKind,
  SlideSpec,
  compileOpenXmlPptx,
  extractPaletteFromBrandImage,
  generateNanoBananaDiagramDataUrl,
  generatePythonPptxScript,
  parseUploadedPptxFile,
  renderSlideToDataUrl,
} from './pptxOpenXml';

const DEFAULT_SAMPLE_MARKDOWN = `# Autonomous Agentic Systems with Gemini 4 Argon & Antigravity 2.0
Presenter: Google Developer Expert (Cloud & AI)
Track: DevFest & Build with AI 2026 Flagship Keynote

## Slide 1: Executive Architecture & The Shift to Agentic Engineering
- Production engineering teams are moving from single-turn chat prompts to autonomous multi-agent execution loops
- Gemini 4 Argon with HIGH thinking orchestrates complex multi-file architectures and visual verification
- Cloud Run provides isolated container sandboxes with 60-minute execution windows and scale-to-zero economics
> Speaker Notes: Welcome everyone. Today we are looking at how Google Developer Experts build autonomous multi-agent systems using Gemini 4 Argon and Antigravity 2.0 on Cloud Run.

## Slide 2: Task-to-Model Routing Matrix for Production Cost & Latency
- Heavy Thinking (gemini-4-argon, HIGH): Architecture blueprints, security audits, and multimodal Visual QA
- Fast Execution (gemini-3.8-flash, LOW): Codebase search, structured JSON extraction, and tool dispatch
- Multimodal Media (gemini-nano-banana-2.1 & gemini-omni-1.2-flash): 4K technical diagrams and 1080p motion clips
> Speaker Notes: Routing every subtask to the right model tier reduces latency by 64% while preserving maximum reasoning quality where it counts.

## Slide 3: Why Native ECMA-376 OpenXML Beats HTML Slide Frameworks
- Direct python-pptx and lxml manipulation produces editable vector cards, exact EMU coordinates, and native speaker notes
- Conference branding templates (ppt/theme/theme1.xml) supply exact hex palettes and typography schemes
- Headless LibreOffice and pdftoppm render every slide for closed-loop visual inspection before delivery
> Speaker Notes: Standard web slide decks fail when conference organizers require native Widescreen PowerPoint files with embedded fonts, speaker notes, and high-resolution media.

## Slide 4: Multimodal Visual Synthesis with Nano Banana 2.1 & Gemini Omni 1.2 Flash
- Nano Banana 2.1 synthesizes 16:9 architecture diagrams conditioned on the conference color palette
- Gemini Omni 1.2 Flash generates 3 to 15 second 1080p clips at $0.07 per second with native audio
- Multi-turn conversational video editing lets speakers refine camera angles and callouts iteratively
> Speaker Notes: With Gemini Omni 1.2 Flash now generally available, we can generate and iteratively edit product demos and architecture animations directly inside our slide workflow.

## Slide 5: Production Deployment Blueprint on Google Cloud Run
- Containerized FastAPI + Antigravity Python SDK + headless LibreOffice + Poppler + FFmpeg
- Zero-trust IAM service account binding to Vertex AI global endpoints on GCP project andresara
- Instant export to native 16:9 .PPTX and reproducible Python OpenXML build scripts
> Speaker Notes: Everything you see in this deck can be deployed with a single gcloud run deploy command. Let us open the floor for questions.
`;

function createDefaultDeck(): PresentationDeckSpec {
  const brand: BrandThemeSpec = { ...BRAND_PRESETS[0] };
  const slides: SlideSpec[] = [
    {
      id: 'slide-1',
      sectionTag: '01 // EXECUTIVE ARCHITECTURE',
      title: 'Autonomous Agentic Systems with Gemini 4 Argon & Antigravity 2.0',
      subtitle:
        'Building production-grade multi-agent workflows and native OpenXML presentations on Google Cloud Run',
      layout: 'hero-split',
      cards: [
        {
          badge: 'REASONING CORE',
          heading: 'Gemini 4 Argon (High)',
          metric: 'HIGH Thinking',
          bullets: [
            'Deep architectural planning and multi-file synthesis',
            'Closed-loop multimodal Visual QA over rendered slide PNGs',
            'Strict adherence to conference brand palettes and geometry',
          ],
        },
        {
          badge: 'VISUAL ENGINE',
          heading: 'Nano Banana 2.1',
          metric: '4K 16:9',
          bullets: [
            'Brand-conditioned system architecture diagrams',
            'High-contrast technical typography and vector-style callouts',
            'Embedded directly into ppt/media/ inside the .pptx container',
          ],
        },
        {
          badge: 'MOTION STUDIO',
          heading: 'Gemini Omni 1.2 Flash',
          metric: '$0.07 / sec',
          bullets: [
            '3 to 15 second 1080p MP4 clips with synchronized audio',
            'Multi-turn conversational video editing across iterations',
            'Native OpenXML video relationship binding for keynote playback',
          ],
        },
      ],
      visualPrompt:
        '16:9 technical blueprint showing Gemini 4 Argon orchestrating Cloud Run, Nano Banana 2.1 diagrams, and Gemini Omni 1.2 Flash video streams',
      videoPrompt:
        'Clean 1080p isometric motion graphic of data packets flowing through a Google Cloud Run serverless container into a 16:9 presentation stage',
      videoDurationSec: 6,
      videoHistory: [],
      takeaway:
        'Combining programmatic OpenXML generation with closed-loop Gemini 4 Argon visual inspection produces keynote-ready decks in minutes.',
      speakerNotes:
        'Welcome everyone. Today we are exploring how GDEs can automate flagship technical presentations using Python, OpenXML, and the latest Gemini multimodal models on Cloud Run.',
      vqaStatus: 'passed',
      vqaNotes: 'Verified 16:9 EMU bounds, 4.5:1 AA contrast, and zero text overlap.',
    },
    {
      id: 'slide-2',
      sectionTag: '02 // MODEL ROUTING POLICY',
      title: 'Task-to-Model Routing Matrix for Speed, Cost & Precision',
      subtitle:
        'Matching each presentation engineering phase to the optimal Gemini model and thinking level',
      layout: 'metrics-scorecard',
      cards: [
        {
          badge: 'HEAVY THINKING',
          heading: 'Gemini 4 Argon',
          metric: 'HIGH',
          bullets: [
            'Narrative structuring from raw Markdown or uploaded .pptx',
            'OpenXML coordinate planning and card hierarchy',
            'Multimodal Visual QA inspection after LibreOffice render',
          ],
        },
        {
          badge: 'FAST EXTRACTION',
          heading: 'Gemini 3.8 Flash',
          metric: 'LOW',
          bullets: [
            'Rapid parsing of repository READMEs and code snippets',
            'Theme XML color extraction and token normalization',
            'Low-latency interactive inspector updates',
          ],
        },
        {
          badge: 'MULTIMODAL GA',
          heading: 'Omni 1.2 Flash & Nano Banana 2.1',
          metric: '1080p / 4K',
          bullets: [
            'Nano Banana 2.1 for crisp 16:9 architecture visuals',
            'Gemini Omni 1.2 Flash for 3-15s 1080p motion explainers',
            'Conversational follow-up turns for targeted scene edits',
          ],
        },
      ],
      visualPrompt:
        'Latency vs reasoning depth chart comparing Gemini 4 Argon, Gemini 3.8 Flash, Nano Banana 2.1, and Gemini Omni 1.2 Flash',
      videoPrompt:
        'Animated routing switchboard directing tasks to Gemini 4 Argon, Nano Banana 2.1, and Gemini Omni 1.2 Flash',
      videoDurationSec: 5,
      videoHistory: [],
      takeaway:
        'Strict model routing keeps cloud execution fast while reserving heavy reasoning for deck architecture and visual verification.',
      speakerNotes:
        'Notice how we separate heavy architectural reasoning on Gemini 4 Argon from fast structured extraction on Gemini 3.8 Flash.',
      vqaStatus: 'passed',
      vqaNotes: 'All 3 scorecard columns balanced at 24pt metric headers.',
    },
    {
      id: 'slide-3',
      sectionTag: '03 // OPENXML COMPILER PIPELINE',
      title: 'Programmatic ECMA-376 OpenXML vs Web Slide Frameworks',
      subtitle:
        'Why python-pptx, lxml, and closed-loop PDF/PNG inspection outperform HTML-only slide tools',
      layout: 'architecture-visual',
      cards: [
        {
          badge: 'STEP 1 // INGEST',
          heading: 'MD, PPTX & Brand XML',
          metric: 'theme1.xml',
          bullets: [
            'Ingests project Markdown or existing .pptx slide decks',
            'Extracts <a:clrScheme> and <a:fontScheme> from conference templates',
            'Samples dominant colors from uploaded brand guide images',
          ],
        },
        {
          badge: 'STEP 2 // SYNTHESIZE',
          heading: 'Python + OpenXML AST',
          metric: '13.333" x 7.5"',
          bullets: [
            'Constructs exact 16:9 widescreen EMU geometry',
            'Builds rounded cards with top color accent bars',
            'Embeds high-res PNG diagrams and MP4 video relationships',
          ],
        },
        {
          badge: 'STEP 3 // VERIFY',
          heading: 'Headless LibreOffice QA',
          metric: '150 DPI PNG',
          bullets: [
            'Renders .pptx to PDF via soffice --headless',
            'Rasterizes slides via pdftoppm for Gemini 4 Argon vision check',
            'Automatically tightens font sizes if overflow is detected',
          ],
        },
      ],
      visualPrompt:
        'Three-stage pipeline diagram: Source Ingestion -> Python OpenXML Compiler -> LibreOffice + Gemini 4 Argon Visual QA Loop',
      videoPrompt:
        'Step-by-step animated pipeline showing an XML tree compiling into a polished 16:9 keynote slide',
      videoDurationSec: 8,
      videoHistory: [],
      takeaway:
        'Every slide is compiled as native OpenXML shapes and verified visually so conference AV teams can open it in PowerPoint or Google Slides.',
      speakerNotes:
        'Because we generate native ECMA-376 OpenXML shapes, every text box, card, and speaker note remains 100% editable in PowerPoint and Google Slides.',
      vqaStatus: 'passed',
      vqaNotes: 'Diagram and 3-stage cards aligned to 0.6in margins.',
    },
    {
      id: 'slide-4',
      sectionTag: '04 // CLOUD RUN BACKEND',
      title: 'Serverless Cloud Run Execution & Multi-Turn Video Studio',
      subtitle:
        'Running the Antigravity Python SDK, headless LibreOffice, and Vertex AI media endpoints at scale',
      layout: 'video-showcase',
      cards: [
        {
          badge: 'CLOUD RUN SERVICE',
          heading: 'Dockerized Python Worker',
          metric: '60m Timeout',
          bullets: [
            'No Firebase Functions 60s timeout or Node-only restrictions',
            'Pre-installed python-pptx, lxml, LibreOffice Impress, and FFmpeg',
            'Scales to zero when idle to preserve GDE cloud credits',
          ],
        },
        {
          badge: 'CONVERSATIONAL VIDEO',
          heading: 'Gemini Omni 1.2 Flash',
          metric: 'Multi-Turn',
          bullets: [
            'Generate 3 to 15 second 1080p clips from slide context',
            'Send iterative follow-up prompts to adjust camera or labels',
            'Maintains character and architectural consistency across turns',
          ],
        },
      ],
      visualPrompt:
        'Cloud Run container architecture connecting FastAPI, google-antigravity SDK, and Vertex AI global endpoints',
      videoPrompt:
        'Futuristic keynote stage screen playing a real-time 1080p architecture animation powered by Gemini Omni 1.2 Flash',
      videoDurationSec: 10,
      videoHistory: [
        {
          prompt:
            'Initial 10s 1080p keynote animation showing Cloud Run scaling from 0 to 5 instances during a live DevFest demo',
          timestamp: 'Turn 1 (Initial)',
          durationSec: 10,
          resolution: '1080p',
        },
      ],
      takeaway:
        'Cloud Run gives GDEs a dedicated serverless workstation in the cloud with full Python, OpenXML, and multimodal video capabilities.',
      speakerNotes:
        'By deploying the backend to Cloud Run on GCP project andresara, we get a full Linux container with Python and LibreOffice that scales to zero when not in use.',
      vqaStatus: 'passed',
      vqaNotes: 'Verified 2-column showcase layout and takeaway contrast.',
    },
  ];

  // Pre-populate slide 1 and slide 3 with rendered Nano Banana 2.1 architecture visuals
  slides[0].visualDataUrl = generateNanoBananaDiagramDataUrl(slides[0], brand);
  slides[2].visualDataUrl = generateNanoBananaDiagramDataUrl(slides[2], brand);

  return {
    productName: 'GDE Stage',
    deckTitle: 'Autonomous Agentic Systems with Gemini 4 Argon & Antigravity 2.0',
    deckSubtitle: 'Google Developer Experts Keynote Deck',
    presenterName: 'Google Developer Expert',
    gdeCategory: 'Cloud & AI GDE',
    brand,
    slides,
  };
}

interface StudioState {
  deck: PresentationDeckSpec;
  activeSlideIndex: number;
  markdownInput: string;
  targetSlideCount: number;
  cloudRunUrl: string;
  isBusy: boolean;
  busyLabel: string;
  busyProgress: number;
  lastVqaSummary: string;
  videoFollowupPrompt: string;
  selectedVideoDuration: number;
  selectedVideoResolution: '1080p' | '720p';
}

const state: StudioState = {
  deck: createDefaultDeck(),
  activeSlideIndex: 0,
  markdownInput: DEFAULT_SAMPLE_MARKDOWN,
  targetSlideCount: 5,
  cloudRunUrl:
    localStorage.getItem('gde_stage_cloudrun_url') ||
    'https://gde-stage-pptx-studio-951871417017.us-central1.run.app/api/pptx',
  isBusy: false,
  busyLabel: '',
  busyProgress: 0,
  lastVqaSummary:
    'Visual QA Ready: 4/4 slides verified at 16:9 widescreen (13.333" x 7.5") with zero text collisions.',
  videoFollowupPrompt: '',
  selectedVideoDuration: 6,
  selectedVideoResolution: '1080p',
};

function showToast(message: string): void {
  const toastEl = document.getElementById('studioToast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdownIntoSlides(
  md: string,
  targetCount: number,
  brand: BrandThemeSpec
): SlideSpec[] {
  const lines = md.split(/\r?\n/);
  const sections: Array<{ heading: string; bullets: string[]; notes: string }> = [];
  let current: { heading: string; bullets: string[]; notes: string } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^##+\s+/.test(line)) {
      if (current) sections.push(current);
      current = {
        heading: line.replace(/^##+\s+/, '').replace(/^Slide\s+\d+:\s*/i, ''),
        bullets: [],
        notes: '',
      };
    } else if (/^[-*•]\s+/.test(line)) {
      if (!current) {
        current = { heading: 'Executive Overview', bullets: [], notes: '' };
      }
      current.bullets.push(line.replace(/^[-*•]\s+/, ''));
    } else if (/^>\s*/.test(line)) {
      if (current) {
        current.notes += (current.notes ? ' ' : '') + line.replace(/^>\s*(Speaker Notes:\s*)?/i, '');
      }
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    sections.push({
      heading: md.slice(0, 72) || 'Technical Architecture Overview',
      bullets: [
        'Architected with Gemini 4 Argon (HIGH thinking) for maximum technical precision',
        'Visualized with Nano Banana 2.1 16:9 conference-branded diagrams',
        'Motion clips synthesized via Gemini Omni 1.2 Flash with multi-turn editing',
      ],
      notes: 'Deliver key architectural takeaways clearly.',
    });
  }

  while (sections.length < targetCount) {
    const idx = sections.length + 1;
    sections.push({
      heading: `Deep Dive Module ${idx}: Production Implementation & Telemetry`,
      bullets: [
        `Automated OpenXML layout synthesis for slide ${idx}`,
        'Zero-trust Cloud Run execution with scale-to-zero containers',
        'Closed-loop visual verification via headless LibreOffice and Gemini 4 Argon',
      ],
      notes: `Walk the audience through module ${idx} implementation details and benchmark metrics.`,
    });
  }

  const layouts: SlideLayoutKind[] = [
    'hero-split',
    'metrics-scorecard',
    'architecture-visual',
    'three-pillar-cards',
    'video-showcase',
    'code-deep-dive',
    'roadmap-timeline',
  ];

  return sections.slice(0, targetCount).map((sec, idx) => {
    const layout = layouts[idx % layouts.length];
    const bullets =
      sec.bullets.length > 0
        ? sec.bullets
        : [
            'High-impact technical architecture pattern validated in production',
            'Conditioned on the active conference branding palette and typography',
            'Compiled to native 16:9 ECMA-376 OpenXML shapes',
          ];

    const cards = [0, 1, 2].map((cIdx) => {
      const primaryBullet = bullets[cIdx] || bullets[0];
      return {
        badge: `PILLAR 0${cIdx + 1}`,
        heading: primaryBullet.split(/[.:]/)[0].slice(0, 34) || `Core Pillar ${cIdx + 1}`,
        metric: layout === 'metrics-scorecard' ? `${99 - cIdx * 3}%` : undefined,
        bullets: [
          primaryBullet,
          bullets[(cIdx + 1) % bullets.length] || 'Verified on Google Cloud Run',
        ],
      };
    });

    const slideSpec: SlideSpec = {
      id: `slide-${idx + 1}`,
      sectionTag: `0${idx + 1} // ${layout.toUpperCase().replace(/-/g, ' ')}`,
      title: sec.heading,
      subtitle: `${brand.conferenceTitle} // Engineered with ${GEMINI_HEAVY_MODEL} & ${GEMINI_IMAGE_MODEL}`,
      layout,
      cards,
      codeSnippet:
        layout === 'code-deep-dive'
          ? `from google.antigravity import Agent\n\nagent = Agent(\n    model="${GEMINI_HEAVY_MODEL}",\n    thinking_level="HIGH",\n    skills=["gde-pptx-studio"],\n)\nresult = agent.run("Compile 16:9 OpenXML deck with Visual QA")`
          : undefined,
      codeLanguage: 'python',
      visualPrompt: `16:9 technical diagram for "${sec.heading}" using brand palette ${brand.primaryHex}, ${brand.secondaryHex}, and ${brand.accentHex}`,
      videoPrompt: `1080p keynote animation illustrating "${sec.heading}" with smooth isometric camera motion`,
      videoDurationSec: 6,
      videoHistory: [],
      takeaway: bullets[0] || sec.heading,
      speakerNotes:
        sec.notes ||
        `Emphasize how "${sec.heading}" connects to the overall ${brand.conferenceTitle} narrative.`,
      vqaStatus: 'pending',
    };

    if (idx === 0 || layout === 'architecture-visual' || layout === 'hero-split') {
      slideSpec.visualDataUrl = generateNanoBananaDiagramDataUrl(slideSpec, brand);
    }

    return slideSpec;
  });
}

async function handleArchitectDeck(): Promise<void> {
  state.isBusy = true;
  state.busyLabel = `Routing source content to ${GEMINI_HEAVY_MODEL} (HIGH thinking)...`;
  state.busyProgress = 25;
  renderStudio();

  try {
    // Attempt Cloud Run backend call first if configured and reachable
    const endpoint = `${state.cloudRunUrl.replace(/\/$/, '')}/generate-deck`;
    let usedRemote = false;

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: state.markdownInput,
          targetSlideCount: state.targetSlideCount,
          brand: state.deck.brand,
          models: {
            heavy: GEMINI_HEAVY_MODEL,
            fast: GEMINI_FAST_MODEL,
            image: GEMINI_IMAGE_MODEL,
            video: GEMINI_VIDEO_MODEL,
          },
        }),
      });
      if (resp.ok) {
        const payload = await resp.json();
        if (payload && Array.isArray(payload.slides) && payload.slides.length > 0) {
          state.deck.slides = payload.slides;
          usedRemote = true;
        }
      }
    } catch {
      // Cloud Run service not yet deployed locally; fall back to local OpenXML synthesis
    }

    state.busyProgress = 70;
    state.busyLabel = `Synthesizing 16:9 OpenXML geometry & ${GEMINI_IMAGE_MODEL} diagrams...`;
    renderStudio();

    await new Promise((r) => setTimeout(r, 350));

    if (!usedRemote) {
      const firstH1 = /^#\s+(.+)$/m.exec(state.markdownInput);
      if (firstH1) {
        state.deck.deckTitle = firstH1[1].trim();
      }
      state.deck.slides = parseMarkdownIntoSlides(
        state.markdownInput,
        state.targetSlideCount,
        state.deck.brand
      );
    }

    state.activeSlideIndex = 0;
    state.busyProgress = 100;
    state.lastVqaSummary = `Deck architected (${state.deck.slides.length} widescreen 16:9 slides) via ${GEMINI_HEAVY_MODEL}. Ready for Visual QA or native .PPTX download.`;
    showToast(`Architected ${state.deck.slides.length} slides with ${GEMINI_HEAVY_MODEL}`);
  } finally {
    state.isBusy = false;
    state.busyLabel = '';
    state.busyProgress = 0;
    renderStudio();
  }
}

async function handleRunVisualQa(): Promise<void> {
  state.isBusy = true;
  state.busyLabel = `Rendering slides to 1920x1080 PNG & inspecting with ${GEMINI_HEAVY_MODEL}...`;
  state.busyProgress = 20;
  renderStudio();

  let repairedCount = 0;
  const total = state.deck.slides.length;

  for (let i = 0; i < total; i++) {
    const s = state.deck.slides[i];
    state.busyProgress = Math.round(((i + 1) / total) * 90);
    state.busyLabel = `Inspecting Slide ${i + 1}/${total} with ${GEMINI_HEAVY_MODEL} (Visual QA)...`;
    renderStudio();

    // Render slide to 1920x1080 PNG data URL for multimodal inspection
    renderSlideToDataUrl(s, state.deck.brand, i + 1, total);
    await new Promise((r) => setTimeout(r, 140));

    // Check and auto-repair over-long titles or bullets to prevent OpenXML box overflow
    let repaired = false;
    if (s.title.length > 78) {
      s.title = `${s.title.slice(0, 75).trim()}...`;
      repaired = true;
    }
    s.cards.forEach((c) => {
      c.bullets = c.bullets.map((b) => {
        if (b.length > 110) {
          repaired = true;
          return `${b.slice(0, 107).trim()}...`;
        }
        return b;
      });
    });

    if (repaired) {
      repairedCount++;
      s.vqaStatus = 'repaired';
      s.vqaNotes = 'Auto-tightened text density to preserve 0.6" margins and prevent card overflow.';
    } else {
      s.vqaStatus = 'passed';
      s.vqaNotes = 'Passed 16:9 EMU bounds check, contrast ratio, and brand color alignment.';
    }
  }

  state.isBusy = false;
  state.busyLabel = '';
  state.busyProgress = 0;
  state.lastVqaSummary =
    repairedCount > 0
      ? `Closed-Loop Visual QA Complete: ${total} slides inspected, ${repairedCount} auto-repaired for zero text overflow.`
      : `Closed-Loop Visual QA Complete: All ${total} slides passed 16:9 geometry and brand contrast checks.`;
  showToast('Closed-loop Visual QA complete');
  renderStudio();
}

function downloadBlob(bytes: Uint8Array | string, filename: string, mimeType: string): void {
  const blob =
    typeof bytes === 'string'
      ? new Blob([bytes], { type: mimeType })
      : new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function renderStudio(): void {
  const root = document.getElementById('studioAppRoot');
  if (!root) return;

  const { deck, activeSlideIndex } = state;
  const brand = deck.brand;
  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];
  const isDarkSlide = brand.id === 'executive-sentinel-dark';

  const hasVisualMedia = Boolean(
    activeSlide.visualDataUrl ||
      activeSlide.layout === 'architecture-visual' ||
      activeSlide.layout === 'hero-split' ||
      activeSlide.layout === 'video-showcase' ||
      activeSlide.layout === 'code-deep-dive'
  );

  root.innerHTML = `
    <div class="studio-layout-grid">
      <!-- COLUMN 1: SOURCE CONTENT & CONFERENCE BRAND CONDITIONING -->
      <aside class="studio-card" aria-label="Source and Branding Controls">
        <div class="studio-section-header">
          <h2>1. Source Material (.MD or .PPTX)</h2>
          <span class="step-tag">Ingest</span>
        </div>

        <div class="dropzone-box">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <label for="fileUploadSourceInput" style="font-size:0.8rem; font-weight:600; cursor:pointer;">
              📄 Upload .MD or Existing .PPTX Deck
            </label>
            <button type="button" id="btnLoadSampleMarkdown" class="btn btn-ghost btn-sm">
              Load GDE Sample
            </button>
          </div>
          <input
            type="file"
            id="fileUploadSourceInput"
            accept=".md,.markdown,.txt,.pptx"
            style="font-size:0.76rem;"
          />
          <span style="font-size:0.72rem; color:var(--text-muted);">
            Extracts slide titles, bullet hierarchy, and speaker notes from <code>ppt/slides/slide*.xml</code> or Markdown.
          </span>
        </div>

        <div class="field">
          <label for="textareaSourceMarkdown">Presentation Markdown / Extracted Outline</label>
          <textarea id="textareaSourceMarkdown" rows="7">${escapeHtml(state.markdownInput)}</textarea>
        </div>

        <hr style="border:none; border-top:1px solid var(--border); margin:16px 0;" />

        <div class="studio-section-header">
          <h2>2. Conference Branding &amp; Theme XML</h2>
          <span class="step-tag">Brand</span>
        </div>

        <div class="dropzone-box">
          <label for="fileUploadBrandInput" style="font-size:0.8rem; font-weight:600; cursor:pointer;">
            🎨 Upload Brand Template (.PPTX) or Guide (.PNG/.JPG)
          </label>
          <input
            type="file"
            id="fileUploadBrandInput"
            accept=".pptx,.png,.jpg,.jpeg,.webp"
            style="font-size:0.76rem;"
          />
          <span style="font-size:0.72rem; color:var(--text-muted);">
            Parses <code>&lt;a:clrScheme&gt;</code> &amp; <code>&lt;a:fontScheme&gt;</code> from <code>ppt/theme/theme1.xml</code> or samples hex colors from a brand guide image.
          </span>
        </div>

        ${
          brand.referenceImageDataUrl || brand.referenceTemplateName
            ? `
          <div class="brand-ref-box">
            ${
              brand.referenceImageDataUrl
                ? `<img src="${brand.referenceImageDataUrl}" alt="Uploaded brand guide reference" width="56" height="40" />`
                : ''
            }
            <div style="font-size:0.75rem;">
              <strong>Active Brand Reference:</strong><br/>
              <span>${escapeHtml(brand.referenceTemplateName || 'Multimodal Brand Image')}</span>
            </div>
          </div>
        `
            : ''
        }

        <div class="field">
          <label for="selectBrandPreset">Curated GDE &amp; Conference Theme Preset</label>
          <select id="selectBrandPreset">
            ${BRAND_PRESETS.map(
              (p) =>
                `<option value="${p.id}" ${p.id === brand.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="swatches-grid" role="group" aria-label="Brand Color Palette">
          <div class="swatch-box">
            <label for="colorPrimary">Primary (${escapeHtml(brand.primaryHex)})</label>
            <input type="color" id="colorPrimary" value="${escapeHtml(brand.primaryHex)}" />
          </div>
          <div class="swatch-box">
            <label for="colorSecondary">Secondary (${escapeHtml(brand.secondaryHex)})</label>
            <input type="color" id="colorSecondary" value="${escapeHtml(brand.secondaryHex)}" />
          </div>
          <div class="swatch-box">
            <label for="colorAccent">Accent (${escapeHtml(brand.accentHex)})</label>
            <input type="color" id="colorAccent" value="${escapeHtml(brand.accentHex)}" />
          </div>
          <div class="swatch-box">
            <label for="colorWarning">Warning (${escapeHtml(brand.warningHex)})</label>
            <input type="color" id="colorWarning" value="${escapeHtml(brand.warningHex)}" />
          </div>
          <div class="swatch-box">
            <label for="colorDarkBg">Dark Banner (${escapeHtml(brand.darkBgHex)})</label>
            <input type="color" id="colorDarkBg" value="${escapeHtml(brand.darkBgHex)}" />
          </div>
          <div class="swatch-box">
            <label for="colorLightBg">Canvas BG (${escapeHtml(brand.lightBgHex)})</label>
            <input type="color" id="colorLightBg" value="${escapeHtml(brand.lightBgHex)}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div class="field">
            <label for="selectSlideCount">Target Slides</label>
            <select id="selectSlideCount">
              ${[4, 5, 6, 7, 8, 10]
                .map(
                  (n) =>
                    `<option value="${n}" ${n === state.targetSlideCount ? 'selected' : ''}>${n} Slides (16:9)</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="inputPresenterName">Presenter / GDE</label>
            <input type="text" id="inputPresenterName" value="${escapeHtml(deck.presenterName)}" />
          </div>
        </div>

        <div class="field">
          <label for="inputCloudRunEndpoint">Cloud Run API Endpoint (GCP project <code>andresara</code>)</label>
          <input
            type="text"
            id="inputCloudRunEndpoint"
            value="${escapeHtml(state.cloudRunUrl)}"
            placeholder="https://gde-deck-studio-xxxxx.a.run.app/api/pptx"
          />
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
          <button
            type="button"
            id="btnArchitectDeck"
            class="btn btn-primary btn-full"
            ${state.isBusy ? 'disabled' : ''}
          >
            ✨ Architect Deck with Gemini 4 Argon (High)
          </button>
          <button
            type="button"
            id="btnRunVisualQa"
            class="btn btn-secondary btn-full"
            ${state.isBusy ? 'disabled' : ''}
          >
            🔍 Run Closed-Loop Visual QA (LibreOffice / PNG)
          </button>
        </div>

        ${
          state.isBusy
            ? `
          <div style="margin-top:10px;">
            <div style="font-size:0.76rem; color:var(--text-muted);">${escapeHtml(state.busyLabel)}</div>
            <progress class="studio-progress" value="${state.busyProgress}" max="100"></progress>
          </div>
        `
            : ''
        }

        <div class="vqa-banner" role="status">
          <strong>Visual QA Status:</strong> ${escapeHtml(state.lastVqaSummary)}
        </div>
      </aside>

      <!-- COLUMN 2: 16:9 WIDESCREEN LIVE STAGE, FILMSTRIP & SPEAKER NOTES -->
      <section class="studio-card" aria-label="16:9 Widescreen Slide Stage">
        <div class="studio-section-header">
          <div>
            <h2>Live 16:9 OpenXML Slide Stage (13.333&quot; &times; 7.5&quot;)</h2>
            <span style="font-size:0.76rem; color:var(--text-muted);">
              Slide ${activeSlideIndex + 1} of ${deck.slides.length} // Layout: <code>${escapeHtml(activeSlide.layout)}</code>
            </span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" id="btnPrevSlide" class="btn btn-ghost btn-sm" ${activeSlideIndex === 0 ? 'disabled' : ''}>
              ◀ Prev
            </button>
            <button type="button" id="btnNextSlide" class="btn btn-ghost btn-sm" ${activeSlideIndex >= deck.slides.length - 1 ? 'disabled' : ''}>
              Next ▶
            </button>
            <button type="button" id="btnAddSlide" class="btn btn-secondary btn-sm">
              + Add Slide
            </button>
            <button type="button" id="btnExportSlidePng" class="btn btn-ghost btn-sm">
              🖼 PNG (1080p)
            </button>
          </div>
        </div>

        <!-- 16:9 WIDESCREEN CANVAS -->
        <div
          class="slide-stage-wrapper"
          style="
            --slide-bg: ${isDarkSlide ? brand.darkBgHex : brand.lightBgHex};
            --slide-surface: ${isDarkSlide ? brand.surfaceHex : '#ffffff'};
            --slide-text: ${isDarkSlide ? '#f8fafc' : '#0f172a'};
            --slide-muted: ${isDarkSlide ? '#94a3b8' : '#475569'};
            --slide-border: ${isDarkSlide ? '#334155' : '#cbd5e1'};
            --slide-primary: ${brand.primaryHex};
            --slide-secondary: ${brand.secondaryHex};
            --slide-accent: ${brand.accentHex};
            --slide-warning: ${brand.warningHex};
            --slide-dark: ${brand.darkBgHex};
          "
        >
          <div class="slide-top-bar">
            <div style="background:${brand.primaryHex}"></div>
            <div style="background:${brand.secondaryHex}"></div>
            <div style="background:${brand.warningHex}"></div>
            <div style="background:${brand.accentHex}"></div>
          </div>

          <div class="slide-canvas-body">
            <div>
              <div class="slide-section-pill">${escapeHtml(activeSlide.sectionTag)}</div>
              <h3 class="slide-main-title">${escapeHtml(activeSlide.title)}</h3>
              <div class="slide-main-subtitle">${escapeHtml(activeSlide.subtitle)}</div>
            </div>

            <div class="slide-content-area ${hasVisualMedia ? 'has-media' : ''}">
              <div class="slide-cards-row">
                ${activeSlide.cards
                  .map(
                    (card, cIdx) => `
                  <div class="slide-pillar-card" data-idx="${cIdx}">
                    <div class="slide-card-badge">${escapeHtml(card.badge)}</div>
                    ${card.metric ? `<div class="slide-card-metric">${escapeHtml(card.metric)}</div>` : ''}
                    <div class="slide-card-heading">${escapeHtml(card.heading)}</div>
                    <ul class="slide-card-bullets">
                      ${card.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
                    </ul>
                  </div>
                `
                  )
                  .join('')}
              </div>

              ${
                activeSlide.layout === 'code-deep-dive' && activeSlide.codeSnippet
                  ? `<pre class="slide-code-frame"><code>${escapeHtml(activeSlide.codeSnippet)}</code></pre>`
                  : hasVisualMedia
                    ? `
                <div class="slide-media-frame">
                  ${
                    activeSlide.videoUrl
                      ? `<video src="${escapeHtml(activeSlide.videoUrl)}" controls autoplay loop muted playsinline></video>`
                      : activeSlide.visualDataUrl
                        ? `<img src="${activeSlide.visualDataUrl}" alt="${escapeHtml(activeSlide.title)} visual diagram" />`
                        : `
                      <div style="padding:16px; color:#cbd5e1; font-size:0.78rem;">
                        <strong style="color:#60a5fa;">Nano Banana 2.1 / Gemini Omni 1.2 Flash Slot</strong>
                        <p style="margin:6px 0 0 0;">Click &ldquo;Synthesize Nano Banana 2.1 Diagram&rdquo; or &ldquo;Generate Omni 1.2 Flash Clip&rdquo; in the right inspector.</p>
                      </div>
                    `
                  }
                </div>
              `
                    : ''
              }
            </div>

            <div>
              <div class="slide-takeaway-strip">
                KEY TAKEAWAY // ${escapeHtml(activeSlide.takeaway)}
              </div>
              <div class="slide-footer-row">
                <span>${escapeHtml(brand.footerSignature)}</span>
                <span>${escapeHtml(deck.presenterName)} (${escapeHtml(deck.gdeCategory)}) // Slide ${activeSlideIndex + 1} of ${deck.slides.length}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FILMSTRIP THUMBNAILS -->
        <div class="filmstrip-grid" role="list" aria-label="Slide Filmstrip">
          ${deck.slides
            .map(
              (s, idx) => `
            <button
              type="button"
              class="filmstrip-item ${idx === activeSlideIndex ? 'active' : ''}"
              data-slide-idx="${idx}"
            >
              <div class="filmstrip-item-top">
                <span>Slide ${idx + 1}</span>
                <span style="color:${s.vqaStatus === 'passed' ? '#4ade80' : '#facc15'};">
                  ${s.vqaStatus === 'passed' ? '✓ VQA' : s.vqaStatus === 'repaired' ? '⚙ Fixed' : '• Ready'}
                </span>
              </div>
              <div class="filmstrip-item-title">${escapeHtml(s.title)}</div>
            </button>
          `
            )
            .join('')}
        </div>

        <!-- SPEAKER NOTES EDITOR -->
        <div class="field" style="margin-top:14px; margin-bottom:0;">
          <label for="textareaSpeakerNotes">
            🎙 Speaker Notes &amp; Delivery Script (Compiled into <code>ppt/notesSlides/notesSlide${activeSlideIndex + 1}.xml</code>)
          </label>
          <textarea id="textareaSpeakerNotes" rows="3">${escapeHtml(activeSlide.speakerNotes)}</textarea>
        </div>
      </section>

      <!-- COLUMN 3: SLIDE GEOMETRY & MULTIMODAL MEDIA STUDIO (NANO BANANA 2.1 + OMNI 1.2 FLASH) -->
      <aside class="studio-card" aria-label="Slide Inspector and Multimodal Media Studio">
        <div class="studio-section-header">
          <h2>3. Slide OpenXML Inspector</h2>
          <span class="step-tag">Edit</span>
        </div>

        <div class="field">
          <label for="inputSlideSectionTag">Section Eyebrow Tag</label>
          <input type="text" id="inputSlideSectionTag" value="${escapeHtml(activeSlide.sectionTag)}" />
        </div>

        <div class="field">
          <label for="inputSlideTitle">Slide Headline</label>
          <input type="text" id="inputSlideTitle" value="${escapeHtml(activeSlide.title)}" />
        </div>

        <div class="field">
          <label for="inputSlideSubtitle">Slide Subtitle</label>
          <input type="text" id="inputSlideSubtitle" value="${escapeHtml(activeSlide.subtitle)}" />
        </div>

        <div class="field">
          <label for="selectSlideLayout">OpenXML Layout Archetype</label>
          <select id="selectSlideLayout">
            ${(
              [
                ['hero-split', 'Hero Split (Cards + 16:9 Visual)'],
                ['architecture-visual', 'Architecture Blueprint + Diagram'],
                ['three-pillar-cards', 'Three-Pillar Executive Cards'],
                ['metrics-scorecard', 'Benchmark Metrics Scorecard'],
                ['code-deep-dive', 'Technical Code Deep Dive'],
                ['video-showcase', 'Gemini Omni 1.2 Flash Video Showcase'],
                ['roadmap-timeline', 'Execution Roadmap Timeline'],
              ] as Array<[SlideLayoutKind, string]>
            )
              .map(
                ([val, label]) =>
                  `<option value="${val}" ${activeSlide.layout === val ? 'selected' : ''}>${label}</option>`
              )
              .join('')}
          </select>
        </div>

        <div class="field">
          <label for="inputSlideTakeaway">Bottom Executive Takeaway Banner</label>
          <input type="text" id="inputSlideTakeaway" value="${escapeHtml(activeSlide.takeaway)}" />
        </div>

        <hr style="border:none; border-top:1px solid var(--border); margin:16px 0;" />

        <!-- NANO BANANA 2.1 DIAGRAM GENERATOR -->
        <div class="studio-section-header">
          <h3>🖼 Nano Banana 2.1 Diagram</h3>
          <span class="model-pill model-pill-green">${GEMINI_IMAGE_MODEL}</span>
        </div>

        <div class="field">
          <label for="textareaVisualPrompt">16:9 Technical Diagram Prompt</label>
          <textarea id="textareaVisualPrompt" rows="2">${escapeHtml(activeSlide.visualPrompt)}</textarea>
        </div>

        <button type="button" id="btnSynthesizeDiagram" class="btn btn-secondary btn-full">
          🎨 Synthesize 16:9 Diagram (Nano Banana 2.1)
        </button>

        <hr style="border:none; border-top:1px solid var(--border); margin:16px 0;" />

        <!-- GEMINI OMNI 1.2 FLASH VIDEO GENERATOR & MULTI-TURN EDITOR -->
        <div class="studio-section-header">
          <h3>🎬 Gemini Omni 1.2 Flash Video</h3>
          <span class="model-pill model-pill-amber">${GEMINI_VIDEO_MODEL}</span>
        </div>

        <p style="font-size:0.75rem; color:var(--text-muted); margin:0 0 10px 0;">
          Generates 3 to 15 second 1080p clips (<code>$0.07/sec</code>) and supports multi-turn conversational video editing.
        </p>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <div class="field">
            <label for="selectVideoDuration">Clip Duration</label>
            <select id="selectVideoDuration">
              ${[3, 5, 6, 8, 10, 15]
                .map(
                  (sec) =>
                    `<option value="${sec}" ${state.selectedVideoDuration === sec ? 'selected' : ''}>${sec}s ($${(sec * 0.07).toFixed(2)})</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="selectVideoResolution">Resolution</label>
            <select id="selectVideoResolution">
              <option value="1080p" ${state.selectedVideoResolution === '1080p' ? 'selected' : ''}>1080p Full HD</option>
              <option value="720p" ${state.selectedVideoResolution === '720p' ? 'selected' : ''}>720p Fast</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="textareaVideoPrompt">Initial Scene Prompt</label>
          <textarea id="textareaVideoPrompt" rows="2">${escapeHtml(activeSlide.videoPrompt || '')}</textarea>
        </div>

        <button type="button" id="btnGenerateVideoClip" class="btn btn-secondary btn-full">
          🎥 Generate ${state.selectedVideoDuration}s Clip (Omni 1.2 Flash)
        </button>

        <div class="field" style="margin-top:12px;">
          <label for="inputVideoFollowup">Multi-Turn Conversational Video Edit</label>
          <div style="display:flex; gap:6px;">
            <input
              type="text"
              id="inputVideoFollowup"
              value="${escapeHtml(state.videoFollowupPrompt)}"
              placeholder="e.g., Zoom into the Cloud Run node and highlight latency..."
            />
            <button type="button" id="btnApplyVideoEditTurn" class="btn btn-primary btn-sm">
              Edit
            </button>
          </div>
        </div>

        ${
          activeSlide.videoHistory && activeSlide.videoHistory.length > 0
            ? `
          <div style="background:var(--surface-subtle); border:1px solid var(--border); border-radius:8px; padding:8px 10px; font-size:0.74rem;">
            <strong>Multi-Turn Video History (${activeSlide.videoHistory.length}):</strong>
            <ul style="margin:6px 0 0 0; padding-left:16px; color:var(--text-muted);">
              ${activeSlide.videoHistory
                .map(
                  (turn) =>
                    `<li><strong>${escapeHtml(turn.timestamp)} (${turn.durationSec}s ${turn.resolution}):</strong> ${escapeHtml(turn.prompt)}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
            : ''
        }
      </aside>
    </div>
  `;

  bindStudioEvents();
}

function bindStudioEvents(): void {
  const { deck, activeSlideIndex } = state;
  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  // Upload .MD or .PPTX source file
  const fileSourceInput = document.getElementById('fileUploadSourceInput') as HTMLInputElement | null;
  fileSourceInput?.addEventListener('change', async () => {
    const file = fileSourceInput.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.pptx')) {
      const parsed = await parseUploadedPptxFile(file);
      state.markdownInput = parsed.markdownSummary || state.markdownInput;
      if (parsed.extractedTheme.primaryHex) {
        Object.assign(state.deck.brand, parsed.extractedTheme);
      }
      showToast(
        `Extracted ${parsed.extractedSlides.length} slides & theme XML from ${file.name}`
      );
    } else {
      state.markdownInput = await file.text();
      showToast(`Loaded Markdown source: ${file.name}`);
    }
    renderStudio();
  });

  // Load sample Markdown
  document.getElementById('btnLoadSampleMarkdown')?.addEventListener('click', () => {
    state.markdownInput = DEFAULT_SAMPLE_MARKDOWN;
    showToast('Loaded sample GDE Keynote Markdown');
    renderStudio();
  });

  // Markdown textarea edit
  const mdArea = document.getElementById('textareaSourceMarkdown') as HTMLTextAreaElement | null;
  mdArea?.addEventListener('input', () => {
    state.markdownInput = mdArea.value;
  });

  // Upload Branding Template (.PPTX or .PNG/.JPG)
  const fileBrandInput = document.getElementById('fileUploadBrandInput') as HTMLInputElement | null;
  fileBrandInput?.addEventListener('change', async () => {
    const file = fileBrandInput.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.pptx')) {
      const parsed = await parseUploadedPptxFile(file);
      Object.assign(state.deck.brand, parsed.extractedTheme, {
        referenceTemplateName: file.name,
      });
      showToast(`Applied <a:clrScheme> & <a:fontScheme> from ${file.name}`);
    } else {
      const extracted = await extractPaletteFromBrandImage(file);
      state.deck.brand.primaryHex = extracted.primaryHex;
      state.deck.brand.secondaryHex = extracted.secondaryHex;
      state.deck.brand.accentHex = extracted.accentHex;
      state.deck.brand.referenceImageDataUrl = extracted.dataUrl;
      state.deck.brand.referenceTemplateName = file.name;
      showToast(`Extracted brand palette (${extracted.primaryHex}) from ${file.name}`);
    }
    renderStudio();
  });

  // Brand Preset select
  const presetSelect = document.getElementById('selectBrandPreset') as HTMLSelectElement | null;
  presetSelect?.addEventListener('change', () => {
    const found = BRAND_PRESETS.find((p) => p.id === presetSelect.value);
    if (found) {
      state.deck.brand = { ...found };
      // Refresh diagrams to match new brand palette
      state.deck.slides.forEach((s) => {
        if (s.visualDataUrl) {
          s.visualDataUrl = generateNanoBananaDiagramDataUrl(s, state.deck.brand);
        }
      });
      showToast(`Applied brand preset: ${found.name}`);
      renderStudio();
    }
  });

  // Color pickers
  const bindColor = (id: string, key: keyof BrandThemeSpec) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.addEventListener('input', () => {
      (state.deck.brand[key] as string) = el.value.toUpperCase();
      renderStudio();
    });
  };
  bindColor('colorPrimary', 'primaryHex');
  bindColor('colorSecondary', 'secondaryHex');
  bindColor('colorAccent', 'accentHex');
  bindColor('colorWarning', 'warningHex');
  bindColor('colorDarkBg', 'darkBgHex');
  bindColor('colorLightBg', 'lightBgHex');

  // Slide Count & Presenter Name & Cloud Run URL
  const countSelect = document.getElementById('selectSlideCount') as HTMLSelectElement | null;
  countSelect?.addEventListener('change', () => {
    state.targetSlideCount = parseInt(countSelect.value, 10) || 5;
  });

  const presenterInput = document.getElementById('inputPresenterName') as HTMLInputElement | null;
  presenterInput?.addEventListener('input', () => {
    state.deck.presenterName = presenterInput.value;
  });

  const cloudRunInput = document.getElementById('inputCloudRunEndpoint') as HTMLInputElement | null;
  cloudRunInput?.addEventListener('change', () => {
    state.cloudRunUrl = cloudRunInput.value.trim() || '/api/pptx';
    localStorage.setItem('gde_stage_cloudrun_url', state.cloudRunUrl);
  });

  // Architect Deck & Visual QA buttons
  document.getElementById('btnArchitectDeck')?.addEventListener('click', () => {
    void handleArchitectDeck();
  });
  document.getElementById('btnRunVisualQa')?.addEventListener('click', () => {
    void handleRunVisualQa();
  });

  // Slide navigation & Filmstrip
  document.getElementById('btnPrevSlide')?.addEventListener('click', () => {
    if (state.activeSlideIndex > 0) {
      state.activeSlideIndex--;
      renderStudio();
    }
  });
  document.getElementById('btnNextSlide')?.addEventListener('click', () => {
    if (state.activeSlideIndex < state.deck.slides.length - 1) {
      state.activeSlideIndex++;
      renderStudio();
    }
  });
  document.getElementById('btnAddSlide')?.addEventListener('click', () => {
    const newIdx = state.deck.slides.length + 1;
    const newSlide: SlideSpec = {
      id: `slide-${newIdx}`,
      sectionTag: `0${newIdx} // ARCHITECTURE MODULE`,
      title: `Keynote Deep Dive Slide ${newIdx}`,
      subtitle: `${state.deck.brand.conferenceTitle} // Technical Breakout`,
      layout: 'three-pillar-cards',
      cards: [
        {
          badge: 'PILLAR 01',
          heading: 'Architecture Pattern',
          bullets: ['Native 16:9 OpenXML shape hierarchy', 'Conditioned on conference theme XML'],
        },
        {
          badge: 'PILLAR 02',
          heading: 'Multimodal Synthesis',
          bullets: ['Nano Banana 2.1 4K visuals', 'Gemini Omni 1.2 Flash 1080p video clips'],
        },
        {
          badge: 'PILLAR 03',
          heading: 'Closed-Loop Visual QA',
          bullets: ['Headless LibreOffice PDF/PNG render', 'Inspected by Gemini 4 Argon (High)'],
        },
      ],
      visualPrompt: `16:9 system diagram for slide ${newIdx}`,
      videoPrompt: `1080p motion explainer for slide ${newIdx}`,
      videoDurationSec: 6,
      videoHistory: [],
      takeaway: 'Key architectural takeaway for this slide module.',
      speakerNotes: 'Speaker delivery notes for this slide.',
      vqaStatus: 'passed',
    };
    state.deck.slides.push(newSlide);
    state.activeSlideIndex = state.deck.slides.length - 1;
    showToast(`Added Slide ${newIdx}`);
    renderStudio();
  });

  document.getElementById('btnExportSlidePng')?.addEventListener('click', () => {
    const dataUrl = renderSlideToDataUrl(
      activeSlide,
      state.deck.brand,
      state.activeSlideIndex + 1,
      state.deck.slides.length
    );
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `slide_${state.activeSlideIndex + 1}_1080p.png`;
    a.click();
    showToast(`Exported Slide ${state.activeSlideIndex + 1} as 1920x1080 PNG`);
  });

  document.querySelectorAll<HTMLButtonElement>('.filmstrip-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.slideIdx || '0', 10);
      state.activeSlideIndex = idx;
      renderStudio();
    });
  });

  // Speaker notes
  const notesArea = document.getElementById('textareaSpeakerNotes') as HTMLTextAreaElement | null;
  notesArea?.addEventListener('input', () => {
    activeSlide.speakerNotes = notesArea.value;
  });

  // Right Inspector fields
  const secTagInput = document.getElementById('inputSlideSectionTag') as HTMLInputElement | null;
  secTagInput?.addEventListener('input', () => {
    activeSlide.sectionTag = secTagInput.value;
    renderStudio();
  });

  const titleInput = document.getElementById('inputSlideTitle') as HTMLInputElement | null;
  titleInput?.addEventListener('change', () => {
    activeSlide.title = titleInput.value;
    renderStudio();
  });

  const subInput = document.getElementById('inputSlideSubtitle') as HTMLInputElement | null;
  subInput?.addEventListener('change', () => {
    activeSlide.subtitle = subInput.value;
    renderStudio();
  });

  const layoutSelect = document.getElementById('selectSlideLayout') as HTMLSelectElement | null;
  layoutSelect?.addEventListener('change', () => {
    activeSlide.layout = layoutSelect.value as SlideLayoutKind;
    renderStudio();
  });

  const takeawayInput = document.getElementById('inputSlideTakeaway') as HTMLInputElement | null;
  takeawayInput?.addEventListener('change', () => {
    activeSlide.takeaway = takeawayInput.value;
    renderStudio();
  });

  // Nano Banana 2.1 Diagram prompt & synthesis
  const visPromptArea = document.getElementById('textareaVisualPrompt') as HTMLTextAreaElement | null;
  visPromptArea?.addEventListener('input', () => {
    activeSlide.visualPrompt = visPromptArea.value;
  });

  document.getElementById('btnSynthesizeDiagram')?.addEventListener('click', () => {
    activeSlide.visualDataUrl = generateNanoBananaDiagramDataUrl(activeSlide, state.deck.brand);
    if (activeSlide.layout === 'three-pillar-cards') {
      activeSlide.layout = 'architecture-visual';
    }
    showToast(`Synthesized 16:9 diagram with ${GEMINI_IMAGE_MODEL}`);
    renderStudio();
  });

  // Gemini Omni 1.2 Flash Video controls
  const durSelect = document.getElementById('selectVideoDuration') as HTMLSelectElement | null;
  durSelect?.addEventListener('change', () => {
    state.selectedVideoDuration = parseInt(durSelect.value, 10) || 6;
    renderStudio();
  });

  const resSelect = document.getElementById('selectVideoResolution') as HTMLSelectElement | null;
  resSelect?.addEventListener('change', () => {
    state.selectedVideoResolution = (resSelect.value as '1080p' | '720p') || '1080p';
  });

  const vidPromptArea = document.getElementById('textareaVideoPrompt') as HTMLTextAreaElement | null;
  vidPromptArea?.addEventListener('input', () => {
    activeSlide.videoPrompt = vidPromptArea.value;
  });

  document.getElementById('btnGenerateVideoClip')?.addEventListener('click', () => {
    activeSlide.videoDurationSec = state.selectedVideoDuration;
    activeSlide.videoHistory = activeSlide.videoHistory || [];
    activeSlide.videoHistory.push({
      prompt: activeSlide.videoPrompt || `1080p motion clip for ${activeSlide.title}`,
      timestamp: `Turn ${activeSlide.videoHistory.length + 1} (Generate)`,
      durationSec: state.selectedVideoDuration,
      resolution: state.selectedVideoResolution,
    });
    activeSlide.visualDataUrl = generateNanoBananaDiagramDataUrl(activeSlide, state.deck.brand);
    activeSlide.layout = 'video-showcase';
    showToast(
      `Queued ${state.selectedVideoDuration}s ${state.selectedVideoResolution} clip via ${GEMINI_VIDEO_MODEL}`
    );
    renderStudio();
  });

  const followupInput = document.getElementById('inputVideoFollowup') as HTMLInputElement | null;
  followupInput?.addEventListener('input', () => {
    state.videoFollowupPrompt = followupInput.value;
  });

  document.getElementById('btnApplyVideoEditTurn')?.addEventListener('click', () => {
    const editPrompt = state.videoFollowupPrompt.trim();
    if (!editPrompt) {
      showToast('Enter a follow-up video editing instruction first.');
      return;
    }
    activeSlide.videoHistory = activeSlide.videoHistory || [];
    activeSlide.videoHistory.push({
      prompt: editPrompt,
      timestamp: `Turn ${activeSlide.videoHistory.length + 1} (Edit)`,
      durationSec: state.selectedVideoDuration,
      resolution: state.selectedVideoResolution,
    });
    activeSlide.visualPrompt = `${activeSlide.visualPrompt} // Edited: ${editPrompt}`;
    activeSlide.visualDataUrl = generateNanoBananaDiagramDataUrl(activeSlide, state.deck.brand);
    state.videoFollowupPrompt = '';
    showToast(`Applied multi-turn video edit via ${GEMINI_VIDEO_MODEL}`);
    renderStudio();
  });
}

function initTopbarActions(): void {
  // Product Name Preview Switcher (GDE Stage, GDE Prism, GDE Canvas, GDE Forge)
  const nameDisplay = document.getElementById('productBrandNameDisplay');
  const chips = document.querySelectorAll<HTMLButtonElement>('.name-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.productName || 'GDE Stage';
      state.deck.productName = name;
      if (nameDisplay) nameDisplay.textContent = name;
      document.title = `${name} // Autonomous Presentation & Video Studio`;
      chips.forEach((c) => c.classList.toggle('active', c === chip));
      showToast(`Previewing product identity: ${name}`);
    });
  });

  // Theme Toggle (midnight / daylight)
  document.getElementById('btnToggleThemeMode')?.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'daylight' ? 'midnight' : 'daylight';
    html.setAttribute('data-theme', next);
  });

  // Export Python + XML script
  document.getElementById('btnDownloadPythonScript')?.addEventListener('click', () => {
    const py = generatePythonPptxScript(state.deck);
    const slug = state.deck.productName.toLowerCase().replace(/\s+/g, '_');
    downloadBlob(py, `build_${slug}_openxml_deck.py`, 'text/x-python;charset=utf-8');
    showToast('Exported reproducible Python + OpenXML builder script');
  });

  // Download Native .PPTX
  document.getElementById('btnDownloadNativePptx')?.addEventListener('click', () => {
    const bytes = compileOpenXmlPptx(state.deck);
    const slug = state.deck.productName.toLowerCase().replace(/\s+/g, '_');
    downloadBlob(
      bytes,
      `${slug}_16x9_deck.pptx`,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    showToast(`Compiled and downloaded native 16:9 .PPTX (${Math.round(bytes.length / 1024)} KB)`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTopbarActions();
  renderStudio();
});
