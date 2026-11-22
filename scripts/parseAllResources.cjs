const fs = require('fs');
const path = require('path');

// 1. Parse Vocabulary (1804 items)
const vocabFile = fs.readFileSync('JLPT-N3-Vocabulary-.md', 'utf8');
const vocabText = vocabFile.replace(/^#.*$/gm, '').replace(/^\(\d+\s*words\).*$/gm, '');
const vocabChunks = vocabText.split(/(?:^|\s|-)\s*(?=\d{1,4}\.\s*)/g);
const allVocab = [];

// Common Arabic dictionary for high-frequency terms to enrich with Arabic translations
const arabicMap = {
  'love': 'حب، مودة',
  'affection': 'عاطفة، محبة',
  'sign': 'إشارة، علامة',
  'signal': 'إشارة، إيماءة',
  'companion': 'رفيق، شريك',
  'partner': 'شريك، خصم',
  'company': 'شركة، رفقة',
  'unfortunately': 'للأسف، لسوء الحظ',
  'light': 'ضوء، نور',
  'room': 'غرفة، متسع',
  'obvious': 'واضح، جلي',
  'clear': 'واضح، صريح',
  'give up': 'يستسلم، يتراجع',
  'abandon': 'يتخلى عن',
  'tired': 'يسأم، يمل',
  'handshake': 'مصافحة',
  'devil': 'شيطان، إبليس',
  'dawn': 'فجر، ينبلج الصباح',
  'entrust': 'يودع، يأمن',
  'deposit': 'وديعة، يودع',
  'sweat': 'عرق',
  'give': 'يمنح، يعطي',
  'warm': 'دافئ، لطيف',
  'vicinity': 'جوار، محيط',
  'hit': 'يصيب، يضرب',
  'treat': 'يتعامل مع، يعالج',
  'handle': 'يتصرف بـ، يعالج',
  'gathering': 'تجمع، اجتماع',
  'hole': 'حفرة، ثقب',
  'storm': 'عاصفة',
  'new': 'جديد، طازج',
  'express': 'يعبر عن',
  'show': 'يُظهر، يبدي',
  'thank you': 'شكراً جزيلاً',
  'bubble': 'فقاعة، رغوة',
  'plan': 'خطة، مقترح',
  'memorization': 'حفظ، استظهار',
  'influence': 'تأثير، نفوذ',
  'postponement': 'تأجيل، إرجاء',
  'government': 'حكومة، إدارة الدولة',
  'politics': 'سياسة',
  'debate': 'مناقشة، مداولة',
  'discuss': 'يناقش، يبحث',
  'nation': 'أمة، شعب',
  'people': 'الناس، المواطنون',
  'join': 'ينضم، يتصل',
  'opposite': 'مقابل، معارض',
  'section': 'قسم، جزء',
  'city': 'مدينة',
  'inside': 'داخل، في باطن',
  'decide': 'يقرر، يحسم',
  'choose': 'يختار، ينتقي',
  'reality': 'حقيقة، واقع',
  'war': 'حرب، قتال',
  'appear': 'يظهر، يتجلى',
  'transform': 'يتحول، يتبدل',
  'method': 'طريقة، أسلوب، قانون',
  'target': 'هدف، غاية',
  'rule': 'قاعدة، يحكم',
  'peace': 'سلام، وئام',
  'machine': 'آلة، فرصة',
  'advance': 'يتقدم، يمضي قدماً',
  'number': 'عدد، رقم',
  'write': 'يكتب، يدوّن',
  'only': 'فقط، فحسب',
  'should': 'ينبغي، يجب',
  'full of': 'مليء بـ',
  'pretend': 'يتظاهر بـ',
  'instead': 'عوضاً عن، بدلاً من',
  'result': 'نتيجة',
  'reason': 'سبب، علة',
  'because': 'لأن، بسبب',
};

function getArabicMeaning(meaningEn) {
  const lower = meaningEn.toLowerCase();
  for (const [enKey, arVal] of Object.entries(arabicMap)) {
    if (lower.includes(enKey)) {
      return arVal;
    }
  }
  return '';
}

for (const chunk of vocabChunks) {
  const m = chunk.match(/^(\d{1,4})\.\s*(.+)$/s);
  if (m) {
    const num = parseInt(m[1]);
    const raw = m[2].trim().replace(/\s+/g, ' ');
    let expr = '';
    let reading = '';
    let meaningEn = '';

    const dashIdx = raw.indexOf(' - ');
    if (dashIdx !== -1) {
      const left = raw.slice(0, dashIdx).trim();
      meaningEn = raw.slice(dashIdx + 3).trim();
      if (left.includes(',')) {
        const parts = left.split(',');
        expr = parts[0].trim();
        reading = parts.slice(1).join(',').trim();
      } else {
        expr = left;
        reading = left;
      }
    } else {
      expr = raw;
      reading = raw;
      meaningEn = raw;
    }

    const meaningAr = getArabicMeaning(meaningEn);

    allVocab.push({
      id: `vocab-all-${num}`,
      expr,
      reading,
      meaningEn,
      meaningAr,
      source: 'JLPT-N3-Vocabulary-.md',
      subskill: 'Vocab',
      lapses: 0,
      intervalDays: 0,
      due: new Date().toISOString(),
      suspended: false,
      status: 'New',
    });
  }
}

// 2. Parse Kanji (370 items)
const kanjiFile = fs.readFileSync('JLPT-N3-Kanji-List-PDF.md', 'utf8');
const kanjiLines = kanjiFile.split('\n');
const allKanji = [];
let kanjiCount = 0;

for (let i = 0; i < kanjiLines.length; i++) {
  const line = kanjiLines[i].trim();
  if (!line.includes('|')) continue;
  const km = line.match(/`([\u4e00-\u9faf])`/);
  if (km) {
    const kanji = km[1];
    kanjiCount++;
    const cols = line.split('|').slice(1, -1);
    const cleanCol = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/~~.*?~~/g, '').replace(/<sup>|<\/sup>/g, '').replace(/[`*_~[\]]/g, '').replace(/\s+/g, ' ').trim();
    
    let onyomi = cols[2] ? cleanCol(cols[2]) : '';
    let kunyomi = cols[3] ? cleanCol(cols[3]) : '';
    let meaning = cols[4] ? cleanCol(cols[4]) : '';

    const meaningAr = getArabicMeaning(meaning);

    allKanji.push({
      id: `kanji-all-${kanjiCount}`,
      expr: kanji,
      reading: [onyomi, kunyomi].filter(Boolean).join(' • '),
      meaningEn: meaning || 'N3 Kanji',
      meaningAr,
      source: 'JLPT-N3-Kanji-List-PDF.md',
      subskill: 'Kanji',
      lapses: 0,
      intervalDays: 0,
      due: new Date().toISOString(),
      suspended: false,
      status: 'New',
    });
  }
}

// 3. Parse Grammar (56 items)
const grammarFile = fs.readFileSync('450815793-The-JLPT-N3-Grammar-List.md', 'utf8');
const grammarLines = grammarFile.split('\n');
const allGrammar = [];

const grammarArabicMap = {
  'bakari': 'فقط، مجرد (لا غير)',
  'bakari de': 'فقط، مجرد (لوصف سلبي)',
  'bakari denaku': 'ليس فقط... بل أيضاً، فضلاً عن',
  'bakari iru': 'لا يفعل سوى، يستمر في التكرار',
  'bakari ka': 'ليس فقط... بل يتعداه إلى',
  'beki': 'ينبغي، يجب أن (واجب أخلاقي)',
  'beki dewa nai': 'لا ينبغي، لا يجوز',
  'darake': 'مليء بـ (وحل، أخطاء، عيوب)',
  'furi o suru': 'يتظاهر بـ، يتصنع',
  'gatai': 'يصعب جداً، يتعذر فعله',
  'hodo': 'إلى حد، لدرجة أن',
  'kawari ni': 'بدلاً من، في مقابل',
  'kiri': 'فقط، منذ ذلك الحين فحسب',
  'kke': 'أليس كذلك؟ (استرجاع وتأكيد)',
  'koto da': 'ينبغي أن (نصيحة وتوجيه)',
  'koto ka': 'كم هو... كثيراً ما! (تعجب وتوكيد)',
  'koto ni naru': 'تقرر أن، أصبح الأمر كذلك',
  'koto ni suru': 'قرر أن يجعل من عادته',
  'koto wa nai': 'لا داعي لـ، لا حاجة إلى',
  'kurai': 'تقريباً، إلى درجة أن',
  'kuse ni': 'على الرغم من (مع لوم واستهجان)',
  'mama': 'على حاله دون تغيير',
  'mon': 'لأن، بدافع (تبرير غير رسمي)',
  'mono da': 'من الطبيعي أن، طالما كان (تذكر وعاطفة)',
  'moraitai': 'أرغب في أن تفعل لي',
  'nagara mo': 'على الرغم من، مع أن',
  'nanka': 'أشياء مثل، شعور سلبي أو استغراب',
  'nazenara': 'والسبب هو، لأن',
  'ndatte': 'سمعت أن، يقال أن',
  'ni kawatte': 'نيابة عن، عوضاً عن',
  'ni totte': 'بالنسبة إلى، من منظور',
  'okage': 'بفضل، بسبب (نتيجة إيجابية)',
  'ppanashi': 'ترك الشيء دون إتمامه أو إغلاقه',
  'rashii': 'يبدو أن، كما يظهر',
  'saichuu ni': 'في خضمّ، في أثناء ذروة الحدث',
  'sei': 'بسبب، بذنب (نتيجة سلبية)',
  'shikanai': 'لا مفر من، لا خيار سوى',
  'sono kekka': 'ونتيجة لذلك',
  'sono tame': 'ولهذا السبب، من ثم',
  'tabi ni': 'كلما، في كل مرة يتكرر',
  'te hajimete': 'لم أدرك إلا بعد أن',
  'temo kamawanai': 'لا بأس وإن، لا مانع',
  'to ieba': 'بالحديث عن، إن ذكرنا',
  'to iu': 'يُدعى، يُقال',
  'to iu koto da': 'المعنى هو، سمعت أن',
  'to iu to': 'إن قلت ذلك، بالحديث عن',
  'to sureba': 'بافتراض أن، إذا افترضنا',
  'toori': 'تماماً كما، وفقاً لـ',
  'totan': 'ما إن... حتى، في اللحظة التي',
  'tsuide ni': 'بالمناسبة، استغلالاً للفرصة',
  'tsumari': 'أي، بعبارة أخرى، خلاصة القول',
  'tsumori datta': 'كنت أنوي أن',
  'wa mochiron': 'بالتأكيد، ناهيك عن',
  'wari ni': 'بالمقارنة مع، على غير المتوقع بالنسبة لـ',
  'yorimo': 'مقارنة بـ، عوضاً عن',
  'you ni mieru': 'يبدو كأنه، يظهر بمظهر',
};

// High-yield authentic N3/N4/N5 example sentences for all 56 official grammar points
const grammarExamplesMap = {
  '1': {
    example: 'テレビを見てばかりいると、目が悪くなりますよ。',
    exampleEn: 'If you do nothing but watch TV, your eyesight will get worse.',
    exampleAr: 'إذا واصلت مشاهدة التلفاز فقط، ستتأذى عيناك.',
  },
  '2': {
    example: '彼は文句を言うばかりで、自分では何もしない。',
    exampleEn: 'He does nothing but complain and does nothing himself.',
    exampleAr: 'إنه يكتفي بالشكوى فقط ولا يفعل أي شيء بنفسه.',
  },
  '3': {
    example: '彼は日本語ばかりでなく、英語も上手に話せる。',
    exampleEn: 'He can speak not only Japanese, but also English well.',
    exampleAr: 'لا يتحدث اليابانية فحسب، بل يتقن الإنجليزية أيضاً.',
  },
  '4': {
    example: '弟は一日中ゲームをしてばかりいる。',
    exampleEn: 'My younger brother is doing nothing but playing games all day.',
    exampleAr: 'يقضي أخي الأصغر اليوم بطوله يلعب ألعاب الفيديو فقط.',
  },
  '5': {
    example: '雨ばかりか、強い風まで吹いてきた。',
    exampleEn: 'Not only did it rain, but strong winds also began to blow.',
    exampleAr: 'لم تكتفِ السماء بالمطر، بل هبت رياح عاتية أيضاً.',
  },
  '6': {
    example: '困っている人がいたら、親切に助けるべきだ。',
    exampleEn: 'If someone is in trouble, you should kindly help them.',
    exampleAr: 'إذا كان شخص في ورطة، ينبغي عليك مساعدته بلطف.',
  },
  '7': {
    example: '約束した時間を破るべきではない。',
    exampleEn: 'You should not break an agreed-upon time.',
    exampleAr: 'لا ينبغي لك الإخلال بالموعد المحدد.',
  },
  '8': {
    example: 'この作文は間違いだらけで、書き直す必要がある。',
    exampleEn: 'This essay is full of mistakes and needs to be rewritten.',
    exampleAr: 'هذا التعبير مليء بالأخطاء ويحتاج إلى إعادة كتابة.',
  },
  '9': {
    example: '彼は聞こえないふりをして、返事をしなかった。',
    exampleEn: 'He pretended not to hear and did not reply.',
    exampleAr: 'تظاهر بأنه لم يسمع ولم يرد.',
  },
  '10': {
    example: '親しい友人が国へ帰ってしまうのは、信じがたい。',
    exampleEn: 'It is hard to believe that my close friend is returning to his home country.',
    exampleAr: 'يصعب علي تصديق أن صديقي المقرب سيعود إلى بلاده.',
  },
  '11': {
    example: '昨日は眠れないほど暑かった。',
    exampleEn: 'Yesterday was so hot that I couldn\'t sleep.',
    exampleAr: 'كان الجو بالأمس حاراً لدرجة أنني لم أستطع النوم.',
  },
  '12': {
    example: '父の代わりに、私が結婚式に出席しました。',
    exampleEn: 'Instead of my father, I attended the wedding ceremony.',
    exampleAr: 'حضرت حفل الزفاف نيابة عن والدي.',
  },
  '13': {
    example: '二人きりで静かに話をしたい。',
    exampleEn: 'I want to talk quietly with just the two of us.',
    exampleAr: 'أريد التحدث بهدوء ونحن الاثنان فقط.',
  },
  '14': {
    example: '明日の会議は何時からだっけ？',
    exampleEn: 'What time was tomorrow\'s meeting again?',
    exampleAr: 'كم كانت ساعة اجتماع الغد يا ترى؟',
  },
  '15': {
    example: '日本語が上手になりたいなら、毎日話すことだ。',
    exampleEn: 'If you want to become good at Japanese, you should speak every day.',
    exampleAr: 'إذا أردت إتقان اليابانية، فعليك بالتحدث يومياً.',
  },
  '16': {
    example: '合格の知らせを聞いて、どんなに喜んだことか！',
    exampleEn: 'How delighted I was upon hearing the news of passing!',
    exampleAr: 'كم فرحت كثيراً عندما سمعت خبر اجتيازي الامتحان!',
  },
  '17': {
    example: '来月から大阪の支店へ転勤することになった。',
    exampleEn: 'It has been decided that I will transfer to the Osaka branch next month.',
    exampleAr: 'تقرر أن أنتقل للعمل بفرع أوساكا ابتداءً من الشهر القادم.',
  },
  '18': {
    example: '健康のために、毎朝30分散歩することにした。',
    exampleEn: 'For my health, I decided to take a 30-minute walk every morning.',
    exampleAr: 'قررت أن أمشي 30 دقيقة كل صباح من أجل صحتي.',
  },
  '19': {
    example: '時間はまだ十分あるから、急ぐことはないよ。',
    exampleEn: 'There is still plenty of time, so there is no need to hurry.',
    exampleAr: 'ما زال هناك متسع كافٍ من الوقت، فلا داعي للاستعجال.',
  },
  '20': {
    example: '痛くて涙が出るくらいだった。',
    exampleEn: 'It was painful enough to bring tears to my eyes.',
    exampleAr: 'كان مؤلماً لدرجة أن الدموع كادت تنهمر من عيني.',
  },
  '21': {
    example: '知っているくせに、教えてくれない。',
    exampleEn: 'Even though he knows, he won\'t tell me.',
    exampleAr: 'على الرغم من أنه يعرف، إلا أنه يرفض إخباري.',
  },
  '22': {
    example: '靴をはいたまま、部屋に入らないでください。',
    exampleEn: 'Please do not enter the room while still wearing your shoes.',
    exampleAr: 'رجاءً لا تدخل الغرفة وأنت مرتدي حذاءك كما هو.',
  },
  '23': {
    example: 'だって、お腹が空いたんだもん。',
    exampleEn: 'Because, I\'m really hungry!',
    exampleAr: 'ذلك لأنني جائع جداً!',
  },
  '24': {
    example: '子どものころは、よく川で泳いだものだ。',
    exampleEn: 'When I was a child, I often used to swim in the river.',
    exampleAr: 'عندما كنت طفلاً، اعتدت كثيراً أن أسبح في النهر.',
  },
  '25': {
    example: 'この書類を社長に見てもらいたい。',
    exampleEn: 'I would like the president to look over this document.',
    exampleAr: 'أود أن يطّلع المدير على هذه الوثيقة.',
  },
  '26': {
    example: '狭い部屋ながらも、居心地はとてもいい。',
    exampleEn: 'Although it is a small room, it is very comfortable.',
    exampleAr: 'على الرغم من ضيق الغرفة، إلا أنها مريحة للغاية.',
  },
  '27': {
    example: '私なんか、まだまだ勉強が足りません。',
    exampleEn: 'Someone like me still has a long way to go with study.',
    exampleAr: 'شخص مثلي ما زال بحاجة إلى الكثير من الدراسة.',
  },
  '28': {
    example: '旅行に行けません。なぜなら、お金がないからです。',
    exampleEn: 'I cannot go on a trip. The reason is that I have no money.',
    exampleAr: 'لا أستطيع الذهاب في رحلة، والسبب هو عدم توفر المال.',
  },
  '29': {
    example: '田中さんは来月結婚するんだって。',
    exampleEn: 'I heard that Tanaka-san is getting married next month.',
    exampleAr: 'سمعت أن تاناكا سيتزوج في الشهر المقبل.',
  },
  '30': {
    example: '病気の先生にかわって、新しい先生が教えます。',
    exampleEn: 'In place of the sick teacher, a new teacher will teach.',
    exampleAr: 'نيابة عن المعلم المريض، سيقوم معلم جديد بالتدريس.',
  },
  '31': {
    example: '留学生にとって、日本の生活は新しい経験ばかりだ。',
    exampleEn: 'For international students, living in Japan is full of new experiences.',
    exampleAr: 'بالنسبة للطلاب الأجانب، الحياة في اليابان مليئة بالتجارب الجديدة.',
  },
  '32': {
    example: '先生のおかげで、無事にN3に合格できました。',
    exampleEn: 'Thanks to the teacher, I passed N3 safely.',
    exampleAr: 'بفضل الأستاذ، اجتزت امتحان N3 بنجاح.',
  },
  '33': {
    example: '電気をつけっぱなしで出かけてしまった。',
    exampleEn: 'I went out leaving the lights turned on.',
    exampleAr: 'خرجت وتركت الأضواء مضاءة دون إطفائها.',
  },
  '34': {
    example: '午後から雨が降るらしいよ。傘を持っていこう。',
    exampleEn: 'It seems it will rain from the afternoon. Let\'s take an umbrella.',
    exampleAr: 'يبدو أن المطر سيهطل بعد الظهر، فلنأخذ المظلة.',
  },
  '35': {
    example: '授業の最中に、突然携帯電話が鳴った。',
    exampleEn: 'In the middle of the class, the cell phone suddenly rang.',
    exampleAr: 'في منتصف الدرس، رنّ الهاتف المحمول فجأة.',
  },
  '36': {
    example: '寝坊したせいで、新幹線に乗り遅れた。',
    exampleEn: 'Because I overslept, I missed the Shinkansen.',
    exampleAr: 'بسبب الاستغراق في النوم، فاتتني رحلة القطار السريع.',
  },
  '37': {
    example: 'バスが来ないから、歩いて行くしかない。',
    exampleEn: 'Since the bus isn\'t coming, there is no choice but to walk.',
    exampleAr: 'بما أن الحافلة لا تأتي، فلا خيار سوى الذهاب مشياً.',
  },
  '38': {
    example: '毎日一生懸命練習した。その結果、試合に勝てた。',
    exampleEn: 'I practiced hard every day. As a result, we won the game.',
    exampleAr: 'تدربت باجتهاد يومياً، وكنتيجة لذلك فزنا في المباراة.',
  },
  '39': {
    example: '電車が事故で止まりました。そのため、遅刻しました。',
    exampleEn: 'The train stopped due to an accident. For that reason, I was late.',
    exampleAr: 'توقف القطار بسبب حادث، ولهذا السبب تأخرت.',
  },
  '40': {
    example: 'この写真を見るたびに、家族を思い出す。',
    exampleEn: 'Every time I look at this photo, I remember my family.',
    exampleAr: 'كلما نظرت إلى هذه الصورة، تذكرت عائلتي.',
  },
  '41': {
    example: '病気になってはじめて、健康のありがたさが分かった。',
    exampleEn: 'Only after getting sick did I realize the value of health.',
    exampleAr: 'لم أدرك قيمة الصحة إلا بعد أن أصابني المرض.',
  },
  '42': {
    example: 'ここで写真を撮ってもかまいませんか。',
    exampleEn: 'Do you mind if I take a photo here?',
    exampleAr: 'هل تمانع لو التقطت صورة هنا؟',
  },
  '43': {
    example: '日本の秋といえば、紅葉がとても美しい。',
    exampleEn: 'Speaking of autumn in Japan, the autumn leaves are very beautiful.',
    exampleAr: 'إن تحدثنا عن الخريف في اليابان، فإن أوراق الأشجار الملونة جميلة جداً.',
  },
  '44': {
    example: '「さくら」という喫茶店で会いましょう。',
    exampleEn: 'Let\'s meet at a coffee shop called "Sakura".',
    exampleAr: 'دعنا نلتقِ في مقهى يُدعى "ساكورا".',
  },
  '45': {
    example: '天気予報によると、明日は晴れるということだ。',
    exampleEn: 'According to the weather forecast, it is said that tomorrow will be sunny.',
    exampleAr: 'وفقاً للنشرة الجوية، يُقال إن الغد سيكون مشمساً.',
  },
  '46': {
    example: '京都というと、古いお寺がたくさんある街ですね。',
    exampleEn: 'Speaking of Kyoto, it\'s a city with many old temples, isn\'t it?',
    exampleAr: 'حين نذكر كيوتو، فإنها المدينة التي تضم الكثير من المعابد القديمة.',
  },
  '47': {
    example: 'もし明日雨だとすれば、ピクニックは中止です。',
    exampleEn: 'If we suppose that it rains tomorrow, the picnic will be cancelled.',
    exampleAr: 'إذا افترضنا أن الجو سيكون ماطراً غداً، فسنلغي النزهة.',
  },
  '48': {
    example: '先生が教えてくれたとおりに作ったら、上手にできた。',
    exampleEn: 'When I made it just as the teacher taught, it turned out well.',
    exampleAr: 'عندما صنعتها تماماً كما علمني الأستاذ، نجح الأمر بإتقان.',
  },
  '49': {
    example: '窓を開けたとたん、冷たい風が入ってきた。',
    exampleEn: 'The moment I opened the window, cold wind blew in.',
    exampleAr: 'ما إن فتحت النافذة، حتى دخلت رياح باردة.',
  },
  '50': {
    example: 'スーパーへ行くついでに、手紙を出してきてくれる？',
    exampleEn: 'While you\'re going to the supermarket, could you mail this letter on the way?',
    exampleAr: 'أثناء ذهابك إلى السوبرماركت، هل يمكنك إرسال هذه الرسالة في طريقك؟',
  },
  '51': {
    example: '彼は私の母の弟、つまり私の叔父にあたる人です。',
    exampleEn: 'He is my mother\'s younger brother, in other words, my uncle.',
    exampleAr: 'إنه شقيق والدتي الأصغر، أي أنه خالي.',
  },
  '52': {
    example: '宿題をするつもりだったが、寝てしまった。',
    exampleEn: 'I intended to do my homework, but I fell asleep.',
    exampleAr: 'كنت أنوي أداء واجبي المنزلي، لكني غفوت ونمت.',
  },
  '53': {
    example: '彼女は英語はもちろん、フランス語も話せます。',
    exampleEn: 'She can speak French, not to mention English.',
    exampleAr: 'إنها تتحدث الفرنسية، ناهيك عن الإنجليزية بالتأكيد.',
  },
  '54': {
    example: 'このレストランは値段のわりに、料理がとても美味しい。',
    exampleEn: 'Considering the price, this restaurant\'s food is very delicious.',
    exampleAr: 'مقارنة بالسعر، فإن أطباق هذا المطعم لذيذة للغاية.',
  },
  '55': {
    example: 'バスで行くよりも、電車で行くほうが早いです。',
    exampleEn: 'Rather than going by bus, going by train is faster.',
    exampleAr: 'الذهاب بالقطار أسرع بكثير من الذهاب بالحافلة.',
  },
  '56': {
    example: '彼は若く見えるけれど、実はもう40歳だ。',
    exampleEn: 'He looks young, but in fact he is already 40 years old.',
    exampleAr: 'يبدو شاباً في مظهره، لكنه في الواقع قد بلغ الأربعين عاماً.',
  },
};

for (const line of grammarLines) {
  if (!line.startsWith('|')) continue;
  const cols = line.split('|').slice(1, -1);
  if (cols.length >= 4) {
    const num = cols[0].replace(/[^\d]/g, '');
    const romaji = cols[1].replace(/<[^>]+>/g, ' ').trim();
    const pattern = cols[2].replace(/<[^>]+>/g, ' ').trim();
    const meaning = cols[3].replace(/<[^>]+>/g, ' ').trim();
    if (num && pattern && !line.includes('文法レッスン')) {
      const meaningAr = grammarArabicMap[romaji] || '';
      const eg = grammarExamplesMap[num] || {};
      allGrammar.push({
        id: `grammar-all-${num}`,
        expr: pattern,
        reading: romaji,
        meaningEn: meaning,
        meaningAr,
        example: eg.example || '',
        exampleEn: eg.exampleEn || '',
        exampleAr: eg.exampleAr || '',
        source: 'The-JLPT-N3-Grammar-List.md',
        subskill: 'Grammar',
        lapses: 0,
        intervalDays: 0,
        due: new Date().toISOString(),
        suspended: false,
        status: 'New',
      });
    }
  }
}

console.log(`Parsed ${allVocab.length} Vocab, ${allKanji.length} Kanji, ${allGrammar.length} Grammar.`);

// Generate TypeScript file content
const outputTs = `// AUTOGENERATED FROM WORKSPACE RESOURCE FILES:
// - JLPT-N3-Vocabulary-.md (${allVocab.length} items)
// - JLPT-N3-Kanji-List-PDF.md (${allKanji.length} items)
// - 450815793-The-JLPT-N3-Grammar-List.md (${allGrammar.length} items)

import { StudyItem } from '../types';

export const ALL_OFFICIAL_VOCABULARY: StudyItem[] = ${JSON.stringify(allVocab, null, 2)};

export const ALL_OFFICIAL_KANJI: StudyItem[] = ${JSON.stringify(allKanji, null, 2)};

export const ALL_OFFICIAL_GRAMMAR: StudyItem[] = ${JSON.stringify(allGrammar, null, 2)};

export const TOTAL_OFFICIAL_ITEMS_COUNT = ${allVocab.length + allKanji.length + allGrammar.length};
`;

fs.writeFileSync('src/data/allOfficialResources.ts', outputTs);
console.log('Successfully wrote src/data/allOfficialResources.ts');
