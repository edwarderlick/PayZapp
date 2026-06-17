import { SplitExpense } from '../../../types'
import { Trash2 } from 'lucide-react'

export function ExpenseRow({ expense, isCreator, splitCount, currentAddress, onDelete }: { expense: SplitExpense, isCreator: boolean, splitCount: number, currentAddress?: string, onDelete?: () => void }) {
  const isPayer = currentAddress && currentAddress.toLowerCase() === expense.paid_by.toLowerCase()

  return (
    <div className="flex items-center justify-between bg-[#09090B] hover:bg-white/[0.03] transition-all duration-300 p-6 rounded-3xl border border-white/5 group relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-[2px] bg-white/10 group-hover:bg-white/30 transition-colors" />
      <div className="flex flex-col gap-2 pl-2">
        <span className="font-sans font-bold text-base tracking-wide text-white/90">{expense.description}</span>
        <span className="text-[10px] text-white/30 uppercase tracking-[0.1em] font-bold flex items-center gap-2">
          Paid by <span className="font-mono text-white/60 lowercase bg-white/5 px-2 py-1 rounded-md">{expense.paid_by.slice(0,6)}...{expense.paid_by.slice(-4)}</span>
        </span>
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div className="text-right flex flex-col items-end gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans font-bold text-xl tracking-tight text-white">{expense.amount.toFixed(2)}</span>
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">USDC</span>
          </div>
          <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Split {splitCount} ways</span>
        </div>
        {isPayer && onDelete && (
          <button 
            onClick={() => {
              if (window.confirm("Delete this expense? This will recalculate all debts.")) {
                onDelete()
              }
            }}
            className="text-white/20 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10 ml-2 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
