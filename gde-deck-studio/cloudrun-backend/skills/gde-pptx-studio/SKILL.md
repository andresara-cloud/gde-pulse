---
name: gde-pptx-studio
description: Autonomous 16:9 ECMA-376 OpenXML (.pptx) presentation architect, multimodal visual synthesizer (Nano Banana 2.1 + Gemini Omni 1.2 Flash), and headless LibreOffice Visual QA inspector for Google Developer Experts.
---

# GDE OpenXML Presentation & Video Studio Skill

Follow these exact rules whenever generating or inspecting `.pptx` presentations in Cloud Run or Antigravity:

## 1. Mandatory Model Routing
- **Deck Architecture & Closed-Loop Visual QA**: `gemini-4-argon` (`thinking_level="HIGH"`)
- **Fast Markdown / Theme XML Extraction**: `gemini-3.8-flash` (`thinking_level="LOW"`)
- **16:9 Technical Diagrams (1K to 4K)**: `gemini-nano-banana-2.1`
- **1080p Video Clips (3s to 15s) & Multi-Turn Video Editing**: `gemini-omni-1.2-flash`

## 2. 16:9 Widescreen OpenXML Geometry Rules
- Always set `prs.slide_width = Inches(13.333)` and `prs.slide_height = Inches(7.5)` (`12192000 x 6858000` EMU).
- Render the 4-segment conference top stripe (`0.1"` height) across the top edge of every slide using `primaryHex`, `secondaryHex`, `warningHex`, and `accentHex`.
- Use `MSO_SHAPE.ROUNDED_RECTANGLE` with `adjustments[0] = 0.02` for pillar cards and place a `0.08"` accent bar along the top of each card.
- Reserve the bottom `0.55"` dark banner (`Inches(0.6), Inches(6.35), Inches(12.133), Inches(0.55)`) for the `KEY TAKEAWAY //` executive summary.
- Populate `slide.notes_slide.notes_text_frame.text` on every slide.

## 3. Closed-Loop Visual QA Protocol
1. Convert the generated `.pptx` to PDF using `soffice --headless --convert-to pdf`.
2. Rasterize each slide at 150 DPI using `pdftoppm -png -r 150`.
3. Inspect each slide PNG with `gemini-4-argon` (`HIGH` thinking) to verify:
   - Zero text box collisions or card overflow
   - Minimum 4.5:1 contrast ratio on all text runs
   - Strict adherence to `<a:clrScheme>` and `<a:fontScheme>` extracted from the uploaded `ppt/theme/theme1.xml` or brand reference image
4. If any slide exhibits text overflow, reduce body font size by `1.5pt` or tighten bullets and re-compile before returning the `.pptx`.
