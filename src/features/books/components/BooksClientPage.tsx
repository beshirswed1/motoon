'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookCard } from '@/components/common/BookCard';
import { CATEGORIES } from '@/lib/constants/categories';
import { arabicSearchMatch } from '@/lib/utils/arabicNormalize';
import {
  Search, LayoutGrid, List, X, SlidersHorizontal,
  BookOpen, WifiOff, ChevronDown, Check,
  BookOpenCheck, Shield, ScrollText, Scale, Languages, Landmark, Heart, Megaphone, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BooksClientPageProps {
  allBooks: any[];
  initialCategory?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  'quran-sciences': BookOpenCheck,
  'hadith-sciences': ScrollText,
  'aqeedah': Shield,
  'fiqh': Scale,
  'arabic-language': Languages,
  'seerah-tarikh': Landmark,
  'akhlaq-tazkiya': Heart,
  'dawah': Megaphone,
  'mantiq': Brain,
};

export function BooksClientPage({ allBooks, initialCategory }: BooksClientPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('motoon-view-mode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Custom Dropdown Open States
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'subcategory' | 'difficulty' | 'sort' | null>(null);
  
  // Client state for books, fallback to offline cache if empty
  const [booksList, setBooksList] = useState<any[]>(allBooks);

  // Load and cache books
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (allBooks && allBooks.length > 0) {
      setBooksList(allBooks);
      try {
        localStorage.setItem('motoon-cached-books', JSON.stringify(allBooks));
      } catch (e) {
        console.error('Failed to cache books locally:', e);
      }
    } else {
      // Try to load from cache
      try {
        const cached = localStorage.getItem('motoon-cached-books');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.length > 0) {
            setBooksList(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load cached books:', e);
      }
    }
  }, [allBooks]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdown && !(e.target as HTMLElement).closest('.custom-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeDropdown]);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('motoon-view-mode', viewMode);
  }, [viewMode]);

  // Offline detection
  useEffect(() => {
    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);



  // Get subcategories for selected category
  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    return cat?.subcategories || [];
  }, [selectedCategory]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  // Deduplicated books
  const uniqueBooks = useMemo(() => {
    const uniqueMap = new Map<string, any>();
    for (const book of booksList) {
      if (!uniqueMap.has(book.id)) {
        uniqueMap.set(book.id, book);
      }
    }
    return Array.from(uniqueMap.values());
  }, [booksList]);



  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let books = [...uniqueBooks];

    // Search filter (fuzzy Arabic matching)
    if (searchQuery.trim()) {
      books = books.filter(b =>
        arabicSearchMatch(b.title, searchQuery) ||
        arabicSearchMatch(b.author, searchQuery) ||
        arabicSearchMatch(b.description || '', searchQuery)
      );
    }

    // Category filter
    if (selectedCategory) {
      books = books.filter(b => b.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      books = books.filter(b => b.subcategory === selectedSubcategory);
    }

    // Difficulty filter
    if (selectedDifficulty) {
      books = books.filter(b => b.difficulty === selectedDifficulty);
    }

    // Sort
    switch (sortBy) {
      case 'title-asc':
        books.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
        break;
      case 'title-desc':
        books.sort((a, b) => b.title.localeCompare(a.title, 'ar'));
        break;
      case 'newest':
        books.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        break;
      default:
        break;
    }

    return books;
  }, [uniqueBooks, searchQuery, selectedCategory, selectedSubcategory, selectedDifficulty, sortBy]);

  const activeFiltersCount = [selectedCategory, selectedSubcategory, selectedDifficulty].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedDifficulty('');
    setSortBy('default');
    setSearchQuery('');
  };



  const toggleDropdown = (name: 'category' | 'subcategory' | 'difficulty' | 'sort') => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  // Get labels for UI
  const getCategoryLabelText = () => {
    if (!selectedCategory) return 'جميع التصنيفات';
    return CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory;
  };

  const getSubcategoryLabelText = () => {
    if (!selectedSubcategory) return 'جميع الفروع';
    return subcategories.find(s => s.id === selectedSubcategory)?.label || selectedSubcategory;
  };

  const getDifficultyLabelText = () => {
    if (selectedDifficulty === 'beginner') return 'مبتدئ';
    if (selectedDifficulty === 'intermediate') return 'متوسط';
    if (selectedDifficulty === 'advanced') return 'متقدم';
    return 'جميع المستويات';
  };

  const getSortLabelText = () => {
    if (sortBy === 'title-asc') return 'أبجدي (أ ← ي)';
    if (sortBy === 'title-desc') return 'أبجدي (ي → أ)';
    if (sortBy === 'newest') return 'الأحدث';
    return 'ترتيب افتراضي';
  };

  return (
    <div className="container-motoon py-8 md:py-12 section-padding min-h-screen">
      {/* Offline Banner */}
      {isOffline && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>أنت تتصفح بدون اتصال بالإنترنت — يتم عرض المتون المحفوظة مؤقتاً</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-3 text-3xl font-black md:text-4xl text-teal-800 dark:text-teal-400">تصفح المتون</h1>
        <p className="text-muted-foreground">اختر المتن المناسب وابدأ رحلة الحفظ والإتقان.</p>
      </div>

      {/* Search input */}
      <div className="mb-6 relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن متن بالاسم أو المؤلف..."
          className="w-full h-12 pl-4 pr-12 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all shadow-sm hover:border-primary/40 placeholder:text-muted-foreground/70"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>



      {/* Filter toggle + View mode + Sort */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <Button
          variant={filtersOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltersOpen(v => !v)}
          className="gap-2 rounded-2xl font-bold text-xs h-10 px-4"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلترة متقدمة
          {activeFiltersCount > 0 && (
            <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-black">{activeFiltersCount}</span>
          )}
        </Button>

        {(activeFiltersCount > 0 || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs text-destructive hover:text-destructive h-10 hover:bg-destructive/5 px-3 rounded-2xl">
            <X className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        )}

        <div className="mr-auto flex items-center gap-3">
          {/* Custom Sort Dropdown */}
          <div className="relative custom-dropdown-container">
            <button
              onClick={() => toggleDropdown('sort')}
              className="h-10 px-4 rounded-2xl border border-border bg-card text-xs font-bold hover:bg-muted/60 transition-all flex items-center gap-2"
            >
              <span>{getSortLabelText()}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {activeDropdown === 'sort' && (
              <div className="absolute left-0 mt-2 w-48 bg-card border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {[
                  { value: 'default', label: 'ترتيب افتراضي' },
                  { value: 'title-asc', label: 'أبجدي (أ ← ي)' },
                  { value: 'title-desc', label: 'أبجدي (ي → أ)' },
                  { value: 'newest', label: 'الأحدث' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setActiveDropdown(null);
                    }}
                    className="w-full text-right px-4 py-2 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-10 w-10 flex items-center justify-center transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-muted/60'
              }`}
              title="عرض شبكي"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-10 w-10 flex items-center justify-center transition-colors ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-muted/60'
              }`}
              title="عرض قائمة"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded filters with Premium Custom UI */}
      {filtersOpen && (
        <div className="mb-6 p-5 rounded-3xl border border-primary/10 bg-card shadow-md space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Category Custom Dropdown */}
            <div className="space-y-1.5 relative custom-dropdown-container">
              <label className="text-xs font-bold text-muted-foreground mr-1">العلم / التصنيف</label>
              <button
                onClick={() => toggleDropdown('category')}
                className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm font-bold text-right hover:border-primary/30 transition-all flex items-center justify-between shadow-inner"
              >
                <span className="truncate">{getCategoryLabelText()}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {activeDropdown === 'category' && (
                <div className="absolute right-0 left-0 mt-2 max-h-72 overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                  >
                    <span>جميع التصنيفات</span>
                    {selectedCategory === '' && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                  {CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id] || BookOpen;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          {cat.label}
                        </span>
                        {selectedCategory === cat.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Subcategory Custom Dropdown */}
            <div className="space-y-1.5 relative custom-dropdown-container">
              <label className="text-xs font-bold text-muted-foreground mr-1">التخصص / الفرع</label>
              <button
                onClick={() => {
                  if (selectedCategory) toggleDropdown('subcategory');
                }}
                disabled={!selectedCategory}
                className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm font-bold text-right hover:border-primary/30 disabled:opacity-50 disabled:bg-muted/10 transition-all flex items-center justify-between shadow-inner"
              >
                <span className="truncate">{getSubcategoryLabelText()}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {activeDropdown === 'subcategory' && selectedCategory && (
                <div className="absolute right-0 left-0 mt-2 max-h-72 overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none">
                  <button
                    onClick={() => {
                      setSelectedSubcategory('');
                      setActiveDropdown(null);
                    }}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                  >
                    <span>جميع الفروع</span>
                    {selectedSubcategory === '' && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubcategory(sub.id);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                    >
                      <span>{sub.label}</span>
                      {selectedSubcategory === sub.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty Custom Dropdown */}
            <div className="space-y-1.5 relative custom-dropdown-container">
              <label className="text-xs font-bold text-muted-foreground mr-1">المستوى</label>
              <button
                onClick={() => toggleDropdown('difficulty')}
                className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm font-bold text-right hover:border-primary/30 transition-all flex items-center justify-between shadow-inner"
              >
                <span className="truncate">{getDifficultyLabelText()}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {activeDropdown === 'difficulty' && (
                <div className="absolute right-0 left-0 mt-2 bg-card border border-border/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {[
                    { value: '', label: 'جميع المستويات' },
                    { value: 'beginner', label: 'مبتدئ' },
                    { value: 'intermediate', label: 'متوسط' },
                    { value: 'advanced', label: 'متقدم' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedDifficulty(opt.value);
                        setActiveDropdown(null);
                      }}
                      className="w-full text-right px-4 py-2.5 text-xs font-bold hover:bg-primary/10 transition-colors flex items-center justify-between"
                    >
                      <span>{opt.label}</span>
                      {selectedDifficulty === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Results count */}
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4.5 w-4.5 text-primary/80" />
        <span className="font-semibold">{filteredBooks.length}</span> متن
        {searchQuery && <span>— نتائج البحث عن &quot;{searchQuery}&quot;</span>}
        {selectedCategory && (
          <span>في <span className="text-primary font-bold">{CATEGORIES.find(c => c.id === selectedCategory)?.label}</span></span>
        )}
      </div>

      {/* Books Grid/List */}
      {filteredBooks.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 text-center p-8 bg-card animate-in fade-in duration-300">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="mb-2 text-lg font-bold text-foreground">لم نتمكن من العثور على متون مطابقة</p>
          <p className="text-muted-foreground text-sm mb-4">جرب كلمات مفتاحية أخرى أو قم بتغيير التصنيف</p>
          <Button variant="outline" onClick={clearFilters} className="font-bold rounded-xl">
            مسح جميع الفلاتر
          </Button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid grid-cols-1 gap-4'
        }>
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
