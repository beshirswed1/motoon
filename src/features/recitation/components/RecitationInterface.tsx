'use client';
import React from 'react';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Book, Verse, ComparisonResult } from '@/types';
import { speechService } from '@/services/ai/speech.service';
import { RecitationComparisonEngine, compareWords, normalizeArabicText } from '@/services/ai/comparison.service';
import { audioFeedback } from '../utils/audio';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  X, Mic, Square, Eye, EyeOff, RotateCcw, 
  Sparkles, Check, HelpCircle, ChevronRight, 
  Volume2, VolumeX, AlertTriangle
} from 'lucide-react';

interface RecitationInterfaceProps {
  book: Book;
  verses: Verse[];
  results: Record<number, ComparisonResult>;
  onResultSave: (index: number, result: ComparisonResult | null) => void;
  onFinishSession: (finalResults: Record<number, ComparisonResult>) => void;
  onExit: () => void;
}

interface AlignedVerse {
  verseIndex: number;
  spokenWords: string[];
  status: 'pending' | 'reciting' | 'recited' | 'skipped';
  result?: ComparisonResult;
}


interface WordAlignment {
  word: string;
  expectedIndex: number;
  status: 'correct' | 'wrong' | 'forgotten' | 'pending';
  actualSpoken?: string;
}

const alignActiveVerse = (
  expectedText: string,
  spokenText: string
): WordAlignment[] => {
  const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);
  
  const alignments: WordAlignment[] = expectedWords.map((word, idx) => ({
    word,
    expectedIndex: idx,
    status: 'pending',
  }));

  if (spokenWords.length === 0) {
    return alignments;
  }

  let eIdx = 0;
  let sIdx = 0;

  while (eIdx < expectedWords.length && sIdx < spokenWords.length) {
    const expWord = expectedWords[eIdx];
    const spkWord = spokenWords[sIdx];

    // Check for pure punctuation
    const expNorm = normalizeArabicText(expWord);
    if (expNorm.length === 0) {
      alignments[eIdx].status = 'correct';
      eIdx++;
      continue;
    }

    // 1. Direct match check
    const sim = compareWords(expWord, spkWord);
    // Use 0.85 tolerance based on intelligent string-similarity
    if (sim >= 0.85) {
      alignments[eIdx].status = 'correct';
      eIdx++;
      sIdx++;
      continue;
    }

    // 2. Lookahead check in expected words (jump/skip check, up to 3 words)
    let foundJump = false;
    for (let d = 1; d <= 3; d++) {
      if (eIdx + d < expectedWords.length) {
        const nextExp = expectedWords[eIdx + d];
        if (compareWords(nextExp, spkWord) > 0.82) {
          // Words from eIdx to eIdx + d - 1 were skipped/forgotten!
          for (let k = eIdx; k < eIdx + d; k++) {
            alignments[k].status = 'forgotten';
          }
          // The word at eIdx + d is correct
          alignments[eIdx + d].status = 'correct';
          eIdx = eIdx + d + 1;
          sIdx++;
          foundJump = true;
          break;
        }
      }
    }

    if (foundJump) continue;

    // 3. If it's a mismatch and not the last word, it is wrong (replaced)
    if (sIdx < spokenWords.length - 1) {
      alignments[eIdx].status = 'wrong';
      alignments[eIdx].actualSpoken = spkWord;
      eIdx++;
      sIdx++;
    } else {
      // It is the last spoken word and doesn't match yet.
      // We don't mark it as wrong (red) to avoid flickering.
      if (sim > 0.5) {
        alignments[eIdx].status = 'correct';
      } else {
        alignments[eIdx].status = 'pending';
      }
      sIdx++;
    }
  }

  // Handle trailing punctuation at the end of the expected words if the spoken words ended
  while (eIdx < expectedWords.length) {
    if (normalizeArabicText(expectedWords[eIdx]).length === 0) {
      alignments[eIdx].status = 'correct';
    }
    eIdx++;
  }

  return alignments;
};

