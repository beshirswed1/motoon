/**
 * ═══════════════════════════════════════════════════════════════
 * Authors Data Layer — Information for all scholars in Motoon
 * ═══════════════════════════════════════════════════════════════
 */

export interface Author {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  bio: string;
  era: string; // e.g. "672 هـ"
  deathYear?: number; // Hijri year integer
  sciences: string[];
  bookSlugs: string[];
}

export const AUTHORS: Author[] = [
  {
    id: 'ibn-malik',
    slug: 'ibn-malik',
    name: 'محمد بن عبد الله بن مالك الأندلسي الطائي',
    shortName: 'ابن مالك',
    bio: 'أبو عبد الله جمال الدين محمد بن عبد الله بن مالك الطائي الجياني (600 هـ - 672 هـ)، نحوي ولغوي وأحد أعظم أئمة النحو واللغة في التاريخ الإسلامي. صاحب "الخلاصة" الملقبة بـ "ألفية ابن مالك".',
    era: '672 هـ / 1274 م',
    deathYear: 672,
    sciences: ['arabic-language'],
    bookSlugs: ['alfiyyat-ibn-malik'],
  },
  {
    id: 'ibn-ajurrum',
    slug: 'ibn-ajurrum',
    name: 'أبو عبد الله محمد بن محمد بن داود الصنهاجي (ابن آجروم)',
    shortName: 'ابن آجروم',
    bio: 'محمد بن محمد بن داود الصنهاجي، أبو عبد الله (672 هـ - 723 هـ)، فقيه ونحوي مغربي من أهل فاس. اشتهر بمقدمته النحوية المعروفة بـ "الآجرومية" التي تعد من أهم متون النحو العربي.',
    era: '723 هـ / 1323 م',
    deathYear: 723,
    sciences: ['arabic-language'],
    bookSlugs: ['al-ajrumiyyah'],
  },
  {
    id: 'al-nawawi',
    slug: 'al-nawawi',
    name: 'أبو زكريا يحيى بن شرف النووي',
    shortName: 'الإمام النووي',
    bio: 'محيي الدين أبو زكريا يحيى بن شرف الحزامي النووي الشافعي (631 هـ - 676 هـ)، مُحدِّث وفقيه شافعي كبير، صاحب التصانيف الشهيرة كـ "الأربعين النووية" و "رياض الصالحين" و "منهاج الطالبين".',
    era: '676 هـ / 1277 م',
    deathYear: 676,
    sciences: ['hadith-sciences', 'fiqh'],
    bookSlugs: ['al_arbaeen_al_nawawiyyah'],
  },
  {
    id: 'al-tahawi',
    slug: 'al-tahawi',
    name: 'أبو جعفر أحمد بن محمد الطحاوي',
    shortName: 'الإمام الطحاوي',
    bio: 'أبو جعفر أحمد بن محمد بن سلامة الأزدي الحجري المصري المعروف بالطحاوي (239 هـ - 321 هـ)، إمام الحنفية في عصره ومحدث مصر الكبير، صاحب "العقيدة الطحاوية".',
    era: '321 هـ / 933 م',
    deathYear: 321,
    sciences: ['aqeedah', 'fiqh'],
    bookSlugs: ['al_aqeedah_al_tahawiyyah'],
  },
  {
    id: 'ibn-taymiyyah',
    slug: 'ibn-taymiyyah',
    name: 'تقي الدين أبو العباس أحمد بن عبد الحليم بن تيمية',
    shortName: 'شيخ الإسلام ابن تيمية',
    bio: 'تقي الدين أبو العباس أحمد بن عبد الحليم بن عبد السلام الحراني (661 هـ - 728 هـ)، فقيه ومحدث ومفسر وفيلسوف إسلامي مجدد، صاحب "العقيدة الواسطية" و "مجموع الفتاوى".',
    era: '728 هـ / 1328 م',
    deathYear: 728,
    sciences: ['aqeedah', 'fiqh', 'hadith-sciences'],
    bookSlugs: ['al_aqeedah_al_wasitiyyah'],
  },
  {
    id: 'ibn-al-jazari',
    slug: 'ibn-al-jazari',
    name: 'شمس الدين أبو الخير محمد بن محمد بن الجزري',
    shortName: 'ابن الجزري',
    bio: 'أبو الخير شمس الدين محمد بن محمد بن يوسف الجزري (751 هـ - 833 هـ)، شيخ القراء وإمام مقرئي عصره، صاحب "المقدمة فيما على قارئ القرآن أن يعلمه" (المقدمة الجزرية).',
    era: '833 هـ / 1429 م',
    deathYear: 833,
    sciences: ['quran-sciences', 'hadith-sciences'],
    bookSlugs: ['al-jazariyyah', 'al_hidayah_fi_ilm_al_riwayah'],
  },
  {
    id: 'al-suyuti',
    slug: 'al-suyuti',
    name: 'جلال الدين عبد الرحمن بن أبي بكر السيوطي',
    shortName: 'جلال الدين السيوطي',
    bio: 'جلال الدين عبد الرحمن بن أبي بكر بن محمد السيوطي (849 هـ - 911 هـ)، إمام حافظ ومؤرخ وأديب، من كبار علماء المسلمين وأكثرهم تصنيفاً في التفسير والحديث والنحو والفقه.',
    era: '911 هـ / 1505 م',
    deathYear: 911,
    sciences: ['arabic-language', 'hadith-sciences', 'quran-sciences', 'fiqh'],
    bookSlugs: ['al_kawkab_al_sati'],
  },
  {
    id: 'al-akhdari',
    slug: 'al-akhdari',
    name: 'أبو زيد عبد الرحمن بن محمد الأخضري',
    shortName: 'عبد الرحمن الأخضري',
    bio: 'عبد الرحمن بن محمد الصغير الأخضري المالكي (920 هـ - 953 هـ)، عالم وعلامة جزائري تصدر للتأليف في البلاغة والمنطق والفقه صاحب "السلم المنورق" و "الجوهر المكنون".',
    era: '953 هـ / 1546 م',
    deathYear: 953,
    sciences: ['arabic-language', 'mantiq', 'fiqh'],
    bookSlugs: ['al_jawhar_al_maknun', 'al_sullam_al_munawraq'],
  },
  {
    id: 'al-bayquni',
    slug: 'al-bayquni',
    name: 'عمر بن محمد بن فتوح البيقوني الدمشقي',
    shortName: 'عمر البيقوني',
    bio: 'عمر (أو طه) بن محمد بن فتوح البيقوني الشافعي (توفي نحو 1080 هـ)، عالم ومحدث دمشقي، صاحب المنظومة الشهيرة في علم مصطلح الحديث المعروفة بـ "المنظومة البيقونية".',
    era: '1080 هـ / 1669 م',
    deathYear: 1080,
    sciences: ['hadith-sciences'],
    bookSlugs: ['bayquniyyah'],
  },
  {
    id: 'al-jamzuri',
    slug: 'al-jamzuri',
    name: 'سليمان بن حسين بن محمد الجمزوري',
    shortName: 'سليمان الجمزوري',
    bio: 'سليمان بن حسين بن محمد الجمزوري الشهير بالأفندي (توفي بعد 1208 هـ)، مقرىء مصري شهير صاحب المنظومة الذهبية في أحكام التجويد الملقبة بـ "تحفة الأطفال والغلمان".',
    era: '1208 هـ / 1793 م',
    deathYear: 1208,
    sciences: ['quran-sciences'],
    bookSlugs: ['tuhfat-al-atfal'],
  },
  {
    id: 'al-shatibi',
    slug: 'al-shatibi',
    name: 'أبو القاسم القاسم بن فيرُّه بن خلف الشاطبي',
    shortName: 'الإمام الشاطبي',
    bio: 'أبو محمد وأبو القاسم القاسم بن فيرُّه الشاطبي الأندلسي (538 هـ - 590 هـ)، إمام القراء ومبتكر نظم القراءات السبع في منظومته الحرز الأماني ووجه التهاني (الشاطبية).',
    era: '590 هـ / 1194 م',
    deathYear: 590,
    sciences: ['quran-sciences'],
    bookSlugs: ['al-shatibiyyah'],
  },
  {
    id: 'al-juwayni',
    slug: 'al-juwayni',
    name: 'عبد الملك بن عبد الله بن يوسف الجويني (إمام الحرمين)',
    shortName: 'إمام الحرمين الجويني',
    bio: 'أبو المعالي عبد الملك بن عبد الله بن يوسف الجويني النيسابوري (419 هـ - 478 هـ)، الملقب بـ "إمام الحرمين"، فقيه شافعي وأصولي ومتكلم بارز صاحب كتاب "الورقات" في أصول الفقه.',
    era: '478 هـ / 1085 م',
    deathYear: 478,
    sciences: ['fiqh'],
    bookSlugs: ['al_waraqat'],
  },
  {
    id: 'ibn-abdul-wahhab',
    slug: 'ibn-abdul-wahhab',
    name: 'محمد بن عبد الوهاب بن سليمان التميمي',
    shortName: 'محمد بن عبد الوهاب',
    bio: 'محمد بن عبد الوهاب بن سليمان التميمي (1115 هـ - 1206 هـ)، عالم ومجدد ديني صاحب المتون العقائدية الشهيرة مثل "ثلاثة الأصول" و "القواعد الأربع" و "كتاب التوحيد".',
    era: '1206 هـ / 1792 م',
    deathYear: 1206,
    sciences: ['aqeedah'],
    bookSlugs: ['al_qawaid_al_arba', 'al_usul_al_thalathah'],
  },
  {
    id: 'al-rahbi',
    slug: 'al-rahbi',
    name: 'أبو عبد الله محمد بن علي بن محمد الرحبي',
    shortName: 'محمد الرحبي',
    bio: 'موفق الدين أبو عبد الله محمد بن علي الرحبي الشافعي المعروف بالابن المتقنة (497 هـ - 577 هـ)، عالم بالفرائض والنحو، صاحب منظومة "بغية الباحث عن جمل الموارث" (الرحبية).',
    era: '577 هـ / 1182 م',
    deathYear: 577,
    sciences: ['fiqh'],
    bookSlugs: ['al_rahbiyyah'],
  },
  {
    id: 'al-hafiz-al-hakami',
    slug: 'al-hafiz-al-hakami',
    name: 'حافظ بن أحمد بن علي الحكمي',
    shortName: 'حافظ الحكمي',
    bio: 'حافظ بن أحمد بن علي الحكمي (1342 هـ - 1377 هـ)، عالم ومؤلف سعودي بارز ونادرة عصره وحافظ زمانه، صاحب منظومات علمية جليلة كـ "سلم الوصول" و "الميمية" و "اللؤلؤ المكنون".',
    era: '1377 هـ / 1958 م',
    deathYear: 1377,
    sciences: ['aqeedah', 'hadith-sciences', 'akhlaq-tazkiya'],
    bookSlugs: ['al_lulu_al_maknun', 'al_manzumat_al_mimiyyah'],
  },
  {
    id: 'al-safarini',
    slug: 'al-safarini',
    name: 'محمد بن أحمد بن سالم السفاريني',
    shortName: 'محمد السفاريني',
    bio: 'شمس الدين أبو العون محمد بن أحمد بن سالم السفاريني النابلسي الحنبلي (1114 هـ - 1188 هـ)، فقيه وأصولي ومحدث ومؤرخ حنبلي، صاحب "الدرة المضية في عقد الفرقة المرضية".',
    era: '1188 هـ / 1774 م',
    deathYear: 1188,
    sciences: ['aqeedah'],
    bookSlugs: ['al-durrah-al-mudiyyah'],
  },
  {
    id: 'al-zamzami',
    slug: 'al-zamzami',
    name: 'عبد العزيز بن عبد الواحد الزمزمي',
    shortName: 'عبد العزيز الزمزمي',
    bio: 'عبد العزيز بن عبد الواحد الزمزمي المكّي (900 هـ - 976 هـ)، عالم ومفسر وأديب شافعي مكّي، صاحب منظومة التفسير "منظومة الزمزمي".',
    era: '976 هـ / 1569 م',
    deathYear: 976,
    sciences: ['quran-sciences'],
    bookSlugs: ['al_zamzamiyyah_tafsir'],
  },
  {
    id: 'al-hariri',
    slug: 'al-hariri',
    name: 'أبو محمد القاسم بن علي الحريري',
    shortName: 'القاسم الحريري',
    bio: 'أبو محمد القاسم بن علي بن محمد البصري الحريري (446 هـ - 516 هـ)، أديب وشاعر ونحوي بصري كبير، صاحب "مقامات الحريري" ومنظومة "ملحة الإعراب".',
    era: '516 هـ / 1122 م',
    deathYear: 516,
    sciences: ['arabic-language'],
    bookSlugs: ['mulhat-al-irab'],
  },
  {
    id: 'ibn-ruslan',
    slug: 'ibn-ruslan',
    name: 'شهاب الدين أحمد بن حسين بن رسلان الرملي',
    shortName: 'ابن رسلان',
    bio: 'شهاب الدين أبو العباس أحمد بن حسين بن رسلان الشافعي (773 هـ - 844 هـ)، فقيه ومحدث صوفي شافعي مقدسي، صاحب منظومة "صفوة الزبد" في الفقه الشافعي.',
    era: '844 هـ / 1440 م',
    deathYear: 844,
    sciences: ['fiqh'],
    bookSlugs: ['al-zubad'],
  },
];

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function getAuthorByName(name: string): Author | undefined {
  if (!name) return undefined;
  const clean = name.trim();
  return AUTHORS.find(
    (a) => a.name.includes(clean) || clean.includes(a.shortName) || a.shortName.includes(clean)
  );
}

export function getAllAuthors(): Author[] {
  return AUTHORS;
}
