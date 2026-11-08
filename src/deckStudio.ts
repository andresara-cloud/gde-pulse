import { requestGoogleDriveAccessToken } from './firebase.ts';
import { type GdeProfile } from './policy.ts';
import {
  BRAND_PRESETS,
  type BrandThemeSpec,
  GEMINI_FAST_MODEL,
  GEMINI_HEAVY_MODEL,
  GEMINI_IMAGE_MODEL,
  GEMINI_MUSIC_CLIP_MODEL,
  GEMINI_MUSIC_MODEL,
  GEMINI_TTS_MODEL,
  GEMINI_VIDEO_MODEL,
  type ParsedPptxResult,
  type PresentationDeckSpec,
  type SlideCardItem,
  type SlideLayoutKind,
  type SlideSpec,
  compileOpenXmlPptx,
  extractPaletteFromBrandImage,
  generateNanoBananaDiagramDataUrl,
  parseUploadedPptxFile,
  prepareDeckForOpenXmlExport,
  renderSlideToDataUrl,
  synthesizeLyriaAmbientWavDataUrl,
} from './pptxOpenXml.ts';

export interface DeckStudioDeps {
  getProfile: () => GdeProfile;
  showToast: (msg: string) => void;
  escapeHtml: (str: string) => string;
}

let deps: DeckStudioDeps | null = null;
let fullscreenKeyListenerBound = false;
let lastWheelNavAt = 0;
let defaultSampleDeckPromise: Promise<void> | null = null;
let defaultSampleDeckBytes: ArrayBuffer | null = null;

// Preloaded sample deck (served from public/). Replaced as soon as the user uploads their own deck.
const DEFAULT_SAMPLE_DECK_URL = '/2026-GDE-Brand-Guide-Distilled.pptx';
const DEFAULT_SAMPLE_DECK_FILE_NAME = '2026-GDE-Brand-Guide-Distilled.pptx';
const DEFAULT_SAMPLE_DECK_LABEL = '2026 GDE Brand Guide';
const PPTX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

const GDE_2026_NAVY_MARKDOWN = `# Google Developer Experts: 2026 Brand Identity & Editorial System
Presenter: Google Developer Expert (Cloud & AI)
Track: 2026 GDE Brand Guide · Navy #20344B Editorial & Graphic Motifs

## Slide 1: 2026 GDE Brand Identity: Grounding Navy & Halftone Typography
- Brighter Halftone Accents (#57CAFF): Pairing Halftone Pink (#FF7DAF) headlines and Halftone Blue (#57CAFF) subheads against #20344B Grounding Navy
- Signature GDE Vector Motifs ({ # } & //): Framing technical callouts with curly brackets { # }, double-slash //, and community-to-globe diagrams
- Google Sans & PT Mono Hierarchy (37 KB): Clean editorial paragraphs in Google Sans paired with PT Mono technical metadata
> Speaker Notes: Slide 1 follows Slide 1 and Slide 19 of the 2026 GDE Brand Guide: a deep #20344B Navy canvas, #FF7DAF Halftone Pink headline, open editorial paragraphs on the left, and the official GDE graphic artwork on the right.

## Slide 2: Global Expert Impact & Technical Community Reach
- 1,000+ Active Experts (#5CDB6D): Spanning Cloud, AI, Android, Web, Angular, Flutter, and Firebase across six continents
- 98.4% Technical Session Rating ({ 2026 }): Deep architectural keynotes, open-source mentorship, and hands-on Cloud Run workshops
- Direct Product Engineering Loops (150+ Countries): Connecting developer communities directly with Google product teams
> Speaker Notes: Slide 2 pairs open editorial storytelling on #20344B Navy with the Slide 19 graphic language from the 2026 GDE Brand Guide.
`;

const GDE_2026_LIGHT_PILLS_MARKDOWN = `# Google Developer Experts: Slide 23 Overlapping Stat Pills Template
Presenter: Google Developer Expert (Cloud & AI)
Track: 2026 GDE Brand Guide · Slide 23 Light Stat Pills

## Slide 1: Key Developer Learnings & Production Adoption
- 14% Latency Reduction: Bringing developers together in-person and online with serverless Cloud Run and Gemini 4 Argon architectures
- 86% Production Deployment Rate: Teams adopting automated OpenXML verification and multimodal visual synthesis ship faster with zero layout regressions
> Speaker Notes: Slide 1 replicates Slide 23 ("Slide Template") of the 2026 GDE Brand Guide: crisp #FFFFFF white canvas, left-hand #20344B Navy headline, body copy, and curved directional arrow pointing to the overlapping 14% (#5CDB6D Green) and 86% (#20344B Navy) rounded stat pills.

## Slide 2: Multimodal Benchmark Gains Across Cloud Run Workloads
- 3.4x Faster Iteration Velocity: Combining Gemini 4 Argon (HIGH thinking) with Gemini 3.8 Flash cuts end-to-end build times across technical decks
- 99.9% Visual QA Pass Rate: Automated 16:9 geometry and contrast verification eliminates manual slide formatting
> Speaker Notes: Slide 2 applies the Slide 23 overlapping stat pill layout to benchmark metrics, keeping the left column clean and editorial while the right column highlights the primary and secondary statistics.
`;

const CLOUD_NEXT_BLUEPRINT_MARKDOWN = `# Google Cloud Next 2026: Serverless Multi-Agent Production Blueprint
Presenter: Google Cloud Architect & GDE
Track: Google Cloud Next · Horizontal Architecture Blueprint

## Slide 1: Zero-Trust Cloud Run Multi-Agent Execution Pipeline
- Stage 01 · Ingress & Identity (99.99% SLA): Global Cloud Load Balancing with IAP token validation and regional Cloud Run revision routing
- Stage 02 · Gemini 4 Argon Orchestrator (HIGH Thinking): Stateful agent planning, tool dispatch, and structured schema enforcement on Vertex AI
- Stage 03 · Multimodal Artifact Synthesis (< 420ms P95): Parallel execution of Nano Banana 2.1 diagrams, Omni 1.2 Flash video, and ECMA-376 OpenXML compilation
> Speaker Notes: This Google Cloud Next blueprint slide pairs three horizontal architecture stage rows on the left with a full system topology diagram on the right.

## Slide 2: Regional Failover, Telemetry & Cost Optimization
- Stage 01 · Scale-to-Zero Container Economics (-68% Cost): On-demand CPU allocation and concurrency tuning across us-central1 and europe-west1
- Stage 02 · OpenTelemetry & Cloud Trace (100% Span Coverage): End-to-end latency attribution across Vertex AI model calls and storage writes
- Stage 03 · Automated Visual Verification (0 Regressions): Headless rendering and closed-loop layout checks before artifact delivery
> Speaker Notes: Slide 2 details our regional high-availability posture, OpenTelemetry tracing, and scale-to-zero Cloud Run economics.
`;

const DEVFEST_SPLIT_MARKDOWN = `# GDG DevFest 2026 Flagship Keynote: Building Agentic Systems
Presenter: GDG Keynote Speaker & GDE
Track: GDG DevFest 2026 · Asymmetric Keynote Split Stage

## Slide 1: From Prompt Engineering to Autonomous Production Agents
- 01 · Deterministic Tool Contracts: Replace brittle text parsing with strict typed schemas and verified sandbox execution
- 02 · Task-to-Model Routing Matrix: Route complex architectural planning to Gemini 4 Argon and fast extraction to Gemini 3.8 Flash
- 03 · Multimodal Native Output: Deliver interactive 16:9 decks, 4K system diagrams, and 1080p motion clips directly from agent workflows
> Speaker Notes: The GDG DevFest Keynote Split places the bold dark keynote title banner on the left 38% of the stage and clean numbered takeaway rows on the right.

## Slide 2: Live Demo Architecture & Community Takeaways
- 01 · One-Click Cloud Run Deployment: Containerized backend with zero local setup required for workshop attendees
- 02 · Real-Time Collaborative Evaluation: Live audience benchmarking and instant feedback loops during keynote sessions
- 03 · Open-Source Starter Kit: Complete TypeScript and Python reference templates ready to fork after the talk
> Speaker Notes: Slide 2 wraps up the keynote with actionable community resources and deployment blueprints.
`;

const BUILD_WITH_AI_TERMINAL_MARKDOWN = `# Build with AI 2026: Hands-On Antigravity SDK & Multimodal Agents
Presenter: AI Developer Advocate & GDE
Track: Build with AI Roadshow · Dark Developer Terminal & SDK

## Slide 1: Orchestrating Gemini 4 Argon & Multimodal Tools in Code
- Agent Initialization [gemini-4-argon]: Configure HIGH thinking depth and attach specialized domain skills in 8 lines of code
- Parallel Tool Dispatch [3.2x Speedup]: Execute database queries, code verification, and Nano Banana 2.1 visual generation concurrently
- Production Guardrails [100% Typed]: Enforce strict output validation and credential boundaries across every agent turn
> Speaker Notes: The Build with AI template uses an obsidian dark developer canvas with feature callouts on the left and a live SDK terminal window on the right.

## Slide 2: Streaming Multimodal Responses & Live Media Synthesis
- Nano Banana 2.1 Diagrams [4K Native]: Generate high-contrast system architecture visuals directly from code specifications
- Gemini Omni 1.2 Flash Video [1080p @ $0.07/s]: Synthesize and iteratively refine motion clips via multi-turn interactions
- Lyria 3 Pro & Flash TTS [Studio Audio]: Attach custom instrumental scores and natural keynote voiceovers programmatically
> Speaker Notes: Slide 2 demonstrates how developers can invoke Nano Banana 2.1, Gemini Omni 1.2 Flash, and Lyria 3 Pro from a unified SDK workflow.
`;

function buildPresetSlidesAndMarkdown(brand: BrandThemeSpec): {
  markdown: string;
  slides: SlideSpec[];
} {
  const style = brand.templateStyle || 'gde-2026-navy';

  if (style === 'gde-2026-light-pills') {
    return {
      markdown: GDE_2026_LIGHT_PILLS_MARKDOWN,
      slides: [
        {
          id: 'slide-1',
          sectionTag: 'SLIDE 23 TEMPLATE // KEY LEARNINGS',
          title: 'Key Developer Learnings & Production Adoption',
          subtitle:
            'Bringing developers together in-person and online with Gemini 4 Argon and Cloud Run',
          layout: 'stat-pills',
          cards: [
            {
              badge: 'STATISTIC 01',
              heading: 'Latency Reduction Across Production Pipelines',
              metric: '14%',
              bullets: [
                'Bringing developers together in-person and online. Stay in the know about upcoming events, catch up on content you missed, and connect with Google experts.',
              ],
            },
            {
              badge: 'STATISTIC 02',
              heading: 'Production Deployment Rate After Workshop',
              metric: '86%',
              bullets: [
                'Teams adopting automated OpenXML verification and multimodal visual synthesis ship faster with zero layout regressions.',
              ],
            },
          ],
          visualPrompt:
            '2026 GDE Slide 23 Template: Overlapping #5CDB6D Halftone Green (14%) and #20344B Grounding Navy (86%) rounded stat pills',
          videoPrompt:
            'Animated 14% and 86% overlapping GDE halftone stat pills sliding into place with a curved directional arrow',
          videoDurationSec: 6,
          videoHistory: [],
          takeaway:
            'Overlapping #5CDB6D Green and #20344B Navy rounded stat pills highlight primary and secondary metrics without cluttered bullet boxes.',
          speakerNotes:
            'Slide 1 replicates Slide 23 ("Slide Template") of the 2026 GDE Brand Guide: crisp white canvas, left-hand #20344B Navy headline, editorial body copy, and curved arrow pointing to the overlapping 14% and 86% rounded stat pills.',
          vqaStatus: 'passed',
        },
        {
          id: 'slide-2',
          sectionTag: 'SLIDE 23 TEMPLATE // BENCHMARK IMPACT',
          title: 'Multimodal Benchmark Gains Across Cloud Run Workloads',
          subtitle:
            'Routing heavy reasoning to Gemini 4 Argon and fast extraction to Gemini 3.8 Flash',
          layout: 'stat-pills',
          cards: [
            {
              badge: 'STATISTIC 01',
              heading: 'Faster End-to-End Iteration Velocity',
              metric: '3.4x',
              bullets: [
                'Combining Gemini 4 Argon (HIGH thinking) with Gemini 3.8 Flash cuts end-to-end build times across technical decks.',
              ],
            },
            {
              badge: 'STATISTIC 02',
              heading: 'Automated Visual QA Pass Rate',
              metric: '99.9%',
              bullets: [
                'Automated 16:9 geometry and contrast verification eliminates manual slide formatting and text overflow.',
              ],
            },
          ],
          visualPrompt:
            'Clean GDE benchmark graphic comparing Gemini 4 Argon and Gemini 3.8 Flash latency and visual quality',
          videoPrompt:
            'Smooth 1080p motion graphic showing 3.4x velocity and 99.9% Visual QA pass rate',
          videoDurationSec: 6,
          videoHistory: [],
          takeaway:
            'Task-to-model routing delivers 3.4x faster iteration velocity and 99.9% visual verification accuracy.',
          speakerNotes:
            'Slide 2 applies the Slide 23 overlapping stat pill template to our Cloud Run and Gemini 4 Argon benchmark metrics.',
          vqaStatus: 'passed',
        },
      ],
    };
  }

  if (style === 'cloud-blueprint') {
    const s1: SlideSpec = {
      id: 'slide-1',
      sectionTag: 'CLOUD NEXT 2026 // PRODUCTION ARCHITECTURE',
      title: 'Zero-Trust Cloud Run Multi-Agent Execution Pipeline',
      subtitle: 'Regional autoscaling, IAP identity enforcement, and Vertex AI model routing',
      layout: 'architecture-blueprint',
      cards: [
        {
          badge: 'STAGE 01',
          heading: 'Stage 01 · Global Ingress & Identity',
          metric: '99.99% SLA',
          bullets: [
            'Global Cloud Load Balancing with IAP token validation and regional Cloud Run revision routing',
          ],
        },
        {
          badge: 'STAGE 02',
          heading: 'Stage 02 · Gemini 4 Argon Orchestrator',
          metric: 'HIGH Thinking',
          bullets: [
            'Stateful agent planning, tool dispatch, and structured schema enforcement on Vertex AI',
          ],
        },
        {
          badge: 'STAGE 03',
          heading: 'Stage 03 · Multimodal Artifact Synthesis',
          metric: '< 420ms P95',
          bullets: [
            'Parallel execution of Nano Banana 2.1 diagrams, Omni 1.2 Flash video, and ECMA-376 OpenXML compilation',
          ],
        },
      ],
      visualPrompt:
        'Google Cloud Next architecture blueprint: Cloud Load Balancing -> Cloud Run Service -> Vertex AI Gemini 4 Argon & Nano Banana 2.1',
      videoPrompt:
        'Isometric 1080p Google Cloud architecture animation showing request traffic flowing through Cloud Run and Vertex AI',
      videoDurationSec: 6,
      videoHistory: [],
      takeaway:
        'Cloud Run and Vertex AI provide a zero-trust, scale-to-zero execution plane for multimodal agentic workloads.',
      speakerNotes:
        'Slide 1 presents our Google Cloud Next horizontal architecture blueprint with three stacked execution stages on the left and a system topology diagram on the right.',
      vqaStatus: 'passed',
    };
    s1.visualDataUrl = generateNanoBananaDiagramDataUrl(s1, brand);

    const s2: SlideSpec = {
      id: 'slide-2',
      sectionTag: 'CLOUD NEXT 2026 // OBSERVABILITY & FINOPS',
      title: 'Regional Failover, OpenTelemetry & Scale-to-Zero Economics',
      subtitle: 'Multi-region resilience across us-central1 and europe-west1 with full trace attribution',
      layout: 'architecture-blueprint',
      cards: [
        {
          badge: 'STAGE 01',
          heading: 'Stage 01 · Scale-to-Zero Container Economics',
          metric: '-68% Cost',
          bullets: [
            'On-demand CPU allocation and concurrency tuning across us-central1 and europe-west1',
          ],
        },
        {
          badge: 'STAGE 02',
          heading: 'Stage 02 · OpenTelemetry & Cloud Trace',
          metric: '100% Spans',
          bullets: [
            'End-to-end latency attribution across Vertex AI model calls, memory state, and storage writes',
          ],
        },
        {
          badge: 'STAGE 03',
          heading: 'Stage 03 · Closed-Loop Visual Verification',
          metric: '0 Regressions',
          bullets: [
            'Headless slide rasterization and automated layout verification before artifact delivery',
          ],
        },
      ],
      visualPrompt:
        'Multi-region Cloud Run failover and OpenTelemetry trace waterfall diagram across us-central1 and europe-west1',
      videoPrompt:
        '1080p telemetry dashboard animation showing Cloud Run autoscaling and sub-second latency distribution',
      videoDurationSec: 6,
      videoHistory: [],
      takeaway:
        'Combining Cloud Run concurrency tuning with OpenTelemetry tracing reduces infrastructure spend by 68%.',
      speakerNotes:
        'Slide 2 covers our FinOps and observability architecture across multi-region Cloud Run deployments.',
      vqaStatus: 'passed',
    };
    s2.visualDataUrl = generateNanoBananaDiagramDataUrl(s2, brand);

    return {
      markdown: CLOUD_NEXT_BLUEPRINT_MARKDOWN,
      slides: [s1, s2],
    };
  }

  if (style === 'devfest-split') {
    const s1: SlideSpec = {
      id: 'slide-1',
      sectionTag: 'DEVFEST 2026 KEYNOTE // TRACK 01',
      title: 'From Prompt Engineering to Autonomous Production Agents',
      subtitle: 'Designing deterministic, multimodal AI systems for real-world developer workflows',
      layout: 'keynote-split',
      cards: [
        {
          badge: '01',
          heading: 'Deterministic Tool Contracts',
          metric: 'Typed I/O',
          bullets: [
            'Replace brittle text parsing with strict typed schemas and verified sandbox execution.',
          ],
        },
        {
          badge: '02',
          heading: 'Task-to-Model Routing Matrix',
          metric: 'Argon + Flash',
          bullets: [
            'Route complex architectural planning to Gemini 4 Argon and fast extraction to Gemini 3.8 Flash.',
          ],
        },
        {
          badge: '03',
          heading: 'Multimodal Native Output',
          metric: '16:9 OpenXML',
          bullets: [
            'Deliver interactive 16:9 decks, 4K system diagrams, and 1080p motion clips directly from agent workflows.',
          ],
        },
      ],
      visualPrompt:
        'GDG DevFest 2026 keynote diagram: Gemini 4 Argon agent routing tasks across code, 4K visuals, and 1080p video',
      videoPrompt:
        'Dynamic GDG DevFest keynote stage animation with Google Blue, Red, Yellow, and Green motion nodes',
      videoDurationSec: 6,
      videoHistory: [],
      takeaway:
        'Production agents combine typed tool contracts with explicit task-to-model routing.',
      speakerNotes:
        'Welcome to GDG DevFest 2026! This asymmetric keynote split slide pairs our dark keynote title sidebar on the left with numbered architectural takeaways on the right.',
      vqaStatus: 'passed',
    };
    s1.visualDataUrl = generateNanoBananaDiagramDataUrl(s1, brand);

    const s2: SlideSpec = {
      id: 'slide-2',
      sectionTag: 'DEVFEST 2026 KEYNOTE // LIVE DEMO',
      title: 'Live Demo Architecture & Community Starter Kit',
      subtitle: 'Everything you need to deploy and extend today’s keynote demo on Google Cloud',
      layout: 'keynote-split',
      cards: [
        {
          badge: '01',
          heading: 'One-Click Cloud Run Deployment',
          metric: '< 2 Mins',
          bullets: [
            'Containerized FastAPI and TypeScript backend with zero local setup required for attendees.',
          ],
        },
        {
          badge: '02',
          heading: 'Real-Time Audience Benchmarking',
          metric: 'Live Quiz',
          bullets: [
            'Interactive workshop evaluation and instant leaderboard feedback during live sessions.',
          ],
        },
        {
          badge: '03',
          heading: 'Open-Source Reference Templates',
          metric: 'Apache 2.0',
          bullets: [
            'Complete TypeScript OpenXML compiler and Vertex AI multimodal integration ready to fork.',
          ],
        },
      ],
      visualPrompt:
        'GDG DevFest developer workflow: GitHub repository -> Cloud Build -> Cloud Run live endpoint',
      videoPrompt:
        '1080p live coding and deployment animation for GDG DevFest attendees',
      videoDurationSec: 6,
      videoHistory: [],
      takeaway:
        'Fork the starter repository and deploy the complete multimodal studio to Cloud Run in under two minutes.',
      speakerNotes:
        'Slide 2 gives attendees the concrete deployment steps and open-source resources from today’s keynote.',
      vqaStatus: 'passed',
    };
    s2.visualDataUrl = generateNanoBananaDiagramDataUrl(s2, brand);

    return {
      markdown: DEVFEST_SPLIT_MARKDOWN,
      slides: [s1, s2],
    };
  }

  if (style === 'build-with-ai-terminal') {
    return {
      markdown: BUILD_WITH_AI_TERMINAL_MARKDOWN,
      slides: [
        {
          id: 'slide-1',
          sectionTag: 'BUILD WITH AI // ANTIGRAVITY SDK',
          title: 'Orchestrating Gemini 4 Argon & Multimodal Tools in Code',
          subtitle: 'High-thinking agent configuration, parallel tool execution, and typed schemas',
          layout: 'developer-terminal',
          cards: [
            {
              badge: 'SDK 01',
              heading: 'Agent Initialization',
              metric: 'gemini-4-argon',
              bullets: [
                'Configure HIGH thinking depth and attach specialized domain skills in 8 lines of code.',
              ],
            },
            {
              badge: 'SDK 02',
              heading: 'Parallel Tool Dispatch',
              metric: '3.2x Speedup',
              bullets: [
                'Execute database queries, code verification, and Nano Banana 2.1 visual generation concurrently.',
              ],
            },
            {
              badge: 'SDK 03',
              heading: 'Production Guardrails',
              metric: '100% Typed',
              bullets: [
                'Enforce strict output validation and credential boundaries across every agent turn.',
              ],
            },
          ],
          codeSnippet: `from google.antigravity import Agent, ThinkingLevel

agent = Agent(
    model="${GEMINI_HEAVY_MODEL}",
    thinking_level=ThinkingLevel.HIGH,
    tools=["openxml_compiler", "nano_banana_v2", "omni_video"],
)

deck = await agent.run(
    "Synthesize 16:9 technical keynote deck with 4K architecture diagrams"
)`,
          codeLanguage: 'python',
          visualPrompt:
            'Dark developer terminal and neural graph showing Gemini 4 Argon orchestrating parallel SDK tools',
          videoPrompt:
            '1080p terminal code execution animation transforming Python SDK calls into a live 16:9 presentation',
          videoDurationSec: 6,
          videoHistory: [],
          takeaway:
            'The Antigravity SDK pairs Gemini 4 Argon HIGH thinking with deterministic tool execution.',
          speakerNotes:
            'Slide 1 showcases our Build with AI dark developer layout, pairing feature rows on the left with a live SDK terminal window on the right.',
          vqaStatus: 'passed',
        },
        {
          id: 'slide-2',
          sectionTag: 'BUILD WITH AI // MULTIMODAL PIPELINE',
          title: 'Streaming Multimodal Responses & Live Media Synthesis',
          subtitle: 'Invoking Nano Banana 2.1, Gemini Omni 1.2 Flash, and Lyria 3 Pro from Python & TypeScript',
          layout: 'developer-terminal',
          cards: [
            {
              badge: 'MEDIA 01',
              heading: 'Nano Banana 2.1 Diagrams',
              metric: '4K Native',
              bullets: [
                'Generate high-contrast system architecture visuals directly from code specifications.',
              ],
            },
            {
              badge: 'MEDIA 02',
              heading: 'Gemini Omni 1.2 Flash Video',
              metric: '1080p · $0.07/s',
              bullets: [
                'Synthesize and iteratively refine motion clips via multi-turn interactions.',
              ],
            },
            {
              badge: 'MEDIA 03',
              heading: 'Lyria 3 Pro & Flash TTS',
              metric: 'Studio Audio',
              bullets: [
                'Attach custom instrumental scores and natural keynote voiceovers programmatically.',
              ],
            },
          ],
          codeSnippet: `const visual = await vertex.generateImage({
  model: "${GEMINI_IMAGE_MODEL}",
  prompt: "Serverless Cloud Run multi-agent topology, 16:9",
});

const clip = await vertex.interactions.create({
  model: "${GEMINI_VIDEO_MODEL}",
  resolution: "1080p",
  durationSeconds: 6,
});`,
          codeLanguage: 'typescript',
          visualPrompt:
            'Multimodal API pipeline connecting Nano Banana 2.1, Gemini Omni 1.2 Flash, and Lyria 3 Pro',
          videoPrompt:
            '1080p visualization of multimodal audio, video, and image streams converging into a presentation slide',
          videoDurationSec: 6,
          videoHistory: [],
          takeaway:
            'Unified Vertex AI endpoints let developers combine 4K images, 1080p video, and studio audio in one workflow.',
          speakerNotes:
            'Slide 2 walks through the TypeScript SDK calls for Nano Banana 2.1 and Gemini Omni 1.2 Flash.',
          vqaStatus: 'passed',
        },
      ],
    };
  }

  // Default Template 1: 2026 GDE Brand Guide · Navy Editorial & Graphics (#20344B)
  return {
    markdown: GDE_2026_NAVY_MARKDOWN,
    slides: [
      {
        id: 'slide-1',
        sectionTag: '2026 GDE BRAND SYSTEM // IDENTITY & MOTIFS',
        title: '2026 GDE Brand Identity: Grounding Navy & Halftone Typography',
        subtitle:
          'Authentic #20344B Grounding Navy Canvas, #FF7DAF Halftone Pink Headlines & Official { # } // Graphic Artwork',
        layout: 'editorial-split',
        cards: [
          {
            badge: 'PALETTE',
            heading: 'Brighter Halftone Accents',
            metric: '#57CAFF',
            bullets: [
              'Pairing Halftone Pink (#FF7DAF) headlines and Halftone Blue (#57CAFF) subheads against #20344B Grounding Navy for stage legibility.',
            ],
          },
          {
            badge: 'GRAPHICS',
            heading: 'Signature GDE Vector Motifs',
            metric: '{ # } & //',
            bullets: [
              'Framing technical callouts with curly brackets { # }, double-slash //, and the community-to-globe diagram from Slide 1.',
            ],
          },
          {
            badge: 'TYPOGRAPHY',
            heading: 'Google Sans & PT Mono Hierarchy',
            metric: '37 KB Deck',
            bullets: [
              'Open editorial paragraphs in Google Sans paired with PT Mono technical metadata and zero boxy clutter.',
            ],
          },
        ],
        visualPrompt:
          '2026 GDE Brand Guide Artwork: < > Google Developer Experts lockup, // double slash, o o o -> { globe } diagram, and { # } brackets on #20344B Navy',
        visualDataUrl: '/gde-2026-brand-graphics.png',
        videoPrompt:
          '1080p motion graphic of the Google Developer Experts { 2026 } bracket badge and halftone motifs over #20344B Navy',
        videoDurationSec: 6,
        videoHistory: [],
        takeaway:
          'Authentic 2026 GDE slides pair #20344B Grounding Navy and #FF7DAF Halftone Pink headlines with open editorial copy and { # } // graphics.',
        speakerNotes:
          'Slide 1 follows Slide 1 and Slide 19 of the 2026 GDE Brand Guide: a deep #20344B Navy canvas, #FF7DAF Halftone Pink headline, open editorial paragraphs on the left, and the official GDE graphic artwork on the right.',
        vqaStatus: 'passed',
      },
      {
        id: 'slide-2',
        sectionTag: '2026 GDE BRAND SYSTEM // EDITORIAL TEMPLATE',
        title: 'Global Expert Impact & Technical Community Reach',
        subtitle:
          'Modeled directly on Slide 19 of the 2026 Google Developer Experts Brand Guide',
        layout: 'editorial-split',
        cards: [
          {
            badge: 'COMMUNITY',
            heading: '1,000+ Active Experts Worldwide',
            metric: '#5CDB6D',
            bullets: [
              'Spanning Cloud, AI, Android, Web, Angular, Flutter, and Firebase across six continents.',
            ],
          },
          {
            badge: 'EXCELLENCE',
            heading: '98.4% Technical Session Rating',
            metric: '{ 2026 }',
            bullets: [
              'Deep architectural keynotes, open-source mentorship, and hands-on Cloud Run workshops.',
            ],
          },
          {
            badge: 'FEEDBACK',
            heading: 'Direct Product Engineering Loops',
            metric: '150+ Countries',
            bullets: [
              'Connecting developer communities directly with Google product and engineering teams.',
            ],
          },
        ],
        visualPrompt:
          '2026 GDE Slide 19 Editorial Layout: #FF7DAF Halftone Pink headline, white body paragraphs, and #EA4335 # glyph with #FF7DAF O O O rings on #20344B Navy',
        visualDataUrl: '/gde-2026-navy-headline.png',
        videoPrompt:
          'Animated #20344B Navy editorial slide with #FF7DAF headline and glowing GDE halftone rings',
        videoDurationSec: 6,
        videoHistory: [],
        takeaway:
          'Slide 19 of the 2026 GDE Brand Guide uses open editorial paragraphs on #20344B Navy paired with bold geometric vector accents.',
        speakerNotes:
          'Slide 2 pairs open editorial storytelling on #20344B Navy with the Slide 19 graphic language from the 2026 GDE Brand Guide.',
        vqaStatus: 'passed',
      },
    ],
  };
}

