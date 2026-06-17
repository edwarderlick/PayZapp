import { toast } from 'react-hot-toast'
import { Zap } from 'lucide-react'

export const showTxToast = (hash: string, explorerUrl: string) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-sm w-full bg-bgBase border border-borderSubtle rounded-none pointer-events-auto flex items-center p-6 gap-4`}
    >
      <div className="border border-borderAccent p-3 rounded-full">
        <Zap className="w-4 h-4 text-textPrimary" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest font-medium text-textPrimary">Transaction Sent</p>
        <a 
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-textSecondary hover:text-textPrimary transition-colors font-mono mt-1 block"
        >
          {hash.slice(0, 8)}...{hash.slice(-6)} ↗
        </a>
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="text-textSecondary hover:text-textPrimary"
      >
        ✕
      </button>
    </div>
  ), { duration: 8000 })
}
