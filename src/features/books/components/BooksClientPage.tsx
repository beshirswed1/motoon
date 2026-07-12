'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookCard } from '@/components/common/BookCard';
import { CATEGORIES } from '@/lib/constants/categories';
import { arabicSearchMatch } from '@/lib/utils/arabicNormalize';
import {
  Search, LayoutGrid, List, X, SlidersHorizontal,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BooksClientPageProps {
  allBooks: any[];
  initialCategory?: string;
}

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

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('motoon-view-mode', viewMode);
  }, [viewMode]);

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

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    // Deduplicate books by id to avoid React duplicate key warnings
    const uniqueMap = new Map<string, any>();
    for (const book of allBooks) {
      if (!uniqueMap.has(book.id)) {
        uniqueMap.set(book.id, book);
      }
    }
    let books = Array.from(uniqueMap.values());

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
  }, [allBooks, searchQuery, selectedCategory, selectedSubcategory, selectedDifficulty, sortBy]);

  const activeFiltersCount = [selectedCategory, selectedSubcategory, selectedDifficulty].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedDifficulty('');
    setSortBy('default');
    setSearchQuery('');
  };

  return (
    <div className="container-motoon py-8 md:py-12 section-padding min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-black md:text-4xl">تصفح المتون</h1>
        <p className="text-muted-foreground">اختر المتن المناسب وابدأ رحلة الحفظ والإتقان.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن متن بالاسم أو المؤلف..."
            className="w-full h-12 pl-4 pr-11 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle + View mode + Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filtersOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltersOpen(v => !v)}
            className="gap-1.5 rounded-xl font-bold text-xs h-9"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            التصفية
            {activeFiltersCount > 0 && (
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-black">{activeFiltersCount}</span>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs text-destructive hover:text-destructive h-9">
              <X className="h-3 w-3" />
              مسح الفلاتر
            </Button>
          )}

          <div className="mr-auto flex items-center gap-1.5">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 rounded-xl border bg-card text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="default">ترتيب افتراضي</option>
              <option value="title-asc">أبجدي (أ → ي)</option>
              <option value="title-desc">أبجدي (ي → أ)</option>
              <option value="newest">الأحدث</option>
            </select>

            {/* View mode toggle */}
            <div className="flex items-center border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`h-9 w-9 flex items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
                }`}
                title="عرض شبكي"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`h-9 w-9 flex items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
                }`}
                title="عرض قائمة"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">العلم / التصنيف</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">جميع التصنيفات</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">التخصص / الفرع</label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">جميع الفروع</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.label}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">المستوى</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">جميع المستويات</option>
                  <option value="beginner">مبتدئ</option>
                  <option value="intermediate">متوسط</option>
                  <option value="advanced">متقدم</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span className="font-semibold">{filteredBooks.length}</span> متن
        {searchQuery && <span>— نتائج البحث عن "{searchQuery}"</span>}
      </div>

      {/* Books Grid/List */}
      {filteredBooks.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed text-center p-8 bg-card">
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