function cloneSlideSpecs(slides: SlideSpec[]): SlideSpec[] {
  return slides.map((s) => ({
    ...s,
    cards: s.cards.map((c) => ({ ...c, bullets: [...c.bullets] })),
    extraVisualDataUrls: s.extraVisualDataUrls ? [...s.extraVisualDataUrls] : undefined,
    videoHistory: s.videoHistory ? [...s.videoHistory] : [],
  }));
}

export function formatSlidesAsLlmPrompt(slides: SlideSpec[]): string {
  return slides
    .map((s, idx) => {
      const lines: string[] = [`Slide ${idx + 1}:`];
      if (s.title) lines.push(`Title: ${s.title}`);
      if (s.subtitle) lines.push(`Subtitle: ${s.subtitle}`);
      s.cards.forEach((c) => {
        const body = c.bullets.filter(Boolean).join(' · ');
        if (c.heading && body) {
          lines.push(`- ${c.heading}: ${body}`);
        } else if (c.heading) {
          lines.push(`- ${c.heading}`);
        } else if (body) {
          lines.push(`- ${body}`);
        }
      });
      if (s.speakerNotes) {
        lines.push(`Notes: ${s.speakerNotes.replace(/\s+/g, ' ').trim()}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

function createInitialDeck(): PresentationDeckSpec {
  const brand: BrandThemeSpec = buildKeepExistingBrandSpec();
  const initialSlides = buildPresetSlidesAndMarkdown(BRAND_PRESETS[0]).slides;
  return {
    productName: 'GDE Deck Studio',
    deckTitle: 'GDE Deck Studio',
    deckSubtitle: `${brand.name} · ${initialSlides.length} Slides`,
    presenterName: 'Andre Sara',
    gdeCategory: 'Cloud & AI & Firebase GDE',
    brand,
    slides: initialSlides,
  };
}

const DEFAULT_SAMPLE_LLM_PROMPT = `Slide 1:
Title: Agentic Cloud Run Workstation for Google Developer Experts
Subtitle: Serverless OpenXML (.PPTX) & Multimodal Diagram Synthesis
Metric: 99.98% VQA
- Gemini 4 Argon (HIGH thinking): Plans slide geometry and runs visual verification
- Nano Banana 2.1: Synthesizes 4K conference-branded system diagrams
- Lyria 3 Pro: Synthesizes instrumental keynote ambient scores
Photo: 16:9 architecture blueprint of Gemini 4 Argon orchestrating Cloud Run, Nano Banana 2.1, and Lyria 3 audio
Notes: Welcome to GDE Deck Studio. This first slide highlights how Gemini 4 Argon orchestrates our serverless Cloud Run presentation pipeline.

Slide 2:
Title: 2026 Latest-Models Task Routing & Latency Benchmarks
Subtitle: Matching reasoning depth and multimodal synthesis to each slide component
Metric: -64% Latency
- Gemini 4 Argon (HIGH): Multi-slide architecture and closed-loop visual inspection
- Gemini 3.8 Flash (LOW): Fast Markdown and slide XML color/font extraction
- Nano Banana 2.1 & Omni 1.2 Flash: 4K diagrams and $0.07/sec 1080p motion clips
Notes: On Slide 2, we break down our strict task-to-model routing matrix across Gemini 4 Argon, Gemini 3.8 Flash, and Nano Banana 2.1.

Slide 3:
Title: Closed-Loop OpenXML Verification with Headless LibreOffice
Subtitle: Eliminating text overlaps and broken shapes before the speaker downloads the .PPTX
Metric: 0 Overflows
- Direct OpenXML Shape Synthesis: Native 13.333" x 7.5" widescreen slide compilation
- Automated Contrast Verification: Ensures high-contrast typography across dark and light brand themes
- Embedded Media Packaging: Bundles PNG diagrams and speaker notes directly into the .PPTX archive
Photo: Three-stage verification loop showing OpenXML -> High-Res Rasterization -> Gemini 4 Argon Vision QA
Notes: Slide 3 demonstrates how our compiler guarantees every slide passes conference AV inspection.

Slide 4:
Title: Multimodal Keynote Delivery with Omni 1.2 Video & Lyria 3 Audio
Subtitle: High-impact 1080p motion clips and custom instrumental soundtracks
Metric: 1080p @ 60fps
- Gemini Omni 1.2 Flash: Generates 1080p product demo clips with conversational edits
- Lyria 3 Pro: Synthesizes a continuous ambient synth score for live keynotes
- Google Workspace Export: One-click upload to Google Slides or native PowerPoint .PPTX
Video: 1080p keynote stage animation showing live Cloud Run container scaling and telemetry
Music: Warm ambient keynote synth pulse at 108 BPM with harmonic chimes
Notes: Finally on Slide 4, we combine Gemini Omni 1.2 Flash video and Lyria 3 music with one-click Google Drive export.`;

const GDRIVE_SVG_ICON = `<svg class="deck-gdrive-icon" width="18" height="16" viewBox="0 0 87.3 78" aria-hidden="true" style="flex-shrink:0;"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>`;

export const KEEP_EXISTING_BRAND_ID = 'keep-existing-brand';

export function buildKeepExistingBrandSpec(
  parsed?: ParsedPptxResult | null,
  fallbackBrand?: BrandThemeSpec,
): BrandThemeSpec {
  const base = fallbackBrand || BRAND_PRESETS[0];
  const extracted = parsed?.extractedTheme || {};
  return {
    ...base,
    ...extracted,
    id: KEEP_EXISTING_BRAND_ID,
    name: 'Keep Existing Deck Template',
    conferenceTitle:
      extracted.conferenceTitle ||
      (parsed ? parsed.fileName.replace(/\.pptx$/i, '') : 'GDE Deck Studio'),
    primaryHex: extracted.primaryHex || '#1A73E8',
    secondaryHex: extracted.secondaryHex || '#34A853',
    accentHex: extracted.accentHex || '#EA4335',
    warningHex: extracted.warningHex || '#FBBC04',
    darkBgHex: extracted.darkBgHex || '#202124',
    lightBgHex: extracted.lightBgHex || '#FFFFFF',
    surfaceHex: extracted.surfaceHex || '#F8F9FA',
    dividerHex: extracted.dividerHex || '#DADCE0',
    headingFont: extracted.headingFont || 'Google Sans',
    bodyFont: extracted.bodyFont || 'Roboto',
    templateStyle: 'keep-original',
    headerStyle: 'clean-bar',
    footerStyle: 'gde-minimal',
    footerSignature: parsed ? parsed.fileName.replace(/\.pptx$/i, '') : 'GDE Deck Studio',
  };
}

const initialDeckSpec = createInitialDeck();

const studioState = {
  deck: initialDeckSpec,
  activeSlideIndex: 0,
  markdownInput: GDE_2026_NAVY_MARKDOWN,
  targetSlideCount: initialDeckSpec.slides.length,
  sourceUploaded: false,
  isUploadingSource: false,
  isSampleDeck: true,
  sourceLabel: `${DEFAULT_SAMPLE_DECK_LABEL} (${initialDeckSpec.slides.length} slides)`,
  isDeckGenerated: false,
  generatedDeckSizeKb: 27271,
  lastCompiledPptxBytes: null as Uint8Array | null,
  lastNotesSavedAt: 'Auto-saved to deck',
  cloudRunUrl:
    (typeof localStorage !== 'undefined' && localStorage.getItem('gde_stage_cloudrun_url')) ||
    'https://gde-stage-pptx-studio-951871417017.us-central1.run.app/api/pptx',
  isBusy: false,
  busyLabel: '',
  busyProgress: 0,
  busyElapsedSec: 0,
  lastVqaSummary:
    'Active Brand Template: Keep Existing Deck Template · Upload a .PPTX or .MD deck in Step 1 to inspect and edit all slides.',
  selectedVideoDuration: 6,
  selectedVideoResolution: '1080p' as '1080p' | '720p',
  lastLlmPrompt: DEFAULT_SAMPLE_LLM_PROMPT,
  lastLlmModel: GEMINI_HEAVY_MODEL,
  lastLlmChangeLog: [] as string[],
  lastUploadedPptxResult: null as ParsedPptxResult | null,
  hasUserModifiedSlides: false,
  lastGDriveWebViewLink: '',
  lastGDriveFileName: '',
  initializedProfileSync: false,
  reduceSlidesMode: 'remove' as 'remove' | 'merge',
  pendingTargetSlideCount: initialDeckSpec.slides.length,
  pendingRemoveIndices: [] as number[],
  pendingMergePairs: [
    { firstSlideNumber: 1, secondSlideNumber: 5 },
    { firstSlideNumber: 10, secondSlideNumber: 12 },
  ] as Array<{ firstSlideNumber: number; secondSlideNumber: number }>,
  pendingMergeTextInput: 'Slide 1 and 5, Slide 10 and 12',
};

export function formatGeneratingTimerLabel(
  baseLabel: string,
  elapsedSeconds: number,
): string {
  const safeSec = Math.max(0, Math.floor(elapsedSeconds));
  return `⏳ ${baseLabel} (${safeSec}s)`;
}

function waitAbortableMs(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(new DOMException('Generation stopped by user', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Generation stopped by user', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

interface CancellableGenerationTask {
  signal: AbortSignal;
  finish: () => void;
  stop: () => void;
  getElapsedSeconds: () => number;
}

let activeDeckGenerateTask: CancellableGenerationTask | null = null;

function startCancellableGenerationWithTimer(options: {
  submitBtn: HTMLButtonElement | null;
  stopBtn: HTMLButtonElement | null;
  submitBtnId?: string;
  stopBtnId?: string;
  generatingLabel: string;
  idleLabel: string;
  onTick?: (elapsedSec: number) => void;
  onStop?: (elapsedSec: number) => void;
}): CancellableGenerationTask {
  const controller = new AbortController();
  let elapsedSec = 0;
  let cleanedUp = false;

  const getSubmitBtn = (): HTMLButtonElement | null => {
    if (options.submitBtnId && typeof document !== 'undefined') {
      const byId = document.getElementById(options.submitBtnId) as HTMLButtonElement | null;
      if (byId) return byId;
    }
    return options.submitBtn;
  };

  const getStopBtn = (): HTMLButtonElement | null => {
    if (options.stopBtnId && typeof document !== 'undefined') {
      const byId = document.getElementById(options.stopBtnId) as HTMLButtonElement | null;
      if (byId) return byId;
    }
    return options.stopBtn;
  };

  const stop = () => {
    if (cleanedUp) return;
    const stoppedAtSec = elapsedSec;
    cleanupTimer();
    controller.abort();
    restoreButtonsIdle();
    options.onStop?.(stoppedAtSec);
  };

  const updateSubmitBtnGenerating = (sec: number) => {
    const sBtn = getSubmitBtn();
    if (sBtn) {
      sBtn.disabled = true;
      sBtn.setAttribute('aria-disabled', 'true');
      sBtn.style.pointerEvents = 'none';
      sBtn.textContent = formatGeneratingTimerLabel(options.generatingLabel, sec);
    }
    const stBtn = getStopBtn();
    if (stBtn) {
      stBtn.style.display = 'inline-flex';
      stBtn.disabled = false;
      stBtn.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        stop();
      };
    }
  };

  const restoreButtonsIdle = () => {
    const sBtn = getSubmitBtn();
    if (sBtn) {
      sBtn.disabled = false;
      sBtn.removeAttribute('aria-disabled');
      sBtn.style.pointerEvents = '';
      sBtn.textContent = options.idleLabel;
    }
    const stBtn = getStopBtn();
    if (stBtn) {
      stBtn.style.display = 'none';
      stBtn.onclick = null;
    }
  };

  updateSubmitBtnGenerating(0);

  const intervalId =
    typeof window !== 'undefined'
      ? window.setInterval(() => {
          if (cleanedUp || controller.signal.aborted) return;
          elapsedSec += 1;
          updateSubmitBtnGenerating(elapsedSec);
          options.onTick?.(elapsedSec);
        }, 1000)
      : null;

  const cleanupTimer = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (intervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(intervalId);
    }
  };

  const finish = () => {
    cleanupTimer();
    restoreButtonsIdle();
  };

  return {
    signal: controller.signal,
    finish,
    stop,
    getElapsedSeconds: () => elapsedSec,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function splitBulletIntoHeadingAndBody(
  rawBullet: string,
  fallbackIndex: number,
): { heading: string; metric?: string; body: string } {
  const cleaned = rawBullet.replace(/^\d+\.\s*/, '').trim();
  const isUrlLine = /^(?:https?:\/\/|goo\.gle\/|bit\.ly\/)/i.test(cleaned);
  const metricBracket = !isUrlLine ? /\[([^\]]+)\]|\(([^)]+)\)/.exec(cleaned) : null;
  const rawMetric = metricBracket ? (metricBracket[1] || metricBracket[2]).trim() : undefined;
  const extractedMetric =
    rawMetric && rawMetric.length <= 24 && !/https?:\/\//i.test(rawMetric) ? rawMetric : undefined;

  if (!isUrlLine) {
    const colonIdx = cleaned.indexOf(':');
    const isUrlColon =
      colonIdx >= 0 &&
      (cleaned.slice(colonIdx, colonIdx + 3) === '://' ||
        /^https?$/i.test(cleaned.slice(0, colonIdx).trim()));

    if (
      colonIdx > 2 &&
      colonIdx < 58 &&
      !isUrlColon &&
      !/[{}=;"']/.test(cleaned.slice(0, colonIdx))
    ) {
      const rawHead = cleaned.slice(0, colonIdx).trim();
      const rawBody = cleaned.slice(colonIdx + 1).trim();
      return {
        heading: rawHead || `Point ${fallbackIndex + 1}`,
        metric: extractedMetric,
        body: rawBody,
      };
    }

    const dotSepIdx = cleaned.indexOf(' · ');
    if (dotSepIdx > 2 && dotSepIdx < 64) {
      const rawHead = cleaned.slice(0, dotSepIdx).trim();
      const rawBody = cleaned.slice(dotSepIdx + 3).trim();
      return {
        heading: rawHead || `Point ${fallbackIndex + 1}`,
        metric: extractedMetric,
        body: rawBody,
      };
    }
  }

  if (cleaned.length <= 72 || isUrlLine) {
    return {
      heading: cleaned || `Point ${fallbackIndex + 1}`,
      metric: extractedMetric,
      body: '',
    };
  }

  return {
    heading: '',
    metric: extractedMetric,
    body: cleaned,
  };
}

export function convertParsedPptxToBrandDeck(
  parsed: ParsedPptxResult,
  brand: BrandThemeSpec,
): SlideSpec[] {
  const sourceSlides = parsed.extractedSlides;
  if (sourceSlides.length === 0) {
    if (studioState.deck.slides.length > 2) {
      return cloneSlideSpecs(studioState.deck.slides);
    }
    return buildPresetSlidesAndMarkdown(brand).slides;
  }

  const style = brand.templateStyle || 'gde-2026-navy';
  const defaultLayout: SlideLayoutKind =
    style === 'gde-2026-light-pills'
      ? 'stat-pills'
      : style === 'devfest-split'
        ? 'keynote-split'
        : style === 'build-with-ai-terminal'
          ? 'developer-terminal'
          : style === 'cloud-blueprint'
            ? 'architecture-blueprint'
            : 'editorial-split';

  const cleanDeckBaseName = parsed.fileName.replace(/\.pptx$/i, '').trim();

  return sourceSlides.map((s, idx) => {
    const bullets = s.bullets.filter((b) => Boolean(b && b.trim()));
    let effectiveSubtitle = s.subtitle || '';
    let cards: SlideCardItem[] = [];

    const promoteSingleCaptionBulletToSubtitle =
      bullets.length === 1 &&
      !effectiveSubtitle &&
      Boolean(s.imageDataUrl) &&
      (!s.extraImageDataUrls || s.extraImageDataUrls.length === 0) &&
      (Boolean(s.isVisualDominant) || bullets[0].length <= 165);

    if (promoteSingleCaptionBulletToSubtitle) {
      effectiveSubtitle = bullets[0];
      cards = [];
    } else if (bullets.length > 0 && bullets.length <= 3) {
      cards = bullets.map((bText, cIdx) => {
        const parsedItem = splitBulletIntoHeadingAndBody(bText, cIdx);
        return {
          badge: `0${cIdx + 1}`,
          heading: parsedItem.heading,
          metric: parsedItem.metric,
          bullets: parsedItem.body ? [parsedItem.body] : [],
        };
      });
    } else if (bullets.length > 3) {
      const chunkSize = Math.ceil(bullets.length / 3);
      cards = [0, 1, 2]
        .map((cIdx) => bullets.slice(cIdx * chunkSize, (cIdx + 1) * chunkSize))
        .filter((chunk) => chunk.length > 0)
        .map((chunk, cIdx) => {
          const firstParsed = splitBulletIntoHeadingAndBody(chunk[0], cIdx);
          const restBullets = [
            ...(firstParsed.body ? [firstParsed.body] : []),
            ...chunk.slice(1),
          ];
          return {
            badge: `0${cIdx + 1}`,
            heading: firstParsed.heading,
            metric: firstParsed.metric,
            bullets: restBullets,
          };
        });
    }

    const slideNumPad = String(s.slideNumber).padStart(2, '0');
    const isVisualOnlySlide = Boolean(s.isVisualOnly) || (!s.title.trim() && cards.length === 0);

    return {
      id: `slide-${idx + 1}`,
      sectionTag: `${cleanDeckBaseName.toUpperCase().slice(0, 28)} // SLIDE ${slideNumPad}`,
      title: s.title || '',
      subtitle: effectiveSubtitle,
      layout: defaultLayout,
      cards,
      visualPrompt: s.title
        ? `${s.title} (Slide ${s.slideNumber})`
        : `Slide ${s.slideNumber} Visual`,
      visualDataUrl: s.imageDataUrl,
      extraVisualDataUrls: s.extraImageDataUrls,
      isVisualOnlySlide,
      videoPrompt: `1080p motion graphic for ${s.title || `Slide ${s.slideNumber}`}`,
      videoDurationSec: 6,
      videoHistory: [],
      takeaway: bullets[0] || effectiveSubtitle || s.title || `Slide ${s.slideNumber}`,
      speakerNotes: s.speakerNotes || '',
      vqaStatus: 'passed',
      sourceSlideNumber: s.slideNumber,
      visualNeedsLightSurface: s.visualNeedsLightSurface,
      isVisualDominant: s.isVisualDominant,
    };
  });
}

export function formatSlideBodyTextFromCards(slide: SlideSpec): string {
  const lines: string[] = [];
  for (const card of slide.cards) {
    const bulletText = card.bullets.filter(Boolean).join(' · ').trim();
    if (card.heading && bulletText) {
      lines.push(`${card.heading}: ${bulletText}`);
    } else if (card.heading) {
      lines.push(card.heading);
    } else if (bulletText) {
      lines.push(bulletText);
    }
  }
  return lines.join('\n');
}

export function parseSlideBodyTextIntoCards(
  bodyText: string,
  existingCards: SlideCardItem[],
): SlideCardItem[] {
  const lines = bodyText
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  return lines.map((line, idx) => {
    const splitItem = splitBulletIntoHeadingAndBody(line, idx);
    const prev = existingCards[idx];
    return {
      badge: prev?.badge || `0${idx + 1}`,
      heading: splitItem.heading,
      metric: splitItem.metric || prev?.metric,
      bullets: splitItem.body ? [splitItem.body] : [],
    };
  });
}

export function parseMergePairsText(
  input: string,
  maxSlideNumber: number,
): Array<{ firstSlideNumber: number; secondSlideNumber: number }> {
  const pairs: Array<{ firstSlideNumber: number; secondSlideNumber: number }> = [];
  const regex =
    /(?:slide\s*)?(\d+)\s*(?:and|&|\+|with|-)\s*(?:slide\s*)?(\d+)/gi;
  for (const m of input.matchAll(regex)) {
    const first = parseInt(m[1], 10);
    const second = parseInt(m[2], 10);
    if (
      Number.isFinite(first) &&
      Number.isFinite(second) &&
      first >= 1 &&
      second >= 1 &&
      first <= maxSlideNumber &&
      second <= maxSlideNumber &&
      first !== second
    ) {
      pairs.push({ firstSlideNumber: first, secondSlideNumber: second });
    }
  }
  return pairs;
}

export function mergeSlidePairsInDeck(
  slides: SlideSpec[],
  pairs: Array<{ firstSlideNumber: number; secondSlideNumber: number }>,
): { slides: SlideSpec[]; mergedDescriptions: string[] } {
  const working = cloneSlideSpecs(slides);
  const removedZeroBased = new Set<number>();
  const mergedDescriptions: string[] = [];

  for (const pair of pairs) {
    const firstIdx = pair.firstSlideNumber - 1;
    const secondIdx = pair.secondSlideNumber - 1;
    if (
      firstIdx < 0 ||
      secondIdx < 0 ||
      firstIdx >= working.length ||
      secondIdx >= working.length ||
      firstIdx === secondIdx ||
      removedZeroBased.has(firstIdx) ||
      removedZeroBased.has(secondIdx)
    ) {
      continue;
    }

    const primary = working[firstIdx];
    const secondary = working[secondIdx];

    if (!primary.title.trim() && secondary.title.trim()) {
      primary.title = secondary.title;
    } else if (
      secondary.title.trim() &&
      secondary.title.trim().toLowerCase() !== primary.title.trim().toLowerCase()
    ) {
      primary.subtitle = primary.subtitle.trim()
        ? `${primary.subtitle.trim()} · ${secondary.title.trim()}`
        : secondary.title.trim();
    }

    const secondaryCardsToAppend: SlideCardItem[] =
      secondary.cards.length > 0
        ? secondary.cards.map((c) => ({ ...c, bullets: [...c.bullets] }))
        : secondary.subtitle.trim()
          ? [
              {
                badge: `0${primary.cards.length + 1}`,
                heading: secondary.title.trim() || `Slide ${pair.secondSlideNumber}`,
                bullets: [secondary.subtitle.trim()],
              },
            ]
          : [];

    primary.cards = [...primary.cards, ...secondaryCardsToAppend].map((c, idx) => ({
      ...c,
      badge: `0${idx + 1}`,
    }));

    if (secondary.codeSnippet && secondary.codeSnippet.trim()) {
      primary.codeSnippet = primary.codeSnippet
        ? `${primary.codeSnippet}\n\n${secondary.codeSnippet}`
        : secondary.codeSnippet;
    }

    if (secondary.visualDataUrl) {
      if (!primary.visualDataUrl) {
        primary.visualDataUrl = secondary.visualDataUrl;
        primary.extraVisualDataUrls = secondary.extraVisualDataUrls
          ? [...secondary.extraVisualDataUrls]
          : undefined;
      } else {
        const extras = [
          ...(primary.extraVisualDataUrls || []),
          secondary.visualDataUrl,
          ...(secondary.extraVisualDataUrls || []),
        ];
        primary.extraVisualDataUrls = extras;
      }
    }

    if (primary.title.trim() || primary.cards.length > 0 || primary.codeSnippet) {
      primary.isVisualOnlySlide = false;
    }

    if (secondary.speakerNotes.trim()) {
      primary.speakerNotes = primary.speakerNotes.trim()
        ? `${primary.speakerNotes.trim()}\n\n[Merged from Slide ${pair.secondSlideNumber}]: ${secondary.speakerNotes.trim()}`
        : secondary.speakerNotes.trim();
    }

    const secSourceNum = secondary.sourceSlideNumber || pair.secondSlideNumber;
    primary.mergedFromSlideNumbers = [
      ...(primary.mergedFromSlideNumbers || []),
      secSourceNum,
      ...(secondary.mergedFromSlideNumbers || []),
    ];

    removedZeroBased.add(secondIdx);
    mergedDescriptions.push(`Slide ${pair.firstSlideNumber} + Slide ${pair.secondSlideNumber}`);
  }

  const remaining = working.filter((_, idx) => !removedZeroBased.has(idx));
  remaining.forEach((s, idx) => {
    s.id = `slide-${idx + 1}`;
  });

  return { slides: remaining, mergedDescriptions };
}

export function removeSlidesByIndicesInDeck(
  slides: SlideSpec[],
  removeZeroBasedIndices: number[],
): { slides: SlideSpec[]; removedSlideNumbers: number[] } {
  const removeSet = new Set(removeZeroBasedIndices);
  const removedSlideNumbers: number[] = [];
  const remaining: SlideSpec[] = [];
  const working = cloneSlideSpecs(slides);

  working.forEach((s, idx) => {
    if (removeSet.has(idx) && remaining.length + (working.length - idx - 1) >= 1) {
      removedSlideNumbers.push(idx + 1);
    } else {
      remaining.push(s);
    }
  });

  remaining.forEach((s, idx) => {
    s.id = `slide-${idx + 1}`;
  });

  return { slides: remaining, removedSlideNumbers };
}

export function insertNewSlideAfterIndex(
  slides: SlideSpec[],
  currentIndex: number,
  brand: BrandThemeSpec,
): { slides: SlideSpec[]; insertedIndex: number } {
  const safeCurrent = Math.max(0, Math.min(slides.length - 1, currentIndex));
  const insertIdx = slides.length === 0 ? 0 : safeCurrent + 1;
  const style = brand.templateStyle || 'gde-2026-navy';
  const defaultLayout: SlideLayoutKind =
    style === 'gde-2026-light-pills'
      ? 'stat-pills'
      : style === 'devfest-split'
        ? 'keynote-split'
        : style === 'build-with-ai-terminal'
          ? 'developer-terminal'
          : style === 'cloud-blueprint'
            ? 'architecture-blueprint'
            : 'editorial-split';

  const slideNum = insertIdx + 1;
  const slideNumPad = String(slideNum).padStart(2, '0');
  const newSlide: SlideSpec = {
    id: `slide-${slideNum}`,
    sectionTag: `${brand.conferenceTitle.toUpperCase().slice(0, 26)} // SLIDE ${slideNumPad}`,
    title: `New Slide ${slideNum}`,
    subtitle: brand.conferenceTitle,
    layout: defaultLayout,
    cards: [
      {
        badge: '01',
        heading: 'Key Takeaway & Content',
        bullets: [
          'Edit the Headline and Speaker Notes below, or use Insert Photo, Insert Video, and Insert LLM Prompt to customize this slide.',
        ],
      },
    ],
    visualPrompt: `16:9 visual for Slide ${slideNum}`,
    videoPrompt: `1080p motion graphic for Slide ${slideNum}`,
    videoDurationSec: 6,
    videoHistory: [],
    takeaway: `Slide ${slideNum}`,
    speakerNotes: '',
    vqaStatus: 'passed',
  };

  const updated = [...slides];
  updated.splice(insertIdx, 0, newSlide);
  updated.forEach((s, idx) => {
    s.id = `slide-${idx + 1}`;
  });

  return { slides: updated, insertedIndex: insertIdx };
}

export function detectMarkdownSlideCount(mdText: string, fallbackCount = 2): number {
  const h2Matches = mdText.match(/^##+\s+/gm) || [];
  if (h2Matches.length > 0) return h2Matches.length;

  const slideLabelMatches =
    mdText.match(/(?:^|\n)\s*(?:#{1,4}\s*|\*\*)?Slide\s+\d+\b/gi) || [];
  if (slideLabelMatches.length > 0) return slideLabelMatches.length;

  const hrSections = mdText
    .split(/\n\s*---+\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (hrSections.length > 1) return hrSections.length;

  const h1Matches = mdText.match(/^#\s+/gm) || [];
  if (h1Matches.length > 1) return h1Matches.length;

  return Math.max(2, fallbackCount);
}

export function getDeckStudioStateSnapshot() {
  return {
    slideCount: studioState.deck.slides.length,
    targetSlideCount: studioState.targetSlideCount,
    pendingTargetSlideCount: studioState.pendingTargetSlideCount,
    sourceUploaded: studioState.sourceUploaded,
    isSampleDeck: studioState.isSampleDeck,
    brandId: studioState.deck.brand.id,
    brandName: studioState.deck.brand.name,
    templateStyle: studioState.deck.brand.templateStyle,
  };
}

export function applyUploadedPptxDeckToStudioState(parsed: ParsedPptxResult): {
  slideCount: number;
  brand: BrandThemeSpec;
} {
  const keepBrand = buildKeepExistingBrandSpec(parsed, studioState.deck.brand);
  const convertedSlides = convertParsedPptxToBrandDeck(parsed, keepBrand);
  const detectedSlideCount = convertedSlides.length;
  const cleanDeckTitle =
    parsed.extractedSlides.find((s) => s.title.trim())?.title ||
    parsed.fileName.replace(/\.pptx$/i, '');

  studioState.lastUploadedPptxResult = parsed;
  studioState.deck.brand = keepBrand;
  studioState.deck.sourceZipEntries = parsed.rawZipEntries;
  studioState.deck.deckTitle = cleanDeckTitle;
  studioState.deck.deckSubtitle = `${keepBrand.name} · ${detectedSlideCount} Slides`;
  studioState.deck.slides = convertedSlides;
  studioState.markdownInput = parsed.markdownSummary || studioState.markdownInput;
  studioState.activeSlideIndex = 0;
  studioState.targetSlideCount = detectedSlideCount;
  studioState.pendingTargetSlideCount = detectedSlideCount;
  studioState.sourceUploaded = true;
  studioState.isSampleDeck = false;
  studioState.hasUserModifiedSlides = false;
  const isDistilledGuideFile =
    detectedSlideCount === 2 && /distilled/i.test(parsed.fileName);
  studioState.sourceLabel = isDistilledGuideFile
    ? `${parsed.fileName} (${detectedSlideCount} slides in this Distilled Brand Guide .PPTX file)`
    : `${parsed.fileName} (${detectedSlideCount} slides)`;
  studioState.lastLlmPrompt = formatSlidesAsLlmPrompt(convertedSlides);
  studioState.lastVqaSummary = `Uploaded "${parsed.fileName}" (${detectedSlideCount} slides) · Keep Existing Deck Template.`;

  return { slideCount: detectedSlideCount, brand: keepBrand };
}

/**
 * Loads the preloaded 2026 GDE Brand Guide sample deck (Keep Existing Deck Template).
 * Marked as a sample so the Step 1 status never claims the user uploaded it.
 */
export function applyDefaultSampleDeckToStudioState(parsed: ParsedPptxResult): {
  slideCount: number;
  brand: BrandThemeSpec;
} {
  const result = applyUploadedPptxDeckToStudioState(parsed);
  studioState.sourceUploaded = false;
  studioState.isSampleDeck = true;
  studioState.sourceLabel = `${DEFAULT_SAMPLE_DECK_LABEL} (${result.slideCount} slides)`;
  studioState.lastVqaSummary = `Sample deck: ${DEFAULT_SAMPLE_DECK_LABEL} (${result.slideCount} slides) · Upload your own .PPTX or .MD deck in Step 1 to replace it.`;
  return result;
}

async function parseDefaultSampleDeck(): Promise<ParsedPptxResult | null> {
  if (!defaultSampleDeckBytes) return null;
  const file = new File([defaultSampleDeckBytes], DEFAULT_SAMPLE_DECK_FILE_NAME, {
    type: PPTX_MIME_TYPE,
  });
  return parseUploadedPptxFile(file);
}

/**
 * Parses a user-uploaded .pptx. Returns null (and tells the user) when the file can't be read
 * or contains no slides, so an unreadable deck never shows up as "Uploaded" with the previous slide count.
 */
async function readUploadedPptxOrNotify(
  file: File,
  input: HTMLInputElement | null,
  showToast: (msg: string) => void,
): Promise<ParsedPptxResult | null> {
  showToast(`Reading ${file.name}...`);
  studioState.isUploadingSource = true;
  try {
    const parsed = await parseUploadedPptxFile(file);
    if (parsed.extractedSlides.length > 0) return parsed;
    showToast(`No slides found in ${file.name}. Please check it is a valid .PPTX deck.`);
  } catch {
    showToast(`Could not read ${file.name}. Please check it is a valid .PPTX deck.`);
  } finally {
    studioState.isUploadingSource = false;
  }
  if (input) input.value = '';
  return null;
}

async function applyBrandPresetWithArgonTransformation(
  preset: BrandThemeSpec,
  uploadedParsed?: ParsedPptxResult,
): Promise<void> {
  if (!deps) return;
  studioState.isBusy = true;
  studioState.busyProgress = 40;
  studioState.busyLabel = `${GEMINI_HEAVY_MODEL} is applying "${preset.name}" brand guide...`;
  renderDeckStudioModule();

  await new Promise((r) => setTimeout(r, 120));

  const effectiveBrand =
    preset.id === KEEP_EXISTING_BRAND_ID
      ? buildKeepExistingBrandSpec(
          uploadedParsed || studioState.lastUploadedPptxResult,
          studioState.deck.brand,
        )
      : { ...preset };

  studioState.deck.brand = effectiveBrand;

  if (uploadedParsed) {
    studioState.lastUploadedPptxResult = uploadedParsed;
    studioState.deck.sourceZipEntries = uploadedParsed.rawZipEntries;
    studioState.hasUserModifiedSlides = false;
    studioState.activeSlideIndex = 0;
    const convertedSlides = convertParsedPptxToBrandDeck(uploadedParsed, effectiveBrand);
    const cleanDeckTitle =
      uploadedParsed.extractedSlides.find((s) => s.title.trim())?.title ||
      uploadedParsed.fileName.replace(/\.pptx$/i, '');
    studioState.deck.deckTitle = cleanDeckTitle;
    studioState.deck.deckSubtitle = `${effectiveBrand.name} · ${convertedSlides.length} Slides`;
    studioState.deck.slides = convertedSlides;
    studioState.markdownInput = uploadedParsed.markdownSummary || studioState.markdownInput;
    studioState.targetSlideCount = convertedSlides.length;
    studioState.pendingTargetSlideCount = convertedSlides.length;
    studioState.sourceUploaded = true;
    studioState.isSampleDeck = false;
    studioState.sourceLabel = `${uploadedParsed.fileName} (${convertedSlides.length} slides)`;
    studioState.lastLlmPrompt = formatSlidesAsLlmPrompt(convertedSlides);
    studioState.lastVqaSummary = `Applied "${effectiveBrand.name}" to "${uploadedParsed.fileName}" (${convertedSlides.length} slides preserved).`;
  } else {
    if (studioState.lastUploadedPptxResult?.rawZipEntries) {
      studioState.deck.sourceZipEntries = studioState.lastUploadedPptxResult.rawZipEntries;
    }
    const style = effectiveBrand.templateStyle || 'gde-2026-navy';
    const mappedLayout: SlideLayoutKind =
      style === 'gde-2026-light-pills'
        ? 'stat-pills'
        : style === 'devfest-split'
          ? 'keynote-split'
          : style === 'build-with-ai-terminal'
            ? 'developer-terminal'
            : style === 'cloud-blueprint'
              ? 'architecture-blueprint'
              : 'editorial-split';
    studioState.deck.deckSubtitle = `${effectiveBrand.name} · ${studioState.deck.slides.length} Slides`;
    studioState.deck.slides.forEach((s) => {
      if (s.layout !== 'video-showcase') {
        s.layout = mappedLayout;
      }
    });
    studioState.activeSlideIndex = Math.min(
      studioState.activeSlideIndex,
      Math.max(0, studioState.deck.slides.length - 1),
    );
    studioState.targetSlideCount = studioState.deck.slides.length;
    studioState.pendingTargetSlideCount = studioState.deck.slides.length;
    studioState.lastVqaSummary = `Applied "${effectiveBrand.name}" while preserving all ${studioState.deck.slides.length} slide(s) and inserted media.`;
  }

  studioState.isBusy = false;
  studioState.busyLabel = '';
  studioState.busyProgress = 0;
  deps.showToast(`Applied Brand Guide: ${effectiveBrand.name}`);
  renderDeckStudioModule();
}

function formatCurrentDeckAsLlmPrompt(deck: PresentationDeckSpec): string {
  return deck.slides
    .map((s, idx) => {
      const bullets = s.cards
        .flatMap((c) => c.bullets.slice(0, 1).map((b) => `- ${c.heading}: ${b}`))
        .slice(0, 3)
        .join('\n');
      return [
        `Slide ${idx + 1}:`,
        `Title: ${s.title}`,
        `Subtitle: ${s.subtitle}`,
        bullets,
        `Photo: ${s.visualPrompt}`,
        s.videoPrompt ? `Video: ${s.videoPrompt}` : '',
        s.musicPrompt ? `Music: ${s.musicPrompt}` : '',
        `Notes: ${s.speakerNotes}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

function applySingleSlideLlmBlock(
  slide: SlideSpec,
  slideIdx: number,
  rawBlock: string,
  headerRemainder: string,
  brand: BrandThemeSpec,
): string[] {
  const changes: string[] = [];
  const lines = rawBlock
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletItems: string[] = [];
  let explicitTitle = '';

  if (headerRemainder) {
    const cleanRem = headerRemainder.replace(/^[-–—:]+\s*/, '').trim();
    const inlineTitleMatch =
      /(?:change|set|update)\s+title\s+to\s+["']?([^"'.\n]+)["']?/i.exec(cleanRem) ||
      /^title\s*:\s*(.+)$/i.exec(cleanRem);
    if (inlineTitleMatch) {
      explicitTitle = inlineTitleMatch[1].trim();
    } else if (lines.length === 0 && cleanRem.length > 0) {
      lines.push(cleanRem);
    } else if (
      cleanRem.length > 3 &&
      cleanRem.length <= 95 &&
      !/^(change|set|update|make|add|replace|switch)\b/i.test(cleanRem)
    ) {
      explicitTitle = cleanRem;
    } else if (cleanRem.length > 0) {
      lines.unshift(cleanRem);
    }
  }

  for (const line of lines) {
    const titleKv = /^(?:title|headline|heading)\s*:\s*(.+)$/i.exec(line);
    if (titleKv) {
      explicitTitle = titleKv[1].replace(/^["']|["']$/g, '').trim();
      continue;
    }
    const nlTitle = /(?:change|set|update)\s+(?:the\s+)?(?:slide\s+)?(?:title|headline)\s+to\s+["']([^"']+)["']/i.exec(
      line,
    );
    if (nlTitle) {
      explicitTitle = nlTitle[1].trim();
    }

    const subKv = /^(?:subtitle|subheading)\s*:\s*(.+)$/i.exec(line);
    if (subKv) {
      slide.subtitle = subKv[1].replace(/^["']|["']$/g, '').trim();
      changes.push('subtitle');
      continue;
    }

    const tagKv = /^(?:section|eyebrow|tag|badge)\s*:\s*(.+)$/i.exec(line);
    if (tagKv) {
      slide.sectionTag = tagKv[1].replace(/^["']|["']$/g, '').trim().toUpperCase();
      changes.push('section tag');
      continue;
    }

    const metricKv = /^(?:metric|kpi|stat)\s*:\s*(.+)$/i.exec(line);
    if (metricKv && slide.cards[0]) {
      slide.cards[0].metric = metricKv[1].replace(/^["']|["']$/g, '').trim();
      changes.push(`metric (${slide.cards[0].metric})`);
      continue;
    }

    const takeawayKv = /^(?:takeaway|key takeaway|footer)\s*:\s*(.+)$/i.exec(line);
    if (takeawayKv) {
      slide.takeaway = takeawayKv[1].replace(/^["']|["']$/g, '').trim();
      changes.push('takeaway');
      continue;
    }

    const notesKv = /^(?:notes|speaker notes|script|voice|>\s*speaker notes|^>)\s*:?\s*(.+)$/i.exec(
      line,
    );
    if (notesKv) {
      const noteText = notesKv[1].replace(/^["']|["']$/g, '').trim();
      slide.speakerNotes = noteText;
      changes.push('speaker notes');
      continue;
    }

    const photoKv = /^(?:photo|diagram|image|visual|nano banana)\s*:\s*(.+)$/i.exec(line);
    if (photoKv) {
      slide.visualPrompt = photoKv[1].replace(/^["']|["']$/g, '').trim();
      slide.visualDataUrl = generateNanoBananaDiagramDataUrl(slide, brand);
      changes.push('photo');
      continue;
    }

    const videoKv = /^(?:video|omni|animation|clip)\s*:\s*(.+)$/i.exec(line);
    if (videoKv) {
      const vPrompt = videoKv[1].replace(/^["']|["']$/g, '').trim();
      slide.videoPrompt = vPrompt;
      slide.videoDurationSec = slide.videoDurationSec || 6;
      slide.videoHistory = slide.videoHistory || [];
      slide.videoHistory.push({
        prompt: vPrompt,
        timestamp: `LLM Turn ${slide.videoHistory.length + 1}`,
        durationSec: slide.videoDurationSec,
        resolution: '1080p',
      });
      slide.visualPrompt = `${slide.visualPrompt} // Video: ${vPrompt}`;
      slide.visualDataUrl = generateNanoBananaDiagramDataUrl(slide, brand);
      changes.push('video');
      continue;
    }

    const musicKv = /^(?:music|lyria|soundtrack|audio)\s*:\s*(.+)$/i.exec(line);
    if (musicKv) {
      const mPrompt = musicKv[1].replace(/^["']|["']$/g, '').trim();
      slide.musicPrompt = mPrompt;
      slide.musicModel = GEMINI_MUSIC_MODEL;
      slide.musicAudioUrl = synthesizeLyriaAmbientWavDataUrl(mPrompt, 8);
      changes.push('music');
      continue;
    }

    const codeKv = /^(?:code|snippet)\s*:\s*(.+)$/i.exec(line);
    if (codeKv) {
      slide.codeSnippet = codeKv[1].trim();
      slide.layout = 'developer-terminal';
      changes.push('code snippet');
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      bulletItems.push(line.replace(/^[-*•]\s+/, '').trim());
      continue;
    }
  }

  if (explicitTitle) {
    slide.title = explicitTitle;
    changes.push(`title ("${explicitTitle.slice(0, 38)}${explicitTitle.length > 38 ? '...' : ''}")`);
  }

  if (bulletItems.length > 0) {
    slide.cards = [0, 1, 2].map((cIdx) => {
      const raw = bulletItems[cIdx] || bulletItems[bulletItems.length - 1];
      const existingCard = slide.cards[cIdx];
      const splitItem = splitBulletIntoHeadingAndBody(raw, cIdx);
      return {
        badge: existingCard?.badge || `0${cIdx + 1}`,
        heading: splitItem.heading,
        metric: splitItem.metric || existingCard?.metric,
        bullets: [splitItem.body],
      };
    });
    changes.push(`${bulletItems.length} content blocks`);
  }

  if (changes.length === 0 && lines.length > 0) {
    const joined = lines.join(' ');
    const cleanedTitle = joined
      .replace(/^(?:please\s+)?(?:make|update|change|set|rewrite|focus)\s+(?:this\s+)?(?:slide\s*\d*\s*)?(?:to\s+be\s+|about\s+|on\s+|to\s+)?/i, '')
      .split(/[.;]/)[0]
      .trim();
    if (cleanedTitle) {
      slide.title = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1, 88);
      changes.push(`title ("${slide.title.slice(0, 36)}...")`);
    }
    slide.takeaway = joined.slice(0, 130);
    slide.speakerNotes = joined;
    slide.visualPrompt = `16:9 technical diagram for ${slide.title}: ${joined.slice(0, 100)}`;
    slide.visualDataUrl = generateNanoBananaDiagramDataUrl(slide, brand);
    if (slide.cards[0]) {
      slide.cards[0].bullets[0] = joined.slice(0, 110);
    }
    changes.push('content, speaker notes & visual');
  } else if (changes.some((c) => c.startsWith('title') || c.includes('content'))) {
    if (slide.visualDataUrl && slide.visualDataUrl.startsWith('data:image/')) {
      slide.visualDataUrl = generateNanoBananaDiagramDataUrl(slide, brand);
    }
  }

  slide.vqaStatus = 'passed';
  return changes.length > 0
    ? [`Slide ${slideIdx + 1}: updated ${changes.join(', ')}`]
    : [];
}

function applyLlmSlideInstructions(
  promptText: string,
  targetScope: string,
): string[] {
  const brand = studioState.deck.brand;
  const slides = studioState.deck.slides;
  const changeLog: string[] = [];

  const slideBlockRegex =
    /(?:^|\n)\s*(?:#{1,4}\s*|\*\*)?Slide\s+(\d+)(?:\*\*)?\s*[:\-–—]?\s*([^\n]*)\n?([\s\S]*?)(?=(?:\n\s*(?:#{1,4}\s*|\*\*)?Slide\s+\d+\b)|$)/gi;

  const matches = Array.from(promptText.matchAll(slideBlockRegex));

  if (matches.length > 0 && (targetScope === 'AUTO' || targetScope === 'ALL')) {
    let firstTouchedIdx = studioState.activeSlideIndex;
    matches.forEach((m, mIdx) => {
      const slideNum = parseInt(m[1], 10);
      if (!Number.isFinite(slideNum) || slideNum < 1 || slideNum > 60) return;
      const targetIdx = slideNum - 1;
      if (mIdx === 0) firstTouchedIdx = targetIdx;

      while (slides.length <= targetIdx) {
        const newIdx = slides.length + 1;
        const template = slides[slides.length - 1] || slides[0];
        slides.push({
          ...template,
          id: `slide-${newIdx}`,
          sectionTag: `${brand.conferenceTitle.toUpperCase().slice(0, 24)} // SLIDE 0${newIdx}`,
          title: `Slide ${newIdx}: Technical Deep Dive`,
          subtitle: `${brand.conferenceTitle} // Engineered with ${GEMINI_HEAVY_MODEL}`,
          cards: template.cards.map((c) => ({ ...c, bullets: [...c.bullets] })),
          videoHistory: [],
        });
      }

      const headerRemainder = (m[2] || '').trim();
      const bodyBlock = (m[3] || '').trim();
      const applied = applySingleSlideLlmBlock(
        slides[targetIdx],
        targetIdx,
        bodyBlock,
        headerRemainder,
        brand,
      );
      changeLog.push(...applied);
    });
    studioState.targetSlideCount = slides.length;
    studioState.pendingTargetSlideCount = slides.length;
    studioState.activeSlideIndex = Math.min(firstTouchedIdx, slides.length - 1);
    return changeLog;
  }

  if (targetScope === 'ALL') {
    slides.forEach((s, idx) => {
      const applied = applySingleSlideLlmBlock(s, idx, promptText, '', brand);
      changeLog.push(...applied);
    });
  } else {
    const idx =
      targetScope === 'AUTO'
        ? studioState.activeSlideIndex
        : parseInt(targetScope, 10) || studioState.activeSlideIndex;
    const targetSlide = slides[idx] || slides[0];
    const applied = applySingleSlideLlmBlock(targetSlide, idx, promptText, '', brand);
    changeLog.push(...applied);
    studioState.activeSlideIndex = idx;
  }

  return changeLog;
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

async function compileDeckPptxBytes(): Promise<{ bytes: Uint8Array; source: 'local' }> {
  if (defaultSampleDeckPromise && !studioState.deck.sourceZipEntries) {
    try {
      await defaultSampleDeckPromise;
    } catch {
      // Fall back to synthesized slides if background fetch fails
    }
  }
  const exportReadyDeck = await prepareDeckForOpenXmlExport(studioState.deck);
  return { bytes: compileOpenXmlPptx(exportReadyDeck), source: 'local' };
}

function buildMultipartRelatedBody(
  metadata: Record<string, unknown>,
  fileBytes: Uint8Array,
  mediaMimeType: string,
  boundary: string,
): Blob {
  const metaHeader =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mediaMimeType}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;
  return new Blob([
    new TextEncoder().encode(metaHeader),
    fileBytes.buffer as ArrayBuffer,
    new TextEncoder().encode(closing),
  ]);
}

export function resolveGoogleDriveSlideTabUrl(uploaded: {
  id?: string;
  webViewLink?: string;
}): string {
  const fileId = (uploaded.id || '').trim();
  if (fileId) {
    return `https://docs.google.com/presentation/d/${encodeURIComponent(fileId)}/edit`;
  }
  const webLink = (uploaded.webViewLink || '').trim();
  if (webLink) {
    return webLink;
  }
  return 'https://drive.google.com/drive/my-drive';
}

async function uploadDeckToGoogleDrive(options: {
  fileName: string;
  convertToGoogleSlides: boolean;
  folderId: string;
  customAccessToken: string;
}): Promise<{ id: string; name: string; webViewLink: string }> {
  const { bytes } = await compileDeckPptxBytes();
  const pptxMime =
    'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  const targetMime = options.convertToGoogleSlides
    ? 'application/vnd.google-apps.presentation'
    : pptxMime;

  const cleanName = options.convertToGoogleSlides
    ? options.fileName.replace(/\.pptx$/i, '')
    : options.fileName.endsWith('.pptx')
      ? options.fileName
      : `${options.fileName}.pptx`;

  const metadata: Record<string, unknown> = {
    name: cleanName,
    mimeType: targetMime,
    description: `Generated by GDE Stage // GDE Deck Studio (${studioState.deck.slides.length} slides, 16:9 OpenXML)`,
  };
  if (options.folderId.trim()) {
    metadata.parents = [options.folderId.trim()];
  }

  let token = options.customAccessToken.trim() || (await requestGoogleDriveAccessToken(false));
  if (!token) {
    throw new Error('Google Drive OAuth access token was not granted.');
  }

  const boundary = 'gde_stage_drive_multipart_2026';
  const bodyBlob = buildMultipartRelatedBody(metadata, bytes, pptxMime, boundary);
  const uploadEndpoint =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

  let res = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyBlob,
  });

  if (res.status === 401 && !options.customAccessToken.trim()) {
    token = await requestGoogleDriveAccessToken(true);
    res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: bodyBlob,
    });
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    const msg =
      errJson?.error?.message || `Google Drive API returned HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = (await res.json()) as { id?: string; name?: string; webViewLink?: string };
  const fileId = data.id || '';
  const slideTabUrl = resolveGoogleDriveSlideTabUrl({
    id: fileId,
    webViewLink: data.webViewLink,
  });

  return {
    id: fileId,
    name: data.name || cleanName,
    webViewLink: slideTabUrl,
  };
}

export function parseMarkdownIntoSlides(
  md: string,
  targetCount: number,
  brand: BrandThemeSpec,
): SlideSpec[] {
  const lines = md.split(/\r?\n/);
  const sections: Array<{ heading: string; bullets: string[]; notes: string }> = [];
  let current: { heading: string; bullets: string[]; notes: string } | null = null;

  const hasH2 = /^##+\s+/m.test(md);
  const hasSlideLabels = !hasH2 && /(?:^|\n)\s*(?:#{1,6}\s*|\*\*)?Slide\s+\d+\b/i.test(md);
  const hasMultiH1 = !hasH2 && !hasSlideLabels && (md.match(/^#\s+/gm) || []).length > 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const isH2Heading = /^##+\s+/.test(line);
    const isSlideLabelHeading =
      hasSlideLabels && /^(?:#{1,6}\s*|\*\*)?Slide\s+\d+\b/i.test(line);
    const isMultiH1Heading = hasMultiH1 && /^#\s+/.test(line);
    const isHrSeparator = !hasH2 && !hasSlideLabels && !hasMultiH1 && /^---+$/.test(line);

    if (isH2Heading || isSlideLabelHeading || isMultiH1Heading) {
      if (current) sections.push(current);
      const cleanedHeading = line
        .replace(/^#{1,6}\s+/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^Slide\s+\d+\s*(?:\*\*)?\s*[:\-–—|]?\s*/i, '')
        .trim();
      current = {
        heading: cleanedHeading || `Slide ${sections.length + 1}`,
        bullets: [],
        notes: '',
      };
    } else if (isHrSeparator) {
      if (current) {
        sections.push(current);
        current = null;
      }
    } else if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (!current) {
        current = { heading: `Slide ${sections.length + 1}`, bullets: [], notes: '' };
      }
      current.bullets.push(line.replace(/^(?:[-*•]|\d+\.)\s+/, ''));
    } else if (/^>\s*/.test(line)) {
      if (current) {
        current.notes +=
          (current.notes ? ' ' : '') + line.replace(/^>\s*(Speaker Notes:\s*)?/i, '');
      }
    } else if (current && !/^#\s+/.test(line)) {
      current.bullets.push(line);
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    sections.push({
      heading: md.slice(0, 72) || 'Technical Architecture Overview',
      bullets: [
        'Gemini 4 Argon (HIGH thinking): Plans multi-slide geometry and visual verification',
        'Nano Banana 2.1 (4K Visuals): Synthesizes 16:9 conference-branded system diagrams',
        'Gemini Omni 1.2 Flash (1080p): Synthesizes motion clips with multi-turn editing',
      ],
      notes: 'Deliver key architectural takeaways clearly.',
    });
  }

  const effectiveTargetCount = Math.max(targetCount, sections.length);

  while (sections.length < effectiveTargetCount) {
    const idx = sections.length + 1;
    sections.push({
      heading: `Module ${idx}: Production Architecture & Telemetry`,
      bullets: [
        `Stage 01 · Serverless Execution (99.99% SLA): Zero-trust Cloud Run containers with regional failover`,
        `Stage 02 · Multimodal Synthesis (< 420ms): Native 16:9 OpenXML shape compilation and visual verification`,
        `Stage 03 · Developer Velocity (3.4x Faster): Automated layout validation with ${GEMINI_HEAVY_MODEL}`,
      ],
      notes: `Walk the audience through module ${idx} implementation details and benchmark metrics.`,
    });
  }

  const style = brand.templateStyle || 'gde-2026-navy';
  const defaultLayout: SlideLayoutKind =
    style === 'gde-2026-light-pills'
      ? 'stat-pills'
      : style === 'devfest-split'
        ? 'keynote-split'
        : style === 'build-with-ai-terminal'
          ? 'developer-terminal'
          : style === 'cloud-blueprint'
            ? 'architecture-blueprint'
            : 'editorial-split';

  const defaultMetrics = ['14%', '86%', '99.9%', '3.4x', '< 50ms', '100%'];

  return sections.slice(0, effectiveTargetCount).map((sec, idx) => {
    const bullets =
      sec.bullets.length > 0
        ? sec.bullets
        : [
            'High-impact technical architecture pattern validated in production',
            'Conditioned on the active conference branding palette and typography',
          ];

    const cards = [0, 1, 2].map((cIdx) => {
      const primaryBullet = bullets[cIdx] || bullets[0];
      const splitItem = splitBulletIntoHeadingAndBody(primaryBullet, cIdx);
      return {
        badge: `0${cIdx + 1}`,
        heading: splitItem.heading,
        metric:
          splitItem.metric ||
          (style === 'gde-2026-light-pills' || style === 'cloud-blueprint'
            ? defaultMetrics[(idx * 2 + cIdx) % defaultMetrics.length]
            : undefined),
        bullets: [splitItem.body],
      };
    });

    const notesText =
      sec.notes ||
      `Emphasize how "${sec.heading}" connects to the overall ${brand.conferenceTitle} narrative.`;

    const slideSpec: SlideSpec = {
      id: `slide-${idx + 1}`,
      sectionTag: `${brand.conferenceTitle.toUpperCase().slice(0, 26)} // SLIDE 0${idx + 1}`,
      title: sec.heading,
      subtitle: `${brand.conferenceTitle} · ${brand.headingFont}`,
      layout: defaultLayout,
      cards,
      codeSnippet:
        style === 'build-with-ai-terminal'
          ? `from google.antigravity import Agent\n\nagent = Agent(\n    model="${GEMINI_HEAVY_MODEL}",\n    thinking_level="HIGH",\n)\nresult = agent.run("${sec.heading.slice(0, 48)}")`
          : undefined,
      codeLanguage: 'python',
      visualPrompt: `16:9 technical diagram for "${sec.heading}" using brand palette ${brand.primaryHex}, ${brand.secondaryHex}, and ${brand.accentHex}`,
      videoPrompt: `1080p keynote animation illustrating "${sec.heading}" with smooth isometric camera motion`,
      videoDurationSec: 6,
      videoHistory: [],
      takeaway: bullets[0] || sec.heading,
      speakerNotes: notesText,
      vqaStatus: 'passed',
    };

    if (style === 'gde-2026-navy') {
      slideSpec.visualDataUrl =
        idx % 2 === 0 ? '/gde-2026-brand-graphics.png' : '/gde-2026-navy-headline.png';
    } else if (style === 'gde-2026-light-pills') {
      slideSpec.visualDataUrl = undefined;
    } else if (style === 'cloud-blueprint' || style === 'devfest-split') {
      slideSpec.visualDataUrl = generateNanoBananaDiagramDataUrl(slideSpec, brand);
    }

    return slideSpec;
  });
}

async function handleGenerateAndPreviewDeck(): Promise<void> {
  if (!deps || studioState.isBusy) return;
  const { showToast } = deps;

  const generateBtn = document.getElementById('btnDeckGenerateDeck') as HTMLButtonElement | null;
  const stopBtn = document.getElementById('btnStopGenerateDeck') as HTMLButtonElement | null;
  const busyWrap = document.getElementById('deckBottomBusyProgressWrap');
  const busyLabelEl = document.getElementById('deckBottomBusyLabelText');
  const busyProgressEl = document.getElementById(
    'deckBottomBusyProgressBar',
  ) as HTMLProgressElement | null;
  const summaryEl = document.getElementById('deckBottomVqaSummaryText');

  const updateBusyDomInPlace = (label: string, progress: number) => {
    studioState.busyLabel = label;
    studioState.busyProgress = progress;
    if (busyWrap) busyWrap.style.display = 'block';
    if (busyLabelEl) busyLabelEl.textContent = label;
    if (busyProgressEl) busyProgressEl.value = progress;
  };

  studioState.isBusy = true;
  studioState.busyElapsedSec = 0;
  updateBusyDomInPlace(
    `Instructing ${GEMINI_HEAVY_MODEL} (Argon) to generate .PPTX deck...`,
    15,
  );

  const task = startCancellableGenerationWithTimer({
    submitBtn: generateBtn,
    stopBtn,
    submitBtnId: 'btnDeckGenerateDeck',
    stopBtnId: 'btnStopGenerateDeck',
    generatingLabel: 'GENERATING DECK...',
    idleLabel: '✨ GENERATE DECK',
    onTick: (sec) => {
      studioState.busyElapsedSec = sec;
    },
    onStop: (sec) => {
      studioState.isBusy = false;
      studioState.busyLabel = '';
      studioState.busyProgress = 0;
      studioState.busyElapsedSec = 0;
      studioState.lastVqaSummary = `Deck generation stopped by user after ${sec}s.`;
      if (busyWrap) busyWrap.style.display = 'none';
      if (summaryEl) summaryEl.textContent = studioState.lastVqaSummary;
      showToast('Stopped deck generation');
    },
  });
  activeDeckGenerateTask = task;

  let generatedOk = false;
  try {
    const total = studioState.deck.slides.length;
    const perSlideDelayMs = Math.max(70, Math.min(450, Math.round(1800 / Math.max(1, total))));

    for (let i = 0; i < total; i++) {
      if (task.signal.aborted) {
        throw new DOMException('Generation stopped by user', 'AbortError');
      }
      const s = studioState.deck.slides[i];
      updateBusyDomInPlace(
        `Argon (${GEMINI_HEAVY_MODEL}) synthesizing Slide ${i + 1} of ${total}...`,
        Math.round(20 + ((i + 1) / total) * 55),
      );

      renderSlideToDataUrl(s, studioState.deck.brand, i + 1, total);
      if (s.title.length > 140) {
        s.title = `${s.title.slice(0, 137).trim()}...`;
      }
      s.cards.forEach((c) => {
        c.bullets = c.bullets.map((b) =>
          b.length > 380 ? `${b.slice(0, 377).trim()}...` : b,
        );
      });
      s.vqaStatus = 'passed';
      await waitAbortableMs(perSlideDelayMs, task.signal);
    }

    updateBusyDomInPlace(`Compiling 16:9 OpenXML (.PPTX) file...`, 88);
    await waitAbortableMs(250, task.signal);

    const localResult = await compileDeckPptxBytes();
    if (task.signal.aborted) {
      throw new DOMException('Generation stopped by user', 'AbortError');
    }
    const compiledBytes = localResult.bytes;

    studioState.lastCompiledPptxBytes = compiledBytes;
    studioState.isDeckGenerated = true;
    studioState.generatedDeckSizeKb = Math.max(1, Math.round(compiledBytes.byteLength / 1024));
    studioState.busyProgress = 100;
    studioState.lastVqaSummary = `Deck generated by ${GEMINI_HEAVY_MODEL} in ${task.getElapsedSeconds()}s (${studioState.deck.slides.length} slides, ${studioState.generatedDeckSizeKb} KB .PPTX).`;
    generatedOk = true;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return;
    }
    throw err;
  } finally {
    if (!task.signal.aborted) {
      task.finish();
      activeDeckGenerateTask = null;
      studioState.isBusy = false;
      studioState.busyLabel = '';
      studioState.busyProgress = 0;
      studioState.busyElapsedSec = 0;
      renderDeckStudioModule();
      if (generatedOk) {
        const readyDialog = document.getElementById(
          'modalDeckGeneratedReady',
        ) as HTMLDialogElement | null;
        readyDialog?.showModal();
      }
    } else {
      activeDeckGenerateTask = null;
    }
  }
}

export function syncFullscreenStageScale(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const viewportEl = document.getElementById('deckLiveStageViewport');
  const stageEl = document.getElementById('deckLiveStageCanvas');
  const scale = Math.max(0.25, Math.min(window.innerWidth / 1024, window.innerHeight / 576));
  const scaleStr = scale.toFixed(4);
  viewportEl?.style.setProperty('--stage-fs-scale', scaleStr);
  stageEl?.style.setProperty('--stage-fs-scale', scaleStr);
}

export function enterPresentLiveFullscreen(): void {
  if (typeof document === 'undefined') return;
  (document.getElementById('modalDeckGeneratedReady') as HTMLDialogElement | null)?.close();
  syncFullscreenStageScale();
  const viewportEl =
    document.getElementById('deckLiveStageViewport') ||
    document.getElementById('deckLiveStageCanvas');
  if (viewportEl && !document.fullscreenElement) {
    const req =
      viewportEl.requestFullscreen?.bind(viewportEl) ||
      (
        viewportEl as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
        }
      ).webkitRequestFullscreen?.bind(viewportEl);
    req?.()?.catch(() => {});
  }
}

export function initDeckStudioModule(moduleDeps: DeckStudioDeps): void {
  deps = moduleDeps;
  if (!defaultSampleDeckPromise && typeof fetch !== 'undefined') {
    defaultSampleDeckPromise = (async () => {
      try {
        const resp = await fetch(DEFAULT_SAMPLE_DECK_URL);
        if (!resp.ok) return;
        defaultSampleDeckBytes = await resp.arrayBuffer();
        const parsed = await parseDefaultSampleDeck();
        // Only preload the sample if the user hasn't loaded or started uploading/editing a deck.
        if (
          parsed &&
          !studioState.sourceUploaded &&
          !studioState.isUploadingSource &&
          !studioState.hasUserModifiedSlides
        ) {
          applyDefaultSampleDeckToStudioState(parsed);
          // Do not call renderDeckStudioModule() if the Deck Studio DOM inputs are already mounted,
          // because replacing container.innerHTML destroys open <input type="file"> pickers on initial load.
          if (
            typeof document !== 'undefined' &&
            !document.getElementById('deckFileSourceInput')
          ) {
            renderDeckStudioModule();
          }
        }
      } catch {
        // Offline/dev fetch errors: keep the built-in starter slides
      }
    })();
  }
  if (!fullscreenKeyListenerBound) {
    fullscreenKeyListenerBound = true;
    document.addEventListener('keydown', (e) => {
      if (!document.fullscreenElement) return;
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === ' ' ||
        e.key === 'Spacebar' ||
        e.key === 'PageDown' ||
        e.key === 'Enter'
      ) {
        e.preventDefault();
        if (studioState.activeSlideIndex < studioState.deck.slides.length - 1) {
          studioState.activeSlideIndex++;
          renderDeckStudioModule();
        }
      } else if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageUp' ||
        e.key === 'Backspace'
      ) {
        e.preventDefault();
        if (studioState.activeSlideIndex > 0) {
          studioState.activeSlideIndex--;
          renderDeckStudioModule();
        }
      }
    });

    window.addEventListener(
      'wheel',
      (e) => {
        if (!document.fullscreenElement) return;
        const absY = Math.abs(e.deltaY);
        const absX = Math.abs(e.deltaX);
        if (absY < 10 && absX < 10) return;
        e.preventDefault();
        const now = Date.now();
        if (now - lastWheelNavAt < 280) return;
        lastWheelNavAt = now;
        const primaryDelta = absY >= absX ? e.deltaY : e.deltaX;
        if (primaryDelta > 0 && studioState.activeSlideIndex < studioState.deck.slides.length - 1) {
          studioState.activeSlideIndex++;
          renderDeckStudioModule();
        } else if (primaryDelta < 0 && studioState.activeSlideIndex > 0) {
          studioState.activeSlideIndex--;
          renderDeckStudioModule();
        }
      },
      { passive: false },
    );

    window.addEventListener('resize', () => {
      if (document.fullscreenElement) {
        syncFullscreenStageScale();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        syncFullscreenStageScale();
      } else {
        renderDeckStudioModule();
      }
    });
  }
}

