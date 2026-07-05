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

function getMotivationalText(score: number): string {
  if (score === 100) return 'بسم الله الرحمن الرحيم\nأتمّ هذا الطالب حفظ هذا المتن الشريف بإتقان تام وإجادة كاملة\nنسأل الله أن يبارك في علمه وأن ينفع به الإسلام والمسلمين\n«وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا»';
  if (score >= 97) return 'بسم الله الرحمن الرحيم\nأتمّ هذا الطالب حفظ هذا المتن الشريف بدرجة ممتازة وإجادة عالية\nنسأل الله أن يثبّت حفظه ويبارك في علمه\n«مَن يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ»';
  return 'بسم الله الرحمن الرحيم\nأتمّ هذا الطالب حفظ هذا المتن الشريف بدرجة مشرّفة\nنسأل الله أن يكون عوناً له في مسيرته العلمية\n«وَقُل رَّبِّ زِدْنِي عِلْمًا»';
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

  // ─── Background ───────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FEFEFE');
  bg.addColorStop(0.5, '#F8F4EE');
  bg.addColorStop(1, '#FEFEFE');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ─── Outer border (gold) ───────────────────────
  const outerM = 20;
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 6;
  roundRect(ctx, outerM, outerM, W - outerM * 2, H - outerM * 2, 24);
  ctx.stroke();

  // ─── Inner border (thin) ──────────────────────
  const innerM = 34;
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  roundRect(ctx, innerM, innerM, W - innerM * 2, H - innerM * 2, 18);
  ctx.stroke();

  // ─── Corner ornaments ─────────────────────────
  drawCornerOrnament(ctx, outerM + 10, outerM + 10, 60);
  drawCornerOrnament(ctx, W - outerM - 10, outerM + 10, 60, true);
  drawCornerOrnament(ctx, outerM + 10, H - outerM - 10, 60, false, true);
  drawCornerOrnament(ctx, W - outerM - 10, H - outerM - 10, 60, true, true);

  // ─── Header band ──────────────────────────────
  const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
  headerGrad.addColorStop(0, '#0F766E');
  headerGrad.addColorStop(0.5, '#0d9488');
  headerGrad.addColorStop(1, '#0F766E');
  ctx.fillStyle = headerGrad;
  roundRect(ctx, 50, 50, W - 100, 120, 14);
  ctx.fill();

  // ─── Platform name ────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 46px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('منصة متون', W / 2, 100);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `20px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText('للتعليم الإسلامي وحفظ المتون الشرعية', W / 2, 135);

  // ─── Decorative divider ───────────────────────
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 185);
  ctx.lineTo(W - 100, 185);
  ctx.stroke();

  // Diamond in center
  ctx.fillStyle = '#D4AF37';
  ctx.save();
  ctx.translate(W / 2, 185);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();

  // ─── Certificate title ────────────────────────
  ctx.fillStyle = '#C9A84C';
  ctx.font = `bold 30px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('شهادة إتمام وإتقان', W / 2, 230);

  // ─── Motivational text ───────────────────────
  const motText = getMotivationalText(data.score);
  const motLines = motText.split('\n');
  ctx.fillStyle = '#374151';
  ctx.font = `16px 'IBM Plex Sans Arabic', Arial`;
  motLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, 270 + i * 26);
  });

  // ─── Student name section ─────────────────────
  ctx.fillStyle = '#111827';
  ctx.font = `bold 44px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(data.studentName, W / 2, 420);

  // Underline
  const nameW = ctx.measureText(data.studentName).width;
  ctx.strokeStyle = getGradeColor(data.score);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameW / 2, 432);
  ctx.lineTo(W / 2 + nameW / 2, 432);
  ctx.stroke();

  // ─── Book name ────────────────────────────────
  ctx.fillStyle = '#374151';
  ctx.font = `22px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`حفظ وأتقن متن: "${data.bookTitle}"`, W / 2, 470);

  ctx.fillStyle = '#6B7280';
  ctx.font = `16px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`للإمام ${data.bookAuthor}`, W / 2, 498);

  // ─── Grade badge ──────────────────────────────
  const gradeColor = getGradeColor(data.score);
  const gradeLabel = getGradeLabel(data.score);
  const badgeY = 520;
  const badgeW = 240;
  const badgeH = 50;
  const badgeX = W / 2 - badgeW / 2;

  ctx.fillStyle = gradeColor + '18';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 25);
  ctx.fill();
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 25);
  ctx.stroke();

  ctx.fillStyle = gradeColor;
  ctx.font = `bold 22px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText(`${data.score}% — ${gradeLabel}`, W / 2, badgeY + 32);

  // ─── Horizontal divider ───────────────────────
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 595);
  ctx.lineTo(W - 80, 595);
  ctx.stroke();

  // ─── Footer info row ─────────────────────────
  ctx.fillStyle = '#6B7280';
  ctx.font = `14px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'right';
  ctx.fillText(`التاريخ: ${data.date}`, W - 100, 635);
  ctx.fillText(`${data.hijriDate} هـ`, W - 100, 655);

  ctx.textAlign = 'left';
  ctx.fillText(`رقم الشهادة: ${data.certId}`, 100, 635);

  ctx.textAlign = 'center';
  ctx.fillText('التحقق من الشهادة: motoon.app', W / 2, 645);

  // ─── QR Code ─────────────────────────────────
  try {
    const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, {
      width: 100,
      margin: 1,
      color: { dark: '#0F766E', light: '#FFFFFF' },
    });
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, W / 2 - 50, 670, 100, 100);
        resolve();
      };
      qrImg.src = qrDataUrl;
    });
  } catch {}

  // ─── Platform stamp ───────────────────────────
  ctx.save();
  ctx.translate(W - 160, H - 140);
  ctx.strokeStyle = '#0F766E';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, 55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#0F766E';
  ctx.font = `bold 13px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('منصة متون', 0, -10);
  ctx.font = `11px 'IBM Plex Sans Arabic', Arial`;
  ctx.fillText('motoon.app', 0, 8);
  ctx.fillText('✦ ختم رسمي ✦', 0, 26);
  ctx.restore();

  // ─── QR label ─────────────────────────────────
  ctx.fillStyle = '#9CA3AF';
  ctx.font = `11px 'IBM Plex Sans Arabic', Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('امسح للتحقق', W / 2, 785);
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
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
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
