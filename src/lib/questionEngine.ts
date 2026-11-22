import { StudyItem, MockQuestion, TrackedMistake } from '../types';

/**
 * True Fisher-Yates (Knuth) Shuffle algorithm.
 * Guarantees a mathematically unbiased, unpredictable permutation.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Shuffles 4 multiple-choice options with Fisher-Yates
 * and returns the shuffled 4-tuple and new correct index.
 */
export function shuffleQuestionOptions<T extends string>(
  correctOption: T,
  distractors: T[]
): { options: [T, T, T, T]; correctIndex: number } {
  // Ensure we have exactly 3 distractors
  const validDistractors = distractors.filter((d) => d !== correctOption);
  const pool = [correctOption, ...validDistractors.slice(0, 3)];

  while (pool.length < 4) {
    pool.push(`選択肢${pool.length + 1}` as T);
  }

  const shuffled = shuffleArray(pool);
  const correctIndex = shuffled.indexOf(correctOption);

  return {
    options: [shuffled[0], shuffled[1], shuffled[2], shuffled[3]] as [T, T, T, T],
    correctIndex: Math.max(0, correctIndex),
  };
}

// -------------------------------------------------------------
// RECENT SESSION ID TRACKING
// -------------------------------------------------------------
const RECENT_KANJI_KEY = 'jlpt_n3_sprint_recent_kanji_ids';
const MAX_RECENT_HISTORY = 45;

export function getRecentSessionIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KANJI_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentSessionIds(ids: string[]): void {
  try {
    const existing = getRecentSessionIds();
    const updated = Array.from(new Set([...ids, ...existing])).slice(0, MAX_RECENT_HISTORY);
    localStorage.setItem(RECENT_KANJI_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent session IDs:', e);
  }
}

/**
 * Mastery-weighted randomized batch sampling.
 * Pulls primarily from Unmastered/Weak items (Levels 1-2, ~70%),
 * mixed with Familiar (Level 3, ~25%) and Mastered (Level 4, ~5%),
 * then applies Fisher-Yates shuffle to ensure completely non-sequential presentation.
 */
export function sampleMasteryBatch<T extends StudyItem>(
  items: T[],
  count = 15,
  excludeRecent = true
): T[] {
  if (items.length <= count) {
    return shuffleArray(items);
  }

  const recentIds = excludeRecent ? new Set(getRecentSessionIds()) : new Set<string>();

  // Filter out recent items if we have enough items left
  const available = items.filter((item) => !recentIds.has(item.id));
  const pool = available.length >= count ? available : items;

  // Segment by Mastery Level
  const weak = shuffleArray(pool.filter((i) => (i.masteryLevel || 2) === 1));
  const shaky = shuffleArray(pool.filter((i) => (i.masteryLevel || 2) === 2));
  const familiar = shuffleArray(pool.filter((i) => (i.masteryLevel || 2) === 3));
  const mastered = shuffleArray(pool.filter((i) => (i.masteryLevel || 2) === 4));

  const unmastered = [...weak, ...shaky];

  const targetUnmastered = Math.min(unmastered.length, Math.round(count * 0.7));
  const targetFamiliar = Math.min(familiar.length, Math.round(count * 0.25));
  const targetMastered = count - targetUnmastered - targetFamiliar;

  const selected: T[] = [
    ...unmastered.slice(0, targetUnmastered),
    ...familiar.slice(0, targetFamiliar),
    ...mastered.slice(0, Math.max(0, targetMastered)),
  ];

  // Fill up if we are still short of the target count
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((s) => s.id));
    const remainder = shuffleArray(pool.filter((i) => !selectedIds.has(i.id)));
    selected.push(...remainder.slice(0, count - selected.length));
  }

  // Final Fisher-Yates shuffle so order within the batch is genuinely random
  const finalBatch = shuffleArray(selected.slice(0, count));

  // Record into recent history
  addRecentSessionIds(finalBatch.map((i) => i.id));

  return finalBatch;
}

// -------------------------------------------------------------
// SMART PLAUSIBLE DISTRACTORS
// -------------------------------------------------------------

/**
 * Selects 3 smart, plausible wrong options from the deck instead of
 * naively grabbing the next 3 sequential items from the list.
 */
export function generateSmartDistractors(
  targetItem: StudyItem,
  deck: StudyItem[],
  quizType: 'KanjiReading' | 'Orthography' | 'Contextual',
  count = 3
): string[] {
  const targetValue = quizType === 'KanjiReading' ? targetItem.reading : targetItem.expr;
  const candidates = deck.filter((i) => i.id !== targetItem.id && i.expr !== targetItem.expr);

  if (quizType === 'KanjiReading') {
    const targetClean = targetValue.replace(/[/・、\s]+/g, '');
    const targetLen = targetClean.length;

    // Prioritize candidates with similar kana length (±1)
    const lengthMatched = candidates.filter((c) => {
      const clean = c.reading.replace(/[/・、\s]+/g, '');
      return Math.abs(clean.length - targetLen) <= 1;
    });

    const pool = lengthMatched.length >= count ? lengthMatched : candidates;
    const shuffledPool = shuffleArray(pool);

    const distractors: string[] = [];
    const seen = new Set<string>([targetValue]);

    for (const item of shuffledPool) {
      const reading = item.reading.split(/[/・、\s]+/)[0] || item.reading;
      if (reading && !seen.has(reading)) {
        seen.add(reading);
        distractors.push(reading);
        if (distractors.length >= count) break;
      }
    }

    return distractors;
  }

  // Orthography & Contextual: pick kanji words
  const targetLen = targetItem.expr.length;
  const lengthMatched = candidates.filter((c) => Math.abs(c.expr.length - targetLen) <= 1);
  const pool = lengthMatched.length >= count ? lengthMatched : candidates;
  const shuffledPool = shuffleArray(pool);

  const distractors: string[] = [];
  const seen = new Set<string>([targetValue]);

  for (const item of shuffledPool) {
    if (item.expr && !seen.has(item.expr)) {
      seen.add(item.expr);
      distractors.push(item.expr);
      if (distractors.length >= count) break;
    }
  }

  return distractors;
}