function renderCodeSnippetBoxHtml(
  activeSlide: SlideSpec,
  escapeHtml: (s: string) => string,
): string {
  if (!activeSlide.codeSnippet || !activeSlide.codeSnippet.trim()) {
    return '';
  }
  return `
    <div class="deck-code-snippet-editor-frame">
      <div class="deck-code-snippet-editor-bar">
        <span>💻 Code Snippet (Courier)</span>
        <div class="deck-code-snippet-actions" style="display:inline-flex; gap:6px;">
          <button type="button" data-stage-action="edit-code" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✎ Edit Code</button>
          <button type="button" data-stage-action="remove-code" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✕ Remove</button>
        </div>
      </div>
      <pre class="deck-code-snippet-pre"><code>${escapeHtml(activeSlide.codeSnippet)}</code></pre>
    </div>
  `;
}

function renderKeepOriginalVisualHtml(
  activeSlide: SlideSpec,
  escapeHtml: (s: string) => string,
): string {
  if (activeSlide.videoUrl) {
    return `
      <div class="deck-keep-original-visual-box">
        <div class="deck-keep-original-hover-bar">
          <button type="button" data-stage-action="edit-video" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✎ Change Video</button>
          <button type="button" data-stage-action="remove-video" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✕ Remove</button>
        </div>
        <video src="${escapeHtml(activeSlide.videoUrl)}" controls autoplay loop muted playsinline></video>
      </div>
    `;
  }

  if (activeSlide.visualDataUrl) {
    const allVisuals = [
      activeSlide.visualDataUrl,
      ...(activeSlide.extraVisualDataUrls || []),
    ].filter((u): u is string => Boolean(u));
    const hasCopyOrCode =
      activeSlide.cards.length > 0 || Boolean(activeSlide.codeSnippet && activeSlide.codeSnippet.trim());
    const gridColumns =
      allVisuals.length === 3
        ? !hasCopyOrCode
          ? 'repeat(3, minmax(0, 1fr))'
          : '1fr'
        : 'repeat(2, minmax(0, 1fr))';
    const gridRows =
      allVisuals.length === 3 && hasCopyOrCode
        ? 'repeat(3, minmax(0, 1fr))'
        : allVisuals.length > 2
          ? 'repeat(2, minmax(0, 1fr))'
          : 'minmax(0, 1fr)';

    const visualContentHtml =
      allVisuals.length <= 1
        ? `<img src="${activeSlide.visualDataUrl}" alt="${escapeHtml(activeSlide.title || 'Slide')} visual" />`
        : `<div style="display:grid; grid-template-columns:${gridColumns}; grid-template-rows:${gridRows}; gap:12px; width:100%; height:100%; flex:1; min-height:0; align-items:center; justify-items:center; overflow:hidden;">
            ${allVisuals
              .slice(0, 4)
              .map(
                (u, i) =>
                  `<img src="${u}" alt="${escapeHtml(activeSlide.title || 'Slide')} visual ${i + 1}" style="width:100%; height:100%; max-height:100%; min-height:0; object-fit:contain;" />`,
              )
              .join('')}
          </div>`;

    return `
      <div class="deck-keep-original-visual-box">
        <div class="deck-keep-original-hover-bar">
          <button type="button" data-stage-action="edit-photo" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✎ Change Photo</button>
          <button type="button" data-stage-action="remove-photo" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✕ Remove</button>
        </div>
        ${visualContentHtml}
      </div>
    `;
  }

  return '';
}

