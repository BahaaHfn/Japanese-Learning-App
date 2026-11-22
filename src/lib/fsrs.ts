import {
  fsrs,
  generatorParameters,
  Rating,
  createEmptyCard,
  Card,
  State,
} from 'ts-fsrs';
import { StudyItem, StudyItemStatus, MasteryDegree } from '../types';

export interface NextIntervals {
  [Rating.Again]: { interval: string; hint: string };
  [Rating.Hard]: { interval: string; hint: string };
  [Rating.Good]: { interval: string; hint: string };
  [Rating.Easy]: { interval: string; hint: string };
}

/**
 * Creates an FSRS instance configured for JLPT sprint mode
 */
export function getFsrsInstance(examCap5Days: boolean = true) {
  const params = generatorParameters({
    request_retention: 0.90,
    maximum_interval: examCap5Days ? 7 : 365,
    enable_fuzz: false,
  });
  return fsrs(params);
}

/**
 * Convert serialized fsrsCard or initialize a new Card
 */
export function getCardFromItem(item: StudyItem): Card {
  if (item.fsrsCard) {
    return {
      due: new Date(item.fsrsCard.due),
      stability: item.fsrsCard.stability,
      difficulty: item.fsrsCard.difficulty,
      elapsed_days: item.fsrsCard.elapsed_days,
      scheduled_days: item.fsrsCard.scheduled_days,
      reps: item.fsrsCard.reps,
      lapses: item.fsrsCard.lapses,
      state: item.fsrsCard.state as State,
      last_review: item.fsrsCard.last_review ? new Date(item.fsrsCard.last_review) : undefined,
    };
  }
  const empty = createEmptyCard();
  if (item.lapses) empty.lapses = item.lapses;
  return empty;
}

/**
 * Compute the next adaptive sprint intervals for each rating with live frequency hints
 */
export function getNextIntervals(item: StudyItem, _examCap5Days: boolean = true): NextIntervals {
  // Adaptive interval mapping designed for the 2-week exam sprint
  const currentLevel = item.masteryLevel || 2;

  let hardDays = '1d';
  let goodDays = '3d';
  let easyDays = '6d';

  if (currentLevel === 1) {
    hardDays = '1d';
    goodDays = '2d';
    easyDays = '5d';
  } else if (currentLevel === 3) {
    hardDays = '2d';
    goodDays = '4d';
    easyDays = '7d';
  } else if (currentLevel === 4) {
    hardDays = '2d';
    goodDays = '4d';
    easyDays = '7d';
  }

  return {
    [Rating.Again]: {
      interval: '10m',
      hint: 'Weak • Show daily',
    },
    [Rating.Hard]: {
      interval: hardDays,
      hint: `Shaky • Every ${hardDays}`,
    },
    [Rating.Good]: {
      interval: goodDays,
      hint: `Familiar • Every ${goodDays}`,
    },
    [Rating.Easy]: {
      interval: easyDays,
      hint: `Mastered • Parked ${easyDays}`,
    },
  };
}

/**
 * Process a review rating and return updated StudyItem with adaptive Mastery Degree
 */
export function reviewStudyItem(
  item: StudyItem,
  ratingGrade: 1 | 2 | 3 | 4,
  _examCap5Days: boolean = true
): StudyItem {
  const now = new Date();
  const card = getCardFromItem(item);
  const f = getFsrsInstance(true);
  const record = f.repeat(card, now);

  const ratingMap: Record<1 | 2 | 3 | 4, Rating.Again | Rating.Hard | Rating.Good | Rating.Easy> = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  };
  const fsrsRating = ratingMap[ratingGrade];
  const updatedCard = record[fsrsRating].card;

  // 1. Calculate adaptive Mastery Degree and Next Review timestamp
  let newMastery: MasteryDegree = ratingGrade;
  let newDue = new Date();
  let intervalDays = 0;
  let newStatus: StudyItemStatus = 'Learning';
  let newLapses = item.lapses || 0;

  if (ratingGrade === 1) {
    // 1 - Weak: Re-shows in same session (~10 min) and max 1 day
    newMastery = 1;
    newLapses += 1;
    newDue = new Date(now.getTime() + 10 * 60 * 1000); // 10 min
    intervalDays = 0;
    newStatus = newLapses >= 3 ? 'Leech' : 'Learning';
  } else if (ratingGrade === 2) {
    // 2 - Shaky: Re-shows every 1-2 days
    newMastery = 2;
    intervalDays = 1;
    newDue = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    newStatus = 'Learning';
  } else if (ratingGrade === 3) {
    // 3 - Familiar: Re-shows every 3-4 days
    newMastery = 3;
    intervalDays = 3;
    newDue = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    newStatus = 'Review';
  } else {
    // 4 - Mastered: Pushed to 5-7 days and parked
    newMastery = 4;
    intervalDays = 6;
    newDue = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    newStatus = 'Mastered';
  }

  return {
    ...item,
    masteryLevel: newMastery,
    lapses: newLapses,
    intervalDays,
    due: newDue.toISOString(),
    status: newStatus,
    fsrsCard: {
      due: newDue.toISOString(),
      stability: updatedCard.stability,
      difficulty: updatedCard.difficulty,
      elapsed_days: updatedCard.elapsed_days,
      scheduled_days: intervalDays,
      reps: updatedCard.reps,
      lapses: newLapses,
      state: updatedCard.state,
      last_review: now.toISOString(),
    },
  };
}

/**
 * Direct 1-click manual mastery override from card/grid views
 */
export function applyMasteryOverride(item: StudyItem, level: MasteryDegree): StudyItem {
  const now = new Date();
  let intervalDays = 0;
  let newDue = new Date();
  let newStatus: StudyItemStatus = 'Learning';

  if (level === 1) {
    intervalDays = 0;
    newDue = new Date(now.getTime() + 10 * 60 * 1000);
    newStatus = item.lapses >= 3 ? 'Leech' : 'Learning';
  } else if (level === 2) {
    intervalDays = 1;
    newDue = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    newStatus = 'Learning';
  } else if (level === 3) {
    intervalDays = 3;
    newDue = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    newStatus = 'Review';
  } else {
    intervalDays = 6;
    newDue = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    newStatus = 'Mastered';
  }

  return {
    ...item,
    masteryLevel: level,
    intervalDays,
    due: newDue.toISOString(),
    status: newStatus,
  };
}

/**
 * Calculates priority weight for review queue
 * 1 (Weak) = 3x, 2 (Shaky) = 2x, 3 (Familiar) = 1x, 4 (Mastered) = 0.2x
 */
export function getMasteryPriorityWeight(level?: MasteryDegree): number {
  if (level === 1) return 3.0;
  if (level === 2) return 2.0;
  if (level === 3) return 1.0;
  if (level === 4) return 0.2;
  return 1.5;
}
