import React from 'react';
import type { ComparisonResult } from '@/types';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';

interface ResultMetricsProps {
  result: ComparisonResult;
}

export const ResultMetrics: React.FC<ResultMetricsProps> = ({ result }) => {
  const { correctWords, missingWords, extraWords, replacedWords, totalWords } = result;

  const metrics = [
    {
      label: 'الكلمات الصحيحة',
      value: `${correctWords} / ${totalWords}`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      colorClass: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'الكلمات المبدلة',
      value: replacedWords.length,
      icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
      colorClass: 'border-red-100 dark:border-red-950 bg-red-50/30 dark:bg-red-950/10 text-red-700 dark:text-red-400',
    },
    {
      label: 'الكلمات المنسية',
      value: missingWords.length,
      icon: <AlertTriangle className="w-5 h-5 text-slate-500 dark:text-slate-400" />,
      colorClass: 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 text-slate-700 dark:text-slate-400',
    },
    {
      label: 'الكلمات الزائدة',
      value: extraWords.length,
      icon: <HelpCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      colorClass: 'border-amber-100 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full my-2">
      {metrics.map((metric, i) => (
        <div
          key={i}
          className={`flex flex-col gap-1.5 p-3.5 border rounded-xl shadow-xs transition-all duration-300 hover:scale-[1.02] ${metric.colorClass}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-muted-foreground select-none">{metric.label}</span>
            {metric.icon}
          </div>
          <span className="text-xl font-bold tracking-tight text-right font-arabic">{metric.value}</span>
        </div>
      ))}
    </div>
  );
};