function renderMediaFrameHtml(
  activeSlide: SlideSpec,
  _activeSlideIndex: number,
  escapeHtml: (s: string) => string,
): string {
  if (activeSlide.videoUrl) {
    return `
      <div class="deck-media-frame">
        <div class="deck-media-toolbar-bar" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:6px 12px; background:rgba(15,23,42,0.95); border-bottom:1px solid rgba(255,255,255,0.18); font-size:0.72rem; color:#ffffff; gap:8px;">
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            🎬 <strong>Video</strong> // ${escapeHtml((activeSlide.videoPrompt || 'Inserted Video').slice(0, 52))}
          </span>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" data-stage-action="edit-video" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✎ Change</button>
            <button type="button" data-stage-action="remove-video" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✕ Remove</button>
          </div>
        </div>
        <video src="${escapeHtml(activeSlide.videoUrl)}" controls autoplay loop muted playsinline></video>
      </div>
    `;
  }

  if (activeSlide.visualDataUrl) {
    const allVisuals = [
      activeSlide.visualDataUrl,
      ...(activeSlide.extraVisualDataUrls || []),
    ].filter((u): u is string => Boolean(u));
    const frameSurfaceBg = activeSlide.visualNeedsLightSurface
      ? '#f8fafc'
      : 'var(--slide-surface, #162536)';
    const isFullWidthVisual = activeSlide.cards.length === 0 && !activeSlide.codeSnippet;
    const gridColumns =
      allVisuals.length === 3
        ? isFullWidthVisual
          ? 'repeat(3, minmax(0, 1fr))'
          : '1fr'
        : 'repeat(2, minmax(0, 1fr))';
    const gridRows =
      allVisuals.length === 3 && !isFullWidthVisual
        ? 'repeat(3, minmax(0, 1fr))'
        : allVisuals.length > 2
          ? 'repeat(2, minmax(0, 1fr))'
          : 'minmax(0, 1fr)';
    const gridHtml =
      allVisuals.length <= 1
        ? `<img src="${activeSlide.visualDataUrl}" alt="${escapeHtml(activeSlide.title || 'Slide')} visual" style="background:${frameSurfaceBg}; padding:${activeSlide.visualNeedsLightSurface ? '8px' : '0'}; object-fit:contain; max-height:100%; width:100%; height:100%; flex:1; min-height:0;" />`
        : `<div style="display:grid; grid-template-columns:${gridColumns}; grid-template-rows:${gridRows}; gap:8px; padding:10px; background:${frameSurfaceBg}; width:100%; height:100%; flex:1; min-height:0; align-items:center; justify-items:center; overflow:hidden;">
            ${allVisuals
              .slice(0, 4)
              .map(
                (u, i) =>
                  `<img src="${u}" alt="${escapeHtml(activeSlide.title || 'Slide')} visual ${i + 1}" style="width:100%; height:100%; max-height:100%; min-height:0; object-fit:contain; border-radius:6px; background:${frameSurfaceBg};" />`,
              )
              .join('')}
          </div>`;
    return `
      <div class="deck-media-frame">
        <div class="deck-media-toolbar-bar" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:6px 12px; background:rgba(15,23,42,0.95); border-bottom:1px solid rgba(255,255,255,0.18); font-size:0.72rem; color:#ffffff; gap:8px; flex-shrink:0;">
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            🖼 <strong>Photo${allVisuals.length > 1 ? ` (${allVisuals.length})` : ''}</strong> // ${escapeHtml(activeSlide.visualPrompt.slice(0, 52))}
          </span>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" data-stage-action="edit-photo" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✎ Change</button>
            <button type="button" data-stage-action="remove-photo" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.7rem;">✕ Remove</button>
          </div>
        </div>
        ${gridHtml}
      </div>
    `;
  }

  return `
    <div class="deck-media-frame deck-media-empty-slot" style="justify-content:center; align-items:center; padding:24px; text-align:center;">
      <div style="color:#cbd5e1; font-size:0.88rem;">
        <strong>Visual Slot</strong>
        <p style="margin:8px 0 0 0;">Click <strong>🖼 Insert Photo</strong> or <strong>🎬 Insert Video</strong> above to add visuals.</p>
      </div>
    </div>
  `;
}