export const RecitationInterface: React.FC<RecitationInterfaceProps> = ({
  book,
  verses,
  onFinishSession,
  onExit,
}) => {
  // --- States ---
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sessionSpokenText, setSessionSpokenText] = useState<string>(''); // Accumulated text from previous sessions
  const [currentSpokenText, setCurrentSpokenText] = useState<string>(''); // Text from active recognition
  const [showWords, setShowWords] = useState<boolean>(false); // false = إخفاء الكلمات, true = إظهار الكلمات
  const [manuallySkipped, setManuallySkipped] = useState<Set<number>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Record<number, number>>({}); // index -> count of words revealed
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Refs for tracking changes and auto-scrolling
  const prevStatusesRef = useRef<Record<number, string>>({});
  const activeVerseRef = useRef<HTMLDivElement | null>(null);

  // --- Speech Service Integration ---
  const startListening = async () => {
    if (!speechService.isSupported()) {
      setError('التعرف على الصوت غير مدعوم في هذا المتصفح. يرجى استخدام متصفح يدعم Web Speech API مثل Google Chrome.');
      return;
    }

    setError(null);
    setIsListening(true);
    try {
      await speechService.startListening({
        onResult: (text: string) => {
          setCurrentSpokenText(text);
        },
        onError: (err: any) => {
          console.error('Speech recognition error:', err);
          setError('حدث خطأ في التعرف على الصوت. تأكد من إذن المايكروفون وحاول مجدداً.');
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    } catch (err: any) {
      console.error('Failed to start speech service:', err);
      setError('فشل تشغيل المايكروفون. يرجى التحقق من التوصيل والإعدادات.');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    try {
      const finalTranscript = await speechService.stopListening();
      if (finalTranscript) {
        setSessionSpokenText(prev => (prev ? prev + ' ' : '') + finalTranscript);
        setCurrentSpokenText('');
      }
    } catch (err) {
      console.error('Failed to stop speech service:', err);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // --- Alignment Algorithm ---
  const alignedVerses = useMemo(() => {
    const fullSpokenText = (sessionSpokenText + ' ' + currentSpokenText).trim();
    const spokenWords = fullSpokenText.split(/\s+/).filter(Boolean);
    const aligned: AlignedVerse[] = verses.map((_, idx) => ({
      verseIndex: idx,
      spokenWords: [],
      status: 'pending',
    }));

    let wordIdx = 0;
    let verseIdx = 0;

    while (verseIdx < verses.length) {
      // 1. Check if manually skipped
      if (manuallySkipped.has(verseIdx)) {
        aligned[verseIdx].status = 'skipped';
        aligned[verseIdx].spokenWords = [];
        verseIdx++;
        continue;
      }

      if (wordIdx >= spokenWords.length) {
        // No more spoken words, mark as pending (or reciting if it's the current target)
        aligned[verseIdx].status = 'pending';
        verseIdx++;
        continue;
      }

      // 2. Lookahead check for skipping verses
      let foundJump = false;
      let jumpToVerseIdx = verseIdx;
      let jumpToWordIdx = wordIdx;

      // Look ahead up to 20 spoken words, but ONLY look at the VERY NEXT unskipped verse

      let nextVerse = verseIdx + 1;
      while (nextVerse < verses.length && manuallySkipped.has(nextVerse)) {
        nextVerse++;
      }

      if (nextVerse < verses.length) {
        const verseWords = verses[nextVerse].text.trim().split(/\s+/).filter(word => normalizeArabicText(word).length > 0);
        if (verseWords.length > 0) {
          // Look ahead up to 25 spoken words
          const maxSpokenLook = Math.min(spokenWords.length, wordIdx + 25);
          
          // Check against the WHOLE verse (or up to 10 words) instead of just the first 3
          const wordsToCompare = Math.min(10, verseWords.length);
          
          for (let w = wordIdx; w < maxSpokenLook; w++) {
            let matchCount = 0;
            for (let offset = 0; offset < wordsToCompare; offset++) {
              if (w + offset < spokenWords.length) {
                const sim = compareWords(verseWords[offset], spokenWords[w + offset]);
                if (sim >= 0.7) { // Lower tolerance for jump to allow slight mispronunciations
                  matchCount++;
                }
              }
            }

            // If we find 3 matching words ANYWHERE in the first 10 words, it's definitely the next verse!
            // Or if the verse is very short (1-2 words), require all to match.
            const requiredMatches = Math.min(3, verseWords.length);
            if (matchCount >= requiredMatches) {
              foundJump = true;
              jumpToVerseIdx = nextVerse;
              jumpToWordIdx = w;
              break;
            }
          }
        }
      }

      if (foundJump) {
        // Words up to jump belong to the current verse
        aligned[verseIdx].spokenWords = spokenWords.slice(wordIdx, jumpToWordIdx);
        aligned[verseIdx].status = aligned[verseIdx].spokenWords.length > 0 ? 'recited' : 'skipped';

        // Intermediate verses are skipped
        for (let v = verseIdx + 1; v < jumpToVerseIdx; v++) {
          if (!manuallySkipped.has(v)) {
            aligned[v].status = 'skipped';
            aligned[v].spokenWords = [];
          }
        }

        verseIdx = jumpToVerseIdx;
        wordIdx = jumpToWordIdx;
      } else {
        // No jump: all remaining words go to current verse
        aligned[verseIdx].spokenWords = spokenWords.slice(wordIdx);
        aligned[verseIdx].status = 'reciting';
        wordIdx = spokenWords.length;
      }
    }

    // 3. Compute ComparisonResults and handle penalty for revealed words
    for (let v = 0; v < verses.length; v++) {
      const item = aligned[v];
      const expectedText = verses[v].text;
      const spokenSegment = item.spokenWords.join(' ');

      if (item.status === 'recited' || item.status === 'reciting') {
        const res = RecitationComparisonEngine.compare(expectedText, spokenSegment);

        // Apply penalty for revealed words (10% penalty per word, capped at 100%)
        const revealedCount = revealedWords[v] || 0;
        if (revealedCount > 0) {
          const totalWords = expectedText.trim().split(/\s+/).filter(Boolean).length;
          const penalty = Math.round((revealedCount / totalWords) * 100);
          res.accuracy = Math.max(0, res.accuracy - penalty);
        }

        item.result = res;

        // Auto-advance if accuracy is high
        if (item.status === 'reciting' && res.accuracy >= 80) {
          item.status = 'recited';
        }
      } else if (item.status === 'skipped') {
        const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
        item.result = {
          accuracy: 0,
          matchedWords: [],
          missingWords: expectedWords,
          extraWords: [],
          replacedWords: [],
          reorderedWords: [],
          totalWords: expectedWords.length,
          correctWords: 0,
        };
      }
    }

    return aligned;
  }, [verses, sessionSpokenText, currentSpokenText, manuallySkipped, revealedWords]);

  // Determine active verse index (first pending or reciting verse)
  const activeVerseIndex = useMemo(() => {
    const idx = alignedVerses.findIndex(item => item.status === 'reciting' || item.status === 'pending');
    return idx !== -1 ? idx : verses.length - 1;
  }, [alignedVerses, verses.length]);

  // --- Sound Effects & Status Trigger Effects ---
  useEffect(() => {
    const prevStatuses = prevStatusesRef.current;
    const currentStatuses: Record<number, string> = {};

    alignedVerses.forEach((v) => {
      currentStatuses[v.verseIndex] = v.status;
      const prev = prevStatuses[v.verseIndex];
      if (prev && prev !== v.status) {
        if (soundEnabled) {
          if (v.status === 'recited' && v.result && v.result.accuracy >= 75) {
            audioFeedback.playSuccess();
          } else if (v.status === 'skipped') {
            audioFeedback.playSkip();
          }
        }
      }
    });

    prevStatusesRef.current = currentStatuses;
  }, [alignedVerses, soundEnabled]);

  // Update visibleCount to always cover the active verse and some buffer
  useEffect(() => {
    if (activeVerseIndex + 15 > visibleCount) {
      setVisibleCount(prev => Math.max(prev, activeVerseIndex + 15));
    }
  }, [activeVerseIndex, visibleCount]);

  // Infinite scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      // If we are close to the bottom of the page (within 300px), load more verses
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        setVisibleCount(prev => Math.min(prev + 30, verses.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [verses.length]);

  // --- Auto-scroll active verse ---
  useEffect(() => {
    const el = activeVerseRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Check if the element is near the bottom of the viewport (bottom of card is below 70% of the viewport)
    const isNearBottom = rect.bottom > viewportHeight * 0.7;
    // Check if the element is not fully visible (e.g. top is cut off at the top header, or bottom is behind bottom control panel)
    const isNotFullyVisible = rect.top < 85 || rect.bottom > viewportHeight - 130;

    if (isNearBottom || isNotFullyVisible) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeVerseIndex]);

  // --- Interactive Helpers ---
  const handleRevealWord = () => {
    const activeIdx = activeVerseIndex;
    const verseWords = verses[activeIdx].text.trim().split(/\s+/).filter(Boolean);
    const currentRevealed = revealedWords[activeIdx] || 0;

    if (currentRevealed < verseWords.length) {
      setRevealedWords(prev => ({
        ...prev,
        [activeIdx]: currentRevealed + 1,
      }));
      if (soundEnabled) audioFeedback.playError();
    }
  };

  const handleSkipVerse = () => {
    const activeIdx = activeVerseIndex;
    setManuallySkipped(prev => {
      const next = new Set(prev);
      next.add(activeIdx);
      return next;
    });
    if (soundEnabled) audioFeedback.playSkip();
  };

  const handleReset = () => {
    if (window.confirm('هل تريد بالتأكيد إعادة بدء جلسة التسميع؟')) {
      setSessionSpokenText('');
      setCurrentSpokenText('');
      setManuallySkipped(new Set());
      setRevealedWords({});
      prevStatusesRef.current = {};
      stopListening();
    }
  };

  const handleFinish = () => {
    // Generate final results record
    const finalResults: Record<number, ComparisonResult> = {};
    alignedVerses.forEach((item) => {
      const words = verses[item.verseIndex].text.trim().split(/\s+/).filter(Boolean);
      
      // Determine if the verse is unread
      let isUnread = false;
      
      if (item.verseIndex > activeVerseIndex) {
        isUnread = true;
      } else if (item.verseIndex === activeVerseIndex) {
        // If it's the active verse and listening, but no words were actually spoken, it's unread
        if (item.status === 'reciting' && item.spokenWords.length === 0) {
          isUnread = true;
        }
      }
      
      if (isUnread) {
        finalResults[item.verseIndex] = {
          accuracy: 0,
          matchedWords: [],
          missingWords: [],
          extraWords: [],
          replacedWords: [],
          reorderedWords: [],
          totalWords: words.length,
          correctWords: 0,
          isNotRead: true,
        };
      } else if (item.result) {
        finalResults[item.verseIndex] = item.result;
      } else {
        // Fallback for pending or skipped verses
        finalResults[item.verseIndex] = {
          accuracy: 0,
          matchedWords: [],
          missingWords: words,
          extraWords: [],
          replacedWords: [],
          reorderedWords: [],
          totalWords: words.length,
          correctWords: 0,
        };
      }
    });
    stopListening();
    onFinishSession(finalResults);
  };

  const totalVerses = verses.length;
  const finishedCount = alignedVerses.filter(item => item.status === 'recited' || item.status === 'skipped').length;
  const progressPercentage = (finishedCount / totalVerses) * 100;
  
  const currentFullSpokenText = (sessionSpokenText + ' ' + currentSpokenText).trim();

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 md:p-6 dir-rtl text-right select-none min-h-[85vh] pb-36 md:pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full border-b pb-4 bg-background/95 backdrop-blur-xs sticky top-0 z-10 pt-2">
        <button
          onClick={onExit}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-all active:scale-95 border"
          aria-label="خروج"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-base font-black text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            {book.title}
          </span>
          <span className="text-xs text-muted-foreground font-semibold">تسميع تفاعلي مستمر</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="flex flex-col gap-3 w-full bg-card border p-4 rounded-2xl shadow-xs">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            الأبيات المكتملة: {finishedCount} / {totalVerses}
          </span>
          <span>البيت الحالي: {activeVerseIndex + 1} من {totalVerses}</span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-secondary" />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 text-destructive rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Scrollable Verses List */}
      <div className="flex flex-col gap-4 my-2">
        {alignedVerses.slice(0, visibleCount).map((item) => {
          const idx = item.verseIndex;
          const verse = verses[idx];
          const isActive = idx === activeVerseIndex;
          const isSkipped = item.status === 'skipped';
          const isRecited = item.status === 'recited';
          const isReciting = item.status === 'reciting';
          
          const words = verse.text.trim().split(/\s+/).filter(Boolean);
          const revealedCount = revealedWords[idx] || 0;

          return (
            <div
              key={verse.id}
              ref={isActive ? activeVerseRef : null}
              className={`p-5 md:p-6 border rounded-2xl bg-card shadow-xs transition-all duration-300 relative overflow-hidden flex flex-col gap-4 ${
                isActive 
                  ? 'border-primary ring-2 ring-primary/20 shadow-md scale-[1.01] bg-primary/2 dark:bg-primary/5' 
                  : isSkipped 
                    ? 'border-amber-200/50 bg-amber-50/10 dark:border-amber-950/20 dark:bg-amber-950/5' 
                    : isRecited 
                      ? 'border-emerald-200/50 bg-emerald-50/5 dark:border-emerald-950/20 dark:bg-emerald-950/2'
                      : 'border-muted opacity-60'
              }`}
            >
              {/* Card Meta Header */}
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isActive 
                    ? 'bg-primary/10 border-primary text-primary animate-pulse'
                    : isSkipped 
                      ? 'bg-amber-100/50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      : isRecited 
                        ? 'bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                }`}>
                  البيت {verse.order}
                </span>

                {/* Score badge for recited verses */}
                {isRecited && item.result && (
                  <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                    دقة الحفظ: {item.result.accuracy}%
                  </span>
                )}
                {isSkipped && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                    منسي / تم تخطيه
                  </span>
                )}
                {isReciting && (
                  <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    جاري الاستماع للبيت...
                  </span>
                )}
              </div>

              {/* Verse Text Area */}
              <div className="text-center py-2 min-h-[60px] flex items-center justify-center">
                <p className="text-2xl md:text-3xl font-bold font-arabic leading-loose text-center flex flex-wrap flex-row justify-center gap-x-2.5 gap-y-3 select-text">
                  {/* Handle Active Reciting Verse (Real-time sequential comparison!) */}
                  {isReciting && (() => {
                    const activeAlignment = alignActiveVerse(verse.text, item.spokenWords.join(' '));
                    return activeAlignment.map((alignedWord, wIdx) => {
                      const isWordRevealed = showWords || wIdx < revealedCount;
                      const isPunctuation = normalizeArabicText(alignedWord.word).length === 0;
                      
                      if (alignedWord.status === 'correct' || isPunctuation) {
                        return (
                          <span key={wIdx} className="text-emerald-600 dark:text-emerald-400 font-semibold transition-colors duration-300">
                            {alignedWord.word}
                          </span>
                        );
                      }
                      
                      if (alignedWord.status === 'wrong' && alignedWord.actualSpoken) {
                        return (
                          <span key={wIdx} className="relative group flex flex-col items-center">
                            <span className="text-red-500 dark:text-red-400 font-semibold line-through decoration-red-655 cursor-help decoration-2">
                              {alignedWord.word}
                            </span>
                            <span className="absolute -top-7 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-sans">
                              نطقت: {alignedWord.actualSpoken}
                            </span>
                          </span>
                        );
                      }
                      
                      if (alignedWord.status === 'forgotten') {
                        return (
                          <span key={wIdx} className="text-amber-500 dark:text-amber-400 font-semibold line-through decoration-amber-450/50 decoration-1">
                            {alignedWord.word}
                          </span>
                        );
                      }
                      
                      // Status is pending
                      if (isWordRevealed) {
                        return (
                          <span key={wIdx} className="text-foreground transition-colors duration-300">
                            {alignedWord.word}
                          </span>
                        );
                      }
                      
                      // Elegant hide words design
                      return (
                        <span 
                          key={wIdx} 
                          className="relative inline-flex flex-col items-center justify-center mx-1 transition-all duration-300"
                          title="كلمة مخفية"
                        >
                          <span className="opacity-0">{alignedWord.word}</span>
                          <span className="absolute bottom-1 w-[90%] h-3 bg-muted-foreground/20 rounded-md"></span>
                        </span>
                      );
                    });
                  })()}

                  {/* Handle Pending / Untouched Verse */}
                  {item.status === 'pending' && words.map((w, wIdx) => {
                    const isWordRevealed = showWords || wIdx < revealedCount;
                    const isPunctuation = normalizeArabicText(w).length === 0;

                    if (isWordRevealed || isPunctuation) {
                      return (
                        <span key={wIdx} className="text-muted-foreground transition-colors duration-300">
                          {w}
                        </span>
                      );
                    }
                    return (
                      <span 
                        key={wIdx} 
                        className="relative inline-flex flex-col items-center justify-center mx-1 transition-all duration-300"
                        title="كلمة مخفية"
                      >
                        <span className="opacity-0">{w}</span>
                        <span className="absolute bottom-1 w-[90%] h-3 bg-muted-foreground/20 rounded-md"></span>
                      </span>
                    );
                  })}

                  {/* Handle Recited Verse: Show matched, replaced, missing */}
                  {isRecited && item.result && words.map((word, wIdx) => {
                    const isPunctuation = normalizeArabicText(word).length === 0;

                    // Check matches
                    const isMatched = item.result!.matchedWords.some(m => m.expectedIndex === wIdx) || isPunctuation;
                    if (isMatched) {
                      return (
                        <span key={wIdx} className="text-emerald-600 dark:text-emerald-400 font-semibold transition-colors">
                          {word}
                        </span>
                      );
                    }

                    // Check replacements
                    const replacement = item.result!.replacedWords.find(r => r.expectedIndex === wIdx);
                    if (replacement) {
                      return (
                        <span key={wIdx} className="relative group flex flex-col items-center">
                          <span className="text-red-500 dark:text-red-400 font-semibold line-through decoration-red-650 cursor-help decoration-2">
                            {word}
                          </span>
                          <span className="absolute -top-7 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            نطقت: {replacement.actual}
                          </span>
                        </span>
                      );
                    }

                    // Check missing words: Yellow (forgotten)
                    return (
                      <span key={wIdx} className="text-amber-500 dark:text-amber-400 font-semibold line-through decoration-amber-400/50 decoration-1">
                        {word}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* Live transcript indicator inside active verse */}
              {isReciting && currentFullSpokenText && (
                <div className="w-full mt-2 p-3 bg-primary/5 border border-primary/10 rounded-xl text-center font-arabic text-sm animate-pulse text-primary/95 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-sans font-bold">النص المسموع حالياً:</span>
                  <span className="text-base font-semibold">{currentFullSpokenText}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating/Fixed Bottom Control Panel */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t py-4 px-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] z-20 flex flex-col gap-2.5 items-center">
        {/* Real-time Spoken Text Box */}
        {isListening && (
          <div className="w-full max-w-lg bg-card/95 border border-primary/20 p-3.5 rounded-2xl shadow-lg flex items-center gap-3.5 animate-slide-up mb-1 backdrop-blur-md">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            </div>
            <div className="flex-1 text-right flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-sans font-black tracking-wider uppercase">الكلمات المسموعة حالياً (مباشر):</span>
              <p className="text-sm font-bold font-arabic text-foreground leading-relaxed min-h-[20px]">
                {currentFullSpokenText || <span className="text-muted-foreground/45 font-sans text-xs font-semibold">تكلم الآن، جاري الاستماع...</span>}
              </p>
            </div>
          </div>
        )}

        {/* Helper control bar (Skip / Reveal) */}
        {isListening && (
          <div className="flex items-center justify-center gap-4 w-full max-w-lg mb-1.5 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevealWord}
              className="flex-1 gap-1.5 text-xs font-bold py-4 border-amber-200/60 bg-amber-50/20 text-amber-700 hover:bg-amber-50 dark:border-amber-950 dark:text-amber-400"
            >
              <HelpCircle className="w-4 h-4" />
              كشف الكلمة التالية
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipVerse}
              className="flex-1 gap-1.5 text-xs font-bold py-4 border-red-200/60 bg-red-50/20 text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-400"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              تخطي هذا البيت
            </Button>
          </div>
        )}

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between w-full max-w-lg gap-2 sm:gap-4 px-2">
          {/* Left Buttons: Toggle words visibility & Reset */}
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل الصوت'}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              title="إعادة ضبط الجلسة"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Center: Main Record/Stop Mic Button */}
          <div className="relative">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes micPulse {
                0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                70%  { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
              }
              .mic-listening-active {
                animation: micPulse 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1);
              }
            `}} />
            <button
              onClick={toggleListening}
              className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 transition-all duration-300 outline-none ${
                isListening
                  ? 'bg-red-500 border-red-200 text-white mic-listening-active hover:bg-red-600'
                  : 'bg-primary border-primary/20 text-primary-foreground hover:bg-primary/95 shadow-lg active:scale-95'
              }`}
              title={isListening ? 'إيقاف مؤقت' : 'بدء التسميع'}
            >
              {isListening ? <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

          {/* Right Buttons: Hide/Show Words & Finish */}
          <div className="flex gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowWords(!showWords)}
              title={showWords ? 'إخفاء كلمات المتن' : 'إظهار كلمات المتن'}
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border ${showWords ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20' : ''}`}
            >
              {showWords ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            <Button
              onClick={handleFinish}
              className="h-10 px-3 sm:h-12 sm:px-5 font-bold rounded-full gap-1 sm:gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 text-[10px] sm:text-xs"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              إنهاء التسميع
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
