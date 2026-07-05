import { Mic, Square, Loader2 } from 'lucide-react';

interface MicrophoneButtonProps {
  state: 'idle' | 'listening' | 'processing';
  onClick: () => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ state, onClick }) => {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  return (
    <div className="flex flex-col items-center justify-center gap-3 my-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes micPulse {
          0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70%  { transform: scale(1.08); box-shadow: 0 0 0 18px rgba(239, 68, 68, 0); }
          100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .mic-btn-listening {
          animation: micPulse 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}} />

      <button
        onClick={isProcessing ? undefined : onClick}
        disabled={isProcessing}
        aria-label={isListening ? "إيقاف التسجيل" : "بدء التسجيل"}
        className={`
          relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-300 outline-none
          ${isListening 
            ? 'bg-red-500 border-red-200 text-white mic-btn-listening hover:bg-red-600' 
            : isProcessing 
              ? 'bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed'
              : 'bg-primary border-primary/20 text-primary-foreground hover:bg-primary/95 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
          }
        `}
      >
        {isListening && <Square className="w-8 h-8 fill-current" />}
        {isProcessing && <Loader2 className="w-8 h-8 animate-spin" />}
        {state === 'idle' && <Mic className="w-9 h-9" />}
      </button>

      <span className="text-sm font-semibold tracking-wide text-muted-foreground select-none">
        {isListening && "انقر للتوقف والتدقيق"}
        {isProcessing && "جاري معالجة الصوت..."}
        {state === 'idle' && "انقر وابدأ التلاوة"}
      </span>
    </div>
  );
};