// -------------------------------------------------------------
// SENTENCE STEM & MOCK DEDUPLICATION
// -------------------------------------------------------------

/**
 * Normalizes a sentence stem by stripping punctuation, blanks, and star markers
 * to ensure two questions aren't merely identical templates with different words swapped.
 */
export function normalizeSentenceStem(sentence: string): string {
  return sentence
    .replace(/[【】\[\]（）()「」『』、。！？・\s]/g, '')
    .replace(/＿+|★|【\s*】|\[\s*\]/g, '')
    .trim();
}

/**
 * Strict Anti-Duplicate Validator for Mock Tests:
 * 1. No repeated Question IDs.
 * 2. No repeated normalized sentence stems.
 * 3. No duplicate target expressions (e.g. asking about the same kanji twice).
 */
export function deduplicateMockQuestions(questions: MockQuestion[]): MockQuestion[] {
  const seenIds = new Set<string>();
  const seenStems = new Set<string>();
  const seenTargets = new Set<string>();
  const uniqueQuestions: MockQuestion[] = [];

  for (const q of questions) {
    if (seenIds.has(q.id)) continue;

    const normStem = normalizeSentenceStem(q.prompt);
    // Ignore extremely short prompts from stem collision check
    if (normStem.length > 8 && seenStems.has(normStem)) continue;

    const targetExpr = q.relatedItem?.expr || (q.prompt.match(/【(.*?)】/) ? q.prompt.match(/【(.*?)】/)![1] : '');
    if (targetExpr && seenTargets.has(targetExpr)) continue;

    seenIds.add(q.id);
    if (normStem.length > 8) seenStems.add(normStem);
    if (targetExpr) seenTargets.add(targetExpr);

    uniqueQuestions.push(q);
  }

  return uniqueQuestions;
}

// -------------------------------------------------------------
// SEEN MOCK QUESTIONS TRACKING
// -------------------------------------------------------------
const SEEN_MOCK_QIDS_KEY = 'jlpt_n3_sprint_seen_mock_qids';

export function getSeenMockQuestionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_MOCK_QIDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function markMockQuestionsAsSeen(qids: string[]): void {
  try {
    const existing = getSeenMockQuestionIds();
    qids.forEach((id) => existing.add(id));
    localStorage.setItem(SEEN_MOCK_QIDS_KEY, JSON.stringify(Array.from(existing)));
  } catch (e) {
    console.error('Failed to save seen mock question IDs:', e);
  }
}

export function resetSeenMockQuestions(): void {
  try {
    localStorage.removeItem(SEEN_MOCK_QIDS_KEY);
  } catch (e) {
    console.error('Failed to reset seen mock question IDs:', e);
  }
}

// -------------------------------------------------------------
// PRACTICE MY MISTAKES QUEUE (Graduates after 2 consecutive correct)
// -------------------------------------------------------------
const MISTAKES_KEY = 'jlpt_n3_sprint_wrong_questions_v2';

export function getMistakesQueue(): TrackedMistake[] {
  try {
    const raw = localStorage.getItem(MISTAKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordMistake(question: MockQuestion): void {
  try {
    const queue = getMistakesQueue();
    const existingIndex = queue.findIndex((m) => m.questionId === question.id);

    if (existingIndex >= 0) {
      queue[existingIndex].failedCount += 1;
      queue[existingIndex].consecutiveCorrect = 0; // Reset consecutive correct progress
      queue[existingIndex].lastFailed = new Date().toISOString();
      queue[existingIndex].question = question; // Update payload
    } else {
      queue.push({
        questionId: question.id,
        consecutiveCorrect: 0,
        failedCount: 1,
        lastFailed: new Date().toISOString(),
        question,
      });
    }

    localStorage.setItem(MISTAKES_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to record mistake:', e);
  }
}

/**
 * Records a correct answer during Mistakes review.
 * A question leaves the Mistakes queue only after being answered correctly TWICE.
 * Returns true if the question has graduated and was removed.
 */
export function recordCorrectMistake(questionId: string): boolean {
  try {
    const queue = getMistakesQueue();
    const index = queue.findIndex((m) => m.questionId === questionId);
    if (index === -1) return false;

    queue[index].consecutiveCorrect += 1;

    if (queue[index].consecutiveCorrect >= 2) {
      // Graduated! Remove from mistakes queue
      queue.splice(index, 1);
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(queue));
      return true;
    }

    localStorage.setItem(MISTAKES_KEY, JSON.stringify(queue));
    return false;
  } catch (e) {
    console.error('Failed to record correct mistake:', e);
    return false;
  }
}

export function removeMistake(questionId: string): void {
  try {
    const queue = getMistakesQueue().filter((m) => m.questionId !== questionId);
    localStorage.setItem(MISTAKES_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to remove mistake:', e);
  }
}
