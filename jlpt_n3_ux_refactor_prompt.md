# Prompt: Simplify Front-End UI & Fix Wayfinding UX (JLPT N3 Study App)

You are a senior product designer and front-end React/TypeScript engineer specializing in calm, distraction-free learning interfaces (like Duolingo, Linear, and Anki minimalism).

My JLPT N3 study app works functionally, but the current front-end feels **too complicated** and **it is hard to tell which part of the exam or study flow I am currently working on**. Refactor the UI/UX layer to make the app immediately clear, calm, and effortless to navigate.

**Critical Preservation Rule:** Refactor **UI, layout, navigation, and visual hierarchy ONLY**. Do **NOT** break or reset existing `localStorage` data, `ts-fsrs` scheduling logic, imported decks, bilingual English/Arabic fields, or mock exam scoring.

## 1. Core UX Problems to Fix

1. **Too many competing top-level tabs:** Replace the crowded 7-item navigation with **4 clear destinations**.
2. **Unclear location ("What part am I working on?"):** Add unmistakable color-coded section context, breadcrumbs, and a live session progress bar on every screen.
3. **Visual noise during studying:** Introduce a centered, distraction-free **Focus Study Mode** that hides navigation clutter while answering cards, grammar drills, or reading passages.
4. **Mixed-script crowding (Japanese + English + Arabic):** Give each script its own calm typographic zone so Japanese stands out first, English is secondary, and RTL Arabic (`dir="rtl"`) sits in a clean, scannable block.

## 2. Information Architecture Redesign (7 Tabs → 4 Clear Pillars)

Collapse the main navigation to **4 simple items** (slim left rail on desktop, clean bottom bar on mobile):

| Nav Item | What Lives Inside | Goal |
| :--- | :--- | :--- |
| **1. Today** | Countdown to Dec 6, 2026 + **one primary "Start Next Session" CTA** + 2 compact readiness bars (Language Knowledge & Reading vs. 19/60 floor) + today's 3-step checklist | Open the app and start studying in **1 click** without deciding where to go |
| **2. Study** | Clean 3-pill top switcher: **Vocab & Kanji** • **Grammar & ★** • **Reading Lab** | One home for all daily practice, with clear visual separation per section |
| **3. Mock** | 100-Min Written Mock (30m Vocab + 70m Grammar/Reading) & Single-Block Drills | Dedicated exam simulation space |
| **4. Library** | Sub-tabs for **Import Cards**, **14-Day Plan**, and **Settings / Backup** | Keep administrative tools out of the daily study path |

Move the global **Furigana (`F`)** and **Arabic (`A`)** toggles into a compact pill group in the top-right header so they never clutter the main content area.

## 3. Unmistakable Wayfinding ("Always Know Where You Are")

Add a reusable `<SectionContextHeader />` component pinned to the top of every **Study** and **Mock** view:

* **Color-Coded Exam Section Badge** (consistent across the entire app):
  * **Indigo (`#1E3A5F`):** `Language Knowledge • Vocabulary (30m Block)`
  * **Amber (`#B45309`):** `Language Knowledge • Grammar (70m Block)`
  * **Emerald (`#1F7A5A`):** `Reading Comprehension (70m Block)`
  * **Crimson (`#C84B31`):** `Exam Simulation • 100m Written Mock`
* **Clear Breadcrumb Path:** Always display `Section › Mode` (e.g., `Study › Grammar › ★ Sentence Reordering` or `Study › Vocab › Leech Cram`).
* **Live Progress Strip:** Thin full-width progress bar directly under the header + clear step label (`Item 4 of 12 • 33%`) so I always know how far I am into the current session.

## 4. Distraction-Free Focus Mode & Layout Decluttering

Apply these strict visual rules across all study screens:

1. **Centered Study Canvas:** Constrain Vocab flashcards and Grammar drills to `max-w-2xl mx-auto` with generous padding (`p-6 sm:p-8`) and plenty of empty background space (`#FAFAF8`). Keep Reading Lab two-column on desktop (`60% passage / 40% question`), stacked cleanly on mobile.
2. **Active Session Focus Mode:** When I click "Start Session" in Vocab, Grammar, Reading, or Mock, collapse/dim the main sidebar and show only:
   * `← Exit Session` button (top-left)
   * Color-coded section badge + breadcrumb + progress bar (top-center)
   * Furigana / Arabic quick-toggle pills (top-right)
   * The single active card or question in the center
3. **Progressive Disclosure (Hide Secondary Noise):**
   * Remove permanent tip banners, dense stat grids, and excessive badges from study cards.
   * Tuck strategy hints ("Read Question First"), connection rules, and keyboard shortcut hints behind lightweight collapsible toggles (`Show Hint` / `?`).
4. **Clean Trilingual Card Hierarchy (JA → EN → AR):**
   * **Tier 1 (Hero):** Japanese expression / sentence (`Noto Sans JP`, `text-3xl` to `text-4xl` for vocab, `text-lg leading-loose` for passages, dark charcoal `#1C1917`).
   * **Tier 2 (Secondary):** English meaning/explanation (`Inter`, `text-base`, muted slate `#475569`) separated by a subtle divider.
   * **Tier 3 (Arabic Clarity Block):** RTL Arabic meaning/explanation (`Noto Sans Arabic`, `dir="rtl" lang="ar"`, inside a soft jade-tinted surface `bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-4 py-2.5 text-[#14532D]`) so English and Arabic never visually collide.
5. **Single Primary Button Per State:** Use only ONE high-contrast filled button per screen state (e.g., `Show Answer`, `Check Answer`, `Next Question →`); style all secondary actions (`Reset`, `Flag`, `Skip`) as quiet ghost or subtle outline buttons.

## 5. Step-by-Step Refactor Instructions

1. **Audit & Map Existing Components:** List the current routes/views and confirm how existing state hooks and `localStorage` keys will remain untouched.
2. **Build Shared Layout Primitives First:** Create `<AppShell />` (4-pillar nav + header toggles), `<SectionContextHeader />` (color badge + breadcrumb + progress bar), and `<BilingualBlock />` (clean EN + RTL AR card block).
3. **Simplify the Dashboard (`Today`):** Replace multi-widget clutter with a single hero "Continue Today's Sprint" card plus compact readiness progress bars.
4. **Apply Focus Mode to Study & Mock Screens:** Update `VocabSRS`, `GrammarDrills`, `ReadingLab`, and `MockExam` to use `<SectionContextHeader />`, centered layouts, and progressive disclosure.
5. **Move Admin Views to `Library`:** Group `ImportResources`, `SprintPlan`, and `Settings` cleanly under the `Library` tab.
6. **Verify:** Run `npm run build` / TypeScript typecheck and confirm zero broken handlers, zero `localStorage` data loss, and clean responsive rendering on both narrow mobile and wide desktop screens.
