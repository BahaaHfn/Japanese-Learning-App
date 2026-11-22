&lt;role&gt;
You are a senior product designer and front-end React/TypeScript engineer specializing in calm, distraction-free learning interfaces (like Duolingo, Linear, and Anki minimalism).
&lt;/role&gt;

&lt;context&gt;
I have already built a working JLPT N3 2-Week Sprint Study Web App (Written Sections ONLY: Language Knowledge — Kanji, Vocabulary, Grammar — and Reading, with bilingual English + RTL Arabic translations, targeting Sunday, December 6, 2026) populated with **my own custom JLPT N3 study resources and datasets**.

Current UX pain points:
1. The front-end feels visually complicated and crowded.
2. It is hard to immediately understand which JLPT N3 section, study mode, or resource set I am currently working on.
&lt;/context&gt;

<hard_constraints>
- Refactor the UI, layout, navigation, and visual hierarchy ONLY.
- **Strictly protect my custom resources:** Treat all existing study data files, custom datasets, JSON/CSV assets, vocabulary/kanji lists, grammar decks, reading passages, and mock questions in the repository as **read-only**. Do NOT delete, overwrite, truncate, or replace them with generic sample data.
- **Adapt the UI to my existing data schema:** Inspect my current TypeScript types and resource files first, and bind the redesigned components to my exact existing field names, source tags, and structures (never rename data fields in a way that breaks existing records).
- Do NOT break, rename, or reset existing `localStorage` keys, `ts-fsrs` scheduling logic, bilingual English/Arabic fields, or mock exam scoring.
- Do NOT add Listening, audio, or TTS features.
- Do NOT use native browser `alert()`, `confirm()`, or `prompt()` dialogs; keep in-page modals and toasts.
- Keep full responsiveness across narrow mobile screens and wide desktop monitors with zero horizontal scroll.
</hard_constraints>

<design_requirements>
<navigation_architecture>
Collapse the crowded 7-tab navigation into 4 clear top-level pillars (slim left rail on desktop, clean bottom bar on mobile):
1. **Today**: Live countdown to Dec 6, 2026 + ONE primary "Start Next Session" CTA + 2 compact readiness bars (Language Knowledge & Reading vs. 19/60 floor) + today's 3-step checklist.
2. **Study**: Clean 3-pill top switcher for **Vocab & Kanji** • **Grammar & ★** • **Reading Lab**.
3. **Mock**: 100-Min Written Mock (30m Vocab + 70m Grammar & Reading) and Single-Block Timed Drills.
4. **Library**: Sub-tabs for **My Resources / Import**, **14-Day Plan**, and **Settings / Backup** (keeps admin and deck management out of daily study).

Move global **Furigana (`F`)** and **Arabic (`A`)** toggles into a compact pill group in the top-right header.
</navigation_architecture>

<wayfinding_system>
Create a reusable `<SectionContextHeader />` pinned to the top of every Study and Mock screen so I always know where I am:
- **Color-Coded Exam Section Badge** (consistent app-wide):
  - Indigo (`#1E3A5F`): `Language Knowledge • Vocabulary (30m Block)`
  - Amber (`#B45309`): `Language Knowledge • Grammar (70m Block)`
  - Emerald (`#1F7A5A`): `Reading Comprehension (70m Block)`
  - Crimson (`#C84B31`): `Exam Simulation • 100m Written Mock`
- **Breadcrumb Path**: Always display `Section › Mode` (and the active custom resource/source tag if filtered, e.g., `Study › Grammar › ★ Sentence Reordering`).
- **Live Session Progress Strip**: Thin full-width progress bar directly under the header + clear step counter (`Item 4 of 12 • 33%`).
</wayfinding_system>

<focus_mode_and_visual_clarity>
1. **Centered Study Canvas**: Constrain Vocab flashcards and Grammar drills to `max-w-2xl mx-auto` with generous padding (`p-6 sm:p-8`) on a calm warm off-white canvas (`#FAFAF8`). Keep Reading Lab two-column on desktop (`60% passage / 40% question`), stacked on mobile.
2. **Active Session Focus Mode**: When a drill or mock starts, hide or dim the main sidebar and show only:
   - `← Exit Session` button (top-left)
   - Color-coded `<SectionContextHeader />` + progress bar (top-center)
   - Furigana / Arabic quick-toggle pills (top-right)
   - The single active card or question in the center
3. **Progressive Disclosure**: Remove permanent tip banners, dense stat grids, and excessive badges from study cards. Tuck strategy hints, connection rules, and shortcut cheatsheets behind collapsible `Show Hint` / `?` toggles.
4. **Clean Trilingual Card Hierarchy (JA → EN → AR)**:
   - **Japanese (Hero)**: `Noto Sans JP`, `text-3xl` to `text-4xl` for vocab, `text-lg leading-loose` for passages, dark charcoal (`#1C1917`).
   - **English (Secondary)**: `Inter`, `text-base`, muted slate (`#475569`) separated by a subtle divider.
   - **Arabic (Clarity Block)**: `Noto Sans Arabic`, `dir="rtl" lang="ar"`, inside a soft jade-tinted block (`bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-4 py-2.5 text-[#14532D]`) so English and Arabic never visually collide.
5. **One Primary Button Per State**: Render only ONE high-contrast filled button per screen state (`Show Answer`, `Check Answer`, `Next Question →`); style secondary actions (`Reset`, `Flag`, `Skip`) as quiet ghost/outline buttons.
</focus_mode_and_visual_clarity>
</design_requirements>

<execution_workflow>
Follow these steps strictly in order:
1. **Inspect First**: Read `src/` (and `public/` if applicable) to map my existing custom resource files, data schemas, routes, state hooks, and `localStorage` keys. Output a brief refactor plan listing the exact UI files you will modify and confirming that zero custom resource files will be altered. Wait for approval if any schema mismatch is found.
2. **Build Shared Layout Primitives**: Implement `<AppShell />` (4-pillar nav + header toggles), `<SectionContextHeader />`, and `<BilingualBlock />`.
3. **Refactor `Today` (Dashboard)**: Replace multi-widget clutter with one hero "Continue Today's Sprint" action card and compact 2-section readiness bars.
4. **Apply Focus Mode to Study & Mock**: Update `VocabSRS`, `GrammarDrills`, `ReadingLab`, and `MockExam` to use `<SectionContextHeader />`, centered layouts, and progressive disclosure while reading directly from my existing custom resources.
5. **Group Resource Management & Admin Views in `Library`**: Move `ImportResources` / custom deck management, `SprintPlan`, and `Settings` cleanly under the `Library` tab.
</execution_workflow>

&lt;verification&gt;
Before finishing, verify all of the following:
- Run `npm run build` and TypeScript typechecking (`tsc --noEmit`) with zero errors.
- Confirm zero custom study resource files or datasets were modified, overwritten, or replaced with mock data.
- Confirm every existing button, keyboard shortcut (`Space`, `1–4`, `F`, `A`, `?`), FSRS rating action, Reading word capture, and Mock error-push handler still works against my real resources.
- Confirm existing `localStorage` data loads cleanly without resetting user progress.
- Summarize the exact UI files changed and how the new 4-pillar navigation and wayfinding bar work.
&lt;/verification&gt;