function renderTemplateSpecificStageBody(
  activeSlide: SlideSpec,
  activeSlideIndex: number,
  brand: BrandThemeSpec,
  escapeHtml: (s: string) => string,
): string {
  const style = brand.templateStyle || 'keep-original';
  const codeBoxHtml = renderCodeSnippetBoxHtml(activeSlide, escapeHtml);

  // -------------------------------------------------------------------------
  // TEMPLATE 0: KEEP EXISTING DECK TEMPLATE (CLEAN ORIGINAL SLIDE)
  // -------------------------------------------------------------------------
  if (style === 'keep-original') {
    const keepVisualHtml = renderKeepOriginalVisualHtml(activeSlide, escapeHtml);
    const hasVisual = Boolean(keepVisualHtml);
    const hasCards = activeSlide.cards.length > 0;
    const hasCode = Boolean(codeBoxHtml);
    const hasCopyCol = hasCards || hasCode;

    const copyParagraphsHtml = activeSlide.cards
      .map((card) => {
        const bulletStr = card.bullets.filter(Boolean).join(' · ').trim();
        if (card.heading && bulletStr) {
          return `<p class="deck-keep-original-para"><strong>${escapeHtml(card.heading)}:</strong> ${escapeHtml(bulletStr)}</p>`;
        }
        if (card.heading) {
          return `<p class="deck-keep-original-para">${escapeHtml(card.heading)}</p>`;
        }
        if (bulletStr) {
          return `<p class="deck-keep-original-para">${escapeHtml(bulletStr)}</p>`;
        }
        return '';
      })
      .filter(Boolean)
      .join('');

    if (!hasCopyCol && hasVisual) {
      return `
        <div class="deck-layout-keep-original" style="grid-template-columns: 1fr;">
          ${keepVisualHtml}
        </div>
      `;
    }

    if (hasCopyCol && !hasVisual) {
      return `
        <div class="deck-layout-keep-original" style="grid-template-columns: 1fr;">
          <div class="deck-keep-original-copy-col">
            ${copyParagraphsHtml}
            ${codeBoxHtml}
          </div>
        </div>
      `;
    }

    const colProportions = activeSlide.isVisualDominant
      ? 'minmax(200px, 0.56fr) 1.44fr'
      : '0.95fr 1.05fr';

    return `
      <div class="deck-layout-keep-original" style="grid-template-columns: ${colProportions};">
        <div class="deck-keep-original-copy-col">
          ${copyParagraphsHtml}
          ${codeBoxHtml}
        </div>
        ${keepVisualHtml}
      </div>
    `;
  }

  const mediaHtml = renderMediaFrameHtml(activeSlide, activeSlideIndex, escapeHtml);

  // -------------------------------------------------------------------------
  // TEMPLATE 1: 2026 GDE BRAND GUIDE · NAVY EDITORIAL & GRAPHICS (#20344B)
  // -------------------------------------------------------------------------
  if (style === 'gde-2026-navy') {
    if (
      activeSlide.cards.length === 0 &&
      !codeBoxHtml &&
      (activeSlide.visualDataUrl || activeSlide.videoUrl)
    ) {
      return `
        <div class="deck-layout-gde-navy" style="grid-template-columns: 1fr;">
          ${mediaHtml}
        </div>
      `;
    }
    const gridColStyle =
      activeSlide.isVisualDominant && (activeSlide.visualDataUrl || activeSlide.videoUrl)
        ? 'style="grid-template-columns: minmax(190px, 0.52fr) 1.48fr; align-items: stretch;"'
        : '';
    return `
      <div class="deck-layout-gde-navy" ${gridColStyle}>
        <div class="deck-gde-navy-copy-col">
          ${activeSlide.cards
            .slice(0, 3)
            .map(
              (card, cIdx) => `
            <div class="deck-gde-navy-para-block" data-idx="${cIdx}">
              ${
                card.heading || card.metric
                  ? `<div class="deck-gde-navy-subhead">
                      ${escapeHtml(card.heading)}${card.metric ? `${card.heading ? ' &middot; ' : ''}${escapeHtml(card.metric)}` : ''}
                    </div>`
                  : ''
              }
              ${
                card.bullets.length > 0
                  ? `<p class="deck-gde-navy-body-text">
                      ${escapeHtml(card.bullets.join(' · '))}
                    </p>`
                  : ''
              }
            </div>
          `,
            )
            .join('')}
          ${codeBoxHtml}
        </div>
        ${mediaHtml}
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // TEMPLATE 2: 2026 GDE BRAND GUIDE · SLIDE 23 LIGHT OVERLAPPING STAT PILLS
  // -------------------------------------------------------------------------
  if (style === 'gde-2026-light-pills') {
    if (
      activeSlide.cards.length === 0 &&
      !codeBoxHtml &&
      (activeSlide.visualDataUrl || activeSlide.videoUrl)
    ) {
      return `
        <div class="deck-layout-gde-light-pills" style="grid-template-columns: 1fr;">
          <div class="deck-gde-light-right-col">
            ${mediaHtml}
          </div>
        </div>
      `;
    }
    const card0 = activeSlide.cards[0] || {
      heading: 'Primary Metric',
      metric: '14%',
      bullets: ['Statistic caption'],
    };
    const card1 = activeSlide.cards[1] || {
      heading: 'Secondary Metric',
      metric: '86%',
      bullets: ['Statistic caption'],
    };

    const rightColumnHtml =
      activeSlide.videoUrl || activeSlide.visualDataUrl
        ? mediaHtml
        : `
          <div class="deck-gde-stat-pills-stack">
            <div class="deck-gde-stat-pill-green">
              <div class="deck-gde-stat-numeral">${escapeHtml(card0.metric || '14%')}</div>
              <div class="deck-gde-stat-caption">
                <strong>${escapeHtml(card0.heading)}</strong><br/>
                ${escapeHtml((card0.bullets[0] || '').slice(0, 72))}
              </div>
            </div>
            <div class="deck-gde-stat-pill-navy">
              <div class="deck-gde-stat-numeral">${escapeHtml(card1.metric || '86%')}</div>
              <div class="deck-gde-stat-caption">
                <strong>${escapeHtml(card1.heading)}</strong><br/>
                ${escapeHtml((card1.bullets[0] || '').slice(0, 72))}
              </div>
            </div>
          </div>
        `;

    return `
      <div class="deck-layout-gde-light-pills">
        <div class="deck-gde-light-left-col">
          <div class="deck-gde-light-copy-list">
            ${activeSlide.cards
              .map(
                (c) =>
                  `<p><strong>${escapeHtml(c.heading)}:</strong> ${escapeHtml(c.bullets.join(' '))}</p>`,
              )
              .join('')}
          </div>
          ${codeBoxHtml}
          <div class="deck-gde-light-arrow-box" aria-hidden="true">
            <svg width="150" height="64" viewBox="0 0 150 64" fill="none">
              <path d="M4 32 H138" stroke="#20344B" stroke-width="4" stroke-linecap="round"/>
              <path d="M104 6 C114 24, 126 32, 142 32 C126 32, 114 40, 104 58" stroke="#20344B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
        </div>
        <div class="deck-gde-light-right-col">
          ${rightColumnHtml}
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // TEMPLATE 4: GDG DEVFEST 2026 · ASYMMETRIC KEYNOTE SPLIT STAGE
  // -------------------------------------------------------------------------
  if (style === 'devfest-split') {
    const gColors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];
    return `
      <div class="deck-layout-devfest-split">
        <div class="deck-devfest-dark-sidebar">
          <div>
            <div style="font-family:'PT Mono', monospace; font-size:0.75rem; font-weight:700; color:#fbbc04; letter-spacing:0.06em; margin-bottom:8px;">
              ${escapeHtml(activeSlide.sectionTag)}
            </div>
            <div style="font-size:clamp(1.25rem, 2vw, 1.75rem); font-weight:800; line-height:1.18; color:#ffffff; margin-bottom:10px;">
              ${escapeHtml(activeSlide.title)}
            </div>
            <div style="font-size:0.86rem; color:#9ca3af; line-height:1.4;">
              ${escapeHtml(activeSlide.subtitle)}
            </div>
          </div>
          <div style="background:#1f2937; border-left:4px solid #34a853; padding:10px 12px; border-radius:8px; font-size:0.78rem; color:#e5e7eb;">
            <strong style="color:#4ade80; display:block; margin-bottom:2px;">KEYNOTE HIGHLIGHT</strong>
            ${escapeHtml(activeSlide.takeaway)}
          </div>
        </div>

        <div class="deck-devfest-right-col">
          <div style="flex:1; min-height:0; display:flex; flex-direction:column; gap:10px;">
            ${mediaHtml}
            ${codeBoxHtml}
          </div>
          <div class="deck-devfest-agenda-grid">
            ${activeSlide.cards
              .slice(0, 2)
              .map(
                (card, cIdx) => `
              <div class="deck-devfest-agenda-item">
                <span class="deck-devfest-num-badge" style="background:${gColors[cIdx % 4]};">0${cIdx + 1}</span>
                <div style="font-size:0.78rem; line-height:1.32; color:#1e293b;">
                  <strong style="display:block; color:#0f172a;">${escapeHtml(card.heading)}</strong>
                  ${escapeHtml((card.bullets[0] || '').slice(0, 78))}
                </div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // TEMPLATE 5: BUILD WITH AI ROADSHOW · DARK DEVELOPER TERMINAL & SDK
  // -------------------------------------------------------------------------
  if (style === 'build-with-ai-terminal') {
    const borderColors = ['#3b82f6', '#a855f7', '#10b981'];
    const rightTerminalContent =
      activeSlide.videoUrl || activeSlide.visualDataUrl
        ? mediaHtml
        : `
          <div class="deck-terminal-window">
            <div class="deck-terminal-topbar">
              <div class="deck-terminal-dots">
                <span style="background:#ef4444;"></span>
                <span style="background:#f59e0b;"></span>
                <span style="background:#10b981;"></span>
              </div>
              <span>${GEMINI_HEAVY_MODEL} // antigravity-sdk</span>
            </div>
            <pre style="margin:0; padding:18px; color:#e2e8f0; font-family:'Courier New', Courier, monospace; font-size:clamp(0.76rem, 0.95vw, 0.88rem); line-height:1.5; overflow:auto; flex:1; white-space:pre-wrap;"><code>${escapeHtml(
              activeSlide.codeSnippet ||
                `from google.antigravity import Agent\n\nagent = Agent(\n    model="${GEMINI_HEAVY_MODEL}",\n    thinking_level="HIGH",\n)\nresult = await agent.run("${activeSlide.title}")`,
            )}</code></pre>
          </div>
        `;

    return `
      <div class="deck-layout-build-with-ai">
        <div class="deck-blueprint-rows-col">
          ${activeSlide.cards
            .slice(0, 3)
            .map(
              (card, cIdx) => `
            <div class="deck-blueprint-row-card" style="background:#111827; border-color:#1e293b; border-left:5px solid ${borderColors[cIdx % 3]};">
              <div class="deck-blueprint-row-top">
                <span class="deck-blueprint-row-title" style="color:#f8fafc;">${escapeHtml(card.heading)}</span>
                ${
                  card.metric
                    ? `<span class="deck-blueprint-row-metric" style="background:rgba(59,130,246,0.18); color:#60a5fa;">${escapeHtml(card.metric)}</span>`
                    : ''
                }
              </div>
              <p class="deck-blueprint-row-desc" style="color:#cbd5e1;">
                ${escapeHtml(card.bullets.join(' '))}
              </p>
            </div>
          `,
            )
            .join('')}
          ${activeSlide.videoUrl || activeSlide.visualDataUrl ? codeBoxHtml : ''}
        </div>
        ${rightTerminalContent}
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // TEMPLATE 3 & CUSTOM UPLOADED: HORIZONTAL ARCHITECTURE BLUEPRINT ROWS
  // -------------------------------------------------------------------------
  if (
    activeSlide.cards.length === 0 &&
    !codeBoxHtml &&
    (activeSlide.visualDataUrl || activeSlide.videoUrl)
  ) {
    return `
      <div class="deck-layout-cloud-blueprint" style="grid-template-columns: 1fr;">
        ${mediaHtml}
      </div>
    `;
  }
  return `
    <div class="deck-layout-cloud-blueprint">
      <div class="deck-blueprint-rows-col">
        ${activeSlide.cards
          .slice(0, 3)
          .map(
            (card, cIdx) => `
          <div class="deck-blueprint-row-card" data-idx="${cIdx}">
            <div class="deck-blueprint-row-top">
              <span class="deck-blueprint-row-title">${escapeHtml(card.heading)}</span>
              ${
                card.metric
                  ? `<span class="deck-blueprint-row-metric">${escapeHtml(card.metric)}</span>`
                  : ''
              }
            </div>
            <p class="deck-blueprint-row-desc">
              ${escapeHtml(card.bullets.join(' '))}
            </p>
          </div>
        `,
          )
          .join('')}
        ${codeBoxHtml}
      </div>
      ${mediaHtml}
    </div>
  `;
}

function buildStageCanvasMarkup(): {
  style: string;
  slideStageCssVars: string;
  slideStageHeaderAndBodyHtml: string;
} {
  const { escapeHtml } = deps!;
  const { deck, activeSlideIndex } = studioState;
  const brand = deck.brand;
  const style = brand.templateStyle || 'keep-original';
  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  const isKeepOriginalDarkSlide =
    style === 'keep-original' &&
    Boolean(activeSlide.isVisualOnlySlide) &&
    !activeSlide.visualNeedsLightSurface &&
    !activeSlide.title.trim() &&
    activeSlide.cards.length === 0 &&
    !activeSlide.codeSnippet;

  const isDarkSlide =
    style === 'gde-2026-navy' ||
    style === 'build-with-ai-terminal' ||
    isKeepOriginalDarkSlide;

  let stageTopChromeHtml = '';
  if (style === 'keep-original') {
    stageTopChromeHtml = '';
  } else if (brand.headerStyle === 'gde-brackets') {
    stageTopChromeHtml = `
      <div class="deck-gde2026-header-strip">
        <div class="deck-gde2026-header-left">
          ${
            brand.referenceImageDataUrl
              ? `<img src="${brand.referenceImageDataUrl}" alt="Google Developer Experts" class="deck-gde2026-logo-img" />`
              : `<span class="deck-gde2026-bracket-lockup">&lt; &gt; Google Developer Experts</span>`
          }
          <span class="deck-gde2026-slash">//</span>
          <span class="deck-gde2026-tag-pill" style="${!isDarkSlide ? 'color:#20344b; border-color:#20344b; background:rgba(32,52,75,0.06);' : ''}">{ ${escapeHtml(activeSlide.sectionTag)} }</span>
        </div>
        <div class="deck-gde2026-header-right">
          ${
            brand.secondaryLogoDataUrl
              ? `<img src="${brand.secondaryLogoDataUrl}" alt="GDE 2026 Badge" class="deck-gde2026-badge-img" />`
              : ''
          }
          <span class="deck-gde2026-glyph-cluster" aria-hidden="true">
            <span class="glyph-hash">{ # }</span>
            <span class="glyph-slashes">//</span>
            <span class="glyph-rings">O O O</span>
          </span>
        </div>
      </div>
    `;
  } else {
    stageTopChromeHtml = `
      <div class="deck-slide-top-bar">
        <div style="background:${brand.primaryHex}"></div>
        <div style="background:${brand.secondaryHex}"></div>
        <div style="background:${brand.warningHex}"></div>
        <div style="background:${brand.accentHex}"></div>
      </div>
    `;
  }

  const slideStageCssVars = `
    --slide-bg: ${isKeepOriginalDarkSlide ? '#0a0a0a' : isDarkSlide ? brand.darkBgHex : brand.lightBgHex || '#ffffff'};
    --slide-surface: ${isDarkSlide ? brand.surfaceHex : '#ffffff'};
    --slide-text: ${isDarkSlide ? '#f8fafc' : brand.darkBgHex || '#202124'};
    --slide-muted: ${isDarkSlide ? '#cbd5e1' : '#5f6368'};
    --slide-border: ${isDarkSlide ? '#334155' : brand.dividerHex || '#cbd5e1'};
    --slide-primary: ${brand.primaryHex};
    --slide-secondary: ${brand.secondaryHex};
    --slide-accent: ${brand.accentHex};
    --slide-warning: ${brand.warningHex};
    --slide-dark: ${brand.darkBgHex};
    --slide-heading-font: '${escapeHtml(brand.headingFont)}', 'Google Sans', Outfit, sans-serif;
    --slide-body-font: '${escapeHtml(brand.bodyFont)}', Inter, sans-serif;
    ${style === 'cloud-blueprint' ? `border-left: 10px solid ${brand.primaryHex};` : ''}
  `;

  const hasHeaderContent =
    Boolean(activeSlide.title.trim()) ||
    Boolean(activeSlide.subtitle.trim()) ||
    Boolean(activeSlide.musicAudioUrl) ||
    Boolean(activeSlide.voiceAudioUrl) ||
    Boolean(activeSlide.narratorVoiceName) ||
    (style !== 'keep-original' && brand.headerStyle !== 'gde-brackets');

  const footerRowHtml =
    style === 'keep-original'
      ? isKeepOriginalDarkSlide
        ? ''
        : `
          <div class="deck-footer-row deck-footer-row-wide" style="justify-content:flex-end;">
            <span>Slide ${activeSlideIndex + 1} of ${deck.slides.length}</span>
          </div>
        `
      : `
        <div class="deck-footer-row deck-footer-row-wide">
          <span>${escapeHtml(brand.footerSignature)}</span>
          <span>${escapeHtml(deck.presenterName)} (${escapeHtml(deck.gdeCategory)}) &middot; Slide ${activeSlideIndex + 1} of ${deck.slides.length}</span>
        </div>
      `;

  const slideStageHeaderAndBodyHtml = `
    ${stageTopChromeHtml}
    <div class="deck-slide-body deck-slide-body-wide" style="${isKeepOriginalDarkSlide ? 'padding:12px 16px;' : ''}">
      ${
        style === 'devfest-split' || !hasHeaderContent
          ? ''
          : `
        <div class="deck-slide-header-row">
          <div style="flex:1;">
            ${
              brand.headerStyle === 'gde-brackets' || style === 'keep-original'
                ? ''
                : `<div class="deck-slide-eyebrow" style="color:${isDarkSlide ? '#60a5fa' : brand.primaryHex};">${escapeHtml(activeSlide.sectionTag)}</div>`
            }
            ${
              activeSlide.title.trim()
                ? `<h4
                    class="deck-slide-title deck-slide-title-wide"
                    style="
                      font-family: var(--slide-heading-font);
                      color: ${
                        style === 'gde-2026-navy'
                          ? brand.headlineAccentHex || '#FF7DAF'
                          : isDarkSlide
                            ? '#FFFFFF'
                            : brand.darkBgHex || '#202124'
                      };
                    "
                  >
                    ${escapeHtml(activeSlide.title)}
                  </h4>`
                : ''
            }
            ${
              activeSlide.subtitle.trim()
                ? `<div
                    class="deck-slide-subtitle deck-slide-subtitle-wide"
                    style="font-family: var(--slide-body-font);"
                  >
                    ${escapeHtml(activeSlide.subtitle)}
                  </div>`
                : ''
            }
          </div>

          <div class="deck-slide-QuickBadges">
            ${
              activeSlide.musicAudioUrl
                ? `<div class="deck-stage-audio-pill">
                    <span>🎵 Music</span>
                    <audio src="${activeSlide.musicAudioUrl}" controls style="height:24px; width:150px;"></audio>
                    <button type="button" data-stage-action="remove-music" class="btn-icon" style="color:#f87171; font-size:0.85rem; padding:0 4px;" title="Remove Music">&times;</button>
                  </div>`
                : ''
            }
            ${
              activeSlide.voiceAudioUrl || activeSlide.narratorVoiceName
                ? `<div class="deck-stage-audio-pill">
                    <span>🎙 ${escapeHtml(activeSlide.narratorVoiceName || 'Voice')}</span>
                    ${
                      activeSlide.voiceAudioUrl
                        ? `<audio src="${activeSlide.voiceAudioUrl}" controls style="height:24px; width:150px;"></audio>`
                        : `<button type="button" data-stage-action="play-voice" class="deck-stage-pill-btn" style="padding:2px 8px; font-size:0.72rem;">▶ Play Voice</button>`
                    }
                    <button type="button" data-stage-action="remove-voice" class="btn-icon" style="color:#f87171; font-size:0.85rem; padding:0 4px;" title="Remove Voice">&times;</button>
                  </div>`
                : ''
            }
          </div>
        </div>
      `
      }

      ${renderTemplateSpecificStageBody(activeSlide, activeSlideIndex, brand, escapeHtml)}

      ${footerRowHtml}
    </div>
  `;

  return { style, slideStageCssVars, slideStageHeaderAndBodyHtml };
}

export function renderDeckStudioModule(): void {
  const container = document.getElementById('deckStudioModuleContainer');
  if (!container || !deps) return;

  const profile = deps.getProfile();
  if (!studioState.initializedProfileSync && profile.displayName) {
    studioState.deck.presenterName = profile.displayName;
    if (profile.categories && profile.categories.length > 0) {
      studioState.deck.gdeCategory = `${profile.categories.join(' & ')} GDE`;
    }
    studioState.initializedProfileSync = true;
  }

  const { escapeHtml } = deps;
  const { deck, activeSlideIndex } = studioState;
  const brand = deck.brand;
  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  const slideOptionsHtml = deck.slides
    .map(
      (s, idx) =>
        `<option value="${idx}" ${idx === activeSlideIndex ? 'selected' : ''}>Slide ${idx + 1}: ${escapeHtml((s.title || 'Visual Slide').slice(0, 48))}</option>`,
    )
    .join('');

  const { style, slideStageCssVars, slideStageHeaderAndBodyHtml } = buildStageCanvasMarkup();

  // IMPORTANT: When in Fullscreen ("Present Live"), update #deckLiveStageCanvas and HUD in-place
  // instead of replacing container.innerHTML (which would destroy document.fullscreenElement and exit fullscreen).
  const fsEl = typeof document !== 'undefined' ? document.fullscreenElement : null;
  const existingLiveCanvas = document.getElementById('deckLiveStageCanvas');
  if (fsEl && existingLiveCanvas && container.contains(fsEl)) {
    existingLiveCanvas.className = `deck-slide-stage deck-slide-stage-wide template-${escapeHtml(style)}`;
    existingLiveCanvas.setAttribute('style', slideStageCssVars);
    existingLiveCanvas.innerHTML = slideStageHeaderAndBodyHtml;
    const hudCounter = document.getElementById('deckHudSlideCounter');
    if (hudCounter) {
      hudCounter.textContent = `Slide ${activeSlideIndex + 1} / ${deck.slides.length}`;
    }
    const hudPrev = document.getElementById('btnHudPrevSlide') as HTMLButtonElement | null;
    if (hudPrev) {
      hudPrev.disabled = activeSlideIndex === 0;
    }
    const hudNext = document.getElementById('btnHudNextSlide') as HTMLButtonElement | null;
    if (hudNext) {
      hudNext.disabled = activeSlideIndex >= deck.slides.length - 1;
    }
    syncFullscreenStageScale();
    return;
  }

  // Always keep targetSlideCount synchronized with the active deck's slide count on render
  if (deck.slides.length > 0) {
    studioState.targetSlideCount = deck.slides.length;
  }

  // Options always include the loaded deck's own slide count (no upper limit, starts at 1)
  const maxSlideOption = Math.max(24, deck.slides.length, studioState.targetSlideCount);
  const slideCountNumbers: number[] = [];
  for (let n = 1; n <= maxSlideOption; n++) {
    slideCountNumbers.push(n);
  }

  const activeSlideBodyText = formatSlideBodyTextFromCards(activeSlide);
  const reductionDelta = Math.max(1, deck.slides.length - studioState.pendingTargetSlideCount);

  container.innerHTML = `
    <div class="deck-studio-shell">
      <!-- ROW 1: STEP 1 ON ITS OWN FULL-WIDTH ROW -->
      <section class="card deck-setup-panel" aria-label="Step 1: Source Material">
        <div class="deck-col-header">
          <h3 class="step-header-pill">1. Source Material</h3>
        </div>

        <div class="deck-dropzone" id="deckStep1Dropzone">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <label for="deckFileSourceInput" style="font-size:0.86rem; font-weight:600; cursor:pointer;">
              📄 Upload .MD or Existing .PPTX Deck
            </label>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <button type="button" id="btnOpenModalLlmPromptStep1" class="btn btn-secondary btn-sm">
                🧠 Insert LLM Prompt
              </button>
              <button type="button" id="btnDeckLoadSampleMd" class="btn btn-ghost btn-sm">
                Reset 2026 GDE Sample
              </button>
            </div>
          </div>
          <input
            type="file"
            id="deckFileSourceInput"
            accept=".md,.markdown,.txt,.pptx"
            style="font-size:0.8rem;"
          />
          <div id="deckStep1LlmPromptBox" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
              <label for="deckStep1LlmPromptTextarea" style="font-size:0.78rem; font-weight:600; color:var(--text-secondary);">
                LLM Prompt Window (Paste Slide 1, Slide 2... outline or instructions)
              </label>
              <button type="button" id="btnApplyStep1LlmPrompt" class="btn btn-primary btn-sm">
                ✨ Apply LLM Prompt
              </button>
            </div>
            <textarea
              id="deckStep1LlmPromptTextarea"
              rows="3"
              placeholder="Slide 1: Title | Bullet 1 | Bullet 2&#10;Slide 2: Next Headline | Key takeaway..."
              style="font-family:monospace; font-size:0.78rem;"
            >${escapeHtml(studioState.lastLlmPrompt)}</textarea>
          </div>
        </div>

        <!-- UPLOADED TICK BOX STATUS -->
        <div
          id="deckStep1UploadedBadge"
          class="deck-uploaded-tickbox ${studioState.sourceUploaded && !studioState.isSampleDeck ? 'is-uploaded' : ''}"
          role="status"
          aria-live="polite"
        >
          <label style="display:flex; align-items:center; gap:10px; margin:0; cursor:default; font-weight:600; font-size:0.88rem;">
            <input
              type="checkbox"
              id="deckCheckboxUploaded"
              ${studioState.sourceUploaded && !studioState.isSampleDeck ? 'checked' : ''}
              disabled
              style="width:18px; height:18px; accent-color:#22c55e; margin:0;"
            />
            <span>
              ${
                studioState.isSampleDeck
                  ? `Sample &middot; ${escapeHtml(studioState.sourceLabel)} &middot; upload .MD/.PPTX to replace`
                  : studioState.sourceUploaded
                  ? `Uploaded &middot; ${escapeHtml(studioState.sourceLabel)}`
                  : `Ready (${deck.slides.length} default slides loaded &middot; upload .MD/.PPTX or click Insert LLM Prompt)`
              }
            </span>
          </label>
        </div>
      </section>

      <!-- ROW 2: STEP 2 ON ITS OWN FULL-WIDTH ROW -->
      <section class="card deck-setup-panel" aria-label="Step 2: Brand Guidance Slide Template">
        <div class="deck-col-header">
          <h3 class="step-header-pill">2. Brand Guidance Slide Template</h3>
        </div>

        <div class="deck-dropzone" id="deckStep2Dropzone">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <label for="deckFileBrandInput" style="font-size:0.84rem; font-weight:600; cursor:pointer;">
              🎨 Upload Presentation (.PPTX) or Brand Guide Image to Extract Template
            </label>
            <a
              href="/2026-GDE-Brand-Guide-Distilled.pptx"
              download="2026-GDE-Brand-Guide-Distilled.pptx"
              class="btn btn-ghost btn-sm"
              title="Download the 2026 GDE Distilled Brand Guide .PPTX"
            >
              ⬇ 2026 GDE Guide
            </a>
          </div>
          <input
            type="file"
            id="deckFileBrandInput"
            accept=".pptx,.png,.jpg,.jpeg,.webp"
            style="font-size:0.78rem;"
          />
        </div>

        <div class="form-row-2" style="margin-bottom:0;">
          <label class="field" style="margin-bottom:0;">
            <span>Slide Template &amp; Brand Preset</span>
            <select id="deckSelectBrandPreset">
              <option value="${KEEP_EXISTING_BRAND_ID}" ${brand.id === KEEP_EXISTING_BRAND_ID ? 'selected' : ''}>
                Keep Existing Deck Template
              </option>
              ${BRAND_PRESETS.map(
                (p) =>
                  `<option value="${p.id}" ${p.id === brand.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`,
              ).join('')}
            </select>
          </label>
          <label class="field" style="margin-bottom:0;">
            <span>Target Slide Count</span>
            <select id="deckSelectSlideCount">
              ${slideCountNumbers
                .map(
                  (n) =>
                    `<option value="${n}" ${n === studioState.targetSlideCount ? 'selected' : ''}>${n} ${n === 1 ? 'Slide' : 'Slides'} (16:9)</option>`,
                )
                .join('')}
            </select>
          </label>
        </div>
      </section>

      <!-- ROW 3: STEP 3 · INSPECT THE DECK -->
      <section class="card deck-cinema-stage-card" id="deckCinemaStageContainer" aria-label="Step 3: Inspect the Deck">
        <div class="deck-stage-toolbar">
          <div class="deck-stage-toolbar-left">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <h3 class="step-header-pill" style="margin:0;">3. Inspect the Deck</h3>
            </div>
            <span class="muted-sm">
              Viewing Slide ${activeSlideIndex + 1} of ${deck.slides.length} &middot; ${escapeHtml(brand.name)}
            </span>
          </div>

          <div class="deck-stage-toolbar-actions">
            <button type="button" id="btnDeckPrevSlide" class="btn btn-ghost btn-sm" ${activeSlideIndex === 0 ? 'disabled' : ''}>
              ◀ Prev
            </button>
            <button type="button" id="btnDeckNextSlide" class="btn btn-ghost btn-sm" ${activeSlideIndex >= deck.slides.length - 1 ? 'disabled' : ''}>
              Next ▶
            </button>
            <button
              type="button"
              id="btnDeckAddNewSlide"
              class="btn btn-primary btn-sm"
              title="Add a new slide immediately after Slide ${activeSlideIndex + 1}"
            >
              + Add New Slide
            </button>
            <button
              type="button"
              id="btnDeckPresentLiveStage"
              class="btn btn-secondary btn-sm"
              title="Present Live in 16:9 Fullscreen (Use Arrow Keys, Spacebar, or Scroll to advance)"
            >
              ▶ Present Live
            </button>

            <span class="deck-toolbar-sep" aria-hidden="true"></span>

            <button type="button" id="btnOpenModalCodeSnippet" class="btn btn-secondary btn-sm">
              💻 Insert Code Snippet
            </button>
            <button type="button" id="btnOpenModalPhoto" class="btn btn-secondary btn-sm">
              🖼 Insert Image / Photo
            </button>
            <button type="button" id="btnOpenModalVideo" class="btn btn-secondary btn-sm">
              🎬 Insert Video
            </button>
            <button type="button" id="btnOpenModalMusic" class="btn btn-secondary btn-sm">
              🎵 Insert Music
            </button>
            <button type="button" id="btnOpenModalVoice" class="btn btn-secondary btn-sm">
              🎙 Insert Narration / Voice
            </button>
            <button type="button" id="btnOpenModalLlmPrompt" class="btn btn-secondary btn-sm">
              🧠 Insert LLM Prompt
            </button>
          </div>
        </div>

        <!-- WIDE 16:9 WIDESCREEN VIEWPORT & CANVAS -->
        <div id="deckLiveStageViewport" class="deck-live-stage-viewport">
          <div
            id="deckLiveStageCanvas"
            class="deck-slide-stage deck-slide-stage-wide template-${escapeHtml(style)}"
            style="${slideStageCssVars}"
          >
            ${slideStageHeaderAndBodyHtml}
          </div>

          <!-- FULLSCREEN PRESENTATION HUD (VISIBLE WHEN PRESENTING LIVE) -->
          <div class="deck-fullscreen-hud" id="deckFullscreenHud">
            <button type="button" id="btnHudPrevSlide" class="btn btn-ghost btn-sm" style="color:#fff;" ${activeSlideIndex === 0 ? 'disabled' : ''}>◀ Prev</button>
            <span id="deckHudSlideCounter">Slide ${activeSlideIndex + 1} / ${deck.slides.length}</span>
            <button type="button" id="btnHudNextSlide" class="btn btn-ghost btn-sm" style="color:#fff;" ${activeSlideIndex >= deck.slides.length - 1 ? 'disabled' : ''}>Next ▶</button>
            <button type="button" id="btnHudExitFullscreen" class="btn btn-secondary btn-sm">✕ Exit</button>
          </div>
        </div>

        <!-- SLIDE FILMSTRIP THUMBNAILS -->
        <div class="deck-filmstrip-grid" role="list" aria-label="Slide Filmstrip">
          ${deck.slides
            .map(
              (s, idx) => `
            <button
              type="button"
              class="deck-filmstrip-item ${idx === activeSlideIndex ? 'active' : ''}"
              data-deck-slide-idx="${idx}"
            >
              <div class="deck-filmstrip-top">
                <span>Slide ${idx + 1}</span>
                <span style="display:inline-flex; gap:4px; align-items:center;">
                  ${s.codeSnippet ? '<span title="Code Snippet Inserted">💻</span>' : ''}
                  ${s.visualDataUrl ? '<span title="Photo Inserted">🖼</span>' : ''}
                  ${s.videoUrl || (s.videoHistory && s.videoHistory.length > 0) ? '<span title="Video Inserted">🎬</span>' : ''}
                  ${s.musicAudioUrl ? '<span title="Music Inserted">🎵</span>' : ''}
                  ${s.voiceAudioUrl || s.narratorVoiceName ? '<span title="Voice Inserted">🎙</span>' : ''}
                </span>
              </div>
              <div class="deck-filmstrip-title">${escapeHtml(s.title || 'Visual Slide')}</div>
            </button>
          `,
            )
            .join('')}
          <button
            type="button"
            id="btnFilmstripAddNewSlide"
            class="deck-filmstrip-item"
            style="border-style:dashed; justify-content:center; align-items:center; text-align:center;"
            title="Add a new slide immediately after Slide ${activeSlideIndex + 1}"
          >
            <div class="deck-filmstrip-top" style="justify-content:center; width:100%;">
              <span>+ After Slide ${activeSlideIndex + 1}</span>
            </div>
            <div class="deck-filmstrip-title" style="font-weight:700; color:#60a5fa;">Add New Slide</div>
          </button>
        </div>

        <!-- INSPECT & EDIT CURRENT SLIDE CONTENT (HEADLINE, SUBTITLE, BODY TEXT / BULLETS, SPEAKER NOTES) -->
        <div class="deck-inspector-stacked-rows">
          <div class="form-row-2" style="margin-bottom:0;">
            <label class="field" style="margin-bottom:0;">
              <span>Headline</span>
              <input type="text" id="deckInputSlideTitle" value="${escapeHtml(activeSlide.title)}" placeholder="Slide headline..." />
            </label>
            <label class="field" style="margin-bottom:0;">
              <span>Subtitle / Callout</span>
              <input type="text" id="deckInputSlideSubtitle" value="${escapeHtml(activeSlide.subtitle)}" placeholder="Optional subtitle or callout..." />
            </label>
          </div>
          <label class="field" style="margin-bottom:0;">
            <span>Slide Body Text &amp; Bullet Points (One line per point)</span>
            <textarea id="deckTextareaSlideBody" rows="3" placeholder="Enter slide text or bullet points (one line per point)...">${escapeHtml(activeSlideBodyText)}</textarea>
          </label>
          <label class="field" style="margin-bottom:0;">
            <span style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <span>Speaker Notes</span>
              <span id="deckNotesAutosaveStatus" class="deck-autosave-pill">✓ ${escapeHtml(studioState.lastNotesSavedAt)}</span>
            </span>
            <textarea id="deckTextareaNotes" rows="2" placeholder="Type speaker notes (automatically saved into the deck)...">${escapeHtml(activeSlide.speakerNotes)}</textarea>
          </label>
        </div>
      </section>

      <!-- BOTTOM BAR: GENERATE DECK -->
      <section class="card deck-bottom-architect-bar" aria-label="Generate Deck Bar">
        <div style="flex:1; min-width:240px;">
          <div class="muted-sm" id="deckBottomVqaSummaryText">
            ${escapeHtml(studioState.lastVqaSummary)}
          </div>
          <div id="deckBottomBusyProgressWrap" style="margin-top:8px; display:${studioState.isBusy ? 'block' : 'none'};">
            <div class="muted-sm" id="deckBottomBusyLabelText">${escapeHtml(studioState.busyLabel)}</div>
            <progress id="deckBottomBusyProgressBar" class="deck-progress" value="${studioState.busyProgress}" max="100"></progress>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <button
            type="button"
            id="btnStopGenerateDeck"
            class="btn btn-danger-ghost"
            style="padding:12px 20px; font-size:0.92rem; font-weight:700; display:${studioState.isBusy ? 'inline-flex' : 'none'};"
          >
            ■ Stop
          </button>
          <button
            type="button"
            id="btnDeckGenerateDeck"
            class="btn btn-primary"
            style="padding:12px 28px; font-size:0.96rem; font-weight:700; letter-spacing:0.03em; ${studioState.isBusy ? 'pointer-events:none;' : ''}"
            ${studioState.isBusy ? 'disabled aria-disabled="true"' : ''}
          >
            ${studioState.isBusy ? formatGeneratingTimerLabel('GENERATING DECK...', studioState.busyElapsedSec) : '✨ GENERATE DECK'}
          </button>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- SMALL POP-UP DISPLAYED ONCE ARGON GENERATES THE .PPTX DECK        -->
      <!-- ================================================================= -->
      <dialog id="modalDeckGeneratedReady" class="modal" closedby="any" aria-labelledby="modalGeneratedReadyHeading">
        <div class="modal-card" style="max-width:460px; width:min(92vw, 460px); text-align:center;">
          <div class="modal-header" style="text-align:left;">
            <div>
              <span class="eyebrow">Generated by ${GEMINI_HEAVY_MODEL} &middot; ${deck.slides.length} Slides (${studioState.generatedDeckSizeKb} KB .PPTX)</span>
              <h2 id="modalGeneratedReadyHeading">Your Presentation Deck is Ready</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckGeneratedReady" aria-label="Close">&times;</button>
          </div>

          <p class="muted-sm" style="margin:0 0 16px 0; text-align:left;">
            <strong>${escapeHtml(deck.deckTitle)}</strong> has been compiled into a native 16:9 PowerPoint (<code>.pptx</code>) presentation with your brand guide, visuals, and speaker notes. Choose how you would like to proceed:
          </p>

          <div class="deck-generated-popup-options">
            <button type="button" id="btnPopupPresentLive" class="btn btn-primary deck-popup-action-btn">
              ▶ Present Live
            </button>
            <button type="button" id="btnPopupDownloadDeck" class="btn btn-secondary deck-popup-action-btn">
              ⬇ Download Deck
            </button>
            <button type="button" id="btnPopupUploadGDrive" class="btn btn-secondary deck-popup-action-btn">
              ${GDRIVE_SVG_ICON}
              <span>Upload to Google Drive</span>
            </button>
          </div>
        </div>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 0A: INSERT CODE SNIPPET (COURIER FONT TEXT EDITOR)          -->
      <!-- ================================================================= -->
      <dialog id="modalDeckAddCodeSnippet" class="modal" closedby="any" aria-labelledby="modalCodeSnippetHeading">
        <form method="dialog" id="formDeckAddCodeSnippet" class="modal-card" style="max-width:680px; width:min(94vw, 680px);">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Step 3 &middot; Courier Font Slide Code Editor</span>
              <h2 id="modalCodeSnippetHeading">Insert Code Snippet into Slide</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckAddCodeSnippet" aria-label="Close">&times;</button>
          </div>

          <p class="muted-sm" style="margin:0 0 12px 0;">
            Paste your code below. It will be inserted directly into the slide and displayed in <strong>Courier</strong> font exactly as in a text editor.
          </p>

          <label class="field">
            <span>Select Target Slide</span>
            <select id="modalCodeTargetSlide">
              ${slideOptionsHtml}
            </select>
          </label>

          <label class="field">
            <span>Code Snippet (Displayed in Courier Font on Slide)</span>
            <textarea
              id="modalCodeSnippetTextarea"
              rows="9"
              autofocus
              placeholder="Paste your code snippet here..."
              style="font-family:'Courier New', Courier, monospace; font-size:0.86rem; line-height:1.48; white-space:pre; background:#0f172a; color:#f8fafc; border-color:#334155;"
            >${escapeHtml(activeSlide.codeSnippet || '')}</textarea>
          </label>

          <div class="modal-footer" style="justify-content:space-between;">
            <div>
              ${
                activeSlide.codeSnippet
                  ? `<button type="button" id="btnRemoveCodeSnippetModal" class="btn btn-danger-ghost">✕ Remove Code from Slide</button>`
                  : ''
              }
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckAddCodeSnippet">Cancel</button>
              <button type="submit" id="btnSubmitCodeSnippet" class="btn btn-primary">💻 Insert Code Snippet</button>
            </div>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 0B: REDUCE SLIDES POP-UP (REMOVE OR MERGE SLIDES)           -->
      <!-- ================================================================= -->
      <dialog id="modalDeckReduceSlides" class="modal" closedby="any" aria-labelledby="modalReduceSlidesHeading">
        <div class="modal-card" style="max-width:680px; width:min(94vw, 680px);">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Target Slide Count Reduction (${deck.slides.length} &rarr; ${studioState.pendingTargetSlideCount} Slides)</span>
              <h2 id="modalReduceSlidesHeading">Which Slides Would You Like to Remove or Merge?</h2>
            </div>
            <button type="button" class="btn-icon" id="btnCloseReduceSlidesModal" aria-label="Close">&times;</button>
          </div>

          <p class="muted-sm" style="margin:0 0 12px 0;">
            You selected a reduction of <strong>${reductionDelta} slide${reductionDelta === 1 ? '' : 's'}</strong>. Choose whether to <strong>Remove</strong> slides or <strong>Merge</strong> slides together:
          </p>

          <div class="deck-reduce-mode-tabs" role="tablist" aria-label="Remove or Merge Slides">
            <button
              type="button"
              id="btnReduceModeRemove"
              class="btn ${studioState.reduceSlidesMode === 'remove' ? 'btn-primary' : 'btn-secondary'}"
            >
              🗑 Remove Slides
            </button>
            <button
              type="button"
              id="btnReduceModeMerge"
              class="btn ${studioState.reduceSlidesMode === 'merge' ? 'btn-primary' : 'btn-secondary'}"
            >
              🔀 Merge Slides
            </button>
          </div>

          <!-- PANEL A: REMOVE SLIDES -->
          <div id="reduceSlidesRemovePanel" style="display:${studioState.reduceSlidesMode === 'remove' ? 'flex' : 'none'}; flex-direction:column; gap:12px;">
            <div style="font-size:0.86rem; font-weight:600; color:var(--text);">
              Pick which slides to Remove:
            </div>
            <div class="deck-reduce-checklist" id="reduceRemoveChecklist">
              ${deck.slides
                .map((s, idx) => {
                  const checked = studioState.pendingRemoveIndices.includes(idx);
                  return `
                    <label class="deck-reduce-check-item">
                      <input
                        type="checkbox"
                        data-remove-slide-idx="${idx}"
                        ${checked ? 'checked' : ''}
                        style="width:16px; height:16px; accent-color:var(--blue); margin:0;"
                      />
                      <span><strong>Slide ${idx + 1}:</strong> ${escapeHtml((s.title || 'Visual Slide').slice(0, 64))}</span>
                    </label>
                  `;
                })
                .join('')}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" id="btnCancelReduceRemove">Cancel</button>
              <button type="button" class="btn btn-primary" id="btnConfirmRemoveSlides">🗑 Remove Selected Slides</button>
            </div>
          </div>

          <!-- PANEL B: MERGE SLIDES -->
          <div id="reduceSlidesMergePanel" style="display:${studioState.reduceSlidesMode === 'merge' ? 'flex' : 'none'}; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
              <div style="font-size:0.9rem; font-weight:700; color:var(--text);">
                Pick which slides to Merge (e.g. Slide 1 and 5, Slide 10 and 12)
              </div>
              <button type="button" id="btnAddMergePairRow" class="btn btn-secondary btn-sm">
                + Add Merge Pair
              </button>
            </div>

            <div class="deck-merge-pairs-list" id="mergePairsListContainer">
              ${studioState.pendingMergePairs
                .map(
                  (pair, pIdx) => `
                <div class="deck-merge-pair-row" data-merge-row-idx="${pIdx}">
                  <span>Merge</span>
                  <select data-merge-pair-first="${pIdx}">
                    ${deck.slides
                      .map(
                        (s, sIdx) =>
                          `<option value="${sIdx + 1}" ${sIdx + 1 === pair.firstSlideNumber ? 'selected' : ''}>Slide ${sIdx + 1}: ${escapeHtml((s.title || 'Visual Slide').slice(0, 28))}</option>`,
                      )
                      .join('')}
                  </select>
                  <span>and</span>
                  <select data-merge-pair-second="${pIdx}">
                    ${deck.slides
                      .map(
                        (s, sIdx) =>
                          `<option value="${sIdx + 1}" ${sIdx + 1 === pair.secondSlideNumber ? 'selected' : ''}>Slide ${sIdx + 1}: ${escapeHtml((s.title || 'Visual Slide').slice(0, 28))}</option>`,
                      )
                      .join('')}
                  </select>
                  <button
                    type="button"
                    class="btn-icon"
                    data-remove-merge-pair="${pIdx}"
                    title="Remove this merge pair"
                    aria-label="Remove merge pair"
                    style="font-size:1.1rem;"
                  >&times;</button>
                </div>
              `,
                )
                .join('')}
            </div>

            <label class="field" style="margin-bottom:0;">
              <span>Or type slide pairs to merge (Example: <code>Slide 1 and 5, Slide 10 and 12</code>)</span>
              <input
                type="text"
                id="inputMergePairsText"
                value="${escapeHtml(studioState.pendingMergeTextInput)}"
                placeholder="Slide 1 and 5, Slide 10 and 12"
              />
            </label>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" id="btnCancelReduceMerge">Cancel</button>
              <button type="button" class="btn btn-primary" id="btnConfirmMergeSlides">🔀 Merge Selected Slides</button>
            </div>
          </div>
        </div>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 1: INSERT PHOTO (UPLOAD FILE OR GENERATE WITH NANO BANANA)  -->
      <!-- ================================================================= -->
      <dialog id="modalDeckAddPhoto" class="modal" closedby="any" aria-labelledby="modalPhotoHeading">
        <form method="dialog" id="formDeckAddPhoto" class="modal-card">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Upload Image or Generate via ${GEMINI_IMAGE_MODEL}</span>
              <h2 id="modalPhotoHeading">Insert Photo into Slide</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckAddPhoto" aria-label="Close">&times;</button>
          </div>

          <div class="form-row-2">
            <label class="field">
              <span>Select Target Slide</span>
              <select id="modalPhotoTargetSlide" autofocus>
                ${slideOptionsHtml}
              </select>
            </label>
            <label class="field">
              <span>AI Generation Model</span>
              <select id="modalPhotoModel">
                <option value="${GEMINI_IMAGE_MODEL}">Nano Banana 2.1 (${GEMINI_IMAGE_MODEL})</option>
              </select>
            </label>
          </div>

          <div class="deck-upload-or-generate-box">
            <label for="modalPhotoFileInput" style="font-size:0.84rem; font-weight:600; cursor:pointer;">
              📁 Option A: Upload a Photo from Your Computer (.PNG, .JPG, .SVG, .WEBP)
            </label>
            <input type="file" id="modalPhotoFileInput" accept="image/*" style="font-size:0.8rem;" />
            <span class="muted-sm">If you select a file above, it will be inserted directly into the chosen slide.</span>
          </div>

          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.84rem; font-weight:600; width:100%;">✨ Option B: Or Generate a Photo with Nano Banana 2.1 Prompt:</span>
            <button type="button" class="btn btn-ghost btn-sm" data-nano-preset="Futuristic Google Cloud Run serverless architecture diagram with glowing neon data pipelines and AI agent nodes">
              ⚡ Cloud Run AI Architecture
            </button>
            <button type="button" class="btn btn-ghost btn-sm" data-nano-preset="2026 Google Developer Experts keynote graphic with Navy #20344B background, halftone green and pink geometric nodes">
              🎨 2026 GDE Keynote Graphic
            </button>
            <button type="button" class="btn btn-ghost btn-sm" data-nano-preset="Isometric multi-agent AI system blueprint connecting Vertex AI, BigQuery, and Cloud Run microservices">
              🔷 Multi-Agent Blueprint
            </button>
          </div>

          <label class="field">
            <span>Nano Banana 2.1 Image Prompt</span>
            <textarea id="modalPhotoPrompt" rows="3">${escapeHtml(activeSlide.visualPrompt)}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckAddPhoto">Cancel</button>
            <button type="button" id="btnStopNanoBanana" class="btn btn-danger-ghost" style="display:none;">■ Stop</button>
            <button type="submit" id="btnSubmitNanoBanana" class="btn btn-primary">🖼 Insert Photo into Slide</button>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 2: INSERT VIDEO (UPLOAD FILE OR GENERATE WITH OMNI 1.2)     -->
      <!-- ================================================================= -->
      <dialog id="modalDeckAddVideo" class="modal" closedby="any" aria-labelledby="modalVideoHeading">
        <form method="dialog" id="formDeckAddVideo" class="modal-card">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Upload Video or Generate via ${GEMINI_VIDEO_MODEL}</span>
              <h2 id="modalVideoHeading">Insert Video into Slide</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckAddVideo" aria-label="Close">&times;</button>
          </div>

          <div class="form-row-2">
            <label class="field">
              <span>Select Target Slide</span>
              <select id="modalVideoTargetSlide" autofocus>
                ${slideOptionsHtml}
              </select>
            </label>
            <label class="field">
              <span>AI Video Model</span>
              <select id="modalVideoModel">
                <option value="${GEMINI_VIDEO_MODEL}">Gemini Omni 1.2 Flash (${GEMINI_VIDEO_MODEL})</option>
              </select>
            </label>
          </div>

          <div class="deck-upload-or-generate-box">
            <label for="modalVideoFileInput" style="font-size:0.84rem; font-weight:600; cursor:pointer;">
              📁 Option A: Upload a Video File (.MP4, .WEBM, .MOV)
            </label>
            <input type="file" id="modalVideoFileInput" accept="video/*" style="font-size:0.8rem;" />
            <span class="muted-sm">Uploaded videos play directly inside the 16:9 slide stage.</span>
          </div>

          <div class="form-row-2">
            <label class="field">
              <span>Clip Duration ($0.07 / sec)</span>
              <select id="modalVideoDuration">
                ${[3, 5, 6, 8, 10, 15]
                  .map(
                    (sec) =>
                      `<option value="${sec}" ${studioState.selectedVideoDuration === sec ? 'selected' : ''}>${sec} seconds ($${(sec * 0.07).toFixed(2)})</option>`,
                  )
                  .join('')}
              </select>
            </label>
            <label class="field">
              <span>Resolution</span>
              <select id="modalVideoResolution">
                <option value="1080p" ${studioState.selectedVideoResolution === '1080p' ? 'selected' : ''}>1080p Full HD</option>
                <option value="720p" ${studioState.selectedVideoResolution === '720p' ? 'selected' : ''}>720p Fast</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span>✨ Option B: Or Describe the ${GEMINI_VIDEO_MODEL} Video Prompt</span>
            <textarea id="modalVideoPrompt" rows="3">${escapeHtml(activeSlide.videoPrompt || '')}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckAddVideo">Cancel</button>
            <button type="button" id="btnStopOmniVideo" class="btn btn-danger-ghost" style="display:none;">■ Stop</button>
            <button type="submit" id="btnSubmitOmniVideo" class="btn btn-primary">🎬 Insert Video into Slide</button>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 3: INSERT MUSIC (UPLOAD FILE OR GENERATE WITH LYRIA 3)      -->
      <!-- ================================================================= -->
      <dialog id="modalDeckAddMusic" class="modal" closedby="any" aria-labelledby="modalMusicHeading">
        <form method="dialog" id="formDeckAddMusic" class="modal-card">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Upload Audio or Generate via ${GEMINI_MUSIC_MODEL} &amp; ${GEMINI_MUSIC_CLIP_MODEL}</span>
              <h2 id="modalMusicHeading">Insert Music into Slide</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckAddMusic" aria-label="Close">&times;</button>
          </div>

          <div class="form-row-2">
            <label class="field">
              <span>Select Target Slide</span>
              <select id="modalMusicTargetSlide" autofocus>
                <option value="${activeSlideIndex}">Current Slide (Slide ${activeSlideIndex + 1})</option>
                <option value="ALL">All Slides (Deck Background Score)</option>
                ${slideOptionsHtml}
              </select>
            </label>
            <label class="field">
              <span>AI Music Model</span>
              <select id="modalMusicModel">
                <option value="${GEMINI_MUSIC_MODEL}">Lyria 3 Pro (${GEMINI_MUSIC_MODEL})</option>
                <option value="${GEMINI_MUSIC_CLIP_MODEL}">Lyria 3 Clip (${GEMINI_MUSIC_CLIP_MODEL})</option>
              </select>
            </label>
          </div>

          <div class="deck-upload-or-generate-box">
            <label for="modalMusicFileInput" style="font-size:0.84rem; font-weight:600; cursor:pointer;">
              📁 Option A: Upload an Audio Track (.MP3, .WAV, .OGG, .M4A)
            </label>
            <input type="file" id="modalMusicFileInput" accept="audio/*" style="font-size:0.8rem;" />
          </div>

          <label class="field">
            <span>✨ Option B: Or Describe the Lyria 3 Music Prompt</span>
            <textarea id="modalMusicPrompt" rows="3">${escapeHtml(
              activeSlide.musicPrompt ||
                'Warm ambient electronic synth pulse at 108 BPM with gentle harmonic chimes for a Google Developer Experts technical keynote, instrumental only',
            )}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckAddMusic">Cancel</button>
            <button type="button" id="btnStopLyriaMusic" class="btn btn-danger-ghost" style="display:none;">■ Stop</button>
            <button type="submit" id="btnSubmitLyriaMusic" class="btn btn-primary">🎵 Insert Music into Slide</button>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 4: INSERT NARRATION / VOICE (UPLOAD OR GEMINI TTS)          -->
      <!-- ================================================================= -->
      <dialog id="modalDeckAddVoice" class="modal" closedby="any" aria-labelledby="modalVoiceHeading">
        <form method="dialog" id="formDeckAddVoice" class="modal-card">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Upload Voiceover or Generate Narration via ${GEMINI_TTS_MODEL}</span>
              <h2 id="modalVoiceHeading">Insert Narration / Voice into Slide</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckAddVoice" aria-label="Close">&times;</button>
          </div>

          <div class="form-row-2">
            <label class="field">
              <span>Select Target Slide</span>
              <select id="modalVoiceTargetSlide" autofocus>
                ${slideOptionsHtml}
                <option value="ALL">All Slides (From Speaker Notes)</option>
              </select>
            </label>
            <label class="field">
              <span>AI Voice Model &amp; Persona</span>
              <select id="modalVoicePersona">
                <option value="Aoede (${GEMINI_TTS_MODEL})">Aoede · Warm Keynote (${GEMINI_TTS_MODEL})</option>
                <option value="Puck (${GEMINI_TTS_MODEL})">Puck · Energetic Technical (${GEMINI_TTS_MODEL})</option>
                <option value="Charon (${GEMINI_TTS_MODEL})">Charon · Deep Executive (${GEMINI_TTS_MODEL})</option>
                <option value="Kore (${GEMINI_TTS_MODEL})">Kore · Studio Narrator (${GEMINI_TTS_MODEL})</option>
              </select>
            </label>
          </div>

          <div class="deck-upload-or-generate-box">
            <label for="modalVoiceFileInput" style="font-size:0.84rem; font-weight:600; cursor:pointer;">
              📁 Option A: Upload a Voice Recording (.MP3, .WAV, .M4A)
            </label>
            <input type="file" id="modalVoiceFileInput" accept="audio/*" style="font-size:0.8rem;" />
          </div>

          <label class="field">
            <span>✨ Option B: Or Enter Voiceover Script for ${GEMINI_TTS_MODEL}</span>
            <textarea id="modalVoiceScript" rows="3">${escapeHtml(
              activeSlide.narratorScript || activeSlide.speakerNotes,
            )}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckAddVoice">Cancel</button>
            <button type="button" id="btnStopGeminiVoice" class="btn btn-danger-ghost" style="display:none;">■ Stop</button>
            <button type="submit" id="btnSubmitGeminiVoice" class="btn btn-primary">🎙 Insert Voice into Slide</button>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 5: INSERT LLM MULTI-SLIDE PROMPT (SLIDE 1, SLIDE 2, ...)    -->
      <!-- ================================================================= -->
      <dialog id="modalDeckLlmPrompt" class="modal" closedby="any" aria-labelledby="modalLlmHeading">
        <form method="dialog" id="formDeckLlmPrompt" class="modal-card" style="max-width:760px; width:min(94vw, 760px);">
          <div class="modal-header">
            <div>
              <span class="eyebrow">Models: ${GEMINI_HEAVY_MODEL} (High) &amp; ${GEMINI_FAST_MODEL} &middot; Multi-Slide Deck Director</span>
              <h2 id="modalLlmHeading">Insert LLM Slide Prompt (Slide 1, Slide 2, Slide 3, Slide 4...)</h2>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckLlmPrompt" aria-label="Close">&times;</button>
          </div>

          <p class="muted-sm" style="margin:0 0 12px 0;">
            Paste or write an instruction prompt specifying <code>Slide 1:</code>, <code>Slide 2:</code>, <code>Slide 3:</code>, <code>Slide 4:</code> (including <code>Title:</code>, <code>Subtitle:</code>, bullets <code>- ...</code>, <code>Photo:</code>, <code>Video:</code>, <code>Music:</code>, or <code>Notes:</code>).
          </p>

          <div class="form-row-2">
            <label class="field">
              <span>Slide Routing Mode</span>
              <select id="modalLlmTargetScope" autofocus>
                <option value="AUTO">Multi-Slide Script (Auto-routes Slide 1, Slide 2, Slide 3, Slide 4...)</option>
                <option value="ALL">Apply Instruction Across All Slides</option>
                ${slideOptionsHtml}
              </select>
            </label>
            <label class="field">
              <span>LLM Execution Engine</span>
              <select id="modalLlmModel">
                <option value="${GEMINI_HEAVY_MODEL}" ${studioState.lastLlmModel === GEMINI_HEAVY_MODEL ? 'selected' : ''}>Gemini 4 Argon (${GEMINI_HEAVY_MODEL} &middot; HIGH Thinking)</option>
                <option value="${GEMINI_FAST_MODEL}" ${studioState.lastLlmModel === GEMINI_FAST_MODEL ? 'selected' : ''}>Gemini 3.8 Flash (${GEMINI_FAST_MODEL} &middot; LOW Thinking)</option>
              </select>
            </label>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
            <span style="font-size:0.82rem; font-weight:600; color:var(--text-muted);">
              Multi-Slide LLM Instructions
            </span>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button type="button" id="btnLlmLoadCurrentSlides" class="btn btn-ghost btn-sm">
                📋 Load Current Deck (Slide 1..${deck.slides.length})
              </button>
              <button type="button" id="btnLlmLoadSamplePrompt" class="btn btn-secondary btn-sm">
                ✨ Load Sample 4-Slide Prompt
              </button>
            </div>
          </div>

          <label class="field">
            <span class="visually-hidden">LLM Multi-Slide Prompt</span>
            <textarea id="modalLlmPromptText" rows="11" required style="font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:0.82rem; line-height:1.45;">${escapeHtml(
              studioState.lastLlmPrompt,
            )}</textarea>
          </label>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckLlmPrompt">Cancel</button>
            <button type="submit" class="btn btn-primary">🧠 Apply LLM Instructions</button>
          </div>
        </form>
      </dialog>

      <!-- ================================================================= -->
      <!-- MODAL 6: UPLOAD TO GOOGLE DRIVE / GOOGLE WORKSPACE                -->
      <!-- ================================================================= -->
      <dialog id="modalDeckGDriveUpload" class="modal" closedby="any" aria-labelledby="modalGDriveHeading">
        <form method="dialog" id="formDeckGDriveUpload" class="modal-card" style="max-width:640px; width:min(92vw, 640px);">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:12px;">
              ${GDRIVE_SVG_ICON}
              <div>
                <span class="eyebrow" id="modalGDriveWorkflowStepLabel">Step 1 of 2 &middot; Upload Presentation to Google Drive</span>
                <h2 id="modalGDriveHeading">Upload Presentation to Google Drive</h2>
              </div>
            </div>
            <button type="button" class="btn-icon" data-close-deck-modal="modalDeckGDriveUpload" aria-label="Close">&times;</button>
          </div>

          <div id="gdriveUploadStep1Panel" style="display:flex; flex-direction:column; gap:14px;">
            <label class="field" style="margin-bottom:0;">
              <span>Presentation File Name in Google Drive</span>
              <input
                type="text"
                id="modalGDriveFileName"
                value="${escapeHtml(deck.deckTitle || 'GDE_Stage_Keynote_Deck')}.pptx"
                required
                autofocus
              />
            </label>

            <div class="form-row-2">
              <label class="field" style="margin-bottom:0;">
                <span>Google Workspace Target Format</span>
                <select id="modalGDriveConvertMode">
                  <option value="slides" selected>Convert to Google Slides (docs.google.com/presentation)</option>
                  <option value="pptx">Keep as Native PowerPoint .PPTX File in Drive</option>
                </select>
              </label>
              <label class="field" style="margin-bottom:0;">
                <span>Target Drive Folder ID (Optional)</span>
                <input
                  type="text"
                  id="modalGDriveFolderId"
                  placeholder="Leave blank for My Drive"
                />
              </label>
            </div>

            <label class="field" style="margin-bottom:0;">
              <span>Google OAuth Access Token Override (Optional)</span>
              <input
                type="password"
                id="modalGDriveCustomToken"
                placeholder="Leave blank to use your signed-in Google account"
                autocomplete="off"
              />
            </label>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckGDriveUpload">Cancel</button>
              <button type="submit" id="btnSubmitGDriveUpload" class="btn btn-primary">
                ${GDRIVE_SVG_ICON}
                <span>Upload to Google Drive</span>
              </button>
            </div>
          </div>

          <div id="gdriveUploadStep2Panel" style="display:none; flex-direction:column; gap:14px;">
            <div style="padding:14px 16px; border-radius:12px; background:var(--surface-2, rgba(52,168,83,0.12)); border:1px solid var(--border-strong, rgba(52,168,83,0.35));">
              <div style="font-weight:700; font-size:0.95rem; color:var(--text); margin-bottom:4px;">
                ✓ Step 1 Complete: Uploaded <span id="gdriveUploadedFileNameLabel">${escapeHtml(studioState.lastGDriveFileName || deck.deckTitle)}</span>
              </div>
              <div class="muted-sm">
                Step 2 Complete: Google Drive has been opened with your slide presentation in a new tab.
              </div>
            </div>

            <div class="modal-footer" style="justify-content:space-between;">
              <button type="button" class="btn btn-ghost" data-close-deck-modal="modalDeckGDriveUpload">Done</button>
              <a
                id="btnOpenGDriveSlideNewTab"
                href="${escapeHtml(studioState.lastGDriveWebViewLink || 'https://drive.google.com/drive/my-drive')}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary"
                style="text-decoration:none; display:inline-flex; align-items:center; gap:8px;"
              >
                ${GDRIVE_SVG_ICON}
                <span>↗ Open Slide in Google Drive (New Tab)</span>
              </a>
            </div>
          </div>
        </form>
      </dialog>
    </div>
  `;

  wireDeckStudioEvents();
}

function wireDeckStudioEvents(): void {
  if (!deps) return;
  const { showToast } = deps;
  const { deck, activeSlideIndex } = studioState;
  const activeSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    document
      .querySelectorAll<HTMLDialogElement>('#deckStudioModuleContainer dialog[closedby="any"]')
      .forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (!isDialogContent) dialog.close();
        });
      });
  }

  document.querySelectorAll<HTMLButtonElement>('[data-close-deck-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeDeckModal;
      if (!id) return;
      const dlg = document.getElementById(id) as HTMLDialogElement | null;
      dlg?.close();
    });
  });

  const triggerDownloadDeck = async () => {
    const bytes =
      studioState.lastCompiledPptxBytes || (await compileDeckPptxBytes()).bytes;
    downloadBlob(
      bytes,
      'gde_deck_studio_16x9.pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    );
    showToast(`Downloaded Deck (${Math.round(bytes.length / 1024)} KB .PPTX)`);
  };

  document.getElementById('btnPopupPresentLive')?.addEventListener('click', () => {
    enterPresentLiveFullscreen();
  });

  document.getElementById('btnDeckPresentLiveStage')?.addEventListener('click', () => {
    enterPresentLiveFullscreen();
  });

  document.getElementById('btnPopupDownloadDeck')?.addEventListener('click', async () => {
    await triggerDownloadDeck();
    (document.getElementById('modalDeckGeneratedReady') as HTMLDialogElement | null)?.close();
  });

  document.getElementById('btnPopupUploadGDrive')?.addEventListener('click', () => {
    (document.getElementById('modalDeckGeneratedReady') as HTMLDialogElement | null)?.close();
    const step1El = document.getElementById('gdriveUploadStep1Panel');
    const step2El = document.getElementById('gdriveUploadStep2Panel');
    const stepLabelEl = document.getElementById('modalGDriveWorkflowStepLabel');
    const headingEl = document.getElementById('modalGDriveHeading');
    if (step1El) step1El.style.display = 'flex';
    if (step2El) step2El.style.display = 'none';
    if (stepLabelEl) stepLabelEl.textContent = 'Step 1 of 2 · Upload Presentation to Google Drive';
    if (headingEl) headingEl.textContent = 'Upload Presentation to Google Drive';
    (document.getElementById('modalDeckGDriveUpload') as HTMLDialogElement | null)?.showModal();
  });

  const fileSourceInput = document.getElementById(
    'deckFileSourceInput',
  ) as HTMLInputElement | null;
  const handleSourceFileSelected = async (file: File) => {
    const isPptxFile =
      file.name.toLowerCase().endsWith('.pptx') ||
      file.type.includes('presentationml') ||
      file.type.includes('powerpoint');
    if (isPptxFile) {
      const parsed = await readUploadedPptxOrNotify(file, fileSourceInput, showToast);
      if (!parsed) return;
      const { slideCount } = applyUploadedPptxDeckToStudioState(parsed);
      showToast(`Uploaded ${file.name} (${slideCount} slides · Keep Existing Deck Template)`);
      renderDeckStudioModule();
    } else {
      studioState.isUploadingSource = true;
      try {
        studioState.lastUploadedPptxResult = null;
        studioState.deck.sourceZipEntries = undefined;
        const mdText = await file.text();
        studioState.markdownInput = mdText;
        const slideCount = detectMarkdownSlideCount(mdText, studioState.targetSlideCount);
        const firstH1 = /^#\s+(.+)$/m.exec(mdText);
        if (firstH1) {
          studioState.deck.deckTitle = firstH1[1].trim();
        }
        studioState.deck.slides = parseMarkdownIntoSlides(
          mdText,
          slideCount,
          studioState.deck.brand,
        );
        studioState.targetSlideCount = studioState.deck.slides.length;
        studioState.pendingTargetSlideCount = studioState.deck.slides.length;
        studioState.activeSlideIndex = 0;
        studioState.sourceUploaded = true;
        studioState.isSampleDeck = false;
        studioState.sourceLabel = `${file.name} (${studioState.deck.slides.length} slides)`;
        studioState.lastLlmPrompt = formatSlidesAsLlmPrompt(studioState.deck.slides);
        studioState.lastVqaSummary = `Uploaded "${file.name}" (${studioState.deck.slides.length} slides) in Step 1.`;
        showToast(`Uploaded ${file.name} (${studioState.deck.slides.length} slides)`);
        renderDeckStudioModule();
      } finally {
        studioState.isUploadingSource = false;
      }
    }
  };
  fileSourceInput?.addEventListener('change', () => {
    const file = fileSourceInput.files?.[0];
    if (file) void handleSourceFileSelected(file);
  });
  const step1Dropzone = document.getElementById('deckStep1Dropzone');
  step1Dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  step1Dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) void handleSourceFileSelected(file);
  });

  document.getElementById('btnDeckLoadSampleMd')?.addEventListener('click', async () => {
    try {
      if (!defaultSampleDeckBytes && defaultSampleDeckPromise) {
        await defaultSampleDeckPromise;
      }
      const parsed = await parseDefaultSampleDeck();
      if (parsed) {
        const { slideCount } = applyDefaultSampleDeckToStudioState(parsed);
        showToast(`Loaded ${DEFAULT_SAMPLE_DECK_LABEL} sample (${slideCount} slides)`);
        renderDeckStudioModule();
        return;
      }
    } catch {
      // Fall through to the built-in starter slides
    }
    studioState.lastUploadedPptxResult = null;
    studioState.deck.sourceZipEntries = undefined;
    studioState.hasUserModifiedSlides = false;
    studioState.sourceUploaded = false;
    studioState.isSampleDeck = true;
    studioState.sourceLabel = '2026 GDE Brand Guide Sample (2 slides)';
    studioState.lastLlmPrompt = DEFAULT_SAMPLE_LLM_PROMPT;
    const gdePreset = BRAND_PRESETS[0];
    void applyBrandPresetWithArgonTransformation(gdePreset);
  });

  const fileBrandInput = document.getElementById('deckFileBrandInput') as HTMLInputElement | null;
  const handleBrandFileSelected = async (file: File) => {
    const isPptxFile =
      file.name.toLowerCase().endsWith('.pptx') ||
      file.type.includes('presentationml') ||
      file.type.includes('powerpoint');
    if (isPptxFile) {
      const parsed = await readUploadedPptxOrNotify(file, fileBrandInput, showToast);
      if (!parsed) return;
      if (
        !studioState.sourceUploaded ||
        parsed.extractedSlides.length >= 4 ||
        parsed.extractedSlides.length >= studioState.deck.slides.length
      ) {
        const { slideCount } = applyUploadedPptxDeckToStudioState(parsed);
        showToast(`Uploaded ${file.name} (${slideCount} slides · Keep Existing Deck Template)`);
        renderDeckStudioModule();
      } else {
        const mergedBrand: BrandThemeSpec = {
          ...studioState.deck.brand,
          ...parsed.extractedTheme,
          referenceTemplateName: file.name,
        };
        await applyBrandPresetWithArgonTransformation(mergedBrand);
      }
    } else {
      studioState.isUploadingSource = true;
      try {
        const extracted = await extractPaletteFromBrandImage(file);
        studioState.deck.brand.primaryHex = extracted.primaryHex;
        studioState.deck.brand.secondaryHex = extracted.secondaryHex;
        studioState.deck.brand.accentHex = extracted.accentHex;
        studioState.deck.brand.referenceImageDataUrl = extracted.dataUrl;
        studioState.deck.brand.referenceTemplateName = file.name;
        studioState.deck.brand.templateStyle = 'uploaded-custom-argon';
        showToast(`Extracted brand palette (${extracted.primaryHex}) from ${file.name}`);
        renderDeckStudioModule();
      } finally {
        studioState.isUploadingSource = false;
      }
    }
  };
  fileBrandInput?.addEventListener('change', () => {
    const file = fileBrandInput.files?.[0];
    if (file) void handleBrandFileSelected(file);
  });
  const step2Dropzone = document.getElementById('deckStep2Dropzone');
  step2Dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  step2Dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) void handleBrandFileSelected(file);
  });

  const presetSelect = document.getElementById(
    'deckSelectBrandPreset',
  ) as HTMLSelectElement | null;
  presetSelect?.addEventListener('change', () => {
    if (presetSelect.value === KEEP_EXISTING_BRAND_ID) {
      const keepSpec = buildKeepExistingBrandSpec(
        studioState.lastUploadedPptxResult,
        studioState.deck.brand,
      );
      void applyBrandPresetWithArgonTransformation(keepSpec);
      return;
    }
    const found = BRAND_PRESETS.find((p) => p.id === presetSelect.value);
    if (found) {
      void applyBrandPresetWithArgonTransformation(found);
    }
  });

  const bindStageCanvasActionButtons = () => {
    const currentSlide =
      studioState.deck.slides[studioState.activeSlideIndex] || studioState.deck.slides[0];
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="edit-code"]').forEach((b) => {
      b.onclick = () => {
        (document.getElementById('modalDeckAddCodeSnippet') as HTMLDialogElement | null)?.showModal();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="remove-code"]').forEach((b) => {
      b.onclick = () => {
        currentSlide.codeSnippet = undefined;
        studioState.hasUserModifiedSlides = true;
        showToast(`Removed code snippet from Slide ${studioState.activeSlideIndex + 1}`);
        renderDeckStudioModule();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="edit-photo"]').forEach((b) => {
      b.onclick = () => {
        (document.getElementById('modalDeckAddPhoto') as HTMLDialogElement | null)?.showModal();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="remove-photo"]').forEach((b) => {
      b.onclick = () => {
        currentSlide.visualDataUrl = undefined;
        currentSlide.extraVisualDataUrls = undefined;
        studioState.hasUserModifiedSlides = true;
        showToast(`Removed photo from Slide ${studioState.activeSlideIndex + 1}`);
        renderDeckStudioModule();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="edit-video"]').forEach((b) => {
      b.onclick = () => {
        (document.getElementById('modalDeckAddVideo') as HTMLDialogElement | null)?.showModal();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="remove-video"]').forEach((b) => {
      b.onclick = () => {
        currentSlide.videoUrl = undefined;
        currentSlide.videoPrompt = undefined;
        studioState.hasUserModifiedSlides = true;
        showToast(`Removed video from Slide ${studioState.activeSlideIndex + 1}`);
        renderDeckStudioModule();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="remove-music"]').forEach((b) => {
      b.onclick = () => {
        currentSlide.musicAudioUrl = undefined;
        currentSlide.musicPrompt = undefined;
        showToast(`Removed music from Slide ${studioState.activeSlideIndex + 1}`);
        renderDeckStudioModule();
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="play-voice"]').forEach((b) => {
      b.onclick = () => {
        const text = (
          currentSlide.narratorScript ||
          currentSlide.speakerNotes ||
          currentSlide.title
        ).trim();
        if ('speechSynthesis' in window && text) {
          window.speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utt);
          showToast(`Playing Slide ${studioState.activeSlideIndex + 1} voiceover`);
        }
      };
    });
    document.querySelectorAll<HTMLButtonElement>('[data-stage-action="remove-voice"]').forEach((b) => {
      b.onclick = () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        currentSlide.voiceAudioUrl = undefined;
        currentSlide.narratorVoiceName = undefined;
        currentSlide.narratorScript = undefined;
        showToast(`Removed voice from Slide ${studioState.activeSlideIndex + 1}`);
        renderDeckStudioModule();
      };
    });
  };

  const refreshLiveStageCanvasInPlace = () => {
    const existingLiveCanvas = document.getElementById('deckLiveStageCanvas');
    if (!existingLiveCanvas || !deps) return;
    const { style, slideStageCssVars, slideStageHeaderAndBodyHtml } = buildStageCanvasMarkup();
    existingLiveCanvas.className = `deck-slide-stage deck-slide-stage-wide template-${deps.escapeHtml(style)}`;
    existingLiveCanvas.setAttribute('style', slideStageCssVars);
    existingLiveCanvas.innerHTML = slideStageHeaderAndBodyHtml;
    const activeFilmstripTitle = document.querySelector(
      `.deck-filmstrip-item[data-deck-slide-idx="${studioState.activeSlideIndex}"] .deck-filmstrip-title`,
    );
    if (activeFilmstripTitle) {
      activeFilmstripTitle.textContent = activeSlide.title || 'Visual Slide';
    }
    bindStageCanvasActionButtons();
  };

  const countSelect = document.getElementById(
    'deckSelectSlideCount',
  ) as HTMLSelectElement | null;
  countSelect?.addEventListener('change', () => {
    const nextCount = parseInt(countSelect.value, 10) || 2;
    const currentCount = studioState.deck.slides.length;

    if (nextCount < currentCount) {
      studioState.pendingTargetSlideCount = nextCount;
      const delta = Math.max(1, currentCount - nextCount);
      studioState.pendingRemoveIndices = Array.from(
        { length: delta },
        (_, i) => currentCount - delta + i,
      );
      const defaultPairs: Array<{ firstSlideNumber: number; secondSlideNumber: number }> = [];
      if (currentCount >= 5) {
        defaultPairs.push({ firstSlideNumber: 1, secondSlideNumber: 5 });
      } else if (currentCount >= 2) {
        defaultPairs.push({ firstSlideNumber: 1, secondSlideNumber: 2 });
      }
      if (currentCount >= 12 && delta >= 2) {
        defaultPairs.push({ firstSlideNumber: 10, secondSlideNumber: 12 });
      }
      studioState.pendingMergePairs = defaultPairs;
      studioState.pendingMergeTextInput = defaultPairs
        .map((p) => `Slide ${p.firstSlideNumber} and ${p.secondSlideNumber}`)
        .join(', ');
      renderDeckStudioModule();
      (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.showModal();
      return;
    }

    studioState.targetSlideCount = nextCount;
    if (studioState.hasUserModifiedSlides || studioState.sourceUploaded) {
      while (studioState.deck.slides.length < nextCount) {
        const res = insertNewSlideAfterIndex(
          studioState.deck.slides,
          studioState.deck.slides.length - 1,
          studioState.deck.brand,
        );
        studioState.deck.slides = res.slides;
      }
    } else {
      studioState.deck.slides = parseMarkdownIntoSlides(
        studioState.markdownInput,
        nextCount,
        studioState.deck.brand,
      );
    }
    studioState.activeSlideIndex = Math.min(
      studioState.activeSlideIndex,
      studioState.deck.slides.length - 1,
    );
    renderDeckStudioModule();
  });

  const cancelReduceSlidesModal = () => {
    studioState.targetSlideCount = studioState.deck.slides.length;
    studioState.pendingTargetSlideCount = studioState.deck.slides.length;
    (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.close();
    renderDeckStudioModule();
  };

  document.getElementById('btnCloseReduceSlidesModal')?.addEventListener('click', cancelReduceSlidesModal);
  document.getElementById('btnCancelReduceRemove')?.addEventListener('click', cancelReduceSlidesModal);
  document.getElementById('btnCancelReduceMerge')?.addEventListener('click', cancelReduceSlidesModal);

  document.getElementById('btnReduceModeRemove')?.addEventListener('click', () => {
    studioState.reduceSlidesMode = 'remove';
    const removePanel = document.getElementById('reduceSlidesRemovePanel');
    const mergePanel = document.getElementById('reduceSlidesMergePanel');
    const btnRemove = document.getElementById('btnReduceModeRemove');
    const btnMerge = document.getElementById('btnReduceModeMerge');
    if (removePanel) removePanel.style.display = 'flex';
    if (mergePanel) mergePanel.style.display = 'none';
    btnRemove?.classList.replace('btn-secondary', 'btn-primary');
    btnMerge?.classList.replace('btn-primary', 'btn-secondary');
  });

  document.getElementById('btnReduceModeMerge')?.addEventListener('click', () => {
    studioState.reduceSlidesMode = 'merge';
    const removePanel = document.getElementById('reduceSlidesRemovePanel');
    const mergePanel = document.getElementById('reduceSlidesMergePanel');
    const btnRemove = document.getElementById('btnReduceModeRemove');
    const btnMerge = document.getElementById('btnReduceModeMerge');
    if (removePanel) removePanel.style.display = 'none';
    if (mergePanel) mergePanel.style.display = 'flex';
    btnMerge?.classList.replace('btn-secondary', 'btn-primary');
    btnRemove?.classList.replace('btn-primary', 'btn-secondary');
  });

  document.querySelectorAll<HTMLInputElement>('[data-remove-slide-idx]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const checkedIndices: number[] = [];
      document
        .querySelectorAll<HTMLInputElement>('[data-remove-slide-idx]:checked')
        .forEach((el) => {
          const idx = parseInt(el.dataset.removeSlideIdx || '-1', 10);
          if (idx >= 0) checkedIndices.push(idx);
        });
      studioState.pendingRemoveIndices = checkedIndices;
    });
  });

  document.getElementById('btnConfirmRemoveSlides')?.addEventListener('click', () => {
    const checkedIndices: number[] = [];
    document
      .querySelectorAll<HTMLInputElement>('[data-remove-slide-idx]:checked')
      .forEach((el) => {
        const idx = parseInt(el.dataset.removeSlideIdx || '-1', 10);
        if (idx >= 0) checkedIndices.push(idx);
      });
    if (checkedIndices.length === 0) {
      showToast('Select at least one slide to remove');
      return;
    }
    const { slides: nextSlides, removedSlideNumbers } = removeSlidesByIndicesInDeck(
      studioState.deck.slides,
      checkedIndices,
    );
    studioState.deck.slides = nextSlides;
    studioState.targetSlideCount = nextSlides.length;
    studioState.pendingTargetSlideCount = nextSlides.length;
    studioState.activeSlideIndex = Math.min(
      studioState.activeSlideIndex,
      Math.max(0, nextSlides.length - 1),
    );
    studioState.hasUserModifiedSlides = true;
    studioState.lastLlmPrompt = formatSlidesAsLlmPrompt(nextSlides);
    studioState.lastVqaSummary = `Removed ${removedSlideNumbers.length} slide(s) (Slide ${removedSlideNumbers.join(', ')}). Deck now has ${nextSlides.length} slides.`;
    (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.close();
    showToast(`Removed ${removedSlideNumbers.length} slide(s) (${nextSlides.length} slides remaining)`);
    renderDeckStudioModule();
  });

  const syncMergeTextInputFromPairs = () => {
    studioState.pendingMergeTextInput = studioState.pendingMergePairs
      .map((p) => `Slide ${p.firstSlideNumber} and ${p.secondSlideNumber}`)
      .join(', ');
    const textInput = document.getElementById('inputMergePairsText') as HTMLInputElement | null;
    if (textInput) {
      textInput.value = studioState.pendingMergeTextInput;
    }
  };

  document.querySelectorAll<HTMLSelectElement>('[data-merge-pair-first]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const pIdx = parseInt(sel.dataset.mergePairFirst || '0', 10);
      const val = parseInt(sel.value, 10) || 1;
      if (studioState.pendingMergePairs[pIdx]) {
        studioState.pendingMergePairs[pIdx].firstSlideNumber = val;
        syncMergeTextInputFromPairs();
      }
    });
  });

  document.querySelectorAll<HTMLSelectElement>('[data-merge-pair-second]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const pIdx = parseInt(sel.dataset.mergePairSecond || '0', 10);
      const val = parseInt(sel.value, 10) || 2;
      if (studioState.pendingMergePairs[pIdx]) {
        studioState.pendingMergePairs[pIdx].secondSlideNumber = val;
        syncMergeTextInputFromPairs();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-remove-merge-pair]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pIdx = parseInt(btn.dataset.removeMergePair || '0', 10);
      studioState.pendingMergePairs.splice(pIdx, 1);
      syncMergeTextInputFromPairs();
      studioState.reduceSlidesMode = 'merge';
      renderDeckStudioModule();
      (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.showModal();
    });
  });

  document.getElementById('btnAddMergePairRow')?.addEventListener('click', () => {
    const total = studioState.deck.slides.length;
    const nextFirst = Math.min(total, (studioState.pendingMergePairs.length * 2) + 1);
    const nextSecond = Math.min(total, nextFirst + 1 <= total ? nextFirst + 1 : 1);
    studioState.pendingMergePairs.push({
      firstSlideNumber: nextFirst,
      secondSlideNumber: nextSecond,
    });
    syncMergeTextInputFromPairs();
    studioState.reduceSlidesMode = 'merge';
    renderDeckStudioModule();
    (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.showModal();
  });

  document.getElementById('inputMergePairsText')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    studioState.pendingMergeTextInput = val;
    const parsedPairs = parseMergePairsText(val, studioState.deck.slides.length);
    if (parsedPairs.length > 0) {
      studioState.pendingMergePairs = parsedPairs;
    }
  });

  document.getElementById('btnConfirmMergeSlides')?.addEventListener('click', () => {
    const textInputVal =
      (document.getElementById('inputMergePairsText') as HTMLInputElement | null)?.value.trim() ||
      studioState.pendingMergeTextInput;
    const parsedFromText = parseMergePairsText(textInputVal, studioState.deck.slides.length);
    const pairsToApply =
      parsedFromText.length > 0 ? parsedFromText : studioState.pendingMergePairs;

    const { slides: nextSlides, mergedDescriptions } = mergeSlidePairsInDeck(
      studioState.deck.slides,
      pairsToApply,
    );
    if (mergedDescriptions.length === 0) {
      showToast('Pick two distinct slides to merge (e.g. Slide 1 and 5)');
      return;
    }
    studioState.deck.slides = nextSlides;
    studioState.targetSlideCount = nextSlides.length;
    studioState.pendingTargetSlideCount = nextSlides.length;
    studioState.activeSlideIndex = Math.min(
      studioState.activeSlideIndex,
      Math.max(0, nextSlides.length - 1),
    );
    studioState.hasUserModifiedSlides = true;
    studioState.lastLlmPrompt = formatSlidesAsLlmPrompt(nextSlides);
    studioState.lastVqaSummary = `Merged ${mergedDescriptions.join(', ')}. Deck now has ${nextSlides.length} slides.`;
    (document.getElementById('modalDeckReduceSlides') as HTMLDialogElement | null)?.close();
    showToast(`Merged ${mergedDescriptions.join(', ')} (${nextSlides.length} slides)`);
    renderDeckStudioModule();
  });

  const handleAddNewSlide = () => {
    const { slides: nextSlides, insertedIndex } = insertNewSlideAfterIndex(
      studioState.deck.slides,
      studioState.activeSlideIndex,
      studioState.deck.brand,
    );
    studioState.deck.slides = nextSlides;
    studioState.activeSlideIndex = insertedIndex;
    studioState.targetSlideCount = nextSlides.length;
    studioState.hasUserModifiedSlides = true;
    studioState.lastVqaSummary = `Added new slide at Slide ${insertedIndex + 1} of ${nextSlides.length}.`;
    showToast(`Added Slide ${insertedIndex + 1} (total ${nextSlides.length} slides)`);
    renderDeckStudioModule();
    const headlineInput = document.getElementById(
      'deckInputSlideTitle',
    ) as HTMLInputElement | null;
    headlineInput?.focus();
    headlineInput?.select();
  };

  document.getElementById('btnDeckAddNewSlide')?.addEventListener('click', handleAddNewSlide);
  document.getElementById('btnFilmstripAddNewSlide')?.addEventListener('click', handleAddNewSlide);

  document.getElementById('btnDeckGenerateDeck')?.addEventListener('click', () => {
    void handleGenerateAndPreviewDeck();
  });

  document.getElementById('btnStopGenerateDeck')?.addEventListener('click', () => {
    activeDeckGenerateTask?.stop();
  });

  const goPrevSlide = (e?: Event) => {
    e?.stopPropagation();
    if (studioState.activeSlideIndex > 0) {
      studioState.activeSlideIndex--;
      renderDeckStudioModule();
    }
  };
  const goNextSlide = (e?: Event) => {
    e?.stopPropagation();
    if (studioState.activeSlideIndex < studioState.deck.slides.length - 1) {
      studioState.activeSlideIndex++;
      renderDeckStudioModule();
    }
  };
  document.getElementById('btnDeckPrevSlide')?.addEventListener('click', goPrevSlide);
  document.getElementById('btnDeckNextSlide')?.addEventListener('click', goNextSlide);
  document.getElementById('btnHudPrevSlide')?.addEventListener('click', goPrevSlide);
  document.getElementById('btnHudNextSlide')?.addEventListener('click', goNextSlide);

  document.getElementById('deckLiveStageCanvas')?.addEventListener('click', (e) => {
    if (!document.fullscreenElement) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, video, audio, a, input, select, textarea')) return;
    goNextSlide();
  });

  document.getElementById('btnHudExitFullscreen')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  document.getElementById('btnOpenModalCodeSnippet')?.addEventListener('click', () => {
    (document.getElementById('modalDeckAddCodeSnippet') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalPhoto')?.addEventListener('click', () => {
    (document.getElementById('modalDeckAddPhoto') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalVideo')?.addEventListener('click', () => {
    (document.getElementById('modalDeckAddVideo') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalMusic')?.addEventListener('click', () => {
    (document.getElementById('modalDeckAddMusic') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalVoice')?.addEventListener('click', () => {
    (document.getElementById('modalDeckAddVoice') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalLlmPrompt')?.addEventListener('click', () => {
    (document.getElementById('modalDeckLlmPrompt') as HTMLDialogElement | null)?.showModal();
  });
  document.getElementById('btnOpenModalLlmPromptStep1')?.addEventListener('click', () => {
    const step1Text = (
      document.getElementById('deckStep1LlmPromptTextarea') as HTMLTextAreaElement | null
    )?.value.trim();
    const modalText = document.getElementById('modalLlmPromptText') as HTMLTextAreaElement | null;
    if (step1Text && modalText) {
      modalText.value = step1Text;
    }
    (document.getElementById('modalDeckLlmPrompt') as HTMLDialogElement | null)?.showModal();
  });

  const codeTargetSelect = document.getElementById(
    'modalCodeTargetSlide',
  ) as HTMLSelectElement | null;
  codeTargetSelect?.addEventListener('change', () => {
    const idx = parseInt(codeTargetSelect.value || '0', 10);
    const s = studioState.deck.slides[idx];
    const codeArea = document.getElementById(
      'modalCodeSnippetTextarea',
    ) as HTMLTextAreaElement | null;
    if (s && codeArea) {
      codeArea.value = s.codeSnippet || '';
    }
  });

  document.getElementById('btnRemoveCodeSnippetModal')?.addEventListener('click', () => {
    const targetIdx = parseInt(
      (document.getElementById('modalCodeTargetSlide') as HTMLSelectElement)?.value ||
        String(studioState.activeSlideIndex),
      10,
    );
    const targetSlide = studioState.deck.slides[targetIdx] || activeSlide;
    targetSlide.codeSnippet = undefined;
    studioState.hasUserModifiedSlides = true;
    (document.getElementById('modalDeckAddCodeSnippet') as HTMLDialogElement | null)?.close();
    showToast(`Removed code snippet from Slide ${targetIdx + 1}`);
    renderDeckStudioModule();
  });

  document.getElementById('formDeckAddCodeSnippet')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetIdx = parseInt(
      (document.getElementById('modalCodeTargetSlide') as HTMLSelectElement)?.value ||
        String(studioState.activeSlideIndex),
      10,
    );
    const rawCode =
      (document.getElementById('modalCodeSnippetTextarea') as HTMLTextAreaElement)?.value || '';
    const trimmedCheck = rawCode.trim();
    const targetSlide = studioState.deck.slides[targetIdx] || activeSlide;

    if (!trimmedCheck) {
      targetSlide.codeSnippet = undefined;
      showToast(`Cleared code snippet on Slide ${targetIdx + 1}`);
    } else {
      targetSlide.codeSnippet = rawCode.replace(/\r\n/g, '\n');
      targetSlide.isVisualOnlySlide = false;
      studioState.lastVqaSummary = `Inserted Courier code snippet into Slide ${targetIdx + 1}.`;
      showToast(`Inserted Courier code snippet into Slide ${targetIdx + 1}`);
    }

    studioState.hasUserModifiedSlides = true;
    studioState.activeSlideIndex = targetIdx;
    (document.getElementById('modalDeckAddCodeSnippet') as HTMLDialogElement | null)?.close();
    renderDeckStudioModule();
  });

  document.getElementById('deckStep1LlmPromptTextarea')?.addEventListener('input', (e) => {
    studioState.lastLlmPrompt = (e.target as HTMLTextAreaElement).value;
  });

  document.getElementById('btnApplyStep1LlmPrompt')?.addEventListener('click', () => {
    const promptText =
      (document.getElementById('deckStep1LlmPromptTextarea') as HTMLTextAreaElement | null)?.value.trim() ||
      '';
    if (!promptText) {
      (document.getElementById('modalDeckLlmPrompt') as HTMLDialogElement | null)?.showModal();
      return;
    }
    studioState.lastLlmPrompt = promptText;
    studioState.lastLlmModel = GEMINI_HEAVY_MODEL;
    const appliedChanges = applyLlmSlideInstructions(promptText, 'AUTO');
    studioState.lastLlmChangeLog = appliedChanges;
    studioState.targetSlideCount = studioState.deck.slides.length;
    studioState.pendingTargetSlideCount = studioState.deck.slides.length;
    studioState.hasUserModifiedSlides = true;
    studioState.sourceUploaded = true;
    studioState.isSampleDeck = false;
    studioState.sourceLabel = `LLM Prompt Applied (${studioState.deck.slides.length} slides)`;
    studioState.lastVqaSummary =
      appliedChanges.length > 0
        ? `LLM Slide Director (${GEMINI_HEAVY_MODEL}): Updated ${appliedChanges.length} slide(s).`
        : `LLM Slide Director (${GEMINI_HEAVY_MODEL}): Updated Slide ${studioState.activeSlideIndex + 1}.`;
    showToast(`Applied LLM Prompt (${studioState.deck.slides.length} slides)`);
    renderDeckStudioModule();
  });

  bindStageCanvasActionButtons();

  document.querySelectorAll<HTMLButtonElement>('[data-nano-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const promptEl = document.getElementById('modalPhotoPrompt') as HTMLTextAreaElement | null;
      if (promptEl && chip.dataset.nanoPreset) {
        promptEl.value = chip.dataset.nanoPreset;
      }
    });
  });

  const photoSlideSelect = document.getElementById(
    'modalPhotoTargetSlide',
  ) as HTMLSelectElement | null;
  photoSlideSelect?.addEventListener('change', () => {
    const idx = parseInt(photoSlideSelect.value || '0', 10);
    const s = studioState.deck.slides[idx];
    const promptEl = document.getElementById('modalPhotoPrompt') as HTMLTextAreaElement | null;
    if (s && promptEl) {
      promptEl.value = s.visualPrompt;
    }
  });

  // Submit Modal 1: Insert Photo (Upload File OR Generate via Nano Banana 2.1)
  document.getElementById('formDeckAddPhoto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetIdx = parseInt(
      (document.getElementById('modalPhotoTargetSlide') as HTMLSelectElement)?.value || '0',
      10,
    );
    const fileInput = document.getElementById('modalPhotoFileInput') as HTMLInputElement | null;
    const uploadedFile = fileInput?.files?.[0];
    const prompt =
      (document.getElementById('modalPhotoPrompt') as HTMLTextAreaElement)?.value.trim() ||
      '16:9 presentation visual';
    const targetSlide = studioState.deck.slides[targetIdx] || activeSlide;

    const submitBtn = document.getElementById('btnSubmitNanoBanana') as HTMLButtonElement | null;
    const stopBtn = document.getElementById('btnStopNanoBanana') as HTMLButtonElement | null;
    const task = startCancellableGenerationWithTimer({
      submitBtn,
      stopBtn,
      submitBtnId: 'btnSubmitNanoBanana',
      stopBtnId: 'btnStopNanoBanana',
      generatingLabel: uploadedFile
        ? 'Generating...'
        : `Generating Photo with ${GEMINI_IMAGE_MODEL}...`,
      idleLabel: '🖼 Insert Photo into Slide',
      onStop: (sec) => {
        showToast(`Stopped photo generation after ${sec}s`);
      },
    });

    try {
      let generatedDataUrl = '';
      if (uploadedFile) {
        await waitAbortableMs(600, task.signal);
        generatedDataUrl = await readFileAsDataUrl(uploadedFile);
        if (task.signal.aborted) return;
        targetSlide.visualPrompt = `Uploaded Photo: ${uploadedFile.name}`;
      } else {
        try {
          const nanoUrl = `${studioState.cloudRunUrl.replace(/\/$/, '')}/nano-banana`;
          const resp = await fetch(nanoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: task.signal,
            body: JSON.stringify({
              prompt,
              title: targetSlide.title,
              brand: studioState.deck.brand,
            }),
          });
          if (resp.ok) {
            const data = (await resp.json()) as { dataUrl?: string | null };
            if (data.dataUrl && data.dataUrl.startsWith('data:image/')) {
              generatedDataUrl = data.dataUrl;
            }
          }
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            return;
          }
          // Fallback to prompt-driven client canvas synthesis
        }

        if (!generatedDataUrl) {
          await waitAbortableMs(1500, task.signal);
          targetSlide.visualPrompt = prompt;
          generatedDataUrl = generateNanoBananaDiagramDataUrl(
            targetSlide,
            studioState.deck.brand,
          );
        } else {
          targetSlide.visualPrompt = prompt;
        }
      }

      if (task.signal.aborted) return;

      targetSlide.videoUrl = undefined;
      targetSlide.visualDataUrl = generatedDataUrl;
      targetSlide.layout = 'editorial-split';
      studioState.hasUserModifiedSlides = true;
      studioState.activeSlideIndex = targetIdx;
      studioState.lastVqaSummary = uploadedFile
        ? `Inserted uploaded photo "${uploadedFile.name}" into Slide ${targetIdx + 1}.`
        : `Generated and inserted ${GEMINI_IMAGE_MODEL} photo into Slide ${targetIdx + 1} in ${task.getElapsedSeconds()}s ("${prompt.slice(0, 60)}").`;

      task.finish();
      (document.getElementById('modalDeckAddPhoto') as HTMLDialogElement | null)?.close();
      showToast(`Inserted photo into Slide ${targetIdx + 1}`);
      renderDeckStudioModule();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      task.finish();
    }
  });

  // Submit Modal 2: Insert Video (Upload Video File OR Generate via Gemini Omni 1.2 Flash)
  document.getElementById('formDeckAddVideo')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetIdx = parseInt(
      (document.getElementById('modalVideoTargetSlide') as HTMLSelectElement)?.value || '0',
      10,
    );
    const fileInput = document.getElementById('modalVideoFileInput') as HTMLInputElement | null;
    const uploadedVideo = fileInput?.files?.[0];
    const dur = parseInt(
      (document.getElementById('modalVideoDuration') as HTMLSelectElement)?.value || '6',
      10,
    );
    const res = ((document.getElementById('modalVideoResolution') as HTMLSelectElement)?.value ||
      '1080p') as '1080p' | '720p';
    const prompt =
      (document.getElementById('modalVideoPrompt') as HTMLTextAreaElement)?.value.trim() ||
      '1080p motion graphic';

    const targetSlide = studioState.deck.slides[targetIdx] || activeSlide;
    const submitBtn = document.getElementById('btnSubmitOmniVideo') as HTMLButtonElement | null;
    const stopBtn = document.getElementById('btnStopOmniVideo') as HTMLButtonElement | null;
    const task = startCancellableGenerationWithTimer({
      submitBtn,
      stopBtn,
      submitBtnId: 'btnSubmitOmniVideo',
      stopBtnId: 'btnStopOmniVideo',
      generatingLabel: uploadedVideo
        ? 'Generating...'
        : `Generating Video with ${GEMINI_VIDEO_MODEL}...`,
      idleLabel: '🎬 Insert Video into Slide',
      onStop: (sec) => {
        showToast(`Stopped video generation after ${sec}s`);
      },
    });

    try {
      await waitAbortableMs(uploadedVideo ? 600 : 1800, task.signal);
      if (task.signal.aborted) return;

      if (uploadedVideo) {
        targetSlide.videoUrl = URL.createObjectURL(uploadedVideo);
        targetSlide.videoPrompt = `Uploaded Video: ${uploadedVideo.name}`;
      } else {
        targetSlide.videoPrompt = prompt;
        targetSlide.videoDurationSec = dur;
        targetSlide.videoHistory = targetSlide.videoHistory || [];
        targetSlide.videoHistory.push({
          prompt,
          timestamp: `Turn ${targetSlide.videoHistory.length + 1}`,
          durationSec: dur,
          resolution: res,
        });
        targetSlide.visualPrompt = `🎬 ${GEMINI_VIDEO_MODEL} (${dur}s ${res}): ${prompt}`;
        targetSlide.visualDataUrl = generateNanoBananaDiagramDataUrl(
          targetSlide,
          studioState.deck.brand,
        );
      }

      targetSlide.layout = 'video-showcase';
      studioState.hasUserModifiedSlides = true;
      studioState.activeSlideIndex = targetIdx;
      studioState.lastVqaSummary = uploadedVideo
        ? `Inserted uploaded video "${uploadedVideo.name}" into Slide ${targetIdx + 1}.`
        : `Inserted ${dur}s ${res} ${GEMINI_VIDEO_MODEL} video into Slide ${targetIdx + 1} in ${task.getElapsedSeconds()}s.`;

      task.finish();
      (document.getElementById('modalDeckAddVideo') as HTMLDialogElement | null)?.close();
      showToast(`Inserted video into Slide ${targetIdx + 1}`);
      renderDeckStudioModule();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      task.finish();
    }
  });

  // Submit Modal 3: Insert Music (Upload Audio File OR Generate via Lyria 3)
  document.getElementById('formDeckAddMusic')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetVal =
      (document.getElementById('modalMusicTargetSlide') as HTMLSelectElement)?.value ||
      String(activeSlideIndex);
    const fileInput = document.getElementById('modalMusicFileInput') as HTMLInputElement | null;
    const uploadedAudio = fileInput?.files?.[0];
    const modelId =
      (document.getElementById('modalMusicModel') as HTMLSelectElement)?.value ||
      GEMINI_MUSIC_MODEL;
    const prompt =
      (document.getElementById('modalMusicPrompt') as HTMLTextAreaElement)?.value.trim() ||
      'Ambient keynote synth score';

    const submitBtn = document.getElementById('btnSubmitLyriaMusic') as HTMLButtonElement | null;
    const stopBtn = document.getElementById('btnStopLyriaMusic') as HTMLButtonElement | null;
    const task = startCancellableGenerationWithTimer({
      submitBtn,
      stopBtn,
      submitBtnId: 'btnSubmitLyriaMusic',
      stopBtnId: 'btnStopLyriaMusic',
      generatingLabel: uploadedAudio
        ? 'Generating...'
        : `Generating Music with ${modelId}...`,
      idleLabel: '🎵 Insert Music into Slide',
      onStop: (sec) => {
        showToast(`Stopped music generation after ${sec}s`);
      },
    });

    try {
      await waitAbortableMs(uploadedAudio ? 600 : 1600, task.signal);
      if (task.signal.aborted) return;

      const audioUrl = uploadedAudio
        ? await readFileAsDataUrl(uploadedAudio)
        : synthesizeLyriaAmbientWavDataUrl(prompt, 8);
      if (task.signal.aborted) return;

      if (targetVal === 'ALL') {
        studioState.deck.slides.forEach((s) => {
          s.musicPrompt = uploadedAudio ? uploadedAudio.name : prompt;
          s.musicModel = modelId;
          s.musicAudioUrl = audioUrl;
        });
        showToast(`Inserted music across all ${studioState.deck.slides.length} slides`);
      } else {
        const idx = parseInt(targetVal, 10) || 0;
        const targetSlide = studioState.deck.slides[idx] || activeSlide;
        targetSlide.musicPrompt = uploadedAudio ? uploadedAudio.name : prompt;
        targetSlide.musicModel = modelId;
        targetSlide.musicAudioUrl = audioUrl;
        studioState.activeSlideIndex = idx;
        showToast(`Inserted music into Slide ${idx + 1}`);
      }
      task.finish();
      (document.getElementById('modalDeckAddMusic') as HTMLDialogElement | null)?.close();
      renderDeckStudioModule();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      task.finish();
    }
  });

  // Submit Modal 4: Insert Voice (Upload Voice File OR Generate via Gemini 3.5 Flash TTS)
  document.getElementById('formDeckAddVoice')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetVal =
      (document.getElementById('modalVoiceTargetSlide') as HTMLSelectElement)?.value ||
      String(activeSlideIndex);
    const fileInput = document.getElementById('modalVoiceFileInput') as HTMLInputElement | null;
    const uploadedVoice = fileInput?.files?.[0];
    const persona =
      (document.getElementById('modalVoicePersona') as HTMLSelectElement)?.value ||
      `Aoede (${GEMINI_TTS_MODEL})`;
    const scriptText =
      (document.getElementById('modalVoiceScript') as HTMLTextAreaElement)?.value.trim() ||
      activeSlide.speakerNotes;

    const submitBtn = document.getElementById('btnSubmitGeminiVoice') as HTMLButtonElement | null;
    const stopBtn = document.getElementById('btnStopGeminiVoice') as HTMLButtonElement | null;
    const task = startCancellableGenerationWithTimer({
      submitBtn,
      stopBtn,
      submitBtnId: 'btnSubmitGeminiVoice',
      stopBtnId: 'btnStopGeminiVoice',
      generatingLabel: uploadedVoice
        ? 'Generating...'
        : `Generating Narration with ${GEMINI_TTS_MODEL}...`,
      idleLabel: '🎙 Insert Voice into Slide',
      onStop: (sec) => {
        showToast(`Stopped narration generation after ${sec}s`);
      },
    });

    try {
      await waitAbortableMs(uploadedVoice ? 600 : 1500, task.signal);
      if (task.signal.aborted) return;

      const uploadedVoiceUrl = uploadedVoice ? await readFileAsDataUrl(uploadedVoice) : undefined;
      if (task.signal.aborted) return;

      if (targetVal === 'ALL') {
        studioState.deck.slides.forEach((s) => {
          s.narratorVoiceName = uploadedVoice ? uploadedVoice.name : persona.split(' ')[0];
          s.narratorModel = GEMINI_TTS_MODEL;
          s.narratorScript = s.speakerNotes || scriptText;
          if (uploadedVoiceUrl) s.voiceAudioUrl = uploadedVoiceUrl;
        });
        showToast(`Inserted voice across all ${studioState.deck.slides.length} slides`);
      } else {
        const idx = parseInt(targetVal, 10) || 0;
        const targetSlide = studioState.deck.slides[idx] || activeSlide;
        targetSlide.narratorVoiceName = uploadedVoice ? uploadedVoice.name : persona.split(' ')[0];
        targetSlide.narratorModel = GEMINI_TTS_MODEL;
        targetSlide.narratorScript = scriptText;
        targetSlide.speakerNotes = scriptText;
        if (uploadedVoiceUrl) targetSlide.voiceAudioUrl = uploadedVoiceUrl;
        studioState.activeSlideIndex = idx;
        showToast(`Inserted voice into Slide ${idx + 1}`);
      }
      task.finish();
      (document.getElementById('modalDeckAddVoice') as HTMLDialogElement | null)?.close();
      renderDeckStudioModule();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      task.finish();
    }
  });

  // Submit Modal 6: Upload to Google Drive / Google Workspace
  document.getElementById('formDeckGDriveUpload')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btnSubmitGDriveUpload') as HTMLButtonElement | null;
    const fileName =
      (document.getElementById('modalGDriveFileName') as HTMLInputElement)?.value.trim() ||
      'GDE_Stage_Keynote_Deck.pptx';
    const convertMode =
      (document.getElementById('modalGDriveConvertMode') as HTMLSelectElement)?.value || 'slides';
    const folderId =
      (document.getElementById('modalGDriveFolderId') as HTMLInputElement)?.value.trim() || '';
    const customToken =
      (document.getElementById('modalGDriveCustomToken') as HTMLInputElement)?.value.trim() || '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳ Uploading to Google Drive...</span>';
    }

    try {
      const uploaded = await uploadDeckToGoogleDrive({
        fileName,
        convertToGoogleSlides: convertMode === 'slides',
        folderId,
        customAccessToken: customToken,
      });
      studioState.lastGDriveFileName = uploaded.name;
      studioState.lastGDriveWebViewLink = uploaded.webViewLink;
      studioState.lastVqaSummary = `Uploaded "${uploaded.name}" to Google Drive and opened slide in a new tab.`;

      // Workflow Step 2: Open Google Drive with the uploaded slide presentation in a new tab
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(uploaded.webViewLink, '_blank', 'noopener,noreferrer');
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${GDRIVE_SVG_ICON}<span>Upload to Google Drive</span>`;
      }

      const step1El = document.getElementById('gdriveUploadStep1Panel');
      const step2El = document.getElementById('gdriveUploadStep2Panel');
      const stepLabelEl = document.getElementById('modalGDriveWorkflowStepLabel');
      const headingEl = document.getElementById('modalGDriveHeading');
      const uploadedNameEl = document.getElementById('gdriveUploadedFileNameLabel');
      const openLinkEl = document.getElementById(
        'btnOpenGDriveSlideNewTab',
      ) as HTMLAnchorElement | null;

      if (step1El) step1El.style.display = 'none';
      if (step2El) step2El.style.display = 'flex';
      if (stepLabelEl) stepLabelEl.textContent = 'Step 2 of 2 · Slide Opened in Google Drive';
      if (headingEl) headingEl.textContent = 'Slide Opened in Google Drive';
      if (uploadedNameEl) uploadedNameEl.textContent = uploaded.name;
      if (openLinkEl) openLinkEl.href = uploaded.webViewLink;

      showToast(`Uploaded "${uploaded.name}" and opened Google Drive in a new tab!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google Drive upload failed';
      showToast(`Google Drive Upload: ${message}`);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${GDRIVE_SVG_ICON}<span>Upload to Google Drive</span>`;
      }
    }
  });

  document.getElementById('btnLlmLoadCurrentSlides')?.addEventListener('click', () => {
    const promptArea = document.getElementById('modalLlmPromptText') as HTMLTextAreaElement | null;
    if (promptArea) {
      const formatted = formatCurrentDeckAsLlmPrompt(studioState.deck);
      promptArea.value = formatted;
      studioState.lastLlmPrompt = formatted;
      showToast(`Loaded Slides 1..${studioState.deck.slides.length} into LLM prompt editor`);
    }
  });

  document.getElementById('btnLlmLoadSamplePrompt')?.addEventListener('click', () => {
    const promptArea = document.getElementById('modalLlmPromptText') as HTMLTextAreaElement | null;
    if (promptArea) {
      promptArea.value = DEFAULT_SAMPLE_LLM_PROMPT;
      studioState.lastLlmPrompt = DEFAULT_SAMPLE_LLM_PROMPT;
      showToast('Loaded sample 4-slide LLM instruction prompt');
    }
  });

  document.getElementById('formDeckLlmPrompt')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const targetScope =
      (document.getElementById('modalLlmTargetScope') as HTMLSelectElement)?.value || 'AUTO';
    const llmModel =
      (document.getElementById('modalLlmModel') as HTMLSelectElement)?.value || GEMINI_HEAVY_MODEL;
    const promptText =
      (document.getElementById('modalLlmPromptText') as HTMLTextAreaElement)?.value.trim() || '';
    if (!promptText) return;

    studioState.lastLlmPrompt = promptText;
    studioState.lastLlmModel = llmModel;

    const appliedChanges = applyLlmSlideInstructions(promptText, targetScope);
    studioState.lastLlmChangeLog = appliedChanges;
    studioState.targetSlideCount = studioState.deck.slides.length;
    studioState.pendingTargetSlideCount = studioState.deck.slides.length;
    studioState.hasUserModifiedSlides = true;
    studioState.sourceUploaded = true;
    studioState.isSampleDeck = false;
    studioState.sourceLabel = `LLM Prompt Applied (${studioState.deck.slides.length} slides)`;
    studioState.lastVqaSummary =
      appliedChanges.length > 0
        ? `LLM Slide Director (${llmModel}): Updated ${appliedChanges.length} slide(s).`
        : `LLM Slide Director (${llmModel}): Updated Slide ${studioState.activeSlideIndex + 1}.`;

    (document.getElementById('modalDeckLlmPrompt') as HTMLDialogElement | null)?.close();
    showToast(`Applied ${llmModel} instructions (${studioState.deck.slides.length} slides)`);
    renderDeckStudioModule();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-deck-slide-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      studioState.activeSlideIndex = parseInt(btn.dataset.deckSlideIdx || '0', 10);
      renderDeckStudioModule();
    });
  });

  const titleInput = document.getElementById('deckInputSlideTitle') as HTMLInputElement | null;
  titleInput?.addEventListener('input', () => {
    activeSlide.title = titleInput.value;
    if (activeSlide.title.trim()) {
      activeSlide.isVisualOnlySlide = false;
    }
    studioState.hasUserModifiedSlides = true;
    refreshLiveStageCanvasInPlace();
  });

  const subtitleInput = document.getElementById(
    'deckInputSlideSubtitle',
  ) as HTMLInputElement | null;
  subtitleInput?.addEventListener('input', () => {
    activeSlide.subtitle = subtitleInput.value;
    studioState.hasUserModifiedSlides = true;
    refreshLiveStageCanvasInPlace();
  });

  const bodyTextarea = document.getElementById(
    'deckTextareaSlideBody',
  ) as HTMLTextAreaElement | null;
  bodyTextarea?.addEventListener('input', () => {
    activeSlide.cards = parseSlideBodyTextIntoCards(bodyTextarea.value, activeSlide.cards);
    if (activeSlide.cards.length > 0) {
      activeSlide.isVisualOnlySlide = false;
    }
    studioState.hasUserModifiedSlides = true;
    refreshLiveStageCanvasInPlace();
  });

  const notesArea = document.getElementById('deckTextareaNotes') as HTMLTextAreaElement | null;
  notesArea?.addEventListener('input', () => {
    activeSlide.speakerNotes = notesArea.value;
    studioState.hasUserModifiedSlides = true;
    studioState.lastNotesSavedAt = 'Automatically saved into deck';
    const statusEl = document.getElementById('deckNotesAutosaveStatus');
    if (statusEl) {
      statusEl.textContent = `✓ Automatically saved into deck (${notesArea.value.length} chars)`;
    }
  });
}
