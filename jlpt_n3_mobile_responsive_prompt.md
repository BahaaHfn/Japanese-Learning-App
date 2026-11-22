&lt;role&gt;
You are a senior front-end React/TypeScript engineer and mobile UX specialist focused on thumb-friendly, native-feeling responsive web apps (360px–430px phones through desktop).
&lt;/role&gt;

&lt;context&gt;
My JLPT N3 2-Week Sprint Study Web App (Written Sections ONLY: Kanji, Vocabulary, Grammar 30+/section, Reading, and 100-Min Mock, with bilingual English + RTL Arabic translations, 4-level Mastery Degree frequency, thematic categories, and my own custom resources) works well on desktop, and I now want it to feel effortless and native on **mobile phones** so I can study anywhere during my 2-week sprint.
&lt;/context&gt;

<hard_constraints>
- Refactor **responsive layout, CSS, touch interactions, and mobile containers ONLY**.
- **Strictly protect my custom resources and logic:** Do NOT modify, overwrite, or reset any custom datasets, `localStorage` keys, FSRS/mastery frequency math, thematic categories, 30+ grammar banks, or bilingual English/Arabic fields.
- Keep desktop layouts (`lg:` and above) clean and intact while optimizing `< 768px` (mobile) and `768px–1023px` (tablet).
- Enforce **zero horizontal overflow** at `360px`, `390px`, and `430px` viewport widths.
- Use `100dvh` (dynamic viewport height) and `env(safe-area-inset-bottom)` so mobile browser toolbars and iPhone/Android gesture bars never cover bottom buttons.
</hard_constraints>

<mobile_requirements>
<navigation_and_thumb_zone>
1. **Bottom Tab Bar (`< lg`):** Render the 4 main pillars (`Today`, `Study`, `Mock`, `Library`) in a fixed bottom tab bar (`min-h-[60px]`, safe-area bottom padding, icon + short label, `>= 44px` tap targets). Hide the desktop sidebar below `lg:`.
2. **Slim Mobile Header (`<= 56px`):** Show only the compact app title/breadcrumb on the left and two small toggle pills (`ふ` Furigana + `ع` Arabic) on the right—never wrap onto two rows.
3. **Focus Mode Thumb Dock:** Inside active study sessions (Vocab, Grammar, Reading, Mock), hide the bottom tab bar and pin the primary action / 4-level **Mastery Rating buttons** to a sticky bottom thumb dock (`sticky bottom-0`) so I can study one-handed.
</navigation_and_thumb_zone>

<module_responsive_patterns>
1. **Vocab & Kanji Flashcards:**
   - Full-width card with comfortable mobile padding (`p-4 sm:p-6`), responsive Japanese sizing (`text-3xl sm:text-5xl`), clean stacked English + RTL Arabic (`dir="rtl" lang="ar"`) clarity block, and a 2×2 mobile grid for the 4 Mastery Degree buttons (`Weak / Shaky / Familiar / Mastered`) with tap height `>= 48px`.
2. **Kanji Thematic Grid & Mobile Bottom Sheet:**
   - Use `grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2` with square tap-friendly kanji tiles (`min-h-[56px]`).
   - On mobile (`< md`), tapping a kanji tile opens a **slide-up bottom sheet** (instead of a cramped tooltip/popover) showing readings, EN + RTL AR meaning, example words, and the 1-click Mastery Degree selector.
3. **Grammar & ★ Sentence Reordering:**
   - Make all 4 `★` blank slots and selectable phrase chunks wrap cleanly (`flex-wrap gap-2`, `min-h-[44px]` touch targets) with zero clipping or horizontal scroll.
   - Ensure multiple-choice options stack vertically (`grid-cols-1 sm:grid-cols-2`) on phones with generous touch spacing.
4. **Reading Lab (No Endless Scrolling):**
   - Below `lg:`, replace the two-column desktop split with a **sticky top segmented switcher (`Passage` | `Questions`)** plus a compact pace timer badge so I can flip between the Japanese text and comprehension questions in 1 tap without losing my scroll position.
   - Keep clickable Japanese vocabulary words tap-friendly (`py-0.5 px-1`) with a clean bottom toast confirmation when captured to Vocab SRS.
5. **100-Min Written Mock Exam:**
   - Keep the countdown timer and `Submit / Next Block` button in a compact sticky top bar.
   - Below `lg:`, collapse the desktop Digital Mark-Sheet into a floating **"Mark-Sheet (X/Y)"** button that opens a slide-up bottom sheet drawer showing the `1–4` bubble grid and flagged questions.
6. **Tables → Mobile Cards (`Import`, `Deck Coverage`, `14-Day Plan`):**
   - Replace wide horizontal HTML tables with clean stacked cards on `< md` (`hidden md:table` for desktop table, `md:hidden space-y-2.5` for mobile cards) so every word, Arabic meaning, status badge, and `Suspend` toggle fits comfortably on a phone screen.
</module_responsive_patterns>

<typography_and_spacing_polish>
- Prevent unwanted zoom on iOS inputs by setting `text-base` (`16px`) on textareas and form inputs on mobile.
- Ensure `<ruby>` furigana has sufficient `line-height` (`leading-[2.1]`) on narrow screens so ruby annotations never collide with the line above.
- Ensure RTL Arabic blocks (`dir="rtl" lang="ar"`) wrap naturally without breaking punctuation or pushing parent containers wider than `100%`.
</typography_and_spacing_polish>
</mobile_requirements>

<execution_workflow>
1. **Audit Mobile Breakpoints:** Inspect `<AppShell />`, `<SectionContextHeader />`, and all 7 views to list every fixed width, wide table, cramped grid, or desktop-only popover that breaks below `430px`. Output a concise plan before editing.
2. **Upgrade App Shell & Sticky Controls:** Implement the `100dvh` layout, mobile bottom 4-pillar nav with safe-area padding, slim top header, and Focus Mode sticky bottom thumb dock.
3. **Adapt Study & Mock Modules:** Add the mobile Kanji bottom sheet, Reading Lab `Passage | Questions` switcher, Mock Mark-Sheet drawer, and wrapping `★` grammar slots.
4. **Convert Tables to Mobile Cards:** Add responsive card views for Deck Coverage / Import and the 14-Day Sprint Plan on `< md`.
</execution_workflow>

&lt;verification&gt;
Before finishing, verify all of the following:
- Run `npm run build` and `tsc --noEmit` with zero errors.
- Check every view (`Today`, `Vocab`, `Kanji Grid`, `Grammar ★`, `Reading`, `Mock`, `Library`) at `360px`, `390px`, and `1280px` widths to confirm zero horizontal scroll (`document.documentElement.scrollWidth &lt;= window.innerWidth`).
- Confirm all touch targets are `&gt;= 44px`, bottom buttons are never obscured by safe areas, and all existing custom resources and `localStorage` data remain completely untouched.
&lt;/verification&gt;
