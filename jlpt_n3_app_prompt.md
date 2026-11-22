# Prompt: Build a JLPT N3 2-Week Sprint Study Web App (Written Sections • Bilingual EN/AR)

You are a senior full-stack TypeScript engineer and Japanese language-learning UX specialist. Build a fast, local-first web application designed to maximize JLPT N3 exam readiness in a **14-day sprint** ahead of **Sunday, December 6, 2026** ([JLPT Official Schedule](https://www.jlpt.jp/e/)).

**Strict Scope Constraint:** This app covers the **written sections ONLY** — **Language Knowledge (Kanji, Vocabulary, Grammar)** and **Reading**. Do **NOT** build any Listening, audio player, speech-to-text, or TTS modules.

## 1. User Configuration (Edit Before Running)

* **Tech Stack:** React + TypeScript + Vite + Tailwind CSS + `localStorage` + [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) + `lucide-react`
* **Owned Study Resources:** `[Replace with your resources, e.g., New Kanzen Master N3 Grammar & Reading, Official JLPT Practice Workbook, Bunpro N3 notes, Anki N3 Vocab CSV]`
* **Weakest Written Area:** `[Kanji & Vocabulary / Grammar / Reading]`
* **Daily Study Target:** `[e.g., 3 hours/day]`
* **Translation Languages:** **English + Arabic (`dir="rtl" lang="ar"`)** on all vocabulary meanings and grammar explanations (with a global toggle for Arabic).

## 2. Exam Alignment & Product Principles

Align all timers, scoring gauges, and question formats to the official [JLPT N3 Test Sections](https://www.jlpt.jp/e/guideline/testsections.html) and [JLPT Scoring Guidelines](https://www.jlpt.jp/sp/e/guideline/results.html):

| Written Section | Exam Time Limit | Scoring Floor | Target Scope & Reference Sources |
| :--- | :--- | :--- | :--- |
| **Language Knowledge (Vocabulary & Grammar)** | Vocabulary: **30 min**; Grammar (paired with Reading): part of **70 min** | **19 / 60** minimum (overall pass mark: **95 / 180**) | ~650 kanji, ~3,750 words ([GyanMirai](https://www.gyanmirai.com/jlpt/jlpt-n3/quick-facts)), ~182 grammar patterns ([JLPT Sensei N3 Grammar](https://jlptsensei.com/jlpt-n3-grammar-list/), [Vocab](https://jlptsensei.com/jlpt-n3-vocabulary-list/), [Kanji](https://jlptsensei.com/jlpt-n3-kanji-list/); [Bunpro N3](https://bunpro.jp/decks/cgwh1b/bunpro-n3-grammar); [New Kanzen Master N3](https://cotoacademy.com/best-jlpt-n3-textbooks/)) |
| **Reading** | Combined with Grammar: **70 min** | **19 / 60** minimum | Short, medium, long passages & information retrieval ([Official JLPT Practice Workbook](https://www.jlpt.jp/e/samples/sampleindex.html); [Official N3 Sample Questions](https://www.jlpt.jp/samples/n3/index.html)) |

**Non-Negotiable Engineering & Design Rules:**

1. **Local-First & Zero Backend:** No login wall, no external database, and no audio dependencies. Persist all state in `localStorage` with one-click dated `.json` export/import backup.
2. **Automatic Error-to-SRS Loop:** Every missed question in Vocab, Grammar, Reading, or Mock Exams must automatically enqueue into a **Weak Items / Leech Queue** for immediate FSRS review.
3. **Trilingual Typography (JA / EN / AR) & Visual Theme:**
   * Load `Inter` (UI), `Noto Sans JP` (Japanese), and `Noto Sans Arabic` (Arabic RTL with `dir="rtl" lang="ar"` and `unicode-bidi: isolate`).
   * Use a clean Japanese stationery palette: warm off-white surface (`#FAFAF8`), crisp white cards (`#FFFFFF`), deep indigo primary (`#1E3A5F`), vermilion accent (`#C84B31`) for pass-floor warnings and leeches, and jade green (`#1F7A5A`) for Arabic translations and mastered states.
   * Provide persistent global sidebar/header toggles and shortcuts: **Furigana `<ruby>` (`F`)**, **Arabic Translations (`A`)**, **Flip Card (`Space`)**, **Answers/Ratings (`1–4`)**, and **Shortcuts Modal (`?`)**.
4. **Immediate Usability:** Ship authentic JLPT N3 seed data (10 vocab items with English + Arabic meanings, 3 grammar form questions + 3 `★` reordering drills + 3 confusable pairs with English + Arabic explanations, 2 reading passages with clickable EN/AR vocabulary, and an 8-question 2-block written mock) so every module works on first launch.

## 3. Architecture & Core Data Models

Organize the project cleanly into:

* `src/types/` — TypeScript interfaces:
  * `StudyItem`: `{ id, expr, reading, meaningEn, meaningAr, example, source, subskill, lapses, intervalDays, due, suspended, status }`
  * `GrammarFormQuestion`: `{ id, pattern, sentence, options, correct, connection, explanationEn, explanationAr }`
  * `GrammarStarQuestion`: `{ id, prefix, suffix, chunks, correctOrder, starSlot, explanationEn, explanationAr }`
  * `ConfusablePair`: `{ id, left, right, diffEn, diffAr, exampleL, exampleR, weak }`
  * `ReadingPassage`: `{ id, type, targetSec, title, paragraphs, clickableWords: { expr, reading, meaningEn, meaningAr }[], conjunctions, questions }`
  * `MockAttempt`, `DailyPlan`, `AppSettings` (including `furigana: boolean`, `showArabic: boolean`, `examCap5Days: boolean`)
* `src/lib/fsrs/` — Wrapper around `ts-fsrs` with 14-day sprint interval cap
* `src/data/` — Seed N3 bilingual sample items and the pre-populated 14-day sprint checklist
* `src/components/` — Reusable furigana renderer, RTL Arabic text component, pace timers, digital bubble mark-sheet, toast notifications, and confirmation/shortcut modals (no native `alert()`/`confirm()`)
* `src/pages/` — 7 top-level views: `Dashboard`, `VocabSRS`, `GrammarDrills`, `ReadingLab`, `MockExam`, `ImportResources`, `SprintPlanAndSettings`

## 4. Module Specifications

### Module 1: Sprint Command Center (`Dashboard`)

* **Countdown Header:** Live countdown to **Sunday, December 6, 2026** (days remaining + current sprint day out of 14), daily streak, completed study minutes vs. daily target, and a quick `+15m logged` button.
* **Two-Section Readiness Gauges:**
  * **Language Knowledge (/60)** and **Reading (/60)** with a visible **19/60 floor marker** and red/amber status badges whenever projected score approaches or falls below 19/60.
  * **Written Subtotal (/120)** progress bar referencing the **95/180** overall JLPT N3 pass mark.
* **Today's High-Yield Queue:** Four one-click action cards linking directly to (1) Due FSRS Vocab/Kanji + Leech count, (2) Grammar Patterns & `★` Drills, (3) Timed Reading Lab, and (4) 100-Min Written Mock Simulator.

### Module 2: Vocab & Kanji FSRS Cram Engine (`VocabSRS`)

* **Sprint-Tuned `ts-fsrs` Scheduler:** Default desired retention `0.90` plus a toggleable **14-Day Exam Cap** (caps max review interval at **5 days** so fragile cards resurface before December 6). Rating buttons: `Again (1)`, `Hard (2)`, `Good (3)`, `Easy (4)` displaying next intervals.
* **Practice Modes:**
  * **Flashcard Mode:** Active recall revealing furigana, **English meaning (`meaningEn`)**, **RTL Arabic meaning (`meaningAr`)** (when Arabic toggle is ON), and an example sentence.
  * **JLPT N3 Quiz Mode:** Mirrors official Vocabulary item types — *Kanji Reading* (kanji → hiragana), *Orthography* (hiragana → kanji), and *Contextually-Defined Expressions* (fill-in-the-blank) — auto-generating 3 distractors from the active deck and showing both English + Arabic meanings upon answer reveal.
* **Leech Rescue & Pacing:** Flag cards missed 2+ times as **Leeches** with a one-click **"Cram Leeches"** filter, and track average seconds per question against the **<50 seconds** target for the 30-minute Vocabulary block.

### Module 3: Grammar Drills & Star (`★`) Trainer (`GrammarDrills`)

* **Three Official N3 Grammar Modes (All with Bilingual EN + RTL AR Explanations):**
  * **Mode A — Form Selection:** Fill-in-the-blank choosing pattern + conjugation; after answering, display connection rule, English explanation (`explanationEn`), and RTL Arabic explanation (`explanationAr`).
  * **Mode B — Sentence Reordering (`★` Star Questions):** 4 shuffled phrase chunks with 4 clickable blank slots (one highlighted `★`); let the user order all 4 chunks, grade the `★` slot, and display both English and RTL Arabic syntactic order explanations.
  * **Mode C — Confusable Pairs:** Side-by-side nuance cards (e.g., `～わけではない` vs. `～とは限らない`, `～おかげで` vs. `～せいで`, `～うちに` vs. `～あいだに`) with English + RTL Arabic nuance breakdowns, example sentences, and a Weak/Mastered toggle.
* **Mistake-to-SRS Loop:** Any missed grammar question automatically queues the pattern into the FSRS Weak Queue.

### Module 4: Timed Reading Lab (`ReadingLab`)

* **Passage Library:** Tag passages by N3 format with built-in pace targets: **Short** (2–3 min), **Medium** (6–8 min), **Long** (10–12 min), and **Information Retrieval / Notice Search** (3–4 min).
* **Active Reading Workspace:** Two-column desktop layout (stacked on mobile) with Japanese passage on the left and questions on the right, per-passage countdown timer (green = on pace, amber = 80% elapsed, red = overtime), and a **Strategy Helper Toggle** ("Read Question First" tip + inline highlight on discourse markers like `しかし`, `そのため`, `つまり`, `ただし`).
* **One-Click Bilingual Word Capture:** Clicking an underlined N3 word in the passage saves it directly into the Vocab FSRS queue with both its English and Arabic meanings and shows a confirmation toast.

### Module 5: 100-Minute Written Mock Exam Simulator (`MockExam`)

* **Exact 2-Block Timer & Flow:**
  * **Block 1:** Language Knowledge — Vocabulary (**30 min**).
  * **Block 2:** Language Knowledge — Grammar & Reading (**70 min**).
  * Support both **Full 100-Min Written Mock** and **Single-Block Timed Drill** (30-min or 70-min).
  * Include a sticky countdown header, digital bubble mark-sheet (`1–4`), and "Flag for Review" markers.
* **Diagnostic Report & Error Loop:** Estimate scaled scores for **Language Knowledge (/60)**, **Reading (/60)**, and **Combined Written (/120)**; explicitly flag PASS/FAIL against the **19/60** section floor; list missed items; and provide a one-click **"Push All Missed Items to FSRS Weak Queue"** button (preserving English + Arabic meanings).

### Module 6: Resource Ingestion Engine (`ImportResources`)

* **Quick-Paste Bulk Adder & CSV/TSV Importer:** Accept pipe (`|`) or tab-separated rows in bilingual format: `Kanji | Reading | English | Arabic | Example | Source` (gracefully supporting 5-column rows without Arabic as well), with live parsed count preview and a sample Kanzen Master preset loader.
* **Deck Coverage & Suspension Table:** Display all vocabulary items showing Japanese + reading, English + RTL Arabic meanings, source tag, status badge (`New`, `Learning`, `Review`, `Mastered`, `Leech`), and a one-click **Suspend / Unsuspend** toggle so already-known words don't waste sprint time.

### Module 7: 14-Day Sprint Planner & Settings (`SprintPlanAndSettings`)

* **Interactive 14-Day Checklist (Nov 22 – Dec 5, 2026):**
  * **Phase 1 (Days 1–3 — Diagnostic):** 100-min written baseline mock, import missed vocab/grammar, clear due FSRS + leeches.
  * **Phase 2 (Days 4–10 — High-Yield Sprint):** Daily FSRS reviews, Grammar `★` & confusable-pair drills, timed reading passages, Day 7 midpoint written mock.
  * **Phase 3 (Days 11–14 — Simulation & Taper):** Two full 100-min written dress rehearsals (Day 11 & Day 13), Leech Queue only on Day 12, light confidence review on Day 14 (Saturday, Dec 5).
  * Each day persists completion state and includes an **"Open Module →"** button jumping directly to the relevant screen.
* **Settings & Backup:** Toggle 5-day FSRS exam cap, copy/export full `.json` backup, and reset demo data via an in-page confirmation modal.

## 5. Build Execution Instructions

1. Scaffold the Vite + React + TypeScript + Tailwind CSS project and install `ts-fsrs` and `lucide-react`.
2. Implement the bilingual data models (`meaningEn`, `meaningAr`, `explanationEn`, `explanationAr`), `localStorage` persistence store, and FSRS scheduler helper first.
3. Build Modules 1 through 7 with responsive desktop sidebar + mobile horizontal nav, crisp `Noto Sans JP` + `Noto Sans Arabic` typography, and global Furigana (`F`) and Arabic (`A`) toggles.
4. Run `npm run build` / TypeScript typecheck to verify zero compile errors and working seed data across all 7 views.