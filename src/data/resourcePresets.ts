import { StudyItem } from '../types';
import {
  ALL_OFFICIAL_VOCABULARY,
  ALL_OFFICIAL_KANJI,
  ALL_OFFICIAL_GRAMMAR,
  TOTAL_OFFICIAL_ITEMS_COUNT,
} from './allOfficialResources';

export {
  ALL_OFFICIAL_VOCABULARY,
  ALL_OFFICIAL_KANJI,
  ALL_OFFICIAL_GRAMMAR,
  TOTAL_OFFICIAL_ITEMS_COUNT,
};

export interface ResourcePreset {
  id: string;
  name: string;
  description: string;
  count: number;
  items: StudyItem[];
}

export const SAMPLE_TSV_TEMPLATE = `Kanji\tReading\tEnglish\tArabic\tExample\tSource
政\tまつりごと / セイ\tgovernment, politics\tحكم، سياسة\t国民は政治に関心を持つべきだ。\tEJable N3 Kanji
議\tギ\tdeliberation, debate\tتشاور، نقاش\t激しい議論が交わされた。\tEJable N3 Kanji
愛\tあい\tlove\tحب، مودة\t親の愛は無限です。\tJLPT N3 Vocab
合図\tあいず\tsign, signal\tإشارة، علامة\t手を振って合図をした。\tJLPT N3 Vocab
べき\tべき\tshould do, must do\tينبغي، يجب\t約束は守るべきだ。\tN3 Grammar List`;

export const RESOURCE_PRESETS: ResourcePreset[] = [
  {
    id: 'full-bundle-pack',
    name: '⚡ Complete N3 Master Pack (All 2,230 Items)',
    description: 'Ingest all 1,804 vocabulary words, 370 kanji characters, and 56 grammar patterns from your files in one single click.',
    count: TOTAL_OFFICIAL_ITEMS_COUNT,
    items: [...ALL_OFFICIAL_VOCABULARY, ...ALL_OFFICIAL_KANJI, ...ALL_OFFICIAL_GRAMMAR],
  },
  {
    id: 'full-vocab-pack',
    name: 'All 1,804 N3 Vocabulary (JLPT-N3-Vocabulary-.md)',
    description: 'Every single word from 1. 愛 to 1804. ワイン with English and Arabic definitions.',
    count: ALL_OFFICIAL_VOCABULARY.length,
    items: ALL_OFFICIAL_VOCABULARY,
  },
  {
    id: 'full-kanji-pack',
    name: 'All 370 N3 Official Kanji (JLPT-N3-Kanji-List-PDF.md)',
    description: 'Complete list of 370 kanji from 1. 政 to 370. 誰 with On/Kun readings and meanings.',
    count: ALL_OFFICIAL_KANJI.length,
    items: ALL_OFFICIAL_KANJI,
  },
  {
    id: 'full-grammar-pack',
    name: 'All 56 Official Grammar Patterns (450815793-The-JLPT-N3-Grammar-List.md)',
    description: 'All 56 grammar points from #1 bakari (ばかり) to #56 you ni mieru with functional Arabic translations.',
    count: ALL_OFFICIAL_GRAMMAR.length,
    items: ALL_OFFICIAL_GRAMMAR,
  },
];
