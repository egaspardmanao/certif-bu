import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS  = { success: CheckCircle, error: AlertCircle, info: Info }
const COLORS = {
  success: 'bg-emerald-900/80 border-emerald-700 text-emerald-200',
  error:   'bg-red-900/80 border-red-700 text-red-200',
  info:    'bg-blue-900/80 border-blue-700 text-blue-200',
}

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = ICONS[type] ?? Info
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl max-w-sm animate-fade-in ${COLORS[type]}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'info') => setToast({ message, type })
  const hide = () => setToast(null)
  return { toast, show, hide }
}
