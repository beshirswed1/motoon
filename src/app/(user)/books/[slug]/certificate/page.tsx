'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useBook } from '@/hooks/features/books.hooks';
import { useAuth } from '@/hooks/useAuth';
import {
  Award, Download, Share2, Printer, Copy, Check,
  ArrowRight, Loader2, User, Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CertificateCanvas, getGradeLabel, getGradeColor } from '@/features/recitation/components/CertificateCanvas';

import type { CertificateData } from '@/features/recitation/components/CertificateCanvas';
import toast from 'react-hot-toast';

function toHijri(date: Date): string {
  try {
    return date.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch {
    return date.toLocaleDateString('ar-EG');
  }
}

function generateCertId(userId: string, bookId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const ub = (userId.slice(-4) + bookId.slice(-4)).toUpperCase();
  return `MTN-${ub}-${ts}`;
}

function CertificatePageContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const decodedSlug = decodeURIComponent(params.slug || '');
  const { data: book, isLoading } = useBook(decodedSlug);

  const scoreParam = searchParams.get('score');
  const score = scoreParam ? Math.round(parseFloat(scoreParam)) : 0;

  const [isMounted, setIsMounted] = useState(false);
  const [localBook, setLocalBook] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [studentName, setStudentName] = useState(user?.name || '');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [certCanvas, setCertCanvas] = useState<HTMLCanvasElement | null>(null);
  const [certData, setCertData] = useState<CertificateData | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Try API endpoint for local book fallback when Firebase doesn't have it
  useEffect(() => {
    if (!isLoading && !book && decodedSlug) {
      setLoadingLocal(true);
      fetch(`/api/books/${encodeURIComponent(decodedSlug)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setLocalBook(data.book);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingLocal(false));
    }
  }, [isLoading, book, decodedSlug]);

  const displayBook = book || localBook;

  // Build certificate data once name is confirmed
  useEffect(() => {
    if (!nameConfirmed || !displayBook || !studentName.trim()) return;

    const now = new Date();
    const certId = generateCertId(user?.id || 'guest', displayBook.id);
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://motoon.com.tr'}/verify/${certId}`;

    setCertData({
      studentName: studentName.trim(),
      bookTitle: displayBook.title,
      bookAuthor: displayBook.author,
      score,
      date: now.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
      hijriDate: toHijri(now),
      certId,
      verifyUrl,
      category: displayBook.category || '',
    });
  }, [nameConfirmed, displayBook, studentName, score, user?.id]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setCertCanvas(canvas);
  }, []);

  // Download as PNG
  const downloadPNG = useCallback(async () => {
    if (!certCanvas) return;
    setIsExporting(true);
    try {
      const link = document.createElement('a');
      link.download = `شهادة-${displayBook?.title || 'متن'}-${studentName}.png`;
      link.href = certCanvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success('تم تحميل الشهادة كصورة');
    } catch {
      toast.error('حدث خطأ أثناء التحميل');
    } finally {
      setIsExporting(false);
    }
  }, [certCanvas, displayBook?.title, studentName]);

  // Download as PDF
  const downloadPDF = useCallback(async () => {
    if (!certCanvas) return;
    setIsExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const imgData = certCanvas.toDataURL('image/png', 1.0);
      // A4 landscape: 297x210mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`شهادة-${displayBook?.title || 'متن'}-${studentName}.pdf`);
      toast.success('تم تحميل الشهادة كـ PDF');
    } catch {
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setIsExporting(false);
    }
  }, [certCanvas, displayBook?.title, studentName]);

  // Print
  const printCert = useCallback(() => {
    if (!certCanvas) return;
    const imgData = certCanvas.toDataURL('image/png', 1.0);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html dir="rtl">
        <head><title>طباعة الشهادة</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
          img { max-width: 100%; }
          @media print { body { padding: 0; } }
        </style></head>
        <body><img src="${imgData}" onload="window.print();window.close();" /></body>
      </html>
    `);
  }, [certCanvas]);

  // Share
  const shareOrCopy = useCallback(async () => {
    if (certCanvas && navigator.share && navigator.canShare) {
      try {
        certCanvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'شهادة-متون.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `شهادة إتمام ${displayBook?.title}`,
              text: `أتممت حفظ "${displayBook?.title}" بدرجة ${score}% على منصة متون!`,
              files: [file],
            });
            return;
          }
        });
      } catch {}
    }
    // Fallback: copy URL
    const url = certData?.verifyUrl || window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('تم نسخ رابط الشهادة');
    setTimeout(() => setCopied(false), 2000);
  }, [certCanvas, certData, displayBook?.title, score]);

  // Share on WhatsApp
  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `🏅 أتممت بحمد الله حفظ "${displayBook?.title}" بدرجة ${score}% على منصة متون!\n🔗 ${certData?.verifyUrl || 'https://motoon.com.tr'}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [displayBook?.title, score, certData]);

  // Share on Twitter
  const shareTwitter = useCallback(() => {
    const text = encodeURIComponent(
      `🏅 أتممت بحمد الله حفظ "${displayBook?.title}" بدرجة ${score}% على منصة #متون!\n${certData?.verifyUrl || 'https://motoon.com.tr'}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
  }, [displayBook?.title, score, certData]);

  const isPageLoading = isLoading || loadingLocal;

  if (!isMounted || isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (score < 95 || !displayBook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <Award className="w-16 h-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">لم تصل للدرجة المطلوبة بعد</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          تحتاج إلى 95% أو أعلى في التسميع للحصول على الشهادة. استمر في المراجعة!
        </p>
        <Button onClick={() => router.back()} className="rounded-xl font-bold">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة
        </Button>
      </div>
    );
  }

  const gradeColor = getGradeColor(score);
  const gradeLabel = getGradeLabel(score);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/10 section-padding py-10">
      <div className="container-motoon max-w-5xl">

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 gap-2 font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          العودة
        </Button>

        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: gradeColor + '20' }}>
            <Award className="h-8 w-8" style={{ color: gradeColor }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-2" style={{ background: gradeColor + '15', color: gradeColor }}>
              <Sparkles className="h-4 w-4" />
              {score}% — {gradeLabel}
            </div>
            <h1 className="text-2xl md:text-3xl font-black">مبارك إتمام الحفظ! 🎉</h1>
            <p className="text-muted-foreground mt-1">
              لقد أتممت حفظ <strong>"{displayBook.title}"</strong> بتفوق — احصل على شهادتك
            </p>
          </div>
        </div>

        {/* Name Input Step */}
        {!nameConfirmed ? (
          <div className="max-w-md mx-auto p-8 rounded-2xl border border-border/50 bg-card shadow-lg text-center flex flex-col gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black mb-2">اكتب اسمك على الشهادة</h2>
              <p className="text-sm text-muted-foreground">سيظهر هذا الاسم بشكل جميل على شهادتك</p>
            </div>
            <Input
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="اسمك الكريم..."
              className="text-center font-bold text-lg h-12 rounded-xl"
              maxLength={60}
              autoFocus
            />
            <Button
              onClick={() => {
                if (!studentName.trim()) {
                  toast.error('يرجى كتابة اسمك');
                  return;
                }
                setNameConfirmed(true);
              }}
              className="h-11 rounded-xl font-bold text-base gap-2"
              size="lg"
            >
              <Award className="h-5 w-5" />
              إصدار الشهادة
            </Button>
          </div>
        ) : (
          <>
            {/* Certificate Preview */}
            <div className="mb-8 animate-in fade-in zoom-in-95 duration-500">
              {certData && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
                  <CertificateCanvas
                    data={certData}
                    onReady={handleCanvasReady}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <Button
                onClick={downloadPDF}
                disabled={isExporting || !certCanvas}
                className="gap-2 rounded-xl font-bold px-6"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                تحميل PDF
              </Button>
              <Button
                onClick={downloadPNG}
                variant="outline"
                disabled={isExporting || !certCanvas}
                className="gap-2 rounded-xl font-bold px-6"
              >
                <Download className="h-4 w-4" />
                تحميل صورة
              </Button>
              <Button
                onClick={printCert}
                variant="outline"
                disabled={!certCanvas}
                className="gap-2 rounded-xl font-bold px-6"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                onClick={shareOrCopy}
                variant="outline"
                disabled={!certCanvas}
                className="gap-2 rounded-xl font-bold px-6"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </Button>
            </div>

            {/* Share on Social */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                مشاركة واتساب
              </button>
              <button
                onClick={shareTwitter}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                مشاركة X
              </button>
              <Button
                onClick={shareOrCopy}
                variant="outline"
                className="gap-2 rounded-xl font-bold text-sm"
              >
                <Share2 className="h-4 w-4" />
                مشاركة أخرى
              </Button>
            </div>

            {/* Change name */}
            <div className="mt-8 text-center">
              <button
                onClick={() => { setNameConfirmed(false); setCertCanvas(null); setCertData(null); }}
                className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
              >
                تغيير الاسم على الشهادة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CertificatePageContent />
    </Suspense>
  );
}
