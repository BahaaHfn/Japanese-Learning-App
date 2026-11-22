&lt;role&gt;
You are a senior full-stack TypeScript/React engineer and Japanese language-learning curriculum designer specializing in adaptive spaced repetition and JLPT N3 exam preparation.
&lt;/role&gt;

&lt;context&gt;
I have a working JLPT N3 2-Week Sprint Study Web App (Written Sections ONLY: Kanji, Vocabulary, Grammar, and Reading, with bilingual English + RTL Arabic translations, using my own custom resources).

I want to upgrade the learning engine with three high-impact study improvements:
1. **Mastery Degree → Adaptive Review Frequency:** Choosing how well I know a Kanji, Vocabulary word, or Grammar form should directly control how often and how soon it appears again.
2. **Thematic Categories for Vocabulary & Kanji:** Grouping words and kanji into meaningful themes (e.g., Work & Jobs, Family, Emotions, Daily Life) makes memorizing faster and makes checking/drilling unmastered kanji effortless.
3. **Expanded Grammar Question Bank (30+ Per Section):** Having only 8–13 grammar questions per section is too small for real N3 exam readiness—each grammar section needs at least 30 high-quality JLPT N3 questions.
&lt;/context&gt;

<hard_constraints>
- **Protect my custom resources:** Do NOT delete, overwrite, or replace any of my existing custom vocabulary, kanji, grammar, or reading items. Only **extend** existing items with additive, optional fields (such as `masteryLevel` and `category`) with safe defaults so existing `localStorage` data migrates seamlessly without data loss.
- **Keep bilingual EN + RTL Arabic (`dir="rtl" lang="ar"`):** Every newly added grammar question must include both an English explanation and a clear RTL Arabic explanation, respecting the global Arabic (`A`) and Furigana (`F`) toggles.
- **Written sections ONLY:** Do NOT add Listening, audio, or TTS features.
- **Keep the clean UX:** Integrate these upgrades cleanly into the existing navigation, `<SectionContextHeader />`, and Focus Mode without adding visual clutter.
</hard_constraints>

<feature_requirements>
<mastery_degree_frequency_engine>
Add a unified **4-Level Mastery Degree** system across all **Kanji**, **Vocabulary**, and **Grammar** items that directly drives review frequency and drill prioritization:

| Mastery Degree | Label & Color | Effect on Review Interval (2-Week Sprint) | Queue / Drill Weight |
| :--- | :--- | :--- | :--- |
| **1 — Weak** | Red (`Not Yet`) | Re-shows in **same session (~10 min)** and **every day (max 1d)** | **3x priority** (always appears first) |
| **2 — Shaky** | Amber (`Learning`) | Re-shows every **1–2 days** | **2x priority** |
| **3 — Familiar** | Indigo (`Almost`) | Re-shows every **3–4 days** | **1x priority** |
| **4 — Mastered** | Jade (`Mastered`) | Pushed to **5–7 days** and excluded from default cram runs (accessible via an "Include Mastered" toggle) | **0.2x / Parked** |

Requirements:
1. Map the 4 study rating buttons (`Again / Hard / Good / Easy` or `1–4` keys) directly to updating `masteryLevel` AND recalculating the next review timestamp (combining with existing `ts-fsrs` scheduling, capped to fit the 2-week sprint).
2. Allow **manual mastery override** directly from card/list views (one-click mastery pill selector) so I can immediately mark items I already know as `Mastered` or flag tricky ones as `Weak`.
3. Show a live hint under each mastery button indicating the exact frequency effect (e.g., `Weak • Show daily`, `Mastered • Hide for 5d+`).
</mastery_degree_frequency_engine>

<thematic_categories_vocab_and_kanji>
Organize both **Vocabulary** and **Kanji** into clear thematic sections so I can study by topic and isolate unmastered items instantly:

1. **Standard JLPT N3 Theme Set:**
   - `Work & Jobs` (仕事・ビジネス)
   - `Family & Relationships` (家族・人間関係)
   - `Emotions & Personality` (感情・性格)
   - `Daily Life & Home` (日常生活)
   - `Travel, Places & Transport` (交通・旅行)
   - `Health & Body` (健康・体)
   - `Time, Nature & Weather` (時間・自然)
   - `Society, News & Education` (社会・教育)
   - `Core Verbs & Abstract` (動詞・抽象)
   - `Uncategorized / Custom` (fallback for newly imported items)
2. **Non-Destructive Auto-Tagging + Manual Edit:**
   - Add an optional `category` field to existing Vocabulary and Kanji records, auto-assigning sensible categories to my existing items based on their meanings/tags (without altering any original text or readings), and let me reassign a word/kanji's category or add custom category names in the Library/Import view.
