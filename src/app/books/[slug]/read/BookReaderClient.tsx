'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Search, Plus, Minus, 
  ArrowRight, Download, Loader2, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import type { Book, Verse } from '@/types/book.types';

interface BookReaderClientProps {
  book: Book;
  verses: Verse[];
}

export function BookReaderClient({ book, verses }: BookReaderClientProps) {
  const [fontSize, setFontSize] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Robust function to split Arabic verses into Hemistiches (الصدر والعجز)
  const formatVerse = (text: string) => {
    const parts = text.split(/\s*(?:\.{2,}|…| \. \. )\s*/);
    if (parts.length >= 2) {
      return {
        first: parts[0].trim(),
        second: parts.slice(1).join(' ... ').trim()
      };
    }
    return {
      first: text.trim(),
      second: ''
    };
  };

  // Zoom In / Out handlers
  const zoomIn = () => setFontSize(prev => Math.min(prev + 2, 32));
  const zoomOut = () => setFontSize(prev => Math.max(prev - 2, 14));

  // Search filter
  const filteredVerses = useMemo(() => {
    if (!searchQuery.trim()) return verses;
    const query = searchQuery.trim().toLowerCase();
    return verses.filter(v => 
      v.text.toLowerCase().includes(query) || 
      (v.normalizedText && v.normalizedText.toLowerCase().includes(query)) ||
      String(v.order).includes(query)
    );
  }, [verses, searchQuery]);

  // Chunk verses for off-screen A4 PDF pages (16 verses per page fits A4 perfectly)
  const pdfPages = useMemo(() => {
    const chunks: Verse[][] = [];
    const chunkSize = 16;
    for (let i = 0; i < verses.length; i += chunkSize) {
      chunks.push(verses.slice(i, i + chunkSize));
    }
    return chunks;
  }, [verses]);

  // Handle Download TXT
  const handleDownloadTxt = () => {
    const divider = '='.repeat(50);
    const content = [
      divider,
      'منصة متون - لتعليم وحفظ المتون الشرعية',
      divider,
      `متن: ${book.title}`,
      `المؤلف: ${book.author}`,
      `عدد الأبيات: ${verses.length}`,
      divider,
      '',
      verses.map(v => {
        const { first, second } = formatVerse(v.text);
        return second 
          ? `[${v.order}] ${first} * * * ${second}`
          : `[${v.order}] ${first}`;
      }).join('\n'),
      '',
      divider,
      `تم تحميل هذا الملف من منصة متون (motoon.app)`,
      divider
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `متن_${book.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Direct PDF Download (Generates page-by-page off-screen PDF)
  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading('جاري تجهيز كتاب PDF منسق بـ 2 شطرين...');

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const totalPages = pdfPages.length + 1; // cover page + content pages
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Loop page by page, rendering each container from the offscreen area
      for (let i = 1; i <= totalPages; i++) {
        const pageElement = document.getElementById(`pdf-page-${i}`);
        if (!pageElement) continue;

        // Render page to image using html-to-image (renders Arabic diacritics & ligatures perfectly!)
        const dataUrl = await toPng(pageElement, {
          quality: 0.9,
          pixelRatio: 2.0, // High-sharp print resolution
          backgroundColor: '#ffffff',
          fontEmbedCSS: '', // Disable font inlining to prevent huge file size (79MB -> 1MB) and UUID download bugs
          style: {
            transform: 'scale(1)',
          }
        });

        if (i > 1) {
          pdf.addPage();
        }

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`متن_${book.title.replace(/\s+/g, '_')}.pdf`);
      toast.success('تم تحميل كتاب PDF المنسق بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ أثناء إنشاء وتحميل ملف PDF');
    } finally {
      setIsExporting(false);
      toast.dismiss(toastId);
    }
  };

  // Keep native browser print for quick access
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {/* Custom styles for native print layout fallback */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: 'IBM Plex Sans Arabic', serif !important;
            direction: rtl !important;
          }
          header, footer, nav, aside, .no-print, button, input, .sticky-bar, .breadcrumbs, .back-btn {
            display: none !important;
          }
          .print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      ` }} />

      {/* ─── SCREEN LAYOUT ───────────────────────────────────────── */}
      <div className="print-wrapper container-motoon py-8 min-h-screen">
        {/* Navigation Breadcrumbs */}
        <div className="breadcrumbs mb-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground no-print" data-html2canvas-ignore="true">
          <Link href="/books" className="hover:text-primary transition-colors">المتون</Link>
          <span>/</span>
          <Link href={`/books/${book.slug}`} className="hover:text-primary transition-colors">{book.title}</Link>
          <span>/</span>
          <span className="text-foreground font-bold">عرض وقراءة</span>
        </div>

        {/* Top Header Card */}
        <div className="relative mb-8 rounded-3xl overflow-hidden border border-border/50 bg-card p-6 md:p-8 shadow-sm">
          <div className="absolute inset-0 bg-primary/[0.02] opacity-60" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='%230F766E' stroke-width='0.4' stroke-opacity='0.1'/%3E%3C/svg%3E")`
          }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center p-2 border border-primary/20 shadow-sm">
                <img src="/logo.png" alt="شعار متون" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-sm font-bold text-primary tracking-widest block">منصة متون التعليمية</span>
                <h1 className="text-2xl md:text-3xl font-black text-foreground">{book.title}</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium md:text-left">
              <div className="bg-muted px-4 py-2 rounded-2xl border">
                <span className="text-muted-foreground block text-xs">الناظم / المؤلف</span>
                <span className="font-bold text-foreground">{book.author}</span>
              </div>
              <div className="bg-muted px-4 py-2 rounded-2xl border">
                <span className="text-muted-foreground block text-xs">عدد الأبيات</span>
                <span className="font-bold text-primary">{verses.length} بيتاً</span>
              </div>
              <div className="bg-muted px-4 py-2 rounded-2xl border">
                <span className="text-muted-foreground block text-xs">المستوى</span>
                <span className="font-bold text-amber-600">
                  {book.difficulty === 'beginner' ? 'مبتدئ' : book.difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar & Controls Card */}
        <div className="sticky-bar sticky top-20 z-30 mb-8 rounded-2xl border bg-card/90 backdrop-blur p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between no-print" data-html2canvas-ignore="true">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="ابحث عن بيت معين..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-9 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 border rounded-xl p-1 bg-muted/50">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomOut} 
                disabled={fontSize <= 14}
                className="h-8 w-8 rounded-lg hover:bg-background"
                title="تصغير الخط"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-2 select-none min-w-[50px] text-center">حجم الخط ({fontSize})</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomIn} 
                disabled={fontSize >= 32}
                className="h-8 w-8 rounded-lg hover:bg-background"
                title="تكبير الخط"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              onClick={handleDownloadPdf} 
              disabled={isExporting}
              className="gap-1.5 h-10 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/10"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? 'جاري التصدير...' : 'تحميل PDF منسق'}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleDownloadTxt} 
              className="gap-1.5 h-10 rounded-xl font-bold"
            >
              <Download className="h-4 w-4" />
              تنزيل ملف نصي TXT
            </Button>

            <Button 
              variant="ghost" 
              onClick={handlePrint} 
              className="gap-1.5 h-10 rounded-xl font-bold border border-border"
              title="طباعة سريعة"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Verses Layout */}
        <div className="rounded-3xl border bg-card p-6 md:p-12 shadow-sm relative overflow-hidden mb-12">
          <div className="absolute inset-4 rounded-[20px] border border-dashed border-primary/20 pointer-events-none" />

          {filteredVerses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-muted-foreground mb-1">لم نجد أي أبيات تطابق بحثك</p>
              <p className="text-sm text-muted-foreground/80">تأكد من كتابة الكلمات بشكل صحيح أو جرب كلمات أخرى</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 py-4 relative z-10 max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                <span className="text-lg font-semibold font-serif text-primary block mb-2">﷽</span>
                <h2 className="text-2xl md:text-3xl font-black font-serif text-foreground">{book.title}</h2>
                <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-3" />
              </div>

              <div className="space-y-4 md:space-y-5">
                {filteredVerses.map((verse) => {
                  const { first, second } = formatVerse(verse.text);

                  return (
                    <div 
                      key={verse.id} 
                      className="verse-row-container group flex flex-col md:flex-row items-center md:items-start justify-center gap-3 md:gap-4 py-3 border-b border-border/40 hover:bg-primary/[0.01] transition-colors rounded-lg px-2"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="verse-first-half w-full md:w-[44%] text-center md:text-left font-serif font-semibold leading-loose text-foreground pr-2 md:pl-4">
                        {first}
                      </div>

                      <div className="verse-num-badge-wrapper flex items-center justify-center my-1 md:my-0">
                        <div className="verse-num-badge w-8 h-8 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center text-xs font-bold text-primary shadow-sm select-none font-sans">
                          {verse.order}
                        </div>
                      </div>

                      <div className="verse-second-half w-full md:w-[44%] text-center md:text-right font-serif font-semibold leading-loose text-foreground pl-2 md:pr-4">
                        {second || <span className="opacity-0">.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Back navigation */}
        <div className="back-btn flex justify-center mt-6 no-print" data-html2canvas-ignore="true">
          <Button variant="ghost" asChild className="gap-2 font-bold text-muted-foreground hover:text-foreground">
            <Link href={`/books/${book.slug}`}>
              <ArrowRight className="h-4 w-4" />
              العودة إلى صفحة التفاصيل
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── OFF-SCREEN PDF GENERATOR LAYOUT (A4 Perfect Pro styling) ─── */}
      {/* Positioned off-screen, perfectly matches A4 dimensions to ensure high fidelity rendering */}
      <div className="absolute left-[-9999px] top-[-9999px] bg-slate-100 text-slate-900 pointer-events-none select-none" style={{ width: '794px' }}>
        
        {/* PDF Page 1: Premium Title Cover */}
        <div 
          id="pdf-page-1" 
          className="bg-white relative p-16 flex flex-col justify-between items-center text-center overflow-hidden border-[16px] border-[#0f766e]/20"
          style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}
        >
          {/* Islamic Frame inside border */}
          <div className="absolute inset-4 border-2 border-[#0f766e]/30 pointer-events-none" />
          <div className="absolute inset-6 border border-[#0f766e]/15 pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="flex flex-col items-center mt-12 w-full">
            <div className="w-20 h-20 rounded-2xl bg-[#0f766e]/10 p-3 border border-[#0f766e]/20 flex items-center justify-center mb-4">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#0f766e]">مَنَصَّةُ مُتُونٍ التَّعْلِيمِيَّة</span>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-[#0f766e] to-transparent mt-3 mb-12" />
          </div>

          {/* Book Title & Author */}
          <div className="flex flex-col items-center w-full my-auto">
            <span className="text-lg text-[#0f766e] font-serif font-semibold mb-2">﷽</span>
            <h1 className="text-4xl font-black font-serif text-slate-800 leading-tight mb-4">{book.title}</h1>
            <div className="h-[1px] w-48 bg-slate-200 my-4" />
            <h2 className="text-xl font-bold font-serif text-teal-800">تأليف الناظم: {book.author}</h2>
          </div>

          {/* About metadata */}
          <div className="w-full max-w-lg bg-slate-50 border border-slate-200/80 rounded-2xl p-6 mb-8 text-right font-serif">
            <span className="text-sm font-bold text-[#0f766e] block mb-1">تعريف بالمتن:</span>
            <p className="text-[10pt] leading-relaxed text-slate-600 font-sans">{book.description}</p>
          </div>

          {/* Cover Footer info */}
          <div className="flex flex-col items-center w-full mb-8">
            <div className="flex gap-6 text-[10px] font-bold text-slate-500 mb-6 bg-slate-100 px-6 py-2.5 rounded-full border border-slate-200">
              <span>عدد الأبيات: {verses.length} بيتاً</span>
              <span>•</span>
              <span>المستوى: {book.difficulty === 'beginner' ? 'مبتدئ' : book.difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}</span>
              <span>•</span>
              <span>التصنيف: {book.tags[0] || 'متون شرعية'}</span>
            </div>
            <span className="text-[9px] text-slate-400">تم التحميل والترتيب بواسطة منصة متون © motoon.app</span>
          </div>
        </div>

        {/* PDF Pages 2+: Content pages with 16 verses per page */}
        {pdfPages.map((pageVerses, pageIdx) => {
          const pageNumber = pageIdx + 2;
          const totalPdfPages = pdfPages.length + 1;
          
          return (
            <div 
              key={pageIdx}
              id={`pdf-page-${pageNumber}`}
              className="bg-white relative p-12 flex flex-col justify-between overflow-hidden border-[16px] border-[#0f766e]/20"
              style={{ width: '794px', height: '1123px', boxSizing: 'border-box' }}
            >
              {/* Islamic Frame inside border */}
              <div className="absolute inset-4 border border-[#0f766e]/25 pointer-events-none" />

              {/* Running Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                  <span className="text-[10px] font-bold text-[#0f766e]">منصة متون التعليمية</span>
                </div>
                <span className="text-xs font-bold font-serif text-slate-700">{book.title}</span>
              </div>

              {/* Page verses content */}
              <div className="flex-1 flex flex-col justify-start">
                {pageIdx === 0 && (
                  <div className="text-center mb-6">
                    <span className="text-sm font-semibold text-[#0f766e] block mb-1">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  {pageVerses.map((verse) => {
                    const { first, second } = formatVerse(verse.text);

                    return (
                      <div key={verse.id} className="flex items-center justify-between py-2 border-b border-dashed border-slate-100 w-full min-h-[46px]">
                        {/* Right Hemistich (الصدر) */}
                        <div className="w-[43%] text-left font-serif font-semibold text-[12pt] leading-loose text-slate-800 pr-2">
                          {first}
                        </div>

                        {/* Middle Badge */}
                        <div className="w-[10%] flex justify-center">
                          <div className="w-7 h-7 rounded-full border border-teal-200 bg-teal-50/50 flex items-center justify-center text-[10px] font-bold text-teal-700 font-sans">
                            {verse.order}
                          </div>
                        </div>

                        {/* Left Hemistich (العجز) */}
                        <div className="w-[43%] text-right font-serif font-semibold text-[12pt] leading-loose text-slate-800 pl-2">
                          {second}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Running Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-6 text-[10px] text-slate-400">
                <span>تم التنزيل من الموقع الرسمي للمنصة: motoon.app</span>
                <span className="font-bold text-[#0f766e]">صفحة {pageNumber} من {totalPdfPages}</span>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
