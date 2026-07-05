'use client';

import React, { useState } from 'react';
import { ParsedVerse } from '@/types/verse.types';
import { versesService } from '@/services/firebase/verses.service';
import { activityLogService } from '@/services/firebase/activityLog.service';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Trash2, 
  Plus, 
  Save, 
  Loader2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VersePasteParserProps {
  bookId: string;
  bookTitle: string;
  userId: string;
  onSuccess: () => void;
}

export function VersePasteParser({ bookId, bookTitle, userId, onSuccess }: VersePasteParserProps) {
  const [rawText, setRawText] = useState('');
  const [parsedVerses, setParsedVerses] = useState<ParsedVerse[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Parsing classical text
  const handleParse = () => {
    if (!rawText.trim()) {
      toast.error('يرجى لصق النص أولاً.');
      return;
    }

    const lines = rawText.split('\n');
    const list: ParsedVerse[] = [];
    let orderCounter = 1;

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return; // skip empty lines

      // Try split Sadr and Ajez by three dots "...", asterisk "*", tab, or three or more spaces
      let sadr = '';
      let ajez = '';

      const separators = [/\s*\.\.\.\s*/, /\s*\*\s*/, /\t+/, /\s{3,}/];
      let splitSuccess = false;

      for (const sep of separators) {
        const parts = cleanLine.split(sep);
        if (parts.length >= 2) {
          sadr = parts[0].trim();
          ajez = parts[1].trim();
          splitSuccess = true;
          break;
        }
      }

      if (!splitSuccess) {
        // Fallback: split by words
        const words = cleanLine.split(/\s+/);
        if (words.length > 2) {
          const mid = Math.ceil(words.length / 2);
          sadr = words.slice(0, mid).join(' ');
          ajez = words.slice(mid).join(' ');
        } else {
          sadr = cleanLine;
          ajez = '';
        }
      }

      // Format canonical verse text: "sadr ... ajez"
      const formattedText = ajez ? `${sadr} ... ${ajez}` : sadr;

      list.push({
        text: formattedText,
        normalizedText: formattedText, // Normalized text for speech comparison
        order: orderCounter++
      });
    });

    if (list.length === 0) {
      toast.error('لم نتمكن من استخراج أي أبيات، يرجى التحقق من صياغة النص.');
      return;
    }

    setParsedVerses(list);
    setShowPreview(true);
    toast.success(`تم استخراج ${list.length} بيت شعر بنجاح. راجعها أدناه قبل الحفظ.`);
  };

  // Inline edits
  const handleVerseTextChange = (index: number, newText: string) => {
    setParsedVerses(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        text: newText,
        normalizedText: newText
      };
      return copy;
    });
  };

  const handleAddRow = () => {
    setParsedVerses(prev => [
      ...prev,
      {
        text: 'الصدر ... العجز',
        normalizedText: 'الصدر ... العجز',
        order: prev.length + 1
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setParsedVerses(prev => {
      const copy = prev.filter((_, idx) => idx !== index);
      // Re-index orders
      return copy.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));
    });
  };

  // Batch save to Firestore
  const handleSaveAll = async () => {
    if (parsedVerses.length === 0) return;

    setSaving(true);
    const toastId = toast.loading(`جاري حفظ ${parsedVerses.length} بيت في قاعدة البيانات...`);

    try {
      // Save all in Firestore via batch create (chunked inside service)
      await versesService.batchCreateVerses(bookId, parsedVerses);

      // Log action
      if (userId) {
        await activityLogService.log(userId, 'batch_create_verses', {
          bookId,
          bookTitle,
          count: parsedVerses.length
        });
      }

      toast.success(`تم حفظ ${parsedVerses.length} بيت بنجاح للمتن "${bookTitle}"`, { id: toastId });
      setRawText('');
      setParsedVerses([]);
      setShowPreview(false);
      onSuccess(); // refresh page or switch tab
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الأبيات في قاعدة البيانات.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right">
      {!showPreview ? (
        /* Paste Mode */
        <div className="bg-card border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <FileText className="h-5 w-5" />
            <span>معالج لصق نصوص المتن المنظوم</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            الصق النص الكامل للمتن أدناه. احرص على أن يكون كل بيت في سطر منفصل، ويفصل بين الشطرين (الصدر والعجز) بعلامة نقاط ثلاثية `...` أو نجمة `*` أو مسافات متعددة.
          </p>

          <textarea
            rows={12}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`مثال للصق الأبيات:\nأبدأ بالحمد مصليا على ... محمد خير نبي أرسلا\nوذي من أقسام الحديث عده * وكل واحد أتى وحده`}
            className="w-full p-4 border rounded-2xl bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-arabic leading-loose"
          />

          <Button 
            onClick={handleParse} 
            className="w-full md:w-auto font-bold px-8 py-5 text-sm rounded-xl"
          >
            <Sparkles className="ml-2 h-4 w-4" />
            استخراج الأبيات الشعرية
          </Button>
        </div>
      ) : (
        /* Preview & Edit Grid Mode */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
            <div>
              <h3 className="font-bold text-primary flex items-center gap-1.5 text-base">
                <Sparkles className="h-4 w-4" />
                معاينة الأبيات المستخرجة
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                تأكد من تقسيم الصدر والعجز بشكل سليم. يمكنك تعديل النصوص مباشرة في المربعات أدناه قبل الحفظ النهائي.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:bg-muted"
              >
                <ArrowRight className="ml-1.5 h-4 w-4" />
                رجوع وتعديل النص الخام
              </Button>
            </div>
          </div>

          {/* Editable Grid Table */}
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-sm text-right border-collapse">
                <thead className="bg-muted/50 border-b text-xs font-bold text-muted-foreground uppercase sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="p-3 w-16 text-center">الترتيب</th>
                    <th scope="col" className="p-3">نص البيت (الصدر ... العجز)</th>
                    <th scope="col" className="p-3 w-16 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedVerses.map((verse, index) => (
                    <tr key={index} className="hover:bg-accent/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-center text-muted-foreground select-none">
                        #{verse.order}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={verse.text}
                          onChange={(e) => handleVerseTextChange(index, e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg bg-background text-sm focus:ring-1 focus:ring-primary font-arabic text-center leading-loose"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(index)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table controls */}
            <div className="p-4 bg-muted/20 border-t flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة بيت جديد يدوياً
              </Button>

              <span className="text-xs text-muted-foreground font-mono">
                إجمالي الأبيات: {parsedVerses.length} بيتاً
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSaveAll}
              disabled={saving || parsedVerses.length === 0}
              className="flex-1 font-bold py-6 text-base rounded-2xl shadow-md"
            >
              {saving ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري حفظ {parsedVerses.length} بيت علمي...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Save className="h-5 w-5" />
                  حفظ جميع الأبيات المعتمدة ({parsedVerses.length})
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
