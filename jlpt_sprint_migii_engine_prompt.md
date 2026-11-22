&lt;role&gt;
You are a senior full-stack TypeScript/React engineer and JLPT assessment architect who designs randomized, exam-accurate Japanese test engines (similar to Migii JLPT&#39;s structured practice and mock-test architecture).
&lt;/role&gt;

&lt;context&gt;
I am building **JLPT Sprint** (a written-only JLPT study web app with Kanji, Vocabulary, Grammar, Reading, bilingual English + RTL Arabic translations, 4-level Mastery Degree frequency, thematic categories, and my own custom resources).

Three major issues are currently hurting my study experience:
1. **Mock Shiken (模擬試験) lacks fresh, varied questions:** Starting a new mock either repeats the same questions or reuses the exact same sentence stem with a different kanji swapped in.
2. **Kanji drills follow the static list order:** Kanji flashcards and kanji quiz questions appear sequentially down the list (`0, 1, 2...`) instead of randomly, causing me to memorize list order instead of the actual kanji.
3. **Practice flow needs a Migii JLPT–style learning question system:** I want structured skill-by-skill mini-quizzes (by official JLPT Mondai type), instant rich bilingual explanations, tap-to-inspect words, and a dedicated "Practice My Mistakes" loop.
&lt;/context&gt;

<hard_constraints>
- **Strictly protect my custom resources:** Do NOT delete, overwrite, or replace any of my existing custom vocabulary, kanji, grammar, or reading datasets. Build the randomized question engine and mock test pools **on top of** my existing custom resources (and any additive question banks should live in separate files or cleanly append without mutating user items).
- **Zero lazy template cloning:** NEVER generate mock or quiz questions by plugging different kanji/words into the same repeated generic sentence stem. Every question in a session or mock test must have a **unique, natural Japanese sentence** and unique target item.
- **Keep bilingual EN + RTL Arabic (`dir="rtl" lang="ar"`):** All new explanations, sentence translations, and distractor notes must include both English and RTL Arabic, respecting global Furigana (`F`) and Arabic (`A`) toggles.
- **Written sections ONLY:** Do NOT add Listening, audio, or TTS features.
- **Preserve existing `localStorage` progress:** Add new tracking keys (`seenQuestionIds`, `wrongQuestionIds`, `mockTestHistory`) non-destructively without wiping existing user mastery levels or imported decks.
</hard_constraints>

<engine_requirements>
<randomization_and_kanji_engine>
Fix the sequential list bug across **Kanji**, **Vocabulary**, and **Grammar** drills:
1. **True Fisher-Yates Shuffle (Never Sequential):** Implement a shared `shuffleArray<T>(items: T[])` utility using Fisher-Yates and apply it on every new Kanji/Vocab/Grammar session and on the 4 multiple-choice options of every question.
2. **Mastery-Weighted Random Sampling:** When building a Kanji drill session (default 10 or 15 items):
   - Pull primarily from **Unmastered / Weak (`Level 1–2`)** items first, mixed with a small percentage of `Familiar (Level 3)` items, then **Fisher-Yates shuffle** the selected batch so the order is genuinely unpredictable every time.
   - Track `recentSessionIds` so the same kanji never appears twice in one session or back-to-back across consecutive sessions.
3. **Smart Plausible Distractors:** For Kanji Reading and Orthography quizzes, never pick the next 3 items from the static list as wrong answers. Pick randomized distractors from the deck that share similar character length, reading patterns (e.g., long-vowel traps like `こう` vs `こ`, or voiced/unvoiced pairs), or similar kanji components whenever available.
4. **Add a "Shuffle Now" Button:** Let me reshuffle the active Kanji queue at any moment with one tap.
</randomization_and_kanji_engine>

<migii_style_learning_question_system>
Upgrade the **Study** practice flow to mirror the structured, high-feedback learning system of [Migii JLPT](https://jlpt.migii.net/en/) (written sections only):
1. **Practice by Official JLPT Mondai (Skill Mini-Quizzes):**
   - Let me choose a specific exam skill for a focused **10- or 15-question randomized mini-quiz**:
     - *Vocabulary / Kanji:* **Mondai 1** (Kanji Reading — underlined kanji in sentence), **Mondai 2** (Orthography — hiragana to kanji), **Mondai 3** (Context Vocab — fill in the blank), **Mondai 4** (Paraphrases / Synonyms), **Mondai 5** (Correct Word Usage in a sentence).
     - *Grammar:* **Form Selection**, **★ Sentence Reordering**, **Passage Cloze**.
     - *Reading:* **Short**, **Medium**, **Long**, and **Information Retrieval**.
2. **Instant Learning Feedback Card (After Each Answer):**
   - Immediately highlight the selected option (Jade = correct, Crimson = wrong) and reveal an expandable **Explanation Card** containing:
     - Full sentence translation (**English + RTL Arabic**).
     - **Why the correct answer fits** (in English + RTL Arabic) AND a brief gloss of the **wrong options** so I learn all 4 choices, not just 1.
     - Quick 4-level **Mastery Degree** rating bar right on the feedback card so answering directly updates review frequency.
3. **Tap-to-Lookup Words Inside Questions:**
   - Make key Japanese words inside practice sentences clickable to open a lightweight inline gloss (reading + English + RTL Arabic meaning + 1-click "Add to Weak Queue").
4. **Dedicated "Review Wrong Questions" Mode:**
   - Automatically save every wrong question ID into `wrongQuestionIds` in `localStorage`.
   - Surface a prominent **"Practice My Mistakes (N)"** button inside `Study` and `Mock`. A question leaves the Mistakes queue only after I answer it correctly **twice** (or manually mark it Mastered).
</migii_style_learning_question_system>

<mock_shiken_fresh_question_engine>
Overhaul **Mock Shiken (模擬試験)** so every test feels like a real, distinct exam instead of recycled questions:
1. **Structured Multi-Test Sets + Fresh Mock Generator:**
   - Organize the mock question pool into **distinct numbered Mock Tests (`Mock Test 1`, `Mock Test 2`, `Mock Test 3`, ...)** (like [Migii JLPT's numbered test list](https://jlpt.migii.net/en/mock-test/jlpt-n3)) showing each test's status (`Not Started`, `In Progress`, `Best Score / 120`, `Pass/Fail Floor`).
   - Also provide a **"Generate Fresh Unseen Mock"** button that dynamically assembles a new 2-block written test (`30m Vocabulary` + `70m Grammar & Reading`) drawn strictly from **unseen questions** across my custom resources and question banks.
2. **Strict Anti-Duplicate & Anti-Clone Deduplication:**
   - Persist `seenMockQuestionIds` and `usedTargetExpressions` per mock attempt.
   - Enforce two hard rules when assembling any mock test:
     a) **No repeated question IDs** across consecutive mock tests until the unseen pool is exhausted (if exhausted, clearly notify me and prioritize my previously missed questions first).
     b) **No repeated sentence stems or duplicate target kanji/words** inside the same mock test (deduplicate by normalized sentence stem AND by target expression).
3. **Rich Post-Mock Review (Migii Style):**
   - After submitting a mock, show:
     - Scaled scores (`Language Knowledge / 60`, `Reading / 60`, `Written Subtotal / 120`) + `19/60` section-floor Pass/Fail badges.
     - Question-by-question review filterable by `All`, `Wrong Only`, and `Flagged`, each with full English + RTL Arabic explanation.
     - One-click **"Retry Wrong Questions Only"** and **"Push All Missed to FSRS Weak Queue"**.
</mock_shiken_fresh_question_engine>
</engine_requirements>

<execution_workflow>
1. **Inspect Existing Codebase First:** Read my current `src/` data files, Kanji quiz component, Study quiz logic, and Mock Shiken generator. Report exactly why questions are repeating or appearing sequentially, and outline your fix plan before editing.
2. **Build Shared Randomization & Deduplication Engine (`src/lib/questionEngine.ts`):** Implement Fisher-Yates shuffle, mastery-weighted sampling, smart distractor selection, `seenMockQuestionIds` tracking, and sentence-stem/target-word deduplication.
3. **Fix Kanji & Vocab Drills:** Replace sequential indexing with the mastery-weighted random engine and add the "Shuffle Now" control.
4. **Upgrade Study to Migii-Style Learning Flow:** Add Mondai-based skill mini-quizzes, instant bilingual (EN + RTL AR) explanations covering all 4 options, tap-to-gloss words, and the "Practice My Mistakes" queue.
5. **Overhaul Mock Shiken:** Add numbered non-overlapping Mock Tests + "Generate Fresh Unseen Mock", strict anti-clone deduplication, and full post-mock Wrong-Only review.
</execution_workflow>

&lt;verification&gt;
Before finishing, verify all of the following:
- Run `npm run build` and `tsc --noEmit` with zero errors.
- Start 3 consecutive Kanji sessions and confirm the order is genuinely randomized each time (never `0, 1, 2...`) and options are shuffled.
- Generate 2 consecutive Mock Shiken tests and confirm zero repeated question IDs, zero identical sentence stems with swapped kanji, and zero duplicate target words within a single mock.
- Confirm every missed question lands in &quot;Practice My Mistakes&quot;, displays both English and RTL Arabic explanations, and preserves all my existing custom resources and `localStorage` progress.
&lt;/verification&gt;
