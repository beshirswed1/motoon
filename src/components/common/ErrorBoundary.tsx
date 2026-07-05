'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center dir-rtl select-none">
          <div className="relative flex flex-col items-center max-w-md w-full bg-card border border-muted p-8 rounded-3xl shadow-xl animate-in fade-in duration-300">
            {/* Warning Icon Glow */}
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-extrabold text-foreground mb-3 font-arabic">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-sm text-muted-foreground mb-6 font-arabic leading-relaxed">
              حصلت مشكلة أثناء تحميل هذه الصفحة. الرجاء محاولة إعادة تحميل الصفحة أو العودة إلى الواجهة الرئيسية.
            </p>

            {/* Error Message Collapse */}
            {this.state.error && (
              <div className="w-full bg-muted/65 border rounded-2xl p-4 mb-6 text-right text-xs text-destructive font-mono truncate max-h-24 overflow-y-auto">
                <span className="font-bold">تفاصيل الخطأ:</span> {this.state.error.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={this.handleReset}
                className="flex-1 gap-2 font-bold py-5 rounded-xl text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="flex-1 gap-2 font-bold py-5 rounded-xl text-xs"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
