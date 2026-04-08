import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ErrorToastProps {
  message: string | null;
  onDismiss?: () => void;
  autoDismiss?: boolean;
}

export const ErrorToast = ({ message, onDismiss, autoDismiss = true }: ErrorToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      if (autoDismiss) {
        const t = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, 5000);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [message, autoDismiss, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div className="flex items-start gap-3 bg-[#1a0800] border border-[#E25127]/40 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-300 shadow-[0_0_30px_rgba(226,81,39,0.15)]">
      <div className="bg-[#E25127]/20 p-2 rounded-xl shrink-0">
        <AlertTriangle className="text-[#E25127]" size={16} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#E25127]">
          Error
        </p>
        <p className="text-[11px] text-white/70 mt-0.5 font-medium">
          {message}
        </p>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="text-white/20 hover:text-white/60 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};