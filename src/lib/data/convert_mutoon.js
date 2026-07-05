const fs = require('fs');
const path = require('path');

// Helper to generate unique-ish ID
function genId() {
  return Math.random().toString(36).substring(2, 10);
}

// Remove diacritics for normalizedText
function removeDiacritics(text) {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Arabic diacritics + tatweel
    .replace(/\s+/g, ' ')
    .trim();
}

const timestamp = "2026-07-01T19:25:57Z";

// =========== AL AJRUMIYYAH (نظم الآجرومية) ===========
function parseAlAjrumiyyah() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_ajrumiyyah.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Skip the first few description lines, start from actual verses (line 17 onward has the verses)
  const verses = [];
  let order = 0;
  
  // The actual verses start with Arabic poetry patterns (contain ✽ or are part of sections)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip pure section headers and description text
    if (line.startsWith('الآجُرُّومِيَّة') || 
        line.startsWith('اعتُمد') ||
        line.startsWith('المؤلف') ||
        line.startsWith('الموضوع') ||
        line.startsWith('المقدمة') ||
        line.startsWith('﷽') ||
        line.length < 10) continue;
    
    // Check if this is a section header (باب)
    if (line.startsWith('بَابُ') || line.startsWith('بَابَ') || 
        line === 'مقدمة' || line === 'خَاتِمَةٌ' ||
        line.startsWith('المرفوعات') || line.startsWith('التَّوَابِعُ') ||
        line.startsWith('المَنْصُوبَاتُ') || line.startsWith('المَخْفُوضَاتُ') ||
        line.startsWith('المَعْرِفَةُ')) continue;

    // This is a verse line
    order++;
    const bookId = 'book_al_ajrumiyyah';
    verses.push({
      id: `${bookId}_v_${order}_${genId()}`,
      bookId,
      text: line,
      normalizedText: removeDiacritics(line),
      order,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return {
    id: 'book_al_ajrumiyyah',
    title: 'نظم الآجرومية',
    author: 'محمد بن آجروم',
    description: 'الآجُرُّومِيَّة كتاب في علم النحو ألفه ابن آجرّوم، يُعد من أهم متون النحو العربي. بدأه بالكلام عن الكلام وأنواعه وتسلسل مع المواضيع بأسلوب سهل المنال للطالبين.',
    coverImageUrl: '',
    difficulty: 'beginner',
    slug: 'al-ajrumiyyah',
    status: 'published',
    tags: ['نحو', 'لغة عربية', 'مبتدئ'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== AL BAYQUNIYYAH (البيقونية) ===========
function parseAlBayquniyyah() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_bayquniyyah.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // The bayquniyyah file has each word/fragment on separate lines, grouped by verse
  // We need to reconstruct the verses by joining word fragments
  const bookId = 'book_al_bayquniyyah';
  
  // Manual parsing - verses are separated by verse numbers (٢-, ٣-, etc.)
  // or by the pattern of having ... between hemistich halves
  const fullText = lines.slice(5).join(' '); // Skip header lines
  
  // The format has: number-word word ... word word
  // Split on verse number patterns
  const verseTexts = [];
  let currentVerse = '';
  
  for (let i = 5; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line === 'َ' || line === 'ْ' || line === 'ِ') continue;
    
    // Check if line starts with a verse number
    const numMatch = line.match(/^[٠-٩]+-|^[٠-٩]+\s*-/);
    if (numMatch) {
      if (currentVerse.trim()) {
        verseTexts.push(currentVerse.trim());
      }
      currentVerse = line;
    } else if (line === '...') {
      currentVerse += ' ... ';
    } else {
      currentVerse += ' ' + line;
    }
  }
  if (currentVerse.trim()) {
    verseTexts.push(currentVerse.trim());
  }

  // First verse doesn't have a number prefix (أَبــْدَأُ بِالحَمْـــــدِ...)
  // Build verses from the reconstructed text
  // Actually, let's use the already-correct bayquniyyah.json we have
  // Skip this and use existing
  return null; // Already exists
}


// =========== AL JAZARIYYAH (الجزرية) ===========
function parseAlJazariyyah() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_jazariyyah.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_al_jazariyyah';
  const verses = [];
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match verse lines: start with number followed by dash
    const match = line.match(/^\d+\s*-\s*(.*)/);
    if (match) {
      order++;
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (text.length > 5) {
        verses.push({
          id: `${bookId}_v_${order}_${genId()}`,
          bookId,
          text,
          normalizedText: removeDiacritics(text),
          order,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }

  return {
    id: bookId,
    title: 'المقدمة الجزرية',
    author: 'محمد بن محمد بن الجزري',
    description: 'المقدمة الجزرية في تجويد القرآن الكريم، منظومة شعرية رصينة تتألق من 107 أبيات، يلخص فيها الناظم مخارج الحروف وصفاتها وأحكام الوقف والابتداء.',
    coverImageUrl: '',
    difficulty: 'beginner',
    slug: 'al-jazariyyah',
    status: 'published',
    tags: ['تجويد', 'قرآن', 'قراءات'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== AL DURRAH AL MUDIYYAH (الدرة المضية - السفارينية) ===========
function parseAlDurrahAlMudiyyah() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_durrah_al_mudiyyah.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_al_durrah_al_mudiyyah';
  const verses = [];
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines starting with ( and containing verse text
    // Format: (verse text)  or  number - (verse text)
    const match = line.match(/^\d+\s*-\s*\((.*)\)\s*$/) || line.match(/^\((.*)\)\s*$/);
    if (match) {
      order++;
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (text.length > 5) {
        verses.push({
          id: `${bookId}_v_${order}_${genId()}`,
          bookId,
          text,
          normalizedText: removeDiacritics(text),
          order,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }

  return {
    id: bookId,
    title: 'الدرة المضية (العقيدة السفارينية)',
    author: 'محمد بن أحمد السفاريني',
    description: 'العقيدة السفارينية المسماة الدرة المضية في عقد أهل الفرقة المرضية، منظومة في العقيدة الإسلامية جامعة لجل مسائل الاعتقاد من التوحيد والصفات والقدر والنبوة والمعاد.',
    coverImageUrl: '',
    difficulty: 'intermediate',
    slug: 'al-durrah-al-mudiyyah',
    status: 'published',
    tags: ['عقيدة', 'توحيد', 'متوسط'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== ALFIYYAT IBN MALIK (ألفية ابن مالك) ===========
function parseAlfiyyatIbnMalik() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/alfiyyat_ibn_malik.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_alfiyyat_ibn_malik';
  const verses = [];
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip forum metadata, headers, and noise
    if (line.startsWith('يتبع') || line.startsWith('أعجبني') || 
        line.startsWith('الرجوع') || line.startsWith('دمعة') ||
        line.startsWith('مشرف') || line.startsWith('سجلت') ||
        line.startsWith('مساهمات') || line.startsWith('العمر') ||
        line.startsWith('الموقع') || line.startsWith('ألفية ابن مالك كاملة') ||
        line.startsWith('مُساهمة') || line.startsWith('محتوى إعلاني') ||
        line.match(/^\d{4}\s*\d+:\s*\d+/) || // timestamps  
        line.startsWith('2010') ||
        line.length < 5) continue;
    
    // Match verse lines: number) text
    const match = line.match(/^\d+\)\s*(.*)/);
    if (match) {
      order++;
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (text.length > 5) {
        verses.push({
          id: `${bookId}_v_${order}_${genId()}`,
          bookId,
          text,
          normalizedText: removeDiacritics(text),
          order,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }

  return {
    id: bookId,
    title: 'ألفية ابن مالك',
    author: 'ابن مالك',
    description: 'ألفية ابن مالك، متن يضم غالب قواعد النحو والصرف العربي في ألف بيت من الشعر. وهي من أشهر المنظومات النحوية وأكثرها تداولاً بين طلاب العلم.',
    coverImageUrl: '',
    difficulty: 'advanced',
    slug: 'alfiyyat-ibn-malik',
    status: 'published',
    tags: ['نحو', 'صرف', 'لغة عربية', 'متقدم'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== MULHAT AL IRAB (ملحة الإعراب) ===========
function parseMulhatAlIrab() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/mulhat_al_irab.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_mulhat_al_irab';
  const verses = [];
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers and section titles
    if (line.startsWith('ملحة') || line.startsWith('لأبي') ||
        line.startsWith('متن') || line.startsWith('تأليف') ||
        line.startsWith('التصنيف') || line.startsWith('الهدف') ||
        line.startsWith('بسم الله') || line.startsWith('أبو محمد') ||
        line.startsWith('باب') || line.startsWith('بابُ') ||
        line.startsWith('فصل') || line.startsWith('هذا') ||
        line.length < 10) continue;
    
    // Verse lines contain Arabic poetry (two hemistichs separated by spaces)
    // They typically have diacritics and are substantial text
    if (line.match(/[\u064B-\u0652]/) && line.length > 20) {
      order++;
      const text = line.replace(/\s+/g, ' ').trim();
      verses.push({
        id: `${bookId}_v_${order}_${genId()}`,
        bookId,
        text,
        normalizedText: removeDiacritics(text),
        order,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  }

  return {
    id: bookId,
    title: 'ملحة الإعراب',
    author: 'أبو محمد القاسم بن علي الحريري',
    description: 'ملحة الإعراب، منظومة شعرية في النحو والإعراب نظمها الحريري البصري، تهدف لتسهيل حفظ وفهم قواعد الإعراب للمبتدئين وطلاب العلم.',
    coverImageUrl: '',
    difficulty: 'intermediate',
    slug: 'mulhat-al-irab',
    status: 'published',
    tags: ['نحو', 'إعراب', 'لغة عربية', 'متوسط'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== AL SHATIBIYYAH (الشاطبية) ===========
function parseAlShatibiyyah() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_shatibiyyah.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_al_shatibiyyah';
  const verses = [];
  let order = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers
    if (line.startsWith('الشاطبية') || line.startsWith('متن') ||
        line.startsWith('المؤلف') || line.startsWith('الموضوع') ||
        line.length < 15) continue;
    
    // Match verse lines: number - text ... text
    const match = line.match(/^\d+\s*-\s*(.*)/);
    if (match) {
      order++;
      const text = match[1].replace(/\s+/g, ' ').trim();
      if (text.length > 10) {
        verses.push({
          id: `${bookId}_v_${order}_${genId()}`,
          bookId,
          text,
          normalizedText: removeDiacritics(text),
          order,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    } else if (!line.match(/^\d/) && line.match(/[\u064B-\u0652]/) && line.length > 30 && line.includes('...')) {
      // First verse doesn't have a number
      order++;
      const text = line.replace(/\s+/g, ' ').trim();
      verses.push({
        id: `${bookId}_v_${order}_${genId()}`,
        bookId,
        text,
        normalizedText: removeDiacritics(text),
        order,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
  }

  return {
    id: bookId,
    title: 'الشاطبية (حرز الأماني)',
    author: 'الإمام الشاطبي',
    description: 'حرز الأماني ووجه التهاني في القراءات السبع، منظومة للإمام القاسم بن فيرة الشاطبي في علم القراءات، تتكون من 1173 بيتاً نظم فيها القراءات السبع المتواترة.',
    coverImageUrl: '',
    difficulty: 'advanced',
    slug: 'al-shatibiyyah',
    status: 'published',
    tags: ['قراءات', 'قرآن', 'متقدم'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== AL ZUBAD (الزبد) ===========
function parseAlZubad() {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/al_zubad.json'), 'utf-8');
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const bookId = 'book_al_zubad';
  const verses = [];
  let order = 0;
  
  // Al Zubad verses have format: ١-text (Arabic numerals with dash)
  // or just pairs of lines (sadr/ajez)
  let currentVerse = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers
    if (line.startsWith('الزبد') || line.startsWith('"متن') ||
        line.startsWith('متن') || line.startsWith('للإمام') ||
        line.startsWith('المقدمة') || line.startsWith('بسم الله') ||
        line.length < 3) continue;
    
    // Match verse number patterns like ١- or ٢- etc
    const arabicNumMatch = line.match(/^[٠-٩]+-/);
    if (arabicNumMatch) {
      if (currentVerse.trim() && currentVerse.trim().length > 5) {
        order++;
        const text = currentVerse.replace(/\s+/g, ' ').trim();
        verses.push({
          id: `${bookId}_v_${order}_${genId()}`,
          bookId,
          text,
          normalizedText: removeDiacritics(text),
          order,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      currentVerse = line;
    } else if (line.match(/[\u0600-\u06FF]/) && line.length > 3) {
      // This is a continuation or second hemistich  
      currentVerse += ' ' + line;
    }
  }
  // Last verse
  if (currentVerse.trim() && currentVerse.trim().length > 5) {
    order++;
    const text = currentVerse.replace(/\s+/g, ' ').trim();
    verses.push({
      id: `${bookId}_v_${order}_${genId()}`,
      bookId,
      text,
      normalizedText: removeDiacritics(text),
      order,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  return {
    id: bookId,
    title: 'صفوة الزبد',
    author: 'أحمد بن حسين بن رسلان',
    description: 'متن الزبد (صفوة الزبد) منظومة فقهية في المذهب الشافعي نظمها الإمام أحمد بن رسلان، تحتوي على نحو 1088 بيتاً تشمل أبواباً في أصول الدين وفقه العبادات والمعاملات.',
    coverImageUrl: '',
    difficulty: 'intermediate',
    slug: 'al-zubad',
    status: 'published',
    tags: ['فقه', 'شافعي', 'متوسط'],
    verses,
    isPublished: true,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// =========== MAIN ===========
const outputDir = path.join(__dirname, 'books');

const parsers = [
  { name: 'al_ajrumiyyah', fn: parseAlAjrumiyyah },
  { name: 'al_jazariyyah', fn: parseAlJazariyyah },
  { name: 'al_durrah_al_mudiyyah', fn: parseAlDurrahAlMudiyyah },
  { name: 'alfiyyat_ibn_malik', fn: parseAlfiyyatIbnMalik },
  { name: 'mulhat_al_irab', fn: parseMulhatAlIrab },
  { name: 'al_shatibiyyah', fn: parseAlShatibiyyah },
  { name: 'al_zubad', fn: parseAlZubad },
];

for (const { name, fn } of parsers) {
  try {
    const data = fn();
    if (data) {
      const outPath = path.join(outputDir, `${name}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ ${name}: ${data.verses.length} verses written to ${outPath}`);
    } else {
      console.log(`⏭️  ${name}: skipped (already exists)`);
    }
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
  }
}

console.log('\nDone!');
