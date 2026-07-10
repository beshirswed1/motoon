/**
 * تصنيفات العلوم الشرعية وفروعها — مستويين فقط
 * يُستخدم في التصفية وإضافة المتون من لوحة الأدمن
 */

export interface SubCategory {
  id: string;
  label: string;
}

export interface MainCategory {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  color: string; // tailwind color class
  subcategories: SubCategory[];
}

export const CATEGORIES: MainCategory[] = [
  {
    id: 'quran-sciences',
    label: 'علوم القرآن',
    icon: 'BookOpen',
    color: 'text-emerald-600 bg-emerald-500/10',
    subcategories: [
      { id: 'tafsir', label: 'التفسير' },
      { id: 'ulum-quran', label: 'علوم القرآن (عام)' },
      { id: 'qiraat', label: 'القراءات' },
      { id: 'tajweed', label: 'التجويد' },
      { id: 'rasm', label: 'رسم المصحف وضبطه' },
    ],
  },
  {
    id: 'hadith-sciences',
    label: 'علوم الحديث',
    icon: 'ScrollText',
    color: 'text-amber-600 bg-amber-500/10',
    subcategories: [
      { id: 'hadith-riwaya', label: 'علم الحديث رواية' },
      { id: 'mustalah', label: 'مصطلح الحديث (علم الحديث دراية)' },
      { id: 'ilm-rijal', label: 'علم الرجال (الجرح والتعديل)' },
      { id: 'takhrij', label: 'تخريج الحديث' },
      { id: 'shuruh-hadith', label: 'شروح الحديث' },
    ],
  },
  {
    id: 'aqeedah',
    label: 'العقيدة',
    icon: 'Shield',
    color: 'text-sky-600 bg-sky-500/10',
    subcategories: [
      { id: 'tawheed', label: 'العقيدة / التوحيد' },
      { id: 'ilm-kalam', label: 'علم الكلام' },
      { id: 'firaq', label: 'الفرق والملل والنحل' },
      { id: 'asma-sifat', label: 'الأسماء والصفات' },
    ],
  },
  {
    id: 'fiqh',
    label: 'الفقه وأصوله',
    icon: 'Scale',
    color: 'text-violet-600 bg-violet-500/10',
    subcategories: [
      { id: 'fiqh-general', label: 'الفقه العام / المقارن' },
      { id: 'fiqh-hanafi', label: 'الفقه الحنفي' },
      { id: 'fiqh-maliki', label: 'الفقه المالكي' },
      { id: 'fiqh-shafii', label: 'الفقه الشافعي' },
      { id: 'fiqh-hanbali', label: 'الفقه الحنبلي' },
      { id: 'usul-fiqh', label: 'أصول الفقه' },
      { id: 'qawaid-fiqhiyya', label: 'القواعد الفقهية' },
      { id: 'faraid', label: 'الفرائض (المواريث)' },
    ],
  },
  {
    id: 'arabic-language',
    label: 'اللغة العربية',
    icon: 'Languages',
    color: 'text-rose-600 bg-rose-500/10',
    subcategories: [
      { id: 'nahw', label: 'النحو' },
      { id: 'sarf', label: 'الصرف' },
      { id: 'balagha', label: 'البلاغة' },
      { id: 'arud', label: 'العروض والقوافي' },
      { id: 'fiqh-lugha', label: 'فقه اللغة والمعاجم' },
      { id: 'adab', label: 'الأدب العربي' },
    ],
  },
  {
    id: 'seerah-tarikh',
    label: 'السيرة والتاريخ الإسلامي',
    icon: 'Landmark',
    color: 'text-teal-600 bg-teal-500/10',
    subcategories: [
      { id: 'seerah', label: 'السيرة النبوية' },
      { id: 'tarikh', label: 'التاريخ الإسلامي' },
      { id: 'tarajim', label: 'التراجم والطبقات' },
    ],
  },
  {
    id: 'akhlaq-tazkiya',
    label: 'الأخلاق والتزكية',
    icon: 'Heart',
    color: 'text-pink-600 bg-pink-500/10',
    subcategories: [
      { id: 'akhlaq', label: 'الأخلاق والآداب' },
      { id: 'tazkiya', label: 'التزكية والسلوك' },
      { id: 'tasawwuf', label: 'التصوف' },
    ],
  },
  {
    id: 'dawah',
    label: 'الدعوة والثقافة الإسلامية',
    icon: 'Megaphone',
    color: 'text-indigo-600 bg-indigo-500/10',
    subcategories: [
      { id: 'dawah-usul', label: 'الدعوة وأصولها' },
      { id: 'thaqafa', label: 'الثقافة الإسلامية العامة' },
      { id: 'muqaranat-adyan', label: 'مقارنة الأديان' },
    ],
  },
  {
    id: 'mantiq',
    label: 'المنطق وآداب البحث',
    icon: 'Brain',
    color: 'text-orange-600 bg-orange-500/10',
    subcategories: [
      { id: 'mantiq', label: 'المنطق' },
      { id: 'adab-bahth', label: 'آداب البحث والمناظرة' },
    ],
  },
];

/** Flat lookup: id → label */
export function getCategoryLabel(categoryId: string): string {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat?.label ?? categoryId;
}

export function getSubcategoryLabel(categoryId: string, subcategoryId: string): string {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  const sub = cat?.subcategories.find(s => s.id === subcategoryId);
  return sub?.label ?? subcategoryId;
}

/** Get all subcategory ids for a main category */
export function getSubcategoryIds(categoryId: string): string[] {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat?.subcategories.map(s => s.id) ?? [];
}
