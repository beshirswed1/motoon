'use client';
import React from 'react';

import { useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';

interface CertificateData {
  studentName: string;
  bookTitle: string;
  bookAuthor: string;
  score: number;
  date: string;
  hijriDate: string;
  certId: string;
  verifyUrl: string;
  category?: string;
}

interface CertificateCanvasProps {
  data: CertificateData;
  onReady?: (canvas: HTMLCanvasElement) => void;
}

function getGradeLabel(score: number): string {
  if (score === 100) return 'بالدرجة التامة';
  if (score >= 97) return 'ممتاز';
  if (score >= 95) return 'جيد جداً';
  return 'جيد';
}

function getGradeColor(score: number): string {
  if (score === 100) return '#7c3aed';
  if (score >= 97) return '#059669';
  return '#0F766E';
}

/** قاموس الآيات والأحاديث حسب تصنيف المتن */
const CATEGORY_VERSES: Record<string, { text: string; source: string }> = {
  'quran-sciences': {
    text: '﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾',
    source: 'سورة الحجر: ٩',
  },
  'hadith-sciences': {
    text: '«نَضَّرَ اللهُ امرأً سَمِعَ مِنَّا حَدِيثًا فَحَفِظَهُ حَتَّى يُبَلِّغَهُ»',
    source: 'رواه الترمذي',
  },
  'aqeedah': {
    text: '﴿فَاعْلَمْ أَنَّهُ لَا إِلَٰهَ إِلَّا اللَّهُ﴾',
    source: 'سورة محمد: ١٩',
  },
  'fiqh': {
    text: '«مَن يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ»',
    source: 'متفق عليه',
  },
  'arabic-language': {
    text: '﴿إِنَّا أَنزَلْنَاهُ قُرْآنًا عَرَبِيًّا لَّعَلَّكُمْ تَعْقِلُونَ﴾',
    source: 'سورة يوسف: ٢',
  },
  'seerah-tarikh': {
    text: '﴿لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ﴾',
    source: 'سورة الأحزاب: ٢١',
  },
  'akhlaq-tazkiya': {
    text: '«إنَّ مِنْ أَحَبِّكُمْ إِلَيَّ وَأَقْرَبِكُمْ مِنِّي مَجْلِسًا يَوْمَ الْقِيَامَةِ أَحَاسِنُكُمْ أَخْلَاقًا»',
    source: 'رواه الترمذي',
  },
  'dawah': {
    text: '﴿ادْعُ إِلَى سَبِيلِ رَبِّكَ بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ﴾',
    source: 'سورة النحل: ١٢٥',
  },
  'mantiq': {
    text: '﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾',
    source: 'سورة طه: ١١٤',
  },
};

/** الحصول على الآية/الحديث المناسب */
function getCategoryVerse(category?: string): { text: string; source: string } {
  if (category && CATEGORY_VERSES[category]) {
    return CATEGORY_VERSES[category];
  }
  // Default
  return {
    text: '«مَن سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»',
    source: 'رواه مسلم',
  };
}

/** دعاء مناسب حسب الدرجة */
function getDua(score: number): string {
  if (score === 100) return 'بارك الله فيكم ونفع بكم، وجعل هذا الحفظ حجة لكم لا عليكم، وثبّته في صدوركم وزادكم علماً وعملاً';
  if (score >= 97) return 'بارك الله فيكم ونفع بكم، وجعل هذا الحفظ نوراً ورفعة لكم وزادكم من فضله وتوفيقه';
  return 'بارك الله فيكم ونفع بكم، وجعل هذا الإنجاز عوناً لكم في مسيرتكم العلمية المباركة';
}

export async function drawCertificate(
  canvas: HTMLCanvasElement,
  data: CertificateData
): Promise<void> {
  const W = 1200;
  const H = 850;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ─── Background ─────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FEFEFE');
  bg.addColorStop(0.3, '#FBF8F1');
  bg.addColorStop(0.7, '#F8F4EE');
  bg.addColorStop(1, '#FEFEFE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle pattern overlay
  ctx.fillStyle = 'rgba(212, 175, 55, 0.02)';
  for (let i = 0; i < W; i += 40) {
    for (let j = 0; j < H; j += 40) {
      ctx.fillRect(i, j, 1, 1);
    }
  }

  // ─── Outer border (gold) ────────────────────
  const outerM = 18;
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 5;
  roundRect(ctx, outerM, outerM, W - outerM * 2, H - outerM * 2, 20);
  ctx.stroke();

  // ─── Second border ─────────────────────────
  const m2 = 26;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  roundRect(ctx, m2, m2, W - m2 * 2, H - m2 * 2, 16);
  ctx.stroke();

  // ─── Inner border ──────────────────────────
  const innerM = 34;
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, innerM, innerM, W - innerM * 2, H - innerM * 2, 12);
  ctx.stroke();

  // ─── Corner ornaments ─────────────────────
  drawCornerOrnament(ctx, outerM + 8, outerM + 8, 65);
  drawCornerOrnament(ctx, W - outerM - 8, outerM + 8, 65, true);
  drawCornerOrnament(ctx, outerM + 8, H - outerM - 8, 65, false, true);
  drawCornerOrnament(ctx, W - outerM - 8, H - outerM - 8, 65, true, true);

  // ─── Header band ──────────────────────────
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, '#0d5c56');
  headerGrad.addColorStop(0.3, '#0F766E');
  headerGrad.addColorStop(0.5, '#14988e');
  headerGrad.addColorStop(0.7, '#0F766E');
  headerGrad.addColorStop(1, '#0d5c56');
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 48, 48, W - 96, 110, 14);
  ctx.fill();

  // Header inner line
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, 52, 52, W - 104, 102, 12);
  ctx.stroke();

  // ─── Platform name ────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 44px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('منصة متون', W / 2, 96);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `18px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText('للتعليم الإسلامي وحفظ المتون الشرعية', W / 2, 128);

  // ─── Decorative divider ────────────────────
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(150, 178);
  ctx.lineTo(W - 150, 178);
  ctx.stroke();

  // Diamond ornaments
  ctx.fillStyle = '#D4AF37';
  [W / 2, W / 2 - 80, W / 2 + 80].forEach((x, i) => {
    ctx.save();
    ctx.translate(x, 178);
    ctx.rotate(Math.PI / 4);
    const size = i === 0 ? 8 : 4;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  });

  // ─── Certificate title ────────────────────
  ctx.fillStyle = '#C9A84C';
  ctx.font = `bold 28px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('شهادة إتمام وإتقان', W / 2, 218);

  // ─── Main certificate body (new format) ────
  const gradeColor = getGradeColor(data.score);
  const gradeLabel = getGradeLabel(data.score);

  // Line 1: أتم الطالب
  ctx.fillStyle = '#4B5563';
  ctx.font = `20px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText('أتم الطالب:', W / 2, 258);

  // Student name (large, bold)
  ctx.fillStyle = '#111827';
  ctx.font = `bold 42px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(data.studentName, W / 2, 310);

  // Name underline decoration
  const nameW = ctx.measureText(data.studentName).width;
  const lineGrad = ctx.createLinearGradient(W / 2 - nameW / 2, 0, W / 2 + nameW / 2, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.2, gradeColor);
  lineGrad.addColorStop(0.8, gradeColor);
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameW / 2 - 20, 320);
  ctx.lineTo(W / 2 + nameW / 2 + 20, 320);
  ctx.stroke();

  // Line 2: حفظ متن
  ctx.fillStyle = '#4B5563';
  ctx.font = `20px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText('حفظ متن:', W / 2, 360);

  // Book title
  ctx.fillStyle = '#1F2937';
  ctx.font = `bold 28px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`"${data.bookTitle}"`, W / 2, 398);

  // Author
  ctx.fillStyle = '#6B7280';
  ctx.font = `16px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`للإمام ${data.bookAuthor}`, W / 2, 425);

  // ─── Grade badge ──────────────────────────
  const badgeY = 445;
  const badgeW = 280;
  const badgeH = 46;
  const badgeX = W / 2 - badgeW / 2;

  // Badge background
  ctx.fillStyle = gradeColor + '12';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 23);
  ctx.fill();
  ctx.strokeStyle = gradeColor + '60';
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 23);
  ctx.stroke();

  ctx.fillStyle = gradeColor;
  ctx.font = `bold 20px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`بتقدير: ${gradeLabel} — ${data.score}%`, W / 2, badgeY + 30);

  // ─── Dua ──────────────────────────────────
  const dua = getDua(data.score);
  ctx.fillStyle = '#6B7280';
  ctx.font = `14px 'IBM Plex Sans Arabic', Arial`;
  // Word-wrap the dua
  const duaLines = wrapText(ctx, dua, W - 200);
  duaLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 516 + i * 22);
  });

  const duaEndY = 516 + duaLines.length * 22;

  // ─── Dynamic verse/hadith ─────────────────
  const verse = getCategoryVerse(data.category);
  ctx.fillStyle = '#0F766E';
  ctx.font = `bold 15px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(verse.text, W / 2, duaEndY + 18);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = `12px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`— ${verse.source}`, W / 2, duaEndY + 38);

  // ─── Horizontal divider ────────────────────
  const divY = duaEndY + 56;
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, divY);
  ctx.lineTo(W - 80, divY);
  ctx.stroke();

  // ─── Footer info row ──────────────────────
  const footerY = divY + 30;
  ctx.fillStyle = '#6B7280';
  ctx.font = `13px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'right';
  ctx.fillText(`التاريخ: ${data.date}`, W - 100, footerY);
  ctx.fillText(`${data.hijriDate} هـ`, W - 100, footerY + 18);

  ctx.textAlign = 'left';
  ctx.fillText(`رقم الشهادة: ${data.certId}`, 100, footerY);

  ctx.textAlign = 'center';
  ctx.fillText('التحقق من الشهادة: motoon.com.tr', W / 2, footerY + 8);

  // ─── QR Code ──────────────────────────────
  const qrY = footerY + 30;
  try {
    const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
      width: 90,
      margin: 1,
      color: { dark: '#0F766E', light: '#FFFFFF' },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, W / 2 - 45, qrY, 90, 90);
        resolve();
      };
      qrImg.src = qrDataUrl;
    });
  } catch {}

  // QR label
  ctx.fillStyle = '#9CA3AF';
  ctx.font = `10px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('امسح للتحقق', W / 2, qrY + 100);

  // ─── Platform Logo (Instead of stamp) ───────
  try {
    const logoImg = new Image();
    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        // Draw platform logo elegantly in the bottom right corner
        ctx.drawImage(logoImg, W - 200, H - 150, 90, 90);
        resolve();
      };
      logoImg.onerror = () => {
        resolve();
      };
      logoImg.src = '/logo.png';
    });
  } catch {}
}

/** Word wrap helper */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ─── Helper: Rounded rectangle ────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Helper: Corner ornament ──────────────────
function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  flipX = false, flipY = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = '#D4AF37';

  // L-shape lines
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();

  // Inner parallel lines
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.lineTo(size - 5, 8);
  ctx.moveTo(8, 8);
  ctx.lineTo(8, size - 5);
  ctx.stroke();

  // Corner dot
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Small diamond
  ctx.save();
  ctx.translate(size * 0.5, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-2.5, -2.5, 5, 5);
  ctx.restore();

  ctx.save();
  ctx.translate(0, size * 0.5);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-2.5, -2.5, 5, 5);
  ctx.restore();

  ctx.restore();
}

export function CertificateCanvas({ data, onReady }: CertificateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  const render = useCallback(async () => {
    if (!canvasRef.current || rendered) return;
    await drawCertificate(canvasRef.current, data);
    setRendered(true);
    onReady?.(canvasRef.current);
  }, [data, rendered, onReady]);

  // Auto-render when component mounts
  React.useEffect(() => { render(); }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-border/30"
      style={{ aspectRatio: '1200/850' }}
    />
  );
}

export type { CertificateData };
export { getGradeLabel, getGradeColor };