3. **Vocabulary Category Hub:**
   - Display category cards showing: Category name, total words, mastery progress bar (`e.g., 14 / 28 Mastered`), and a one-click **"Drill Unmastered Only"** button.
4. **Kanji Visual Mastery Grid (Per Category):**
   - Inside each Kanji category, render a clean, scannable **Kanji Tile Grid** where each kanji tile is color-coded by its `masteryLevel` (Red = Weak, Amber = Shaky, Indigo = Familiar, Jade = Mastered).
   - Provide quick filters at the top: `All`, `Unmastered Only`, `Weak Only`, and `Mastered`.
   - Clicking a kanji tile opens a compact detail popover/drawer showing reading (on/kun), English + RTL Arabic meaning, example words, and a 1-click mastery degree selector so checking and memorizing unmastered kanji is fast and visual.
</thematic_categories_vocab_and_kanji>

<grammar_30_plus_questions>
Expand the **Grammar & ★** question bank so **each grammar section has at least 30 distinct, authentic JLPT N3 questions** (preserving 100% of my existing custom grammar questions and appending new authentic N3 questions to reach `>= 30` per section):

1. **Section 1 — Grammar Form Selection (`>= 30` questions):** Fill-in-the-blank questions testing core N3 grammar patterns, verb/adjective connections, and nuance distinctions.
2. **Section 2 — Sentence Reordering `★` Star Questions (`>= 30` questions):** 4-chunk ordering drills with highlighted `★` slot and step-by-step syntactic explanations.
3. **Section 3 — Discourse & Confusable Grammar / Cloze (`>= 30` questions):** Questions targeting N3 connectors (`しかし`, `つまり`, `したがって`, `ところが`, `それに`) and high-confusion pairs (`～わけではない` vs `～とは限らない`, `～おかげで` vs `～せいで`, `～うちに` vs `～あいだに`, `～わりに` vs `～くせに`, etc.).

Requirements for all Grammar sections:
- Every question must link to its underlying `grammarPattern` (so answering correctly/incorrectly updates that grammar pattern's **Mastery Degree** and review frequency).
- Every question must include: Japanese prompt, 4 plausible options, correct answer, connection rule, **English explanation**, and **RTL Arabic explanation (`dir="rtl" lang="ar"`)**.
- Add a clean **Session Size & Filter bar** before starting a grammar drill: choose `10`, `15`, or `All 30+` questions, and toggle **"Prioritize Unmastered / Weak First"** (enabled by default).
- Persist answered history and per-section mastery progress (e.g., `18 / 30 Mastered`) in `localStorage`.
</grammar_30_plus_questions>
</feature_requirements>

<execution_workflow>
Follow these steps strictly in order:
1. **Inspect First:** Read my existing `src/` types, data files, FSRS/storage helpers, and Vocab/Kanji/Grammar components. Output a brief implementation plan showing how existing custom resources and `localStorage` data will be migrated safely without overwriting user items.
2. **Implement Mastery Degree & Adaptive Frequency:** Add `masteryLevel` (`1 | 2 | 3 | 4`) with frequency rules and queue weighting, plus backward-compatible migration for existing saved items.
3. **Implement Thematic Categories & Kanji Mastery Grid:** Add `category` tagging, the Vocab Category Hub, and the color-coded Kanji Tile Grid with `Unmastered Only` filtering.
4. **Expand Grammar Bank to 30+ Per Section:** Preserve all existing grammar questions and expand each of the 3 grammar sections to at least 30 unique, authentic JLPT N3 questions with bilingual EN + RTL AR explanations and mastery tracking.
5. **Wire Cleanly Into Existing UI:** Ensure `<SectionContextHeader />` shows the active category/section (e.g., `Study › Kanji › Emotions & Personality (Unmastered)` or `Study › Grammar › ★ Star Questions (Q 12 / 30)`).
</execution_workflow>

&lt;verification&gt;
Before finishing, verify all of the following:
- Run `npm run build` and TypeScript typechecking (`tsc --noEmit`) with zero errors.
- Confirm every existing custom resource item is preserved and migrated cleanly (zero lost records or reset `localStorage` progress).
- Confirm changing an item&#39;s Mastery Degree immediately updates its badge color, next review interval, and queue priority.
- Confirm Vocabulary and Kanji both group into thematic categories with working `Unmastered Only` filters and a visual Kanji Mastery Grid.
- Confirm each of the 3 Grammar sections contains at least **30 distinct questions**, all with English + RTL Arabic explanations and working mastery updates.
&lt;/verification&gt;
